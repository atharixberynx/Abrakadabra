/**
 * Checkout › Entrega: retiro en tienda (gratis) o envío a domicilio (costo de Panel › Ajustes).
 * Con envío se pide la dirección completa: departamento, municipio y distrito (listas oficiales),
 * dirección exacta y un punto de referencia opcional.
 */
import { useId } from 'react';
import { Info, MapPin, Store, Truck } from 'lucide-react';
import { inputClassName, TextField } from '../ui/TextField.jsx';
import { DEPARTMENTS } from '../../data/elSalvador.js';
import { formatPhone, formatPrice } from '../../lib/format.js';

function FieldShell({ id, label, hint, error, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink/70">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}

/** Atributos de accesibilidad comunes para select y textarea */
function a11y(id, { error, hint }) {
  const describedBy = [error && `${id}-error`, hint && !error && `${id}-hint`].filter(Boolean).join(' ');
  return { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy || undefined };
}

const borderFor = (error) => (error ? 'border-danger' : 'border-brand/20 focus:border-brand');

function OptionCard({ value, checked, disabled, onChange, icon: Icon, title, price, children }) {
  return (
    <label
      className={`relative flex gap-3 rounded-xl border-2 p-4 transition has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-brand/40 ${
        checked ? 'border-brand bg-lavender/40' : 'border-brand/15 bg-white hover:border-brand/50'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <input type="radio" name="delivery-method" value={value} checked={checked} disabled={disabled} onChange={() => onChange(value)} className="sr-only" />
      <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${checked ? 'border-brand' : 'border-ink/30'}`} aria-hidden="true">
        {checked && <span className="size-2.5 rounded-full bg-brand" />}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="flex items-center gap-2 font-semibold text-ink">
            <Icon className="size-5 shrink-0 text-brand" aria-hidden="true" /> {title}
          </span>
          <span className="font-semibold text-brand">{price}</span>
        </p>
        <div className="mt-1.5 text-ink/80">{children}</div>
      </div>
    </label>
  );
}

export function DeliveryOptions({ method, onMethodChange, shipping, onShippingChange, errors, shippingInfo, store }) {
  const baseId = useId();
  const department = DEPARTMENTS.find((d) => d.name === shipping.department);
  const update = (patch) => onShippingChange({ ...shipping, ...patch });
  const districtHint = shipping.municipality ? `Municipio: ${shipping.municipality}` : 'Busca el nombre de tu ciudad o pueblo.';
  const addressHint = 'Colonia o residencial, calle o pasaje, número de casa o apartamento.';

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-3 text-sm text-ink/80">¿Cómo quieres recibir tu pedido?</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <OptionCard value="retiro" checked={method === 'retiro'} onChange={onMethodChange} icon={Store} title="Retiro en tienda" price="Gratis">
            <p>{store.fullAddress}</p>
            <p className="mt-1 text-ink/70">{store.hoursText}</p>
          </OptionCard>
          <OptionCard
            value="envio"
            checked={method === 'envio'}
            disabled={!shippingInfo.enabled}
            onChange={onMethodChange}
            icon={Truck}
            title="Envío a domicilio"
            price={shippingInfo.enabled ? `+ ${formatPrice(shippingInfo.fee)}` : 'No disponible'}
          >
            {shippingInfo.enabled ? (
              <>
                <p>A todo El Salvador.</p>
                <p className="mt-1 text-ink/70">Tiempo estimado: {shippingInfo.time.toLowerCase()}.</p>
              </>
            ) : (
              <p>Por ahora no estamos haciendo envíos. Puedes retirar tu pedido en la tienda.</p>
            )}
          </OptionCard>
        </div>
      </fieldset>

      {method === 'retiro' && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink/70">
          <p>Presenta tu número de pedido y tu DUI al retirar.</p>
          <a href={store.maps.directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-brand underline-offset-4 hover:underline">
            <MapPin className="size-4" aria-hidden="true" /> Cómo llegar
          </a>
        </div>
      )}

      {method === 'envio' && (
        <div className="space-y-4">
          <p className="flex gap-2 rounded-xl border border-gold bg-gold/15 p-3 text-sm text-ink">
            <Info className="mt-0.5 size-4 shrink-0 text-brand-dark" aria-hidden="true" />
            <span>
              El envío tiene un <strong>costo adicional de {formatPrice(shippingInfo.fee)}</strong>, que ya se suma al total de tu pedido.
              Te contactaremos al teléfono que indiques para coordinar la entrega.
            </span>
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nombre de quien recibe"
              autoComplete="name"
              value={shipping.recipientName}
              onChange={(e) => update({ recipientName: e.target.value })}
              error={errors.recipientName}
              maxLength={80}
            />
            <TextField
              label="Teléfono de contacto"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="7777-7777"
              value={shipping.phone}
              onChange={(e) => update({ phone: formatPhone(e.target.value) })}
              error={errors.phone}
            />

            <FieldShell id={`${baseId}-dep`} label="Departamento" error={errors.department}>
              <select
                {...a11y(`${baseId}-dep`, { error: errors.department })}
                autoComplete="address-level1"
                value={shipping.department}
                onChange={(e) => update({ department: e.target.value, municipality: '', district: '' })}
                className={`${inputClassName} ${borderFor(errors.department)}`}
              >
                <option value="">Elige el departamento</option>
                {DEPARTMENTS.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
            </FieldShell>

            {/* Un solo menú: los distritos (antiguos municipios) agrupados por municipio */}
            <FieldShell id={`${baseId}-dis`} label="Municipio y distrito" hint={districtHint} error={errors.district}>
              <select
                {...a11y(`${baseId}-dis`, { error: errors.district, hint: districtHint })}
                autoComplete="address-level2"
                disabled={!department}
                value={shipping.district ? `${shipping.municipality}|${shipping.district}` : ''}
                onChange={(e) => {
                  const [municipality = '', district = ''] = e.target.value.split('|');
                  update({ municipality, district });
                }}
                className={`${inputClassName} ${borderFor(errors.district)}`}
              >
                <option value="">{department ? 'Elige tu distrito' : 'Primero elige el departamento'}</option>
                {department?.municipalities.map((m) => (
                  <optgroup key={m.name} label={m.name}>
                    {m.districts.map((d) => <option key={d} value={`${m.name}|${d}`}>{d}</option>)}
                  </optgroup>
                ))}
              </select>
            </FieldShell>

            <FieldShell id={`${baseId}-addr`} label="Dirección exacta" hint={addressHint} error={errors.address} className="sm:col-span-2">
              <textarea
                {...a11y(`${baseId}-addr`, { error: errors.address, hint: addressHint })}
                autoComplete="street-address"
                rows={2}
                maxLength={200}
                placeholder="Ej.: Colonia Escalón, calle Los Pinos, pasaje 3, casa 14"
                value={shipping.address}
                onChange={(e) => update({ address: e.target.value })}
                className={`${inputClassName.replace('h-12 ', '')} block min-h-20 py-3 ${borderFor(errors.address)}`}
              />
            </FieldShell>

            <TextField
              label="Punto de referencia (opcional)"
              className="sm:col-span-2"
              placeholder="Ej.: frente a la iglesia, portón negro, casa de dos pisos"
              value={shipping.reference}
              onChange={(e) => update({ reference: e.target.value })}
              error={errors.reference}
              maxLength={200}
            />
          </div>
        </div>
      )}
    </div>
  );
}
