import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/error.util';
import { ProductoService } from '../../core/producto.service';
import { Producto } from '../../models/catalogo.model';
import { EncabezadoComponent } from '../../shared/encabezado.component';

@Component({
  selector: 'app-producto-list',
  imports: [EncabezadoComponent, FormsModule, RouterLink, DecimalPipe],
  template: `
    <app-encabezado />
    <div class="container">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">Productos</h3>
        @if (esAdmin) {
          <a class="btn btn-primary" routerLink="/productos/nuevo">+ Nuevo producto</a>
        }
      </div>

      <form class="input-group mb-3" style="max-width: 420px" (ngSubmit)="buscar()">
        <input
          class="form-control"
          placeholder="Buscar por nombre"
          name="busqueda"
          [(ngModel)]="busqueda"
        />
        <button class="btn btn-outline-secondary" type="submit">Buscar</button>
        @if (busqueda) {
          <button class="btn btn-outline-secondary" type="button" (click)="limpiar()">✕</button>
        }
      </form>

      @if (mensaje()) {
        <div class="alert alert-success py-2">{{ mensaje() }}</div>
      }
      @if (error()) {
        <div class="alert alert-danger py-2">{{ error() }}</div>
      }

      @if (cargando()) {
        <p class="text-muted">Cargando...</p>
      } @else if (productos().length === 0) {
        <p class="text-muted">No hay productos para mostrar.</p>
      } @else {
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th class="text-end">Precio</th>
                <th class="text-end">Stock</th>
                @if (esAdmin) {
                  <th class="text-end">Acciones</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (p of productos(); track p.id) {
                <tr>
                  <td>
                    {{ p.nombre }}
                    @if (p.descripcion) {
                      <div class="small text-muted">{{ p.descripcion }}</div>
                    }
                  </td>
                  <td>{{ p.categoriaNombre }}</td>
                  <td class="text-end">S/ {{ p.precio | number: '1.2-2' }}</td>
                  <td class="text-end">
                    @if (p.stock <= p.stockMinimo) {
                      <span class="badge text-bg-danger" title="Stock mínimo: {{ p.stockMinimo }}">
                        {{ p.stock }} · bajo
                      </span>
                    } @else {
                      {{ p.stock }}
                    }
                  </td>
                  @if (esAdmin) {
                    <td class="text-end text-nowrap">
                      <a class="btn btn-sm btn-outline-primary me-1" [routerLink]="['/productos', p.id, 'editar']">
                        Editar
                      </a>
                      <button class="btn btn-sm btn-outline-danger" (click)="eliminar(p)">Eliminar</button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class ProductoListComponent implements OnInit {
  private productoService = inject(ProductoService);
  esAdmin = inject(AuthService).esAdmin();

  productos = signal<Producto[]>([]);
  cargando = signal(true);
  error = signal('');
  mensaje = signal('');
  busqueda = '';

  ngOnInit(): void {
    this.cargar();
  }

  buscar(): void {
    this.cargar();
  }

  limpiar(): void {
    this.busqueda = '';
    this.cargar();
  }

  eliminar(p: Producto): void {
    if (!confirm(`¿Dar de baja "${p.nombre}"? Dejará de aparecer en la lista.`)) {
      return;
    }
    this.error.set('');
    this.productoService.eliminar(p.id).subscribe({
      next: () => {
        this.mensaje.set(`"${p.nombre}" fue dado de baja`);
        this.cargar();
      },
      error: (e) => this.error.set(mensajeError(e, 'No se pudo eliminar el producto')),
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.productoService.listar(this.busqueda).subscribe({
      next: (lista) => {
        this.productos.set(lista);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudieron cargar los productos'));
        this.cargando.set(false);
      },
    });
  }
}
