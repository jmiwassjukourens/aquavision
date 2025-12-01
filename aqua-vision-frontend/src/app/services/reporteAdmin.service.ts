
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';


export interface EventTag {
  id: number;
  nombre: string;
  color: string;
}

export interface AquaEvent {
  id?: number;
  titulo: string;
  descripcion?: string;
  fechaInicio?: string; 
  fechaFin?: string | null;
  estado: string;
  tags: EventTag[];
  sector?: any;
  litrosConsumidos?: number;
  costo?: number;
  hogarId?: number;
  localidad?: string;
}

export interface Hogar {
  id: number;
  miembros: number;
  localidad: string;
  email: string;
  nombre: string;
  tipoHogar?: string;
  direccion?: string;
  ambientes?: number;
  tienePatio?: boolean;
  tienePileta?: boolean;
  facturacion?: any;
}

export interface ConsumoPorHoraDTO {
  hora: number;   
  consumo: number;
}

export interface ConsumosPorHoraHogarDTO {
  hogarId: number;
  fechaDesde: string;    
  fechaHasta: string;    
  fechaGeneracion: string;
  consumoTotal: number;
  consumosPorHora: ConsumoPorHoraDTO[];
}

export interface ReportAdminDashboardDTO {
  consumoPromHoy: number;
  consumoPromAyer: number;
  trivias: number; 
  eventos: number; 
}


@Injectable({ providedIn: 'root' })
export class ReporteAdminService {

  private readonly baseUrl = environment.apiUrl + '/reportes/admin';

  private tags: EventTag[] = [
    { id: 1, nombre: 'Limpieza', color: '#2F80ED' },
    { id: 2, nombre: 'Pileta', color: '#27AE60' },
    { id: 3, nombre: 'Riego', color: '#F2C94C' },
    { id: 4, nombre: 'Jardín', color: '#EB5757' },
    { id: 5, nombre: 'Mantenimiento', color: '#9B51E0' },
    { id: 6, nombre: 'Baño', color: '#56CCF2' },
    { id: 7, nombre: 'Cocina', color: '#F2994A' },
    { id: 8, nombre: 'Lavado', color: '#27AE60' },
    { id: 9, nombre: 'Autos', color: '#8E44AD' },
    { id: 10, nombre: 'Terraza', color: '#FF7F50' }
  ];

  private hogares: Hogar[] = [
    { id: 1, miembros: 3, localidad: 'Palermo', email: 'a@h.com', nombre: 'Hogar A', ambientes: 3, tienePileta: false, tienePatio: true },
    { id: 2, miembros: 4, localidad: 'Belgrano', email: 'b@h.com', nombre: 'Hogar B', ambientes: 4, tienePileta: true, tienePatio: true },
    { id: 3, miembros: 2, localidad: 'Caballito', email: 'c@h.com', nombre: 'Hogar C', ambientes: 2, tienePileta: false, tienePatio: false },
    { id: 4, miembros: 5, localidad: 'Palermo', email: 'd@h.com', nombre: 'Hogar D', ambientes: 5, tienePileta: true, tienePatio: true },
    { id: 5, miembros: 1, localidad: 'Recoleta', email: 'e@h.com', nombre: 'Hogar E', ambientes: 1, tienePileta: false, tienePatio: false }
  ];

  

  // Mock eventos distribuidos en últimos 60 días
  private eventos: AquaEvent[] = (() => {
    const events: AquaEvent[] = [];
    const now = new Date();
    for (let i = 0; i < 120; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const d = new Date(now);
      d.setDate(now.getDate() - daysAgo);
      d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

      const tag = this.tags[Math.floor(Math.random() * this.tags.length)];
      const litros = Math.round((Math.random() * 300 + 10) * 100) / 100;
      const costo = Math.round(litros * (0.15 + Math.random() * 0.25) * 100) / 100;

      const hogar = this.hogares[Math.floor(Math.random() * this.hogares.length)];

      events.push({
        id: i + 1,
        titulo: `${tag.nombre} evento ${i + 1}`,
        descripcion: `Evento ${i + 1} tipo ${tag.nombre}`,
        fechaInicio: d.toISOString(),
        estado: 'FINALIZADO',
        tags: [tag],
        litrosConsumidos: litros,
        costo,
        hogarId: hogar.id,
        localidad: hogar.localidad
      });
    }
    return events;
  })();

  constructor(private http: HttpClient) { }

