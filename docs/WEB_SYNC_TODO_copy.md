# WEB_SYNC_TODO — Guía de Sincronización Mobile → Web

**Propósito:** Este documento es el puente oficial entre el proyecto móvil (`Ciudad_friki`) y el proyecto web (`web_ciudad_friki`). Cualquier IA que trabaje en la app web **debe** registrar aquí cualquier cambio en flujos, pantallas o base de datos para que ambas plataformas se mantengan sincronizadas.

**Convención de estados:**
- `[ ]` Pendiente de implementar en la web
- `[x]` Ya implementado en la web (marcar cuando esté listo)

> *Nota:* Todas las implementaciones de la v1.1.0 hacia atrás ya han sido incorporadas y se han eliminado de este documento para mantenerlo limpio y óptimo para el límite de contexto de la IA.

---

## ❌ EXCLUSIONES (NO migrar a la web)

- **Trading Card Game (TCG):** El directorio `mobile/src/screens/tcg` es exclusivo de la app móvil.
- **TTRPG (Rol):** Las hojas de personaje TTRPG son exclusivas de la app móvil por ahora.
- **Herramientas de Staff/Admin:** `AdminEventsScreen.tsx`, `RoleManagementScreen.tsx`, `WorkerCenterScreen.tsx` y herramientas de Game Master no son prioridad para la web a menos que el usuario lo indique.
- **Escáner QR de Asistencia:** La función de *escanear* el QR físico (usando la cámara) es exclusiva de la app móvil. La web solo necesita *generar y mostrar* el QR para el organizador.

---

## ✅ MEJORAS DE INFRAESTRUCTURA Y SISTEMAS (v1.2.0)

> **Importante para la IA Web:** Estas funcionalidades requieren implementarse en la plataforma Web para mantener la simetría absoluta con la app móvil.

### [ ] 1. Sistema de Comunicados Globales (Zero-Impact Broadcasts) 📣

**Contexto:** En la app móvil, hemos implementado un sistema para que el administrador pueda enviar mensajes masivos a toda la base de usuarios sin insertar miles de filas en la tabla `notifications`. Para ello usamos la tabla `global_broadcasts`.
**Instrucciones:**
- **Lectura:** En la bandeja de notificaciones de la web, debes realizar una doble consulta (o UNION lógica en el frontend):
  1. Consultar `notifications` para notificaciones personales.
  2. Consultar `global_broadcasts` para los mensajes globales.
- **Estado de Lectura:** Como los comunicados globales son una sola fila genérica, el estado de "leído" de cada usuario debe guardarse en el almacenamiento local de su navegador (`localStorage`).
- **Vista de Admin (GM Panel):** Agregar un formulario en el panel de administrador para insertar en la tabla `global_broadcasts` (Título y Mensaje).

### [ ] 2. Kill-Switch: Modo Mantenimiento 🚧

**Contexto:** Se ha introducido una bandera de mantenimiento en la tabla `global_settings` (`key = 'app_maintenance_mode'`).
**Instrucciones:**
- **Interceptor Global:** En la carga inicial de la web (App.tsx o similar), o mediante WebSockets de Supabase, escucha los cambios de `app_maintenance_mode`.
- **Bloqueo:** Si el valor es `true`, redirige inmediatamente al usuario a una pantalla de mantenimiento (`MaintenanceScreen`).
- **Bypass de Admin y Logout:** La pantalla de mantenimiento debe tener obligatoriamente un botón de **Cerrar Sesión**. Si no hay una sesión activa, la web debe mostrar siempre la vista de Login (Auth) para permitir que los administradores puedan iniciar sesión.
- **Excepción Administrativa:** Si el rol del usuario en la tabla `profiles` es `admin`, debe ignorar el bloqueo y poder navegar normalmente por la web.

### [ ] 3. Moderación y Reseñas de Aliados Comerciales 🏪

**Contexto:** Agregamos una tabla `ally_reviews` (ver archivo `20260809024611_ally_reviews.sql`).
**Instrucciones:**
- **Perfil de Aliados:** En el directorio de la web donde se listan los negocios aliados, implementar el componente para que los usuarios puedan dejar y editar su propia calificación (estrellas y comentario).
- **Traducciones:** Recuerda implementar los textos con `i18next` o la librería de internacionalización usada en la web, de forma bilingüe (español e inglés).

