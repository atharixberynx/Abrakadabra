/**
 * Configuración central de la tienda.
 *
 * - Textos fijos de la marca (nombre, eslogan, beneficios, logos…): se cambian aquí.
 * - Anuncios, WhatsApp, dirección, horario, mapa, redes y envíos: se editan en Panel › Ajustes.
 *   Los valores de este archivo solo se usan mientras no haya ajustes guardados.
 *   En los componentes, léelos con useStoreInfo() (context/StoreInfoContext.jsx).
 * - Textos largos de las páginas informativas: content/paginas-informativas.json.
 */

const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '50300000000';

const address = {
  line1: 'Alameda Manuel Enrique Araujo 201',
  line2: 'Centro Comercial Feria Rosa, local 201-G',
  city: 'San Salvador, El Salvador',
};

export const store = {
  name: 'Abrakadabra Fashion Shop',
  shortName: 'Abrakadabra',
  slogan: 'Be fashionable, be Abrakadabra',
  tagline: 'Moda casual chic y de oficina, de la S a la XL',
  description:
    'Moda femenina en tendencia, estilo casual chic y de oficina, a precio accesible y con varios colores por modelo. Producto importado.',
  onlineSince: 'noviembre de 2020',

  /** Mensajes de la barra de anuncio superior (rotan automáticamente) */
  announcements: [
    'Envíos a todo El Salvador o retiro gratis en tienda',
    'Tallas S a XL y talla única',
    'Precios desde $5',
    'Venta al detalle y por mayoreo',
  ],

  /** Diferenciadores que se destacan en la página de inicio */
  benefits: [
    { icon: 'sizes', title: 'Tallas S a XL', text: 'También talla única. Encuentra tu talla.' },
    { icon: 'colors', title: 'Varios colores por modelo', text: 'Elige el tono que más te guste.' },
    { icon: 'price', title: 'Precios desde $5', text: 'Moda en tendencia a precio accesible.' },
    { icon: 'store', title: 'Envío o retiro en tienda', text: 'Recíbelo en todo el país o retíralo gratis en la sucursal.' },
  ],

  /** Envío a domicilio (valores por defecto; se editan en Panel › Ajustes) */
  shipping: { enabled: true, fee: 3.5, time: 'De 2 a 4 días hábiles' },

  priceRange: { min: 5, max: 25.5 },
  sizes: ['S', 'M', 'L', 'XL', 'Única'],

  address,
  fullAddress: `${address.line1}, ${address.line2}, ${address.city}`,
  hours: [
    { days: 'Lunes a viernes', time: '8:00 a. m. a 4:30 p. m.' },
    { days: 'Sábados', time: '8:00 a. m. a 12:00 m.' },
  ],
  hoursText: 'Lunes a viernes de 8:00 a. m. a 4:30 p. m.; sábados de 8:00 a. m. a 12:00 m.',

  maps: {
    directionsUrl:
      import.meta.env.VITE_STORE_MAPS_URL ||
      'https://www.google.com/maps/search/?api=1&query=Centro+Comercial+Feria+Rosa+San+Salvador',
    // Mapa embebido sin API key
    embedUrl:
      'https://www.google.com/maps?q=Centro+Comercial+Feria+Rosa,+San+Salvador,+El+Salvador&output=embed',
  },

  whatsapp: {
    number: whatsappNumber,
    wholesaleMessage:
      'Hola, me interesa comprar por mayoreo en Abrakadabra Fashion Shop. ¿Me pueden dar información?',
  },

  social: [
    { name: 'Instagram', handle: '@abrakadabraes', url: 'https://www.instagram.com/abrakadabraes' },
    { name: 'Facebook', handle: '@abrakadabraes', url: 'https://www.facebook.com/abrakadabraes' },
  ],

  logos: {
    onWhite: '/brand/logo-fondo-blanco.webp',
    onPurple: '/brand/logo-fondo-morado.webp',
  },

  /** Banner principal de inicio: imagen distinta para celular y escritorio */
  hero: {
    title: 'Be fashionable, be Abrakadabra',
    subtitle: 'Moda casual chic y de oficina, de la S a la XL',
    cta: 'Ver catálogo',
    imageMobile: '/banners/hero-mobile.svg',
    imageDesktop: '/banners/hero-desktop.svg',
  },

  /** Sección de productos destacada en inicio (la línea estrella de la marca) */
  featuredCategory: { slug: 'palazzos', title: 'Palazzos', subtitle: 'Nuestra línea estrella' },
};
