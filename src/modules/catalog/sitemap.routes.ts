// src/modules/catalog/sitemap.routes.ts
//
// GET /catalog/sitemap.xml
//
// Genera un sitemap.xml estandar (https://www.sitemaps.org/protocol.html)
// con todas las URLs publicas del catalogo:
//   - Categorias raiz y subcategorias activas  (isActive: true)
//   - Productos ACTIVE y OUT_OF_STOCK          (DRAFT excluido siempre)
//
// Requiere FRONTEND_URL en el entorno (ej. https://petrucci.com).
//
// Criterio OUT_OF_STOCK -> incluir en sitemap:
//   El producto tiene pagina publica (el controller lo devuelve) y el JSON-LD
//   ya informa OutOfStock. De-indexar y re-indexar cuando vuelva el stock
//   dania la autoridad de la URL. Se mantiene en el sitemap.
//
// Sin dependencias nuevas: generacion de XML a mano (strings + join).

import type { FastifyInstance } from 'fastify';
import { prisma } from '../../infra/prisma.js';

// ---------------------------------------------------------------------------
// Helpers XML
// ---------------------------------------------------------------------------

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toW3CDate(date: Date): string {
  // Formato W3C datetime requerido por el protocolo de sitemap
  return date.toISOString().split('T')[0]!;
}

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
}

function buildXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${escapeXml(e.loc)}</loc>\n    <lastmod>${e.lastmod}</lastmod>${
          e.changefreq ? `\n    <changefreq>${e.changefreq}</changefreq>` : ''
        }${e.priority ? `\n    <priority>${e.priority}</priority>` : ''}\n  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchSitemapData() {
  const [categories, products] = await Promise.all([
    // Categorias activas con su padre para construir la URL jerarquica
    prisma.category.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        updatedAt: true,
        parent: { select: { slug: true } },
      },
      orderBy: { sortOrder: 'asc' },
    }),

    // Productos publicamente visibles: ACTIVE + OUT_OF_STOCK
    // DRAFT nunca se expone en el catalogo ni en el sitemap.
    prisma.product.findMany({
      where: {
        status: { in: ['ACTIVE', 'OUT_OF_STOCK'] },
      },
      select: {
        slug: true,
        updatedAt: true,
        category: {
          select: {
            slug: true,
            parent: { select: { slug: true } },
          },
        },
      },
    }),
  ]);

  return { categories, products };
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function sitemapRoutes(app: FastifyInstance) {
  app.get('/sitemap.xml', async (_request, reply) => {
    const baseUrl = (process.env['FRONTEND_URL'] ?? '').replace(/\/$/, '');

    const { categories, products } = await fetchSitemapData();

    const entries: SitemapEntry[] = [];

    // - Categorias -------------------------------------------------------
    for (const cat of categories) {
      const path = cat.parent
        ? `/${cat.parent.slug}/${cat.slug}`
        : `/${cat.slug}`;

      entries.push({
        loc: `${baseUrl}${path}`,
        lastmod: toW3CDate(cat.updatedAt),
        changefreq: 'weekly',
        priority: cat.parent ? '0.7' : '0.8',
      });
    }

    // - Productos --------------------------------------------------------
    for (const product of products) {
      const parentSlug   = product.category?.parent?.slug ?? null;
      const categorySlug = product.category?.slug ?? '';

      const path = parentSlug
        ? `/${parentSlug}/${categorySlug}/${product.slug}`
        : `/${categorySlug}/${product.slug}`;

      entries.push({
        loc: `${baseUrl}${path}`,
        lastmod: toW3CDate(product.updatedAt),
        changefreq: 'monthly',
        priority: '0.6',
      });
    }

    return reply
      .header('Content-Type', 'application/xml; charset=utf-8')
      // Cache 1 hora en edge/CDN, revalidar en fondo.
      // Ajustar segun frecuencia de actualizaciones del catalogo.
      .header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
      .send(buildXml(entries));
  });
}
