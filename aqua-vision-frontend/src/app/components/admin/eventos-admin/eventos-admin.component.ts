// eventos-admin.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule} from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { AquaEvent, } from '../../../models/aquaEvent';
import { EventTag } from '../../../models/eventTag';
import { ReporteAdminService } from '../../../services/reporteAdmin.service';
import { map } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-eventos-admin',
  standalone: true,
  imports: [CommonModule, NgChartsModule, FormsModule],
  templateUrl: './eventos-admin.component.html',
  styleUrls: ['./eventos-admin.component.css']
})
export class EventosAdminComponent implements OnInit {

  private readonly ZONA_ARG = 'America/Argentina/Buenos_Aires';

  fechaDesde?: string;
  fechaHasta?: string;

  tags: EventTag[] = [];
  selectedTags: { [id: number]: boolean } = {};

  // stats
  totalEventos = 0;
  totalLitros = 0;
  totalCosto = 0;

  // charts
  tagPieData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  eventsByDayData: ChartData<'bar'> = { labels: [], datasets: [] };

  // template-safe chart options
  chartResponsiveOptions: ChartOptions = { responsive: true };

  // lista de eventos en el tipo del modelo
  eventosList: AquaEvent[] = [];
  eventosListSorted: AquaEvent[] = [];

  constructor(private reporteService: ReporteAdminService) {}

  ngOnInit(): void {
    const hoy = new Date();
    const haceMes = new Date();
    haceMes.setMonth(hoy.getMonth() - 1);
    this.fechaDesde = this.formatFechaLocal(haceMes);
    this.fechaHasta = this.formatFechaLocal(hoy);


    this.reporteService.getTags().subscribe(t => {
      // casteo seguro; si tu service ya devuelve el mismo tipo, esto es directo
      this.tags = (t as any) as EventTag[];
      this.tags.forEach(tag => this.selectedTags[tag.id] = true);
      this.aplicarFiltro();
    });
  }

aplicarFiltro(): void {
  const tagIds = Object.keys(this.selectedTags)
    .filter(k => this.selectedTags[+k])
    .map(k => +k);

  // Observables
  const obsEventos = this.reporteService.getEventosFiltro(this.fechaDesde, this.fechaHasta, tagIds)
    .pipe(catchError(err => { console.error('err eventos', err); return of([] as AquaEvent[]); }));

  const obsResumen = this.reporteService.getResumenEventos(this.fechaDesde!, this.fechaHasta!)
    .pipe(catchError(err => { console.error('err resumen', err); return of(null); }));

  const obsRanking = this.reporteService.getRankingTags(this.fechaDesde!, this.fechaHasta!, tagIds)
    .pipe(catchError(err => { console.error('err ranking', err); return of([]); }));

  const obsPorDia = this.reporteService.getEventosPorDia(this.fechaDesde!, this.fechaHasta!)
    .pipe(catchError(err => { console.error('err porDia', err); return of([]); }));

  forkJoin({
    eventos: obsEventos,
    resumen: obsResumen,
    ranking: obsRanking,
    porDia: obsPorDia
  }).subscribe(({ eventos, resumen, ranking, porDia }) => {

    // --- Eventos: mapear fechas a Date para uso interno (si lo necesitás)
    const mapped: AquaEvent[] = (eventos || []).map((e: any) => {
    const fechaInicio = e.fechaInicio ? this.parseFechaLocalISO(String(e.fechaInicio)) ?? new Date(String(e.fechaInicio)) : undefined;
    const fechaFin = e.fechaFin ? this.parseFechaLocalISO(String(e.fechaFin)) ?? new Date(String(e.fechaFin)) : undefined;

      const base = { ...(e as any) } as any;
      base.fechaInicio = fechaInicio;
      base.fechaFin = fechaFin;
      return base as AquaEvent;
    });
    this.eventosList = mapped;

    // ordenar para listado
    this.eventosListSorted = [...this.eventosList].sort((a, b) => {
      const la = Number(a.litrosConsumidos ?? 0);
      const lb = Number(b.litrosConsumidos ?? 0);
      return lb - la;
    }).slice(0, 25);

    // --- Resumen: preferible usar el que trae el backend si existe
    if (resumen) {
      this.totalEventos = resumen.totalEventos ?? this.eventosList.length;
      this.totalLitros = Math.round((resumen.totalLitros ?? this.eventosList.reduce((s,e)=>s+(e.litrosConsumidos||0),0)) * 100) / 100;
      this.totalCosto = Math.round((resumen.totalCosto ?? this.eventosList.reduce((s,e)=>s+(e.costo||0),0)) * 100) / 100;
      // tags activos lo mostramos por get activeTagsCount o si backend devuelve tagsActivos, podés usarlo
    } else {
      this.calcularResumenes();
    }

    // --- Ranking: backend devuelve lista ordenada por count desc con avgLitros
    if (ranking && Array.isArray(ranking)) {
      // adaptá campos según lo que devuelve el backend
      this.rankingTop = ranking.map((r: any) => ({
        nombre: r.nombre,
        count: Number(r.count ?? r.cantidad ?? 0),
        avgLitros: Number(r.avgLitros ?? r.promedioLitros ?? 0)
      })).sort((a,b)=>b.count - a.count).slice(0, 5);
    }

    // --- Chart: eventos por tag (reutiliza la lógica previa para doughnut)
    this.generarCharts(); // continuará calculando tagPieData a partir de this.eventosList y this.tags

    // --- Eventos por día: usar el resultado del backend si viene
    if (porDia && Array.isArray(porDia)) {
      // porDia: [{ fecha: '2025-11-01', count: 3 }, ...]
      const days = porDia.map(d => d.fecha).sort();
      const dayValues = porDia.map(d => d.count);
      const labelsDay = days.map(d => {
        const dt = this.parseFechaLocalISO(d) ?? new Date(d);
        return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
      });

      this.eventsByDayData = {
        labels: labelsDay,
        datasets: [{ data: dayValues, label: 'Eventos por día' }]
      };
    } else {
      // si no vino porDia (fallback): generamos localmente
      this.generarCharts(); // ya tiene lógica para calcular byDay desde eventosList
    }

  }, err => {
    console.error('Error combinando datos reporte eventos:', err);
    // fallback: vaciar o mantener lo anterior
    this.eventosList = [];
    this.eventosListSorted = [];
    this.calcularResumenes();
    this.generarCharts();
  });
}

