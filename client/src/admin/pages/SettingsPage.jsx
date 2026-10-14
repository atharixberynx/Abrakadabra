/**
 * Panel › Ajustes: mensajes de la barra de anuncio, WhatsApp, redes, dirección, horario
 * y enlace "Cómo llegar". Los cambios se ven de inmediato en la tienda y los pedidos
 * nuevos usan la dirección y el horario vigentes.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ExternalLink, FileText, Images, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { clearFetchCache, useFetch } from '../../hooks/useFetch.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { apiFetch } from '../../lib/api.js';
import { formatWhatsapp } from '../../lib/format.js';
import { toast } from '../../store/uiStore.js';
import { Card, ErrorState, LoadingState, PageHeader } from '../components/AdminUi.jsx';

const MAX_ANNOUNCEMENTS = 6;
const MAX_HOURS = 4;
const inputClass =
  'h-11 w-full rounded-xl border bg-white px-3 text-sm text-ink focus:border-brand focus:outline-none';

const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : hint && <span className="mt-1 block text-xs text-ink/70">{hint}</span>}
    </label>
  );
}

const borderFor = (error) => (error ? 'border-danger' : 'border-brand/20');

function SettingsForm({ initial }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };
  const setAddress = (key, value) => set({ address: { ...form.address, [key]: value } });

  const updateList = (key, index, value) => set({ [key]: form[key].map((item, i) => (i === index ? value : item)) });
  const removeFromList = (key, index) => set({ [key]: form[key].filter((_, i) => i !== index) });
  const moveInList = (key, from, to) => {
    if (to < 0 || to >= form[key].length) return;
    const list = [...form[key]];
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    set({ [key]: list });
  };

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const { settings } = await apiFetch('/admin/settings', { method: 'PUT', body: form });
      setForm({ ...settings, whatsappNumber: formatWhatsapp(settings.whatsappNumber) });
      setDirty(false);
      clearFetchCache(); // la tienda (también en otras pestañas) se actualiza al instante
      toast.success('Ajustes guardados');
    } catch (err) {
      const found = {};
      for (const d of err.details ?? []) found[d.field] = d.message;
      setErrors(found);
      toast.error(err.details ? 'Revisa los campos marcados' : err.message);
    } finally {
      setSaving(false);
    }
  };

  const hoursPreview = form.hours
    .filter((h) => h.days && h.time)
    .map((h, i) => `${i === 0 ? h.days : lowerFirst(h.days)} de ${h.time}`)
    .join('; ');
  const whatsappDigits = form.whatsappNumber.replace(/\D/g, '');

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Barra de anuncio" description="Mensajes que rotan en la franja morada de arriba de la tienda." error={errors.announcements}>
          <ul className="space-y-2">
            {form.announcements.map((message, i) => (
              <li key={i} className="flex items-center gap-2">
                <input
                  value={message}
                  onChange={(e) => updateList('announcements', i, e.target.value)}
                  maxLength={90}
                  aria-label={`Mensaje ${i + 1}`}
                  className={`${inputClass} ${borderFor(errors[`announcements.${i}`])}`}
                />
                <button type="button" onClick={() => moveInList('announcements', i, i - 1)} disabled={i === 0} className="grid size-9 shrink-0 place-items-center rounded-full text-brand hover:bg-lavender disabled:opacity-30" aria-label={`Subir mensaje ${i + 1}`}><ArrowUp className="size-4" /></button>
                <button type="button" onClick={() => moveInList('announcements', i, i + 1)} disabled={i === form.announcements.length - 1} className="grid size-9 shrink-0 place-items-center rounded-full text-brand hover:bg-lavender disabled:opacity-30" aria-label={`Bajar mensaje ${i + 1}`}><ArrowDown className="size-4" /></button>
                <button type="button" onClick={() => removeFromList('announcements', i)} disabled={form.announcements.length === 1} className="grid size-9 shrink-0 place-items-center rounded-full text-danger hover:bg-danger-soft disabled:opacity-30" aria-label={`Quitar mensaje ${i + 1}`}><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
          {form.announcements.length < MAX_ANNOUNCEMENTS && (
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => set({ announcements: [...form.announcements, ''] })}>
              <Plus className="size-4" /> Agregar mensaje
            </Button>
          )}
        </Card>

        <Card title="Contacto y redes">
          <div className="space-y-4">
            <Field
              label="Número de WhatsApp"
              hint={whatsappDigits.length >= 8 ? (
                <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                  Probar el enlace <ExternalLink className="size-3" />
                </a>
              ) : 'Con código de país, por ejemplo +503 7777-7777.'}
              error={errors.whatsappNumber}
            >
              <input
                value={form.whatsappNumber}
                onChange={(e) => set({ whatsappNumber: e.target.value })}
                onBlur={(e) => set({ whatsappNumber: formatWhatsapp(e.target.value) })}
                inputMode="tel"
                placeholder="+503 7777-7777"
                className={`${inputClass} ${borderFor(errors.whatsappNumber)}`}
              />
            </Field>
            <Field label="Instagram" hint="Enlace completo. Déjalo vacío para no mostrarlo." error={errors.instagramUrl}>
              <input value={form.instagramUrl} onChange={(e) => set({ instagramUrl: e.target.value })} placeholder="https://www.instagram.com/abrakadabraes" className={`${inputClass} ${borderFor(errors.instagramUrl)}`} />
            </Field>
            <Field label="Facebook" hint="Enlace completo. Déjalo vacío para no mostrarlo." error={errors.facebookUrl}>
              <input value={form.facebookUrl} onChange={(e) => set({ facebookUrl: e.target.value })} placeholder="https://www.facebook.com/abrakadabraes" className={`${inputClass} ${borderFor(errors.facebookUrl)}`} />
            </Field>
          </div>
        </Card>
      </div>

      <Card title="Sucursal y retiro en tienda" description="Se muestra en la tienda, en el checkout y se copia en cada pedido nuevo.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Dirección" error={errors['address.line1']}>
            <input value={form.address.line1} onChange={(e) => setAddress('line1', e.target.value)} className={`${inputClass} ${borderFor(errors['address.line1'])}`} />
          </Field>
          <Field label="Complemento (centro comercial, local)" error={errors['address.line2']}>
            <input value={form.address.line2 ?? ''} onChange={(e) => setAddress('line2', e.target.value)} className={`${inputClass} ${borderFor(errors['address.line2'])}`} />
          </Field>
          <Field label="Ciudad y país" error={errors['address.city']}>
            <input value={form.address.city} onChange={(e) => setAddress('city', e.target.value)} className={`${inputClass} ${borderFor(errors['address.city'])}`} />
          </Field>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-ink">Horario</p>
          {errors.hours && <p className="mb-2 text-xs text-danger">{errors.hours}</p>}
          <ul className="space-y-2">
            {form.hours.map((h, i) => (
              <li key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                <input value={h.days} onChange={(e) => updateList('hours', i, { ...h, days: e.target.value })} placeholder="Lunes a viernes" maxLength={40} aria-label={`Días del horario ${i + 1}`} className={`${inputClass} ${borderFor(errors[`hours.${i}.days`])}`} />
                <input value={h.time} onChange={(e) => updateList('hours', i, { ...h, time: e.target.value })} placeholder="8:00 a. m. a 4:30 p. m." maxLength={60} aria-label={`Horas del horario ${i + 1}`} className={`${inputClass} ${borderFor(errors[`hours.${i}.time`])}`} />
                <button type="button" onClick={() => removeFromList('hours', i)} disabled={form.hours.length === 1} className="grid size-9 place-items-center rounded-full text-danger hover:bg-danger-soft disabled:opacity-30" aria-label={`Quitar horario ${i + 1}`}><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
          {form.hours.length < MAX_HOURS && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => set({ hours: [...form.hours, { days: '', time: '' }] })}>
              <Plus className="size-4" /> Agregar horario
            </Button>
          )}
          {hoursPreview && <p className="mt-2 rounded-lg bg-lavender/60 px-3 py-2 text-xs text-ink/85">Así se verá: <strong>{hoursPreview}</strong></p>}
        </div>

        <div className="mt-6">
          <Field
            label="Enlace “Cómo llegar” (Google Maps)"
            hint={<>En Google Maps busca la tienda › <strong>Compartir</strong> › <strong>Copiar vínculo</strong> y pégalo aquí.</>}
            error={errors.mapsUrl}
          >
            <input value={form.mapsUrl} onChange={(e) => set({ mapsUrl: e.target.value })} placeholder="https://maps.app.goo.gl/…" className={`${inputClass} ${borderFor(errors.mapsUrl)}`} />
          </Field>
        </div>
      </Card>

      <Card title="Otros contenidos de la tienda">
        <ul className="space-y-3 text-sm text-ink/85">
          <li className="flex gap-3">
            <Images className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
            <span>Los <strong>banners del carrusel</strong> se editan en <Link to="/admin/inicio" className="text-brand underline underline-offset-4">Inicio</Link>.</span>
          </li>
          <li className="flex gap-3">
            <FileText className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
            <span>
              Los textos de <strong>Sobre nosotras, Retiro en tienda, Cambios y devoluciones, Preguntas frecuentes y Guía de tallas</strong> están en
              el archivo <code className="rounded bg-lavender px-1 text-xs">client/src/content/paginas-informativas.json</code> (ver README).
            </span>
          </li>
        </ul>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-end gap-3 border-t border-lavender bg-white/95 p-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
        {dirty && <span className="mr-auto rounded-full bg-gold/25 px-3 py-1 text-xs font-semibold text-brand-dark lg:mr-0">Cambios sin guardar</span>}
        <Button onClick={save} disabled={saving || !dirty} size="lg">
          <Save className="size-4" /> {saving ? 'Guardando…' : 'Guardar ajustes'}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  usePageTitle('Ajustes · Panel');
  const { data, loading, error, reload } = useFetch('/settings', { cache: false });

  return (
    <>
      <PageHeader title="Ajustes de la tienda" description="Datos de contacto, sucursal y mensajes que se muestran en toda la tienda." />
      {loading && !data ? (
        <LoadingState message="Cargando ajustes…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <SettingsForm
          initial={{
            announcements: data.settings.announcements,
            whatsappNumber: formatWhatsapp(data.settings.whatsappNumber), // se muestra "+503 7777-7777"; el servidor guarda solo dígitos
            address: { line2: '', ...data.settings.address },
            hours: data.settings.hours.map(({ days, time }) => ({ days, time })),
            mapsUrl: data.settings.mapsUrl,
            instagramUrl: data.settings.instagramUrl ?? '',
            facebookUrl: data.settings.facebookUrl ?? '',
          }}
        />
      )}
    </>
  );
}
