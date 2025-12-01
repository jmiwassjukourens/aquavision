import { Component, OnInit, ViewEncapsulation, AfterViewInit, ViewChild, TemplateRef, HostListener} from '@angular/core';
import { AuthService } from '../../auth/serviceAuth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';

import { HomeService } from '../../services/home.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user';

import { CuentaService } from '../../services/cuenta.service';
import { Hogar } from '../../models/hogar';
import { Facturacion } from '../../models/facturacion';
import { Sensor } from '../../models/sensor';

import { GamificacionService } from '../../services/gamificacion.service';
import { Logro } from '../../models/logro';

import { MedicionService } from '../../services/medicion.service';
import { Medicion } from '../../models/medicion';
import { FormsModule } from '@angular/forms';
import { ChartData, ChartOptions, ChartEvent } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';

// =======================================================
// ⬇️ DEFINICIÓN DE INTERFACES AUXILIARES AQUÍ ⬇️
// =======================================================

/**
 * Representa una medición de caudal en un minuto específico, ya procesada.
 */
interface CaudalMinuto {
    time: string;
    flow: number; // Caudal en litros/min
}

/**
 * Contenedor de estado completo para la visualización de un sensor.
 */
interface SensorFlowData {
    sectorId: number;
    minutosSeleccionados: number;
    viewMode: 'graph' | 'table';
    loading: boolean;
    errorMessage: string | null;
    caudales: CaudalMinuto[]; 
    chartData: ChartData<'line'>;
    chartOptions: ChartOptions<'line'>;
    noDataFound: boolean;
}

// =======================================================
// ⬆️ FIN DE INTERFACES AUXILIARES ⬆️
// =======================================================


@Component({
  selector: 'app-account-settings',
  imports: [CommonModule, NgChartsModule, FormsModule],
  templateUrl: './account-settings.component.html',
  styleUrls: [
    './account-settings.component.css',
    './normalize.css',
    './webflow.css',
    './aquavision-portal-usuarios.webflow.css'
  ],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('modalAnimation', [
      state('open', style({ opacity: 1, transform: 'scale(1)' })),
      state('closed', style({ opacity: 0, transform: 'scale(0.8)' })),
      transition('closed => open', [animate('300ms ease-out')]),
      transition('open => closed', [animate('300ms ease-in')])
    ])]
})
export class AccountSettingsComponent implements OnInit{

  activeModal: string | null = null;

  // Propiedad para almacenar los datos de visualización (gráfico/tabla) para cada sensor
  sensorFlowData: Map<number, SensorFlowData> = new Map();
  // Valor bindeado al input de minutos en el modal ([(ngModel)])
  currentMinutosSeleccionados: number = 60;

