/**
 * Panel › Inicio: banners del carrusel de la página de inicio.
 * Agregar (imagen para computadora y, opcional, para celular), editar texto y enlace,
 * mostrar u ocultar, ordenar, cambiar imágenes y eliminar.
 */
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Monitor, Plus, Smartphone, Store, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Switch } from '../../components/ui/Switch.jsx';
import { clearFetchCache, useFetch } from '../../hooks/useFetch.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { apiFetch } from '../../lib/api.js';
import { imageUrl } from '../../lib/images.js';
import { confirmDialog, toast } from '../../store/uiStore.js';
import { checkImageFile } from '../products/productForm.js';
import { Card, CloudinaryWarning, ErrorState, LoadingState, PageHeader } from '../components/AdminUi.jsx';

const MAX_BANNERS = 6;
const inputClass =
  'h-11 w-full rounded-xl border border-brand/20 bg-white px-3 text-sm text-ink focus:border-brand focus:outline-none';

const LINK_SUGGESTIONS = [
  { value: '/catalogo', label: 'Todo el catálogo' },
  { value: '/catalogo?nuevos=1', label: 'Lo nuevo' },
  { value: '/catalogo?categoria=palazzos', label: 'Palazzos' },
];

function isValidLink(value) {
  return value === '' || (value.startsWith('/') && !value.startsWith('//')) || /^https:\/\/\S+$/.test(value);
}

/** Botón que abre el selector de archivo y devuelve la imagen elegida (ya validada) */
function FilePickButton({ children, onFile, disabled, variant = 'secondary' }) {
  const ref = useRef(null);
  return (
    <>
      <Button variant={variant} size="sm" onClick={() => ref.current?.click()} disabled={disabled}>
        {children}
      </Button>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          const problem = checkImageFile(file);
          if (problem) toast.error(problem);
          else onFile(file);
        }}
      />
    </>
  );
}

/**
 * Archivo elegido + su vista previa local. La URL temporal se crea al elegir el archivo
 * y se libera al cambiarlo o quitarlo.
 */
function usePickedFile() {
  const [picked, setPicked] = useState(null); // { file, url }
  const set = (file) => {
    if (picked) URL.revokeObjectURL(picked.url);
    setPicked(file ? { file, url: URL.createObjectURL(file) } : null);
  };
  return [picked, set];
}

function NewBannerForm({ onCreated, disabled }) {
  const [desktop, setDesktop] = usePickedFile();
  const [mobile, setMobile] = usePickedFile();
  const [alt, setAlt] = useState('');
  const [link, setLink] = useState('/catalogo');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!desktop) return toast.error('Elige la imagen para computadora');
    if (alt.trim().length < 3) return toast.error('Escribe una descripción corta del banner');
    if (!isValidLink(link.trim())) return toast.error('El enlace debe ser una ruta de la tienda (/catalogo) o empezar con https://');

    const body = new FormData();
    body.append('desktop', desktop.file);
    if (mobile) body.append('mobile', mobile.file);
    body.append('alt', alt.trim());
    body.append('link', link.trim());
    setSaving(true);
    try {
      await apiFetch('/admin/banners', { method: 'POST', body });
      toast.success('Banner agregado al carrusel');
      setDesktop(null);
      setMobile(null);
      setAlt('');
      setLink('/catalogo');
      onCreated();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Agregar banner" description="Se agrega al final del carrusel. Puedes cambiar el orden después.">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-ink"><Monitor className="size-4 text-brand" /> Imagen para computadora (obligatoria)</p>
            <div className="grid aspect-video place-items-center overflow-hidden rounded-xl border-2 border-dashed border-brand/30 bg-lavender/40">
              {desktop ? <img src={desktop.url} alt="Vista previa" className="size-full object-contain" /> : <ImagePlus className="size-8 text-brand/60" aria-hidden="true" />}
            </div>
            <div className="mt-2"><FilePickButton onFile={setDesktop} disabled={disabled}>{desktop ? 'Cambiar imagen' : 'Elegir imagen'}</FilePickButton></div>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-ink"><Smartphone className="size-4 text-brand" /> Para celular (opcional)</p>
            <div className="grid aspect-square place-items-center overflow-hidden rounded-xl border-2 border-dashed border-brand/30 bg-lavender/40">
              {mobile ? <img src={mobile.url} alt="Vista previa celular" className="size-full object-contain" /> : <span className="px-3 text-center text-xs text-ink/70">Si no eliges una, se usa la de computadora</span>}
            </div>
            <div className="mt-2 flex gap-2">
              <FilePickButton onFile={setMobile} disabled={disabled}>{mobile ? 'Cambiar' : 'Elegir'}</FilePickButton>
              {mobile && <Button variant="ghost" size="sm" onClick={() => setMobile(null)}>Quitar</Button>}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Descripción del banner</span>
            <input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={120} placeholder="Ej.: Nueva colección de palazzos" className={inputClass} />
            <span className="mt-1 block text-xs text-ink/70">La leen los lectores de pantalla y Google. Describe lo que muestra.</span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Al tocarlo, lleva a…</span>
            <input value={link} onChange={(e) => setLink(e.target.value)} maxLength={300} list="banner-links" placeholder="/catalogo" className={inputClass} />
            <datalist id="banner-links">
              {LINK_SUGGESTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </datalist>
            <span className="mt-1 block text-xs text-ink/70">Una página de la tienda (p. ej. /catalogo?nuevos=1) o un enlace https://. Déjalo vacío si no debe llevar a ningún lado.</span>
          </label>
        </div>

        <Button type="submit" disabled={saving || disabled}>
          <Plus className="size-4" /> {saving ? 'Subiendo…' : 'Agregar al carrusel'}
        </Button>
      </form>
    </Card>
  );
}

