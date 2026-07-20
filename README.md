# Mis Tareas

App personal de gestión de tareas: categorías (Universidad / Trabajo / Otros), urgencia, herramientas necesarias, fecha en calendario, autocompletado por IA (Gemini) y dictado por voz. Un solo código sirve como app web (Next.js) y como APK Android (Capacitor).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Prisma ORM + PostgreSQL (driver adapter `@prisma/adapter-pg`, requerido desde Prisma 7)
- Google Gemini (`@google/generative-ai`) para clasificar tareas automáticamente
- Web Speech API (navegador) + `@capacitor-community/speech-recognition` (APK) para dictado por voz
- Capacitor 6 para empaquetar la app como APK de Android

## Base de datos (PostgreSQL en Coolify / servergorazer.uk)

Ya existe un recurso PostgreSQL creado en Coolify con esta URL **interna**:

```
postgres://postgres:***@v4wwgw4sowcwow4cw4cckksc:5432/postgres
```

Esa URL solo es alcanzable **desde dentro de la red Docker de Coolify** (es decir, desde la propia app cuando esté desplegada ahí) — no funciona para desarrollar en local desde esta máquina. Hay dos formas de trabajar:

- **Sin exponer la BD (recomendado por seguridad):** desarrolla en local sin base de datos conectada (las páginas cargan igual, solo fallan las llamadas a `/api/tasks`) y deja que la migración se aplique al desplegar (ver siguiente sección).
- **Exponiendo la BD temporalmente:** en el recurso PostgreSQL de Coolify, activa "Make it publicly available" para obtener una URL pública, pégala en `DATABASE_URL` en `.env`, y corre `npx prisma migrate dev --name init` desde aquí.

## Desarrollo local

1. Instala dependencias: `npm install`
2. Completa `.env`:
   - `DATABASE_URL`: la URL interna de arriba (no funcionará en local hasta desplegar) o la URL pública si la expusiste
   - `GEMINI_API_KEY`: API key de [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
3. Arranca el servidor: `npm run dev` y abre [http://localhost:3000](http://localhost:3000)

## Despliegue de la web (para que el APK funcione y para crear las tablas)

El APK carga la app vía `server.url` en `capacitor.config.ts` (apunta a `https://tareas.servergorazer.uk` por defecto) — es decir, el APK es un WebView que muestra la app desplegada, no una copia estática. Por eso hace falta desplegar el proyecto Next.js en Coolify antes de generar el APK final, y ese despliegue es también el momento en que se crean las tablas (usando la URL interna, dentro de la misma red Docker):

1. En Coolify, crea una nueva app a partir de este repo, con build command `npm run build` y start command `npm run start`.
2. Configura las variables de entorno `DATABASE_URL` (la URL interna de arriba) y `GEMINI_API_KEY` en Coolify.
3. Antes del primer arranque (o como comando post-deploy en Coolify), corre una vez: `npx prisma migrate deploy` — esto crea las tablas en la base de datos usando las migraciones. Si aún no existe ninguna migración en `prisma/migrations/` (este repo se subió sin conexión a la BD), genera la primera con `npx prisma migrate dev --name init` estando conectado a la BD (local con la URL pública, o directamente en el servidor) y sube esa carpeta al repo.
4. Asigna el dominio `tareas.servergorazer.uk` (o el que prefieras) vía Traefik, igual que `lulu.servergorazer.uk`.
5. Si usas otro dominio, actualiza `server.url` en `capacitor.config.ts` antes de compilar el APK.

## Generar el APK (requiere Android Studio)

Esta máquina no tiene Android Studio/SDK instalados, así que este paso debe hacerse desde una máquina que sí los tenga:

1. Instala [Android Studio](https://developer.android.com/studio) (incluye el SDK de Android).
2. Con la web ya desplegada y `server.url` apuntando a ella, corre:
   ```bash
   npx cap sync android
   npx cap open android
   ```
3. En Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
4. El `.apk` queda en `android/app/build/outputs/apk/debug/` (o `release/` si firmas la app para distribución).

## Estructura relevante

- `prisma/schema.prisma` — modelo `Task` (categoría, urgencia, herramientas, fecha, estado)
- `src/app/api/tasks/` — CRUD de tareas
- `src/app/api/ai/parse-task/` — clasificación automática con Gemini
- `src/lib/gemini.ts` — prompt y parseo de la sugerencia de IA
- `src/lib/useVoiceInput.ts` — hook de dictado por voz (web y nativo)
- `src/components/TaskForm.tsx` — formulario con autocompletar IA y micrófono
- `src/app/page.tsx` — dashboard con filtros por categoría/urgencia
- `src/app/calendario/page.tsx` — vista de calendario con días marcados
- `android/` — proyecto nativo generado por Capacitor
