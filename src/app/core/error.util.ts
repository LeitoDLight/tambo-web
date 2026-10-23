import { HttpErrorResponse } from '@angular/common/http';

/** Saca el mensaje del JSON de error del backend: { "estado": 404, "mensaje": "..." }. */
export function mensajeError(error: unknown, porDefecto = 'Ocurrió un error inesperado'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor';
    }
    return error.error?.mensaje ?? porDefecto;
  }
  return porDefecto;
}
