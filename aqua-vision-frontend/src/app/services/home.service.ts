import { Injectable } from '@angular/core';
import { BehaviorSubject, delay, filter, map, Observable, of, take } from 'rxjs';
import { UserService } from './user.service';
import { Sector } from '../models/sector';
import { Notification } from '../models/notification';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError } from 'rxjs/operators';

import { Hogar } from '../models/hogar';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private readonly STORAGE_KEY = 'homeId';
  private homeIdSubject: BehaviorSubject<number | null>;
  public homeId$: Observable<number | null>;
  private initialized = false; 

  constructor(private userService: UserService, private http: HttpClient) {
    const storedHomeId = sessionStorage.getItem(this.STORAGE_KEY);
    const initialValue = storedHomeId ? Number(storedHomeId) : null;

    this.homeIdSubject = new BehaviorSubject<number | null>(initialValue);
    this.homeId$ = this.homeIdSubject.asObservable();


  }


  public initHomeId(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    this.userService.getAuthenticatedHomeId().pipe(
      catchError(err => {
        console.warn('HomeService: no se pudo obtener homeId (se ignora):', err);
        return of(null);
      })
    ).subscribe({
      next: (id) => {
        const parsed = id !== null && id !== undefined ? Number(id) : null;
        if (!isNaN(parsed as number) || parsed === null) {
          this.setHomeId(parsed);
        } else {
          console.error('homeService.initHomeId: id recibido no es un número válido:', id);
        }
      },
      error: (err) => {
        console.error('homeService.initHomeId: error no esperado', err);
      }
    });
  }

  public getHomeId(): number | null {
    return this.homeIdSubject.value;
  }

  public setHomeId(id: number | null): void {
    if (id !== null && id !== undefined) {
      sessionStorage.setItem(this.STORAGE_KEY, String(id));
      this.homeIdSubject.next(Number(id));
    } else {
      sessionStorage.removeItem(this.STORAGE_KEY);
      this.homeIdSubject.next(null);
    }
  }

  public clearHomeId(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
    this.homeIdSubject.next(null);
    this.initialized = false;
  }

  /**
   * Espera hasta que exista un homeId válido (no-null, distinto de 0) y emite una vez.
   */
  public waitForHomeId(): Observable<number> {
    return this.homeId$.pipe(
      filter((id): id is number => id !== null && id !== 0),
      take(1),
      map(id => id as number)
    );
  }

  getSectorsByHomeId(homeId: number): Observable<Sector[]> {
    return this.http.get<Sector[]>(`${environment.apiUrl}/hogares/${homeId}/sectores`);
  }

  private apiUrl = environment.apiUrl + '/hogares';

  getPuntosHogar(hogarId: number): Observable<Hogar> {
    return this.http.get<Hogar>(`${this.apiUrl}/${hogarId}/puntos`);
  }

  getHogar(hogarId: number): Observable<Hogar> {
    return this.http.get<Hogar>(`${this.apiUrl}/${hogarId}`);
  }
}