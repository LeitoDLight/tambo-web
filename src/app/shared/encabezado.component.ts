import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../core/auth.service';

/** Barra de navegación responsive: en celular se pliega detrás del botón ☰. */
@Component({
  selector: 'app-encabezado',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-danger mb-4">
      <div class="container">
        <span class="navbar-brand fw-bold">Tambo Market</span>
        <button
          class="navbar-toggler"
          type="button"
          aria-label="Abrir menú"
          (click)="abierto.set(!abierto())"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" [class.show]="abierto()">
          <ul class="navbar-nav me-auto" (click)="abierto.set(false)">
            <li class="nav-item">
              <a class="nav-link" routerLink="/productos" routerLinkActive="active">Productos</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/categorias" routerLinkActive="active">Categorías</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/ventas/nueva" routerLinkActive="active">Nueva venta</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/ventas" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Ventas</a>
            </li>
            @if (esAdmin) {
              <li class="nav-item">
                <a class="nav-link" routerLink="/alertas" routerLinkActive="active">Alertas</a>
              </li>
            }
          </ul>
          <div class="d-flex align-items-center gap-3 py-2 py-lg-0">
            <span class="navbar-text text-white">{{ usuario?.username }} ({{ usuario?.rol }})</span>
            <button class="btn btn-sm btn-outline-light" (click)="salir()">Cerrar sesión</button>
          </div>
        </div>
      </div>
    </nav>
  `,
})
export class EncabezadoComponent {
  private auth = inject(AuthService);
  usuario = this.auth.getUsuario();
  esAdmin = this.auth.esAdmin();
  abierto = signal(false);

  salir(): void {
    this.auth.logout();
  }
}
