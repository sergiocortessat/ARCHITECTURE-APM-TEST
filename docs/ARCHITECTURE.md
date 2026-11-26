# Mapa de capas

Estas rutas son la única referencia válida para ubicar archivos. El mapa describe el código que existe hoy; no propone reorganizarlo.

## Mapa de capas

El proyecto tiene dos partes, `backend/` y `frontend/`, cada una con su tabla y su verificación de fronteras.

### Backend (`backend/`)

| Rol | Ruta o glob | Notas |
| --- | --- | --- |
| Presentación | `backend/app/rooms.py`, `backend/app/bookings.py` | Routers FastAPI y modelos Pydantic (`RoomIn`, `Room`, `BookingIn`, `Booking`). La API de salas (`POST /rooms`, `GET /rooms`, `GET /rooms/{id}`, `DELETE /rooms/{id}`) expone `id`, `name`, `capacity` y `description` (opcional, hasta 500 caracteres, `null` si no se informa). Hoy también contienen SQL y reglas de reservas; el mapa lo registra, no lo cambia. |
| Aplicación | Por decidir | No hay capa propia. |
| Dominio | Por decidir | No hay capa propia. |
| Infraestructura | `backend/app/db.py` | Conexión SQLite y esquema (`init_db`). La tabla `rooms` tiene `id`, `name`, `capacity` y `description` (texto, admite `null`); `init_db` añade `description` a las bases existentes. |
| Shared | Por decidir | |
| Platform | Por decidir | |
| Raíz de composición | `backend/app/main.py` | Crea la app, el CORS y registra los routers. |
| Pruebas | `backend/tests/` | pytest, árbol paralelo al código. |

### Frontend (`frontend/`)

| Rol | Ruta o glob | Notas |
| --- | --- | --- |
| Presentación | `frontend/app/**/page.tsx`, `frontend/app/actions.ts`, `frontend/app/api/**` | Páginas, acciones de servidor y rutas del App Router. |
| Aplicación | Por decidir | No hay capa propia. |
| Dominio | Por decidir | No hay capa propia. |
| Infraestructura | `frontend/lib/api.ts` | Cliente HTTP de la API del backend. |
| Shared | Por decidir | |
| Platform | Por decidir | |
| Raíz de composición | `frontend/app/layout.tsx` | |
| Pruebas | `frontend/__tests__/` | vitest con jsdom y Testing Library. |

## Módulos

- Cómo se reconoce un módulo: un fichero por recurso en `backend/app/` (`rooms.py`, `bookings.py`) y una carpeta o página por recurso en `frontend/app/`.
- API pública: Por decidir

## Framework

| Ruta impuesta | Rol | Restricción |
| --- | --- | --- |
| `backend/app/main.py` | FastAPI: arranque y routers | Delgado: solo composición. |
| `frontend/app/**/page.tsx`, `layout.tsx`, `route.ts` | Next.js App Router: rutas y páginas | Las rutas dinámicas siguen la carpeta `[param]`. |
| `frontend/app/actions.ts` | Next.js: acciones de servidor | |

## Intensidad y organización

- Intensidad: Por decidir (ligera o completa). El recurso `rooms` es un CRUD sin reglas de negocio; `bookings` tiene reglas (solapes, fechas pasadas).
- Organización: Por decidir
- Nombres de archivo: minúsculas con guion bajo en Python; `page.tsx`, `route.ts` y `actions.ts` en Next.js.
- Unidades por archivo: Por decidir

## Estilo de los casos de uso

Por decidir (clases o funciones fábrica).

## Errores de dominio

- Cómo se entregan (excepciones o valores de error): excepciones `HTTPException` de FastAPI en los routers.
- Dónde vive el catálogo: Por decidir
- `kind` además de VALIDATION, NOT_FOUND y CONFLICT: Por decidir
- Qué se hace fuera del dominio (protocolo, logs, trazabilidad): Por decidir

## Verificación de fronteras

### Backend

- Herramienta: import-linter 2.17, instalada en `backend/` (`backend/requirements.txt`) y configurada en `backend/.importlinter`.
- Comando: `cd backend && .venv/bin/lint-imports`. Resultado actual: 2 contratos cumplidos, 0 rotos.
- Contratos (mínimos a propósito): `app.db` no importa `app.rooms`, `app.bookings`, `app.main` ni `fastapi`; nada importa `app.main`.

### Frontend

- Herramienta: dependency-cruiser 18.9.0, instalada en `frontend/` (`frontend/package.json`) y configurada en `frontend/.dependency-cruiser.cjs`.
- Comando: `cd frontend && npm run boundaries`, equivalente a `depcruise app lib --config .dependency-cruiser.cjs`. Resultado actual: sin violaciones.
- Las reglas son mínimas a propósito.

## Excepciones y decisiones

| Fecha | Regla | Decisión | Motivo |
| --- | --- | --- | --- |
| 2026-11-26 | R-FLU-02 | `rooms.py` y `bookings.py` mezclan presentación e infraestructura. | Estado previo del proyecto; no se reorganiza sin petición explícita. |
