import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { LoginRequest, LoginResponse, UsuarioSesion } from '../models/auth.model';
import { API_URL } from './api.config';

const TOKEN_KEY = 'tambo_token';
const USUARIO_KEY = 'tambo_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  login(datos: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, datos).pipe(
      tap((resp) => {
        localStorage.setItem(TOKEN_KEY, resp.token);
        localStorage.setItem(
          USUARIO_KEY,
          JSON.stringify({ username: resp.username, rol: resp.rol }),
        );
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUsuario(): UsuarioSesion | null {
    const texto = localStorage.getItem(USUARIO_KEY);
    if (!texto) {
      return null;
    }
    try {
      return JSON.parse(texto) as UsuarioSesion;
    } catch {
      return null;
    }
  }

  esAdmin(): boolean {
    return this.getUsuario()?.rol === 'ADMIN';
  }
}
