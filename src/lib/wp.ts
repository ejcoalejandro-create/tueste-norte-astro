// Acceso centralizado a la API REST de WordPress.
// Las páginas NO tocan title.rendered ni _embedded: usan estos tipos y funciones.

const API = import.meta.env.WP_API_URL;

/* ---------- Tipos que usa el resto del proyecto ---------- */

export type Tueste = 'claro' | 'medio' | 'oscuro';

export interface Cafe {
  id: number;
  slug: string;
  nombre: string;
  extracto: string;
  descripcionHtml: string;
  imagen: string | null;
  origen: string;
  notas: string;
  tueste: Tueste | null;
  precio: number | null;
  tuesteSemana: boolean;
}

export interface Post {
  id: number;
  slug: string;
  titulo: string;
  extracto: string;
  contenidoHtml: string;
  fecha: Date;
  imagen: { url: string; alt: string } | null;
}

/* ---------- Tipos crudos: lo que devuelve WordPress ---------- */

interface WPCafe {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  ficha: {
    origen: string | null;
    notas_cata: string | null;
    nivel_tueste: string | null;
    precio: number | null;
    imagen: string | null;
  } | null;
  tueste_semana?: boolean;
}

interface WPMedia {
  source_url: string;
  alt_text: string;
  media_details?: { sizes?: { large?: { source_url: string } } };
}

interface WPPost {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: { 'wp:featuredmedia'?: WPMedia[] };
}

/* ---------- Utilidades internas ---------- */

// WordPress devuelve los títulos con entidades HTML (&#8217;, &amp;...).
// Aquí los convertimos en texto normal para que las páginas no se preocupen.
function textoPlano(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

async function pedir<T>(ruta: string): Promise<{ datos: T; paginas: number }> {
  if (!API) {
    throw new Error('Falta WP_API_URL. Copia .env.example a .env y reinicia el servidor.');
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API}${ruta}`);
  } catch {
    throw new Error(`No se pudo conectar con WordPress (${API})`);
  }

  if (!respuesta.ok) {
    throw new Error(`WordPress respondió ${respuesta.status} al pedir ${ruta}`);
  }

  return {
    datos: (await respuesta.json()) as T,
    paginas: Number(respuesta.headers.get('X-WP-TotalPages') ?? 1),
  };
}

// Pide TODAS las páginas de un listado (el patrón del ejercicio 2).
async function pedirTodo<T>(ruta: string): Promise<T[]> {
  const sep = ruta.includes('?') ? '&' : '?';
  const primera = await pedir<T[]>(`${ruta}${sep}per_page=100&page=1`);
  const todos = [...primera.datos];

  for (let pagina = 2; pagina <= primera.paginas; pagina++) {
    const siguiente = await pedir<T[]>(`${ruta}${sep}per_page=100&page=${pagina}`);
    todos.push(...siguiente.datos);
  }
  return todos;
}

const NIVELES: Tueste[] = ['claro', 'medio', 'oscuro'];

function aCafe(c: WPCafe): Cafe {
  const f = c.ficha;
  return {
    id: c.id,
    slug: c.slug,
    nombre: textoPlano(c.title.rendered),
    extracto: textoPlano(c.excerpt.rendered),
    descripcionHtml: c.content.rendered,
    imagen: f?.imagen ?? null,
    origen: f?.origen ?? '',
    notas: f?.notas_cata ?? '',
    tueste: NIVELES.find((n) => n === f?.nivel_tueste) ?? null,
    precio: typeof f?.precio === 'number' ? f.precio : null,
    tuesteSemana: c.tueste_semana === true,
  };
}

function aPost(p: WPPost): Post {
  const media = p._embedded?.['wp:featuredmedia']?.[0];
  return {
    id: p.id,
    slug: p.slug,
    titulo: textoPlano(p.title.rendered),
    extracto: textoPlano(p.excerpt.rendered),
    contenidoHtml: p.content.rendered,
    fecha: new Date(p.date),
    imagen: media?.source_url
      ? {
          url: media.media_details?.sizes?.large?.source_url ?? media.source_url,
          alt: media.alt_text || textoPlano(p.title.rendered),
        }
      : null,
  };
}

/* ---------- Funciones públicas ---------- */

export async function getCafes(): Promise<Cafe[]> {
  const datos = await pedirTodo<WPCafe>('/wp/v2/cafes');
  return datos.map(aCafe);
}

export async function getCafe(slug: string): Promise<Cafe | null> {
  const { datos } = await pedir<WPCafe[]>(`/wp/v2/cafes?slug=${encodeURIComponent(slug)}`);
  return datos.length > 0 ? aCafe(datos[0]) : null;
}

export async function getPosts(): Promise<Post[]> {
  const datos = await pedirTodo<WPPost>('/wp/v2/posts?_embed');
  return datos.map(aPost);
}

export async function getPost(slug: string): Promise<Post | null> {
  const { datos } = await pedir<WPPost[]>(`/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed`);
  return datos.length > 0 ? aPost(datos[0]) : null;
}