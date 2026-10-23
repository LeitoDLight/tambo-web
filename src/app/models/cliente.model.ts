export interface Cliente {
  id: number;
  dni: string;
  nombres: string;
  telefono: string | null;
}

export interface ClienteRequest {
  dni: string;
  nombres: string;
  telefono: string | null;
}
