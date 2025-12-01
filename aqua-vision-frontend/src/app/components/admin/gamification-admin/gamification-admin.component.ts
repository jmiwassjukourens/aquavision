// gamificacion-admin.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { ReporteAdminService } from '../../../services/reporteAdmin.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';



interface PuntosDia { fecha: string; puntos: number; }
interface HogarRanking { id?: number; nombre: string; puntos: number; puntaje_ranking: number; racha: number; }

@Component({
  selector: 'app-gamificacion-admin',
  standalone: true,
  imports: [CommonModule, NgChartsModule, FormsModule],
  templateUrl: './gamification-admin.component.html',
  styleUrls: ['./gamification-admin.component.css']
})
export class GamificacionAdminComponent implements OnInit {

  fechaDesde?: string;
  fechaHasta?: string;

  // resumen
  totalHogares = 0;
  totalPuntos = 0;
  mediaDiaria = 0;
  mejorRacha = 0;

  // charts
  pointsByDayData: ChartData<'bar'> = { labels: [], datasets: [] };
  pointsByMonthData: ChartData<'line'> = { labels: [], datasets: [] };

  // chart options (separados para personalizar estilo)
  pointsByDayOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 14 } },
      y: { beginAtZero: true, title: { display: true, text: 'Puntos' } }
    }
  };

  pointsByMonthOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { ticks: { autoSkip: true } },
      y: { beginAtZero: true, title: { display: true, text: 'Puntos' } }
    }
  };

  // listas / rankings
  hogaresList: HogarRanking[] = [];
  rankingFullPoints: HogarRanking[] = [];
  rankingFullRachas: HogarRanking[] = [];

  // modales
  showRankingPoints = false;
  showRankingRachas = false;
  showMedalModal = false;
  selectedHogarMedals: string[] = [];
  selectedHogarName = '';

  constructor(private reporteAdminService: ReporteAdminService) {}

  ngOnInit(): void {
    const hoy = new Date();
    const haceMes = new Date(hoy);
    haceMes.setMonth(hoy.getMonth() - 1);

    this.fechaDesde = this.formatFechaLocal(haceMes);
    this.fechaHasta = this.formatFechaLocal(hoy);


    this.aplicarFiltro();
  }

  aplicarFiltro(): void {
    if (!this.fechaDesde || !this.fechaHasta) return;

    forkJoin({
      puntosPeriodo: this.reporteAdminService.getPuntosPorPeriodo(this.fechaDesde, this.fechaHasta).pipe(catchError(() => of([] as PuntosDia[]))),
      resumen: this.reporteAdminService.getResumenGamificacion(this.fechaDesde, this.fechaHasta).pipe(catchError(() => of({ total:0, media:0, mejorRacha:0 }))),
      rankingPoints: this.reporteAdminService.getRankingPuntos(this.fechaDesde, this.fechaHasta).pipe(catchError(() => of([]))),
      rankingRachas: this.reporteAdminService.getRankingRachas(this.fechaDesde, this.fechaHasta).pipe(catchError(() => of([]))),
      hogares: this.reporteAdminService.getHogares().pipe(catchError(() => of([])))
    }).subscribe(({ puntosPeriodo, resumen, rankingPoints, rankingRachas, hogares }) => {
      // resumen
      this.totalHogares = (hogares || []).length;
      this.totalPuntos = resumen.total || 0;
      this.mediaDiaria = resumen.media || 0;
      this.mejorRacha = resumen.mejorRacha || 0;

      // charts
      this.buildPointsByDayChart(puntosPeriodo || []);
      this.buildPointsByMonthChart(puntosPeriodo || []);

      // rankings (aseguro tipado)
      this.rankingFullPoints = (rankingPoints || []).map((r: any, idx: number) => ({
        id: r.id ?? idx,
        nombre: r.nombre ?? `Hogar ${idx+1}`,
        puntos: Number(r.puntos || 0),
        puntaje_ranking: Number(r.puntaje_ranking || 0),
        racha: Number((r as any).racha || 0)
      })).sort((a,b) => b.puntos - a.puntos);

      this.rankingFullRachas = (rankingRachas || []).map((r: any, idx: number) => ({
        id: r.id ?? idx,
        nombre: r.nombre ?? `Hogar ${idx+1}`,
        puntos: Number(r.puntos || 0),
        puntaje_ranking: Number(r.puntaje_ranking || 0),
        racha: Number(r.racha || 0)
      })).sort((a,b) => b.racha - a.racha);

      // hogaresList opcional (puede usarse si necesitás listado quick)
      this.hogaresList = (hogares || []).map((h: any, i: number) => ({
        id: h.id ?? i,
        nombre: h.nombre ?? `Hogar ${i+1}`,
        puntos: Number(h.puntos || 0),
        puntaje_ranking: Number(h.puntaje_ranking || 0),
        racha: Number(h.rachaDiaria || h.racha || 0)
      })).sort((a,b) => b.puntos - a.puntos);

    }, err => {
      console.error('Error cargando gamificación', err);
    });
  }

  buildPointsByDayChart(data: PuntosDia[]): void {
    const byDay: Record<string, number> = {};
    (data || []).forEach(d => {
      const parsed = this.parseFechaLocalISO((d.fecha || '').substring(0,10));
      const dayKey = parsed && !isNaN(parsed.getTime()) ? this.formatFechaLocal(parsed) : (d.fecha || '').substring(0,10);

      if (!byDay[dayKey]) byDay[dayKey] = 0;
      byDay[dayKey] += Number(d.puntos || 0);
    });

    const days = Object.keys(byDay).sort();
    const values = days.map(d => byDay[d]);

    // paleta profesional (azul -> teal)
    const bg = days.map(() => 'rgba(37,99,235,0.85)'); // barra principal
    const border = days.map(() => 'rgba(8,29,74,0.95)');

this.pointsByDayData = {
  labels: days.map(d => {
    const dt = this.parseFechaLocalISO(d);
    return (dt && !isNaN(dt.getTime()))
      ? dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
      : String(d);
  }),
      datasets: [{
        label: 'Puntos por día',
        data: values,
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1,
        maxBarThickness: 44,
        barThickness: 'flex'
      }]
    };
  }

  buildPointsByMonthChart(data: PuntosDia[]): void {
    const byMonth: Record<string, number> = {};
    (data || []).forEach(d => {
    const dt = this.parseFechaLocalISO(d.fecha);
    if (!dt || isNaN(dt.getTime())) return;
    const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;

      byMonth[key] = (byMonth[key] || 0) + Number(d.puntos || 0);
    });

    const months = Object.keys(byMonth).sort();
    const values = months.map(m => byMonth[m]);

    this.pointsByMonthData = {
      labels: months.map(m => {
        const [y, mm] = m.split('-');
        const monthIdx = Number(mm) - 1;
        return new Date(Number(y), monthIdx, 1).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
      }),
      datasets: [{
        label: 'Puntos por mes',
        data: values,
        fill: true,
        tension: 0.32,
        borderColor: 'rgba(6,182,212,0.95)',
        backgroundColor: 'rgba(6,182,212,0.12)',
        pointBackgroundColor: 'rgba(6,182,212,1)',
        pointRadius: 4,
        borderWidth: 2
      }]
    };
  }

  // atajos
  setAtajo(rango: '7d' | '1m' | '3m' | '6m'): void {
    const hoy = new Date();
    const desde = new Date(hoy);
    switch (rango) {
      case '7d': desde.setDate(hoy.getDate() - 6); break;
      case '1m': desde.setMonth(hoy.getMonth() - 1); break;
      case '3m': desde.setMonth(hoy.getMonth() - 3); break;
      case '6m': desde.setMonth(hoy.getMonth() - 6); break;
    }
    this.fechaDesde = this.formatFechaLocal(desde);
    this.fechaHasta = this.formatFechaLocal(new Date());

    this.aplicarFiltro();
  }

