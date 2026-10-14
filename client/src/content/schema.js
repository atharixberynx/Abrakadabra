/**
 * Forma esperada de content/paginas-informativas.json.
 * La usan el script `npm run check:content` (y la publicación) para avisar con claridad
 * si al editar el archivo falta algo o se escribió mal.
 */
import { z } from 'zod';

const text = z.string().trim().min(1, 'no puede quedar vacío');
const block = z.object({ titulo: text, texto: text });

export const contentSchema = z.object({
  _instrucciones: z.array(z.string()).optional(),
  sobreNosotras: z.object({
    titulo: text,
    introduccion: text,
    historia: z.array(text).min(1),
    propuesta: text,
    diferenciadores: z.array(block).min(1),
    cierre: z.string(),
  }),
  retiroEnTienda: z.object({
    titulo: text,
    introduccion: text,
    pasos: z.array(block).min(1),
    queLlevar: z.array(text).min(1),
    nota: z.string(),
  }),
  politicaCambios: z.object({
    titulo: text,
    borrador: z.boolean(),
    introduccion: text,
    secciones: z
      .array(
        z
          .object({ titulo: text, parrafos: z.array(text).optional(), lista: z.array(text).optional() })
          .refine((s) => s.parrafos?.length || s.lista?.length, 'cada sección necesita "parrafos" o "lista"'),
      )
      .min(1),
    actualizada: z.string(),
  }),
  preguntasFrecuentes: z.object({
    titulo: text,
    introduccion: text,
    grupos: z.array(z.object({ titulo: text, preguntas: z.array(z.object({ pregunta: text, respuesta: text })).min(1) })).min(1),
  }),
  guiaTallas: z
    .object({
      titulo: text,
      porValidar: z.boolean(),
      introduccion: text,
      unidad: text,
      columnas: z.array(text).min(2),
      filas: z.array(z.array(text)).min(1),
      tallaUnica: z.string(),
      comoMedirte: z.array(z.object({ medida: text, como: text })),
      consejos: z.array(text),
    })
    .refine((g) => g.filas.every((fila) => fila.length === g.columnas.length), {
      message: 'cada fila de la tabla debe tener tantos valores como columnas',
      path: ['filas'],
    }),
});
