/**
 * Panel › Crear / editar producto.
 *
 * Al tocar "Guardar producto" se hace, en orden:
 *  1. Crear o actualizar los datos (nombre, precio, colores, tallas, existencias…).
 *  2. Eliminar las fotos quitadas.
 *  3. Subir las fotos nuevas (cada una con su color).
 *  4. Guardar el orden final y el color de todas las fotos.
 * Si se intenta salir con cambios sin guardar, se pide confirmación.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Switch } from '../../components/ui/Switch.jsx';
import { TextField } from '../../components/ui/TextField.jsx';
import { clearFetchCache, useFetch } from '../../hooks/useFetch.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { apiFetch } from '../../lib/api.js';
import { slugify } from '../../lib/text.js';
import { confirmDialog, toast } from '../../store/uiStore.js';
import { Card, CloudinaryWarning, ErrorState, LoadingState } from '../components/AdminUi.jsx';
import { ColorEditor, SizeSelector } from '../products/ColorsAndSizes.jsx';
import { ImageManager } from '../products/ImageManager.jsx';
import { StockMatrix } from '../products/StockMatrix.jsx';
import {
  ONE_SIZE,
  cellKey,
  emptyForm,
  makeColorKey,
  toFormState,
  toImageState,
  toPayload,
  validateForm,
} from '../products/productForm.js';

// Sección del formulario donde se muestra cada error (para desplazarse a la primera con error)
const ERROR_SECTION = {
  name: 'seccion-info',
  category: 'seccion-info',
  price: 'seccion-info',
  compareAtPrice: 'seccion-info',
  colors: 'seccion-colores',
  stock: 'seccion-existencias',
};

const textareaClass =
  'w-full rounded-xl border border-brand/20 bg-white px-4 py-3 text-base text-ink placeholder:text-ink/50 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30';

function ProductEditor({ product, categories, uploadsEnabled }) {
  const navigate = useNavigate();
  const isNew = !product;
  const [form, setForm] = useState(() => (product ? toFormState(product) : emptyForm()));
  const [images, setImages] = useState(() => (product ? toImageState(product) : []));
  const [removedIds, setRemovedIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState(product?.slug ?? null);
  const dirtyRef = useRef(false);
  const [dirty, setDirtyState] = useState(false);

  const setDirty = (value) => {
    dirtyRef.current = value;
    setDirtyState(value);
  };

  /** Cambia campos del formulario y marca que hay cambios sin guardar */
  const update = (patch) => {
    setForm((f) => ({ ...f, ...(typeof patch === 'function' ? patch(f) : patch) }));
    setDirty(true);
  };

  // Libera las vistas previas locales de fotos al salir
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(
    () => () => imagesRef.current.forEach((img) => img.file && URL.revokeObjectURL(img.url)),
    [],
  );

  // ── Aviso de cambios sin guardar (dentro del panel y al cerrar la pestaña) ──
  const blocker = useBlocker(useCallback(({ currentLocation, nextLocation }) => dirtyRef.current && currentLocation.pathname !== nextLocation.pathname, []));
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    confirmDialog({
      title: '¿Salir sin guardar?',
      message: 'Tienes cambios en este producto que todavía no se guardaron.',
      confirmLabel: 'Salir sin guardar',
      cancelLabel: 'Seguir editando',
      danger: true,
    }).then((leave) => (leave ? blocker.proceed() : blocker.reset()));
  }, [blocker]);
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // ── Colores ──
  const addColor = (preset) =>
    update((f) => {
      const key = makeColorKey(preset.name, f.colors.map((c) => c.key));
      const stock = { ...f.stock };
      for (const size of f.sizes) stock[cellKey(key, size)] = ''; // se ofrece en todas las tallas actuales
      return { colors: [...f.colors, { key, name: preset.name, hex: preset.hex }], stock };
    });

  const updateColor = (key, patch) =>
    update((f) => ({ colors: f.colors.map((c) => (c.key === key ? { ...c, ...patch } : c)) }));

  const removeColor = async (color) => {
    const hasStock = form.sizes.some((s) => Number(form.stock[cellKey(color.key, s)]) > 0);
    const photoCount = images.filter((img) => img.colorKey === color.key).length;
    if (hasStock || photoCount) {
      const ok = await confirmDialog({
        title: `¿Quitar el color ${color.name || 'sin nombre'}?`,
        message: `Se borrarán sus existencias${photoCount ? ` y sus ${photoCount} ${photoCount === 1 ? 'foto pasará' : 'fotos pasarán'} a “Todos los colores”` : ''}.`,
        confirmLabel: 'Quitar color',
        danger: true,
      });
      if (!ok) return;
    }
    update((f) => {
      const stock = Object.fromEntries(Object.entries(f.stock).filter(([k]) => !k.startsWith(`${color.key}|`)));
      return { colors: f.colors.filter((c) => c.key !== color.key), stock };
    });
    setImages((list) => list.map((img) => (img.colorKey === color.key ? { ...img, colorKey: null } : img)));
  };

  // ── Tallas ("Única" no se combina con las demás) ──
  const toggleSize = (size) =>
    update((f) => {
      let sizes;
      if (f.sizes.includes(size)) sizes = f.sizes.filter((s) => s !== size);
      else if (size === ONE_SIZE) sizes = [ONE_SIZE];
      else sizes = [...f.sizes.filter((s) => s !== ONE_SIZE), size];

      const stock = {};
      for (const [key, value] of Object.entries(f.stock)) {
        if (sizes.includes(key.split('|')[1])) stock[key] = value;
      }
      // Talla nueva → se ofrece en todos los colores
      for (const s of sizes.filter((x) => !f.sizes.includes(x))) {
        for (const color of f.colors) stock[cellKey(color.key, s)] = '';
      }
      return { sizes, stock };
    });

  // ── Fotos ──
  const changeImages = (next) => {
    setImages(next);
    setDirty(true);
  };
  const removeImage = (img) => {
    if (img.file) URL.revokeObjectURL(img.url);
    else setRemovedIds((ids) => [...ids, img.id]);
    changeImages(images.filter((i) => i.uid !== img.uid));
  };

  // ── Guardar ──
  const save = async () => {
    const found = validateForm(form);
    setErrors(found);
    const firstError = Object.keys(found)[0];
    if (firstError) {
      document.getElementById(ERROR_SECTION[firstError])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast.error('Revisa los campos marcados antes de guardar');
      return;
    }

    setSaving(true);
    try {
      const payload = toPayload(form);
      let saved = isNew
        ? (await apiFetch('/admin/products', { method: 'POST', body: payload })).product
        : (await apiFetch(`/admin/products/${product.id}`, { method: 'PUT', body: payload })).product;
      const productId = saved.id;

      for (const imageId of removedIds) {
        saved = (await apiFetch(`/admin/products/${productId}/images/${imageId}`, { method: 'DELETE' })).product;
      }

      const pending = images.filter((img) => img.file);
      let uploadError = null;
      const idByUid = new Map();
      if (pending.length) {
        const body = new FormData();
        pending.forEach((img) => {
          body.append('images', img.file);
          body.append('colorKeys', img.colorKey ?? '');
        });
        try {
          saved = (await apiFetch(`/admin/products/${productId}/images`, { method: 'POST', body })).product;
          // Las fotos nuevas quedan al final, en el mismo orden en que se enviaron
          const created = saved.images.slice(-pending.length);
          pending.forEach((img, i) => idByUid.set(img.uid, created[i].id));
        } catch (err) {
          uploadError = err.message;
        }
      }

      if (!uploadError && images.length > 0) {
        const ordered = images.map((img) => ({ id: img.id ?? idByUid.get(img.uid), colorKey: img.colorKey ?? null }));
        saved = (await apiFetch(`/admin/products/${productId}/images`, { method: 'PUT', body: { images: ordered } })).product;
      }

      clearFetchCache(); // la tienda mostrará los cambios de inmediato
      pending.forEach((img) => !uploadError && URL.revokeObjectURL(img.url));
      setForm(toFormState(saved));
      setImages(uploadError ? [...toImageState(saved), ...pending] : toImageState(saved));
      setRemovedIds([]);
      setSavedSlug(saved.slug);
      setDirty(Boolean(uploadError));

      if (uploadError) toast.error(`El producto se guardó, pero las fotos nuevas no se subieron: ${uploadError}`);
      else toast.success(isNew ? 'Producto creado' : 'Cambios guardados');

      if (isNew) navigate(`/admin/productos/${productId}`, { replace: true });
    } catch (err) {
      const fieldErrors = {};
      for (const detail of err.details ?? []) {
        const field = detail.field.split('.')[0];
        if (ERROR_SECTION[field] && !fieldErrors[field]) fieldErrors[field] = detail.message;
      }
      setErrors(fieldErrors);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalStock = Object.entries(form.stock).reduce((sum, [key, v]) => {
    const [colorKey, size] = key.split('|');
    return form.colors.some((c) => c.key === colorKey) && form.sizes.includes(size) ? sum + (Number(v) || 0) : sum;
  }, 0);

  const saveButton = (
    <Button onClick={save} disabled={saving} className="w-full" size="lg">
      <Save className="size-4" /> {saving ? 'Guardando…' : 'Guardar producto'}
    </Button>
  );

  return (
    <div className="pb-24 lg:pb-0">
      <Link to="/admin/productos" className="mb-3 inline-flex items-center gap-1 text-sm text-brand hover:text-brand-dark">
        <ArrowLeft className="size-4" /> Productos
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl text-brand-dark sm:text-3xl">{isNew ? 'Nuevo producto' : form.name || 'Editar producto'}</h1>
        {dirty && <span className="rounded-full bg-gold/25 px-3 py-1 text-xs font-semibold text-brand-dark">Cambios sin guardar</span>}
      </div>
      <CloudinaryWarning />

      {/* minmax(0,1fr) + min-w-0: la tabla de existencias hace scroll en su recuadro en vez de ensanchar la página */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Card id="seccion-info" title="Información" error={errors.name || errors.category || errors.price || errors.compareAtPrice ? 'Completa los datos marcados' : null}>
            <div className="space-y-4">
              <div>
                <TextField label="Nombre" value={form.name} onChange={(e) => update({ name: e.target.value })} error={errors.name} maxLength={100} placeholder="Ej.: Palazo de vestir" />
                <p className="mt-1.5 text-xs text-ink/70">
                  Dirección en la tienda: /producto/{savedSlug ?? (slugify(form.name) || '…')}
                  {savedSlug && ' (no cambia al renombrar, para no romper enlaces compartidos)'}
                </p>
              </div>
              <div>
                <label htmlFor="descripcion" className="mb-1.5 block text-sm font-medium text-ink">Descripción</label>
                <textarea id="descripcion" rows={4} maxLength={2000} value={form.description} onChange={(e) => update({ description: e.target.value })} className={textareaClass} placeholder="Tela, corte, recomendaciones de uso…" />
              </div>
              <div>
                <label htmlFor="categoria" className="mb-1.5 block text-sm font-medium text-ink">Categoría</label>
                <select
                  id="categoria"
                  value={form.category}
                  onChange={(e) => update({ category: e.target.value })}
                  aria-invalid={errors.category ? true : undefined}
                  className={`h-12 w-full rounded-xl border bg-white px-3 text-base text-ink focus:border-brand focus:outline-none ${errors.category ? 'border-danger' : 'border-brand/20'}`}
                >
                  <option value="">Elige una categoría…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.active ? '' : ' (oculta)'}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1.5 text-sm text-danger">{errors.category}</p>}
                <Link to="/admin/categorias" className="mt-1.5 inline-block text-xs text-brand underline-offset-4 hover:underline">Administrar categorías</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Precio ($)" type="number" inputMode="decimal" step="0.01" min="0" value={form.price} onChange={(e) => update({ price: e.target.value })} error={errors.price} placeholder="14.50" />
                <TextField
                  label="Precio anterior ($) · opcional"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={form.compareAtPrice}
                  onChange={(e) => update({ compareAtPrice: e.target.value })}
                  error={errors.compareAtPrice}
                  hint="Llénalo solo si el producto está en oferta: se mostrará tachado."
                  placeholder="18.00"
                />
              </div>
            </div>
          </Card>

          <Card id="seccion-colores" title="Colores y tallas" description="Elige solo los colores y tallas en que existe esta prenda." error={errors.colors}>
            <div className="space-y-6">
              <ColorEditor colors={form.colors} onAdd={addColor} onUpdate={updateColor} onRemove={removeColor} />
              <div>
                <p className="mb-2 text-sm font-medium text-ink">Tallas</p>
                <SizeSelector sizes={form.sizes} onToggle={toggleSize} />
              </div>
            </div>
          </Card>

          <Card id="seccion-existencias" title="Existencias por color y talla" description="Marca qué combinaciones se venden y escribe cuántas unidades hay de cada una." error={errors.stock}>
            <StockMatrix colors={form.colors} sizes={form.sizes} stock={form.stock} onChange={(stock) => update({ stock })} />
          </Card>

          <Card id="seccion-fotos" title="Fotos" description="La primera foto es la principal. Asigna cada foto a su color.">
            <ImageManager images={images} colors={form.colors} onChange={changeImages} onRemove={removeImage} disabled={!uploadsEnabled} />
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <Card title="Visibilidad">
            <div className="space-y-4">
              <Switch checked={form.active} onChange={(v) => update({ active: v })} label="Visible en la tienda" showLabel />
              <Switch checked={form.isNewArrival} onChange={(v) => update({ isNewArrival: v })} label="Marcar como “Nuevo”" showLabel />
              <Switch checked={form.isFeatured} onChange={(v) => update({ isFeatured: v })} label="Destacado" showLabel />
            </div>
          </Card>
          <Card title="Resumen">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink/80">Colores</dt><dd className="font-semibold">{form.colors.length}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/80">Tallas</dt><dd className="font-semibold">{form.sizes.join(', ') || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/80">Unidades en total</dt><dd className="font-semibold">{totalStock}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/80">Fotos</dt><dd className="font-semibold">{images.length} / 8</dd></div>
            </dl>
            <div className="mt-5 hidden lg:block">{saveButton}</div>
            {savedSlug && (
              <a href={`/producto/${savedSlug}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-1.5 text-sm text-brand hover:underline">
                <Eye className="size-4" /> Ver en la tienda
              </a>
            )}
          </Card>
        </aside>
      </div>

      {/* Celular y tablet: botón de guardar siempre visible */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-lavender bg-white/95 p-3 backdrop-blur lg:hidden">{saveButton}</div>
    </div>
  );
}

export default function ProductFormPage() {
  const { id } = useParams();
  const isNew = id === 'nuevo';
  usePageTitle(isNew ? 'Nuevo producto · Panel' : 'Editar producto · Panel');

  const product = useFetch(isNew ? null : `/admin/products/${id}`, { cache: false });
  const categories = useFetch('/admin/categories', { cache: false });
  const info = useFetch('/admin', { cache: false });

  if (product.loading || categories.loading) return <LoadingState message="Cargando producto…" />;
  if (product.error) return <ErrorState error={product.error} onRetry={product.reload} />;
  if (categories.error) return <ErrorState error={categories.error} onRetry={categories.reload} />;

  const categoryList = categories.data?.categories ?? [];
  if (categoryList.length === 0) {
    return (
      <div className="rounded-card bg-white p-10 text-center shadow-soft">
        <p className="font-display text-xl text-brand-dark">Primero crea una categoría</p>
        <p className="mt-1 text-sm text-ink/80">Cada producto pertenece a una categoría (Palazzos, Blusas…).</p>
        <Button as={Link} to="/admin/categorias" className="mt-5">Ir a categorías</Button>
      </div>
    );
  }

  return (
    <ProductEditor
      key={product.data?.product?.id ?? 'nuevo'}
      product={product.data?.product ?? null}
      categories={categoryList}
      uploadsEnabled={info.data?.imageUploadsEnabled ?? true}
    />
  );
}
