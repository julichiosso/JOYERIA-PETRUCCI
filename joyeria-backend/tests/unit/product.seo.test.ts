import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/modules/products/product.repository.js', () => ({
  productRepository: {
    findBySlug: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    slugExists: vi.fn(),
  },
}));

import { productService } from '../../src/modules/products/product.service.js';
import { productRepository } from '../../src/modules/products/product.repository.js';

describe('Product SEO & JSON-LD (productService.getBySlug)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['FRONTEND_URL'] = 'https://joyeriapetrucci.com';
  });

  it('genera fallback para metaTitle y metaDescription cuando son null', async () => {
    vi.mocked(productRepository.findBySlug).mockResolvedValue({
      id: 'prod-1',
      tenantId: 'default',
      name: 'Anillo Solitario Oro 18k',
      slug: 'anillo-solitario-oro-18k',
      description: 'Hermoso anillo con diamante brillante de alta pureza.',
      price: '150000.00' as any,
      showPrice: true,
      status: 'ACTIVE',
      variantLabel: null,
      metaTitle: null,
      metaDescription: null,
      categoryId: 'cat-2',
      category: {
        id: 'cat-2',
        name: 'Anillos',
        slug: 'anillos',
        parent: {
          id: 'cat-1',
          name: 'Joyería',
          slug: 'joyeria',
        },
      },
      images: [
  { id: 'img-1', url: 'https://cdn.example.com/img1.jpg', thumbnailUrl: null, altText: null, order: 0 },
],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await productService.getBySlug('anillo-solitario-oro-18k');

    expect(result.metaTitle).toBe('Anillo Solitario Oro 18k | Petrucci');
    expect(result.metaDescription).toBe('Hermoso anillo con diamante brillante de alta pureza.');
    expect(result.jsonLd).toBeDefined();
    expect(result.jsonLd.product['@type']).toBe('Product');
    expect(result.jsonLd.product.name).toBe('Anillo Solitario Oro 18k');
    expect(result.jsonLd.product.offers?.availability).toBe('https://schema.org/InStock');
    expect(result.jsonLd.product.offers?.price).toBe('150000.00');

    expect(result.jsonLd.breadcrumb.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Joyería',
        item: 'https://joyeriapetrucci.com/joyeria',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Anillos',
        item: 'https://joyeriapetrucci.com/joyeria/anillos',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Anillo Solitario Oro 18k',
        item: 'https://joyeriapetrucci.com/joyeria/anillos/anillo-solitario-oro-18k',
      },
    ]);
  });

  it('respeta metaTitle y metaDescription definidos por el usuario y mapea OUT_OF_STOCK a OutOfStock', async () => {
    vi.mocked(productRepository.findBySlug).mockResolvedValue({
      id: 'prod-2',
      tenantId: 'default',
      name: 'Reloj Cronógrafo',
      slug: 'reloj-cronografo',
      description: 'Reloj suizo automático',
      price: '500000.00' as any,
      showPrice: true,
      status: 'OUT_OF_STOCK',
      variantLabel: null,
      metaTitle: 'Reloj Cronógrafo Suizo - Edición Limitada',
      metaDescription: 'Comprá el Reloj Cronógrafo Suizo en Joyería Petrucci con garantía oficial.',
      categoryId: 'cat-3',
      category: {
        id: 'cat-3',
        name: 'Relojes',
        slug: 'relojes',
        parent: null,
      },
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await productService.getBySlug('reloj-cronografo');

    expect(result.metaTitle).toBe('Reloj Cronógrafo Suizo - Edición Limitada');
    expect(result.metaDescription).toBe('Comprá el Reloj Cronógrafo Suizo en Joyería Petrucci con garantía oficial.');
    expect(result.jsonLd.product.offers?.availability).toBe('https://schema.org/OutOfStock');
    expect(result.jsonLd.breadcrumb.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Relojes',
        item: 'https://joyeriapetrucci.com/relojes',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Reloj Cronógrafo',
        item: 'https://joyeriapetrucci.com/relojes/reloj-cronografo',
      },
    ]);
  });
});
