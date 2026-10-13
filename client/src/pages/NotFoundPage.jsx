import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { StarIcon } from '../components/ui/StarIcon.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function NotFoundPage() {
  usePageTitle('Página no encontrada');
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <StarIcon className="size-8 text-gold" />
      <h1 className="text-3xl text-brand-dark">Página no encontrada</h1>
      <p className="max-w-sm text-ink/80">Parece que esta página desapareció como por arte de magia.</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button as={Link} to="/">Volver al inicio</Button>
        <Button as={Link} to="/catalogo" variant="secondary">Ver catálogo</Button>
      </div>
    </main>
  );
}
