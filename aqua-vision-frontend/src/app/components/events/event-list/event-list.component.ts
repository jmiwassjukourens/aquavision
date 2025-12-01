import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AquaEvent } from '../../../models/aquaEvent';
import { EventTag } from '../../../models/eventTag';
import { EventService } from '../../../services/event.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../utils/confirm-dialog';
import annotationPlugin from 'chartjs-plugin-annotation';



@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css']
})
export class EventListComponent implements OnInit {
  events: AquaEvent[] = [];

  @Output() onDelete = new EventEmitter<number>();
  @Output() onEdit = new EventEmitter<number>();

  selectedTags: EventTag[] = [];
  tagToAdd: EventTag | null = null;
  selectedStatus: string = '';
  sortOrder: 'asc' | 'desc' = 'asc';

  mapEstado: Record<string, string> = {
    'Pendiente': 'PENDIENTE',
    'En proceso': 'EN_PROCESO',
    'Cancelado': 'CANCELADO',
    'Finalizado': 'FINALIZADO'
  };

  mapEstadoDisplay: Record<string, string> = Object.fromEntries(
    Object.entries(this.mapEstado).map(([k, v]) => [v, k])
  );

  constructor(
    private eventService: EventService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents() {
    this.eventService.getEvents().subscribe(events => {
      this.events = events;
    });
  }

  get availableTags(): EventTag[] {
    const tagMap = new Map<string, EventTag>();
    this.events.forEach(event => {
      event.tags.forEach(tag => tagMap.set(tag.nombre, tag));
    });
    return Array.from(tagMap.values());
  }

  get availableStatuses(): string[] {
    return Array.from(new Set(this.events.map(e => e.estado)));
  }

  get filteredEvents(): AquaEvent[] {
    let filtered = [...this.events];

    if (this.selectedTags.length > 0) {
      filtered = filtered.filter(event =>
        this.selectedTags.every(selectedTag =>
          event.tags.some(tag => tag.nombre === selectedTag.nombre)
        )
      );
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(event => event.estado === this.selectedStatus);
    }

    filtered.sort((a, b) => {
      const dateA = a.fechaInicio ? new Date(a.fechaInicio).getTime() : 0;
      const dateB = b.fechaInicio ? new Date(b.fechaInicio).getTime() : 0;
      return this.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }

  addTagToSelection() {
    if (this.tagToAdd && !this.selectedTags.find(t => t.nombre === this.tagToAdd!.nombre)) {
      this.selectedTags.push(this.tagToAdd);
    }
    this.tagToAdd = null;
  }

  removeTag(tag: EventTag) {
    this.selectedTags = this.selectedTags.filter(t => t.nombre !== tag.nombre);
  }

  clearFilter() {
    this.selectedTags = [];
    this.selectedStatus = '';
  }

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
  }

  editEvent(id: number) {
    this.router.navigate(['/events/edit', id]); 
  }

  deleteEvent(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Eliminar evento',
        message: '¿Estás seguro de que deseas eliminar este evento?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eventService.deleteEvent(id).subscribe(() => {
          this.snackBar.open('Evento eliminado correctamente ✅', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.loadEvents();
          this.onDelete.emit(id);
        });
      }
    });
  }

  getStatusColor(status: string): string {
    const displayStatus = this.mapEstadoDisplay[status] || status;
    switch (displayStatus) {
      case 'En proceso': return '#f39c12';
      case 'Finalizado': return '#27ae60';
      case 'Pendiente':  return '#2980b9';
      case 'Cancelado':  return '#c0392b';
      default: return '#7f8c8d';
    }
  }

  startEvent(event: AquaEvent) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Comenzar evento',
        message: '¿Seguro que deseas comenzar este evento?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        event.estado = 'EN_PROCESO';
        this.eventService.updateEvent(event).subscribe(() => {
          this.snackBar.open('Evento iniciado 🚀', 'Cerrar', { duration: 3000 });
          this.loadEvents();
        });
      }
    });
  }

  finalizeEvent(event: AquaEvent) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Finalizar evento',
        message: '¿Seguro que deseas finalizar este proceso?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        event.estado = 'FINALIZADO';

        this.eventService.updateEvent(event).subscribe(() => {
          this.snackBar.open('Evento finalizado ✅', 'Cerrar', { duration: 3000 });
          this.loadEvents();
        });
      }
    });
  }

  getSectorName(event: AquaEvent): string {
    return event.sector ? event.sector.nombre : 'Sin sector';
  }
}