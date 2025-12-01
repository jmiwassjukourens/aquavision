import { Component, OnInit } from '@angular/core';
import { ChartData, ChartOptions, ChartEvent } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { ConsumoService, ConsumoSector } from '../../../services/consumo.service';
import { MatDialog } from '@angular/material/dialog';
import { EventDialogComponent } from './dialog/event-dialog.component';
import { Chart } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { HomeService } from '../../../services/home.service';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';

Chart.register(annotationPlugin);

@Component({
  selector: 'app-event-graphic',
  standalone: true,
  imports: [NgChartsModule, CommonModule, FormsModule],
  templateUrl: './event-graphic.component.html',
  styleUrl: './event-graphic.component.css'
})
export class EventGraphicComponent implements OnInit {

  sectores: {
    sector: ConsumoSector;
    chartData: ChartData<'line'>;
    chartOptions: ChartOptions<'line'>;
    eventos: { hora: string; titulo: string; descripcion: string }[];
  }[] = [];

  sectoresDisponibles: { id: number; nombre: string; seleccionado: boolean }[] = [];
  sectoresSeleccionados: number[] = [];

  fechaActual: Date = new Date();
  fechaFormateada: string = '';
  esHoy: boolean = true;

  private colores = ['#2F80ED', '#27AE60', '#F2C94C', '#EB5757', '#9B51E0', '#56CCF2','#F2994A', '#27AE60'];

  constructor(
    private consumoService: ConsumoService,
    private dialog: MatDialog,
    private homeService: HomeService
  ) {}

  ngOnInit(): void {
    this.actualizarFechaFormateada();
    this.cargarDatos();
  }

  /** ----------------------------- FECHA ----------------------------- */

  actualizarFechaFormateada() {
    this.fechaFormateada = this.fechaActual
      .toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    this.esHoy = this.isToday(this.fechaActual);
  }

  cambiarDia(delta: number) {
    const nueva = new Date(this.fechaActual);
    nueva.setDate(nueva.getDate() + delta);
    this.fechaActual = nueva;
    this.actualizarFechaFormateada();
    this.cargarDatos();
  }

  isToday(date: Date): boolean {
    const hoy = new Date();
    return date.getFullYear() === hoy.getFullYear() &&
           date.getMonth() === hoy.getMonth() &&
           date.getDate() === hoy.getDate();
  }

  /** ----------------------------- CARGA DE DATOS ----------------------------- */

