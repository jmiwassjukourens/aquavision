import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { Medicion } from '../models/medicion';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MedicionService {

    private apiUrl = environment.apiUrl + '/mediciones'; 

    constructor(private http: HttpClient) { }

    /**
     * Obtiene las mediciones de caudal de un sector en los últimos N minutos.
     * @param sectorId El ID del sector/sensor (ej: 7).
     * @param minutos La ventana de tiempo a consultar (por defecto 60).
     * @returns Un Observable con un array de objetos Medicion.
     */
    getUltimasMediciones(sectorId: number, minutos: number = 60): Observable<Medicion[]> {
        
        const url = `${this.apiUrl}/sector/${sectorId}/ultimas?minutos=${minutos}`;
        
        console.log(`[DEBUG SERVICE] 🚀 Llamando a la API: ${url}`);
    
        return this.http.get<any[]>(url).pipe(
            map(response => response || []), // Mapea null (de 204) a []
            catchError((error: HttpErrorResponse) => {
                if (error.status === 204) {
                    // Éxito: retorna un array vacío, no un error.
                    return of([]); 
                }
                // Fallo REAL: relanzamos el error para que el componente lo capture.
                return throwError(() => error); 
            })
        );
    }
}