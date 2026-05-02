# 📚 Ciudad Friki — Web App: Contexto Completo del Proyecto

> Última actualización: 2026-03-08
> Este documento describe el estado actual de la web app y sirve como punto de entrada para continuar el desarrollo en nuevas sesiones de IA.

---

## 1. Descripción General

**Ciudad Friki** es una app de comunidad friki (fandom, geek, cultura pop) con:
- 🎮 Trivias clásicas y modos VS (duelos)
- 📅 Eventos de la comunidad
- 🍺 Taberna (foro/hilos de discusión)
- 📊 Encuestas
- 💰 Wallet con Frikicoins (moneda interna)
- 👤 Perfiles de usuario con roles

Existe una **app móvil (React Native/Expo)** en `D:\APP_development\Ciudad_friki\mobile` que es la **fuente de verdad de diseño y lógica**. La web debe ser consistente con ella.

---

## 2. Rutas del Proyecto

| Proyecto | Ruta |
|---|---|
| **Web App** | `D:\APP_development\web_ciudad_friki` |
| **App Móvil** | `D:\APP_development\Ciudad_friki\mobile` |
| **Backend** | Supabase (cloud) |

---

## 3. Stack Tecnológico (Web)

| Capa | Tecnología |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS (configuración custom) |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage + RPC) |
| i18n | react-i18next (`src/i18n/locales/es.json`) |
| Routing | React Router v6 |
| Iconos | lucide-react |
| Dev server | `npm run dev` (puerto 5173) |

---

## 4. Estructura de Directorios

```
src/
├── App.tsx                   # Router principal
├── main.tsx
├── index.css                 # Design system CSS (variables, tokens)
├── components/
│   ├── RootLayout.tsx        # Layout con sidebar, header, notificaciones, wallet
│   ├── CreateEventModal.tsx  # Modal creación de eventos
│   ├── EventCard.tsx         # Card de evento en lista
│   ├── EventDetailsModal.tsx # Modal detalle de evento
│   ├── WalletModal.tsx       # Wallet con historial paginado (10 por página)
│   ├── Footer.tsx            # Footer de la app
│   ├── NotificationsModal.tsx
│   ├── MaintenanceGuard.tsx  # Bloquea app si está en mantenimiento
│   └── Tavern/               # Componentes de la taberna
│       ├── ThreadCard.tsx
│       ├── ThreadDetailsModal.tsx
│       ├── CreateThreadModal.tsx
│       ├── EditThreadModal.tsx
│       └── ContentRenderer.tsx
├── pages/
│   ├── Home.tsx              # Página principal con eventos, noticias, etc.
│   ├── Trivias.tsx           # Trivias clásicas (juego completo)
│   ├── FrikiVS.tsx           # Modo VS (duelos trivia) + lobby
│   ├── Tavern.tsx            # Taberna (lista de hilos del foro)
│   ├── Surveys.tsx           # Encuestas
│   ├── Profile.tsx           # Perfil de usuario + edición
│   ├── Login.tsx             # Autenticación
│   ├── Maintenance.tsx       # Página de mantenimiento
│   ├── AdminToolsPage.tsx    # Herramientas de Administrador (Stats, Whales, Online)
│   └── Legal.tsx             # Términos y privacidad
├── services/
│   ├── TriviaService.ts      # Trivias clásicas + VS duelos
│   ├── EventService.ts       # Eventos (crear, listar, imagen)
│   ├── TavernService.ts      # Taberna (hilos, respuestas, encuestas)
│   ├── SurveyService.ts      # Encuestas independientes
│   ├── AdminToolsService.ts  # Stats de administración, wallets y métricas
│   ├── UserService.ts        # Perfil, avatar, balance
│   └── SystemService.ts      # Config global (mantenimiento)
├── context/
│   ├── AuthContext.tsx       # useAuth() hook global
│   └── ThemeContext.tsx
├── config/
│   └── avatars.ts            # Mapeo avatar_url → src imagen
├── utils/
│   └── triviaIcons.ts        # Mapeo icon/category → imagen local
└── i18n/
    └── locales/es.json       # Todas las traducciones (ES)
```