  cargarDatos() {
    const hogarId = this.homeService.getHomeId() ?? 0;
    const dia = this.fechaFormateada;

    forkJoin({
      consumos: this.consumoService.getConsumosPorHoraYSector(hogarId, dia),
      eventos: this.consumoService.getEventos()
    }).subscribe(({ consumos, eventos }) => {

      // Inicializar filtro una sola vez
      if (this.sectoresDisponibles.length === 0) {
        this.sectoresDisponibles = consumos.consumosPorHora.map((s: any) => ({
          id: s.sectorId,
          nombre: s.nombreSector,
          seleccionado: true
        }));
        this.sectoresSeleccionados = this.sectoresDisponibles.map(s => s.id);
      }

      const filtrados = consumos.consumosPorHora.filter((s: any) =>
        this.sectoresSeleccionados.includes(s.sectorId)
      );

      this.sectores = filtrados.map((sectorData: any, index: number) => {
        const horas = sectorData.consumosPorHora.map((c: any) =>
          `${c.hora.toString().padStart(2, '0')}:00`
        );
        const caudales = sectorData.consumosPorHora.map((c: any) => c.consumo);
        const maxY = Math.max(...caudales, 10);

        const eventosSector = eventos
          .filter((ev: any) => ev.sector?.id === sectorData.sectorId)
          .filter((ev: any) => ev.fechaInicio?.startsWith(dia))
          .map((ev: any) => ({
            hora: ev.fechaInicio
              ? new Date(ev.fechaInicio).toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })
              : '-',
            titulo: ev.titulo || 'Evento',
            descripcion: ev.descripcion || ''
          }));

        const annotations: Record<string, any> = {};
        eventosSector.forEach((ev, i) => {
          const horaCercana = this.getHoraMasCercana(ev.hora, horas);
          const indexHora = horas.indexOf(horaCercana);
          const yValue = indexHora !== -1 ? caudales[indexHora] : 0;

          annotations[`evento_${sectorData.sectorId}_${i}`] = {
            type: 'label',
            xValue: horaCercana,
            yValue: yValue > 0 ? yValue : 0.2,
            backgroundColor: 'rgba(255, 205, 0, 0.95)',
            borderColor: '#333',
            borderWidth: 1,
            content: [`${ev.titulo}`, `${ev.hora}`],
            font: { size: 11, weight: '600' },
            color: '#000',
            padding: 6,
            position: 'center'
          };
        });

        const chartData: ChartData<'line'> = {
          labels: horas,
          datasets: [
            {
              label: `Consumo ${sectorData.nombreSector}`,
              data: caudales,
              borderColor: this.colores[index % this.colores.length],
              backgroundColor: this.colores[index % this.colores.length],
              fill: false,
              tension: 0.3,
              pointRadius: 3,
              borderWidth: 2
            }
          ]
        };

        const chartOptions: ChartOptions<'line'> = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            annotation: { annotations: annotations as any },
            tooltip: {
              callbacks: {
                label(context) {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  return label + context.parsed.y + ' m³';
                },
                title(context) {
                  return context[0].label;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax: maxY,
              title: { display: true, text: 'Caudal (m³)' }
            },
            x: { title: { display: true, text: 'Hora' } }
          }
        };

        return {
          sector: {
            id: sectorData.sectorId,
            nombre: sectorData.nombreSector,
            consumos: horas.map((h: string, i: number) => ({
              hora: h,
              caudal_m3: caudales[i]
            }))
          },
          chartData,
          chartOptions,
          eventos: eventosSector
        };
      });
    });
  }

  /** ----------------------------- FILTROS ----------------------------- */

  actualizarFiltros() {
    this.sectoresSeleccionados = this.sectoresDisponibles
      .filter(s => s.seleccionado)
      .map(s => s.id);

    this.cargarDatos();
  }

  /** ----------------------------- CLICK EN GRÁFICO ----------------------------- */

onChartClick(
  event: { event?: ChartEvent; active?: any[] } | undefined,
  item: { chartData: ChartData<'line'>; sector: ConsumoSector }
) {
  if (!event || !Array.isArray(event.active) || event.active.length === 0) {
    return;
  }

  const dataIndex = event.active[0].index;
  const labels = item.chartData.labels as string[];
  const dataValues = item.chartData.datasets[0].data as number[];

  const hora = labels[dataIndex];
  const litros = dataValues[dataIndex];
  if (!hora || litros == null) return;

  const [h, m] = hora.split(':').map(Number);
  const base = new Date();
  base.setHours(h, m, 0, 0);

  const start = new Date(base.getTime() - 5 * 60000);
  const end = new Date(base.getTime() + 5 * 60000);

  const costoPorLitro = 0.24;
  const costo = litros * costoPorLitro;

  const dialogRef = this.dialog.open(EventDialogComponent, {
    data: {
      start: start.toTimeString().slice(0, 5),
      end: end.toTimeString().slice(0, 5),
      litros,
      costo,
      sector: item.sector
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.ngOnInit();
    }
  });
}


  /** ----------------------------- UTILS ----------------------------- */

  private getHoraMasCercana(horaEvento: string, horas: string[]): string {
    const [hEv, mEv] = horaEvento.split(':').map(Number);
    let minDiff = Infinity, closest = horas[0];

    for (const h of horas) {
      const [hL, mL] = h.split(':').map(Number);
      const diff = Math.abs(hEv * 60 + mEv - (hL * 60 + mL));
      if (diff < minDiff) {
        minDiff = diff;
        closest = h;
      }
    }
    return closest;
  }
}