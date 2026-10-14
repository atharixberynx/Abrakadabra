# Abrakadabra Fashion Shop · Tienda en línea

> _Be fashionable, be Abrakadabra_

Tienda en línea de **Abrakadabra Fashion Shop**, tienda salvadoreña de moda femenina con estilo casual chic y de oficina, en tallas S a XL. Incluye la tienda pública para clientas y un panel administrativo protegido en `/admin`.

Proyecto académico de Desarrollo de Software (stack MERN), pensado para que la marca pueda adoptarlo, modificarlo y mantenerlo. Se publica **sin costo** en Vercel, Render, MongoDB Atlas y Cloudinary.

| Tienda | Catálogo |
| --- | --- |
| ![Página de inicio con el carrusel de banners](docs/capturas/inicio.webp) | ![Catálogo con filtros por categoría, talla, color y precio](docs/capturas/catalogo.webp) |
| **Producto** | **Panel › Editar producto** |
| ![Página de producto con selector de color y talla](docs/capturas/producto.webp) | ![Formulario de producto con colores, tallas y existencias](docs/capturas/panel-producto.webp) |

| Panel › Resumen | Celular |
| --- | --- |
| ![Resumen del panel con métricas](docs/capturas/panel-resumen.webp) | ![Inicio en el celular](docs/capturas/inicio-celular.webp) ![Producto en el celular](docs/capturas/producto-celular.webp) |

---

## Contenido