### [ ] 4. Soporte para Mapas (PostGIS) 🗺️

**Contexto:** Añadimos soporte geoespacial (ver archivo `20260808000000_postgis_maps.sql`).
**Instrucciones:**
- **Visor Geográfico:** En la web, si existe una sección de mapa, asegúrate de que pueda renderizar las coordenadas obtenidas de la base de datos (PostGIS). Si la web aún no tiene mapa interactivo, prepara la interfaz o avisa al usuario para crearla en el siguiente sprint.

### [ ] 5. Estadísticas de Administración (Admin Stats) 📊

**Contexto:** La función SQL `get_admin_stats()` fue corregida (se lee `survey_stats` en vez de `survey_responses`) para evitar bloqueos por Row Level Security.
**Instrucciones:**
- **Panel Web:** Si la web cuenta con un panel de administrador que muestra métricas globales, asegúrate de consumir la función RPC `get_admin_stats()`. No hagas un conteo directo desde el frontend hacia la tabla `survey_responses`, ya que el RLS devolverá 0 por protección. Usa la función SQL que ya está parcheada y lista en la BD.

## ✅ SISTEMA DE RECOMPENSAS Y EVENTOS (v1.3.0)

### [ ] 6. Múltiples QRs por Evento y Compartir (Multi-day events) 🎁

**Contexto:** Se ha modificado la arquitectura de los QRs de eventos. Ahora, cuando un evento dura múltiples días (tiene `end_date`), la base de datos genera automáticamente múltiples registros en `event_codes` (uno por cada día de duración) usando un Trigger de base de datos.
**Instrucciones:**
- **Panel de Organizador (Mis Eventos):** En lugar de mostrar un único QR, la web debe consultar la tabla `event_codes` usando el `event_id`. Debes mostrar una lista vertical de todas las tarjetas generadas para el evento. Cada código debe incluir la fecha en que es válido (`valid_from`).
- **Tarjetas QR Individuales:** En la app móvil se descubrió que es inusable intentar compartir múltiples QRs al mismo tiempo. Cada QR debe tener su propio contenedor ("tarjeta") que muestre claramente el nombre del evento, la etiqueta (ej. "Dia 1"), la fecha de validez y su propio botón de "Descargar/Compartir QR" para que el usuario guarde esa imagen en específico.
- **Codificación Transplataforma:** La base de datos ahora guarda los QRs generados bajo el string `" - Dia [X]"` (sin tilde) de forma estricta. Esto previene bugs de codificación (UTF-8 vs ANSI) que causaban la aparición de Kanjis japoneses en la app. La web no debe intentar "corregir" ni tildar las peticiones a la BD bajo ese sufijo, pero puede mostrarlo con tilde en UI si lo desea.
- **Vista Pública (Feed y Detalles):** Para incentivar la asistencia, la web debe calcular y mostrar la máxima cantidad posible de Frikicoins que el usuario puede ganar si asiste todos los días. Multiplica `qr_reward_amount` por la cantidad de días del evento (`end_date - date`) y muestra un texto estilo "✨ Hasta [Total] FC".
- **Lógica de canje:** Cada código QR (uno por día) permite **1 canje por usuario por día**. El backend ya valida el `valid_from` para evitar fraudes adelantados.

### [ ] 7. Lógica de UI para Eventos Activos vs Finalizados 🗓️

**Contexto:** En la app móvil, se descubrió un bug donde los eventos que abarcaban varios días o que estaban ocurriendo en el momento actual, se marcaban como "finalizados" y ocultaban los botones para ver los QRs, impidiendo la gestión del evento en vivo.
**Instrucciones:**
- **Fechas seguras (Timezone-proof):** Al evaluar en JavaScript si un evento ha empezado o finalizado comparando con `new Date()`, extrae estrictamente el string `YYYY-MM-DD` de las fechas que devuelve la BD (ej. usando `dateStr.split('T')[0].split(' ')[0]`). Si usas parseos directos en zonas horarias distintas al UTC, puedes calcular erróneamente que un evento de hoy ya terminó.
- **Acciones Disponibles:** Un evento se considera "empezado" cuando la fecha/hora de inicio ya pasó, pero solo se considera "finalizado" (`isFinished`) cuando su fecha `end_date` (o `date`) a las 23:59:59 ya pasó.
- Mientras un evento está "empezado" pero no "finalizado", se debe **ocultar** el botón de Editar, pero **mantener visibles** los botones de Cancelar, Posponer y Ver QR.

