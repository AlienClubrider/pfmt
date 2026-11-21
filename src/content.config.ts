import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z
    .object({
      title: z.string(),
      summary: z.string(),
      date: z.coerce.date(),
      category: z.enum(['faith', 'tech']),
      series: z.object({ id: z.string(), title: z.string() }).optional(),
      part: z.number().int().positive().optional(),
      partsTotal: z.number().int().positive().optional(),
      tags: z.array(z.string()).default([]),
      readingMinutes: z.number().int().positive(),
      cover: z.string().optional(),
      draft: z.boolean().default(false),
    })
    .refine(p => !p.series || (p.part && p.partsTotal), { message: 'a series post needs part and partsTotal' }),
});

export const collections = { posts };
