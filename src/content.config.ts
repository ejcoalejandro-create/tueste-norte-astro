import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const avisos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/avisos' }),
  schema: z.object({
    titulo: z.string(),
    fecha: z.coerce.date(),
    importante: z.boolean().default(false),
  }),
});

export const collections = { avisos };