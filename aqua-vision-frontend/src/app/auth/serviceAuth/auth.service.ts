import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { username, password });
  }


  setToken(token: string): void {
    sessionStorage.setItem('token', token);
  }


  getToken(): string | null {
    const token = sessionStorage.getItem('token');
    return token;

  }

  isLoggedIn(): boolean {
    return !!this.getToken();
    // return true;
  }

  logout(): void {
    sessionStorage.removeItem('token');
  }

  private decodeToken(): any {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64);
      return JSON.parse(payloadJson);
    } catch (e) {
      console.error('Error decodificando token', e);
      return null;
    }
  }


  isAdmin(): boolean {
    const decoded = this.decodeToken();
    if (!decoded || !decoded.authorities) return false;
    let roles = decoded.authorities;
    if (typeof roles === 'string') {
      try {
        roles = JSON.parse(roles);
      } catch {
        return false;
      }
    }
    return roles.some((r: any) => r.authority === 'ROLE_ADMIN');
  }

  isUser(): boolean {
    const decoded = this.decodeToken();
    if (!decoded || !decoded.authorities) return false;

    let roles = decoded.authorities;
    if (typeof roles === 'string') {
      try {
        roles = JSON.parse(roles);
      } catch {
        return false;
      }
    }
    return roles.some((r: any) => r.authority === 'ROLE_USER');
  }
}
