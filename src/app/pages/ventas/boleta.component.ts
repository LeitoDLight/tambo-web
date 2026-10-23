import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, ViewEncapsulation, computed, input, output, signal } from '@angular/core';

import { Venta } from '../../models/venta.model';

/**
 * Comprobante de venta en pantalla (Boleta o Factura simple).
 * - Se muestra como ventana superpuesta (overlay) sobre la lista de ventas.
 * - El usuario elige el tipo (Boleta / Factura) con el selector superior.
 * - En Factura se escriben el RUC (11 dígitos) y la razón social del cliente;
 *   esos datos solo se usan para el comprobante en pantalla, no se guardan.
 * - "Imprimir" llama a window.print(); el bloque @media print oculta todo
 *   menos el comprobante, así el navegador imprime solo el ticket.
 * - Son comprobantes internos de demostración: NO son comprobantes electrónicos SUNAT.
 */
@Component({
  selector: 'app-boleta',
  imports: [DatePipe, DecimalPipe],
  encapsulation: ViewEncapsulation.None, // necesario para que @media print afecte a toda la página
  template: `
    <div class="boleta-fondo" (click)="cerrar.emit()">
      <div class="boleta-caja" (click)="$event.stopPropagation()">
        <!-- Selector de tipo (no se imprime) -->
        <div class="btn-group w-100 mb-3 boleta-botones">
          <button
            class="btn"
            [class.btn-dark]="tipo() === 'BOLETA'"
            [class.btn-outline-dark]="tipo() !== 'BOLETA'"
            (click)="tipo.set('BOLETA')"
          >
            Boleta
          </button>
          <button
            class="btn"
            [class.btn-dark]="tipo() === 'FACTURA'"
            [class.btn-outline-dark]="tipo() !== 'FACTURA'"
            (click)="tipo.set('FACTURA')"
          >
            Factura
          </button>
        </div>

        <!-- Datos del cliente para la factura (no se imprimen, solo se escriben aquí) -->
        @if (tipo() === 'FACTURA') {
          <div class="boleta-botones mb-3">
            <input
              class="form-control form-control-sm mb-2"
              placeholder="RUC del cliente (11 dígitos)"
              maxlength="11"
              [value]="ruc()"
              (input)="ruc.set(soloDigitos($any($event.target).value))"
            />
            <input
              class="form-control form-control-sm"
              placeholder="Razón social"
              maxlength="100"
              [value]="razonSocial()"
              (input)="razonSocial.set($any($event.target).value)"
            />
            @if (ruc().length > 0 && !rucValido()) {
              <div class="text-danger small mt-1">El RUC debe tener 11 dígitos</div>
            }
          </div>
        }

        <!-- Esta zona es la que se imprime -->
        <div class="boleta-papel">
          <h5 class="text-center mb-0">TAMBO MARKET</h5>
          <p class="text-center small mb-2">
            {{ tipo() === 'BOLETA' ? 'BOLETA DE VENTA' : 'FACTURA' }}
          </p>
          <p class="text-center fw-bold mb-0">{{ serie() }}</p>
          <hr />
          <div class="small">
            <div><strong>Fecha:</strong> {{ venta().fechaHora | date: 'dd/MM/yyyy HH:mm' }}</div>
            <div><strong>Cliente:</strong> {{ venta().clienteNombres }}</div>
            @if (tipo() === 'FACTURA') {
              <div><strong>RUC:</strong> {{ ruc() || '-' }}</div>
              <div><strong>Razón social:</strong> {{ razonSocial() || '-' }}</div>
            }
            <div><strong>Cajero:</strong> {{ venta().cajero }}</div>
          </div>
          <hr />
          <table class="boleta-tabla small">
            <thead>
              <tr>
                <th>Producto</th>
                <th class="text-end">Cant.</th>
                <th class="text-end">P.Unit</th>
                <th class="text-end">Importe</th>
              </tr>
            </thead>
            <tbody>
              @for (d of venta().detalles; track d.productoId) {
                <tr>
                  <td>{{ d.productoNombre }}</td>
                  <td class="text-end">{{ d.cantidad }}</td>
                  <td class="text-end">{{ d.precioUnitario | number: '1.2-2' }}</td>
                  <td class="text-end">{{ d.subtotal | number: '1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
          <hr />
          @if (tipo() === 'FACTURA') {
            <!-- La factura muestra el desglose de IGV (18%, precios con IGV incluido) -->
            <div class="d-flex justify-content-between small">
              <span>Op. gravada</span>
              <span>S/ {{ base() | number: '1.2-2' }}</span>
            </div>
            <div class="d-flex justify-content-between small">
              <span>IGV (18%)</span>
              <span>S/ {{ igv() | number: '1.2-2' }}</span>
            </div>
          }
          <div class="d-flex justify-content-between fw-bold">
            <span>TOTAL</span>
            <span>S/ {{ venta().total | number: '1.2-2' }}</span>
          </div>
          <p class="text-center small mt-3 mb-0">¡Gracias por su compra!</p>
          <p class="text-center text-muted boleta-nota mb-0">
            Comprobante interno de demostración, no válido como comprobante tributario.
          </p>
        </div>

        <!-- Botones de acción (no se imprimen) -->
        <div class="boleta-botones d-flex gap-2 justify-content-end mt-3">
          <button class="btn btn-outline-secondary" (click)="cerrar.emit()">Cerrar</button>
          <button class="btn btn-primary" [disabled]="!puedeImprimir()" (click)="imprimir()">
            Imprimir
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .boleta-fondo {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
      }
      .boleta-caja {
        background: #fff;
        border-radius: 8px;
        padding: 1rem;
        width: 360px;
        max-width: 95vw;
        max-height: 95vh;
        overflow-y: auto;
      }
      .boleta-papel {
        font-family: 'Courier New', monospace;
      }
      .boleta-tabla {
        width: 100%;
      }
      .boleta-nota {
        font-size: 0.7rem;
      }

      /* Al imprimir: se oculta todo menos el comprobante */
      @media print {
        body * {
          visibility: hidden;
        }
        .boleta-papel,
        .boleta-papel * {
          visibility: visible;
        }
        .boleta-papel {
          position: absolute;
          left: 0;
          top: 0;
          width: 80mm; /* ancho de ticket */
        }
        .boleta-fondo {
          background: none;
        }
      }
    `,
  ],
})
export class BoletaComponent {
  /** Venta a mostrar (la recibe del componente padre). */
  venta = input.required<Venta>();
  /** Aviso al padre para cerrar la ventana. */
  cerrar = output<void>();

  /** Tipo de comprobante elegido (por defecto, boleta). */
  tipo = signal<'BOLETA' | 'FACTURA'>('BOLETA');

  /** Datos del cliente para la factura (se escriben en pantalla). */
  ruc = signal('');
  razonSocial = signal('');

  /** El RUC peruano tiene exactamente 11 dígitos. */
  rucValido = computed(() => /^\d{11}$/.test(this.ruc()));

  /** La boleta se imprime siempre; la factura solo con RUC válido. */
  puedeImprimir = computed(() => this.tipo() === 'BOLETA' || this.rucValido());

  /** Deja solo números (para el campo RUC). */
  soloDigitos(texto: string): string {
    return texto.replace(/\D/g, '');
  }

  /** Serie y número, ej.: B001-000012 o F001-000012. */
  serie(): string {
    const prefijo = this.tipo() === 'BOLETA' ? 'B001' : 'F001';
    return `${prefijo}-${this.venta().id.toString().padStart(6, '0')}`;
  }

  /** Valor de venta sin IGV (el total ya incluye 18%). */
  base(): number {
    return this.venta().total / 1.18;
  }

  /** IGV = total - base. */
  igv(): number {
    return this.venta().total - this.base();
  }

  imprimir(): void {
    window.print();
  }
}