  descargarReporteConsumoPDF(fechaDesde: string, fechaHasta: string): void {
    const url = `${this.baseUrl}/consumo/descargar-pdf?fechaInicio=${fechaDesde}&fechaFin=${fechaHasta}`;
    window.open(url, '_blank');
  }




getConsumoGlobalPorPeriodo(desdeIso: string, hastaIso: string) {
  const params = new HttpParams()
    .set('fechaInicio', desdeIso)
    .set('fechaFin', hastaIso);

  console.log('getConsumoGlobalPorPeriodo params:', params.toString());

  return this.http.get<{ fecha: string; totalLitros: number; costo: number }[]>(
    `${this.baseUrl}/consumo/periodo`,
    { params }
  );
}

getResumenConsumoGlobal(desdeIso: string, hastaIso: string) {
  const params = new HttpParams()
    .set('fechaInicio', desdeIso)
    .set('fechaFin', hastaIso);

  console.log('getResumenConsumoGlobal params:', params.toString());

  return this.http.get<{ total: number; media: number; pico: number; costo: number }>(
    `${this.baseUrl}/consumo/resumen`,
    { params }
  );
}

  getEventosFiltro(desdeIso?: string, hastaIso?: string, tagIds?: number[]): Observable<AquaEvent[]> {
    let params = new HttpParams()
      .set('fechaInicio', desdeIso || '')
      .set('fechaFin', hastaIso || '');
    if (tagIds && tagIds.length) {
      tagIds.forEach(id => params = params.append('tagIds', String(id)));
    }
    console.log('GET /eventos params:', params.toString());
    const url = `${this.baseUrl}/eventos`;
    return this.http.get<AquaEvent[]>(url, { params });
  }

    getResumenEventos(desdeIso: string, hastaIso: string): Observable<{ totalEventos: number; totalLitros: number; totalCosto: number; tagsActivos: number }> {
    const params = new HttpParams().set('fechaInicio', desdeIso).set('fechaFin', hastaIso);
    return this.http.get<any>(`${this.baseUrl}/eventos/resumen`, { params });
  }

    getRankingTags(desdeIso: string, hastaIso: string, tagIds?: number[]): Observable<any[]> {
    let params = new HttpParams().set('fechaInicio', desdeIso).set('fechaFin', hastaIso);
    if (tagIds && tagIds.length) tagIds.forEach(id => params = params.append('tagIds', String(id)));
    return this.http.get<any[]>(`${this.baseUrl}/eventos/ranking`, { params });
  }

    getEventosPorDia(desdeIso: string, hastaIso: string): Observable<{ fecha: string, count: number }[]> {
    const params = new HttpParams().set('fechaInicio', desdeIso).set('fechaFin', hastaIso);
    return this.http.get<any[]>(`${this.baseUrl}/eventos/por-dia`, { params });
  }

  // Lista de tags
  getTags(): Observable<EventTag[]> {
    return of(this.tags);
  }

getConsumoPorLocalidad(desdeIso: string, hastaIso: string): Observable<{ localidad: string, total: number, media: number, costo: number, hogares: number }[]> {
  const url = `${this.baseUrl}/localidad?fechaInicio=${encodeURIComponent(desdeIso)}&fechaFin=${encodeURIComponent(hastaIso)}`;
  return this.http.get<any[]>(url);
}

  getDashboard(): Observable<ReportAdminDashboardDTO> {
    return this.http.get<ReportAdminDashboardDTO>(`${this.baseUrl}/dashboard`);
  }

getConsumoPromedioPorHogar(fechaIso: string): Observable<number> {
  const fechaOnly = (fechaIso || '').split('T')[0];
  const hoy = new Date().toISOString().split('T')[0];
  const ayerDt = new Date();
  ayerDt.setDate(new Date().getDate() - 1);
  const ayer = ayerDt.toISOString().split('T')[0];

  if (fechaOnly === hoy) return of(2.48);      // m³ promedio por hogar hoy
  if (fechaOnly === ayer) return of(2.70);     // m³ promedio por hogar ayer
  return of(2.50);                             // valor por defecto
}


getConsumoTotalPorDia(fechaIso: string): Observable<number> {
  const hogaresCount = this.hogares.length || 1;
  const fechaOnly = (fechaIso || '').split('T')[0];
  const hoy = new Date().toISOString().split('T')[0];
  const ayerDt = new Date();
  ayerDt.setDate(new Date().getDate() - 1);
  const ayer = ayerDt.toISOString().split('T')[0];

  if (fechaOnly === hoy) return of(Math.round((2.48 * hogaresCount) * 1000) / 1000); 
  if (fechaOnly === ayer) return of(Math.round((2.70 * hogaresCount) * 1000) / 1000); 
  return of(Math.round((2.50 * hogaresCount) * 1000) / 1000);
}


getTotalTriviasCompletadas(): Observable<number> {
  return of(18); // valor fijo mock
}

getTotalEventos(): Observable<number> {
  return of(this.eventos.length);
}


getNotificacionesCount(): Observable<number> {
  return of(4); // valor fijo mock
}



