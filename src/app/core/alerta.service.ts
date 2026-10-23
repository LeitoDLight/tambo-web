import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Alerta } from '../models/alerta.model';
import { API_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class AlertaService {
  private http = inject(HttpClient);
  private url = `${API_URL}/alertas`;

  listar(): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(this.url);
  }
}