### [ ] 8. Historial de Billetera — Recompensas de Asistencia 💳

**Contexto:** Se corrigió un bug grave en la función SQL `redeem_event_code` que impedía el depósito de las recompensas y, además, insertaba códigos internos incomprensibles en la descripción.
**Instrucciones:**
- **Historial de Transacciones (Web):** Si implementas la vista del historial de la billetera en la web, ten en cuenta que el campo `description` en la tabla `wallet_transactions` ahora trae por defecto el texto `"Asistencia: [Título del Evento]"`.
- **UI:** En la interfaz, si la transacción es del tipo `event_reward`, debes darle prioridad al campo `description` para mostrarlo como título o subtítulo de la transacción, ya que contiene el formato amigable.

---

## ✅ MEJORAS DE UX/PERFORMANCE (v1.3.1)

### [ ] 7. Mapa Interactivo — Correcciones de Fluidez y Comportamiento 🗺️

**Contexto:** Se corrigieron múltiples problemas de UX en el mapa del Dashboard móvil. La web debe seguir los mismos patrones si implementa un mapa.
**Instrucciones:**
- **Debounce en carga de pines:** Al detectar cambio de región en el mapa (`onRegionChangeComplete` o equivalente), aplica un debounce de **400ms** antes de llamar a `get_events_in_bounds` y `get_sponsored_locations_in_bounds`. Sin este debounce, se disparan decenas de llamadas seguidas mientras el usuario arrastra el mapa causando lag severo.
- **Centrar en usuario:** Al abrir el mapa por primera vez, centra la vista en las coordenadas del usuario con una animación suave. No uses solo `initialRegion`, ya que si el GPS tarda más de lo que tarda el mapa en montarse, la posición inicial se pierde. Usa el equivalente a `map.animateToRegion()` o `flyTo()`.
- **Pines no mueven el mapa:** Deshabilitar el comportamiento nativo de mover el mapa al presionar un pin (`moveOnMarkerPress={false}` en react-native-maps, `scrollWheelZoom` equivalente en Leaflet/Mapbox). El pin debe mostrar una tarjeta en pantalla sin reubicar el mapa.
- **Editor de Eventos — Zoom correcto:** Cuando un usuario edita un evento existente que ya tiene coordenadas guardadas (`lat`/`lng`), el mini-mapa de ubicación debe arrancar con un zoom cercano (`zoom ~14` o `latitudeDelta: 0.012`) directamente sobre el pin, no con la vista de ciudad entera.

### [ ] 8. Optimización de Costos en Google Maps (Session Tokens) 💰

**Contexto:** Google Maps cobra por pulsación de tecla si se usa el servicio *Places Autocomplete* sin agrupar por sesión. En la app móvil refactorizamos el `GooglePlacesAutocomplete` para usar *Session Tokens*.
**Instrucciones:**
- **Autocompletado Web:** Si implementas un buscador de direcciones en la web usando la API de Google Places, **debes** generar un identificador de sesión único (Session Token) al enfocar el input y enviarlo en cada petición de *Autocomplete*.
- **Place Details:** Ese mismo token debe enviarse al consultar los detalles de la ubicación elegida (*Place Details*).
- **Fallback de UUID:** Si usas un motor JS que no soporte `crypto.randomUUID()`, implementa una función de generación UUID pura de fallback para no romper la app (el error `Property 'crypto' doesn't exist`).

### [x] 9. Actualización de Políticas y Términos por Google Maps ⚖️

**Contexto:** Los términos de servicio de Google Maps Platform exigen explícitamente que la app incorpore enlaces visibles a sus condiciones y que se declare en la Política de Privacidad el uso y compartición de datos de ubicación.
**Instrucciones:**
- **Footer/Legal:** Añade los textos correspondientes a la Política de Privacidad (declarando uso de APIs de Google Maps) y en Términos y Condiciones.
- **Aviso en Mapa:** Asegúrate de no ocultar el logotipo de Google ni los enlaces de los términos en los márgenes del mapa en la interfaz web, ya que esto viola las políticas de uso y puede resultar en baneo de API Keys.

