# Reservas de salas de reuniones

Aplicación para crear salas de reuniones y reservarlas por franjas horarias.

- `backend/`: API en Python 3.12 con FastAPI y SQLite.
- `frontend/`: aplicación Next.js (App Router) con TypeScript.

## Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

La API queda en `http://localhost:8000` (documentación en `/docs`).

Tests:

```bash
cd backend
pytest
```

## Frontend

Con el backend arrancado:

```bash
cd frontend
npm ci
npm run dev
```

La aplicación queda en `http://localhost:3000`.

Tests:

```bash
cd frontend
npm test
```

## API de salas

| Método y ruta | Descripción |
| --- | --- |
| `POST /rooms` | Crea una sala. Responde 201 con la sala creada. |
| `GET /rooms` | Lista las salas ordenadas por nombre. |
| `GET /rooms/{id}` | Devuelve una sala; 404 si no existe. |
| `DELETE /rooms/{id}` | Borra una sala. Responde 204. |

Cada sala tiene `id`, `name` (1 a 100 caracteres), `capacity` (entero mayor que 0) y `description`. `description` es opcional, admite hasta 500 caracteres y vale `null` si no se informa; una descripción más larga se rechaza con 422. Las bases creadas antes de este campo se migran al arrancar (`init_db` añade la columna) y sus salas devuelven `description: null`.

## Verificación de fronteras

Comprueba que los imports respetan las fronteras declaradas en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md):

```bash
cd backend && .venv/bin/lint-imports
cd frontend && npm run boundaries
```

## Arquitectura

El proyecto sigue una arquitectura en capas: rutas, lógica y acceso a datos en el backend; componentes en el frontend. El mapa de capas y las rutas están en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
