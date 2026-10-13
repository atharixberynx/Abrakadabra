# Abrakadabra Fashion Shop · Tienda en línea

> _Be fashionable, be Abrakadabra_

Tienda en línea de **Abrakadabra Fashion Shop**, tienda salvadoreña de moda femenina (estilo casual chic y de oficina, tallas S a XL). Incluye la tienda pública para clientas y un panel administrativo protegido en `/admin`.

Proyecto académico de Desarrollo de Software, pensado para que la marca pueda adoptarlo y mantenerlo.

> 🚧 **Estado:** Fase 1 de 8 (base del proyecto). Este README se completa en cada fase.

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
│   │   ├── middlewares/  # seguridad, validación, errores
│   │   ├── routes/       # rutas de la API
│   │   └── utils/
│   └── tests/
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
| `client/` | `npm run brand:assets`   | Regenera logos optimizados, favicon e imagen Open Graph         |
| `client/` | `npm run check:contrast` | Verifica contraste WCAG AA de la paleta                         |

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

## Seguridad (resumen)

- `helmet`, CORS con lista blanca (`CLIENT_URL`), límite de 100 KB en el body y rate limit.
- Rechazo de claves con `$` o `.` (inyección NoSQL) y `sanitizeFilter` de Mongoose.
- Manejador central de errores que no expone stack traces en producción.
- Logger con ocultamiento automático de contraseñas, tokens y datos de tarjeta.

## Despliegue gratuito

> Render gratis "duerme" el servidor tras ~15 minutos sin uso; la primera visita puede tardar de 30 a 50 segundos. La tienda muestra "Cargando la tienda…" mientras tanto.

La guía paso a paso (Vercel, Render, Atlas y Cloudinary) se completa en la Fase 8.

## Mejoras futuras

- Recuperación de contraseña por correo (usar la API HTTP de Brevo: Render gratis bloquea SMTP).
- Integración real con Wompi El Salvador (<https://docs.wompi.sv>).