### [ ] 10. Consistencia Gráfica: Pines y Leyenda del Mapa 🎨

**Contexto:** En la app móvil, el diseño de la leyenda y los pines del mapa se actualizó. Ahora usamos los archivos PNG nativos (`pin_event_gold.png`, `pin_ally_purple.png`, etc.) directamente sobre el motor del mapa para evitar el bug de recorte en Android (Bitmap Clipping).
**Instrucciones:**
- **Pines del Mapa Web:** Si implementas un visor web, utiliza los mismos íconos pre-coloreados en formato PNG. Las convenciones de colores son: Eventos (Azul y Dorado), Tienda Friki (Naranja), Centro Gaming (Morado), Cultural (Cian), Comida (Rojo), Sedes (Verde).
- **Leyenda:** La leyenda de filtros en el mapa **solo** debe usar puntos o cuadrados redondeados de color sólido de 12x12 píxeles junto al texto. No colocar íconos adentro para evitar ruido visual, de manera que coincida exactamente con la nueva experiencia limpia implementada en móvil.

### [ ] 11. Fixes Críticos (Storage Bucket & Fechas Off-By-One) 🐛

**Contexto:** Se solucionaron errores graves en la creación de eventos en móvil que deben evitarse en web.
**Instrucciones:**
- **Storage Bucket `event-banners`:** Los banners de los eventos ya no van al mismo bucket que los avatares. Van a un bucket propio llamado `event-banners`. Asegúrate de que las peticiones de subida en la web (uploader) apunten a este nuevo bucket.
- **Off-By-One (Zonas Horarias):** Al guardar una fecha del selector (`DatePicker`), **NUNCA** utilices `date.toISOString()` y cortes el string. El `.toISOString()` transforma al formato UTC (GTM+0). Como estamos en LATAM (ej: GTM-5), un evento de las "01:00 AM del 30 de Octubre" se guardará como "29 de Octubre" por el desfase.
- **Solución (Fechas):** Extrae los valores locales (`getFullYear`, `getMonth`, `getDate`) y construye el formato `YYYY-MM-DD` manualmente o usa bibliotecas seguras con timezones (como `date-fns-tz` o `dayjs`).

---

## ✅ FIXES DE ESTABILIDAD (v1.3.2 — sesión 2026-08-21)

### [ ] 12. Eventos Patrocinados — Límite Activo vs. Histórico 🏆

**Contexto:** El trigger `enforce_max_sponsored` en la base de datos bloqueaba marcar nuevos eventos como patrocinados porque contaba también los eventos pasados que habían sido patrocinados. Se ha corregido la función en la BD (migración `20260821015600_fix_sponsored_limit.sql`).
**Instrucciones:**
- **Panel de Admin (Web):** La web no necesita cambios en frontend para este fix ya que la validación vive en la BD. Sin embargo, al recibir el error `'Cannot have more than 2 sponsored events active at the same time.'`, el mensaje al usuario debe ser claro: "Ya hay 2 eventos patrocinados activos. Espera a que uno finalice para poder patrocinar otro."
- **Historial:** En la vista de historial de eventos, si un evento figura con `is_sponsored = true` pero su fecha ya pasó, mostrar la insignia dorada de patrocinado de forma tenue/desactivada (ej: `opacity: 0.5`) para indicar que fue patrocinado en su momento pero ya no ocupa un slot activo. **No mostrar** botón para quitarle el patrocinio en la vista de historial, ya que es un registro inmutable de auditoría.

### [ ] 13. Panel de Aliados — Mapa de Edición con Pin Precargado 📍

