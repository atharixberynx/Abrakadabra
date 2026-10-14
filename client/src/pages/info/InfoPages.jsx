/**
 * Páginas informativas. Los textos salen de content/paginas-informativas.json y los datos
 * de la sucursal (dirección, horario, WhatsApp) de Panel › Ajustes.
 */
import { Link } from 'react-router-dom';
import { Clock, IdCard, MapPin, Ruler, Store } from 'lucide-react';
import { pages, useFillPlaceholders } from '../../content/index.js';
import { useStoreInfo } from '../../context/StoreInfoContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StarIcon } from '../../components/ui/StarIcon.jsx';
import { DevNotice, InfoLayout, SectionTitle } from './InfoLayout.jsx';

export function AboutPage() {
  const fill = useFillPlaceholders();
  const page = pages.sobreNosotras;
  return (
    <InfoLayout title={page.titulo} intro={fill(page.introduccion)}>
      <section>
        <SectionTitle>Nuestra historia</SectionTitle>
        <div className="space-y-4 leading-relaxed text-ink/85">
          {page.historia.map((p) => <p key={p}>{fill(p)}</p>)}
        </div>
      </section>
      <section>
        <SectionTitle>Lo que nos hace diferentes</SectionTitle>
        <p className="mb-5 leading-relaxed text-ink/85">{fill(page.propuesta)}</p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {page.diferenciadores.map((d) => (
            <li key={d.titulo} className="rounded-card border border-lavender p-5 shadow-soft">
              <p className="flex items-center gap-2 font-display text-lg text-brand-dark"><StarIcon className="size-4 shrink-0 text-gold" /> {d.titulo}</p>
              <p className="mt-1 text-sm text-ink/80">{fill(d.texto)}</p>
            </li>
          ))}
        </ul>
      </section>
      {page.cierre && <p className="text-center font-display text-2xl font-light text-brand">{fill(page.cierre)}</p>}
      <div className="text-center">
        <Button as={Link} to="/catalogo" size="lg">Ver catálogo</Button>
      </div>
    </InfoLayout>
  );
}

