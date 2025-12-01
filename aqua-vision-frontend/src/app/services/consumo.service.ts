import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PrediccionPorDia } from '../models/prediction/prediccionPorDia';
import { SectorProyeccion } from '../models/prediction/sectorProyeccion';
import { environment } from '../../environments/environment';

export interface ConsumoPorHora {
  hora: string;
  caudal_m3?: number;
}

export interface ConsumoSector {
  id: number;
  nombre: string;
  consumos: ConsumoPorHora[];
}

export interface Evento {
  nombre: string;
  hora: string;
  caudal: number;
}
export interface EventoSector {
  id: number;
  nombre: string;
  eventos: { hora: string; descripcion: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class ConsumoService {

  private readonly baseUrl = environment.apiUrl + '/reportes';
    constructor(private http: HttpClient) {}

  getConsumosPorHoraPorSector(): ConsumoSector[] {
    return [
      {
        id: 15,
        nombre: 'Sector A',
        consumos: [
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
          { hora: '19:00', caudal_m3: 10 },
          { hora: '20:00', caudal_m3: 3 },
          { hora: '21:00', caudal_m3: 1 },
          { hora: '22:00', caudal_m3: 0.5 },
          { hora: '23:00', caudal_m3: 0 },
          { hora: '24:00', caudal_m3: 0 },
        ]
      },
      {
        id: 15,
        nombre: 'Sector B',
        consumos: [
          { hora: '00:00', caudal_m3: 2 },
          { hora: '01:00', caudal_m3: 3 },
          { hora: '02:00', caudal_m3: 5 },
          { hora: '03:00', caudal_m3: 4 },
          { hora: '04:00', caudal_m3: 6 },
          { hora: '05:00', caudal_m3: 7 },
          { hora: '06:00', caudal_m3: 8 },
          { hora: '07:00', caudal_m3: 12 },
          { hora: '08:00', caudal_m3: 9 },
          { hora: '09:00', caudal_m3: 15 },
          { hora: '13:00', caudal_m3: 4 },
          { hora: '14:00', caudal_m3: 7 },
          { hora: '15:00', caudal_m3: 8 },
          { hora: '16:00', caudal_m3: 11 },
          { hora: '17:00', caudal_m3: 10 },
          { hora: '18:00', caudal_m3: 12 },
          { hora: '19:00', caudal_m3: 15 },
          { hora: '20:00', caudal_m3: 12 },
          { hora: '21:00', caudal_m3: 4 },
          { hora: '22:00', caudal_m3: 3 },
          { hora: '23:00', caudal_m3: 0 },
          { hora: '24:00', caudal_m3: 0 },
        ]
      }
    ];
  }

getEventosDeLosSectores(hogarId: number | null): Observable<EventoSector[]> {
  return this.http.get<EventoSector[]>(`${environment.apiUrl}/hogares/${hogarId}/sectores-eventos`).pipe(
    tap(response => {
      console.log('📦 Respuesta del backend (eventos por sectores):', response);
    })
  );
}

getEventos(): Observable<any[]> {
  return this.http.get<any[]>(`${environment.apiUrl}/eventos`).pipe(
    tap(res => console.log('📦 Eventos del backend:', res))
  );
}


getPrediccionPorDia(id: number): Observable<PrediccionPorDia> {
  const url = `${this.baseUrl}/1/proyeccion-grafico`;
  return this.http.get<PrediccionPorDia>(url);
}

getPrediccionConsumoPorDia(hogarId: number): Observable<PrediccionPorDia[]> {
  const url = `${this.baseUrl}/${hogarId}/proyeccion-grafico`;

  return this.http.get<{ hogarId: number; proyeccionSectores: any[] }>(url).pipe(
    map((response) => {
      if (!response?.proyeccionSectores) return [];

      return response.proyeccionSectores.map((sector) => {
        const puntos = sector.puntos ?? [];

        return {
          nombre_sector: sector.nombreSector,
          dias: (puntos as any[]).map((p: any) => p.dia),
          consumoHistorico: (puntos as any[]).map((p: any) => p.consumoHistorico ?? 0),
          consumoActual: (puntos as any[]).map((p: any) => p.consumoActual ?? 0),
          consumoProyectado: (puntos as any[]).map((p: any) => p.consumoProyectado ?? 0),
          tendenciaMin: (puntos as any[]).map((p: any) => p.tendenciaMin ?? 0),
          tendenciaMax: (puntos as any[]).map((p: any) => p.tendenciaMax ?? 0),
          hallazgosClave: sector.hallazgosClave ?? [],
        };

      });
    }),
    catchError((err) => {
      console.error('Error en getPrediccionConsumoPorDia:', err);
      return of([]);
    })
  );
}


getConsumosPorHoraYSector(hogarId: number, dia: string): Observable<any> {
  const url = `${this.baseUrl}/${hogarId}/consumo-dia-hora-sectores?dia=${encodeURIComponent(dia)}`;
  return this.http.get<any>(url).pipe(
    tap(res => console.log('📦 Respuesta del backend (consumo por hora y sectores):', res))
  );
}


/*
getSensoresUsuario(idUsuario: number): Observable<Sensor[]> {
  return this.http.get<Sensor[]>(`${this.apiUrl}/sensores/usuario/${idUsuario}`);
}
*/

}
