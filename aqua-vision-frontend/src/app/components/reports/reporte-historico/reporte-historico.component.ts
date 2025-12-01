import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions, ChartDataset } from 'chart.js';
import { ReporteService } from '../../../services/reports.service';
import { ReporteMensual } from '../../../models/reporteMensual';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { HomeService } from '../../../services/home.service';


@Component({
  selector: 'app-reporte-historico',
  standalone: true,
  imports: [CommonModule, NgChartsModule, FormsModule],
  templateUrl: './reporte-historico.component.html',
  styleUrls: ['./reporte-historico.component.css']
})
export class ReporteHistoricoComponent implements OnInit {

  sectoresOriginales: ReporteMensual[] = [];
  sectoresFiltrados: ReporteMensual[] = [];
  resumenPorSector: { [sector: string]: { total: number, pico: number, media: number, costo: number } } = {};

  fechaDesde?: string;
  fechaHasta?: string;
  homeId!: number;

  totalGlobal = 0;
  mediaGlobal = 0;
  picoGlobal = 0;
  costoGlobal = 0;

  barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } }
  };

  constructor(private reporteService: ReporteService, private homeService: HomeService) {}

  ngOnInit(): void {
    const hoy = new Date();
    const haceSeisMeses = new Date();
    haceSeisMeses.setMonth(hoy.getMonth() - 5);

    this.fechaDesde = this.formatFechaLocal(haceSeisMeses);
    this.fechaHasta = this.formatFechaLocal(hoy);

    this.homeService.homeId$.subscribe(id => {
      if (id !== null) {
        this.homeId = id;
      }
    });
    this.aplicarFiltro();
  }

  private formatFechaLocal(date: Date): string {
    return date.toLocaleDateString('en-CA'); 
  }

  aplicarFiltro(): void {
    if (!this.fechaDesde || !this.fechaHasta) return;

    const fechaHastaConHora = new Date(this.fechaHasta);
    fechaHastaConHora.setHours(23, 59, 59, 999);


    this.reporteService
      .getConsumoMensualPorSector(this.homeId, this.fechaDesde, this.formatFechaLocal(fechaHastaConHora))
      .subscribe({
        next: (data) => {
          this.sectoresOriginales = data;
          this.sectoresFiltrados = data;
          this.calcularResumenes();
        },
        error: (err) => console.error('Error al cargar datos generales', err)
      });

    this.reporteService
      .getConsumoMensualAgrupado(this.homeId, this.fechaDesde, this.formatFechaLocal(fechaHastaConHora))
      .subscribe({
        next: (data) => this.generarGrafico(data),
        error: (err) => console.error('Error al cargar datos para gráfico', err)
      });
  }

  calcularResumenes(): void {
    this.totalGlobal = 0;
    this.mediaGlobal = 0;
    this.picoGlobal = 0;
    this.costoGlobal = 0;
    this.resumenPorSector = {};

    if (this.sectoresFiltrados.length === 0) return;

    for (const registro of this.sectoresFiltrados) {
      this.totalGlobal += registro.consumo_total;
      this.mediaGlobal += registro.media_consumo;
      this.picoGlobal = Math.max(this.picoGlobal, registro.pico_maximo);
      this.costoGlobal += registro.costo || 0;

      if (!this.resumenPorSector[registro.nombre_sector]) {
        this.resumenPorSector[registro.nombre_sector] = {
          total: 0,
          pico: 0,
          media: 0,
          costo: 0
        };
      }

      const sectorResumen = this.resumenPorSector[registro.nombre_sector];
      sectorResumen.total += registro.consumo_total;
      sectorResumen.media += registro.media_consumo;
      sectorResumen.pico = Math.max(sectorResumen.pico, registro.pico_maximo);
      sectorResumen.costo += registro.costo || 0;
    }

    this.mediaGlobal = this.mediaGlobal / this.sectoresFiltrados.length;
    console.log('resumenPorSector', this.resumenPorSector);
  }



generarGrafico(consumosMensuales: any[]): void {
  const labels: string[] = [];
  const consumosTotales: number[] = [];

  consumosMensuales.forEach(m => {
    labels.push(`${this.obtenerNombreMes(m.mes)} ${m.anio}`); 
    consumosTotales.push(m.totalMes);
  });

  this.barChartData = {
    labels,
    datasets: [
      { data: consumosTotales, label: 'Consumo Total por Mes', backgroundColor: '#00D4FF' }
    ]
  };
}


  obtenerNombreMes(numeroMes: number): string {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[numeroMes - 1] ?? '';
  }

  exportarExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.sectoresFiltrados);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Histórico');

    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
    saveAs(data, `reporte_historico_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  exportarPDF(): void {
    if (this.fechaDesde && this.fechaHasta) {
      this.reporteService.descargarReportePDF(this.homeId, this.fechaDesde, this.fechaHasta);
    } else {
      console.warn('Faltan fechas para exportar el PDF');
    }
  }

setAtajo(rango: '7d' | '1m' | '3m' | '6m'): void {
  const hoy = new Date();
  const desde = new Date();

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


}

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';