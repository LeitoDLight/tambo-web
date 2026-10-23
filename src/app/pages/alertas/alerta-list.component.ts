import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { AlertaService } from '../../core/alerta.service';
import { mensajeError } from '../../core/error.util';
import { Alerta } from '../../models/alerta.model';
import { EncabezadoComponent } from '../../shared/encabezado.component';

@Component({
  selector: 'app-alerta-list',
  imports: [EncabezadoComponent, DatePipe],
  template: `
    <app-encabezado />
    <div class="container">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">Alertas de stock bajo</h3>
        <button class="btn btn-outline-secondary" (click)="cargar()">Actualizar</button>
      </div>

      @if (error()) {
        <div class="alert alert-danger py-2">{{ error() }}</div>
      }

      @if (cargando()) {
        <p class="text-muted">Cargando...</p>
      } @else if (alertas().length === 0) {
        <p class="text-muted">No hay alertas de stock bajo.</p>
      } @else {
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Producto</th>
                <th class="text-end">Stock actual</th>
              </tr>
            </thead>
            <tbody>
              @for (a of alertas(); track a.id) {
                <tr>
                  <td>{{ a.id }}</td>
                  <td>{{ a.fechaHora | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td>{{ a.productoNombre }} <span class="text-muted small">(ID {{ a.productoId }})</span></td>
                  <td class="text-end">
                    <span class="badge" [class.text-bg-danger]="a.stockActual === 0" [class.text-bg-warning]="a.stockActual > 0">
                      {{ a.stockActual }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AlertaListComponent implements OnInit {
  private alertaService = inject(AlertaService);

  alertas = signal<Alerta[]>([]);
  cargando = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.alertaService.listar().subscribe({
      next: (lista) => {
        this.alertas.set(lista);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudieron cargar las alertas'));
        this.cargando.set(false);
      },
    });
  }
}
