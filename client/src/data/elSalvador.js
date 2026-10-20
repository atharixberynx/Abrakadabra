/**
 * Departamentos, municipios y distritos de El Salvador (división vigente desde mayo de 2024:
 * 14 departamentos, 44 municipios y 262 distritos, que son los antiguos municipios).
 *
 * Este archivo existe IDÉNTICO en server/src/data y client/src/data: el navegador lo usa para
 * las listas del checkout y el servidor para validar. Si cambias uno, copia el otro
 * (una prueba avisa si no coinciden).
 */
export const DEPARTMENTS = [
  {
    name: 'Ahuachapán',
    municipalities: [
      { name: 'Ahuachapán Norte', districts: ['Atiquizaya', 'El Refugio', 'San Lorenzo', 'Turín'] },
      { name: 'Ahuachapán Centro', districts: ['Ahuachapán', 'Apaneca', 'Concepción de Ataco', 'Tacuba'] },
      { name: 'Ahuachapán Sur', districts: ['Guaymango', 'Jujutla', 'San Francisco Menéndez', 'San Pedro Puxtla'] },
    ],
  },
  {
    name: 'Cabañas',
    municipalities: [
      { name: 'Cabañas Este', districts: ['Sensuntepeque', 'Victoria', 'Dolores', 'Guacotecti', 'San Isidro'] },
      { name: 'Cabañas Oeste', districts: ['Ilobasco', 'Tejutepeque', 'Jutiapa', 'Cinquera'] },
    ],
  },
  {
    name: 'Chalatenango',
    municipalities: [
      { name: 'Chalatenango Norte', districts: ['La Palma', 'Citalá', 'San Ignacio'] },
      {
        name: 'Chalatenango Centro',
        districts: ['Nueva Concepción', 'Tejutla', 'La Reina', 'Agua Caliente', 'Dulce Nombre de María', 'El Paraíso', 'San Francisco Morazán', 'San Rafael', 'Santa Rita', 'San Fernando'],
      },
      {
        name: 'Chalatenango Sur',
        districts: [
          'Chalatenango', 'Arcatao', 'Azacualpa', 'Comalapa', 'Concepción Quezaltepeque', 'El Carrizal', 'La Laguna',
          'Las Vueltas', 'Nombre de Jesús', 'Nueva Trinidad', 'Ojos de Agua', 'Potonico', 'San Antonio de la Cruz',
          'San Antonio Los Ranchos', 'San Francisco Lempa', 'San Isidro Labrador', 'San José Cancasque',
          'San José Las Flores', 'San Luis del Carmen', 'San Miguel de Mercedes',
        ],
      },
    ],
  },
  {
    name: 'Cuscatlán',
    municipalities: [
      { name: 'Cuscatlán Norte', districts: ['Suchitoto', 'San José Guayabal', 'Oratorio de Concepción', 'San Bartolomé Perulapía', 'San Pedro Perulapán'] },
      {
        name: 'Cuscatlán Sur',
        districts: ['Cojutepeque', 'San Rafael Cedros', 'Candelaria', 'Monte San Juan', 'El Carmen', 'San Cristóbal', 'Santa Cruz Michapa', 'San Ramón', 'El Rosario', 'Santa Cruz Analquito', 'Tenancingo'],
      },
    ],
  },
  {
    name: 'La Libertad',
    municipalities: [
      { name: 'La Libertad Norte', districts: ['Quezaltepeque', 'San Matías', 'San Pablo Tacachico'] },
      { name: 'La Libertad Centro', districts: ['San Juan Opico', 'Ciudad Arce'] },
      { name: 'La Libertad Oeste', districts: ['Colón', 'Jayaque', 'Sacacoyo', 'Tepecoyo', 'Talnique'] },
      { name: 'La Libertad Este', districts: ['Antiguo Cuscatlán', 'Huizúcar', 'Nuevo Cuscatlán', 'San José Villanueva', 'Zaragoza'] },
      { name: 'La Libertad Costa', districts: ['Chiltiupán', 'Jicalapa', 'La Libertad', 'Tamanique', 'Teotepeque'] },
      { name: 'La Libertad Sur', districts: ['Comasagua', 'Santa Tecla'] },
    ],
  },
  {
    name: 'La Paz',
    municipalities: [
      { name: 'La Paz Oeste', districts: ['Cuyultitán', 'Olocuilta', 'San Juan Talpa', 'San Luis Talpa', 'San Pedro Masahuat', 'Tapalhuaca', 'San Francisco Chinameca'] },
      {
        name: 'La Paz Centro',
        districts: [
          'El Rosario', 'Jerusalén', 'Mercedes La Ceiba', 'Paraíso de Osorio', 'San Antonio Masahuat', 'San Emigdio',
          'San Juan Tepezontes', 'San Luis La Herradura', 'San Miguel Tepezontes', 'San Pedro Nonualco',
          'Santa María Ostuma', 'Santiago Nonualco',
        ],
      },
      { name: 'La Paz Este', districts: ['San Juan Nonualco', 'San Rafael Obrajuelo', 'Zacatecoluca'] },
    ],
  },
  {
    name: 'La Unión',
    municipalities: [
      {
        name: 'La Unión Norte',
        districts: ['Anamorós', 'Bolívar', 'Concepción de Oriente', 'El Sauce', 'Lislique', 'Nueva Esparta', 'Pasaquina', 'Polorós', 'San José La Fuente', 'Santa Rosa de Lima'],
      },
      { name: 'La Unión Sur', districts: ['Conchagua', 'El Carmen', 'Intipucá', 'La Unión', 'Meanguera del Golfo', 'San Alejo', 'Yayantique', 'Yucuaiquín'] },
    ],
  },
  {
    name: 'Morazán',
    municipalities: [
      {
        name: 'Morazán Norte',
        districts: ['Arambala', 'Cacaopera', 'Corinto', 'El Rosario', 'Joateca', 'Jocoaitique', 'Meanguera', 'Perquín', 'San Fernando', 'San Isidro', 'Torola'],
      },
      {
        name: 'Morazán Sur',
        districts: [
          'Chilanga', 'Delicias de Concepción', 'El Divisadero', 'Gualococti', 'Guatajiagua', 'Jocoro', 'Lolotiquillo',
          'Osicala', 'San Carlos', 'San Francisco Gotera', 'San Simón', 'Sensembra', 'Sociedad', 'Yamabal', 'Yoloaiquín',
        ],
      },
    ],
  },
  {
    name: 'San Miguel',
    municipalities: [
      {
        name: 'San Miguel Norte',
        districts: ['Ciudad Barrios', 'Sesori', 'Nuevo Edén de San Juan', 'San Gerardo', 'San Luis de la Reina', 'Carolina', 'San Antonio del Mosco', 'Chapeltique'],
      },
      { name: 'San Miguel Centro', districts: ['San Miguel', 'Comacarán', 'Uluazapa', 'Moncagua', 'Quelepa', 'Chirilagua'] },
      { name: 'San Miguel Oeste', districts: ['Chinameca', 'Nueva Guadalupe', 'Lolotique', 'San Jorge', 'San Rafael Oriente', 'El Tránsito'] },
    ],
  },
  {
    name: 'San Salvador',
    municipalities: [
      { name: 'San Salvador Norte', districts: ['Aguilares', 'El Paisnal', 'Guazapa'] },
      { name: 'San Salvador Oeste', districts: ['Apopa', 'Nejapa'] },
      { name: 'San Salvador Este', districts: ['Ilopango', 'San Martín', 'Soyapango', 'Tonacatepeque'] },
      { name: 'San Salvador Centro', districts: ['San Salvador', 'Mejicanos', 'Ciudad Delgado', 'Cuscatancingo', 'Ayutuxtepeque'] },
      { name: 'San Salvador Sur', districts: ['San Marcos', 'Santo Tomás', 'Santiago Texacuangos', 'Panchimalco', 'Rosario de Mora'] },
    ],
  },
  {
    name: 'San Vicente',
    municipalities: [
      { name: 'San Vicente Norte', districts: ['Apastepeque', 'Santa Clara', 'San Ildefonso', 'San Esteban Catarina', 'San Sebastián', 'San Lorenzo', 'Santo Domingo'] },
      { name: 'San Vicente Sur', districts: ['San Vicente', 'Guadalupe', 'Verapaz', 'Tepetitán', 'Tecoluca', 'San Cayetano Istepeque'] },
    ],
  },
  {
    name: 'Santa Ana',
    municipalities: [
      { name: 'Santa Ana Norte', districts: ['Masahuat', 'Metapán', 'Santa Rosa Guachipilín', 'Texistepeque'] },
      { name: 'Santa Ana Centro', districts: ['Santa Ana'] },
      { name: 'Santa Ana Este', districts: ['Coatepeque', 'El Congo'] },
      {
        name: 'Santa Ana Oeste',
        districts: ['Candelaria de la Frontera', 'Chalchuapa', 'El Porvenir', 'San Antonio Pajonal', 'San Sebastián Salitrillo', 'Santiago de la Frontera'],
      },
    ],
  },
  {
    name: 'Sonsonate',
    municipalities: [
      { name: 'Sonsonate Norte', districts: ['Juayúa', 'Nahuizalco', 'Salcoatitán', 'Santa Catarina Masahuat'] },
      { name: 'Sonsonate Centro', districts: ['Sonsonate', 'Sonzacate', 'Nahulingo', 'San Antonio del Monte', 'Santo Domingo de Guzmán'] },
      { name: 'Sonsonate Este', districts: ['Izalco', 'Armenia', 'Caluco', 'San Julián', 'Cuisnahuat', 'Santa Isabel Ishuatán'] },
      { name: 'Sonsonate Oeste', districts: ['Acajutla'] },
    ],
  },
  {
    name: 'Usulután',
    municipalities: [
      {
        name: 'Usulután Norte',
        districts: ['Santiago de María', 'Alegría', 'Berlín', 'Mercedes Umaña', 'Jucuapa', 'El Triunfo', 'Estanzuelas', 'San Buenaventura', 'Nueva Granada'],
      },
      {
        name: 'Usulután Este',
        districts: ['Usulután', 'Jucuarán', 'San Dionisio', 'Concepción Batres', 'Santa María', 'Ozatlán', 'Tecapán', 'Santa Elena', 'California', 'Ereguayquín'],
      },
      { name: 'Usulután Oeste', districts: ['Jiquilisco', 'Puerto El Triunfo', 'San Agustín', 'San Francisco Javier'] },
    ],
  },
];

/** true si el distrito pertenece a ese municipio y departamento */
export function isValidLocation(department, municipality, district) {
  const dep = DEPARTMENTS.find((d) => d.name === department);
  const mun = dep?.municipalities.find((m) => m.name === municipality);
  return Boolean(mun?.districts.includes(district));
}