---

## 5. Diseño / Design System

El sistema de diseño usa **CSS variables** en `index.css`. Los nombres de clase siguen este patrón:

```
bg-bg-main  bg-bg-side  bg-bg-sub         (fondos)
text-text-main  text-text-muted           (texto)
border-border-theme  border-divider-theme
text-brand-primary  text-brand-secondary
text-accent-red  text-accent-green
text-text-inv  (texto sobre fondo oscuro/primario)
bg-ui-overlay  (overlay para modales, backdrop-blur)
```

- **Fuentes**: Inter, secciones bold/black + italic para énfasis
- **Bordes**: `rounded-2xl`, `rounded-3xl`, `rounded-[2rem]` y superiores para cards grandes
- **Modales**: backdrop-blur + `fixed inset-0 z-[200]` (navbar z-50, modales z-[200], gameplay z-[300])

---

## 6. Base de Datos Supabase — Tablas Clave

### Trivias Clásicas
| Tabla | Descripción |
|---|---|
| `trivias` | Lista de trivias (`id, title, description, status, time_limit_seconds, expire_date, reward`) |
| `trivia_questions` | Preguntas (`id, trivia_id, question_text, points, order`) |
| `trivia_options` | Opciones (`id, question_id, option_text, is_correct`) |
| `trivia_attempts` | Intentos (`user_id, trivia_id, score, answers_log, completed_at`) |

### Trivia VS (Duelos)
| Tabla | Descripción |
|---|---|
| `triviaduels_categories` | Categorías VS (`id, name, icon, is_active`) |
| `triviaduels_questions` | Preguntas VS (`id, category_id, question_text, options jsonb [{text,is_correct}], difficulty`) |
| `trivia_duels` | Duelos (`id, creator_id, joiner_id, category_id, question_count, wager_amount, status, question_ids uuid[], winner_id`) |
| `trivia_duel_results` | Resultados (`duel_id, user_id, score, time_ms`) |

### Taberna
| Tabla | Descripción |
|---|---|
| `tavern_threads` | Hilos (`id, user_id, title, content, category, has_poll, embed_url`) |
| `tavern_replies` | Respuestas (`id, thread_id, user_id, content, likes`) |
| `tavern_polls` | Encuestas en hilos (`id, thread_id, options jsonb, votes jsonb`) |

### Wallet
| Tabla | Descripción |
|---|---|
| `wallets` | Balance (`user_id, balance`) |
| `wallet_transactions` | Historial (`user_id, amount, type, description, created_at`) |

### Otros
| Tabla | Descripción |
|---|---|
| `profiles` | Perfil usuario (`id, username, avatar_url, role, bio`) |
| `events` | Eventos (`id, title, description, image_url, start_date, location, category`) |
| `surveys` | Encuestas (`id, title, options jsonb, votes jsonb`) |
| `system_config` | Config global (`key, value`) — incluye `maintenance_mode` |

---

## 7. RPCs (Supabase Functions) Importantes

| RPC | Parámetros | Descripción |
|---|---|---|
| `create_trivia_duel` | `p_category_id, p_question_count, p_wager_amount` | Crea duelo VS, retorna `duel_id (uuid)` |
| `submit_trivia_vs_result` | `p_duel_id, p_score, p_time_ms` | Guarda resultado VS, retorna resultado con winner |
| `deliver_trivia_reward` | `p_user_id, p_trivia_id, p_amount` | Entrega Frikicoins por trivia clásica (SECURITY DEFINER) |
| `get_trivia_vs_winners_ranking` | `limit?` | Ranking de ganadores VS |

---

## 8. Servicios — Métodos Principales

### `TriviaService.ts`

