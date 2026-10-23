# tambo-web

**Frontend** de Tambo Market, hecho en Angular 22 (componentes standalone y signals).

| Dato | Valor |
|---|---|
| Servido por | nginx en el puerto 80, que también actúa como gateway hacia los microservicios |
| Tecnología | Angular 22, TypeScript, HttpClient con interceptor JWT, guard de rutas |
| Responsables | Joselin Carhuapoma Poma (navegación y alertas), Alberto Muzaurieta Hidalgo (ventas), Leonardo Dorregaray (login e integración, comprobante) |

## Pantallas

| Pantalla | Acceso |
|---|---|
| Login | Público |
| Categorías y Productos (crear, editar, dar de baja) | ADMIN; el CAJERO solo consulta |
| Nueva venta y listado de Ventas | Usuario autenticado |
| **Comprobante** (boleta o factura simple, imprimible) | Usuario autenticado |
| Alertas de stock bajo | ADMIN |

El comprobante es una **demostración interna**, no un comprobante electrónico de SUNAT. Desglosa el IGV (18 % incluido en el precio) y permite RUC y razón social para la factura.

## Gateway nginx

| Ruta | Servicio |
|---|---|
| `/api/auth` | auth-service:8081 |
| `/api/categorias`, `/api/productos` | catalogo-service:8082 |
| `/api/clientes`, `/api/ventas` | ventas-service:8083 |
| `/api/alertas` | alertas-service:8084 |

## Desarrollo local

```
npm ci
npm start      # ng serve; usa proxy.conf.json hacia los servicios en localhost
```

## Proyecto completo

Este repositorio es **un microservicio de Tambo Market**. El proyecto completo (todos los servicios, `docker-compose.yml`, colección de Postman, informe y el historial de trabajo del equipo) está en el repositorio de integración, que es privado y tiene acceso concedido al docente:

https://github.com/LeitoDLight/tambo-market

Para levantar todo el sistema:

```
git clone https://github.com/LeitoDLight/tambo-market.git
cd tambo-market
docker compose up -d --build
```

Luego abrir http://localhost (usuario `admin` / `Admin123`).

## Equipo

Leonardo Fabricio Dorregaray Guevara · José Miguel Yataco Quispe · Alberto Muzaurieta Hidalgo · Joselin Carhuapoma Poma

Curso: Desarrollo de Aplicaciones Web II — Cibertec.