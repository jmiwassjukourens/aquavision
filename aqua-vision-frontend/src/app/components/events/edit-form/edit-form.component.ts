import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EventService } from '../../../services/event.service';
import { AquaEvent } from '../../../models/aquaEvent';
import { EventTag } from '../../../models/eventTag';
import { Sector } from '../../../models/sector';
import { TagService } from '../../../services/tag.service';
import { HomeService } from '../../../services/home.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-edit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  templateUrl: './edit-form.component.html',
  styleUrls: ['./edit-form.component.css']
})
export class EditFormComponent implements OnInit {
  eventId!: number;
  eventData: AquaEvent = {
    id: 0,
    titulo: '',
    descripcion: '',
    estado: 'Pendiente',
    fechaInicio: new Date(),
    fechaFin: null,
    litrosConsumidos: 0,
    costo: 0,
    sector: { id: 0, nombre: '' },
    tags: []
  };

  availableStatuses: string[] = ['Pendiente', 'En proceso', 'Finalizado', 'Cancelado'];
  availableTags: EventTag[] = [];
  availableSectors: Sector[] = [];

  mapEstado: Record<string, string> = {
    'Pendiente': 'PENDIENTE',
    'En proceso': 'EN_PROCESO',
    'Cancelado': 'CANCELADO',
    'Finalizado': 'FINALIZADO'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private tagService: TagService,
    private homeService: HomeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const homeId = this.homeService.getHomeId();

    if (homeId !== null) {
      this.homeService.getSectorsByHomeId(homeId).subscribe({
        next: (sectores) => {
          this.availableSectors = sectores;
        },
        error: (err) => console.error('Error obteniendo sectores', err)
      });
    }

    this.tagService.getTags().subscribe({
      next: (tags) => (this.availableTags = tags),
      error: (err) => console.error('Error obteniendo tags', err)
    });

    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.eventId) {
      this.eventService.getEventById(this.eventId).subscribe((event) => {
        if (event) {
          this.eventData = { ...event };
        }
      });
    }
  }

  toggleTag(tag: EventTag) {
    const exists = this.eventData.tags.some((t) => t.nombre === tag.nombre);
    if (exists) {
      this.eventData.tags = this.eventData.tags.filter((t) => t.nombre !== tag.nombre);
    } else {
      this.eventData.tags.push(tag);
    }
  }

  saveChanges() {
    const payload = {
      ...this.eventData,
      estado: this.mapEstado[this.eventData.estado]
    };

    this.eventService.updateEvent(payload).subscribe({
      next: () => {
        this.snackBar.open('✅ Evento actualizado correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/events']);
      },
      error: () => {
        this.snackBar.open('❌ Error al actualizar el evento', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  cancel() {
    this.router.navigate(['/events']);
  }

  isTagSelected(tag: EventTag): boolean {
    return this.eventData?.tags?.some((t) => t.nombre === tag.nombre) ?? false;
  }
}
