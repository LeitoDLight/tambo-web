export interface ItemVentaRequest {
  productoId: number;
  cantidad: number;
}

export interface VentaRequest {
  clienteId: number;
  items: ItemVentaRequest[];
}

export interface DetalleVenta {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  id: number;
  fechaHora: string;
  clienteNombres: string;
  cajero: string;
  total: number;
  estado: 'REGISTRADA' | 'PROCESADA';
  detalles: DetalleVenta[];
}
