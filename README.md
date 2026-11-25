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

## Arquitectura

El proyecto sigue una arquitectura en capas: rutas, lógica y acceso a datos en el backend; componentes en el frontend.
