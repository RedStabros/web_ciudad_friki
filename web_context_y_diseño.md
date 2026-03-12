# Contexto y Diseño - Ciudad Friki (Versión Web)

Este documento contiene el contexto completo del proyecto "Ciudad Friki" extraído de la aplicación móvil y el backend actual (React Native + Supabase). Está diseñado para ser proporcionado como contexto inicial a una IA o equipo de desarrollo en un nuevo entorno de trabajo para garantizar que la versión Web mantenga exactamente la misma esencia, funcionalidades, base de datos y diseño.

---

## 🏗️ 1. Arquitectura Base
- **Backend:** Supabase (BaaS). La web se conectará exactamente al mismo proyecto de Supabase, utilizando la misma estructura de datos, políticas de seguridad (RLS) y Auth.
- **Base de Datos (SQL):** El esquema actual maneja entidades altamente relacionales: `users`/`profiles`, `wallet`/`transactions`, `events`, `surveys` (encuestas), `trivia`, `notifications`, `vs_leaderboards`, entre otros.
- **Frontend Sugerido (Web):** React.js / Next.js (ya que la app está en React Native, compartirán mucha lógica, especialmente llamadas a Supabase y estructura de componentes).

---

## 🎨 2. Sistema de Diseño (UI / UX)
La aplicación cuenta con un sistema de tematización extremadamente robusto, con más de 20 temas diferentes desarrollados. La web DEBE replicar esta estructura para mantener la experiencia de personalización.

### Estructura de Colores (Tokens requeridos por tema)
Cada tema en la app define los siguientes objetos de color. La web debería usar variables CSS (ej. `--bg-primary`, `--brand-primary`) basadas en esta estructura:

1. **Background (Fondos):** `primary`, `secondary`, `tertiary`, `elevated`.
2. **Text (Textos):** `primary`, `secondary`, `tertiary`, `inverse`.
3. **Brand (Marca principal):** `primary`, `primaryLight`, `primaryDark`, `secondary`, `secondaryLight`, `secondaryDark`.
4. **Accent (Acentos):** `blue`, `green`, `yellow`, `red`, `purple`.
5. **UI Elementos:** `border`, `divider`, `shadow`, `overlay`.

### Temas Principales (Ejemplos extraídos)
- **Dark Friki (Default Oscuro):** Fondo principal `#1e222a`, Marca primaria `#e1192f` (Rojo Friki), Marca secundaria `#fbbf24` (Amarillo Friki). Texto primario `#ffffff`.
- **Light Friki (Default Claro):** Fondo principal `#ffffff`, Marca primaria `#e1192f`, Texto primario `#111827`.
- **Otros Temas a migrar:** AMOLED Black, Pastel Dreams, Neon Cyberpunk, Warm Autumn, Midnight Purple, Abyssal Blue, Retro GameBoy, Hacker Console, etc.

### Internacionalización (i18n)
- **Idiomas:** Inglés (`en.json`) y Español (`es.json`).
- La web debe incorporar un sistema como `react-i18next` o `next-intl` que permita alternar entre ambos en tiempo real.

---

## ⚙️ 3. Funcionalidades (Requisitos Específicos para la Web)

A continuación, se detalla el alcance funcional de la primera versión de la plataforma web, basado en las instrucciones directas de diseño de producto:

### ✅ SE MANTIENE EXACTAMENTE IGUAL (Core Features)
*   **Cuentas y Perfiles:** Todo lo relacionado con el perfil de usuario.
*   **Autenticación:** Login con cuentas (Email/Password) y Login con Google.
*   **Personalización:** Sistema de cambio de temas de colores y cambio de idiomas (EN/ES).
*   **Encuestas (Polls):** Visualización y participación.
*   **Friki Trivias:** Juego de trivias interactivo.
*   **Taberna (Comunidad):** Hilos de conversación con *exactamente* las mismas funcionalidades, derechos y permisos de moderación que en la app.
*   **Eventos (Dashboard y Pasados):**
    *   Listado de eventos en el dashboard principal.
    *   Opción de asistir/andar eventos con las mismas funcionalidades y permisos de la app. *(Sugerencia para Web: Mejorar UX desarrollando los textos para pantallas grandes).*
    *   Creación de eventos ("Publish events") y visualización de mis eventos ("My events").
    *   Listado de eventos pasados visible en la web para permitir la publicación de reseñas.
