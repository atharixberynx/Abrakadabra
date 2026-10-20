/**
 * Valores POR DEFECTO de los ajustes de la tienda.
 * Se usan mientras la administradora no guarde cambios en Panel › Ajustes
 * (a partir de ahí manda lo guardado en la base de datos).
 */
export const DEFAULT_SETTINGS = {
  announcements: [
    'Envíos a todo El Salvador o retiro gratis en tienda',
    'Tallas S a XL y talla única',
    'Precios desde $5',
    'Venta al detalle y por mayoreo',
  ],
  whatsappNumber: '50300000000',
  address: {
    line1: 'Alameda Manuel Enrique Araujo 201',
    line2: 'Centro Comercial Feria Rosa, local 201-G',
    city: 'San Salvador, El Salvador',
  },
  hours: [
    { days: 'Lunes a viernes', time: '8:00 a. m. a 4:30 p. m.' },
    { days: 'Sábados', time: '8:00 a. m. a 12:00 m.' },
  ],
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Centro+Comercial+Feria+Rosa+San+Salvador',
  instagramUrl: 'https://www.instagram.com/abrakadabraes',
  facebookUrl: 'https://www.facebook.com/abrakadabraes',
  shippingEnabled: true,
  shippingFee: 3.5,
  shippingTime: 'De 2 a 4 días hábiles',
};
