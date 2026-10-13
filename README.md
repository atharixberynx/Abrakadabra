# Abrakadabra Fashion Shop · Tienda en línea

> _Be fashionable, be Abrakadabra_

Tienda en línea de **Abrakadabra Fashion Shop**, tienda salvadoreña de moda femenina (estilo casual chic y de oficina, tallas S a XL). Incluye la tienda pública para clientas y un panel administrativo protegido en `/admin`.

Proyecto académico de Desarrollo de Software, pensado para que la marca pueda adoptarlo y mantenerlo.

> 🚧 **Estado:** Fase 4 de 8 (panel admin de productos). Este README se completa en cada fase.

---

## Tecnologías (stack MERN)

| Capa          | Tecnología                                                            |
| ------------- | --------------------------------------------------------------------- |
| Frontend      | React 18 + Vite, React Router, Tailwind CSS v4                        |
| Backend       | Node.js (LTS) + Express 4 (JavaScript, ES Modules)                    |
| Base de datos | MongoDB Atlas (M0 gratis) con Mongoose                                |
| Imágenes      | Cloudinary (plan gratuito)                                            |
| Validación    | Zod (backend y formularios)                                           |
| Pruebas       | Vitest + Supertest                                                    |
| Despliegue    | Vercel (frontend) · Render (backend) · Atlas · Cloudinary, sin costo  |

## Estructura del repositorio

```
├── client/          # React + Vite (tienda + panel admin)
│   ├── public/brand # logos optimizados, favicon e imagen para redes (generados)
│   ├── scripts/     # generación de recursos de marca y verificación de contraste
│   └── src/
│       ├── config/store.js   # textos y datos editables de la tienda
│       ├── components/       # componentes reutilizables
│       ├── hooks/ lib/       # lógica compartida (cliente de la API, etc.)
│       └── pages/            # páginas
├── server/          # Express + Mongoose (API REST)
│   ├── src/
│   │   ├── config/       # variables de entorno, base de datos, logger
│   │   ├── controllers/  # reciben la petición y arman la respuesta
│   │   ├── middlewares/  # seguridad, autenticación, validación, errores
│   │   ├── models/       # esquemas de Mongoose
│   │   ├── routes/       # rutas de la API (admin/ protegidas)
│   │   ├── services/     # lógica de negocio
│   │   ├── validators/   # esquemas de Zod
│   │   └── utils/
│   ├── scripts/          # seeds (administrador, datos de ejemplo)
│   └── tests/            # pruebas con MongoDB en memoria
├── assets-marca/    # logos originales de la marca
└── README.md
```

## Correr el proyecto en local

### Requisitos