  calcularResumenes(): void {
    this.totalEventos = this.eventosList.length;
    this.totalLitros = Math.round(this.eventosList.reduce((s, e) => s + (e.litrosConsumidos || 0), 0) * 100) / 100;
    this.totalCosto = Math.round(this.eventosList.reduce((s, e) => s + (e.costo || 0), 0) * 100) / 100;
  }

  generarCharts(): void {
  // Preparar contadores por tag
  const counts: Record<string, number> = {};
  const sumLitros: Record<string, number> = {};
  const colorMap: Record<string, string> = {};

  // Inicializo con los tags conocidos (evita keys indefinidas)
  (this.tags || []).forEach(t => {
    const key = String(t.nombre ?? t.id ?? 'Tag');
    counts[key] = 0;
    sumLitros[key] = 0;
    colorMap[key] = (t as any).color || '#888';
  });

  // Recorro eventos y acumulo por cada tag que tenga el evento
  (this.eventosList || []).forEach(e => {
    const litros = Number(e.litrosConsumidos || 0);
    (e.tags || []).forEach((t: any) => {
      const key = String(t.nombre ?? t.id ?? 'Tag');
      counts[key] = (counts[key] || 0) + 1;
      sumLitros[key] = (sumLitros[key] || 0) + litros;
      if (t.color) colorMap[key] = t.color;
    });
  });

  // Construir datos del doughnut (solo etiquetas con > 0)
  const labels = Object.keys(counts).filter(k => counts[k] > 0);
  const values = labels.map(l => counts[l]);
  const background = labels.map(l => colorMap[l] || '#ccc');

  this.tagPieData = {
    labels,
    datasets: [
      {
        label: 'Eventos por Tag',
        data: values,
        backgroundColor: background,
        // opcionales: borderWidth: 0
      }
    ]
  };

  // Calcular rankingTop (top 5 por cantidad) con promedio de litros
  const ranking = labels.map(l => ({
    nombre: l,
    count: counts[l],
    avgLitros: counts[l] ? (sumLitros[l] / counts[l]) : 0
  }));
  ranking.sort((a, b) => b.count - a.count);
  this.rankingTop = ranking.slice(0, 5);

      // Bar: eventos por día (igual que antes)
      const byDay: Record<string, number> = {};
      (this.eventosList || []).forEach(e => {
    let dayDate: Date | null = null;
    if (e.fechaInicio instanceof Date) {
      dayDate = e.fechaInicio;
    } else {
      dayDate = this.parseFechaLocalISO(String(e.fechaInicio)) ?? (e.fechaInicio ? new Date(String(e.fechaInicio)) : null);
    }
    const day = (dayDate && !isNaN(dayDate.getTime())) ? this.formatFechaLocal(dayDate) : 'unknown';

    byDay[day] = (byDay[day] || 0) + 1;
  });

  const days = Object.keys(byDay).filter(d => d !== 'unknown').sort();
  const dayValues = days.map(d => byDay[d]);
  const labelsDay = days.map(d => {
    const dt = this.parseFechaLocalISO(d) ?? new Date(d);
    return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  });


  this.eventsByDayData = {
    labels: labelsDay,
    datasets: [{ data: dayValues, label: 'Eventos por día' }]
  };
}


  get activeTagsCount(): number {
    return this.tags.filter(t => !!this.selectedTags[t.id]).length;
  }

  /**
   * Devuelve un string legible con la fecha y hora.
   * Acepta string | Date | undefined.
   */
  formatDateTime(value?: string | Date | undefined): string {
    if (!value) return '';
    let d: Date;
    if (value instanceof Date) {
      d = value;
    } else {
      // si es YYYY-MM-DD preferimos parse local
      const asStr = String(value);
      d = this.parseFechaLocalISO(asStr) ?? new Date(asStr);
    }

    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString('es-AR');
  }

