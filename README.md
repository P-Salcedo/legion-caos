# Legión Del Caos · Guía paso a paso (todo gratis)

Lo que usarás: **GitHub** (aloja la app) y **Supabase** (base de datos, cuentas y mensajes en tiempo real).

## Paso 1 · Crear la base de datos en Supabase
1. Entra a **supabase.com** → **Start your project** → inicia sesión con tu cuenta de GitHub.
2. **New project** → nombre `legion-caos` → escribe una contraseña de base de datos y guárdala → elige la región más cercana → **Create new project**. Espera 1–2 minutos.
3. Menú izquierdo: **Authentication** → **Sign In / Providers** → **Email** → desactiva **Confirm email** → **Save**. (Así la cuenta funciona al instante.)
4. Menú izquierdo: **SQL Editor** → **+ New query** → abre el archivo `supabase.sql`, copia TODO, pégalo y pulsa **Run**. Debe decir *Success*. Si algún mensaje dice que ya existe algo, es normal.

## Paso 2 · Conectar la app con tu base de datos
1. Menú: **Project Settings** (engranaje) → **API** (o **API Keys**).
2. Copia **Project URL** (algo como `https://abcd1234.supabase.co`).
3. Copia la clave **anon public**. Si ves pestañas, usa la de *anon* (legacy).
4. Abre `config.js`, reemplaza `TU-PROYECTO` y `PEGA_AQUI_TU_CLAVE_ANON_PUBLIC` con esos datos y guarda.

La clave *anon* es pública por diseño. La seguridad real está en las reglas del `supabase.sql`. **Nunca pongas la clave `service_role` en estos archivos.**

## Paso 3 · Subir todo a GitHub
1. Entra a **github.com** → crea una cuenta gratis si no tienes.
2. Botón **+** → **New repository** → nombre `legion-caos` → marca **Public** → **Create repository**.
3. En la página del repositorio pulsa **uploading an existing file** (o *Add file → Upload files*).
4. Arrastra estos archivos: `index.html`, `styles.css`, `app.js`, `config.js`, `supabase.sql`, `README.md` → **Commit changes**.
5. Ve a **Settings** → **Pages** → en *Source* elige **Deploy from a branch** → *Branch*: **main** y carpeta **/ (root)** → **Save**.
6. Espera 1–2 minutos y recarga. Tu link será `https://TU-USUARIO.github.io/legion-caos/`. Ese link es el que compartes.

## Paso 4 · Registrar a los moderadores (hazlo tú primero)
El primero que registra un nombre se lo queda, así que regístralos antes de compartir el link.
- Abre el link y entra con cada moderador: **usuario exacto** (si tiene símbolos, cópialo y pégalo) y su contraseña.
- Al registrarse reciben su insignia automáticamente. Kirito además tiene la de creador.

## Paso 5 · Probar que se comunican
1. Abre el link en dos aparatos (celular y computadora, o una ventana de incógnito).
2. Entra con dos usuarios distintos.
3. En uno pulsa **＋** → escribe el usuario exacto del otro → **Agregar**.
4. Envía un mensaje: aparece en tiempo real en el otro aparato, y el chat aparece solo en su lista.
5. Pulsa ⚙️ dentro del chat para cambiar el **apodo** y el **fondo** (llamas de código, lluvia de código, sangre, abismo o negro).

## Solución de problemas
- **La pantalla no responde o dice `Failed to fetch`:** revisa `config.js`. La URL debe empezar con `https://` y no tener espacios.
- **`Invalid API key`:** copia de nuevo la clave *anon*. Si tu proyecto solo muestra claves nuevas (*publishable*), en `index.html` cambia `@2.45.4` por `@2`.
- **`Usuario o contraseña incorrectos`:** revisa mayúsculas, espacios y símbolos. Si el usuario no existe, la app intenta crearlo.
- **`No existe ese usuario`:** esa persona debe haberse registrado con ese nombre exacto.
- **Cambiaste el SQL:** pégalo otra vez en **SQL Editor** y pulsa **Run**. Es seguro repetirlo.

## Límites del plan gratis
- **Supabase:** si nadie usa el proyecto durante una semana, se pausa. Entra al panel y pulsa **Restore**. Tiene 500 MB de base de datos y límites de conexiones y mensajes en tiempo real (puedes ver el uso en el panel).
- **GitHub Pages:** gratis en repositorios públicos.
- Las fotos se guardan en la base de datos, así que con mucho uso crece.

## Qué incluye esta versión
Acceso con contraseña segura (Supabase Auth), chats 1 a 1 en tiempo real, apodos editables, fondos de chat, estados que se ocultan a las 24 horas, insignias y panel de moderación, foto de perfil.

Todavía no incluye llamadas reales, comunidades y canales.

## Actualización 2 (teléfono, baneos, mantenimiento)
1. Supabase → **SQL Editor** → **New query** → pega `supabase-v2.sql` → **Run**.
2. En GitHub sube `index.html`, `styles.css` y `app.js` (reemplazan los anteriores) → **Commit changes**.
3. Abre tu link y recarga con **Ctrl+F5** (o Cmd+Shift+R en Mac) para cargar la versión nueva.

## ¿Dónde se guarda todo?
Todo vive en tu proyecto de **Supabase** (servidores en la nube). GitHub solo guarda los archivos de la página.

- **Cuentas y contraseñas:** Supabase → **Authentication → Users**. La contraseña se guarda cifrada (hash); nadie puede leerla, ni tú. No está en el código.
- **Perfiles** (nombre, foto, teléfono, insignias): **Table Editor → profiles**.
- **Contactos, apodos y fondos de chat:** **Table Editor → contacts**.
- **Mensajes:** **Table Editor → messages**.
- **Estados** (se ocultan a las 24 h): **Table Editor → statuses**.
- **Mantenimiento:** **Table Editor → app_config**.

Privacidad: quien administra el proyecto (tú) puede ver los mensajes desde el panel. La app no tiene cifrado de extremo a extremo.

## Verificar que todo está conectado
1. Abre tu link de GitHub Pages.
2. Pulsa **Diagnóstico de conexión** debajo del botón de entrar.
3. Deben aparecer dos ✅: *config.js* y *Base de datos*. Si aparece una ❌, el mensaje te dice qué paso falta.
4. Crea una cuenta de prueba. En Supabase, **Authentication → Users** debe mostrarla, y **Table Editor → profiles** debe tener su fila.
