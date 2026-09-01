import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError } from '../../src/shared/errors/index.js';

vi.mock('../../src/modules/store-config/store-config.repository.js', () => ({
  storeConfigRepository: {
    find: vi.fn(),
    update: vi.fn(),
  },
}));

import { storeConfigService } from '../../src/modules/store-config/store-config.service.js';
import { storeConfigRepository } from '../../src/modules/store-config/store-config.repository.js';

const mockConfig = {
  id: 'config_1',
  tenantId: 'default',
  storeName: 'Joyería Petrucci',
  whatsappNumber: '5493406419495',
  whatsappMessageTemplate: null,
  instagramUrl: null,
  facebookUrl: null,
  address: null,
  businessHours: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('storeConfigService.get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lanza NotFoundError si la config no fue inicializada', async () => {
    vi.mocked(storeConfigRepository.find).mockResolvedValue(null);
    await expect(storeConfigService.get()).rejects.toThrow(NotFoundError);
  });

  it('devuelve la config si existe', async () => {
    vi.mocked(storeConfigRepository.find).mockResolvedValue(mockConfig as any);
    const result = await storeConfigService.get();
    expect(result.storeName).toBe('Joyería Petrucci');
  });
});

describe('storeConfigService.update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lanza NotFoundError si la config no fue inicializada', async () => {
    vi.mocked(storeConfigRepository.find).mockResolvedValue(null);
    await expect(
      storeConfigService.update({ storeName: 'Nuevo nombre' })
    ).rejects.toThrow(NotFoundError);
  });

  it('actualiza la config si existe', async () => {
    vi.mocked(storeConfigRepository.find).mockResolvedValue(mockConfig as any);
    vi.mocked(storeConfigRepository.update).mockResolvedValue({
      ...mockConfig,
      storeName: 'Nuevo nombre',
    } as any);

    const result = await storeConfigService.update({ storeName: 'Nuevo nombre' });

    expect(result.storeName).toBe('Nuevo nombre');
    expect(storeConfigRepository.update).toHaveBeenCalledWith({ storeName: 'Nuevo nombre' });
  });
});

describe('storeConfigService.buildWhatsappLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('usa el template default si no hay uno configurado', async () => {
    vi.mocked(storeConfigRepository.find).mockResolvedValue(mockConfig as any);

    const link = await storeConfigService.buildWhatsappLink({
      productName: 'Anillo Solitario',
      price: '150000',
      productUrl: 'https://petrucci.com/joyeria/anillos/anillo-solitario',
    });

    expect(link).toContain('https://wa.me/5493406419495?text=');
    expect(decodeURIComponent(link.split('text=')[1])).toContain('Anillo Solitario');
    expect(decodeURIComponent(link.split('text=')[1])).toContain('150000');
    expect(decodeURIComponent(link.split('text=')[1])).toContain(
      'https://petrucci.com/joyeria/anillos/anillo-solitario'
    );
  });

  it('usa el template personalizado si está configurado', async () => {
    vi.mocked(storeConfigRepository.find).mockResolvedValue({
      ...mockConfig,
      whatsappMessageTemplate: 'Quiero comprar {productName} YA! Precio: {price}',
    } as any);

    const link = await storeConfigService.buildWhatsappLink({
      productName: 'Aro de Plata',
      price: '8000',
      productUrl: 'https://petrucci.com/joyeria/aritos/aro-de-plata',
    });

    const decodedMessage = decodeURIComponent(link.split('text=')[1]);
    expect(decodedMessage).toBe('Quiero comprar Aro de Plata YA! Precio: 8000');
  });

  it('usa "Consultar" como fallback si el precio es null', async () => {
    vi.mocked(storeConfigRepository.find).mockResolvedValue(mockConfig as any);

    const link = await storeConfigService.buildWhatsappLink({
      productName: 'Producto Sin Precio',
      price: null,
      productUrl: 'https://petrucci.com/joyeria/algo',
    });

    const decodedMessage = decodeURIComponent(link.split('text=')[1]);
    expect(decodedMessage).toContain('Consultar');
  });

  it('codifica correctamente caracteres especiales en la URL', async () => {
    vi.mocked(storeConfigRepository.find).mockResolvedValue(mockConfig as any);

    const link = await storeConfigService.buildWhatsappLink({
      productName: 'Anillo & Cadena',
      price: '5000',
      productUrl: 'https://petrucci.com/joyeria/anillo-cadena',
    });

    // El link no debería tener espacios ni "&" sueltos que rompan la URL
    expect(link).not.toMatch(/\s/);
  });
});