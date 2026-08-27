import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/modules/products/product.repository.js', () => ({
  productRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    slugExists: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  },
}));

import { productService, ProductNotFoundError } from '../../src/modules/products/product.service.js';
import { productRepository } from '../../src/modules/products/product.repository.js';

const mockProduct = {
  id: 'prod_1',
  name: 'Anillo Solitario',
  slug: 'anillo-solitario',
  description: 'Un anillo hermoso',
  price: '150000.00',
  status: 'ACTIVE' as const,
  variantLabel: null,
  metaTitle: null,
  metaDescription: null,
  category: {
    id: 'cat_1',
    name: 'Anillos',
    slug: 'anillos',
    parent: { id: 'cat_0', name: 'Joyería', slug: 'joyeria' },
  },
  images: [],
};

describe('productService.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('genera el slug a partir del nombre cuando no hay colisión', async () => {
    vi.mocked(productRepository.slugExists).mockResolvedValue(false);
    vi.mocked(productRepository.create).mockResolvedValue(mockProduct as any);

    await productService.create({
      name: 'Anillo Solitario',
      status: 'ACTIVE',
      categoryId: 'cat_1',
    } as any);

    expect(productRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'anillo-solitario' })
    );
  });

  it('agrega un sufijo numérico si el slug ya existe', async () => {
    vi.mocked(productRepository.slugExists)
      .mockResolvedValueOnce(true) // "anillo-solitario" ya existe
      .mockResolvedValueOnce(false); // "anillo-solitario-2" está libre

    vi.mocked(productRepository.create).mockResolvedValue(mockProduct as any);

    await productService.create({
      name: 'Anillo Solitario',
      status: 'ACTIVE',
      categoryId: 'cat_1',
    } as any);

    expect(productRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'anillo-solitario-2' })
    );
  });
});

describe('productService.update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lanza ProductNotFoundError si el producto no existe', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(null);

    await expect(
      productService.update('no_existe', { name: 'Nuevo nombre' } as any)
    ).rejects.toThrow(ProductNotFoundError);
  });

  it('no regenera el slug si no se envía un nuevo name', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);
    vi.mocked(productRepository.update).mockResolvedValue(mockProduct as any);

    await productService.update('prod_1', { price: 200000 } as any);

    expect(productRepository.slugExists).not.toHaveBeenCalled();
    expect(productRepository.update).toHaveBeenCalledWith(
      'prod_1',
      expect.not.objectContaining({ slug: expect.anything() })
    );
  });

  it('regenera el slug si se envía un nuevo name', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);
    vi.mocked(productRepository.slugExists).mockResolvedValue(false);
    vi.mocked(productRepository.update).mockResolvedValue(mockProduct as any);

    await productService.update('prod_1', { name: 'Anillo Doble' } as any);

    expect(productRepository.update).toHaveBeenCalledWith(
      'prod_1',
      expect.objectContaining({ slug: 'anillo-doble' })
    );
  });
});

describe('productService.getById / getBySlug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getById lanza ProductNotFoundError si no existe', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(null);
    await expect(productService.getById('no_existe')).rejects.toThrow(ProductNotFoundError);
  });

  it('getBySlug lanza ProductNotFoundError si no existe', async () => {
    vi.mocked(productRepository.findBySlug).mockResolvedValue(null);
    await expect(productService.getBySlug('no-existe')).rejects.toThrow(ProductNotFoundError);
  });

  it('getBySlug devuelve el producto con metaTitle/metaDescription resueltos', async () => {
    vi.mocked(productRepository.findBySlug).mockResolvedValue(mockProduct as any);
    const result = await productService.getBySlug('anillo-solitario');

    expect(result.metaTitle).toBeTruthy();
    expect(result.metaDescription).toBeTruthy();
    expect(result.jsonLd).toBeDefined();
  });
});

describe('productService.delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lanza ProductNotFoundError si el producto no existe', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(null);
    await expect(productService.delete('no_existe')).rejects.toThrow(ProductNotFoundError);
  });

  it('borra el producto si existe', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);
    vi.mocked(productRepository.delete).mockResolvedValue(undefined);

    await productService.delete('prod_1');

    expect(productRepository.delete).toHaveBeenCalledWith('prod_1');
  });
});

describe('productService.list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calcula correctamente skip/take y devuelve paginación', async () => {
    vi.mocked(productRepository.list).mockResolvedValue({
      items: [mockProduct],
      total: 45,
    } as any);

    const result = await productService.list({ page: 3, limit: 20 });

    expect(productRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 40, take: 20 })
    );
    expect(result.pagination).toEqual({
      page: 3,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
  });
});