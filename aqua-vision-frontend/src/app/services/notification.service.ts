import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification } from '../models/notification';



@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly baseUrl = `${environment.apiUrl}/notificaciones`;

  constructor(private http: HttpClient) {}


  getNotifications(homeId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/${homeId}`);
  }

  getUnreadNotifications(homeId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/${homeId}/no-leidas`);
  }


  createNotification(homeId: number, payload: Partial<Notification>): Observable<Notification> {
    return this.http.post<Notification>(`${this.baseUrl}/${homeId}`, payload);
  }

  markAsRead(homeId: number, notificationId: number): Observable<Notification> {
    return this.http.put<Notification>(`${this.baseUrl}/${homeId}/${notificationId}/leer`, {});
  }


  markAllAsRead(homeId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${homeId}/leer-todas`, {});
  }


  deleteNotification(homeId: number, notificationId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${homeId}/${notificationId}`);
  }


  deleteAllNotifications(homeId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${homeId}`);
  }

    getUnreadCount(homeId: number): Observable<number> {
    return this.http.get<Notification[]>(`${this.baseUrl}/${homeId}/no-leidas`).pipe(
      map((notificaciones: Notification[]) => notificaciones.length),
      catchError(err => {
        console.error('Error obteniendo no leídas', err);
        return of(0);
      })
    );
  }
}
