import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductNotFoundError } from '../../src/modules/products/product.service.js';
import { BadRequestError } from '../../src/shared/errors/index.js';

vi.mock('../../src/modules/inquiries/inquiry.repository.js', () => ({
  inquiryRepository: {
    create: vi.fn(),
    list: vi.fn(),
    countTotal: vi.fn(),
    getTopProducts: vi.fn(),
  },
}));

vi.mock('../../src/modules/products/product.repository.js', () => ({
  productRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('../../src/modules/store-config/store-config.service.js', () => ({
  storeConfigService: {
    buildWhatsappLink: vi.fn(),
  },
}));

import { inquiryService } from '../../src/modules/inquiries/inquiry.service.js';
import { inquiryRepository } from '../../src/modules/inquiries/inquiry.repository.js';
import { productRepository } from '../../src/modules/products/product.repository.js';
import { storeConfigService } from '../../src/modules/store-config/store-config.service.js';

const mockProduct = {
  id: 'prod_1',
  name: 'Anillo Solitario',
  slug: 'anillo-solitario',
  price: '150000.00',
  showPrice: true,
  status: 'ACTIVE',
  category: {
    slug: 'anillos',
    parent: { slug: 'joyeria' },
  },
  variants: [
    {
      id: 'var_1',
      name: 'Talle 14',
      price: '160000.00',
      isAvailable: true,
    },
    {
      id: 'var_2',
      name: 'Talle 16 (Sin precio propio)',
      price: null,
      isAvailable: true,
    },
    {
      id: 'var_unavailable',
      name: 'Talle 18 (Agotado)',
      price: '160000.00',
      isAvailable: false,
    },
  ],
};

describe('inquiryService.createInquiry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['FRONTEND_URL'] = 'https://petrucci.com';
    vi.mocked(storeConfigService.buildWhatsappLink).mockResolvedValue(
      'https://wa.me/5493406419495?text=Hola'
    );
    vi.mocked(inquiryRepository.create).mockResolvedValue({
      id: 'inq_1',
      tenantId: 'default',
      productId: 'prod_1',
      variantId: null,
      productName: 'Anillo Solitario',
      variantName: null,
      priceSnapshot: '150000.00' as any,
      createdAt: new Date(),
    });
  });

  it('lanza ProductNotFoundError si el producto no existe o es DRAFT', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(null);

    await expect(
      inquiryService.createInquiry({ productId: 'no_existe' })
    ).rejects.toThrow(ProductNotFoundError);

    vi.mocked(productRepository.findById).mockResolvedValue({
      ...mockProduct,
      status: 'DRAFT',
    } as any);

    await expect(
      inquiryService.createInquiry({ productId: 'prod_1' })
    ).rejects.toThrow(ProductNotFoundError);
  });

  it('lanza BadRequestError si la variante no existe en el producto o está deshabilitada', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);

    await expect(
      inquiryService.createInquiry({ productId: 'prod_1', variantId: 'var_inexistente' })
    ).rejects.toThrow(BadRequestError);

    await expect(
      inquiryService.createInquiry({ productId: 'prod_1', variantId: 'var_unavailable' })
    ).rejects.toThrow(BadRequestError);
  });

  it('guarda priceSnapshot como null cuando showPrice es false', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue({
      ...mockProduct,
      showPrice: false,
    } as any);

    const result = await inquiryService.createInquiry({ productId: 'prod_1' });

    expect(inquiryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod_1',
        variantId: null,
        priceSnapshot: null,
      })
    );
    expect(result.inquiryId).toBe('inq_1');
    expect(result.whatsappUrl).toBe('https://wa.me/5493406419495?text=Hola');
  });

  it('guarda el precio de la variante cuando showPrice es true y tiene precio propio', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);

    await inquiryService.createInquiry({ productId: 'prod_1', variantId: 'var_1' });

    expect(inquiryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod_1',
        variantId: 'var_1',
        variantName: 'Talle 14',
        priceSnapshot: '160000.00',
      })
    );
    expect(storeConfigService.buildWhatsappLink).toHaveBeenCalledWith(
      expect.objectContaining({
        productName: 'Anillo Solitario (Talle 14)',
        price: '160000.00',
      })
    );
  });

  it('guarda el precio base cuando la variante no tiene precio propio', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);

    await inquiryService.createInquiry({ productId: 'prod_1', variantId: 'var_2' });

    expect(inquiryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod_1',
        variantId: 'var_2',
        priceSnapshot: '150000.00',
      })
    );
  });
});

describe('inquiryService.listInquiries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve la lista paginada de consultas', async () => {
    vi.mocked(inquiryRepository.list).mockResolvedValue({
      items: [
        {
          id: 'inq_1',
          tenantId: 'default',
          productId: 'prod_1',
          variantId: null,
          productName: 'Anillo Solitario',
          variantName: null,
          priceSnapshot: null,
          createdAt: new Date(),
        },
      ],
      total: 10,
    });

    const result = await inquiryService.listInquiries({ page: 1, limit: 10 });

    expect(inquiryRepository.list).toHaveBeenCalledWith({
      productId: undefined,
      skip: 0,
      take: 10,
    });
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 10,
      totalPages: 1,
    });
    expect(result.items).toHaveLength(1);
  });
});

describe('inquiryService.getStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve total de consultas y ranking de productos', async () => {
    vi.mocked(inquiryRepository.countTotal).mockResolvedValue(25);
    vi.mocked(inquiryRepository.getTopProducts).mockResolvedValue([
      { productId: 'prod_1', productName: 'Anillo Solitario', inquiryCount: 15 },
      { productId: 'prod_2', productName: 'Aros de Plata', inquiryCount: 10 },
    ]);

    const result = await inquiryService.getStats();

    expect(result.totalInquiries).toBe(25);
    expect(result.topProducts).toHaveLength(2);
  });
});
