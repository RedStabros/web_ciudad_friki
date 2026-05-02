# 🌐 Guía de Configuración: Dominio Oficial en Cloudflare

Este documento detalla el paso a paso exacto de lo que debes hacer en el momento en que decidas comprar el dominio oficial para **Ciudad Friki** y salir a producción pública.

---

## 🛒 PASO 1: Compra del Dominio en Cloudflare
Ya que tienes tu proyecto alojado en Cloudflare Pages, comprar el dominio ahí mismo es la mejor decisión técnica, ya que la configuración DNS será automática (Zero-Config).

1. Inicia sesión en tu panel de [Cloudflare](https://dash.cloudflare.com/).
2. En el menú lateral izquierdo, ve a **"Registro de dominios" (Domain Registration)** -> **"Registrar dominio" (Register Domains)**.
3. Busca el dominio deseado (ej. `ciudadfriki.com`).
4. Sigue los pasos de pago. Cloudflare no cobra sobreprecio en renovaciones, pagarás el precio mayorista.
5. Una vez comprado, Cloudflare automáticamente creará la "Zona DNS" para tu dominio.

---

## 🔗 PASO 2: Asignar el Dominio al Proyecto de Pages
Ahora debes decirle a tu aplicación web que empiece a responder cuando alguien visite tu nuevo dominio.

1. En el panel de Cloudflare, ve a **"Workers & Pages"**.
2. Selecciona tu proyecto actual: `web-ciudad-friki`.
3. Ve a la pestaña **"Dominios personalizados" (Custom Domains)**.
4. Haz clic en el botón **"Configurar dominio personalizado" (Set up a custom domain)**.
5. Escribe el dominio que acabas de comprar (ej. `ciudadfriki.com`).
6. Cloudflare detectará que el dominio está bajo su misma administración y te preguntará si deseas que agregue los registros DNS automáticamente. **Dile que SÍ (Activar / Añadir registro).**
7. *Nota:* Cloudflare también se encargará de generar automáticamente el certificado SSL (HTTPS) de forma gratuita. Esto toma unos minutos.

---

## ⚙️ PASO 3: Actualizar Supabase (MUY IMPORTANTE)
Al igual que hicimos con el dominio de pruebas (`.pages.dev`), debes autorizar tu nuevo dominio oficial para que los logins y correos funcionen.

1. Ve a tu proyecto en **Supabase** -> **Authentication** -> **URL Configuration**.
2. **Site URL:**
   - Cambia la URL provisional por tu nuevo dominio (ej. `https://ciudadfriki.com`).
3. **Additional Redirect URIs:**
   - Haz clic en "Add URL" y agrega las rutas oficiales:
     - `https://ciudadfriki.com/auth/callback`
     - `https://ciudadfriki.com/reset-password`
   - *(Opcional: Si ya no usarás el `.pages.dev`, puedes borrar esas URLs de la lista para mayor limpieza, pero asegúrate de **NO borrar** las que empiezan con `ciudadfriki://` que pertenecen a tu app móvil).*

---

## 🔑 PASO 4: Actualizar Google Cloud Console (Login con Google)
Finalmente, debes decirle a Google que es seguro iniciar sesión desde tu nuevo dominio.

1. Ve a **Google Cloud Console** -> **APIs & Services** -> **Credentials**.
2. Edita tu credencial de **Web client (OAuth 2.0)**.
3. En **Orígenes autorizados de JavaScript (Authorized JavaScript origins)**:
   - Haz clic en "+ Agregar URI".
   - Escribe tu dominio oficial sin barras al final (ej. `https://ciudadfriki.com`).
   - *(Puedes dejar o borrar la de `.pages.dev`, como prefieras).*
4. Guarda los cambios. *(Recuerda que los cambios en Google pueden tardar desde 5 minutos hasta un par de horas en propagarse).*

---

### 🎉 ¡LISTO!
Una vez completes estos 4 pasos, tu plataforma web estará operando 100% bajo tu propio dominio oficial, con máxima seguridad SSL y la autenticación totalmente vinculada a tu ecosistema móvil.

---

## 📱 PASO 5: Despliegue en Google Play Console (Pruebas Cerradas)

Una vez que tu ecosistema web está listo (con los links legales en su dominio oficial), el siguiente paso crítico es preparar la aplicación móvil para su publicación en Android.

### 1. Crear y Pagar la Cuenta de Desarrollador
1. Ingresa a la [Google Play Console](https://play.google.com/console/signup).
2. Inicia sesión con la cuenta de Google que deseas asociar a la corporación (idealmente, la cuenta institucional, ej. udcarkangel@gmail.com).
3. Selecciona el tipo de cuenta: "Cuenta de organización" (ya que tienes el NIT de Corporación Ciudad Friki) o "Cuenta personal".
4. Completa la información solicitada.
5. **Paga la tarifa única de $25 USD** usando una tarjeta de crédito o débito internacional.
6. Google te pedirá verificar tu identidad subiendo documentos (foto de tu cédula y/o documentos legales de la corporación).

### 2. Configurar Políticas y Ficha de la App
Antes de poder subir la app, debes configurar los requisitos legales dentro de Play Console:
1. Ve a **"Crear aplicación"**.
2. En el menú lateral izquierdo, ve a **"Contenido de la aplicación"** (App Content) y completa todas las declaraciones:
   - **Política de Privacidad:** Pega la URL oficial (ej. `https://ciudadfriki.com/legal/privacy`).
   - **Eliminación de Datos:** Pega la URL oficial (ej. `https://ciudadfriki.com/account-deletion`). Esto es un requisito obligatorio nuevo de Google.
   - **Acceso a la app:** Como la app requiere inicio de sesión, debes proporcionar a Google un email y contraseña de prueba para que sus revisores puedan entrar a revisar "La Taberna" y otras funciones.
   - Responde los cuestionarios de clasificación de contenido, público objetivo (marcar para adolescentes/adultos, no para niños), recopilación de datos, etc.

### 3. Preparar la Prueba Cerrada (14 Días / 20 Testers)
La normativa actual de Google para desarrolladores nuevos exige que la app sea probada por al menos 20 personas reales durante 14 días continuos.

1. En el menú izquierdo, ve a **"Pruebas" -> "Pruebas cerradas"**.
2. Haz clic en **"Crear pista"** o usa la pista "Alfa" predeterminada.
3. **Añadir Testers:**
   - Ve a la pestaña **"Verificadores"** (Testers).
   - Crea una "Lista de correo electrónico".
   - Añade manualmente los correos (obligatoriamente correos de Google/Gmail) de al menos **20 personas de tu entera confianza**.
4. **Subir el Bundle (AAB):**
   - Asegúrate de haber compilado tu app móvil usando EAS Build para producción (`eas build --platform android --profile production`).
   - En Play Console, ve a la pestaña **"Versiones"** de tu prueba cerrada, crea una nueva versión y sube el archivo `.aab`.
5. Envía la versión a revisión de Google. (Esto puede tardar de 2 a 7 días hábiles).

### 4. Ejecutar la Prueba
1. Cuando Google apruebe la versión Alfa, la pestaña "Verificadores" mostrará los enlaces ("Enlace en la web" y "Enlace de Google Play").
2. Envía ese enlace a tus 20 testers.
3. **REGLA CRÍTICA:** Todos deben hacer clic en el enlace, unirse como testers, instalar la app y **mantenerla instalada (y abrirla un par de veces) durante 14 días ininterrumpidos**. Si varios la desinstalan, Google puede reiniciar el reloj.
4. Tras pasar los 14 días exactos con los 20 testers activos, se habilitará un botón en tu panel de Play Console que dice **"Solicitar producción"**. 
5. Llenarás un breve cuestionario sobre el feedback que te dieron tus testers, y una vez aprobado... ¡La app será pública a nivel mundial!
