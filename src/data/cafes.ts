export interface Cafe {
  nombre: string;
  origen: string;
  notas: string;
  tueste: 'claro' | 'medio' | 'oscuro';
  precio: number; // € por paquete de 250 g
}

export const cafes: Cafe[] = [
  {
    nombre: 'Amanecer',
    origen: 'Etiopía — Yirgacheffe',
    notas: 'Jazmín, bergamota y un final largo que recuerda al té negro.',
    tueste: 'claro',
    precio: 12.5,
  },
  {
    nombre: 'Tierra Alta',
    origen: 'Colombia — Huila',
    notas: 'Caramelo, manzana roja y un cacao suave de fondo.',
    tueste: 'medio',
    precio: 10.9,
  },
  {
    nombre: 'Fondo de Casa',
    origen: 'Brasil — Cerrado',
    notas: 'Chocolate con leche, avellana tostada y cuerpo untuoso.',
    tueste: 'medio',
    precio: 9.5,
  },
  {
    nombre: 'Ceniza Volcánica',
    origen: 'Guatemala — Antigua',
    notas: 'Especias dulces, ciruela madura y un ligero toque ahumado.',
    tueste: 'oscuro',
    precio: 11.2,
  },
];