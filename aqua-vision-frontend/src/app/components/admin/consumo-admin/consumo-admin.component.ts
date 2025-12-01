// consumo-admin.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { ReporteAdminService } from '../../../services/reporteAdmin.service';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';



@Component({
  selector: 'app-consumo-admin',
  standalone: true,
  imports: [CommonModule, NgChartsModule, FormsModule],
  templateUrl: './consumo-admin.component.html',
  styleUrls: ['./consumo-admin.component.css']
})
export class ConsumoAdminComponent implements OnInit {

  fechaDesde?: string;
  fechaHasta?: string;

  resumen: { total: number, media: number, pico: number, costo: number } = { total: 0, media: 0, pico: 0, costo: 0 };

  // chart (barras sólo consumo)
  chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        ticks: { maxRotation: 0, autoSkip: true },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Litros' },
        ticks: { precision: 0 }
      }
    }
  };

  loading = false;
  sinDatos = false;

  // Top meses modal + data
  showTopMeses = false;
  rankingTopMeses: Array<{ mesLabel: string; mes: number; total: number; media: number }> = [];
  maxMonthTotal = 0;

  // propiedad para usar en el template
  currentYear = new Date().getFullYear();

  constructor(private reporteService: ReporteAdminService) { }

  ngOnInit(): void {
    const hoy = new Date();
    const haceMes = new Date();
    haceMes.setMonth(hoy.getMonth() - 1);

    this.fechaDesde = this.formatFechaLocal(haceMes);
    this.fechaHasta = this.formatFechaLocal(hoy);

    this.aplicarFiltro();
  }

