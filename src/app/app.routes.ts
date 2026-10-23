import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';
import { AlertaListComponent } from './pages/alertas/alerta-list.component';
import { CategoriaListComponent } from './pages/categorias/categoria-list.component';
import { LoginComponent } from './pages/login/login.component';
import { ProductoFormComponent } from './pages/productos/producto-form.component';
import { ProductoListComponent } from './pages/productos/producto-list.component';
import { VentaListComponent } from './pages/ventas/venta-list.component';
import { VentaNuevaComponent } from './pages/ventas/venta-nueva.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'productos', component: ProductoListComponent, canActivate: [authGuard] },
  {
    path: 'productos/nuevo',
    component: ProductoFormComponent,
    canActivate: [authGuard],
    data: { rol: 'ADMIN' },
  },
  {
    path: 'productos/:id/editar',
    component: ProductoFormComponent,
    canActivate: [authGuard],
    data: { rol: 'ADMIN' },
  },
  { path: 'categorias', component: CategoriaListComponent, canActivate: [authGuard] },
  { path: 'ventas/nueva', component: VentaNuevaComponent, canActivate: [authGuard] },
  { path: 'ventas', component: VentaListComponent, canActivate: [authGuard] },
  {
    path: 'alertas',
    component: AlertaListComponent,
    canActivate: [authGuard],
    data: { rol: 'ADMIN' },
  },
  { path: '', redirectTo: 'productos', pathMatch: 'full' },
  { path: '**', redirectTo: 'productos' },
];
