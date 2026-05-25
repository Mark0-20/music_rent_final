# Music Rent

Aplicacion full stack para administrar albumes y canciones en renta. Usa frontend web en TypeScript, backend REST en TypeScript, MySQL como base relacional y MongoDB como base no relacional.

## Repositorio

- Repo del proyecto: pendiente de subir y pegar aqui la URL publica o privada.
- El ZIP recibido no incluye carpeta `.git` ni remoto configurado, por eso no se puede inferir el link real desde el proyecto.

## Links locales

- Frontend: http://localhost:5173
- API REST: http://localhost:4000
- Healthcheck: http://localhost:4000/api/health
- MySQL: `127.0.0.1:3306`
- MongoDB: `127.0.0.1:27017`

## Acceso y autenticacion

El API requiere token Bearer para todos los endpoints bajo `/api`, excepto `/api/health` y `/api/auth/login`.

Usuario demo creado por `backend/sql/schema.sql`:

- Email: `admin@musicrent.local`
- Password: `admin123`
- Rol: `admin`

La UI guarda el token en `localStorage` y lo envia en cada peticion como:

```http
Authorization: Bearer <token>
```

## Arquitectura

```text
frontend/
  React + Vite + TypeScript
  Consume /api mediante proxy de Vite

backend/
  Express + TypeScript
  API REST
  Auth con token firmado por HMAC SHA-256
  MySQL para entidades relacionales transaccionales
  MongoDB para documentos denormalizados, auditoria y actividad

docker-compose.yml
  MySQL 8.4
  MongoDB 7
```

Flujo principal:

1. El usuario inicia sesion en el frontend.
2. El backend valida credenciales contra `users` en MySQL.
3. El backend emite un token firmado.
4. El frontend usa el token para crear, editar, listar y borrar albumes/canciones.
5. Cada cambio de album/canciones sincroniza una vista denormalizada en MongoDB (`album_documents`).

## Entidades de base de datos

El proyecto suma 12 entidades entre ambas bases.

### MySQL: 7 tablas

1. `users`: usuarios de la aplicacion y roles.
2. `artists`: catalogo normalizado de artistas.
3. `genres`: catalogo de generos musicales.
4. `albums`: albumes disponibles para renta.
5. `songs`: canciones asociadas a albumes.
6. `customers`: clientes que rentan albumes.
7. `rentals`: rentas de albumes por cliente.

### MongoDB: 5 colecciones

1. `album_documents`: vista denormalizada de album con canciones.
2. `user_activity`: actividad de usuarios, incluyendo logins.
3. `rental_events`: eventos historicos de rentas.
4. `search_history`: busquedas hechas en la aplicacion.
5. `audit_logs`: bitacora flexible de cambios.

## Endpoints principales

### Publicos

- `GET /api/health`
- `POST /api/auth/login`

### Protegidos

- `GET /api/auth/me`
- `GET /api/albums`
- `POST /api/albums`
- `GET /api/albums/:id`
- `PATCH /api/albums/:id`
- `DELETE /api/albums/:id`
- `GET /api/albums/:id/mongo-doc`
- `GET /api/albums/:albumId/songs`
- `POST /api/albums/:albumId/songs`
- `GET /api/songs/:id`
- `PATCH /api/songs/:id`
- `DELETE /api/songs/:id`

## Como correr el proyecto completo

### 1. Levantar bases de datos

Desde la raiz del proyecto:

```bash
docker compose up -d
```

Esto levanta:

| Servicio | Contenedor | Puerto | Descripcion |
| --- | --- | --- | --- |
| MySQL 8.4 | `music_rent_mysql` | 3306 | Base `music_rent`; en el primer arranque ejecuta `backend/sql/schema.sql` |
| MongoDB 7 | `music_rent_mongo` | 27017 | Base no relacional `music_rent` |

Si ya existia el volumen de MySQL y necesitas recrear tablas/seed:

```bash
docker compose down -v
docker compose up -d
```

### 2. Variables de entorno del backend

Crear `backend/.env`:

```env
PORT=4000
AUTH_SECRET=music-rent-local-secret

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=musicrent_dev
MYSQL_DATABASE=music_rent

MONGODB_URI=mongodb://127.0.0.1:27017/music_rent
```

### 3. Instalar y correr backend

```bash
cd backend
npm install
npm run dev
```

### 4. Instalar y correr frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

## Build

Backend:

```bash
cd backend
npm run build
npm run start
```

Frontend:

```bash
cd frontend
npm run build
```

## Cumplimiento de requisitos

- App web TypeScript: si, `frontend`.
- Backend REST: si, `backend` con Express.
- BD relacional: si, MySQL.
- BD no relacional: si, MongoDB.
- 12 tablas/colecciones totales: si, 7 en MySQL y 5 en MongoDB.
- Login/auth: si, `/api/auth/login`, `/api/auth/me` y middleware Bearer.
- README con arquitectura, links locales y accesos: si.
