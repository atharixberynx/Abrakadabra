import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEPARTMENTS, isValidLocation } from '../src/data/elSalvador.js';

describe('Departamentos, municipios y distritos de El Salvador', () => {
  it('tiene 14 departamentos, 44 municipios y 262 distritos', () => {
    const municipalities = DEPARTMENTS.flatMap((d) => d.municipalities);
    expect(DEPARTMENTS).toHaveLength(14);
    expect(municipalities).toHaveLength(44);
    expect(municipalities.flatMap((m) => m.districts)).toHaveLength(262);
  });

  it('valida que el distrito pertenezca al municipio y al departamento', () => {
    expect(isValidLocation('San Salvador', 'San Salvador Centro', 'Mejicanos')).toBe(true);
    expect(isValidLocation('San Salvador', 'San Salvador Este', 'Mejicanos')).toBe(false);
    expect(isValidLocation('La Libertad', 'San Salvador Centro', 'Mejicanos')).toBe(false);
  });

  it('el archivo del navegador es idéntico al del servidor', () => {
    const server = readFileSync(new URL('../src/data/elSalvador.js', import.meta.url), 'utf8');
    const client = readFileSync(new URL('../../client/src/data/elSalvador.js', import.meta.url), 'utf8');
    expect(client).toBe(server);
  });
});
