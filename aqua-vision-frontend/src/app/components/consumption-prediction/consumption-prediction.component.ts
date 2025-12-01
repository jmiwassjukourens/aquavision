import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { HomeService } from '../../services/home.service';
import { ChartConfiguration } from 'chart.js';
import { ConsumoService } from '../../services/consumo.service';

@Component({
  selector: 'app-consumption-prediction',
  standalone: true,
  imports: [NgChartsModule, CommonModule],
  templateUrl: './consumption-prediction.component.html',
  styleUrls: ['./consumption-prediction.component.css']
})
export class ConsumptionPredictionComponent implements OnInit {
  mostrarFiltros: boolean = false;

  sectores: any[] = [];
  nombresSectores: string[] = [];
  sectoresFiltrados: string[] = [];
  sectoresFiltradosData: any[] = [];
  hogarId: number | null = null;

  showInfo: boolean = false;

  filtrosParametros: { [key: string]: boolean } = {
    Actual: true,
    Proyectado: true,
    'Tendencia Mín': false,
    'Tendencia Máx': false
  };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: { line: { spanGaps: false } }, // evita unir los null
    scales: {
      x: {
        title: { display: true, text: 'Día del mes' },
        ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 }
      },
      y: {
        title: { display: true, text: 'Consumo (Litros)' },
        beginAtZero: true
      }
    },
    plugins: {
      legend: { position: 'top' },
      tooltip: { enabled: true }
    }
  };

  constructor(
    private consumoService: ConsumoService,
    private homeService: HomeService
  ) {}

  ngOnInit(): void {
    this.hogarId = this.homeService.getHomeId();
    if (this.hogarId && this.hogarId > 0) {
      this.cargarPrediccion();
    } else {
      console.warn('⚠️ No valid home found, prediction will not load.');
    }
  }

  toggleInfo(): void {
    this.showInfo = !this.showInfo;
  }

  cargarPrediccion(): void {
    if (this.hogarId === null) return;

    this.consumoService.getPrediccionConsumoPorDia(this.hogarId).subscribe({
      next: (sectores) => {
        const hoy = new Date().getDate(); // día actual del mes

        this.sectores = sectores.map((datosSector) => {
          const labels = datosSector.dias.map((d: number) => d.toString());
          const consumoActualOriginal = datosSector.consumoActual ?? [];

          // ✅ Muestra hasta el día actual, corta después
          const consumoActual = consumoActualOriginal.map((v: number, i: number) =>
            i + 1 > hoy ? null : v
          );

          const consumoProyectado = datosSector.consumoProyectado ?? [];
          const tendenciaMin = datosSector.tendenciaMin ?? [];
          const tendenciaMax = datosSector.tendenciaMax ?? [];

          const costoPorLitro = 3;
          const costoActual = (
            consumoActual.filter((v) => v != null).reduce((a, b) => a + (b ?? 0), 0) *
            costoPorLitro
          ).toFixed(2);
          const costoProyectado = (
            consumoProyectado.reduce((a, b) => a + b, 0) * costoPorLitro
          ).toFixed(2);

          return {
            nombre: datosSector.nombre_sector,
            lineChartData: {
              labels,
              datasets: [
                { data: consumoActual, label: 'Actual', borderColor: '#2563eb',  fill: false, tension: 0.3, backgroundColor:'transparent', pointBackgroundColor: '#2563eb' },
                { data: consumoProyectado, label: 'Proyectado', borderColor: '#25a2ebff', borderDash: [5, 5], fill: false, tension: 0.3, backgroundColor:'transparent', pointBackgroundColor: '#25a2ebff' },
                { data: tendenciaMin, label: 'Tendencia Mín', borderColor: '#0c6930ff', borderDash: [5, 5], fill: false, tension: 0.3, backgroundColor:'transparent', pointBackgroundColor: '#0c6930ff' },
                { data: tendenciaMax, label: 'Tendencia Máx', borderColor: '#a30817ff', borderDash: [5, 5], fill: false, tension: 0.3, backgroundColor:'transparent', pointBackgroundColor: '#a30817ff' }
              ]
            },
            costoActual,
            costoProyectado,
            tendenciaMinima: tendenciaMin.length ? Math.min(...tendenciaMin) : null,
            tendenciaMaxima: tendenciaMax.length ? Math.max(...tendenciaMax) : null,
            hallazgosClave: datosSector.hallazgosClave ?? []
          };
        });

        this.nombresSectores = this.sectores.map((s) => s.nombre);
        this.sectoresFiltrados = [...this.nombresSectores];
        this.actualizarFiltro();
      },
      error: (err) => console.error('Error al obtener predicción:', err),
    });
  }

  toggleFiltroSector(nombre: string): void {
    if (this.sectoresFiltrados.includes(nombre)) {
      this.sectoresFiltrados = this.sectoresFiltrados.filter((s) => s !== nombre);
    } else {
      this.sectoresFiltrados.push(nombre);
    }
    this.actualizarFiltro();
  }

  toggleFiltroParametro(nombre: string): void {
    this.filtrosParametros[nombre] = !this.filtrosParametros[nombre];
    this.actualizarFiltro();
  }

  actualizarFiltro(): void {
    this.sectoresFiltradosData = this.sectores.map((s) => {
      return {
        ...s,
        lineChartData: {
          ...s.lineChartData,
          datasets: s.lineChartData.datasets.filter((d: any) => this.filtrosParametros[d.label])
        }
      };
    }).filter((s) => this.sectoresFiltrados.includes(s.nombre));
  }
}