```ts
// Trivias clásicas
TriviaService.fetchTriviaData()             // Lista trivias (con questions como strings legacy)
TriviaService.getTriviaDetails(triviaId)    // Carga preguntas con {id,text,is_correct} — USA ESTO
TriviaService.getTriviasWithStatus(userId)  // Lista + marca completadas por usuario
TriviaService.submitAttempt(userId, triviaId, answers: {questionId: optionId}) // Submit final → reward
TriviaService.finishTrivia(triviaId, score) // Legacy fallback — no usar preferiblemente

// Trivia VS
TriviaService.getVSCategories()
TriviaService.getLobbyDuels(userId)         // { myPendingDuels, publicOpenDuels }
TriviaService.createVSDuel(categoryId, questionCount, wagerAmount) // → duelId
TriviaService.getVSQuestions(questionIds)   // Preguntas del duelo por IDs
TriviaService.submitVSResult(duelId, score, timeMs) // Guarda resultado VS
TriviaService.getVSWinnersRanking(limit)
```

### `EventService.ts`
```ts
EventService.getEvents()
EventService.createEvent(formData)  // Acepta FormData con imagen procesada
EventService.shareEvent(event)      // Share API nativa del browser
```

### `TavernService.ts`
```ts
TavernService.getThreads(category?)
TavernService.createThread(data)    // Incluye encuesta si has_poll
TavernService.getReplies(threadId)
TavernService.createReply(threadId, content)
TavernService.votePoll(threadId, optionIndex)
```

---

## 9. Esquema de Datos — Trivias (CRÍTICO)

### Trivias Clásicas
```ts
// Opción en DB (tabla trivia_options):
{ id: uuid, question_id: uuid, option_text: string, is_correct: boolean }

// Cómo se carga en el service (getTriviaDetails):
{ id: uuid, text: string, is_correct: boolean }

// Cómo se registra la respuesta (answers_log):
{ [questionId: uuid]: optionId: uuid }
// ← Se usa el UUID de la opción, NO el índice
```

### Trivias VS
```ts
// Opción en DB (campo jsonb en triviaduels_questions):
{ text: string, is_correct: boolean }
// ← NO tiene id propio, es_correct es el flag

// Cómo se usa en gameplay:
opt.text  // para mostrar
opt.is_correct  // para detectar respuesta correcta
```

---

## 10. Funcionalidades Implementadas

### ✅ Trivias Clásicas (`Trivias.tsx`)
- Lista de trivias activas con estado completada/pendiente (via `getTriviasWithStatus`)
- Gameplay: preguntas cargadas on-demand al entrar, opciones con `{id, text, is_correct}`
- Selección por `optionId` (UUID), no por índice
- Navegación adelante/atrás entre preguntas (como la app)
- Timer global (`time_limit_seconds` de la trivia, en minutos:segundos)
- Submit final: `submitAttempt()` → calcula score local → `deliver_trivia_reward` RPC
- **Pantalla de resultado** con score, correctas/total, Frikicoins ganados
- Muestra score previo en trivias ya completadas

### ✅ Trivia VS (`FrikiVS.tsx`)
- Lobby con tabs: Mis Duelos / Duelos Públicos / Leaderboard
- Crear Duelo: selector de categoría (con iconos de la app), cantidad de preguntas (5/10/15), apuesta en FC
- Validación de balance antes de crear (consulta `wallets`)
- `GameplayScreen`: preguntas con `opt.text` y `opt.is_correct`, timer 15s/pregunta, opciones barajadas
- Feedback visual: verde = correcta, rojo = incorrecta (1.5s antes de avanzar)
- Pantalla de error si falla la carga (en lugar de pantalla negra)
- Unirse a duelos públicos

### ✅ Wallet (`WalletModal.tsx`)
- Paginación cliente: muestra 10 transacciones, botón "Ver más" carga siguientes 10
- (El backend no tiene paginación implementada — confirmado es igual a la app)

### ✅ Taberna (`Tavern.tsx` + `components/Tavern/`)
- Lista de hilos por categoría
- Crear hilo con soporte de encuesta (poll)
- Ver hilo + replies con render de markdown básico
- Votar en encuestas — rendering consistente con la app
- Editar hilos propios

