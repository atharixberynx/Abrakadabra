/**
 * Panel › Categorías: crear, renombrar, mostrar u ocultar, ordenar (flechas o arrastrando)
 * e imagen del mosaico de la página de inicio.
 */
import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Switch } from '../../components/ui/Switch.jsx';
import { clearFetchCache, useFetch } from '../../hooks/useFetch.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { apiFetch } from '../../lib/api.js';
import { imageUrl } from '../../lib/images.js';
import { confirmDialog, toast } from '../../store/uiStore.js';
import { checkImageFile } from '../products/productForm.js';
import { CloudinaryWarning, ErrorState, LoadingState, PageHeader } from '../components/AdminUi.jsx';

const inputClass =
  'h-11 w-full rounded-xl border border-brand/20 bg-white px-3 text-sm text-ink focus:border-brand focus:outline-none';

function CategoryImage({ category, onChange, uploadsEnabled }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file) => {
    const problem = checkImageFile(file);
    if (problem) return toast.error(problem);
    const body = new FormData();
    body.append('image', file);
    setBusy(true);
    try {
      await apiFetch(`/admin/categories/${category.id}/image`, { method: 'PUT', body });
      toast.success(`Imagen de ${category.name} actualizada`);
      onChange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!(await confirmDialog({ title: '¿Quitar la imagen?', message: `La categoría ${category.name} se mostrará sin imagen en el inicio.`, confirmLabel: 'Quitar', danger: true }))) return;
    try {
      await apiFetch(`/admin/categories/${category.id}/image`, { method: 'DELETE' });
      onChange();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy || !uploadsEnabled}
        className="group relative block aspect-[4/5] w-16 overflow-hidden rounded-lg bg-lavender disabled:cursor-not-allowed"
        aria-label={`Cambiar imagen de ${category.name}`}
        title={uploadsEnabled ? 'Cambiar imagen' : 'Configura Cloudinary para subir imágenes'}
      >
        {category.image?.url ? (
          <img src={imageUrl(category.image.url, 160)} alt="" className="size-full object-cover" />
        ) : (
          <ImagePlus className="m-auto size-5 text-brand" aria-hidden="true" />
        )}
        {uploadsEnabled && (
          <span className="absolute inset-0 grid place-items-center bg-brand/60 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
            {busy ? 'Subiendo…' : 'Cambiar'}
          </span>
        )}
      </button>
      {category.image?.publicId && (
        <button type="button" onClick={remove} className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-white text-danger shadow" aria-label={`Quitar imagen de ${category.name}`}>
          <X className="size-3" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) upload(e.target.files[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function CategoryName({ category, onSaved }) {
  const [name, setName] = useState(category.name);
  const save = async () => {
    const trimmed = name.trim();
    if (trimmed === category.name) return;
    if (trimmed.length < 2) {
      setName(category.name);
      return toast.error('El nombre debe tener al menos 2 letras');
    }
    try {
      await apiFetch(`/admin/categories/${category.id}`, { method: 'PATCH', body: { name: trimmed } });
      toast.success('Nombre actualizado');
      onSaved();
    } catch (err) {
      setName(category.name);
      toast.error(err.message);
    }
  };
  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      maxLength={40}
      aria-label={`Nombre de la categoría ${category.name}`}
      className="h-10 w-full min-w-0 rounded-lg border border-transparent px-2 font-medium text-ink hover:border-brand/20 focus:border-brand focus:outline-none"
    />
  );
}

export default function CategoriesPage() {
  usePageTitle('Categorías · Panel');
  const { data, loading, error, reload } = useFetch('/admin/categories', { cache: false });
  const info = useFetch('/admin', { cache: false });
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [order, setOrder] = useState(null); // orden local mientras se guarda

  const refresh = () => {
    clearFetchCache();
    reload({ silent: true });
  };

  const categories = order ?? data?.categories ?? [];
  const uploadsEnabled = info.data?.imageUploadsEnabled ?? true;

  const create = async (event) => {
    event.preventDefault();
    if (newName.trim().length < 2) return toast.error('Escribe el nombre de la categoría');
    setCreating(true);
    try {
      await apiFetch('/admin/categories', { method: 'POST', body: { name: newName.trim() } });
      toast.success(`Categoría "${newName.trim()}" creada`);
      setNewName('');
      refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const move = async (from, to) => {
    if (to < 0 || to >= categories.length || from === to) return;
    const next = [...categories];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
    try {
      await apiFetch('/admin/categories/reorder', { method: 'PUT', body: { ids: next.map((c) => c.id) } });
      refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setOrder(null);
    }
  };

  const toggleActive = async (category) => {
    try {
      await apiFetch(`/admin/categories/${category.id}`, { method: 'PATCH', body: { active: !category.active } });
      toast.success(category.active ? `${category.name} ya no se muestra en la tienda` : `${category.name} ahora se muestra en la tienda`);
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (category) => {
    if (!(await confirmDialog({ title: `¿Eliminar "${category.name}"?`, message: 'Esta acción no se puede deshacer.', confirmLabel: 'Eliminar', danger: true }))) return;
    try {
      await apiFetch(`/admin/categories/${category.id}`, { method: 'DELETE' });
      toast.success('Categoría eliminada');
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Categorías" description="El orden de esta lista es el orden del menú y del mosaico de la página de inicio." />
      <CloudinaryWarning />

      <form onSubmit={create} className="mb-6 flex flex-col gap-3 rounded-card bg-white p-4 shadow-soft sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Nombre de la nueva categoría</span>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={40} placeholder="Nueva categoría, p. ej. Faldas" className={inputClass} />
        </label>
        <Button type="submit" disabled={creating}>
          <Plus className="size-4" /> {creating ? 'Creando…' : 'Agregar categoría'}
        </Button>
      </form>

      {loading && !data ? (
        <LoadingState message="Cargando categorías…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <ul className="space-y-2">
          {categories.map((category, index) => (
            <li
              key={category.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) move(dragIndex, index);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`flex flex-wrap items-center gap-3 rounded-card bg-white p-3 shadow-soft transition sm:flex-nowrap ${dragIndex === index ? 'opacity-40' : ''} ${category.active ? '' : 'bg-white/70'}`}
            >
              <GripVertical className="hidden size-5 shrink-0 cursor-grab text-ink/50 sm:block" aria-hidden="true" />
              <div className="flex flex-col">
                <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} className="grid size-7 place-items-center rounded text-brand hover:bg-lavender disabled:opacity-30" aria-label={`Subir ${category.name}`}>
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" onClick={() => move(index, index + 1)} disabled={index === categories.length - 1} className="grid size-7 place-items-center rounded text-brand hover:bg-lavender disabled:opacity-30" aria-label={`Bajar ${category.name}`}>
                  <ArrowDown className="size-4" />
                </button>
              </div>
              <CategoryImage category={category} onChange={refresh} uploadsEnabled={uploadsEnabled} />
              <div className="min-w-0 flex-1">
                <CategoryName key={category.name} category={category} onSaved={refresh} />
                <p className="px-2 text-xs text-ink/70">
                  {category.productCount} {category.productCount === 1 ? 'producto' : 'productos'} · /catalogo?categoria={category.slug}
                </p>
              </div>
              <Switch checked={category.active} onChange={() => toggleActive(category)} label="Visible" showLabel size="sm" />
              <button
                type="button"
                onClick={() => remove(category)}
                disabled={category.productCount > 0}
                className="grid size-9 place-items-center rounded-full text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:text-ink/40 disabled:hover:bg-transparent"
                aria-label={`Eliminar ${category.name}`}
                title={category.productCount > 0 ? 'No se puede eliminar: tiene productos. Puedes ocultarla.' : 'Eliminar'}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
