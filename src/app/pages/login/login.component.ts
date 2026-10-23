import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="container" style="max-width: 420px; margin-top: 12vh;">
      <div class="card shadow-sm">
        <div class="card-body p-4">
          <h3 class="text-center mb-1">Tambo Market</h3>
          <p class="text-center text-muted mb-4">Inicia sesión para continuar</p>

          <form [formGroup]="form" (ngSubmit)="ingresar()">
            <div class="mb-3">
              <label class="form-label" for="username">Usuario</label>
              <input id="username" class="form-control" formControlName="username" autocomplete="username" />
              @if (form.controls.username.touched && form.controls.username.invalid) {
                <div class="text-danger small mt-1">El usuario es obligatorio</div>
              }
            </div>

            <div class="mb-3">
              <label class="form-label" for="password">Contraseña</label>
              <input id="password" type="password" class="form-control" formControlName="password" autocomplete="current-password" />
              @if (form.controls.password.touched && form.controls.password.invalid) {
                <div class="text-danger small mt-1">La contraseña es obligatoria</div>
              }
            </div>

            @if (error()) {
              <div class="alert alert-danger py-2">{{ error() }}</div>
            }

            <button type="submit" class="btn btn-primary w-100" [disabled]="cargando()">
              {{ cargando() ? 'Ingresando...' : 'Ingresar' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  error = signal('');
  cargando = signal(false);

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set('');

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/productos']),
      error: (e) => {
        this.cargando.set(false);
        this.error.set(e.error?.mensaje ?? 'No se pudo iniciar sesión');
      },
    });
  }
}
