/**
 * Fotos del producto (hasta 8).
 *  - Arrastra archivos al recuadro o tócalo para elegirlos (JPG, PNG o WEBP, máx. 5 MB).
 *  - Reordena arrastrando o con las flechas: la PRIMERA foto es la principal.
 *  - Asigna cada foto a un color: al elegir ese color en la tienda, se muestran sus fotos.
 * Los cambios se aplican al tocar "Guardar producto".
 */
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Star, X } from 'lucide-react';
import { Alert } from '../../components/ui/Alert.jsx';
import { imageUrl } from '../../lib/images.js';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGES, checkImageFile } from './productForm.js';

const colorSelectClass =
  'h-9 w-full rounded-lg border border-brand/20 bg-white px-2 text-xs text-ink focus:border-brand focus:outline-none';

export function ImageManager({ images, colors, onChange, onRemove, disabled }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [problems, setProblems] = useState([]);
  const [newColor, setNewColor] = useState('');

  const remaining = MAX_IMAGES - images.length;

  const addFiles = (fileList) => {
    const errors = [];
    const accepted = [];
    for (const file of Array.from(fileList)) {
      const problem = checkImageFile(file);
      if (problem) errors.push(problem);
      else if (accepted.length >= remaining) errors.push(`"${file.name}": ya llegaste al máximo de ${MAX_IMAGES} fotos`);
      else accepted.push(file);
    }
    setProblems(errors);
    if (accepted.length) {
      onChange([
        ...images,
        ...accepted.map((file) => ({
          uid: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file), // vista previa local hasta que se guarde
          colorKey: newColor || null,
        })),
      ]);
    }
  };

  const move = (from, to) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const setColor = (uid, colorKey) =>
    onChange(images.map((img) => (img.uid === uid ? { ...img, colorKey: colorKey || null } : img)));

  return (
    <div className="space-y-4">
      <Alert variant="error">
        {problems.length > 0 && (
          <ul className="list-disc space-y-0.5 pl-4">
            {problems.map((p) => <li key={p}>{p}</li>)}
          </ul>
        )}
      </Alert>

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, index) => (
            <li
              key={img.uid}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) move(dragIndex, index);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`rounded-xl border bg-white p-2 transition ${dragIndex === index ? 'opacity-40' : ''} ${index === 0 ? 'border-brand' : 'border-brand/15'}`}
            >
              <div className="relative aspect-[4/5] cursor-grab overflow-hidden rounded-lg bg-lavender active:cursor-grabbing">
                <img src={img.file ? img.url : imageUrl(img.url, 320)} alt={`Foto ${index + 1}`} className="size-full object-cover" draggable={false} />
                {index === 0 && (
                  <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-brand-dark">
                    <Star className="size-3" aria-hidden="true" /> Principal
                  </span>
                )}
                {img.file && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">Sin guardar</span>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(img)}
                  className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-white/90 text-danger shadow hover:bg-white"
                  aria-label={`Quitar foto ${index + 1}`}
                  title="Quitar foto"
                >
                  <X className="size-4" />
                </button>
              </div>

              <label className="mt-2 block">
                <span className="sr-only">Color de la foto {index + 1}</span>
                <select value={img.colorKey ?? ''} onChange={(e) => setColor(img.uid, e.target.value)} className={colorSelectClass}>
                  <option value="">Todos los colores</option>
                  {colors.map((c) => (
                    <option key={c.key} value={c.key}>{c.name || 'Sin nombre'}</option>
                  ))}
                </select>
              </label>

              <div className="mt-1.5 flex justify-between">
                <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} className="grid size-8 place-items-center rounded-full text-brand hover:bg-lavender disabled:opacity-30" aria-label={`Mover foto ${index + 1} a la izquierda`}>
                  <ArrowLeft className="size-4" />
                </button>
                <span className="self-center text-xs text-ink/70">{index + 1}</span>
                <button type="button" onClick={() => move(index, index + 1)} disabled={index === images.length - 1} className="grid size-8 place-items-center rounded-full text-brand hover:bg-lavender disabled:opacity-30" aria-label={`Mover foto ${index + 1} a la derecha`}>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && !disabled && (
        <div className="space-y-2">
          {colors.length > 0 && (
            <label className="flex flex-wrap items-center gap-2 text-sm text-ink/85">
              Las fotos nuevas son del color:
              <select value={newColor} onChange={(e) => setNewColor(e.target.value)} className={`${colorSelectClass} w-auto min-w-40`}>
                <option value="">Todos los colores</option>
                {colors.map((c) => (
                  <option key={c.key} value={c.key}>{c.name || 'Sin nombre'}</option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
            }}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
              dragOver ? 'border-brand bg-lavender' : 'border-brand/30 bg-lavender/30 hover:border-brand hover:bg-lavender/60'
            }`}
          >
            <ImagePlus className="size-8 text-brand" aria-hidden="true" />
            <span className="font-medium text-brand-dark">Arrastra las fotos aquí o toca para elegirlas</span>
            <span className="text-xs text-ink/70">
              JPG, PNG o WEBP · máximo 5 MB cada una · puedes agregar {remaining} más
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = ''; // permite volver a elegir el mismo archivo
            }}
          />
        </div>
      )}

      <p className="text-xs text-ink/70">
        {images.length} de {MAX_IMAGES} fotos · Arrastra las fotos o usa las flechas para ordenarlas: la primera es la principal.
        {colors.length > 0 && ' Asigna cada foto a su color para que la clienta vea cómo luce la prenda en ese color.'}
      </p>
    </div>
  );
}
