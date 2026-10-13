/** Buscador de productos: lleva al catálogo con ?q=texto */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';

export function SearchForm({ className = '', autoFocus = false, onSubmitted }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');

  const handleSubmit = (event) => {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo');
    onSubmitted?.();
  };

  return (
    <form role="search" onSubmit={handleSubmit} className={`relative ${className}`}>
      <label htmlFor="site-search" className="sr-only">
        Buscar prendas
      </label>
      <input
        id="site-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar palazzos, blusas, vestidos…"
        autoFocus={autoFocus}
        maxLength={60}
        className="h-11 w-full rounded-full border border-brand/20 bg-white pr-12 pl-5 text-sm text-ink placeholder:text-ink/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
      <button
        type="submit"
        className="absolute inset-y-1 right-1 grid w-9 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark"
        aria-label="Buscar"
      >
        <Search className="size-4" />
      </button>
    </form>
  );
}
