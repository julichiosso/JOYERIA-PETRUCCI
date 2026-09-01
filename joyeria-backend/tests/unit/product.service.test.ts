import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictError, NotFoundError, BadRequestError } from '../../src/shared/errors/index.js';

vi.mock('../../src/modules/products/product.repository.js', () => ({
  productRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    slugExists: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    createVariant: vi.fn(),
    findVariantById: vi.fn(),
    findVariantByName: vi.fn(),
    skuExists: vi.fn(),
    updateVariant: vi.fn(),
    deleteVariant: vi.fn(),
    updateVariantOrder: vi.fn(),
  },
}));

import { productService, ProductNotFoundError } from '../../src/modules/products/product.service.js';
import { productRepository } from '../../src/modules/products/product.repository.js';

const mockVariant = {
  id: 'var_1',
  productId: 'prod_1',
  name: 'Talle 14',
  sku: 'AN-SOL-14',
  price: '160000.00',
  stock: 5,
  isAvailable: true,
  order: 0,
};

const mockProduct = {
  id: 'prod_1',
  name: 'Anillo Solitario',
  slug: 'anillo-solitario',
  description: 'Un anillo hermoso',
  price: '150000.00',
  showPrice: true,
  status: 'ACTIVE' as const,
  variantLabel: 'Talle',
  metaTitle: null,
  metaDescription: null,
  category: {
    id: 'cat_1',
    name: 'Anillos',
    slug: 'anillos',
    parent: { id: 'cat_0', name: 'Joyería', slug: 'joyeria' },
  },
  images: [],
  variants: [mockVariant],
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
      showPrice: true,
      categoryId: 'cat_1',
    } as any);

    expect(productRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'anillo-solitario' })
    );
  });

  it('agrega un sufijo numérico si el slug ya existe', async () => {
    vi.mocked(productRepository.slugExists)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    vi.mocked(productRepository.create).mockResolvedValue(mockProduct as any);

    await productService.create({
      name: 'Anillo Solitario',
      status: 'ACTIVE',
      showPrice: true,
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
    expect(result.variants).toHaveLength(1);
  });

  it('getBySlug oculta el precio base y el de las variantes cuando showPrice es false', async () => {
    vi.mocked(productRepository.findBySlug).mockResolvedValue({
      ...mockProduct,
      showPrice: false,
    } as any);

    const result = await productService.getBySlug('anillo-solitario');

    expect(result.price).toBeNull();
    expect(result.variants[0].price).toBeNull();
    expect(result.jsonLd.product.offers?.price).toBeUndefined();
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

describe('productService.variants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('addVariant lanza ProductNotFoundError si el producto no existe', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(null);

    await expect(
      productService.addVariant('no_existe', { name: 'Talle 16' })
    ).rejects.toThrow(ProductNotFoundError);
  });

  it('addVariant lanza ConflictError si ya existe una variante con el mismo nombre en el producto', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);
    vi.mocked(productRepository.findVariantByName).mockResolvedValue(mockVariant as any);

    await expect(
      productService.addVariant('prod_1', { name: 'Talle 14' })
    ).rejects.toThrow(ConflictError);
  });

  it('addVariant lanza ConflictError si el SKU ya existe', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);
    vi.mocked(productRepository.findVariantByName).mockResolvedValue(null);
    vi.mocked(productRepository.skuExists).mockResolvedValue(true);

    await expect(
      productService.addVariant('prod_1', { name: 'Talle 16', sku: 'SKU_EXISTENTE' })
    ).rejects.toThrow(ConflictError);
  });

  it('addVariant crea la variante con el orden calculado si no se especifica', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);
    vi.mocked(productRepository.findVariantByName).mockResolvedValue(null);
    vi.mocked(productRepository.skuExists).mockResolvedValue(false);
    vi.mocked(productRepository.createVariant).mockResolvedValue({
      ...mockVariant,
      id: 'var_2',
      name: 'Talle 16',
      order: 1,
    } as any);

    const result = await productService.addVariant('prod_1', { name: 'Talle 16' });

    expect(productRepository.createVariant).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod_1',
        name: 'Talle 16',
        order: 1,
      })
    );
    expect(result.id).toBe('var_2');
  });

  it('updateVariant lanza NotFoundError si la variante no existe', async () => {
    vi.mocked(productRepository.findVariantById).mockResolvedValue(null);

    await expect(
      productService.updateVariant('no_existe', { name: 'Nuevo Talle' })
    ).rejects.toThrow(NotFoundError);
  });

  it('updateVariant lanza ConflictError si se renombra a un nombre ya existente', async () => {
    vi.mocked(productRepository.findVariantById).mockResolvedValue(mockVariant as any);
    vi.mocked(productRepository.findVariantByName).mockResolvedValue({
      id: 'var_otra',
      name: 'Talle 16',
    } as any);

    await expect(
      productService.updateVariant('var_1', { name: 'Talle 16' })
    ).rejects.toThrow(ConflictError);
  });

  it('updateVariant actualiza los datos correctamente', async () => {
    vi.mocked(productRepository.findVariantById).mockResolvedValue(mockVariant as any);
    vi.mocked(productRepository.updateVariant).mockResolvedValue({
      ...mockVariant,
      price: '175000.00' as any,
    } as any);

    const result = await productService.updateVariant('var_1', { price: 175000 });

    expect(productRepository.updateVariant).toHaveBeenCalledWith('var_1', { price: 175000 });
    expect(result.price).toBe('175000.00');
  });

  it('deleteVariant lanza NotFoundError si no existe', async () => {
    vi.mocked(productRepository.findVariantById).mockResolvedValue(null);

    await expect(productService.deleteVariant('no_existe')).rejects.toThrow(NotFoundError);
  });

  it('deleteVariant elimina la variante si existe', async () => {
    vi.mocked(productRepository.findVariantById).mockResolvedValue(mockVariant as any);
    vi.mocked(productRepository.deleteVariant).mockResolvedValue(undefined as any);

    await productService.deleteVariant('var_1');

    expect(productRepository.deleteVariant).toHaveBeenCalledWith('var_1');
  });

  it('reorderVariants lanza BadRequestError si los IDs no coinciden', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);

    await expect(
      productService.reorderVariants('prod_1', ['id_invalido'])
    ).rejects.toThrow(BadRequestError);
  });

  it('reorderVariants actualiza el orden de cada variante', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue({
      ...mockProduct,
      variants: [
        { id: 'var_1', order: 0 },
        { id: 'var_2', order: 1 },
      ],
    } as any);

    await productService.reorderVariants('prod_1', ['var_2', 'var_1']);

    expect(productRepository.updateVariantOrder).toHaveBeenCalledWith('var_2', 0);
    expect(productRepository.updateVariantOrder).toHaveBeenCalledWith('var_1', 1);
  });
});