export function PickupPage() {
  const fill = useFillPlaceholders();
  const info = useStoreInfo();
  const page = pages.retiroEnTienda;
  return (
    <InfoLayout title={page.titulo} intro={fill(page.introduccion)} whatsappMessage="Hola, tengo una consulta sobre el retiro de mi pedido.">
      <section>
        <SectionTitle>¿Cómo funciona?</SectionTitle>
        <ol className="space-y-4">
          {page.pasos.map((step, i) => (
            <li key={step.titulo} className="flex gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand font-semibold text-white">{i + 1}</span>
              <div>
                <p className="font-semibold text-ink">{step.titulo}</p>
                <p className="mt-0.5 text-ink/80">{fill(step.texto)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid overflow-hidden rounded-card border border-lavender shadow-soft md:grid-cols-2">
        <div className="space-y-4 p-6">
          <SectionTitle>Nuestra sucursal</SectionTitle>
          <p className="flex gap-3 text-ink/85"><MapPin className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" /> {info.fullAddress}</p>
          <div className="flex gap-3 text-ink/85">
            <Clock className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
            <ul>{info.hours.map((h) => <li key={h.days}><strong className="font-medium text-ink">{h.days}:</strong> {h.time}</li>)}</ul>
          </div>
          <Button as="a" href={info.maps.directionsUrl} target="_blank" rel="noopener noreferrer"><MapPin className="size-4" /> Cómo llegar</Button>
        </div>
        <iframe title="Mapa de la sucursal" src={info.maps.embedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-64 w-full border-0 md:h-full" />
      </section>

      <section>
        <SectionTitle>¿Qué debo llevar?</SectionTitle>
        <ul className="space-y-2">
          {page.queLlevar.map((item) => (
            <li key={item} className="flex gap-3 text-ink/85"><IdCard className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" /> {fill(item)}</li>
          ))}
        </ul>
        {page.nota && <p className="mt-4 rounded-xl bg-lavender/60 px-4 py-3 text-sm text-ink/85">{fill(page.nota)}</p>}
      </section>
    </InfoLayout>
  );
}

export function ReturnsPage() {
  const fill = useFillPlaceholders();
  const page = pages.politicaCambios;
  return (
    <InfoLayout
      title={page.titulo}
      intro={fill(page.introduccion)}
      notice={page.borrador && <DevNotice>Borrador: por validar con la marca (este aviso solo se ve en desarrollo)</DevNotice>}
      whatsappMessage="Hola, quiero consultar sobre un cambio de prenda."
    >
      {page.secciones.map((section) => (
        <section key={section.titulo}>
          <SectionTitle>{section.titulo}</SectionTitle>
          <div className="space-y-3 leading-relaxed text-ink/85">
            {section.parrafos?.map((p) => <p key={p}>{fill(p)}</p>)}
            {section.lista && (
              <ul className="space-y-1.5">
                {section.lista.map((item) => (
                  <li key={item} className="flex gap-2"><StarIcon className="mt-1.5 size-3 shrink-0 text-gold" /> {fill(item)}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
      {page.actualizada && <p className="text-sm text-ink/70">Última actualización: {page.actualizada}.</p>}
    </InfoLayout>
  );
}

export function FaqPage() {
  const fill = useFillPlaceholders();
  const page = pages.preguntasFrecuentes;
  return (
    <InfoLayout title={page.titulo} intro={fill(page.introduccion)} whatsappMessage="Hola, tengo una pregunta sobre la tienda.">
      {page.grupos.map((group) => (
        <section key={group.titulo}>
          <SectionTitle>{group.titulo}</SectionTitle>
          <div className="divide-y divide-lavender rounded-card border border-lavender">
            {group.preguntas.map((q) => (
              <details key={q.pregunta} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink marker:hidden">
                  {fill(q.pregunta)}
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-lavender text-brand transition group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-ink/85">{fill(q.respuesta)}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </InfoLayout>
  );
}

export function SizeGuidePage() {
  const fill = useFillPlaceholders();
  const page = pages.guiaTallas;
  return (
    <InfoLayout title={page.titulo} intro={fill(page.introduccion)} whatsappMessage="Hola, ¿me ayudan a elegir mi talla?">
      <section>
        <SectionTitle>Medidas por talla ({page.unidad})</SectionTitle>
        {page.porValidar && (
          <p className="mb-4 rounded-xl bg-gold/15 px-4 py-3 text-sm text-brand-dark">
            Medidas de referencia, por validar con la marca. Si tienes dudas, consúltanos antes de comprar.
          </p>
        )}
        <div className="overflow-x-auto rounded-card border border-lavender">
          <table className="w-full min-w-[420px] text-left text-sm">
            <caption className="sr-only">Medidas de cada talla en {page.unidad}</caption>
            <thead className="bg-lavender text-brand-dark">
              <tr>{page.columnas.map((c) => <th key={c} scope="col" className="px-4 py-3 font-semibold">{c}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-lavender">
              {page.filas.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (i === 0 ? <th key={i} scope="row" className="px-4 py-3 font-semibold text-brand">{cell}</th> : <td key={i} className="px-4 py-3 tabular-nums text-ink/85">{cell}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {page.tallaUnica && <p className="mt-4 text-sm text-ink/80"><strong className="text-ink">Talla única:</strong> {fill(page.tallaUnica)}</p>}
      </section>

      <section>
        <SectionTitle>Cómo tomar tus medidas</SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-3">
          {page.comoMedirte.map((m) => (
            <li key={m.medida} className="rounded-card border border-lavender p-5">
              <p className="flex items-center gap-2 font-display text-lg text-brand-dark"><Ruler className="size-4 text-brand" aria-hidden="true" /> {m.medida}</p>
              <p className="mt-1 text-sm text-ink/80">{fill(m.como)}</p>
            </li>
          ))}
        </ul>
      </section>

      {page.consejos.length > 0 && (
        <section>
          <SectionTitle>Consejos</SectionTitle>
          <ul className="space-y-2 text-ink/85">
            {page.consejos.map((c) => <li key={c} className="flex gap-2"><Store className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" /> {fill(c)}</li>)}
          </ul>
        </section>
      )}
    </InfoLayout>
  );
}