**Contexto:** En la app móvil, el formulario de creación/edición de aliados (`AlliesAdminScreen.tsx`) fue completamente sincronizado con la UX del mapa de eventos. Antes, al editar un aliado existente, el mapa no centraba en las coordenadas guardadas.
**Instrucciones:**
- **Prioridad de Lectura de Coordenadas:** Al cargar un aliado para editar, priorizar la lectura desde los campos planos `lat` y `lng` de la tabla `sponsored_locations`. Solo como fallback, intentar parsear el campo espacial `location` en formato `POINT(lng lat)`. Esta priorización corrige el caso donde el campo `location` no existe o está en formato diferente.
- **Zoom Inteligente al Editar:** Cuando el aliado ya tiene coordenadas, el mini-mapa del formulario debe inicializarse con un zoom cercano (`latitudeDelta: 0.012`) sobre el pin existente. Cuando es un aliado nuevo (sin coordenadas), mostrar la vista amplia de ciudad (`latitudeDelta: 0.1`).
- **Botón GPS Flotante:** Incluir un botón de "centrar en mi ubicación" (ícono de punto de mira) flotante sobre el mini-mapa, igual que en el formulario de eventos.
- **Badge de Estado del Pin:** Mostrar un badge en la esquina inferior izquierda del mapa: `"Pin ubicado ✓"` (en color de marca) si hay coordenadas, o `"Toca el mapa para poner el pin"` (fondo oscuro translúcido) si no las hay.
- **Pines Nativos:** El marcador del aliado en el editor debe usar la imagen PNG nativa (`pin_ally_orange.png` u equivalente por tipo) via la prop `image` del `Marker`, igual que en el mapa principal. Esto evita el recorte de bitmaps en Android.

### [ ] 14. Fix de Codificación UTF-8 en Descripciones de QR 🔡

**Contexto:** Un bug de incompatibilidad de encoding entre Windows (ANSI) y PostgreSQL (UTF-8) causaba que los campos `description` de la tabla `event_codes` se guardaran con caracteres corruptos (caracteres japoneses) en lugar de la tilde española (ej: `"D稳a 2"` en vez de `"Día 2"`). Se aplicó la migración `20260821021200_fix_dia_encoding.sql`.
**Instrucciones:**
- **UI Web:** En la web, al mostrar la etiqueta del QR, el campo `description` puede tener el sufijo `"Dia X"` (sin tilde) proveniente de la BD. La web es libre de transformar ese texto para mostrarlo con tilde en pantalla (`"Día X"`), pero nunca debe reescribir ese campo en la BD.

---

## ✅ ÚLTIMOS FIXES DE BACKEND Y UI (Sesión 2026-08-22)

### [ ] 15. Optimización del Panel de Trivias Admin 🚀

**Contexto:** La vista de moderación de trivias sufría problemas de rendimiento (N+1 queries) y mostraba trivias vencidas como "activas". Se creó el RPC `get_admin_trivias_paginated` para resolverlo.
**Instrucciones:**
- **Paginación y RPC:** El panel web de administración **no debe** consultar la tabla `trivias` directamente. Debe usar la función RPC `get_admin_trivias_paginated(p_limit, p_offset, p_status_filter)`.
- **Filtros de Estado:** Implementar pestañas o filtros para ver trivias: `active`, `expired`, `all`, `draft` y `paused`. El RPC ya se encarga de calcular si una trivia está activa o expirada basado en la fecha del servidor, así que el frontend web no tiene que hacer el cálculo.
- **Conteo Global:** Para mostrar la métrica del dashboard "Total de intentos históricos", no cuentes las filas en memoria. Haz un `count` directo a la tabla `trivia_attempts`.

### [ ] 16. Fix Crítico: Timezones (UTC vs Colombia) y Feed de Eventos ⏱️

**Contexto:** Los servidores en la nube operan en UTC, lo que causaba que a las 7:00 PM de Colombia (00:00 UTC) la base de datos y la app ya creyeran que era "mañana". Esto cerraba eventos prematuramente y activaba QRs antes de tiempo.
**Instrucciones:**
- **Generación de QRs:** El backend ya fue modificado para usar estrictamente `America/Bogota` en la generación de QRs. La web no debe preocuparse por la generación, pero debe saber que las fechas `valid_from` y `expires_at` ahora están calibradas para la medianoche colombiana.
- **Feed Público de Eventos (Fix Multi-día):** Para listar los eventos "vigentes" en la web, ya **NO** debes usar un simple filtro `.gte('date', today)`. Esto oculta eventos de múltiples días que empezaron en el pasado pero aún no terminan. Debes usar la sintaxis `.or('date.gte.${today},end_date.gte.${today}')`.
- **Cálculo de "Hoy":** En el código frontend de la web, cuando necesites enviar la fecha de "hoy" (string YYYY-MM-DD) a Supabase, **nunca uses** `new Date().toISOString().split('T')[0]` porque eso devuelve la fecha UTC. Usa el offset local: `new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]`.