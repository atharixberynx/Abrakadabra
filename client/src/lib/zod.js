/**
 * Zod configurado para el navegador.
 * `jitless`: Zod no intenta compilar validaciones con eval/new Function, que la política de
 * seguridad de contenido (CSP de vercel.json) bloquea. Importa `z` desde aquí, no desde 'zod'.
 */
import { z } from 'zod';

z.config({ jitless: true });

export { z };