### ✅ Eventos (`Home.tsx`, `CreateEventModal.tsx`, `EventDetailsModal.tsx`)
- Crear evento con procesamiento de imagen (resize/compress antes de subir) — igual que en la app
- Todos los parámetros del form son idénticos a los de la app
- Share: usa Web Share API + fallback a clipboard con preview de imagen y link

### ✅ Share (`EventCard.tsx`, `EventDetailsModal.tsx`, hilos/posts taberna)
- Usa `navigator.share()` con mensaje, link de la web e imagen (donde disponible)
- Fallback: copia al clipboard con toast informativo

### ✅ Traducciones (`i18n/locales/es.json`)
- Clave `events.date` añadida
- Clave `events.startTime` añadida

### ✅ Mantenimiento
- `MaintenanceGuard.tsx` consulta `system_config` y bloquea la app si `maintenance_mode = true`

### ✅ Herramientas Admin (`AdminToolsPage.tsx`, `AdminBans.tsx`, `AdminTavern.tsx`)
- Dashboard con estadísticas: Cuentas totales, Supply (Circulation/Admin), Encuestas (Activas/Drafts), Transacciones.
- Lista de Whales: Top 5 usuarios con mayor balance (fetching optimizado de emails y avatares).
- Presencia: Monitorización de admins online vía Presence Channels.
- Moderación de Eventos: Integración con `EventDetailsModal` para ver métricas de tráfico (likes/saves).
- **Suite de Moderación de Taberna y Usuarios:**
  - `AdminBans.tsx`: Búsqueda de usuarios para aplicar sanciones totales o "Shadow Bans". Visualiza roles para evitar baneos a administradores.
  - `UserHistoryModal.tsx`: Visualiza el historial completo de infracciones (reportes y posts ocultos) de un usuario específico.
  - Solucionados errores de sintaxis y discrepancias de nombres de columnas (`reports_count` en Supabase).

### ✅ Iconos de categorías VS
- `utils/triviaIcons.ts` mapea el campo `icon` de `triviaduels_categories` a imágenes locales
- Iconos copiados desde `D:\APP_development\Ciudad_friki\mobile\assets\icons`

---

## 11. Cómo Funciona el Gameplay VS (Flujo Completo)

```
1. Usuario selecciona categoría y configura duelo
2. handleCreateDuel() → TriviaService.createVSDuel(categoryId, questionCount, wagerAmount)
   → RPC create_trivia_duel() en Supabase → retorna duelId (UUID)
3. Fetch del duelo: supabase.from('trivia_duels').select('question_ids').eq('id', duelId)
   → question_ids: string[] (UUIDs de preguntas)
4. setActiveDuel({ id: duelId, questionIds }) → muestra GameplayScreen
5. GameplayScreen: TriviaService.getVSQuestions(questionIds)
   → supabase.from('triviaduels_questions').select('*').in('id', questionIds)
   → options es jsonb: [{text,is_correct}]
6. Usuario responde → handleAnswer(optionIndex)
   → opt.is_correct === true para detectar correcta
   → 1.5s feedback → siguiente pregunta
7. Última pregunta → onFinish(score, timeMs)
8. FrikiVS: TriviaService.submitVSResult(duelId, score, timeMs)
   → RPC submit_trivia_vs_result() → retorna resultado con winner_id
9. ResultScreen muestra ganador/perdedor/empate
```

---

## 12. Cómo Funciona el Gameplay Trivia Clásica (Flujo Completo)

```
1. Usuario hace click en trivia → startTrivia(trivia)
2. TriviaService.getTriviaDetails(triviaId)
   → supabase.from('trivia_questions').select('*, options:trivia_options(*)')
   → options: { id, option_text, is_correct } → mapeado a { id, text, is_correct }
3. Muestra preguntas una a una con timer global
4. Usuario selecciona → answers[questionId] = optionId (UUID de trivia_options)
5. Puede navegar atrás/adelante libremente
6. Al final (o timeout) → TriviaService.submitAttempt(userId, triviaId, answers)
   a. Recarga preguntas con getTriviaDetails para verificar respuestas
   b. Compara answers[q.id] === correctOption.id
   c. Calcula earnedPoints y correctCount
   d. INSERT trivia_attempts { user_id, trivia_id, score, answers_log }
   e. Si earnedPoints > 0 → RPC deliver_trivia_reward(userId, triviaId, amount)
7. Pantalla de resultado con score/correctCount/FC ganados
```

