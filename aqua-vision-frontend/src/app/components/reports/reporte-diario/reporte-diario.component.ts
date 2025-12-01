import { Component,OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { ReporteService } from '../../../services/reports.service'
import { ReporteDiario } from '../../../models/reporteDiario';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { HomeService } from '../../../services/home.service';

@Component({
  selector: 'app-reporte-diario',
  standalone: true,
  imports: [CommonModule, NgChartsModule, FormsModule],
  templateUrl: './reporte-diario.component.html',
  styleUrl: './reporte-diario.component.css'
})
export class ReporteDiarioComponent implements OnInit {
  public sectoresOriginales: ReporteDiario[] = [];
  public sectoresFiltrados: ReporteDiario[] = [];
  public cantidadSectores = 0;
  public esHogar = false;
  public homeId!: number;
  public fechaActual: Date = new Date();
  public sinDatos = false; 

  public sectoresDisponibles: string[] = [];
  public sectoresSeleccionados: { [nombre: string]: boolean } = {};

  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } }
  };

  public pieChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public pieChartType: ChartType = 'doughnut';
  public pieChartOptions: ChartOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  };

  constructor(
    private reporteService: ReporteService,
    private homeService: HomeService
  ) {}

  ngOnInit(): void {
    this.homeService.initHomeId();

    this.homeService.homeId$.subscribe(id => {
      if (id !== null) {
        this.homeId = id;
        this.cargarReporte(id, this.fechaActual);
      } else {
        console.error('No se pudo obtener el homeId');
      }
    });
  }

  cargarReporte(homeId: number, fecha: Date): void {
    this.reporteService.getConsumoDiarioPorSector(homeId, fecha).subscribe({
      next: (data) => {
        console.log('📦 Reporte diario recibido:', data);

        this.sinDatos = !this.hayDatosReales(data);

        this.sectoresOriginales = data;
        this.sectoresDisponibles = data.map(s => s.nombre_sector);
        this.sectoresDisponibles.forEach(nombre => (this.sectoresSeleccionados[nombre] = true));
        this.cantidadSectores = data.length;
        this.esHogar = this.cantidadSectores === 1;

        if (!this.sinDatos) {
          this.actualizarDatos();
        } else {
       
          this.sectoresFiltrados = [];
          this.barChartData = { labels: [], datasets: [] };
          this.pieChartData = { labels: [], datasets: [] };
        }
      },
      error: (err) => {
        console.error('❌ Error al cargar reporte diario:', err);
        this.sinDatos = true;
        this.sectoresOriginales = [];
        this.sectoresFiltrados = [];
      }
    });
  }


actualizarDatos(): void {
  const filtrados = this.sectoresOriginales.filter(s => this.sectoresSeleccionados[s.nombre_sector]);
  this.sectoresFiltrados = filtrados;

  const sectoresAgrupados: Record<string, { consumo_total: number; media_consumo: number; count: number }> = {};
  filtrados.forEach(s => {
    if (!sectoresAgrupados[s.nombre_sector]) {
      sectoresAgrupados[s.nombre_sector] = { consumo_total: 0, media_consumo: 0, count: 0 };
    }
    sectoresAgrupados[s.nombre_sector].consumo_total += s.consumo_total;
    sectoresAgrupados[s.nombre_sector].media_consumo += s.media_consumo;
    sectoresAgrupados[s.nombre_sector].count++;
  });

  const labels = Object.keys(sectoresAgrupados);
  const consumoTotales = labels.map(sector => sectoresAgrupados[sector].consumo_total);
  const medias = labels.map(sector => sectoresAgrupados[sector].media_consumo / sectoresAgrupados[sector].count);

  this.barChartData = {
    labels,
    datasets: [
      { label: 'Consumo total', data: consumoTotales, backgroundColor: '#00D4FF' },
      { label: 'Media de consumo', data: medias, backgroundColor: '#e5be01' }
    ]
  };

  const colorPalette = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
  const backgroundColor = labels.map((_, i) => colorPalette[i % colorPalette.length]);

  this.pieChartData = {
    labels,
    datasets: [{ label: 'Proporción de consumo por sector', data: consumoTotales, backgroundColor }]
  };
}


  exportarExcel(): void {
    if (!this.sectoresFiltrados.length) {
      console.warn('No hay datos para exportar');
      return;
    }

const datosExportar = this.sectoresFiltrados.map(s => ({
  'Sector / Hogar': s.nombre_sector,
  'Consumo Total (L)': s.consumo_total,
  'Media de Consumo (L)': s.media_consumo,
  'Costo ($)': s.costo
}));


    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExportar);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Diario');

    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
    saveAs(data, `reporte_diario_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  exportarPDF(): void {
    const ahora = new Date();
    const dia = ahora.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    this.reporteService.descargarReportePDF(this.homeId, dia, dia);
  }


  cambiarDia(dias: number): void {
    const nuevaFecha = new Date(this.fechaActual);
    nuevaFecha.setDate(this.fechaActual.getDate() + dias);
    this.fechaActual = nuevaFecha;
    this.cargarReporte(this.homeId, this.fechaActual);
  }

    get fechaFormateada(): string {
    return this.fechaActual.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  get esHoy(): boolean {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaActualSinHora = new Date(this.fechaActual);
  fechaActualSinHora.setHours(0, 0, 0, 0);
  return fechaActualSinHora.getTime() === hoy.getTime();
}

  private hayDatosReales(data: ReporteDiario[]): boolean {
  
    if (!data || data.length === 0) return false;
    return data.some(s => {
      const consumo = Number(s?.consumo_total ?? 0);
    
      return !isNaN(consumo) && consumo > 0;
    });
  }

  refrescar(): void {
    this.cargarReporte(this.homeId, this.fechaActual);
  }


}

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';