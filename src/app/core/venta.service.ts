import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Venta, VentaRequest } from '../models/venta.model';
import { API_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private http = inject(HttpClient);
  private url = `${API_URL}/ventas`;

  listar(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.url);
  }

  registrar(datos: VentaRequest): Observable<Venta> {
    return this.http.post<Venta>(this.url, datos);
  }
}
