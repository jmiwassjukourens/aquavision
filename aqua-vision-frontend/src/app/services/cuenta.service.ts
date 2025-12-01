import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user';
import { Hogar } from '../models/hogar';
import { Facturacion } from '../models/facturacion';
import { Sensor } from '../models/sensor';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CuentaService {

  private apiUrl = environment.apiUrl + '/cuenta';

  constructor(private http: HttpClient) { }

  getUsuario(hogarId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${hogarId}/usuario`);
  }

  getHogar(hogarId: number): Observable<Hogar> {
    return this.http.get<Hogar>(`${this.apiUrl}/${hogarId}/hogar`);
  }

  getFacturacion(hogarId: number): Observable<Facturacion> {
    return this.http.get<Facturacion>(`${this.apiUrl}/${hogarId}/facturacion`);
  }

  getSensores(hogarId: number): Observable<Sensor[]> {
    return this.http.get<Sensor[]>(`${this.apiUrl}/${hogarId}/sensores`);
  }
}
