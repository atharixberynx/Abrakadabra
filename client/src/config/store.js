/**
 * Configuración central de la tienda.
 *
 * Todos los textos y datos que la marca puede querer cambiar están aquí,
 * para no tener que tocar componentes. En la Fase 7, varios de estos valores
 * (anuncio, banners, WhatsApp, horario, dirección) se podrán editar desde
 * el panel admin; estos quedan como valores por defecto.
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
    'Compra en línea y retira en tienda',
    'Tallas S a XL y talla única',
    'Precios desde $5',
    'Venta al detalle y por mayoreo',
  ],

  /** Diferenciadores que se destacan en la página de inicio */
  benefits: [
    { icon: 'sizes', title: 'Tallas S a XL', text: 'También talla única. Encuentra tu talla.' },
    { icon: 'colors', title: 'Varios colores por modelo', text: 'Elige el tono que más te guste.' },
    { icon: 'price', title: 'Precios desde $5', text: 'Moda en tendencia a precio accesible.' },
    { icon: 'store', title: 'Retira en tienda', text: 'Pruébate tus prendas en nuestra sucursal.' },
  ],

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

/** Arma un enlace de WhatsApp con un mensaje prellenado */
export function whatsappUrl(message = '') {
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${store.whatsapp.number}${text}`;
}
