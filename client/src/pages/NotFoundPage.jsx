import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { StarIcon } from '../components/ui/StarIcon.jsx';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <StarIcon className="size-8 text-gold" />
      <h1 className="text-3xl text-brand">Página no encontrada</h1>
      <p className="max-w-sm text-ink/80">
        Parece que esta página desapareció como por arte de magia.
      </p>
      <Button as={Link} to="/" className="mt-2">
        Volver al inicio
      </Button>
    </main>
  );
}