function BannerRow({ banner, index, total, onChanged, onMove, uploadsEnabled }) {
  const [alt, setAlt] = useState(banner.alt);
  const [link, setLink] = useState(banner.link ?? '');
  const [busy, setBusy] = useState(false);

  const patch = async (body, message) => {
    try {
      await apiFetch(`/admin/banners/${banner.id}`, { method: 'PATCH', body });
      if (message) toast.success(message);
      onChanged();
    } catch (err) {
      toast.error(err.message);
      setAlt(banner.alt);
      setLink(banner.link ?? '');
    }
  };

  const saveText = () => {
    const changes = {};
    if (alt.trim() !== banner.alt) {
      if (alt.trim().length < 3) {
        setAlt(banner.alt);
        return toast.error('La descripción debe tener al menos 3 letras');
      }
      changes.alt = alt.trim();
    }
    if (link.trim() !== (banner.link ?? '')) {
      if (!isValidLink(link.trim())) {
        setLink(banner.link ?? '');
        return toast.error('El enlace debe ser una ruta de la tienda (/catalogo) o empezar con https://');
      }
      changes.link = link.trim();
    }
    if (Object.keys(changes).length) patch(changes, 'Banner actualizado');
  };

  const replaceImage = async (variant, file) => {
    const body = new FormData();
    body.append(variant, file);
    setBusy(true);
    try {
      await apiFetch(`/admin/banners/${banner.id}/image/${variant}`, { method: 'PUT', body });
      toast.success('Imagen actualizada');
      onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeMobile = async () => {
    try {
      await apiFetch(`/admin/banners/${banner.id}/image/mobile`, { method: 'DELETE' });
      toast.success('En celular se usará la imagen de computadora');
      onChanged();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async () => {
    const ok = await confirmDialog({
      title: '¿Eliminar este banner?',
      message: total === 1 ? 'Es el único banner: la página de inicio mostrará la portada de texto.' : 'Se quitará del carrusel. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/admin/banners/${banner.id}`, { method: 'DELETE' });
      toast.success('Banner eliminado');
      onChanged();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const mobileUrl = banner.imageMobile?.url;

  return (
    <li className={`rounded-card bg-white p-4 shadow-soft sm:p-5 ${banner.active ? '' : 'opacity-75'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-lg text-brand-dark">Banner {index + 1}</p>
        <div className="flex items-center gap-2">
          <Switch checked={banner.active} onChange={(v) => patch({ active: v }, v ? 'El banner se muestra en la tienda' : 'Banner oculto')} label="Visible" showLabel size="sm" />
          <button type="button" onClick={() => onMove(index, index - 1)} disabled={index === 0} className="grid size-9 place-items-center rounded-full text-brand hover:bg-lavender disabled:opacity-30" aria-label={`Subir banner ${index + 1}`}><ArrowUp className="size-4" /></button>
          <button type="button" onClick={() => onMove(index, index + 1)} disabled={index === total - 1} className="grid size-9 place-items-center rounded-full text-brand hover:bg-lavender disabled:opacity-30" aria-label={`Bajar banner ${index + 1}`}><ArrowDown className="size-4" /></button>
          <button type="button" onClick={remove} className="grid size-9 place-items-center rounded-full text-danger hover:bg-danger-soft" aria-label={`Eliminar banner ${index + 1}`}><Trash2 className="size-4" /></button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium text-ink/80"><Monitor className="size-3.5" /> Computadora</p>
          <div className="aspect-video overflow-hidden rounded-xl bg-lavender">
            <img src={imageUrl(banner.imageDesktop.url, 800)} alt={banner.alt} className="size-full object-contain" />
          </div>
          <div className="mt-2">
            <FilePickButton onFile={(f) => replaceImage('desktop', f)} disabled={busy || !uploadsEnabled}>Cambiar imagen</FilePickButton>
          </div>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium text-ink/80"><Smartphone className="size-3.5" /> Celular</p>
          <div className="grid aspect-square place-items-center overflow-hidden rounded-xl bg-lavender">
            {mobileUrl ? <img src={imageUrl(mobileUrl, 400)} alt="" className="size-full object-contain" /> : <span className="px-3 text-center text-xs text-ink/70">Usa la imagen de computadora</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <FilePickButton onFile={(f) => replaceImage('mobile', f)} disabled={busy || !uploadsEnabled}>{mobileUrl ? 'Cambiar' : 'Agregar'}</FilePickButton>
            {mobileUrl && <Button variant="ghost" size="sm" onClick={removeMobile}>Quitar</Button>}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Descripción</span>
          <input value={alt} onChange={(e) => setAlt(e.target.value)} onBlur={saveText} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} maxLength={120} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-ink">
            Al tocarlo, lleva a…
            {banner.link?.startsWith('/') && (
              // Página de la tienda: misma pestaña
              <Link to={banner.link} className="inline-flex items-center gap-1 text-xs font-normal text-brand hover:underline">
                Probar
              </Link>
            )}
            {banner.link?.startsWith('https://') && (
              // Sitio externo (p. ej. Instagram): pestaña nueva, para no salir del panel
              <a href={banner.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-normal text-brand hover:underline">
                Probar <ExternalLink className="size-3" />
              </a>
            )}
          </span>
          <input value={link} onChange={(e) => setLink(e.target.value)} onBlur={saveText} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} maxLength={300} list="banner-links" placeholder="Sin enlace" className={inputClass} />
        </label>
      </div>
    </li>
  );
}

export default function BannersPage() {
  usePageTitle('Página de inicio · Panel');
  const { data, loading, error, reload } = useFetch('/admin/banners', { cache: false });
  const info = useFetch('/admin', { cache: false });
  const [order, setOrder] = useState(null);

  const banners = order ?? data?.banners ?? [];
  const uploadsEnabled = info.data?.imageUploadsEnabled ?? true;

  const refresh = () => {
    clearFetchCache(); // la tienda se actualiza al instante (también en otras pestañas)
    reload({ silent: true });
  };

  const move = async (from, to) => {
    if (to < 0 || to >= banners.length) return;
    const next = [...banners];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
    try {
      await apiFetch('/admin/banners/reorder', { method: 'PUT', body: { ids: next.map((b) => b.id) } });
      refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setOrder(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Página de inicio"
        description="Banners del carrusel principal. Se muestran en este orden y cambian solos cada 6 segundos."
        actions={
          <Button as={Link} to="/" variant="secondary">
            <Store className="size-4" /> Ver la tienda
          </Button>
        }
      />
      <CloudinaryWarning />

      <div className="mb-6 rounded-xl bg-white px-4 py-3 text-sm text-ink/85 shadow-soft">
        <strong className="text-brand-dark">Tamaños recomendados:</strong> computadora 1920 × 1080 px (o más ancho, como 1920 × 700);
        celular 1080 × 1080 px. El banner se muestra completo, sin recortar el texto. JPG, PNG o WEBP de hasta 5 MB.
      </div>

      {loading && !data ? (
        <LoadingState message="Cargando banners…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <div className="space-y-6">
          {banners.length === 0 ? (
            <p className="rounded-card bg-white p-8 text-center text-ink/80 shadow-soft">
              No hay banners. La página de inicio muestra la portada de texto con el eslogan.
            </p>
          ) : (
            <ul className="space-y-4">
              {banners.map((banner, index) => (
                <BannerRow
                  key={`${banner.id}-${banner.updatedAt}`}
                  banner={banner}
                  index={index}
                  total={banners.length}
                  onChanged={refresh}
                  onMove={move}
                  uploadsEnabled={uploadsEnabled}
                />
              ))}
            </ul>
          )}

          {banners.length < MAX_BANNERS ? (
            <NewBannerForm onCreated={refresh} disabled={!uploadsEnabled} />
          ) : (
            <p className="text-center text-sm text-ink/80">Llegaste al máximo de {MAX_BANNERS} banners. Elimina uno para agregar otro.</p>
          )}
        </div>
      )}
    </>
  );
}
