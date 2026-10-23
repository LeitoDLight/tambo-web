import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Cliente, ClienteRequest } from '../models/cliente.model';
import { API_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);
  private url = `${API_URL}/clientes`;

  buscarPorDni(dni: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.url}/dni/${dni}`);
  }

  crear(datos: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.url, datos);
  }
}
