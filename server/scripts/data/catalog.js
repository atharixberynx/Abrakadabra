/**
 * DATOS DE EJEMPLO para mostrar la tienda funcionando.
 * Nombres, precios, colores y existencias son inventados (coherentes con la marca).
 * La marca debe reemplazarlos por su catálogo real desde el panel administrativo.
 */

export const categories = [
  { name: 'Palazzos', slug: 'palazzos' },
  { name: 'Conjuntos', slug: 'conjuntos' },
  { name: 'Blusas', slug: 'blusas' },
  { name: 'Vestidos', slug: 'vestidos' },
  { name: 'Tops', slug: 'tops' },
  { name: 'Suéteres', slug: 'sueteres' },
  { name: 'Shorts', slug: 'shorts' },
  { name: 'Accesorios', slug: 'accesorios' },
];

const ALL = ['S', 'M', 'L', 'XL'];

// Colores reutilizados
const C = {
  negro: ['Negro', '#1F1B24'],
  beige: ['Beige', '#D8C3A5'],
  vino: ['Vino', '#6D1A36'],
  rosaPalo: ['Rosa palo', '#E8B4B8'],
  olivo: ['Verde olivo', '#6B705C'],
  hueso: ['Blanco hueso', '#F2EDE4'],
  camel: ['Camel', '#C19A6B'],
  marino: ['Azul marino', '#1F2A44'],
  lila: ['Lila', '#B39CD0'],
  salvia: ['Verde salvia', '#9CAF88'],
  champan: ['Champán', '#E9D8B4'],
  blanco: ['Blanco', '#FFFFFF'],
  celeste: ['Celeste', '#A7C7E7'],
  esmeralda: ['Verde esmeralda', '#1F6F5C'],
  gris: ['Gris', '#8A8A8A'],
  floralAzul: ['Floral azul', '#5B7DB1'],
  floralRosa: ['Floral rosa', '#D98BA5'],
  dorado: ['Dorado', '#C9A227'],
  plateado: ['Plateado', '#B8B8B8'],
};

/**
 * stock: 'normal' (variado) | 'low' (máximo 2 por combinación) | 'soldout' (todo en 0)
 * exclude: combinaciones que NO se ofrecen, como "color-key:talla"
 */
export const products = [
  {
    name: 'Palazo de vestir',
    category: 'palazzos',
    price: 14.5,
    description:
      'Palazo de tiro alto y caída fluida, ideal para la oficina. Tela ligera que no se arruga y cintura con elástico posterior para mayor comodidad.',
    colors: [C.negro, C.beige, C.vino],
    sizes: ALL,
    isNewArrival: true,
    isFeatured: true,
  },
  {
    name: 'Palazo plisado',
    category: 'palazzos',
    price: 16,
    description: 'Palazo con pliegues finos que dan movimiento al caminar. Combínalo con blusas básicas o tops.',
    colors: [C.rosaPalo, C.olivo, C.negro],
    sizes: ALL,
    isFeatured: true,
  },
  {
    name: 'Palazo de lino',
    category: 'palazzos',
    price: 18.5,
    compareAtPrice: 22,
    description: 'Palazo fresco de mezcla de lino, perfecto para el calor. Bolsillos laterales.',
    colors: [C.hueso, C.camel, C.marino],
    sizes: ALL,
    exclude: ['azul-marino:S', 'azul-marino:XL'],
  },
  {
    name: 'Palazo estampado floral',
    category: 'palazzos',
    price: 15,
    description: 'Estampado floral delicado para looks casuales de fin de semana.',
    colors: [C.floralAzul, C.floralRosa],
    sizes: ALL,
    stock: 'low',
    isNewArrival: true,
  },
  {
    name: 'Palazo de cintura alta',
    category: 'palazzos',
    price: 13.5,
    description: 'Básico de cintura alta con pretina ancha que estiliza la figura.',
    colors: [C.negro, C.gris, C.camel],
    sizes: ALL,
  },
  {
    name: 'Conjunto blazer y palazo',
    category: 'conjuntos',
    price: 25.5,
    description: 'Blazer ligero sin forro y palazo a juego. Listo para la oficina o un evento especial.',
    colors: [C.negro, C.beige, C.lila],
    sizes: ALL,
    isNewArrival: true,
    isFeatured: true,
  },
  {
    name: 'Conjunto casual de lino',
    category: 'conjuntos',
    price: 22,
    compareAtPrice: 26,
    description: 'Camisa holgada y pantalón recto de lino. Cómodo, fresco y elegante.',
    colors: [C.hueso, C.salvia],
    sizes: ['S', 'M', 'L'],
  },
  {
    name: 'Blusa satinada de botones',
    category: 'blusas',
    price: 12,
    description: 'Blusa de satín con botones forrados y cuello camisero. Brillo sutil.',
    colors: [C.champan, C.negro, C.vino],
    sizes: ALL,
    isNewArrival: true,
  },
  {
    name: 'Blusa básica de oficina',
    category: 'blusas',
    price: 9,
    compareAtPrice: 11.5,
    description: 'La blusa que combina con todo. Manga corta y tela antifluido.',
    colors: [C.blanco, C.negro, C.marino, C.rosaPalo],
    sizes: ALL,
  },
  {
    name: 'Vestido midi cruzado',
    category: 'vestidos',
    price: 21,
    description: 'Vestido midi de escote cruzado con lazo en la cintura. Favorece a todas las siluetas.',
    colors: [C.esmeralda, C.negro, C.vino],
    sizes: ALL,
    isNewArrival: true,
    isFeatured: true,
  },
  {
    name: 'Vestido camisero',
    category: 'vestidos',
    price: 18,
    description: 'Vestido camisero con cinturón. Ejemplo de producto agotado.',
    colors: [C.beige, C.celeste],
    sizes: ALL,
    stock: 'soldout',
  },
  {
    name: 'Top tejido sin mangas',
    category: 'tops',
    price: 7.5,
    description: 'Top de punto acanalado, talla única elástica. Ideal debajo de blazers.',
    colors: [C.blanco, C.negro, C.camel],
    sizes: ['Única'],
  },
  {
    name: 'Suéter ligero de punto',
    category: 'sueteres',
    price: 14,
    description: 'Suéter de punto fino para el aire acondicionado de la oficina.',
    colors: [C.gris, C.lila],
    sizes: ALL,
    isNewArrival: true,
  },
  {
    name: 'Short de vestir',
    category: 'shorts',
    price: 11,
    description: 'Short de tiro alto con pinzas y bolsillos. Elegante y fresco.',
    colors: [C.negro, C.beige],
    sizes: ['S', 'M', 'L'],
  },
  {
    name: 'Aretes de aro',
    category: 'accesorios',
    price: 5,
    description: 'Aretes de aro medianos, livianos y con cierre seguro.',
    colors: [C.dorado, C.plateado],
    sizes: ['Única'],
  },
];
