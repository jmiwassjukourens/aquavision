import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AquaEvent } from '../models/aquaEvent'; 
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly apiUrl = environment.apiUrl + '/eventos'; 

  constructor(private http: HttpClient) {}

  getEvents(): Observable<AquaEvent[]> {
    return this.http.get<AquaEvent[]>(this.apiUrl);
  }

  getEventById(id: number): Observable<AquaEvent> {
    return this.http.get<AquaEvent>(`${this.apiUrl}/${id}`);
  }

  createEvent(event: AquaEvent): Observable<AquaEvent> {
    return this.http.post<AquaEvent>(this.apiUrl, event);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateEvent(updatedEvent: AquaEvent): Observable<AquaEvent> {
    return this.http.put<AquaEvent>(this.apiUrl, updatedEvent);
  }
}