---

## 13. Notas de Implementación Importantes

### ⚠️ Tipos de datos críticos

**VS Questions**: Las opciones en `triviaduels_questions.options` son **JSONB** con estructura `{text, is_correct}`. **NO tienen `id`**. Nunca usar índice para detectar correcta — usar `opt.is_correct`.

**Classic Trivia**: Las opciones en `trivia_options` **SÍ tienen `id` UUID**. El `answers_log` guarda `{questionId: optionId}` con UUIDs, no índices.

### ⚠️ Paginación Wallet
El backend NO implementa paginación. Se implementó paginación en el frontend (10 por página, botón "Ver más"). Igual que la app móvil.

### ⚠️ Imágenes de Eventos
Al crear eventos, la imagen se procesa en el cliente (resize a max 1200px, compresión JPEG 80%) antes de subirla a Supabase Storage. Esto es consistente con lo que hace la app.

### ⚠️ Timer en VS
El timer es **15 segundos por pregunta** (fijo, igual que la app). Si se agota, se llama `handleAnswer(-1)` que cuenta como no respondida y avanza.

### ⚠️ Timer en Trivias Clásicas
El timer es **global para toda la trivia** (basado en `time_limit_seconds` de la DB, en segundos). Si se agota, se llama `handleSubmit(true)` que envía lo que había.

---

## 14. Problemas Conocidos / Pendientes

- [ ] **VS Gameplay**: Verificar que el duelo recién creado siempre tenga `question_ids` al momento del SELECT inmediato (puede haber race condition si el RPC es lento)
- [ ] **Offline / error states**: Algunos estados de error son básicos, mejorar UX de errores de red
- [ ] **Notificaciones push**: No implementadas en web
- [ ] **Chat/mensajería directa**: No implementado en web
- [ ] **Trivia VS ResultScreen completa**: El resultado post-duelo muestra datos básicos, comparar más en detalle con `TriviaVSResultScreen.tsx` de la app

---

## 15. Comandos de Desarrollo

```bash
# En D:\APP_development\web_ciudad_friki
npm run dev      # Dev server (puerto 5173)
npm run build    # Build de producción (TypeScript check + Vite)
npm run preview  # Preview del build
```

---

## 16. Convenciones de Código y Reglas de IA

- **Git:** NUNCA realices `git commit` ni `git push` a menos que se te solicite explícitamente.
- **Componentes**: `PascalCase.tsx`
- **Services**: `PascalCase.ts` con métodos `static async`
- **Clases CSS**: Tailwind custom con variables CSS (ver `index.css`)
- **i18n**: `t('clave.subclave', 'Fallback en español')` — siempre con fallback
- **Todos los imports de supabase**: desde `'../lib/supabase'`
- **Auth**: `const { user } = useAuth()` desde `'../context/AuthContext'`

---

## 17. Archivos de la App Móvil Más Relevantes para Comparación

```
D:\APP_development\Ciudad_friki\mobile\src\
├── screens/trivia/
│   ├── TriviaGameScreen.tsx       # Gameplay trivia clásica
│   ├── TriviaGameplayScreen.tsx   # Gameplay VS
│   ├── TriviaListScreen.tsx       # Lista de trivias
│   ├── TriviaVSLobbyScreen.tsx    # Lobby VS
│   └── TriviaVSResultScreen.tsx   # Resultado VS
├── services/TriviaService.ts      # Toda la lógica de trivia
└── types/trivia.ts                # Tipos de datos trivia
```

---

*Generado automáticamente el 2026-03-03. Para continuar el desarrollo, leer este documento al inicio de la sesión.*
