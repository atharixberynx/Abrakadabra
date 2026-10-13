/**
 * Página de inicio. Secciones en el orden acordado con la marca:
 * carrusel de banners · categorías · lo nuevo · beneficios · palazzos · visítanos · mayoreo.
 * (La barra de anuncio y el footer los pone StoreLayout.)
 */
import { store } from '../config/store.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { Benefits, CategoryMosaic, VisitUs, Wholesale } from '../components/home/HomeSections.jsx';
import { HeroCarousel } from '../components/home/HeroCarousel.jsx';
import { ProductSection } from '../components/product/ProductSection.jsx';

export default function HomePage() {
  usePageTitle(null);
  const featured = store.featuredCategory;

  return (
    <main className="space-y-16 pb-16 sm:space-y-20">
      <HeroCarousel />
      <CategoryMosaic />
      <ProductSection
        title="Lo nuevo"
        subtitle="Recién llegadas a la tienda"
        query="nuevos=1&limit=8"
        to="/catalogo?nuevos=1"
      />
      <Benefits />
      <ProductSection
        title={featured.title}
        subtitle={featured.subtitle}
        query={`categoria=${featured.slug}&limit=8`}
        to={`/catalogo?categoria=${featured.slug}`}
      />
      <VisitUs />
      <Wholesale />
    </main>
  );
}
