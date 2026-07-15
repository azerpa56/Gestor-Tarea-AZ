# Mis Tareas

App personal de gestión de tareas: categorías (Universidad / Trabajo / Otros), urgencia, herramientas necesarias, fecha en calendario, autocompletado por IA (Gemini) y dictado por voz. Un solo código sirve como app web (Next.js) y como APK Android (Capacitor).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Prisma ORM + PostgreSQL (driver adapter `@prisma/adapter-pg`, requerido desde Prisma 7)
- Google Gemini (`@google/generative-ai`) para clasificar tareas automáticamente
- Web Speech API (navegador) + `@capacitor-community/speech-recognition` (APK) para dictado por voz
- Capacitor 6 para empaquetar la app como APK de Android

## Desarrollo local

1. Instala dependencias: `npm install`
2. Copia `.env` y completa:
   - `DATABASE_URL`: cadena de conexión PostgreSQL (ver sección "Base de datos" abajo)
   - `GEMINI_API_KEY`: API key de [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
3. Aplica el esquema a la base de datos: `npx prisma migrate dev --name init`
4. Arranca el servidor: `npm run dev` y abre [http://localhost:3000](http://localhost:3000)

## Base de datos (PostgreSQL en servergorazer.uk)

Este proyecto usa PostgreSQL alojado en el servidor `servergorazer.uk` (mismo servidor que el proyecto Lulu, gestionado con Coolify):

1. Entra al panel de Coolify de `servergorazer.uk`.
2. Crea un nuevo recurso de tipo **PostgreSQL** (puedes reutilizar una instancia existente si ya tienes una, creando solo una base de datos nueva dentro de ella).
3. Copia la cadena de conexión que te da Coolify (formato `postgresql://usuario:password@host:puerto/basedatos`) y pégala como `DATABASE_URL` en `.env`.
4. Corre `npx prisma migrate dev --name init` para crear las tablas.

Prisma se conecta por red a esa base de datos, así que no hace falta instalar PostgreSQL en tu máquina — el desarrollo local también puede apuntar directo a la base remota.

## Despliegue de la web (para que el APK funcione)

El APK carga la app vía `server.url` en `capacitor.config.ts` (apunta a `https://tareas.servergorazer.uk` por defecto) — es decir, el APK es un WebView que muestra la app desplegada, no una copia estática. Por eso hace falta desplegar el proyecto Next.js en un servidor con esa URL antes de generar el APK final:

1. En Coolify, crea una nueva app a partir de este repo (o súbelo a un repo Git y conéctalo), con build command `npm run build` y start command `npm run start`.
2. Configura las variables de entorno `DATABASE_URL` y `GEMINI_API_KEY` en Coolify.
3. Asigna el dominio `tareas.servergorazer.uk` (o el que prefieras) vía Traefik, igual que `lulu.servergorazer.uk`.
4. Si usas otro dominio, actualiza `server.url` en `capacitor.config.ts` antes de compilar el APK.

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