private formatFechaLocal(d: Date): string {

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

private parseFechaLocalISO(fechaIso: string): Date | null {
  if (!fechaIso) return null;
  const parts = fechaIso.split('-');
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1; // monthIndex
  const d = Number(parts[2]);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  return new Date(y, m, d); // construye en local, sin shift por UTC
}



  setAtajo(r: '7d' | '1m' | '3m'): void {
    const hoy = new Date();
    const desde = new Date(hoy);
    if (r === '7d') desde.setDate(hoy.getDate() - 6);
    if (r === '1m') desde.setMonth(hoy.getMonth() - 1);
    if (r === '3m') desde.setMonth(hoy.getMonth() - 3);
    this.fechaDesde = this.formatFechaLocal(desde);
    this.fechaHasta = this.formatFechaLocal(hoy);
    this.aplicarFiltro();
  }

  // Genera un chartData tipo 'bar' solo con consumo (sin costo)
  generarGrafico(data: { fecha: string, totalLitros: number, costo?: number }[]): void {
    const labels = (data || []).map(d => {
      const dt = this.parseFechaLocalISO(d.fecha) ?? new Date(d.fecha);
      return isNaN(dt.getTime()) ? String(d.fecha) : dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    });


    const valores = (data || []).map(d => Math.round((d.totalLitros || 0) * 100) / 100);

    // colores: gradiente ligero por barra
    const background = valores.map((_, i) => `rgba(3,102,194,${0.18 + Math.min(0.62, i * 0.02)})`);
    const border = valores.map((_, i) => `rgba(3,102,194,${0.85 - Math.min(0.5, i * 0.01)})`);

    this.chartData = {
      labels,
      datasets: [
        {
          label: 'Litros',
          data: valores,
          backgroundColor: background,
          borderColor: border,
          borderWidth: 1,
          maxBarThickness: 60,    // barras más anchas
          minBarLength: 6
        }
      ]
    };

    this.chartOptions = {
      ...this.chartOptions,
      scales: {
        x: { ticks: { maxRotation: 0, autoSkip: true }, grid: { display: false } },
        y: { beginAtZero: true, title: { display: true, text: 'Litros' } }
      }
    };
  }

exportarExcel(): void {
  if (!this.fechaDesde || !this.fechaHasta) {
    console.warn('Debes seleccionar fechaDesde y fechaHasta');
    return;
  }

  // Pedimos los datos crudos que usa la pantalla (mismo endpoint que genera el gráfico)
  this.reporteService.getConsumoGlobalPorPeriodo(this.fechaDesde, this.fechaHasta).subscribe({
    next: (periodo: any[]) => {
      if (!periodo || periodo.length === 0) {
        console.warn('No hay datos para exportar');
        return;
      }
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(periodo);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Periodo');

      const wbout: ArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const filename = `reporte_consumo_admin_${this.fechaDesde}_a_${this.fechaHasta}.xlsx`;
      saveAs(blob, filename);
    },
    error: (err) => {
      console.error('Error al obtener datos para exportar XLSX', err);
    }
  });
}

  exportarPDF(): void {
    if (!this.fechaDesde || !this.fechaHasta) {
      console.warn('Debes seleccionar fechaDesde y fechaHasta');
      return;
    }

    this.reporteService.descargarReporteConsumoPDF(this.fechaDesde, this.fechaHasta);
  }

  // Data loader: trae periodo y resumen; calcula gráfico y ranking por meses (año actual)
  aplicarFiltro(): void {
    if (!this.fechaDesde || !this.fechaHasta) return;
    this.loading = true;

    // ahora solo traemos periodo y resumen (sin porLocalidad)
    forkJoin({
      periodo: this.reporteService.getConsumoGlobalPorPeriodo(this.fechaDesde, this.fechaHasta),
      resumen: this.reporteService.getResumenConsumoGlobal(this.fechaDesde, this.fechaHasta)
    }).subscribe(({ periodo, resumen }: any) => {
      this.loading = false;
      this.resumen = resumen || { total: 0, media: 0, pico: 0, costo: 0 };
      this.sinDatos = !periodo || periodo.length === 0 || periodo.every((p: any) => (p.totalLitros || 0) === 0);

      // Genero el gráfico (solo consumo)
      this.generarGrafico(periodo || []);

      // --- CALCULO RANKING TOP MESES (AÑO ACTUAL) ---
      const periodoData = periodo || [];
      const añoActual = new Date().getFullYear();

      // Inicializo mapa de meses 0..11
      const monthsMap: Record<number, { total: number; count: number }> = {};
      for (let m = 0; m < 12; m++) monthsMap[m] = { total: 0, count: 0 };

      periodoData.forEach((p: any) => {
        const dt = new Date(p.fecha);
        if (isNaN(dt.getTime())) return;
        if (dt.getFullYear() !== añoActual) return;
        const m = dt.getMonth();
        monthsMap[m].total += Number(p.totalLitros || 0);
        monthsMap[m].count += 1;
      });

      const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const mesesArray: Array<{ mes: number; mesLabel: string; total: number; media: number }> = [];

      Object.keys(monthsMap).forEach(k => {
        const mi = Number(k);
        const obj = monthsMap[mi];
        if (!obj) return;
        if ((obj.total || 0) <= 0) return; // ignoro meses sin consumo
        const media = obj.count ? (obj.total / obj.count) : 0;
        mesesArray.push({
          mes: mi,
          mesLabel: `${monthNames[mi]} ${añoActual}`,
          total: Math.round((obj.total || 0) * 100) / 100,
          media: Math.round(media * 100) / 100
        });
      });

      mesesArray.sort((a, b) => b.total - a.total);
      this.rankingTopMeses = mesesArray.slice(0, 12);
      this.maxMonthTotal = this.rankingTopMeses.length ? Math.max(...this.rankingTopMeses.map(x => x.total)) : 0;

    }, err => {
      console.error('Error al obtener consumo global', err);
      this.loading = false;
      this.sinDatos = true;
    });
  }

  toggleTopMeses(): void {
    this.showTopMeses = !this.showTopMeses;
  }

  // helper para template: porcentaje relativo al máximo (0..100)
  computePct(value: number): number {
    if (!this.maxMonthTotal || this.maxMonthTotal <= 0) return 0;
    const pct = Math.round((value / this.maxMonthTotal) * 100);
    return Math.max(4, pct); // minimo 4% para que la barra se vea
  }
}