// src/app/interceptors/error.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../auth/serviceAuth/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        
        switch (error.status) {
          case 401:
            this.authService.logout();
            this.snackBar.open('Pruebe iniciando sesión nuevamente', 'Cerrar', {
              duration: 4000
            });
            this.router.navigate(['/login']);
            break;

          case 403:
            this.snackBar.open('No tiene permisos para realizar esta acción.', 'Cerrar', {
              duration: 4000
            });
            break;

          case 404:
            this.snackBar.open('Recurso no encontrado.', 'Cerrar', {
              duration: 3000
            });
            this.router.navigate(['/404']);
            break;

          default:
            this.snackBar.open('Ocurrió un error inesperado.', 'Cerrar', {
              duration: 3000
            });
            break;
        }

        return throwError(() => error);
      })
    );
  }
}