*   **Páginas Informativas (About):** Todas las secciones de "Acerca de" de la app, colocadas de forma disimulada pero accesible (ej. en el Footer de la web).

### ⚠️ SE MANTIENE PERO CON MODIFICACIONES O RESTRICCIONES
*   **Wallet (Billetera):**
    *   Será de carácter **puramente informativo**.
    *   Se podrá ver el balance actual de Frikicoins y el historial de transacciones.
    *   El QR personal estará visible.
    *   **EXCEPCIÓN:** En la web *no se podrán enviar Frikicoins por el momento*. La interfaz de transferencia debe estar deshabilitada o ausente.
*   **Sistema de VS (Versus):**
    *   Jugar VS es **exclusivo de la App móvil**.
    *   En la web, solo será de carácter informativo: Se debe mostrar el ranking/leaderboard del VS, pero no se podrá participar desde allí.
*   **Notificaciones (Campanita):**
    *   Debe existir la campana de notificaciones.
    *   Solo notificaciones *In-Page* (dentro de la misma página web conectadas a la base de datos).
    *   **EXCEPCIÓN:** Nada de notificaciones externas (No Push Notifications vía Service Workers para la web por ahora).

### 🚫 NO INCLUIR EN LA VERSIÓN WEB (Descartados)
*   Centro de Operaciones (**Operation Center**).
*   Información sobre el **Número de Versión** de la App (dentro de la sección About).

---

## 📌 4. Notas Importantes para el Desarrollo Web
*   **Ramas Paralelas (Ramas en Desarrollo):** Se debe tener en cuenta que algunas características especificadas arriba están actualmente en ramas secundarias de la app móvil y aún no se han subido a `main`. La base de datos y la web deben programarse preparadas para convivir con estas funciones, ya que la web se hará pública *después* de la primera actualización post-lanzamiento en la Play Store.
*   **Diseño Web First-Class:** Aunque debe mantener la esencia de la app, el hecho de estar en navegadores de escritorio obliga a adaptar listas y tarjetas para que no se vean como una "app estirada". Ajustar las proporciones en Grid y Flexbox.

---

## 🚀 5. Stack de Despliegue (Hosting) y Arquitectura Recomendada
- **Stack Front-end Principal: React + Vite + Typescript.**
  - **Razón:** Dado que la App Móvil está construida en React Native, usar React en la web permite la mayor reutilización de conocimientos, hooks, y lógicas de validación. Vite garantizará que la web sea una SPA ultrarrápida (Single Page Application).
  - La web consumirá el backend de Supabase directamente del lado del cliente.
- **Hosting Seleccionado: Cloudflare Pages.**
  - **Razón:** Ofrece **ancho de banda estático ilimitado** en su plan gratuito, lo cual es el combo perfecto con React/Vite. Al no haber páginas SSR, Cloudflare servirá tu web a costo cero para siempre, sin importar el tráfico de imágenes de eventos o perfiles.
- **Límites de CI/CD (Builds):**
  - Cloudflare provee 500 "Builds" mensuales gratuitos (cada `git push` a `main` que compila en React y publica una nueva versión). Esto permite un promedio de ~16 actualizaciones diarias.
- **Dominio:** La recomendación arquitectónica es comprar/administrar el dominio web también a través de Cloudflare Registrar para obtener enrutamiento automático (Zero-Config) y protección de red base (Anti-DDoS y SSL).
