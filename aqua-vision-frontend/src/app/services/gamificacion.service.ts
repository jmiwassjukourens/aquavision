import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RankingResponse, Recompensa } from '../models/gamificacion';
import { environment } from '../../environments/environment';
import { Logro } from '../models/logro';
import { Medalla } from '../models/medalla';

import { Desafio, HogarDesafiosResponse, DesafioHogarApi } from '../models/desafio';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GamificacionService {
  private baseUrl = environment.apiUrl + '/hogares';

  constructor(private http: HttpClient) {}

getRanking(hogarId: number): Observable<RankingResponse> {
  return this.http.get<RankingResponse>(`${this.baseUrl}/ranking/${hogarId}`);
}

getRankingGeneral(): Observable<RankingResponse> {
  return this.http.get<RankingResponse>(`${this.baseUrl}/ranking/`);
}


  getRecompensas(): Observable<Recompensa[]> {
    return this.http.get<Recompensa[]>(`${this.baseUrl}/recompensas`);
  }

  canjearRecompensa(hogarId: number, recompensaId: number): Observable<{ nuevoPuntaje: number, estado: string, fechaCanjeo?: string }> {
    console.log('canjeando recompensa: ', recompensaId);
    return this.http.post<{ nuevoPuntaje: number, estado: string, fechaCanjeo?: string }>(
      `${this.baseUrl}/${hogarId}/recompensas/${recompensaId}`, {}
    );
  }

  addPuntosReclamados(hogarId: number, puntos: number, minijuego: string, escena?: string): Observable<any> {
    const dto = {
      hogarId,
      puntos,
      fecha: new Date(),
      minijuego, 
      escena
    }; //TODO pasar a model 
    return this.http.post(`${this.baseUrl}/${hogarId}/reclamar-puntos`, dto);
  }

  getUltimaFechaReclamo(hogarId: number, minijuego: string, escena: string): Observable<Date | null> {
    return this.http.get<Date | null>(
      `${this.baseUrl}/${hogarId}/ultimo-puntaje-reclamado`,
      { params: { minijuego, escena } }
    );
  }

  getLogros(hogarId: number): Observable<Logro[]> {
    return this.http.get<Logro[]>(`${this.baseUrl}/${hogarId}/logros`);
  }

  getMedallas(hogarId: number): Observable<Medalla[]> {
    return this.http.get<Medalla[]>(`${this.baseUrl}/${hogarId}/medallas`);
  }

  getDesafiosPorHogar(hogarId: number): Observable<Desafio[]> {
    return this.http.get<HogarDesafiosResponse>(`${this.baseUrl}/${hogarId}/desafios`)
      .pipe(
        map(response => 
          response.desafiosHogar.map(
            (desafioHogarApi: DesafioHogarApi) => new Desafio(desafioHogarApi)
          )
        )
      );
  }

  reclamarPuntosDesafio(hogarId: number, idDesafioHogar: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${hogarId}/desafios/${idDesafioHogar}/reclamar`, null, { responseType: 'text' as 'json' });
  }

}
