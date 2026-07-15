import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "uk.servergorazer.tareas",
  appName: "Mis Tareas",
  webDir: "public",
  server: {
    // Apunta al despliegue en producción (ver README para configurarlo).
    // Mientras no exista despliegue, el APK no podrá cargar la app.
    url: "https://tareas.servergorazer.uk",
    cleartext: false,
  },
};

export default config;
