import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AquaEvent } from '../../../models/aquaEvent';
import { EventTag } from '../../../models/eventTag';
import { Sector } from '../../../models/sector';
import { EventService } from '../../../services/event.service';
import { HomeService } from '../../../services/home.service';
import { TagService } from '../../../services/tag.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.css']
})
export class EventFormComponent implements OnInit {

  @Output() eventCreated = new EventEmitter<AquaEvent>();

   mapEstado: Record<string, string> = {
  'Pendiente': 'PENDIENTE',
  'En proceso': 'EN_PROCESO',
  'Cancelado': 'CANCELADO',
  'Finalizado': 'FINALIZADO'
};

  newEvent: Partial<AquaEvent> = {
    titulo: '',
    descripcion: '',
    estado: 'Pendiente',
    tags: [],
    sector: undefined
  };

  availableTags: EventTag[] = [];
  tagToAdd: EventTag | null = null;

  sectors: Sector[] = [];

  constructor(
    private eventService: EventService,
    private homeService: HomeService,
    private tagService: TagService,
    private router: Router
  ) {}

  

  ngOnInit(): void {
    const homeId = this.homeService.getHomeId();
    if (homeId !== null) {
      this.homeService.getSectorsByHomeId(homeId).subscribe({
        next: (sectores) => {
          this.sectors = sectores;
        },
        error: (err) => console.error('Error obteniendo sectores', err)
      });
    }


    this.tagService.getTags().subscribe({
      next: (tags) => {
        this.availableTags = tags;
      },
      error: (err) => console.error('Error obteniendo tags', err)
    });
  }



  addTagToEvent() {
    if (this.tagToAdd && !this.newEvent.tags?.find(t => t.nombre === this.tagToAdd!.nombre)) {
      this.newEvent.tags?.push(this.tagToAdd);
    }
    this.tagToAdd = null;
  }

  removeTag(tag: EventTag) {
    if (this.newEvent.tags) {
      this.newEvent.tags = this.newEvent.tags.filter(t => t.nombre !== tag.nombre);
    }
  }

  createEvent() {
    if (!this.newEvent.titulo || !this.newEvent.descripcion || !this.newEvent.sector) {
      alert('Por favor completa todos los campos obligatorios.');
      this.router.navigate(['/events']); 
    }

const eventToSave: AquaEvent = {
  titulo: this.newEvent.titulo!,
  descripcion: this.newEvent.descripcion!,
  estado: this.mapEstado[this.newEvent.estado!],
  tags: this.newEvent.tags || [],
  sector: this.newEvent.sector!,
};

    this.eventService.createEvent(eventToSave).subscribe({
      next: (savedEvent) => {
        this.eventCreated.emit(savedEvent);
        this.resetForm();
        this.router.navigate(['/events']); 
      },
      error: (err) => {
        console.error('Error creando evento', err);
        alert('Hubo un problema al crear el evento.');
      }
    });

  }

  resetForm() {
    this.newEvent = {
      titulo: '',
      descripcion: '',
      estado: 'Pendiente',
      tags: [],
      sector: undefined
    };
  }

}