1. [Funcionalidades](#funcionalidades)
2. [Tecnologías](#tecnologías)
3. [Estructura del repositorio](#estructura-del-repositorio)
4. [Correr el proyecto en local](#correr-el-proyecto-en-local)
5. [Variables de entorno](#variables-de-entorno)
6. [Datos de ejemplo](#datos-de-ejemplo)
7. [Cuentas y administración](#cuentas-y-administración)
8. [Compra en línea y pago de prueba](#compra-en-línea-y-pago-de-prueba)
9. [Panel administrativo](#panel-administrativo)
10. [Editar los textos de las páginas informativas](#editar-los-textos-de-las-páginas-informativas)
11. [Identidad visual](#identidad-visual)
12. [Despliegue gratuito paso a paso](#despliegue-gratuito-paso-a-paso)
13. [Seguridad](#seguridad)
14. [Calidad: pruebas, accesibilidad y rendimiento](#calidad-pruebas-accesibilidad-y-rendimiento)
15. [Mejoras futuras](#mejoras-futuras)

---

## Funcionalidades

**Tienda (clientas)**

- Página de inicio con carrusel de banners, mosaico de categorías, "Lo nuevo", beneficios, "Palazzos", ubicación con mapa y mayoreo por WhatsApp.
- Catálogo con filtros por categoría, talla, color y precio; orden por novedad o precio; búsqueda sin tildes; "Cargar más". Los filtros quedan en la URL para compartir el enlace.
- Página de producto: al elegir un color se muestran las fotos de ese color; las tallas sin existencias aparecen deshabilitadas; cantidad limitada al stock; consulta por WhatsApp con el producto, color y talla escritos.
- Carrito sin cuenta (se guarda en el navegador) y revalidado con el servidor. **Para pagar se pide cuenta**, y luego se vuelve al checkout con el carrito intacto.
- Checkout con retiro en tienda y pago con tarjeta en **modo de prueba**. Confirmación con número de pedido (`ABK-000123`) e instrucciones de retiro.
- Mi cuenta: "Mis pedidos" con su estado, datos personales y cambio de contraseña. "Recuérdame" en el inicio de sesión.
- Páginas informativas: Sobre nosotras, Retiro en tienda, Cambios y devoluciones, Preguntas frecuentes y Guía de tallas.

**Panel administrativo (`/admin`)**

- Resumen con métricas, pedidos (cambio de estado y devolución de stock al cancelar), clientas, productos (colores, tallas, matriz de existencias y fotos por color), categorías, banners de inicio y ajustes de la tienda.

---

## Tecnologías

| Capa          | Tecnología                                                       |
| ------------- | ---------------------------------------------------------------- |
| Frontend      | React 18 + Vite, React Router 7, Tailwind CSS v4, Zustand        |
| Formularios   | React Hook Form + Zod                                            |
| Backend       | Node.js (LTS) + Express 4 (JavaScript, ES Modules)               |
| Base de datos | MongoDB Atlas (M0 gratis) con Mongoose                           |
| Imágenes      | Cloudinary (plan gratuito), subida desde el backend con Multer   |
| Pruebas       | Vitest + Supertest + MongoDB en memoria                          |
| Despliegue    | Vercel (tienda) · Render (API) · Atlas · Cloudinary, sin costo   |

---

## Estructura del repositorio

```
├── client/                      # React + Vite (tienda + panel admin)
│   ├── public/                  # logos optimizados, banners, imágenes de ejemplo
│   ├── scripts/                 # recursos de marca, contraste WCAG, revisión de contenido
│   ├── src/
│   │   ├── admin/               # panel administrativo (se carga aparte)
│   │   ├── components/          # componentes reutilizables (layout, producto, ui…)
│   │   ├── config/store.js      # textos fijos de la marca y valores por defecto
│   │   ├── content/             # paginas-informativas.json (textos editables)
│   │   ├── context/             # sesión y datos de la tienda (Ajustes)
│   │   ├── hooks/ lib/ store/   # lógica compartida, cliente de la API, carrito
│   │   ├── pages/               # páginas de la tienda
│   │   └── theme/brand.css      # colores y tipografías (manual de marca en código)
│   └── vercel.json              # rewrites a Render, SPA y cabeceras de seguridad
├── server/                      # Express + Mongoose (API REST)
│   ├── src/
│   │   ├── config/              # entorno, base de datos, logger, valores por defecto
│   │   ├── controllers/ routes/ # rutas de la API (admin/ siempre protegidas)
│   │   ├── middlewares/         # seguridad, autenticación, validación, subida, errores
│   │   ├── models/              # esquemas de Mongoose
│   │   ├── services/            # lógica de negocio (pedidos, pagos, imágenes…)
│   │   │   └── payments/        # adaptador de pagos: simulado y Wompi (esqueleto)
│   │   └── validators/          # esquemas de Zod
│   ├── scripts/                 # seeds: administrador, catálogo y banners de ejemplo
│   └── tests/                   # 126 pruebas con MongoDB en memoria
├── assets-marca/                # logos y banner originales de la marca
├── docs/capturas/               # capturas de este README
└── render.yaml                  # blueprint de Render (API en plan gratuito)
```

---

## Correr el proyecto en local

**Requisitos:** Node.js 20.19 o superior (recomendado: la versión LTS actual) y una base de datos gratuita en MongoDB Atlas ([ver paso 1 del despliegue](#1-mongodb-atlas-base-de-datos)).

```bash
# 1. Instalar dependencias (raíz, server y client)
npm run install:all

# 2. Crear los archivos de entorno a partir de los ejemplos
cp server/.env.example server/.env
cp client/.env.example client/.env
#    → En server/.env pega tu MONGODB_URI y genera los secretos JWT (ver comentarios del archivo)

# 3. Cargar datos de ejemplo y crear la cuenta de administración (desde server/)
cd server
npm run seed:catalog
npm run seed:banners
npm run seed:admin
cd ..

# 4. Levantar API y tienda a la vez
npm run dev
```

- Tienda: <http://localhost:5173>
- API: <http://localhost:4000/api/health>

En desarrollo, Vite reenvía `/api` al backend, así el navegador ve un solo dominio, igual que en producción. `npm run dev` reinicia la API sola al cambiar el código o el archivo `.env`.

### Scripts

| Dónde     | Script                   | Qué hace                                                         |
| --------- | ------------------------ | ---------------------------------------------------------------- |
| raíz      | `npm run dev`            | Levanta API y tienda juntas                                      |
| raíz      | `npm test`               | Pruebas del backend                                              |
| raíz      | `npm run lint`           | Revisa el código de server y client                              |
| raíz      | `npm run build`          | Genera la versión publicada de la tienda                         |
| `server/` | `npm run seed:admin`     | Crea la cuenta de administración (`-- --reset` cambia la clave)  |
| `server/` | `npm run seed:catalog`   | Carga el catálogo de ejemplo (⚠️ borra categorías y productos)   |
| `server/` | `npm run seed:banners`   | Crea los banners predeterminados (`-- --reset` los restablece)   |
| `client/` | `npm run preview`        | Sirve la versión publicada con las cabeceras de Vercel (CSP)     |
| `client/` | `npm run check:content`  | Revisa el archivo de textos de las páginas informativas          |
| `client/` | `npm run check:contrast` | Verifica el contraste WCAG AA de la paleta                       |
| `client/` | `npm run brand:assets`   | Regenera logos optimizados, favicon, imagen Open Graph y banner  |

---

## Variables de entorno

Los valores sensibles van en archivos `.env`, que **nunca** se suben al repositorio. Cada carpeta tiene un `.env.example` comentado.

**`server/.env`**

| Variable | Para qué sirve |
| --- | --- |
| `NODE_ENV` | `development` en local, `production` en Render |
| `PORT` | Puerto local de la API (Render asigna el suyo) |
| `MONGODB_URI` | Cadena de conexión de Atlas, con el nombre de la base antes del `?` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Secretos distintos de al menos 32 caracteres para las sesiones |
| `CLIENT_URL` | Orígenes permitidos para CORS (la URL de Vercel en producción) |
| `SITE_URL` | URL pública de la tienda, para el mapa del sitio (opcional) |
| `TRUST_PROXY` | Proxies delante de la API: `1` en local; `2` con Vercel + Render |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Credenciales de Cloudinary para subir fotos |
| `PAYMENT_PROVIDER` | `simulated` (pruebas) o `wompi` (pendiente de integrar) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Cuenta que crea `npm run seed:admin` |

**`client/.env`**

| Variable | Para qué sirve |
| --- | --- |
| `VITE_API_URL` | Ruta de la API: déjala en `/api` |
| `VITE_WHATSAPP_NUMBER` | WhatsApp por defecto (después se cambia en Panel › Ajustes) |
| `VITE_STORE_MAPS_URL` | Enlace "Cómo llegar" por defecto (después, en Ajustes) |
| `VITE_SITE_URL` | URL pública, para las vistas previas al compartir y `robots.txt` |

> Todo lo que empieza con `VITE_` termina dentro del JavaScript público: nunca pongas ahí secretos.

---

## Datos de ejemplo

> ⚠️ **Todos los productos, precios, existencias e imágenes del seed son DE EJEMPLO.** Sirven para ver la tienda funcionando; la marca debe reemplazarlos por su catálogo real desde el panel administrativo.

- `npm run seed:catalog` crea **8 categorías y 15 productos** coherentes con la marca: precios de $5 a $25.50, tallas S a XL o talla única, de 2 a 4 colores por prenda, un producto agotado, uno con poco stock, combinaciones que no se ofrecen y ofertas.
- Las imágenes son **siluetas lavanda** (sin fotos de modelos generadas con IA), una por color, para que se vea cómo cambia la foto al elegir un color.
- `npm run seed:banners` crea el banner oficial de la marca y dos banners con los patrones de la tienda.
- El seed del catálogo solo borra categorías y productos (no toca cuentas ni pedidos). En producción pide confirmar con `-- --yes`.

---

## Cuentas y administración

- Las clientas crean su cuenta en `/registro`. El registro **siempre** crea cuentas de clienta, aunque alguien intente enviar `role: "admin"`.
- La **única** forma de crear una cuenta de administración es `npm run seed:admin` (lee `ADMIN_EMAIL` y `ADMIN_PASSWORD`).
- **Recuérdame**: guarda el correo en el dispositivo y mantiene la sesión 7 días; sin marcarlo, la sesión se cierra al cerrar el navegador.
- La cuenta admin **no compra**: recorre la tienda como la ven las clientas (con un botón "Editar este producto"), pero el pago está reservado a cuentas de clienta.

**Credenciales de demostración** (solo de ejemplo; **cámbialas antes de publicar** el sitio):

| Rol   | Correo                    | Contraseña      |
| ----- | ------------------------- | --------------- |
| Admin | `admin@abrakadabra.local` | `CambiaEsta123` |

---

## Compra en línea y pago de prueba

1. La clienta arma su carrito sin cuenta. Al abrirlo, se revisan con el servidor los precios actuales y las existencias.
2. Para pagar inicia sesión o se registra; vuelve al checkout con el carrito intacto.
3. Entrega única: **retiro en tienda**, sin costo de envío.
4. Pago con tarjeta en **modo de prueba**: no se realiza ningún cargo real.
5. Confirmación con el número de pedido y las indicaciones de retiro. El pedido aparece en **Mi cuenta › Mis pedidos**.

### Tarjetas de prueba

| Número                                  | Resultado            |
| --------------------------------------- | -------------------- |
| `4242 4242 4242 4242`                   | Pago aprobado        |
| `4000 0000 0000 0002`                   | Tarjeta rechazada    |
| `4000 0000 0000 9995`                   | Fondos insuficientes |
| Cualquier otra Visa o Mastercard válida | Pago aprobado        |

Usa cualquier nombre, una fecha futura (MM/AA) y cualquier CVV de 3 dígitos. El checkout tiene un botón **"Usar tarjeta de prueba"**.

**Cómo se protege la compra:** el total lo calcula siempre el servidor; el stock se descuenta en una transacción con la condición `stock >= cantidad` (dos compras simultáneas de la última unidad no pueden completarse ambas); si el pago se rechaza, el stock vuelve; solo se guardan la marca y los últimos 4 dígitos de la tarjeta; un doble clic no crea dos pedidos.

**Pasar a Wompi El Salvador:** el pago usa un adaptador en `server/src/services/payments/`. `wompiProvider.js` tiene los pasos (TODO) para integrar **Wompi El Salvador** (<https://docs.wompi.sv>, no confundir con Wompi Colombia) y se activa con `PAYMENT_PROVIDER=wompi`.

---

## Panel administrativo

Entra con una cuenta admin y ve a **`/admin`** (o al botón dorado "Panel admin" del header).

| Sección    | Qué se puede hacer |
| ---------- | ------------------ |
| Resumen    | Pedidos de hoy, pendientes de retiro, ventas del mes (vs. el mismo tramo del mes pasado), poco stock |
| Inicio     | Banners del carrusel: imagen para computadora y celular, texto opcional encima, orden y visibilidad |
| Productos  | Buscar y filtrar, mostrar u ocultar, crear, editar y eliminar |
| Categorías | Crear, renombrar, ordenar, mostrar u ocultar e imagen del mosaico de inicio |
| Pedidos    | Filtrar por estado, fechas o búsqueda; detalle; marcar listo o entregado, o cancelar (devuelve stock); avisar por WhatsApp |
| Clientas   | Lista de solo lectura con resumen y pedidos de cada clienta |
| Ajustes    | Mensajes de la barra de anuncio, WhatsApp, redes, dirección, horario y enlace "Cómo llegar" |

**Estados de un pedido:** por preparar (`pagado`) → `listo para retiro` → `entregado`, o `cancelado`. Entregado y cancelado son finales.

**Crear o editar un producto:** información y precio (con precio anterior si está en oferta) → colores (paleta rápida o personalizados) y tallas → **matriz de existencias** color × talla (la casilla indica si la combinación se vende; las casillas de fila y columna activan o quitan todo un color o una talla) → **fotos** (hasta 8, arrastrar y soltar, la primera es la principal, cada una ligada a su color) → guardar.

### Configurar Cloudinary (fotos)

1. Crea una cuenta gratuita en <https://cloudinary.com/users/register_free> (no pide tarjeta).
2. En *Settings › API Keys* copia **Cloud name**, **API Key** y **API Secret** de una clave con permiso de subida (la clave principal de la cuenta lo tiene).
3. Pégalos en `server/.env` (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`). El aviso amarillo del panel desaparece.

Si la subida falla con **"le faltan permisos" (403)**, la API Key fue creada con permisos limitados: usa la clave principal o dale permiso de subida. Nunca compartas el API Secret; si se llegó a ver, genera una clave nueva.

---

## Editar los textos de las páginas informativas

Los textos de **Sobre nosotras, Retiro en tienda, Cambios y devoluciones, Preguntas frecuentes y Guía de tallas** están en **un solo archivo**: [`client/src/content/paginas-informativas.json`](client/src/content/paginas-informativas.json). Se pueden cambiar sin tocar el código.

1. Cambia solo el texto **entre comillas** a la derecha de los dos puntos. No borres comillas, comas ni corchetes.
2. Para agregar un párrafo, pregunta o paso, copia uno existente y sepáralo del anterior con una coma.
3. Usa estos marcadores, que se rellenan solos con lo guardado en **Panel › Ajustes**: `{tienda}`, `{direccion}`, `{horario}` y `{whatsapp}`.
4. Revisa que quedó bien escrito con `npm run check:content` (dentro de `client/`). Si algo falla, dice qué falta o en qué línea. Esta revisión también corre sola antes de publicar.

- `"borrador": true` en la política de cambios muestra el aviso *"Borrador: por validar con la marca"*, **solo en desarrollo**. Cámbialo a `false` cuando la marca apruebe el texto.
- `"porValidar": true` en la guía de tallas muestra la nota de medidas de referencia. Cámbialo a `false` cuando estén confirmadas.

> Los datos que cambian seguido (anuncios, WhatsApp, dirección, horario, mapa y redes) se editan en **Panel › Ajustes** y se ven al instante.

---

## Identidad visual

| Token        | Color     | Uso |
| ------------ | --------- | --- |
| `brand`      | `#59378D` | Principal: header, botones, enlaces, precios, footer |
| `brand-dark` | `#3F2566` | Hover de botones, texto sobre fondos claros |
| `brand-soft` | `#795393` | Elementos secundarios, bordes activos |
| `lavender`   | `#F3EEF8` | Fondos alternos, tarjetas, chips |
| `gold`       | `#EDC246` | Solo acento (insignia "Nuevo", estrella). Nunca texto dorado sobre blanco |
| `ink`        | `#2A1A40` | Texto principal |

Tipografías: **Josefin Sans** (títulos) y **Montserrat** (texto). Elemento gráfico: la estrella dorada de cuatro puntas del logo.

**Cambiar la identidad (nuevo manual de marca):** todo está en **un solo archivo**, [`client/src/theme/brand.css`](client/src/theme/brand.css): colores, tipografías (incluida la URL de Google Fonts), espaciado de letras, redondeos y sombras.

1. Cambia los **valores** (no los nombres) de los tokens.
2. Corre `npm run check:contrast` en `client/` para confirmar que los textos siguen siendo legibles (WCAG AA).
3. Si cambió el logo o el banner, reemplaza los archivos en `assets-marca/` (mismos nombres) y corre `npm run brand:assets`.

En desarrollo, <http://localhost:5173/guia-de-marca> muestra en vivo la paleta, las tipografías, los botones y las insignias.

---

## Despliegue gratuito paso a paso

| Servicio      | Uso                 | Plan gratuito    |
| ------------- | ------------------- | ---------------- |
| MongoDB Atlas | Base de datos       | M0 (512 MB)      |
| Cloudinary    | Fotos               | Free             |
| Render        | API (backend)       | Free web service |
| Vercel        | Tienda (frontend)   | Hobby            |

**Antes de empezar:** sube el repositorio a GitHub (privado o público). Render y Vercel lo leen desde ahí y se actualizan solos con cada `git push`.

### 1. MongoDB Atlas (base de datos)

1. Crea una cuenta en <https://www.mongodb.com/cloud/atlas> y un clúster **M0 (gratis)**.
2. **Database Access** → crea un usuario con contraseña larga (rol *Read and write to any database*).
3. **Network Access** → agrega `0.0.0.0/0` (*Allow access from anywhere*). Los servidores gratuitos de Render no tienen IP fija, así que no se puede limitar por IP; la protección es el usuario y la contraseña.
4. **Database › Connect › Drivers** → copia la cadena de conexión, reemplaza usuario y contraseña, y agrega el nombre de la base antes del `?`. Recomendado: una base distinta para producción:
   `mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/abrakadabra-prod?retryWrites=true&w=majority`

### 2. Cloudinary (fotos)

Sigue [Configurar Cloudinary](#configurar-cloudinary-fotos) y guarda las tres credenciales para el paso 3.

### 3. Render (API)

1. Entra a <https://render.com> con tu cuenta de GitHub.
2. **New › Blueprint** → elige el repositorio. Render lee [`render.yaml`](render.yaml) y prepara el servicio `abrakadabra-api` en el plan **Free** (carpeta `server`, health check `/api/health` y secretos JWT generados automáticamente).
3. Completa las variables que pide:
   - `MONGODB_URI`: la cadena del paso 1.
   - `CLIENT_URL` y `SITE_URL`: por ahora pon `https://ejemplo.vercel.app`; los cambias en el paso 6.
   - `CLOUDINARY_*`: las credenciales del paso 2.
4. Crea el servicio y espera el primer despliegue. Copia la URL (por ejemplo `https://abrakadabra-api.onrender.com`) y abre `…/api/health`: debe decir `"status":"ok"` y `"database":"conectada"`.

> ¿Sin Blueprint? **New › Web Service** con: *Root Directory* `server`, *Build* `npm ci --omit=dev`, *Start* `npm start`, *Health Check Path* `/api/health`, plan Free, y las variables de [`render.yaml`](render.yaml).

### 4. Cargar datos y crear la cuenta admin en producción

Render gratis no tiene consola, así que los seeds se corren **desde tu computadora** apuntando a la base de producción:

```bash
cd server
# En server/.env cambia temporalmente MONGODB_URI por la de producción,
# y define ADMIN_EMAIL y una ADMIN_PASSWORD fuerte (no la de demostración).
npm run seed:admin
npm run seed:banners
npm run seed:catalog -- --yes   # opcional: solo si quieres los datos de ejemplo
# Luego vuelve a poner tu MONGODB_URI de desarrollo.
```

### 5. Vercel (tienda)

1. En [`client/vercel.json`](client/vercel.json) reemplaza las dos apariciones de `https://TU-BACKEND.onrender.com` por la URL de tu API del paso 3. Haz commit y `git push`.
2. Entra a <https://vercel.com> con GitHub → **Add New › Project** → elige el repositorio.
3. Configura:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite (se detecta solo)
   - **Environment Variables:** `VITE_API_URL=/api`, `VITE_WHATSAPP_NUMBER`, `VITE_STORE_MAPS_URL` y `VITE_SITE_URL` (la URL que te dé Vercel, p. ej. `https://abrakadabra.vercel.app`).
4. **Deploy**. Vercel publica la tienda en una URL como `https://abrakadabra.vercel.app`.

`vercel.json` reenvía `/api/*` y `/sitemap.xml` a Render. Para el navegador todo vive en el mismo dominio, así la cookie de sesión es de primera parte (Safari bloquea las de terceros). También hace que React Router funcione al recargar cualquier página y agrega cabeceras de seguridad (CSP incluida).

### 6. Conectar ambos lados

1. En Render, cambia `CLIENT_URL` y `SITE_URL` por la URL real de Vercel (sin `/` final) y guarda (se redespliega solo).
2. En Vercel, si `VITE_SITE_URL` cambió, vuelve a desplegar (**Deployments › Redeploy**).

### 7. Comprobar que todo funciona

- [ ] `https://tu-tienda.vercel.app/api/health` responde `ok` y `conectada`.
- [ ] En ese mismo `/api/health`, **`clientIp` es tu IP** (búscala en <https://ifconfig.me>). Si aparece otra (de Vercel), ajusta `TRUST_PROXY` en Render: con el rewrite de Vercel suele ser `2`. Esto hace que el límite de intentos de login identifique bien a cada persona.
- [ ] La tienda carga, el carrusel muestra los banners y el catálogo, los productos.
- [ ] Registrarse, cerrar sesión y volver a entrar funciona (al recargar, la sesión se mantiene).
- [ ] Una compra con `4242 4242 4242 4242` termina en la confirmación y aparece en Panel › Pedidos.
- [ ] Entras al panel con la cuenta admin creada en el paso 4 y puedes subir una foto.

### Cosas a saber del plan gratuito

- Render gratis **"duerme" el servidor tras ~15 minutos sin visitas**: la primera visita después tarda de 30 a 50 segundos. La tienda muestra "Cargando la tienda…" y avisa que se está despertando.
- Atlas M0 permite 512 MB, de sobra para el catálogo y los pedidos de una tienda pequeña.
- Si la marca adopta la tienda para vender, conviene revisar los términos: el plan Hobby de Vercel es para uso no comercial, y un servidor que no se duerma mejora la experiencia. Ambos tienen planes de pago de bajo costo.

### Problemas comunes

| Síntoma | Causa probable y solución |
| --- | --- |
| La tienda carga pero no hay productos ni banners | `vercel.json` sigue con `TU-BACKEND`; pon la URL de Render y vuelve a publicar |
| `/api/health` responde pero `database` no dice `conectada` | Revisa `MONGODB_URI` y que Atlas permita `0.0.0.0/0` |
| No se mantiene la sesión al recargar | Entra por la URL de Vercel (no por la de Render) y revisa que `NODE_ENV=production` |
| Subir fotos da error 403 | La API Key de Cloudinary no tiene permiso de subida |
| "Demasiados intentos" con pocas personas | `TRUST_PROXY` incorrecto: revisa `clientIp` en `/api/health` |

---

## Seguridad

**Autenticación:** contraseñas con bcrypt (costo 12) y mensaje genérico en el login; token de acceso JWT de 15 minutos **solo en memoria**; refresh token de 7 días en cookie `httpOnly`, `SameSite=Lax` y `Secure`, con rotación en cada uso y detección de reutilización; en la base solo se guarda su HMAC; el registro ignora `role`; todo `/api/admin/*` exige sesión y rol admin en el backend (la protección de rutas en React es solo experiencia de usuario).

**API:** `helmet`; CORS con lista blanca; body limitado a 100 KB; rate limit en login, registro y checkout (con `trust proxy` configurable); rechazo de claves con `$` o `.` y `sanitizeFilter` de Mongoose contra inyección NoSQL; validación con Zod de body, query y params (lista blanca de campos); errores centralizados sin stack traces en producción; logger que oculta contraseñas, tokens y datos de tarjeta.

**Imágenes:** solo administradoras; JPG, PNG o WEBP de hasta 5 MB y máximo 8 por producto; se valida el tipo real del archivo por su firma binaria.

**Tienda publicada:** Content-Security-Policy estricta (sin scripts externos ni `eval`), `X-Frame-Options`, `nosniff`, `Referrer-Policy` y `Permissions-Policy` desde `vercel.json`. Sin `dangerouslySetInnerHTML` y sin tokens en localStorage.

---

## Calidad: pruebas, accesibilidad y rendimiento

- **Pruebas:** 126 pruebas del backend (`npm test`) con MongoDB en memoria: autenticación y sesiones, permisos de admin, catálogo y filtros, administración de productos, fotos y banners, checkout (precios del servidor, tarjetas de prueba, stock atómico, compras simultáneas de la última unidad, idempotencia), gestión de pedidos y ajustes.
- **Accesibilidad:** auditoría con axe-core: **0 infracciones WCAG 2.1 A/AA** en la tienda, la cuenta y el panel, en escritorio y celular. Contraste AA verificado con `npm run check:contrast`, foco visible, enlace "Saltar al contenido", textos alternativos y formularios con etiquetas y errores anunciados.
- **Responsive:** revisado a 360, 768, 1024 y 1280 px sin desbordes horizontales (diseño pensado primero para el celular).
- **Rendimiento:** cada página se descarga al visitarla (paquete inicial de ~58 KB comprimido); imágenes de Cloudinary con `f_auto,q_auto` y anchos responsivos.
- **SEO:** título y descripción por página, Open Graph para compartir en WhatsApp y Facebook, datos estructurados de producto, `robots.txt` y mapa del sitio (`/sitemap.xml`).

---

## Mejoras futuras

- Recuperación de contraseña por correo (usar la API HTTP de Brevo: Render gratis bloquea SMTP).
- Integración real con Wompi El Salvador (<https://docs.wompi.sv>).
- Envíos a domicilio como segundo método de entrega.
- Correos o mensajes automáticos de "pedido listo para retirar".
- Reemplazar los datos e imágenes de ejemplo por el catálogo y las fotos reales de la marca, y validar la política de cambios y la guía de tallas.