- Node.js 20.19 o superior (recomendado: la versión LTS actual).
- Una base de datos en MongoDB Atlas (gratis). Ver [Configurar MongoDB Atlas](#configurar-mongodb-atlas).

### Pasos

```bash
# 1. Instalar dependencias (raíz, server y client)
npm run install:all

# 2. Crear los archivos de entorno a partir de los ejemplos
cp server/.env.example server/.env
cp client/.env.example client/.env
#    → En server/.env pega tu MONGODB_URI y genera los secretos JWT (ver comentarios del archivo)

# 3. Levantar API y tienda a la vez
npm run dev
```

- Tienda: <http://localhost:5173>
- API: <http://localhost:4000/api/health>

En desarrollo, Vite reenvía `/api` al backend (`localhost:4000`), así el navegador ve un solo dominio, igual que en producción.

### Scripts útiles

| Dónde     | Script                   | Qué hace                                                        |
| --------- | ------------------------ | --------------------------------------------------------------- |
| raíz      | `npm run dev`            | Levanta API y tienda juntas                                     |
| raíz      | `npm test`               | Pruebas del backend                                             |
| raíz      | `npm run lint`           | Revisa el código de server y client                             |
| `server/` | `npm run seed:admin`     | Crea la primera cuenta de administración (ver abajo)            |
| `server/` | `npm run seed:catalog`   | Carga el catálogo de ejemplo (⚠️ borra categorías y productos)  |
| `server/` | `npm run seed:banners`   | Crea el banner oficial de la marca en el carrusel (si no hay)   |
| `client/` | `npm run brand:assets`   | Regenera logos optimizados, favicon e imagen Open Graph         |
| `client/` | `npm run check:contrast` | Verifica contraste WCAG AA de la paleta                         |

## Datos de ejemplo

> ⚠️ **Todos los productos, precios, existencias e imágenes del seed son DE EJEMPLO.** Sirven para ver la tienda funcionando; la marca debe reemplazarlos por su catálogo real desde el panel administrativo.

```bash
cd server
npm run seed:catalog
```

- Crea 8 categorías y 15 productos coherentes con la marca: precios de $5 a $25.50, tallas S a XL o talla única, de 2 a 4 colores por prenda.
- Incluye un producto agotado, uno con poco stock, combinaciones color + talla que no se ofrecen y ofertas con precio anterior.
- Las imágenes son siluetas lavanda (sin fotos de modelos generadas con IA), una por color, para que se vea cómo cambia la foto al elegir un color. Se guardan en `client/public/placeholders/`.
- Solo borra categorías y productos (no toca cuentas ni pedidos). En producción pide confirmar con `npm run seed:catalog -- --yes`.

## Cuentas y administración

- Las clientas crean su cuenta en `/registro`. El registro **siempre** crea cuentas con rol `customer`, aunque alguien intente enviar `role: "admin"`.
- La **única** forma de crear una cuenta de administración es el script de seed:

```bash
# 1. Define ADMIN_EMAIL y ADMIN_PASSWORD en server/.env
# 2. Ejecuta (desde server/):
npm run seed:admin
# Para restablecer la contraseña de una cuenta admin existente:
npm run seed:admin -- --reset
```

Credenciales de **demostración** (solo de ejemplo, cámbialas antes de publicar el sitio):

| Correo                    | Contraseña      |
| ------------------------- | --------------- |
| `admin@abrakadabra.local` | `CambiaEsta123` |

Al iniciar sesión, el equipo de la tienda entra al panel en `/admin`.

- Cualquier visitante puede ver el catálogo y armar su carrito **sin cuenta**; para **pagar** debe iniciar sesión o registrarse, y vuelve al checkout con su carrito intacto.
- **Recuérdame**: si se marca al iniciar sesión, la sesión dura 7 días en ese dispositivo; si no, se cierra al cerrar el navegador.

## Panel administrativo

Entra con una cuenta admin y ve a **`/admin`** (o al botón dorado "Panel admin" del header).

| Sección     | Qué se puede hacer                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| Productos   | Buscar y filtrar (categoría, visibles/ocultos, poco stock, agotados), mostrar u ocultar, editar y eliminar |
| Inicio      | Banners del carrusel de la página de inicio: agregar (computadora y celular), ordenar, ocultar o quitar  |
| Categorías  | Crear, renombrar, ordenar (flechas o arrastrando), mostrar u ocultar e imagen del mosaico de inicio      |

**Crear o editar un producto**

1. **Información**: nombre, descripción, categoría, precio y, si está en oferta, el precio anterior (se muestra tachado).
2. **Colores y tallas**: toca un color de la paleta rápida (o crea uno personalizado) y elige las tallas. Solo se agregan los colores en que existe esa prenda.
3. **Existencias**: una tabla color × talla. La casilla indica si esa combinación **se vende**; el número, cuántas unidades hay. Las casillas de cada fila y columna activan o quitan todo un color o toda una talla (p. ej. "el rojo solo viene en S y M").
4. **Fotos** (hasta 8): arrástralas o elígelas, ordénalas (la primera es la principal) y **asigna cada foto a su color**: en la tienda, al elegir ese color se muestran sus fotos.
5. **Guardar producto**. Si intentas salir con cambios sin guardar, el panel te avisa.

## Configurar Cloudinary (fotos)

Las fotos se guardan en Cloudinary, en su **plan gratuito** (no pide tarjeta).

1. Crea una cuenta en <https://cloudinary.com/users/register_free>.
2. En el **Dashboard** (o *Settings › API Keys*) copia **Cloud name**, **API Key** y **API Secret**.
3. Pégalos en `server/.env`:
   ```
   CLOUDINARY_CLOUD_NAME=tu-cloud-name
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=el-secreto
   ```
4. Guarda el archivo: `npm run dev` se reinicia solo al detectar el cambio en `.env`. El aviso amarillo del panel desaparece y ya puedes subir fotos.

**Si la subida falla con "le faltan permisos" (error 403):** la API Key fue creada con permisos limitados. En Cloudinary, ve a *Settings › API Keys* y usa la clave principal de la cuenta (la que se creó con ella), o edita la clave para que tenga permiso de subir archivos. Si cambias de clave, actualiza `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`.

> Nunca compartas el **API Secret** en capturas o mensajes. Si se llegó a ver, genera una clave nueva en Cloudinary y desactiva la anterior.

Las fotos se suben desde el backend (el navegador nunca ve las credenciales), se guardan como máximo a 2000 px y la tienda las pide optimizadas (`f_auto,q_auto` y el ancho justo para cada pantalla). Solo se aceptan JPG, PNG o WEBP de hasta 5 MB, y se revisa el tipo real del archivo, no solo la extensión.

## Variables de entorno

Los valores sensibles van en archivos `.env`, que **nunca** se suben al repositorio. Cada carpeta tiene un `.env.example` documentado:

- [`server/.env.example`](server/.env.example): conexión a Atlas, secretos JWT, CORS, Cloudinary, proveedor de pagos y administrador inicial.
- [`client/.env.example`](client/.env.example): ruta de la API, número de WhatsApp y enlace de Google Maps.

## Configurar MongoDB Atlas

1. Crea una cuenta en <https://www.mongodb.com/cloud/atlas> y un clúster **M0 (gratis)**.
2. En **Database Access**, crea un usuario con contraseña (rol _Read and write to any database_).
3. En **Network Access**, agrega tu IP actual para desarrollo local.
   Para Render se agrega `0.0.0.0/0` (los servidores gratuitos de Render no tienen IP fija; la seguridad depende del usuario y la contraseña). Se detalla en la guía de despliegue (Fase 8).
4. En **Database > Connect > Drivers**, copia la cadena de conexión, reemplaza usuario y contraseña, y agrega el nombre de la base antes del `?`:
   `mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/abrakadabra?retryWrites=true&w=majority`
5. Pégala en `MONGODB_URI` de `server/.env`.

## Identidad visual

| Token        | Color     | Uso                                                         |
| ------------ | --------- | ----------------------------------------------------------- |
| `brand`      | `#59378D` | Principal: header, botones, enlaces, precios, footer        |
| `brand-dark` | `#3F2566` | Hover de botones, texto sobre fondos claros                 |
| `brand-soft` | `#795393` | Elementos secundarios, bordes activos                       |
| `lavender`   | `#F3EEF8` | Fondos alternos, tarjetas, chips                            |
| `gold`       | `#EDC246` | Solo acento (insignia "Nuevo", estrella). Nunca texto dorado sobre blanco |
| `ink`        | `#2A1A40` | Texto principal                                             |

- Tipografías: **Josefin Sans** (títulos) y **Montserrat** (texto).
- Logos originales en `assets-marca/`; las versiones web se generan con `npm run brand:assets`.

### Cambiar la identidad visual (nuevo manual de marca)

Todo está en **un solo archivo: [`client/src/theme/brand.css`](client/src/theme/brand.css)**. Ahí están los colores, las tipografías (incluida la URL de Google Fonts), el espaciado de letras, los redondeos y las sombras, con instrucciones comentadas.

1. Cambia los **valores** (no los nombres) de los tokens en `brand.css`.
2. Corre `npm run check:contrast` dentro de `client/` para confirmar que los textos siguen siendo legibles (WCAG AA).
3. Si cambió el logo, reemplaza los archivos en `assets-marca/` (mismos nombres) y corre `npm run brand:assets`.

Los componentes nunca usan colores sueltos, solo los nombres de los tokens (`bg-brand`, `text-ink`…). El color de la barra del navegador móvil, el favicon y el script de contraste también leen `brand.css`.

En desarrollo, la página **<http://localhost:5173/guia-de-marca>** muestra en vivo la paleta, las tipografías, los botones y las insignias, para revisar cómo queda un cambio de manual de marca. Esta página no se incluye en la versión publicada.

## Seguridad (resumen)

**Autenticación**

- Contraseñas con bcrypt (costo 12). Mensaje genérico en el login ("Correo o contraseña incorrectos").
- Token de acceso JWT de 15 minutos, guardado **solo en memoria** en el navegador (nunca en localStorage).
- Sesión de 7 días con un refresh token en cookie `httpOnly`, `SameSite=Lax` y `Secure` en producción. El token rota en cada uso; si se reutiliza uno viejo (posible robo), se cierran todas las sesiones de esa familia.
- En la base de datos solo se guarda el HMAC del refresh token, nunca el token.
- Cada petición protegida vuelve a leer la cuenta: si se le quita el rol de admin a alguien, pierde el acceso al instante.
- Todo `/api/admin/*` exige sesión y rol `admin` en el backend. La protección de rutas en React es solo para la experiencia de usuario.

**API**

- `helmet`, CORS con lista blanca (`CLIENT_URL`), límite de 100 KB en el body y rate limit.
- Rechazo de claves con `$` o `.` (inyección NoSQL) y `sanitizeFilter` de Mongoose.
- Manejador central de errores que no expone stack traces en producción.
- Logger con ocultamiento automático de contraseñas, tokens y datos de tarjeta.

## Despliegue gratuito

El proyecto está pensado para publicarse **sin ningún costo** mientras la marca lo evalúa. Todos los servicios se usan en su plan gratuito:

| Servicio      | Uso                  | Plan gratuito                         |
| ------------- | -------------------- | ------------------------------------- |
| Vercel        | Tienda (frontend)    | Hobby                                 |
| Render        | API (backend)        | Free web service                      |
| MongoDB Atlas | Base de datos        | M0 (512 MB)                           |
| Cloudinary    | Imágenes de producto | Free                                  |

> Render gratis "duerme" el servidor tras ~15 minutos sin uso; la primera visita puede tardar de 30 a 50 segundos. La tienda muestra "Cargando la tienda…" mientras tanto.

> Si la marca adopta la tienda para vender, conviene revisar los términos: el plan Hobby de Vercel es para uso no comercial, y un servidor que no se duerma mejora la experiencia. Ambos tienen planes de pago de bajo costo.

La guía paso a paso (Vercel, Render, Atlas y Cloudinary) se completa en la Fase 8.

## Mejoras futuras

- Recuperación de contraseña por correo (usar la API HTTP de Brevo: Render gratis bloquea SMTP).
- Integración real con Wompi El Salvador (<https://docs.wompi.sv>).