  /** Helpers para template (evita optional chaining complejo en el HTML) */
  badgeColor(e: AquaEvent): string {
    try {
      const t0 = (e as any).tags && (e as any).tags[0];
      return t0 && t0.color ? t0.color : '#999';
    } catch {
      return '#999';
    }
  }

  badgeName(e: AquaEvent): string {
    try {
      const t0 = (e as any).tags && (e as any).tags[0];
      return t0 && t0.nombre ? t0.nombre : 'Tag';
    } catch {
      return 'Tag';
    }
  }

  /**
   * Devuelve el identificador del hogar de forma segura:
   * - si existe e.hogarId lo retorna
   * - si existe e.hogar?.id lo retorna
   * - si no, devuelve '—'
   */
  getHogarLabel(e: AquaEvent): string {
    const anyE = e as any;
    if (anyE.hogarId !== undefined && anyE.hogarId !== null) return String(anyE.hogarId);
    if (anyE.hogar && (anyE.hogar.id !== undefined && anyE.hogar.id !== null)) return String(anyE.hogar.id);
    return '—';
  }

exportarExcel(): void {
  if (!this.fechaDesde || !this.fechaHasta) {
    console.warn('Debes seleccionar fechaDesde y fechaHasta');
    return;
  }

  // Usamos los mismos filtros que la pantalla: fechas + tags seleccionados
  const tagIds = Object.keys(this.selectedTags)
    .filter(k => this.selectedTags[+k])
    .map(k => +k);

  this.reporteService.getEventosFiltro(this.fechaDesde, this.fechaHasta, tagIds).subscribe({
    next: (eventos: any[]) => {
      if (!eventos || eventos.length === 0) {
        console.warn('No hay eventos para exportar');
        return;
      }
      // Exporta el JSON crudo (cada objeto -> fila; claves -> columnas)
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(eventos);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Eventos');

      const wbout: ArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const filename = `reporte_eventos_admin_${this.fechaDesde}_a_${this.fechaHasta}.xlsx`;
      saveAs(blob, filename);
    },
    error: (err) => {
      console.error('Error obteniendo eventos para exportar', err);
    }
  });
}
exportarPDF(): void {
  if (!this.fechaDesde || !this.fechaHasta) {
    console.warn('Debes seleccionar fechaDesde y fechaHasta');
    return;
  }
  const tagIds = Object.keys(this.selectedTags)
    .filter(k => this.selectedTags[+k])
    .map(k => +k);
  this.reporteService.descargarReporteEventosPDF(this.fechaDesde, this.fechaHasta, tagIds);
}

  toggleTag(id: number): void {
    this.selectedTags[id] = !this.selectedTags[id];
    this.aplicarFiltro();
  }

  showRanking = false;
rankingTop: Array<{ nombre: string; count: number; avgLitros: number }> = [];

// Método: atajos de fecha
setAtajo(rango: '7d' | '1m' | '3m' | '6m'): void {
  const hoy = new Date();
  const desde = new Date(hoy); // copio la fecha para evitar mutaciones

  switch (rango) {
    case '7d':
      desde.setDate(hoy.getDate() - 6);
      break;
    case '1m':
      desde.setMonth(hoy.getMonth() - 1);
      break;
    case '3m':
      desde.setMonth(hoy.getMonth() - 3);
      break;
    case '6m':
      desde.setMonth(hoy.getMonth() - 6);
      break;
  }

  this.fechaDesde = this.formatFechaLocal(desde);
  this.fechaHasta = this.formatFechaLocal(hoy);
  this.aplicarFiltro();
}

formatFechaLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

private parseFechaLocalISO(fechaIso?: string | null): Date | null {
  if (!fechaIso) return null;

  const onlyDateMatch = /^\d{4}-\d{2}-\d{2}$/.test(fechaIso);
  if (onlyDateMatch) {
    const parts = fechaIso.split('-');
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    if ([y, m, d].some(Number.isNaN)) return null;
    return new Date(y, m, d);
  }

  const parsed = new Date(fechaIso);
  return isNaN(parsed.getTime()) ? null : parsed;
}


// Método: toggle modal ranking
toggleRanking(): void {
  this.showRanking = !this.showRanking;
}

// Ajuste en generarCharts(): asegúrate de calcular rankingTop después de contar
// (si ya tienes generarCharts(), solo sustituye la parte de cálculo de ranking por esto)
private calcularRankingTop(counts: Record<string, number>, sumLitros: Record<string, number>) {
  const labels = Object.keys(counts).filter(k => counts[k] > 0);
  const ranking = labels.map(l => ({
    nombre: l,
    count: counts[l],
    avgLitros: counts[l] ? (sumLitros[l] / counts[l]) : 0
  }));
  ranking.sort((a, b) => b.count - a.count);
  this.rankingTop = ranking.slice(0, 5);
}
}