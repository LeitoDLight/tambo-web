import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ClienteService } from '../../core/cliente.service';
import { mensajeError } from '../../core/error.util';
import { ProductoService } from '../../core/producto.service';
import { VentaService } from '../../core/venta.service';
import { Producto } from '../../models/catalogo.model';
import { Cliente } from '../../models/cliente.model';
import { Venta } from '../../models/venta.model';
import { EncabezadoComponent } from '../../shared/encabezado.component';

interface LineaCarrito {
  producto: Producto;
  cantidad: number;
}

@Component({
  selector: 'app-venta-nueva',
  imports: [EncabezadoComponent, ReactiveFormsModule, RouterLink, DecimalPipe],
  template: `
    <app-encabezado />
    <div class="container">
      <h3 class="mb-3">Nueva venta</h3>

      @if (ultimaVenta(); as v) {
        <div class="alert alert-success py-2">
          Venta #{{ v.id }} por S/ {{ v.total | number: '1.2-2' }} quedó {{ v.estado }}. El stock se
          descuenta en segundo plano. <a routerLink="/ventas">Ver ventas</a>
        </div>
      }
      @if (error()) {
        <div class="alert alert-danger py-2">{{ error() }}</div>
      }

      <div class="row g-4">
        <div class="col-lg-5">
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title">1. Cliente</h5>
              @if (cliente(); as c) {
                <p class="mb-2">
                  <strong>{{ c.nombres }}</strong>
                  <span class="text-muted ms-2">DNI {{ c.dni }}</span>
                </p>
                <button class="btn btn-sm btn-outline-secondary" (click)="cambiarCliente()">
                  Cambiar cliente
                </button>
              } @else {
                <form class="input-group" [formGroup]="dniForm" (ngSubmit)="buscarCliente()" novalidate>
                  <input class="form-control" placeholder="DNI (8 dígitos)" formControlName="dni" maxlength="8" />
                  <button class="btn btn-outline-primary" type="submit">Buscar</button>
                </form>
                @if (dniForm.controls.dni.touched && dniForm.controls.dni.invalid) {
                  <div class="text-danger small mt-1">El DNI debe tener 8 dígitos</div>
                }

                @if (clienteNuevo()) {
                  <form class="mt-3" [formGroup]="clienteForm" (ngSubmit)="crearCliente()" novalidate>
                    <div class="alert alert-info py-2">No existe un cliente con ese DNI. Regístralo:</div>
                    <div class="mb-2">
                      <label class="form-label" for="nombres">Nombres</label>
                      <input id="nombres" class="form-control" formControlName="nombres" maxlength="100" />
                      @if (clienteForm.controls.nombres.touched && clienteForm.controls.nombres.invalid) {
                        <div class="text-danger small mt-1">Los nombres son obligatorios</div>
                      }
                    </div>
                    <div class="mb-3">
                      <label class="form-label" for="telefono">Teléfono (opcional)</label>
                      <input id="telefono" class="form-control" formControlName="telefono" maxlength="15" />
                    </div>
                    <button type="submit" class="btn btn-primary">Registrar cliente</button>
                  </form>
                }
              }
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <h5 class="card-title">2. Productos</h5>
              <form [formGroup]="itemForm" (ngSubmit)="agregar()" novalidate>
                <div class="mb-2">
                  <select class="form-select" formControlName="productoId">
                    <option [ngValue]="null" disabled>Selecciona un producto</option>
                    @for (p of productos(); track p.id) {
                      <option [ngValue]="p.id" [disabled]="p.stock === 0">
                        {{ p.nombre }} · S/ {{ p.precio | number: '1.2-2' }} · stock {{ p.stock }}
                      </option>
                    }
                  </select>
                </div>
                <div class="input-group">
                  <input type="number" min="1" step="1" class="form-control" formControlName="cantidad" />
                  <button type="submit" class="btn btn-outline-primary">Agregar</button>
                </div>
                @if (itemForm.touched && itemForm.invalid) {
                  <div class="text-danger small mt-1">Elige un producto y una cantidad de 1 a más</div>
                }
              </form>
            </div>
          </div>
        </div>

        <div class="col-lg-7">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">3. Detalle</h5>
              @if (carrito().length === 0) {
                <p class="text-muted">Todavía no agregas productos.</p>
              } @else {
                <table class="table align-middle">
                  <thead class="table-light">
                    <tr>
                      <th>Producto</th>
                      <th class="text-end">Precio</th>
                      <th class="text-end">Cantidad</th>
                      <th class="text-end">Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (l of carrito(); track l.producto.id) {
                      <tr>
                        <td>{{ l.producto.nombre }}</td>
                        <td class="text-end">S/ {{ l.producto.precio | number: '1.2-2' }}</td>
                        <td class="text-end">{{ l.cantidad }}</td>
                        <td class="text-end">S/ {{ l.producto.precio * l.cantidad | number: '1.2-2' }}</td>
                        <td class="text-end">
                          <button class="btn btn-sm btn-outline-danger" (click)="quitar(l)">Quitar</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
              <div class="d-flex justify-content-between align-items-center">
                <span class="fs-5">Total: <strong>S/ {{ total() | number: '1.2-2' }}</strong></span>
                <button
                  class="btn btn-success"
                  [disabled]="!cliente() || carrito().length === 0 || registrando()"
                  (click)="registrar()"
                >
                  {{ registrando() ? 'Registrando...' : 'Registrar venta' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class VentaNuevaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private productoService = inject(ProductoService);
  private ventaService = inject(VentaService);

  productos = signal<Producto[]>([]);
  cliente = signal<Cliente | null>(null);
  clienteNuevo = signal(false);
  carrito = signal<LineaCarrito[]>([]);
  total = computed(() => this.carrito().reduce((suma, l) => suma + l.producto.precio * l.cantidad, 0));
  registrando = signal(false);
  ultimaVenta = signal<Venta | null>(null);
  error = signal('');

  dniForm = this.fb.nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
  });

  clienteForm = this.fb.nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    telefono: ['', Validators.maxLength(15)],
  });

  itemForm = this.fb.group({
    productoId: [null as number | null, Validators.required],
    cantidad: [1 as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.cargarProductos();
  }

  buscarCliente(): void {
    if (this.dniForm.invalid) {
      this.dniForm.markAllAsTouched();
      return;
    }
    this.error.set('');
    this.clienteNuevo.set(false);
    this.clienteService.buscarPorDni(this.dniForm.getRawValue().dni).subscribe({
      next: (c) => this.seleccionar(c),
      error: (e: HttpErrorResponse) =>
        e.status === 404
          ? this.clienteNuevo.set(true)
          : this.error.set(mensajeError(e, 'No se pudo buscar el cliente')),
    });
  }

  crearCliente(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }
    const v = this.clienteForm.getRawValue();
    this.error.set('');
    this.clienteService
      .crear({
        dni: this.dniForm.getRawValue().dni,
        nombres: v.nombres.trim(),
        telefono: v.telefono.trim() || null,
      })
      .subscribe({
        next: (c) => {
          this.seleccionar(c);
          this.clienteForm.reset();
        },
        error: (e) => this.error.set(mensajeError(e, 'No se pudo registrar el cliente')),
      });
  }

  cambiarCliente(): void {
    this.cliente.set(null);
    this.clienteNuevo.set(false);
    this.dniForm.reset();
  }

  agregar(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }
    const { productoId, cantidad } = this.itemForm.getRawValue();
    const producto = this.productos().find((p) => p.id === productoId)!;
    const enCarrito = this.carrito().find((l) => l.producto.id === producto.id)?.cantidad ?? 0;
    if (enCarrito + cantidad! > producto.stock) {
      this.error.set(`Solo hay ${producto.stock} unidades de ${producto.nombre}`);
      return;
    }
    this.error.set('');
    this.carrito.update((lineas) =>
      enCarrito
        ? lineas.map((l) => (l.producto.id === producto.id ? { ...l, cantidad: l.cantidad + cantidad! } : l))
        : [...lineas, { producto, cantidad: cantidad! }],
    );
    this.itemForm.reset({ productoId: null, cantidad: 1 });
  }

  quitar(linea: LineaCarrito): void {
    this.carrito.update((lineas) => lineas.filter((l) => l !== linea));
  }

  registrar(): void {
    const cliente = this.cliente();
    if (!cliente || this.carrito().length === 0) {
      return;
    }
    this.registrando.set(true);
    this.error.set('');
    this.ultimaVenta.set(null);

    const items = this.carrito().map((l) => ({ productoId: l.producto.id, cantidad: l.cantidad }));
    this.ventaService.registrar({ clienteId: cliente.id, items }).subscribe({
      next: (venta) => {
        this.registrando.set(false);
        this.ultimaVenta.set(venta);
        this.carrito.set([]);
        this.cambiarCliente();
      },
      error: (e) => {
        this.registrando.set(false);
        this.error.set(mensajeError(e, 'No se pudo registrar la venta'));
      },
    });
  }

  private seleccionar(c: Cliente): void {
    this.cliente.set(c);
    this.clienteNuevo.set(false);
    this.cargarProductos();
  }

  private cargarProductos(): void {
    this.productoService.listar().subscribe({
      next: (lista) => this.productos.set(lista),
      error: (e) => this.error.set(mensajeError(e, 'No se pudieron cargar los productos')),
    });
  }
}
