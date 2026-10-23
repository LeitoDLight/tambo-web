import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CategoriaService } from '../../core/categoria.service';
import { mensajeError } from '../../core/error.util';
import { ProductoService } from '../../core/producto.service';
import { Categoria, ProductoRequest } from '../../models/catalogo.model';
import { EncabezadoComponent } from '../../shared/encabezado.component';

/** Crear (/productos/nuevo) y editar (/productos/:id/editar) un producto. Solo ADMIN. */
@Component({
  selector: 'app-producto-form',
  imports: [EncabezadoComponent, ReactiveFormsModule, RouterLink],
  template: `
    <app-encabezado />
    <div class="container" style="max-width: 640px">
      <h3 class="mb-3">{{ id ? 'Editar producto' : 'Nuevo producto' }}</h3>

      @if (categorias().length === 0 && !cargando()) {
        <div class="alert alert-warning py-2">
          Primero crea una categoría en <a routerLink="/categorias">Categorías</a>.
        </div>
      }
      @if (error()) {
        <div class="alert alert-danger py-2">{{ error() }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
        <div class="mb-3">
          <label class="form-label" for="nombre">Nombre</label>
          <input id="nombre" class="form-control" formControlName="nombre" maxlength="120" />
          @if (invalido('nombre')) {
            <div class="text-danger small mt-1">El nombre es obligatorio</div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label" for="descripcion">Descripción (opcional)</label>
          <input id="descripcion" class="form-control" formControlName="descripcion" maxlength="255" />
        </div>

        <div class="mb-3">
          <label class="form-label" for="categoriaId">Categoría</label>
          <select id="categoriaId" class="form-select" formControlName="categoriaId">
            <option [ngValue]="null" disabled>Selecciona una categoría</option>
            @for (c of categorias(); track c.id) {
              <option [ngValue]="c.id">{{ c.nombre }}</option>
            }
          </select>
          @if (invalido('categoriaId')) {
            <div class="text-danger small mt-1">La categoría es obligatoria</div>
          }
        </div>

        <div class="row">
          <div class="col-md-4 mb-3">
            <label class="form-label" for="precio">Precio (S/)</label>
            <input id="precio" type="number" step="0.01" min="0.01" class="form-control" formControlName="precio" />
            @if (invalido('precio')) {
              <div class="text-danger small mt-1">Debe ser mayor a 0</div>
            }
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label" for="stock">Stock</label>
            <input id="stock" type="number" step="1" min="0" class="form-control" formControlName="stock" />
            @if (invalido('stock')) {
              <div class="text-danger small mt-1">Entero de 0 a más</div>
            }
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label" for="stockMinimo">Stock mínimo</label>
            <input id="stockMinimo" type="number" step="1" min="0" class="form-control" formControlName="stockMinimo" />
            @if (invalido('stockMinimo')) {
              <div class="text-danger small mt-1">Entero de 0 a más</div>
            }
          </div>
        </div>

        <div class="d-flex gap-2">
          <button type="submit" class="btn btn-primary" [disabled]="guardando()">
            {{ guardando() ? 'Guardando...' : 'Guardar' }}
          </button>
          <a class="btn btn-outline-secondary" routerLink="/productos">Cancelar</a>
        </div>
      </form>
    </div>
  `,
})
export class ProductoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);

  id: number | null = null;
  categorias = signal<Categoria[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: [''],
    categoriaId: [null as number | null, Validators.required],
    precio: [null as number | null, [Validators.required, Validators.min(0.01)]],
    stock: [0 as number | null, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    stockMinimo: [5 as number | null, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
  });

  ngOnInit(): void {
    const idTexto = this.route.snapshot.paramMap.get('id');
    this.id = idTexto ? Number(idTexto) : null;

    this.categoriaService.listar().subscribe({
      next: (lista) => {
        this.categorias.set(lista);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudieron cargar las categorías'));
        this.cargando.set(false);
      },
    });

    if (this.id) {
      this.productoService.obtener(this.id).subscribe({
        next: (p) =>
          this.form.patchValue({
            nombre: p.nombre,
            descripcion: p.descripcion ?? '',
            categoriaId: p.categoriaId,
            precio: p.precio,
            stock: p.stock,
            stockMinimo: p.stockMinimo,
          }),
        error: (e) => this.error.set(mensajeError(e, 'No se pudo cargar el producto')),
      });
    }
  }

  invalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && control.touched;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos: ProductoRequest = {
      nombre: v.nombre!.trim(),
      descripcion: v.descripcion?.trim() || null,
      categoriaId: v.categoriaId!,
      precio: v.precio!,
      stock: v.stock!,
      stockMinimo: v.stockMinimo!,
    };

    this.guardando.set(true);
    this.error.set('');
    const peticion = this.id
      ? this.productoService.actualizar(this.id, datos)
      : this.productoService.crear(datos);

    peticion.subscribe({
      next: () => this.router.navigate(['/productos']),
      error: (e) => {
        this.guardando.set(false);
        this.error.set(mensajeError(e, 'No se pudo guardar el producto'));
      },
    });
  }
}
