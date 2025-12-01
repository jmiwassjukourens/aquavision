import { Component,OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ChartData, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { ReporteAdminService } from '../../../services/reporteAdmin.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-localidad-admin',
  standalone: true,
  imports: [CommonModule, NgChartsModule, FormsModule],
  templateUrl: './localidad-admin.component.html',
  styleUrls: ['./localidad-admin.component.css']
})
export class LocalidadAdminComponent implements OnInit {

  fechaDesde?: string;
  fechaHasta?: string;

  resumenPorLocalidad: { localidad: string, total: number, media: number, costo: number, hogares: number }[] = [];

  totalGlobal = 0; // precalculado para usar desde el template

  barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  barChartOptions: ChartOptions = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'bottom' } } };

  constructor(private reporteService: ReporteAdminService) { }

  ngOnInit(): void {
    const hoy = new Date();
    const haceTresMes = new Date();
    haceTresMes.setMonth(hoy.getMonth() - 3);
    this.fechaDesde = haceTresMes.toISOString().split('T')[0];
    this.fechaHasta = hoy.toISOString().split('T')[0];
    this.aplicarFiltro();
  }

  aplicarFiltro(): void {
    if (!this.fechaDesde || !this.fechaHasta) return;
    this.reporteService.getConsumoPorLocalidad(this.fechaDesde, this.fechaHasta).subscribe(data => {
      this.resumenPorLocalidad = data.sort((a,b) => b.total - a.total);
      this.totalGlobal = this.resumenPorLocalidad.reduce((s, r) => s + (r.total || 0), 0);
      this.generarGrafico();
    }, err => console.error('Error localidad', err));
  }


exportarExcel(): void {
  if (!this.fechaDesde || !this.fechaHasta) {
    console.warn('Debes seleccionar fechaDesde y fechaHasta');
    return;
  }

  this.reporteService.getConsumoPorLocalidad(this.fechaDesde, this.fechaHasta).subscribe({
    next: (data: any[]) => {
      if (!data || data.length === 0) {
        console.warn('No hay datos para exportar');
        return;
      }

      // Export JSON crudo (sin formateos)
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Localidades');

      const wbout: ArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const filename = `reporte_localidad_${this.fechaDesde}_a_${this.fechaHasta}.xlsx`;
      saveAs(blob, filename);
    },
    error: (err) => {
      console.error('Error obteniendo resumen por localidad para exportar', err);
    }
  });
}

exportarPDF(): void {
  if (!this.fechaDesde || !this.fechaHasta) {
    console.warn('Debes seleccionar fechaDesde y fechaHasta');
    return;
  }
  this.reporteService.descargarReporteLocalidadPDF(this.fechaDesde, this.fechaHasta);
}

  showRanking = false;
rankingTop: Array<{ localidad: string; total: number; media: number; costo: number }> = [];

// Reemplazar / añadir setAtajo, toggleRanking y formatFechaLocal
setAtajo(rango: '7d' | '1m' | '3m' | '6m'): void {
  const hoy = new Date();
  const desde = new Date(hoy);

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
  return d.toISOString().split('T')[0];
}

toggleRanking(): void {
  this.showRanking = !this.showRanking;
}

// Reemplazar generarGrafico()
generarGrafico(): void {
  // resumenPorLocalidad ya viene ordenado por aplicarFiltro()
  const labels = (this.resumenPorLocalidad || []).map(r => r.localidad);
  const totals = (this.resumenPorLocalidad || []).map(r => r.total);

  this.barChartData = {
    labels,
    datasets: [
      {
        data: totals,
        label: 'Litros totales por localidad',
        backgroundColor: labels.map((_, i) => `rgba(3, 102, 194, ${0.08 + Math.min(0.6, 0.08 + i*0.02)})`),
        borderColor: labels.map((_, i) => `rgba(3, 102, 194, ${0.7 - Math.min(0.45, i*0.03)})`),
        borderWidth: 1
      }
    ]
  };

  // Calcular rankingTop (top 5 por total)
  const ranking = (this.resumenPorLocalidad || []).map(r => ({
    localidad: r.localidad,
    total: r.total,
    media: r.media,
    costo: r.costo
  }));

  ranking.sort((a, b) => b.total - a.total);
  this.rankingTop = ranking.slice(0, 5);
}

}