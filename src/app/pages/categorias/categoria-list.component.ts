import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth.service';
import { CategoriaService } from '../../core/categoria.service';
import { mensajeError } from '../../core/error.util';
import { Categoria } from '../../models/catalogo.model';
import { EncabezadoComponent } from '../../shared/encabezado.component';

/** Lista de categorías. El ADMIN las crea y edita en el formulario de la misma pantalla. */
@Component({
  selector: 'app-categoria-list',
  imports: [EncabezadoComponent, ReactiveFormsModule],
  template: `
    <app-encabezado />
    <div class="container">
      <h3 class="mb-3">Categorías</h3>

      @if (mensaje()) {
        <div class="alert alert-success py-2">{{ mensaje() }}</div>
      }
      @if (error()) {
        <div class="alert alert-danger py-2">{{ error() }}</div>
      }

      <div class="row g-4">
        @if (esAdmin) {
          <div class="col-lg-4">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">{{ editandoId() ? 'Editar categoría' : 'Nueva categoría' }}</h5>
                <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
                  <div class="mb-3">
                    <label class="form-label" for="nombre">Nombre</label>
                    <input id="nombre" class="form-control" formControlName="nombre" maxlength="80" />
                    @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
                      <div class="text-danger small mt-1">El nombre es obligatorio</div>
                    }
                  </div>
                  <div class="mb-3">
                    <label class="form-label" for="descripcion">Descripción (opcional)</label>
                    <input id="descripcion" class="form-control" formControlName="descripcion" maxlength="255" />
                  </div>
                  <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                      {{ guardando() ? 'Guardando...' : 'Guardar' }}
                    </button>
                    @if (editandoId()) {
                      <button type="button" class="btn btn-outline-secondary" (click)="cancelar()">Cancelar</button>
                    }
                  </div>
                </form>
              </div>
            </div>
          </div>
        }

        <div [class]="esAdmin ? 'col-lg-8' : 'col-12'">
          @if (cargando()) {
            <p class="text-muted">Cargando...</p>
          } @else if (categorias().length === 0) {
            <p class="text-muted">Todavía no hay categorías.</p>
          } @else {
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  @if (esAdmin) {
                    <th class="text-end">Acciones</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (c of categorias(); track c.id) {
                  <tr [class.table-active]="editandoId() === c.id">
                    <td>{{ c.nombre }}</td>
                    <td class="text-muted">{{ c.descripcion }}</td>
                    @if (esAdmin) {
                      <td class="text-end text-nowrap">
                        <button class="btn btn-sm btn-outline-primary me-1" (click)="editar(c)">Editar</button>
                        <button class="btn btn-sm btn-outline-danger" (click)="eliminar(c)">Eliminar</button>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>
    </div>
  `,
})
export class CategoriaListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoriaService = inject(CategoriaService);
  esAdmin = inject(AuthService).esAdmin();

  categorias = signal<Categoria[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  editandoId = signal<number | null>(null);
  error = signal('');
  mensaje = signal('');

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    descripcion: [''],
  });

  ngOnInit(): void {
    this.cargar();
  }

  editar(c: Categoria): void {
    this.editandoId.set(c.id);
    this.form.setValue({ nombre: c.nombre, descripcion: c.descripcion ?? '' });
    this.limpiarAvisos();
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.form.reset();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos = { nombre: v.nombre.trim(), descripcion: v.descripcion.trim() || null };
    const id = this.editandoId();

    this.guardando.set(true);
    this.limpiarAvisos();
    const peticion = id
      ? this.categoriaService.actualizar(id, datos)
      : this.categoriaService.crear(datos);

    peticion.subscribe({
      next: (c) => {
        this.guardando.set(false);
        this.mensaje.set(id ? `Categoría "${c.nombre}" actualizada` : `Categoría "${c.nombre}" creada`);
        this.cancelar();
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        this.error.set(mensajeError(e, 'No se pudo guardar la categoría'));
      },
    });
  }

  eliminar(c: Categoria): void {
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"?`)) {
      return;
    }
    this.limpiarAvisos();
    this.categoriaService.eliminar(c.id).subscribe({
      next: () => {
        this.mensaje.set(`Categoría "${c.nombre}" eliminada`);
        if (this.editandoId() === c.id) {
          this.cancelar();
        }
        this.cargar();
      },
      // Si tiene productos, el backend responde 409 con el motivo
      error: (e) => this.error.set(mensajeError(e, 'No se pudo eliminar la categoría')),
    });
  }

  private limpiarAvisos(): void {
    this.error.set('');
    this.mensaje.set('');
  }

  private cargar(): void {
    this.cargando.set(true);
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
  }
}
