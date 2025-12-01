import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { EventTag } from '../models/eventTag';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class TagService {
  private readonly apiUrl = environment.apiUrl + '/tags';

  constructor(private http: HttpClient) {}

  getTags(): Observable<EventTag[]> {
    return this.http.get<EventTag[]>(this.apiUrl);
  }

  createTag(tag: EventTag): Observable<EventTag> {
    return this.http.post<EventTag>(this.apiUrl, tag);
  }

  deleteTag(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
