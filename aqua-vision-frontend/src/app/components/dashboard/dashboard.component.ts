import { Component, OnInit } from '@angular/core';
import { ChartData, ChartEvent, ChartOptions } from 'chart.js';
import { ReporteService } from '../../services/reports.service';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/serviceAuth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { HomeService } from '../../services/home.service';
import { NotificationService } from '../../services/notification.service';
import { switchMap, catchError } from 'rxjs/operators';
import { ReporteAdminService } from '../../services/reporteAdmin.service';




@Component({
  selector: 'app-dashboard',
  imports: [NgChartsModule, CommonModule, RouterModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  isLoading: boolean = true;

  // usuario normal
  consumoDia!: number;
  consumoColor!: string;
  medidoresConectados!: number;
  medidoresDesconectados!: number;
  estadoMedidores: { conectados: number, desconectados: number } | undefined;

  cantidadNotificaciones = 0;

  // admin cards
  public totalHogaresAdmin!: number;      // usar si querés mostrar
  totalTriviasAdmin!: number;
  totalEventosAdmin!: number;
  consumoPromedio!: number;        // m3 promedio por hogar hoy

  consumoPromedioAnterior!: number;
  consumoDiff!: number;
  consumoDiffAbs!: number;

  // charts
  public lineChartData: ChartData<'line'> = { labels: [], datasets: [] };
  public lineChartDataAdmin: ChartData<'line'> = { labels: [], datasets: [] };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Caudal (m³)' }
      },
      x: { title: { display: true } }
    }
  };

  constructor(
    private reporteService: ReporteService,
    private reporteAdminService: ReporteAdminService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private homeService: HomeService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;

    this.homeService.waitForHomeId()
      .subscribe({
        next: (hogarId) => {
          // uso formatFechaLocal para generar YYYY-MM-DD en local (sin shift UTC)
          const hoy = new Date();
          const ayer = new Date(hoy);
          ayer.setDate(hoy.getDate() - 1);

          const diaHoy = this.formatFechaLocal(hoy);
          const diaAyer = this.formatFechaLocal(ayer);

          if (this.isAdmin) {
  // ADMIN: solicitamos el DTO dashboard y además horas (hoy/ayer) y notifs
  forkJoin({
    dashboard: this.reporteAdminService.getDashboard().pipe(catchError(() => of({
      consumoPromHoy: 0, consumoPromAyer: 0, trivias: 0, eventos: 0
    }))),
    notifs: this.reporteAdminService.getNotificacionesCount?.().pipe ? this.reporteAdminService.getNotificacionesCount().pipe(catchError(() => of(0))) : of(0),
    horasHoy: this.reporteAdminService.getConsumoPorHoraTotal(diaHoy).pipe(catchError(() => of([]))),
    horasAyer: this.reporteAdminService.getConsumoPorHoraTotal(diaAyer).pipe(catchError(() => of([])))
  }).subscribe({
    next: ({ dashboard, notifs, horasHoy, horasAyer }: any) => {
      // DTO -> variables del componente
      this.consumoPromedio = Number(dashboard.consumoPromHoy || 0);
      this.consumoPromedioAnterior = Number(dashboard.consumoPromAyer || 0);
      this.calcularDiferencia(this.consumoPromedio, this.consumoPromedioAnterior);

      this.totalTriviasAdmin = Number(dashboard.trivias || 0);
      this.totalEventosAdmin = Number(dashboard.eventos || 0);
      this.cantidadNotificaciones = Number(notifs || 0);

      // Chart: construyo Hoy/Ayer. Asumo arrays horarios de 24 elementos (00:00..23:00).
      const labels = (horasHoy && horasHoy.length) ? horasHoy.map((h: any) => h.hora)
                    : (horasAyer && horasAyer.length) ? horasAyer.map((h: any) => h.hora)
                    : Array.from({length:24}, (_,i) => String(i).padStart(2,'0') + ':00');

      const valoresHoy = (labels.map((lbl: string) => {
        const found = (horasHoy || []).find((h: any) => h.hora === lbl);
        return found ? found.caudal_m3 : 0;
      }));

      const valoresAyer = (labels.map((lbl: string) => {
        const found = (horasAyer || []).find((h: any) => h.hora === lbl);
        return found ? found.caudal_m3 : 0;
      }));

      this.lineChartDataAdmin = {
        labels,
        datasets: [
          {
            label: 'Hoy',
            data: valoresHoy,
            borderColor: '#2563eb',
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointRadius: 3.5,
            pointBackgroundColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.08)'
          },
          {
            label: 'Ayer',
            data: valoresAyer,
            borderColor: '#25a2ebff',
            fill: false,
            tension: 0.3,
            borderWidth: 2,
            borderDash: [6, 6],
            pointRadius: 3,
            pointBackgroundColor: '#25a2ebff',
            backgroundColor: 'transparent'
          }
        ]
      };

      // total hogares (si tu servicio lo expone) - lo dejo intacto
      this.totalHogaresAdmin = (this.reporteAdminService as any).hogares?.length ?? this.totalHogaresAdmin;
    },
    error: err => {
      console.error('Error cargando datos admin:', err);
      this.snackBar.open('Error al cargar datos admin', 'Cerrar', { duration: 4000 });
      this.isLoading = false;
    },
    complete: () => {
      this.isLoading = false;
    }
  });
} else {
            // USUARIO: mantenemos lógica previa (por hogar)
            forkJoin({
              hoy: this.reporteService.getConsumoPorHoraBackend(hogarId, diaHoy).pipe(catchError(err => { console.error('hoy error', err); return of([]); })),
              ayer: this.reporteService.getConsumoPorHoraBackend(hogarId, diaAyer).pipe(catchError(err => { console.error('ayer error', err); return of([]); })),
              consumoHoy: this.reporteService.getConsumoUltimoDia(hogarId).pipe(catchError(err => { console.error('consumoHoy error', err); return of(0); })),
              consumoAyer: this.reporteService.getConsumoPromedio(hogarId).pipe(catchError(err => { console.error('consumoAyer error', err); return of(0); })),
              estadoMedidores: this.reporteService.getEstadoMedidores(hogarId).pipe(catchError(() => of({ conectados: 0, desconectados: 0 })))
            }).subscribe({
              next: ({ hoy, ayer, consumoHoy, consumoAyer, estadoMedidores }: any) => {
                const horas = (hoy || []).map((d: any) => d.hora);
                const caudales = (hoy || []).map((d: any) => d.caudal_m3 ?? null);
                const caudalesAnterior = (ayer || []).map((d: any) => d.caudal_m3 ?? null);

                this.lineChartData = {
                  labels: horas,
                  datasets: [
                    {
                      label: 'Hoy',
                      data: caudales,
                      borderColor: '#2563eb',
                      fill: false,
                      tension: 0.3,
                      borderWidth: 3,
                      pointRadius: 3.5,
                      pointBackgroundColor: '#2563eb',
                      backgroundColor: 'transparent'
                    },
                    {
                      label: 'Ayer',
                      data: caudalesAnterior,
                      borderColor: '#25a2ebff',
                      fill: false,
                      tension: 0.3,
                      borderWidth: 2,
                      borderDash: [6, 6],
                      pointRadius: 3,
                      pointBackgroundColor: '#25a2ebff',
                      backgroundColor: 'transparent'
                    }
                  ]
                };

                // notificaciones para usuario (por hogar)
                this.notificationService.getUnreadCount(hogarId).subscribe({
                  next: count => this.cantidadNotificaciones = count,
                  error: err => console.error('Error al obtener notificaciones:', err)
                });

                // medidores y consumo para usuario
                this.consumoDia = consumoHoy as number;
                const consumoDiaAnterior = consumoAyer as number;
                this.estadoMedidores = estadoMedidores;
                this.medidoresConectados = estadoMedidores.conectados;
                this.medidoresDesconectados = estadoMedidores.desconectados;
                this.calcularDiferencia(this.consumoDia, consumoDiaAnterior);
              },
              error: err => {
                console.error('Error al cargar datos del dashboard (usuario):', err);
                this.snackBar.open('Error al cargar los datos del dashboard', 'Cerrar', { duration: 4000 });
              },
              complete: () => {
                this.isLoading = false;
              }
            });
          }
        },
        error: err => {
          console.error('Error obtaining homeId', err);
          this.isLoading = false;
        }
      });
  }

  // helpers de diferencia (ya tenías)
  consumoTotalHoy!: number;
  consumoTotalAyer!: number;
  consumoTotalDiff!: number;
  consumoTotalDiffAbs!: number;

  calcularDiferenciaTotal(actual: number, anterior: number): void {
    if (!anterior || anterior === 0) {
      this.consumoTotalDiff = 0;
      this.consumoTotalDiffAbs = 0;
      return;
    }
    this.consumoTotalDiff = ((actual - anterior) / anterior) * 100;
    this.consumoTotalDiffAbs = Math.abs(Math.round(this.consumoTotalDiff));
  }

  calcularDiferencia(actual: number, anterior: number): void {
    if (!anterior || anterior === 0) {
      this.consumoDiff = 0;
      this.consumoDiffAbs = 0;
      return;
    }
    this.consumoDiff = ((actual - anterior) / anterior) * 100;
    this.consumoDiffAbs = Math.abs(Math.round(this.consumoDiff));
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  onChartClick(event: { event?: any, active?: any[] }) {
    if (event.active && event.active.length > 0) {
      const element = event.active[0];
      const datasetIndex = element.datasetIndex;
      const dataIndex = element.index;
      const labels = this.isAdmin ? this.lineChartDataAdmin.labels : this.lineChartData.labels;
      const datasets = this.isAdmin ? this.lineChartDataAdmin.datasets : this.lineChartData.datasets;
      const hora = labels?.[dataIndex];
      const valor = datasets[datasetIndex].data[dataIndex] as number;

      if (hora && valor !== undefined && valor !== null) {
        this.snackBar.open(`Hora ${hora} → Consumo: ${valor} m³`, 'Cerrar', { duration: 3000 });
      }
    }
  }

  // --- HELPERS DE FECHA (local, sin shift UTC) ---
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
}