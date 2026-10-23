import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { mensajeError } from '../../core/error.util';
import { VentaService } from '../../core/venta.service';
import { Venta } from '../../models/venta.model';
import { EncabezadoComponent } from '../../shared/encabezado.component';
import { BoletaComponent } from './boleta.component'; // NUEVO: comprobante imprimible

@Component({
  selector: 'app-venta-list',
  imports: [EncabezadoComponent, RouterLink, DatePipe, DecimalPipe, BoletaComponent], // NUEVO: BoletaComponent
  template: `
    <app-encabezado />
    <div class="container">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">Ventas</h3>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" (click)="cargar()">Actualizar</button>
          <a class="btn btn-primary" routerLink="/ventas/nueva">+ Nueva venta</a>
        </div>
      </div>

      @if (error()) {
        <div class="alert alert-danger py-2">{{ error() }}</div>
      }

      @if (cargando()) {
        <p class="text-muted">Cargando...</p>
      } @else if (ventas().length === 0) {
        <p class="text-muted">Todavía no hay ventas.</p>
      } @else {
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Cajero</th>
                <th class="text-end">Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (v of ventas(); track v.id) {
                <tr>
                  <td>{{ v.id }}</td>
                  <td>{{ v.fechaHora | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td>{{ v.clienteNombres }}</td>
                  <td>{{ v.cajero }}</td>
                  <td class="text-end">S/ {{ v.total | number: '1.2-2' }}</td>
                  <td>
                    <span
                      class="badge"
                      [class.text-bg-success]="v.estado === 'PROCESADA'"
                      [class.text-bg-warning]="v.estado === 'REGISTRADA'"
                    >
                      {{ v.estado }}
                    </span>
                  </td>
                  <td class="text-end text-nowrap">
                    <!-- NUEVO: abre el comprobante (boleta/factura) de esta venta -->
                    <button class="btn btn-sm btn-outline-dark me-1" (click)="comprobante.set(v)">
                      Comprobante
                    </button>
                    <button class="btn btn-sm btn-outline-primary" (click)="alternar(v.id)">
                      {{ abierta() === v.id ? 'Ocultar' : 'Detalle' }}
                    </button>
                  </td>
                </tr>
                @if (abierta() === v.id) {
                  <tr>
                    <td colspan="7" class="bg-light">
                      <table class="table table-sm mb-0">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th class="text-end">Cantidad</th>
                            <th class="text-end">Precio</th>
                            <th class="text-end">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (d of v.detalles; track d.productoId) {
                            <tr>
                              <td>{{ d.productoNombre }}</td>
                              <td class="text-end">{{ d.cantidad }}</td>
                              <td class="text-end">S/ {{ d.precioUnitario | number: '1.2-2' }}</td>
                              <td class="text-end">S/ {{ d.subtotal | number: '1.2-2' }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- NUEVO: ventana del comprobante (solo aparece si hay una venta seleccionada) -->
    @if (comprobante(); as c) {
      <app-boleta [venta]="c" (cerrar)="comprobante.set(null)" />
    }
  `,
})
export class VentaListComponent implements OnInit {
  private ventaService = inject(VentaService);

  ventas = signal<Venta[]>([]);
  cargando = signal(true);
  abierta = signal<number | null>(null);
  error = signal('');
  comprobante = signal<Venta | null>(null); // NUEVO: venta cuyo comprobante se está mostrando

  ngOnInit(): void {
    this.cargar();
  }

  alternar(id: number): void {
    this.abierta.update((actual) => (actual === id ? null : id));
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.ventaService.listar().subscribe({
      next: (lista) => {
        this.ventas.set(lista);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudieron cargar las ventas'));
        this.cargando.set(false);
      },
    });
  }
}