  private currentHogarId: number | null = null;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private homeService: HomeService,
    private userService: UserService,
    private cuentaService: CuentaService,
    private gamificacionService: GamificacionService,
    private medicionService: MedicionService
  ){  }

   logout(){
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openModal(id: string) {
    console.log('Abriendo modal: ', id)
    this.activeModal = id;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler() {
    this.closeModal();
  }

  closeModal() {
    this.activeModal = null;
  }

  user?: User;
  hogar?: Hogar;
  facturacion?: Facturacion;
  sensores: Sensor[] = [];
  /*usuario?: User;*/


  ngOnInit(): void {
    this.userService.getAuthenticatedUser().subscribe({
      next: (u) => this.user = u,
      error: (err) => console.error('Error al obtener usuario', err)
    });

    this.homeService.waitForHomeId().subscribe({
      next: (hogarId: number) => {
        console.log('Hogar ID obtenido:', hogarId);
        this.currentHogarId = hogarId;
        this.cargarDatos(hogarId);
        this.cargarLogros(hogarId);
      },
      error: (err) => console.error('Error al obtener hogarId', err)
    });

  }

  descargarManual() {
    const link = document.createElement('a');
    link.href = 'files/Manual_usuario_Aquavision_v1.2.pdf';
    link.download = 'Manual_Sensor.pdf';
    link.click();
  }

  irASoporte() {
    window.open('https://aquavision-comercial.webflow.io/contacto', '_blank');
  }

  cargarDatos(hogarId:number): void {
    this.cuentaService.getUsuario(hogarId).subscribe(data => this.user = data);
    this.cuentaService.getHogar(hogarId).subscribe(data => this.hogar = data);
    this.cuentaService.getFacturacion(hogarId).subscribe(data => this.facturacion = data);
    this.cuentaService.getSensores(hogarId).subscribe(data => this.sensores = data);
  }

  logros: Logro[] = [
    { nombre: 'Registro', descripcion: 'Te registraste en AquaVision', pista: 'El viaje comienza con el primer paso.'},
    { nombre: 'Primer sensor', descripcion: 'Instalaste tu primer sensor', pista: 'Conecta tu primer ojo bajo el agua.'},
    { nombre: 'Primer ahorro', descripcion: 'Reduciste tu consumo de agua', pista: 'La primera gota que no se desperdicia es la más significativa.'},
    { nombre: 'Sabio acuatico', descripcion: 'Participaste en 7 trivias seguidas', pista: 'Demuestra tu constancia al aceptar todos los desafíos semanales.'},
    { nombre: 'Primer Reto', descripcion: 'Completá tu primera trivia', pista: 'Poné a prueba tu conocimiento participando en una trivia.' },
    { nombre: 'Eco Heroe', descripcion: 'Ahorra agua durante 7 días seguidos', pista: 'Siete amaneceres de compromiso con el planeta.' }
  ];

  logrosDesbloqueados: Logro[] = [];
  
  cargarLogros(hogarId: number): void {
    this.gamificacionService.getLogros(hogarId).subscribe({
      next: (data) => {
        this.logrosDesbloqueados = data;
        console.log('Logros desbloqueados:', data);
      },
      error: (err) => console.error('Error al cargar logros', err)
    });
  }

  esLogroDesbloqueado(nombre: string): boolean {
    return this.logrosDesbloqueados.some(l => l.nombre === nombre);
  }

  tooltipVisible = false;
  tooltipText = '';
  tooltipX = 0;
  tooltipY = 0;

  showTooltip(event: MouseEvent, logro: Logro): void {
    if (!this.esLogroDesbloqueado(logro.nombre)) {
      this.tooltipText = logro.pista || 'Completa más desafíos para desbloquear este logro';
      this.tooltipVisible = true;
      this.moveTooltip(event);
      console.log('hover sobre', logro.nombre)
    }
  }

  moveTooltip(event: MouseEvent): void {
    const tooltipWidth = 300; // Mantenemos el mismo max-width definido en CSS
    const offset = 15; // Distancia estándar desde el cursor
    const minMargin = 5; // Margen mínimo desde el borde izquierdo de la pantalla (para que no se pegue al borde)

    // 1. Obtener el ancho de la ventana
    const windowWidth = window.innerWidth;

    let newX = event.pageX + offset; // Posición inicial por defecto (a la derecha del cursor)

    // 2. VERIFICACIÓN DEL BORDE DERECHO
    // Si el tooltip se sale por la derecha, lo posicionamos a la izquierda del cursor.
    if (event.pageX + offset + tooltipWidth > windowWidth) {
      newX = event.pageX - tooltipWidth - offset;
    }
    
    // 3. VERIFICACIÓN DEL BORDE IZQUIERDO (¡NUEVO!)
    // Si después de cualquier ajuste, la posición resultante es menor que el margen mínimo (newX < minMargin),
    // significa que el tooltip se está saliendo por la izquierda. Lo ajustamos al margen.
    if (newX < minMargin) {
      newX = minMargin;
    }
    
    this.tooltipX = newX;
    this.tooltipY = event.pageY + offset;
  }

  hideTooltip(): void {
    this.tooltipVisible = false;
  }

  openModalSensor(id: string) {
    console.log('abriendo modal sensor: ', id);
    this.activeModal = id;
    if (id.startsWith('sensor')) {
        const sensorIndex = parseInt(id.replace('sensor', ''));
        
        // Asumiendo que los sensores en el array son 0-based:
        const sensor = this.sensores[sensorIndex]; 

        this.currentSensorIndex = sensorIndex;

        // 🚨 SI TU INDEXACIÓN ES 1-BASED (sensor1 -> index 0), usa:
        // const sensor = this.sensores[sensorIndex - 1]; 

        if (sensor?.idSector) {
            const sectorId = sensor.idSector;
            const minutos = 60; // Usaremos 60 minutos como valor fijo para la prueba

            console.log(`[DEBUG] Sector ID obtenido y cargando datos: ${sectorId}`);

            // ⬇️ Llama directamente al servicio y loguea la respuesta ⬇️
            this.medicionService.getUltimasMediciones(sectorId, minutos).subscribe({
                next: (mediciones) => {
                    // Muestra en consola la data EXACTA que viene del backend
                    console.log(`[DEBUG COMPLETO] ✅ Datos recibidos para Sector ${sectorId}:`, mediciones);
                },
                error: (err) => {
                    console.error(`[DEBUG COMPLETO] ❌ ERROR al obtener mediciones para Sector ${sectorId}:`, err);
                }
            });
        } else {
            console.warn('[DEBUG] El sensor no tiene idSector o el índice es incorrecto.');
        }
    }
  }

  currentSensorIndex: number | null = null;

  goToPreviousSensor() {
    if (this.currentSensorIndex !== null) {
      let newIndex = this.currentSensorIndex - 1;

      if (newIndex < 0) {
        newIndex = this.sensores.length - 1;
      }
      
      this.openModalSensor('sensor' + newIndex);
    }
  }

  goToNextSensor() {
    if (this.currentSensorIndex !== null) {
      let newIndex = this.currentSensorIndex + 1;

      if (newIndex >= this.sensores.length) {
        newIndex = 0;
      }

      this.openModalSensor('sensor' + newIndex);
    }
  }


  // ----------------------------------------------------------------------------------
  // MÉTODOS DE LÓGICA DE CAUDAL
  // ----------------------------------------------------------------------------------
  
  // Llamado cuando el usuario cambia el input de minutos
  onRangoMinutosChange(sensorId: number): void {
  if (this.currentMinutosSeleccionados >= 1 && this.currentMinutosSeleccionados <= 60) {
    this.loadSensorFlowData(sensorId, this.currentMinutosSeleccionados);
    }
  }
  
  // Método principal que llama al servicio y procesa los datos
  loadSensorFlowData(sectorId: number, minutos: number): void {
      
  // 1. Inicializar/Actualizar el estado de carga
    let dataState = this.sensorFlowData.get(sectorId);
      if (!dataState) {
        dataState = {
          sectorId: sectorId,
          minutosSeleccionados: minutos,
          viewMode: 'graph',
          loading: true,
          errorMessage: null,
          caudales: [],
          chartData: { labels: [], datasets: [] },
          chartOptions: this.getDefaultChartOptions(0),
          noDataFound: false
        };
    } else {
        dataState.loading = true;
        dataState.errorMessage = null;
        dataState.noDataFound = false;
        dataState.minutosSeleccionados = minutos;
    }
    this.sensorFlowData.set(sectorId, dataState);

    // 2. Llamada al servicio
    this.medicionService.getUltimasMediciones(sectorId, minutos).subscribe({
      next: (mediciones: Medicion[]) => {
        // ⬇️ Lógica para detectar CERO DATOS ⬇️
        if (!mediciones || mediciones.length === 0) {
          dataState!.noDataFound = true; // ⬅️ Activa la bandera si no hay datos
          console.log(`[DEBUG] Respuesta vacía. Se rellenará con 0s.`);
        }

        const filledData = this.fillMissingMinutes(mediciones, minutos);
        const maxFlow = Math.max(...filledData.map(d => d.flow), 5); // Max mínimo de 5
            
          // Asignar los datos procesados al estado
          dataState!.caudales = filledData;
          dataState!.chartData = this.prepareChartData(filledData);
          dataState!.chartOptions = this.getDefaultChartOptions(maxFlow);
          dataState!.loading = false;
        },
        error: (err) => {
          console.error(`Error al cargar caudal para sensor ${sectorId}:`, err);
          dataState!.errorMessage = 'Error al cargar los datos de caudal.';
          dataState!.loading = false;
        }
    });
  }
  
  // Devuelve el estado de datos para un sensor específico (usado en el HTML)
  getFlowData(sectorId: number | undefined): SensorFlowData | undefined {
    return sectorId ? this.sensorFlowData.get(sectorId) : undefined;
  }
  
  // Alternar entre gráfico y tabla (usado en el HTML)
  toggleViewMode(sectorId: number, mode: 'graph' | 'table'): void {
    const dataState = this.sensorFlowData.get(sectorId);
    if (dataState) {
      dataState.viewMode = mode;
    }
    // 1. ⬅️ NUEVO: Recargar los metadatos del sensor activo
    // Solo refrescamos si el hogar y el modal activo están definidos
    if (this.hogar?.id && this.activeModal && this.activeModal.startsWith('sensor')) {
        
        // Obtenemos el índice del sensor desde el modal
        const sensorIndex = parseInt(this.activeModal.replace('sensor', ''));
        
        // 🚨 La verificación original era redundante y causaba el error de compilación.
        // Asumimos que si llegamos aquí, el modal 'sensorX' corresponde al sectorId que pasamos.
        
        // Solo verificamos que el índice sea válido dentro de nuestro array
        if (sensorIndex >= 0 && sensorIndex < this.sensores.length) {
            
            // Llamamos a la función de refresco.
            // Pasamos el índice (para saber qué elemento del array actualizar) 
            // y el ID del hogar (para la llamada a la API).
            this.refreshSensorMetadata(sensorIndex, this.hogar.id);
        }
    }
  }

  /**
   * 1. Función para manejar los clics en los botones predefinidos.
   * Setea el rango y recarga inmediatamente los datos.
   */
  setRangeAndLoad(minutos: number): void {
      // 1. Aplicamos el rango, asegurando que no exceda 60
      this.currentMinutosSeleccionados = Math.min(minutos, 60); 

      // 2. Disparamos la carga de datos
      this.reloadCurrentSensorData();
  }

  /**
   * 2. Función para manejar la escritura manual en el input.
   * Se llama cuando el ngModel de currentMinutosSeleccionados cambia.
   */
  onRangeChange(): void {
      // Retrasamos la carga un poco para que el usuario pueda terminar de escribir
      // Puedes usar un debounceTime si lo tienes, o simplemente esta lógica de validación
      
      // Aseguramos que el valor esté entre 1 y 60
      let minutos = this.currentMinutosSeleccionados;
      if (minutos > 60) {
          minutos = 60;
      } else if (minutos < 1) {
          // Podrías resetearlo a un valor por defecto o dejarlo para que lo corrijan
          return; // No recargamos si es un valor inválido
      }

      // Actualizamos la variable (útil si pusimos 61 y se forzó a 60)
      this.currentMinutosSeleccionados = minutos;
      
      // Disparamos la carga de datos
      this.reloadCurrentSensorData();
  }


  /**
   * 3. Función auxiliar para recargar los datos del sensor activo
   */
  reloadCurrentSensorData(): void {
      // 1. Parseamos el ID del sensor activo
      if (!this.activeModal || !this.activeModal.startsWith('sensor') || this.currentHogarId === null) {
        console.warn('Recarga abortada: Modal no activo o ID de Hogar no disponible.');  
        return;
      }
      
      const sensorIndex = parseInt(this.activeModal.replace('sensor', ''));
      const sensor = this.sensores[sensorIndex]; // Ajustar el índice si es 1-based
      
      if (sensor?.idSector) {
          // 2. Llamamos a la función principal de carga con el nuevo rango
          this.loadSensorFlowData(sensor.idSector, this.currentMinutosSeleccionados);

          this.refreshSensorMetadata(sensorIndex, this.currentHogarId);
      }
  }

  /**
   * Recarga los metadatos (estado, última medición) del sensor por su ID de Hogar e Índice.
   * @param sensorIndex El índice del sensor en el array `this.sensores`.
   * @param hogarId El ID del hogar asociado (necesario para la API).
   */
  refreshSensorMetadata(sensorIndex: number, hogarId: number): void {
      // 1. Obtener los sensores más recientes del hogar
      this.cuentaService.getSensores(hogarId).subscribe({
          next: (sensoresActualizados) => {
              // 2. Encontrar el sensor específico que estamos visualizando
              const sensorActualizado = sensoresActualizados.find(s => s.idSector === this.sensores[sensorIndex].idSector);

              if (sensorActualizado) {
                  // 3. Reemplazar el objeto obsoleto en el array principal
                  //this.sensores[sensorIndex] = sensorActualizado;
                  const sensorActual = this.sensores[sensorIndex];
                  sensorActual.estadoActual = sensorActualizado.estadoActual;

                  console.log(`[Metadata] Sensor ${sensorActualizado.nombreSensor} actualizado. Nuevo estado: ${sensorActualizado.estadoActual}`);
              }
          },
          error: (err) => console.error('Error al recargar metadatos del sensor:', err)
      });
  }

  // ----------------------------------------------------------------------------------
  // **LÓGICA CLAVE: RELLENAR MINUTOS FALTANTES (flow = 0)**
  // ----------------------------------------------------------------------------------
  private fillMissingMinutes(measurements: Medicion[], minuteRange: number): CaudalMinuto[] {
    const filledMap = new Map<string, number>();
    const filledWithTime = new Map<string, Date>();

    // Usamos la hora actual para definir el final del rango
    const now = new Date(); 
    
    // 1. Inicializar el Mapa con 0s para el rango completo
    for (let i = 0; i < minuteRange; i++) {
      const time = new Date(now.getTime() - i * 60000); // Restamos i minutos
      const label = time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }); 
            
      if (!filledMap.has(label)) {
            filledMap.set(label, 0); 
            filledWithTime.set(label, time);
        }
    }

    // 2. Sobreescribir con datos reales
    measurements.forEach(m => {
      const measurementDate = new Date(m.timestamp);
      // El formato debe coincidir
      const label = measurementDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
      // Si hay múltiples mediciones en el mismo minuto, sumamos o tomamos la última (aquí tomamos la última)
      filledMap.set(label, m.flow);

      filledWithTime.set(label, measurementDate);
    });

    // 3. Convertir a Array y ordenar
    const filledArray = Array.from(filledMap.entries())
      .map(([time, flow]) => ({ time, flow, realTime: filledWithTime.get(time) as Date }))
      // Ordenamos usando la propiedad `realTime` que incluye el día correcto
      .sort((a, b) => a.realTime.getTime() - b.realTime.getTime())
      .map(({ time, flow }) => ({ time, flow }));

    // Aseguramos que solo devolvemos los 'minuteRange' puntos (los más recientes)
    return filledArray.slice(-minuteRange); 
  }

  // ----------------------------------------------------------------------------------
  // **CONFIGURACIÓN DE GRÁFICO**
  // ----------------------------------------------------------------------------------
  private prepareChartData(data: CaudalMinuto[]): ChartData<'line'> {
    const labels = data.map(d => d.time);
    const flowData = data.map(d => d.flow);
      
    return {
      labels: labels,
      datasets: [{
          data: flowData,
          label: 'Caudal (Litros/min)',
          borderColor: '#2F80ED',
          backgroundColor: 'rgba(47, 128, 237, 0.3)',
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          borderWidth: 2
      }]
    };
  }

  private getDefaultChartOptions(suggestedMax: number): ChartOptions<'line'> {
      return {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
              y: {
                  beginAtZero: true,
                  suggestedMax: suggestedMax + 1,
                  title: { display: true, text: 'Caudal (Litros/min)' }
              },
              x: {
                  title: { display: true, text: 'Hora (HH:MM)' },
                  ticks: { autoSkip: true, maxTicksLimit: 12 }
              }
          },
          plugins: {
              legend: { display: false },
              tooltip: {
                  callbacks: {
                      label: (context) => `${context.parsed.y} L/min`,
                      title: (context) => `Hora: ${context[0].label}`
                  }
              }
          }
      };
  }

  /**
   * Mapea el estado del sensor (Enum) a un texto descriptivo y una clase CSS.
   * @param estado El valor del enum del backend (ej: 'ON', 'IDLE').
   * @returns Un objeto con el texto y la clase CSS.
   */
  getSensorStatusDisplay(estado: string | undefined): { text: string, className: string } {
      if (!estado) {
          return { text: 'Desconocido', className: 'estado-unknown' };
      }

      // Definimos las clases y los textos para cada estado
      switch (estado.toUpperCase()) {
          case 'ON':
              return { text: 'Conectado', className: 'estado-on' }; // Verde
          case 'IDLE':
              return { text: 'Inactivo (Cero Caudal)', className: 'estado-idle' }; // Amarillo/Naranja
          case 'HIBERNATING':
              return { text: 'Reposo', className: 'estado-hibernate' }; // Naranja/Dormido
          case 'OFFLINE':
              return { text: 'Desconectado', className: 'estado-offline' }; // Rojo
          case 'UNKNOWN':
          default:
              return { text: 'Error de estado', className: 'estado-unknown' }; // Gris
      }
  }

}