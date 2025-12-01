import { Component, Inject,OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';


import { FormsModule } from '@angular/forms';

import { EventService } from '../../../../services/event.service';
import { TagService } from '../../../../services/tag.service';
import {  EventTag } from '../../../../models/eventTag';
import { AquaEvent } from '../../../../models/aquaEvent';
import {  Sector } from '../../../../models/sector';

@Component({
  selector: 'app-event-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule],
  template: `
<h2 mat-dialog-title>Crear evento rápido</h2>

<mat-dialog-content class="dialog-content">

  <!-- Rango horario -->
  <div class="time-section">
    <div class="time-inputs">
      <div class="time-input">
        <label>Inicio:</label>
        <input type="time" [(ngModel)]="start" />
      </div>
      <div class="time-input">
        <label>Fin:</label>
        <input type="time" [(ngModel)]="end" />
      </div>
    </div>

    <div class="adjust-buttons-container">
      <!-- Ajuste de inicio -->
      <div class="adjust-group">
        <label>Atajo inicio:</label>
        <button mat-stroked-button color="primary" (click)="ajustarTiempo('start', -5)">-5 min</button>
        <button mat-stroked-button color="primary" (click)="ajustarTiempo('start', 5)">+5 min</button>
      </div>

      <!-- Ajuste de fin -->
      <div class="adjust-group">
        <label>Atajo fin:</label>
        <button mat-stroked-button color="primary" (click)="ajustarTiempo('end', -5)">-5 min</button>
        <button mat-stroked-button color="primary" (click)="ajustarTiempo('end', 5)">+5 min</button>
      </div>
    </div>
  </div>

  <!-- Tags -->
  <div class="tags-section">
    <label>Tags:</label>
    <select [(ngModel)]="tagToAdd" (change)="addTag()">
      <option [ngValue]="null" disabled selected>Selecciona un tag</option>
      <option *ngFor="let t of availableTags" [ngValue]="t">{{ t.nombre }}</option>
    </select>

    <div class="selected-tags">
      <span *ngFor="let t of selectedTags" class="tag-chip" [style.background-color]="t.color">
        {{ t.nombre }} <span class="remove" (click)="removeTag(t)">×</span>
      </span>
    </div>
  </div>

</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button (click)="cancel()">Cancelar</button>
  <button mat-raised-button color="primary" (click)="confirm()">Crear</button>
</mat-dialog-actions>


  `,
  styleUrls: ['./event-dialog.component.css']
})
export class EventDialogComponent implements OnInit {
      start: string;
      end: string;
      litrosConsumidos: number;
      costo: number;
      sector: Sector; 

      availableTags: EventTag[] = [];
      selectedTags: EventTag[] = [];
      tagToAdd: EventTag | null = null;

      constructor(
        public dialogRef: MatDialogRef<EventDialogComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: { start: string; end: string; litros: number; costo: number; sector: any },
        private tagService: TagService,
        private eventService: EventService
      ) {
        this.start = data.start;
        this.end = data.end;
        this.litrosConsumidos = data.litros;
        this.costo = data.costo;
        this.sector = data.sector;
      }

  ngOnInit(): void {
    this.tagService.getTags().subscribe({
      next: tags => (this.availableTags = tags),
      error: err => console.error('Error cargando tags', err)
    });
  }

  ajustarTiempo(cota: 'start' | 'end', minutos: number) {
    const [h, m] = (cota === 'start' ? this.start : this.end).split(':').map(Number);
    const fecha = new Date();
    fecha.setHours(h, m, 0, 0);

    fecha.setMinutes(fecha.getMinutes() + minutos);

    const nuevaHora = `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;

    if (cota === 'start') {
      this.start = nuevaHora;
    } else {
      this.end = nuevaHora;
    }
  }

  addTag() {
    if (this.tagToAdd && !this.selectedTags.find(t => t.nombre === this.tagToAdd!.nombre)) {
      this.selectedTags.push(this.tagToAdd);
    }
    this.tagToAdd = null;
  }

  removeTag(tag: EventTag) {
    this.selectedTags = this.selectedTags.filter(t => t.nombre !== tag.nombre);
  }

confirm() {
  const today = new Date();
  const [startHour, startMin] = this.start.split(':').map(Number);
  const [endHour, endMin] = this.end.split(':').map(Number);
  const fechaInicio = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    startHour,
    startMin,
    0,
    0
  );

  const fechaFin = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    endHour,
    endMin,
    0,
    0
  );

  fechaInicio.setMinutes(fechaInicio.getMinutes() - fechaInicio.getTimezoneOffset());
  fechaFin.setMinutes(fechaFin.getMinutes() - fechaFin.getTimezoneOffset());

  const tagPrincipal = this.selectedTags.length > 0 ? this.selectedTags[0] : null;
  const nombreTag = tagPrincipal ? tagPrincipal.nombre : 'evento rápido';


  const eventToSave: Partial<AquaEvent> = {
    titulo: `Evento de ${nombreTag}`,
    descripcion: `De ${this.start} a ${this.end} hs — Creado desde gráfico.`,
    tags: this.selectedTags,
    estado: 'FINALIZADO',
    fechaInicio,
    fechaFin,
    litrosConsumidos: this.litrosConsumidos,
    costo: this.costo,
    sector: this.sector
  };
  this.eventService.createEvent(eventToSave as AquaEvent).subscribe({
    next: savedEvent => {
      console.log('✅ Evento rápido creado:', savedEvent);
      this.dialogRef.close(savedEvent);
    },
    error: err => {
      console.error('Error creando evento rápido', err);
      this.dialogRef.close(false);
    }
  });
}

cancel() { this.dialogRef.close(false); }

}