exportarPDF(): void {
  if (!this.fechaDesde || !this.fechaHasta) {
    console.warn('Debes seleccionar fechaDesde y fechaHasta');
    return;
  }
  // llama al método existente del service que abre el PDF en una nueva pestaña
  this.reporteAdminService.descargarReporteGamificacionPDF(this.fechaDesde, this.fechaHasta);
}

exportarExcel(): void {
  if (!this.fechaDesde || !this.fechaHasta) {
    console.warn('Debes seleccionar fechaDesde y fechaHasta');
    return;
  }

  // Solicito todos los datos necesarios en paralelo
  forkJoin({
    puntosPeriodo: this.reporteAdminService.getPuntosPorPeriodo(this.fechaDesde, this.fechaHasta).pipe(catchError(() => of([]))),
    resumen: this.reporteAdminService.getResumenGamificacion(this.fechaDesde, this.fechaHasta).pipe(catchError(() => of({ total: 0, media: 0, mejorRacha: 0 }))),
    rankingPoints: this.reporteAdminService.getRankingPuntos(this.fechaDesde, this.fechaHasta).pipe(catchError(() => of([]))),
    rankingRachas: this.reporteAdminService.getRankingRachas(this.fechaDesde, this.fechaHasta).pipe(catchError(() => of([]))),
    hogares: this.reporteAdminService.getHogares().pipe(catchError(() => of([])))
  }).subscribe({
    next: ({ puntosPeriodo, resumen, rankingPoints, rankingRachas, hogares }) => {
      // Compruebo datos
      const anyEmpty = !puntosPeriodo && !resumen && !rankingPoints && !rankingRachas && !hogares;
      if (anyEmpty) {
        console.warn('No hay datos para exportar');
        return;
      }

      // Creamos el workbook con varias hojas:
      const wb = XLSX.utils.book_new();

      // Hoja: puntos por periodo (array de {fecha, puntos})
      if (puntosPeriodo && (puntosPeriodo as any[]).length) {
        const wsPuntos = XLSX.utils.json_to_sheet(puntosPeriodo);
        XLSX.utils.book_append_sheet(wb, wsPuntos, 'PuntosPorDia');
      } else {
        // hoja vacía con fila explicativa
        const ws = XLSX.utils.json_to_sheet([{ info: 'No hay puntos en el periodo' }]);
        XLSX.utils.book_append_sheet(wb, ws, 'PuntosPorDia');
      }

      // Hoja: resumen (objeto -> fila única)
      const resumenRow = [{ total: resumen.total ?? 0, media: resumen.media ?? 0, mejorRacha: resumen.mejorRacha ?? 0 }];
      const wsResumen = XLSX.utils.json_to_sheet(resumenRow);
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

      // Hoja: ranking puntos
      if (rankingPoints && (rankingPoints as any[]).length) {
        const wsRankPts = XLSX.utils.json_to_sheet(rankingPoints);
        XLSX.utils.book_append_sheet(wb, wsRankPts, 'RankingPuntos');
      } else {
        const ws = XLSX.utils.json_to_sheet([{ info: 'No hay ranking de puntos' }]);
        XLSX.utils.book_append_sheet(wb, ws, 'RankingPuntos');
      }

      // Hoja: ranking rachas
      if (rankingRachas && (rankingRachas as any[]).length) {
        const wsRankR = XLSX.utils.json_to_sheet(rankingRachas);
        XLSX.utils.book_append_sheet(wb, wsRankR, 'RankingRachas');
      } else {
        const ws = XLSX.utils.json_to_sheet([{ info: 'No hay ranking de rachas' }]);
        XLSX.utils.book_append_sheet(wb, ws, 'RankingRachas');
      }

      // Hoja: hogares (lista cruda)
      if (hogares && (hogares as any[]).length) {
        const wsHogares = XLSX.utils.json_to_sheet(hogares);
        XLSX.utils.book_append_sheet(wb, wsHogares, 'Hogares');
      } else {
        const ws = XLSX.utils.json_to_sheet([{ info: 'No hay hogares' }]);
        XLSX.utils.book_append_sheet(wb, ws, 'Hogares');
      }

      // Generar buffer y disparar descarga (sin formato, JSON crudo en cada hoja)
      const wbout: ArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const filename = `reporte_gamificacion_${this.fechaDesde}_a_${this.fechaHasta}.xlsx`;
      saveAs(blob, filename);
    },
    error: (err) => {
      console.error('Error al generar XLSX de gamificación', err);
    }
  });
}


  toggleRankingPoints(): void { this.showRankingPoints = !this.showRankingPoints; }
  toggleRankingRachas(): void { this.showRankingRachas = !this.showRankingRachas; }

  // --- Medallas: abre modal y solicita medallas al service ---
  openMedallas(hogarId?: number, hogarNombre?: string): void {
    if (!hogarId && hogarId !== 0) {
      // si no hay id, sólo mostrar nombre
      this.selectedHogarName = hogarNombre ?? 'Hogar';
      this.selectedHogarMedals = [];
      this.showMedalModal = true;
      return;
    }

    this.selectedHogarName = hogarNombre ?? 'Hogar';

    (this.reporteAdminService.getMedallasPorHogar ? this.reporteAdminService.getMedallasPorHogar(hogarId) : of([]))
      .pipe(catchError(() => of([])))
      .subscribe((meds: string[]) => {
        this.selectedHogarMedals = meds || [];
        this.showMedalModal = true;
      }, err => {
        console.error('Error al obtener medallas', err);
        this.selectedHogarMedals = [];
        this.showMedalModal = true;
      });
  }

  closeMedalModal(): void {
    this.showMedalModal = false;
    this.selectedHogarMedals = [];
    this.selectedHogarName = '';
  }

  private formatFechaLocal(d: Date): string {

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

private parseFechaLocalISO(fechaIso?: string | null): Date | null {
  if (!fechaIso) return null;
  const s = String(fechaIso).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const parts = s.split('-');
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    if ([y, m, d].some(Number.isNaN)) return null;
    return new Date(y, m, d);
  }

  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}

  
}