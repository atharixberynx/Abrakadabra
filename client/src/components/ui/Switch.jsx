/** Interruptor accesible (role="switch"). `label` se lee en voz alta aunque no se muestre */
export function Switch({ checked, onChange, label, showLabel = false, disabled = false, size = 'md' }) {
  const track = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
  const knob = size === 'sm' ? 'size-4' : 'size-5';
  const shift = size === 'sm' ? 'translate-x-4' : 'translate-x-5';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={showLabel ? undefined : label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className={`relative inline-flex shrink-0 items-center rounded-full p-0.5 transition ${track} ${checked ? 'bg-brand' : 'bg-ink/25'}`}>
        <span className={`${knob} rounded-full bg-white shadow transition-transform ${checked ? shift : 'translate-x-0'}`} />
      </span>
      {showLabel && <span className="text-sm text-ink">{label}</span>}
    </button>
  );
}
