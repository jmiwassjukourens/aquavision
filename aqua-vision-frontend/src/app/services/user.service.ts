import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class UserService {

  private urlBackend = environment.apiUrl + '/users'

  constructor(private http: HttpClient) { 

  }

  findAll(): Observable<User[]> {
    return this.http.get(this.urlBackend).pipe(
      map((response: any) => response as User[])
    );
  }

  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBackend}/${id}`);
  }

  create(user: User): Observable<User> {
    return this.http.post<User>(this.urlBackend, user).pipe(
      map((response: any) => response as User)
    );
  }

  update(user: User): Observable<User> {
    return this.http.put<User>(`${this.urlBackend}/${user.id}`, user).pipe(
      map((response: any) => response as User)
    );
  }

getAuthenticatedHomeId(): Observable<number | null> {
  return this.http.get<number>(`${this.urlBackend}/authenticatedId`).pipe(
    catchError(err => {
      if (err && (err.status === 401 || err.status === 403)) {
        return of(null);
      }
      // opcional: rethrow si querés que otros errores no se silencien
      return throwError(() => err);
    })
  );
}

  getAuthenticatedUser(): Observable<User> {
    return this.http.get<User>(`${this.urlBackend}/me`);
  }
}
