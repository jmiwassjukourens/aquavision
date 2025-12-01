import { Injectable } from '@angular/core';
import { ReporteDiario } from '../models/reporteDiario';
import { ReporteMensual } from '../models/reporteMensual';
import { HttpClient } from '@angular/common/http';
import { DateUtilsService } from '../services/date.service';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PrediccionSector } from '../models/prediction/prediccionSector';
import { SectorProyeccion } from '../models/prediction/sectorProyeccion';
import { PrediccionPorDia } from '../models/prediction/prediccionPorDia';

import { Sensor } from '../models/sensor';
import { CuentaService } from './cuenta.service';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

    private readonly baseUrl = environment.apiUrl + '/reportes';

    constructor(
    private http: HttpClient,
    private dateUtils: DateUtilsService,
    private cuentaService: CuentaService
  ) {}

  getConsumoDiarioPorSector(id: number, fecha: Date): Observable<ReporteDiario[]> {
    const fechaDesde = this.dateUtils.formatDateToJava(new Date(fecha.setHours(0, 0, 0, 0)));
    const fechaHasta = this.dateUtils.formatDateToJava(new Date(fecha.setHours(0, 0, 0, 0)));

    const url = `${this.baseUrl}/${id}/consumo-fecha?fechaInicio=${encodeURIComponent(fechaDesde)}&fechaFin=${encodeURIComponent(fechaHasta)}`;

    return this.http.get<any>(url).pipe(
      map((response: any) => {
        return response.consumosPorSector.map((item: any) => ({
          nombre_sector: item.nombreSector,
          consumo_total: item.consumoTotal,
          media_consumo: item.consumoPromedio,
          pico_maximo: item.consumoPico,
          timestamp: fecha.toISOString(),
          costo: this.calcularCosto(item.consumoTotal).toFixed(2)
        }));
      })
    );
  }



  getConsumoMensualPorSector(id: number, fechaDesde: string | Date, fechaHasta: string | Date): Observable<ReporteMensual[]> {
    const desde = this.dateUtils.formatDateToJava(fechaDesde);
    const hasta = this.dateUtils.formatDateToJava(fechaHasta);

    const url = `${this.baseUrl}/${id}/consumo-fecha?fechaInicio=${encodeURIComponent(desde)}&fechaFin=${encodeURIComponent(hasta)}`;

    return this.http.get<any>(url).pipe(
      map((response: any) => {
        return response.consumosPorSector.map((item: any) => ({
          nombre_sector: item.nombreSector,
          mes: desde.substring(0, 7),
          consumo_total: item.consumoTotal,
          media_consumo: item.consumoPromedio,
          pico_maximo: item.consumoPico,
          costo: this.calcularCosto(item.consumoTotal)
        }));
      })

    );
  }

  private calcularCosto(consumoTotal: number): number {
    const tarifaPorUnidad = 0.24; 
    return consumoTotal * tarifaPorUnidad;
  }

  getConsumoPorHoraBackend(hogarId: number, dia: string): Observable<{ hora: string; caudal_m3: number }[]> {
  const url = `${environment.apiUrl}/reportes/${hogarId}/consumo-dia-hora?dia=${dia}`;
  return this.http.get<any>(url).pipe(
    map(response => {

      return response.consumosPorHora.map((item: any) => ({
        hora: item.hora.toString().padStart(2, '0') + ':00',
        caudal_m3: item.consumo
      }));
    }),
    tap(data => console.log('📦 Datos de consumo por hora desde backend:', data))
  );
}



  getConsumoPorHora(): { hora: string; caudal_m3?: number }[] {
  return [
    { hora: '00:00', caudal_m3: 5 },
    { hora: '01:00', caudal_m3: 4 },
    { hora: '02:00', caudal_m3: 3 },
    { hora: '03:00', caudal_m3: 3.5 },
    { hora: '04:00', caudal_m3: 4.2 },
    { hora: '05:00', caudal_m3: 5.1 },
    { hora: '06:00', caudal_m3: 6.5 },
    { hora: '07:00', caudal_m3: 8.3 },
    { hora: '08:00', caudal_m3: 10 },
    { hora: '09:00', caudal_m3: 12 },
    { hora: '10:00', caudal_m3: 0 },
    { hora: '11:00', caudal_m3: 0 },
    { hora: '12:00', caudal_m3: 0 },
    { hora: '13:00', caudal_m3: 3 },
    { hora: '14:00', caudal_m3: 8 },
    { hora: '15:00', caudal_m3: 9 },
    { hora: '16:00', caudal_m3: 13 },
    { hora: '17:00', caudal_m3: 15 },
    { hora: '18:00', caudal_m3: 18 },
    { hora: '19:00', caudal_m3: 20 },
    { hora: '20:00'},
    { hora: '21:00'},
    { hora: '22:00'},
    { hora: '23:00'}
  ];
}


  getConsumoTotalHogaresPorHora(): { hora: string; caudal_m3?: number }[] {
    return [ 
      { hora: '00:00', caudal_m3: 300 },
      { hora: '01:00', caudal_m3: 150 },
      { hora: '02:00', caudal_m3: 230 },
      { hora: '03:00', caudal_m3: 150 },
      { hora: '04:00', caudal_m3: 110 },
      { hora: '05:00', caudal_m3: 760 },
      { hora: '06:00', caudal_m3: 950 },
      { hora: '07:00', caudal_m3: 930 },
      { hora: '08:00', caudal_m3: 1000 },
      { hora: '09:00', caudal_m3: 1200 },
      { hora: '10:00', caudal_m3: 1500 },
      { hora: '11:00', caudal_m3: 950 },
      { hora: '12:00', caudal_m3: 1100 },
      { hora: '13:00', caudal_m3: 1250 },
      { hora: '14:00', caudal_m3: 920 },
      { hora: '15:00', caudal_m3: 900 },
      { hora: '16:00', caudal_m3: 700 },
      { hora: '17:00', caudal_m3: 800 },
      { hora: '18:00', caudal_m3: 1250 },
      { hora: '19:00', caudal_m3: 1500 },
      { hora: '20:00' },
      { hora: '21:00' },
      { hora: '22:00' },
      { hora: '23:00' }
    ];
  }

  getConsumoPorHoraDiaAnterior(): { hora: string; caudal_m3?: number }[] {
    return [
      { hora: '00:00', caudal_m3: 4 },
      { hora: '01:00', caudal_m3: 3.5 },
      { hora: '02:00', caudal_m3: 3 },
      { hora: '03:00', caudal_m3: 3.2 },
      { hora: '04:00', caudal_m3: 4 },
      { hora: '05:00', caudal_m3: 4.5 },
      { hora: '06:00', caudal_m3: 6 },
      { hora: '07:00', caudal_m3: 7.5 },
      { hora: '08:00', caudal_m3: 9 },
      { hora: '09:00', caudal_m3: 11 },
      { hora: '10:00', caudal_m3: 10 },
      { hora: '11:00', caudal_m3: 9 },
      { hora: '12:00', caudal_m3: 8 },
      { hora: '13:00', caudal_m3: 7 },
      { hora: '14:00', caudal_m3: 6 },
      { hora: '15:00', caudal_m3: 7 },
      { hora: '16:00', caudal_m3: 9 },
      { hora: '17:00', caudal_m3: 12 },
      { hora: '18:00', caudal_m3: 14 },
      { hora: '19:00', caudal_m3: 15 },
      { hora: '20:00' },
      { hora: '21:00' },
      { hora: '22:00' },
      { hora: '23:00' }
    ];
  }

  getConsumoPromedioPorHoraMensual(): { hora: string; caudal_m3?: number }[] {
    return [
      { hora: '00:00', caudal_m3: 5 },
      { hora: '01:00', caudal_m3: 5 },
      { hora: '02:00', caudal_m3: 4.5 },
      { hora: '03:00', caudal_m3: 4.7 },
      { hora: '04:00', caudal_m3: 4.9 },
      { hora: '05:00', caudal_m3: 5.3 },
      { hora: '06:00', caudal_m3: 6 },
      { hora: '07:00', caudal_m3: 7 },
      { hora: '08:00', caudal_m3: 9 },
      { hora: '09:00', caudal_m3: 10 },
      { hora: '10:00', caudal_m3: 11 },
      { hora: '11:00', caudal_m3: 11.5 },
      { hora: '12:00', caudal_m3: 12 },
      { hora: '13:00', caudal_m3: 10 },
      { hora: '14:00', caudal_m3: 9 },
      { hora: '15:00', caudal_m3: 8 },
      { hora: '16:00', caudal_m3: 10 },
      { hora: '17:00', caudal_m3: 12 },
      { hora: '18:00', caudal_m3: 13 },
      { hora: '19:00', caudal_m3: 14 },
      { hora: '20:00' },
      { hora: '21:00' },
      { hora: '22:00' },
      { hora: '23:00' }
    ];
  }



  getConsumoUltimoDia(idHogar: number): Observable<number> {
    const hoy = new Date();
    return this.getConsumoDiarioPorSector(idHogar, hoy).pipe(
      map((reportes: any[]) =>
        reportes.reduce((total, r) => total + Number(r.consumo_total || 0), 0)
      )
    );
  }

  getConsumoPromedio(idHogar: number): Observable<number> {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    return this.getConsumoDiarioPorSector(idHogar, ayer).pipe(
      map((reportes: any[]) =>
        reportes.reduce((total, r) => total + Number(r.consumo_total || 0), 0)
      )
    );
  }
  
  getEstadoMedidores_viejo(): { conectados: number; desconectados: number } {
    return {conectados: 3, desconectados: 1};
  }

  getEstadoMedidores(hogarId: number): Observable<{ conectados: number; desconectados: number }> {
    return this.cuentaService.getSensores(hogarId).pipe(
      map((sensores: Sensor[]) => {
        let conectados = 0;
        let desconectados = 0;
        
        sensores.forEach(sensor => {
          if (sensor.estadoActual && sensor.estadoActual.toUpperCase() === 'ON') {
            conectados++;
          } else {
            desconectados++;
          }
        });
        
        return { conectados, desconectados };
      })
    );
  }

  getTotalMedidoresConectados(): number {
    return 1856;
  }

  getTotalMedidoresDesconectados(): number {
    return 13;
  }

  getTotalHogares(): number {
    return 1257;
  }

  getTotalTriviasCompletadas(): number {
    return 4589;
  }

  descargarReportePDF(id: number, fechaDesde: string | Date, fechaHasta: string | Date) {
    const desde = this.dateUtils.formatDateToJava(fechaDesde);
    const hasta = this.dateUtils.formatDateToJava(fechaHasta);

    const url = `${this.baseUrl}/${id}/descargar-reporte-pdf?fechaInicio=${encodeURIComponent(desde)}&fechaFin=${encodeURIComponent(hasta)}`;
    window.open(url, '_blank');
  }







getConsumoMensualAgrupado(id: number, fechaDesde: string | Date, fechaHasta: string | Date): Observable<any[]> {
  const desde = this.dateUtils.formatDateToJava(fechaDesde);
  const hasta = this.dateUtils.formatDateToJava(fechaHasta);

  const url = `${this.baseUrl}/${id}/consumo-fecha-mensual?fechaInicio=${encodeURIComponent(desde)}&fechaFin=${encodeURIComponent(hasta)}`;

  return this.http.get<any>(url).pipe(
    map((response: any) => {
      return response.consumosMensualesSector.map((item: any) => ({
        mes: item.mes,
        anio: item.anio,        
        totalMes: item.totalMes
      }));
    })
  );
}

  getConsumoPromedioAnterior(): number {
    return 10;
  }

  getConsumoDiaAnterior(): number {
    return 62;
  }


}