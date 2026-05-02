# 🏙️ Ciudad Friki - Versión Web

Bienvenido al repositorio de la versión Web de **Ciudad Friki**. Este proyecto traslada la experiencia de la aplicación móvil (React Native) a una plataforma web moderna, rápida y responsiva.

## 🚀 Tecnologías Principales

- **Frontend:** React 19 + TypeScript + Vite 7
- **Estilos:** Tailwind CSS 4 (Vanilla CSS + Modern Aesthetics)
- **Backend/Base de Datos:** Supabase (Auth, RLS, Realtime)
- **Internacionalización:** i18next (Soporte completo para Español e Inglés)
- **Iconografía:** Lucide React
- **Hosting:** Cloudflare Pages (CI/CD sincronizado con GitHub)

---

## 🛠️ Estado Actual y Funcionalidades Implementadas

### ✅ Core & UI
- **Sistema de Temas Dinámico:** Implementación robusta de variables CSS que permiten cambiar entre más de 20 temas idénticos a los de la app móvil.
- **RootLayout:** Estructura de navegación persistente con Header responsivo.
- **Perfil de Usuario:** Visualización de avatar, rango y nombre sincronizados con la tabla `profiles` de Supabase.
- **Billetera (Wallet):** Modal informativo que muestra balance de Frikicoins e historial de transacciones.
- **Modo Mantenimiento:** Controlado globalmente desde la base de datos para bloquear el acceso si es necesario.

### 🍺 La Taberna (Comunidad)
- **Feed de Hilos:** Filtrado por categorías y ordenamiento (Lo Último / Popular).
- **Detalle de Hilo:** Modal con renderizado de contenido, sistema de votos (Like/Dislike) y respuestas.
- **Creación/Edición:** Flujo completo de creación de hilos con selección de categorías.
- **Correcciones Recientes:** El avatar y nombre en la caja de creación ahora usan datos del perfil, no metadatos de Google.

### 📅 Eventos
- **Dashboard:** Listado de eventos activos y pasados.
- **Detalles de Evento:** Modal completo con información de ubicación, links (Maps, WhatsApp, Web), descripción y tags.
- **Reseñas de Eventos:** Sistema de calificación y comentarios para eventos finalizados (con validación de tiempo y contenido).
- **Traducciones:** Sincronización completa de todos los campos de eventos en ES/EN.

### 🛠️ Administración
- **Herramientas Admin:** Dashboard con métricas clave (usuarios, supply de Frikicoins, encuestas).
- **Control de Ballenas (Whales):** Ranking de los 5 usuarios con mayor balance, incluyendo emails y avatares.
- **Presencia en Tiempo Real:** Monitor de administradores online con reporte de actividad vía Supabase Presence.
- **Moderación de Eventos:** Panel avanzado para aprobar/rechazar eventos con visualización de likes y conteo de guardados.
- **Suite de Moderación de Taberna y Usuarios:**
  - Panel completo de **Sanciones (Bans y Shadow Bans)** con registro de tiempos (temporal/permanente) y motivos.
  - Modal dinámico de **Historial de Usuario** que permite a los admins ver todas las infracciones y reportes de una cuenta.
  - Visibilidad de roles de usuario en la búsqueda de moderación para evitar sancionar accidentalmente a miembros del staff.
  - Correcciones precisas de asignación de columnas en base de datos (`reports_count`).

### 🧩 Otros
- **Trivias & Encuestas:** Integración funcional con el backend.
- **Search Bar:** Oculto temporalmente (Pendiente de implementación lógica).

---

## 🎨 Guía de Diseño y Desarrollo (Para la IA)

- **Reglas de Git (MUY IMPORTANTE):** NUNCA realices `git commit` ni `git push` a menos que el usuario lo solicite explícitamente.
- **Estética:** "Rich Aesthetics". Uso intensivo de glassmorphism, gradientes sutiles y micro-animaciones. No usar placeholders; generar imágenes reales si es necesario.
- **Tokens de Color:** No usar colores hardcodeados. Utilizar las variables definidas en el sistema de temas (ej: `text-brand-primary`, `bg-bg-side`).
- **Responsividad:** Diseñado para Desktop, pero funcional en móviles. Las tarjetas en Web suelen organizarse en Grid.

---

## 🔧 Scripts Disponibles

```bash
# Iniciar servidor de desarrollo
npm run dev

# Construir para producción (compila TS y Vite)
npm run build

# Previsualizar la build localmente
npm run preview
```

## 📝 Notas de Contexto Reciente (Marzo 2026)

- **Integración de Admin Tools:** Se replicó la sección de herramientas administrativas de la app móvil a la web, optimizando la carga de datos (emails y avatares) sin aumentar el costo de base de datos.
- **Mejora en Moderación de Eventos:** El modal de detalles ahora muestra el conteo de likes públicamente y el conteo de guardados exclusivamente para administradores.
- **Correcciones Técnicas:** Se resolvieron problemas críticos de codificación (UTF-16 vs UTF-8) en servicios y se implementaron *Type-Only Imports* para evitar errores de ejecución en Vite con interfaces de TypeScript.
- Se corrigió el error de "Seguridad Bancaria" en el modal de la billetera.
- Se resolvió el problema de traducción en el modal de reseñas (`alreadySubmitted`, `wantToReview`, etc.).
