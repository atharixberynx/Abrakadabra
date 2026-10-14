/**
 * Revisa que src/content/paginas-informativas.json esté bien escrito.
 *
 *   npm run check:content
 *
 * También corre automáticamente antes de `npm run build` (publicación), para que un
 * error al editar el archivo no llegue a la tienda.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { contentSchema } from '../src/content/schema.js';

const FILE = fileURLToPath(new URL('../src/content/paginas-informativas.json', import.meta.url));
const raw = await readFile(FILE, 'utf8');

let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  // Ubica la línea del error para que sea fácil corregirlo
  const position = Number(err.message.match(/position (\d+)/)?.[1]);
  const line = Number.isFinite(position) ? raw.slice(0, position).split('\n').length : null;
  console.error('\n❌ El archivo de contenido tiene un error de escritura' + (line ? ` cerca de la línea ${line}` : '') + '.');
  console.error('   Revisa que no falte una coma, una comilla o un corchete.\n');
  process.exit(1);
}

const result = contentSchema.safeParse(data);
if (!result.success) {
  console.error('\n❌ Al archivo de contenido le falta algo o tiene un valor incorrecto:\n');
  for (const issue of result.error.issues) {
    console.error(`   • ${issue.path.join(' › ') || '(raíz)'}: ${issue.message}`);
  }
  console.error('');
  process.exit(1);
}

console.log('✔ El contenido de las páginas informativas está bien escrito.');