 getConsumoPorHoraTotal(fecha: string): Observable<{ hora: string; caudal_m3: number }[]> {

    const onlyDate = (fecha || '').split('T')[0];

    const params = new HttpParams().set('dia', onlyDate);

    return this.http.get<ConsumosPorHoraHogarDTO>(`${this.baseUrl}/consumo-dia-hora`, { params }).pipe(
      map(dto => {
        if (!dto || !dto.consumosPorHora) return [];
        return dto.consumosPorHora.map(h => ({
          hora: String(h.hora).padStart(2, '0') + ':00',
          caudal_m3: h.consumo 
        }));
      }),
      catchError(err => {
        console.error('Error al pedir consumo por hora', err);
        return of([]);
      })
    );
  }

 getPuntosPorPeriodo(desdeIso: string, hastaIso: string): Observable<{ fecha: string; puntos: number }[]> {
    const url = `${this.baseUrl}/gamificacion/puntos-periodo?fechaInicio=${encodeURIComponent(desdeIso)}&fechaFin=${encodeURIComponent(hastaIso)}`;
    return this.http.get<any[]>(url);
  }

  getResumenGamificacion(desdeIso: string, hastaIso: string): Observable<{ total: number; media: number; mejorRacha: number }> {
    const url = `${this.baseUrl}/gamificacion/resumen?fechaInicio=${encodeURIComponent(desdeIso)}&fechaFin=${encodeURIComponent(hastaIso)}`;
    return this.http.get<any>(url);
  }

  getRankingPuntos(desdeIso: string, hastaIso: string): Observable<any[]> {
    const url = `${this.baseUrl}/gamificacion/ranking-puntos?fechaInicio=${encodeURIComponent(desdeIso)}&fechaFin=${encodeURIComponent(hastaIso)}`;
    return this.http.get<any[]>(url);
  }

  getRankingRachas(desdeIso: string, hastaIso: string): Observable<any[]> {
    const url = `${this.baseUrl}/gamificacion/ranking-rachas?fechaInicio=${encodeURIComponent(desdeIso)}&fechaFin=${encodeURIComponent(hastaIso)}`;
    return this.http.get<any[]>(url);
  }

  getHogares(): Observable<any[]> {
    const url = `${this.baseUrl}/gamificacion/hogares`;
    return this.http.get<any[]>(url);
  }

  getMedallasPorHogar(hogarId: number): Observable<string[]> {
    const url = `${this.baseUrl}/gamificacion/hogares/${hogarId}/medallas`;
    return this.http.get<string[]>(url);
  }

  descargarReporteGamificacionPDF(fechaDesde: string, fechaHasta: string): void {
    const url = `${this.baseUrl}/gamificacion/descargar-pdf?fechaInicio=${encodeURIComponent(fechaDesde)}&fechaFin=${encodeURIComponent(fechaHasta)}`;
    window.open(url, '_blank');
  }


descargarReporteEventosPDF(fechaDesde: string, fechaHasta: string, tagIds?: number[]): void {
  const params = [];
  params.push(`fechaInicio=${encodeURIComponent(fechaDesde)}`);
  params.push(`fechaFin=${encodeURIComponent(fechaHasta)}`);
  if (tagIds && tagIds.length) {

    tagIds.forEach(id => params.push(`tagIds=${encodeURIComponent(String(id))}`));
  }
  const url = `${this.baseUrl}/eventos/descargar-pdf?${params.join('&')}`;
  window.open(url, '_blank');
}


descargarReporteLocalidadPDF(fechaDesde: string, fechaHasta: string): void {
  const params = `fechaInicio=${encodeURIComponent(fechaDesde)}&fechaFin=${encodeURIComponent(fechaHasta)}`;
  const url = `${this.baseUrl}/localidad/descargar-pdf?${params}`;
  window.open(url, '_blank');
}



}
