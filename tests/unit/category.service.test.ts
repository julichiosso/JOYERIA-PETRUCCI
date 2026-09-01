import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BadRequestError,
  ForbiddenError,
  ConflictError,
  NotFoundError,
} from '../../src/shared/errors/index.js';

vi.mock('../../src/modules/categories/category.repository.js', () => ({
  categoryRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findParentForValidation: vi.fn(),
    findNextAvailableSlug: vi.fn(),
    findAllFlat: vi.fn(),
    findActiveTree: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countProducts: vi.fn(),
    countChildren: vi.fn(),
  },
}));

import { categoryService } from '../../src/modules/categories/category.service.js';
import { categoryRepository } from '../../src/modules/categories/category.repository.js';

const mockRootCategory = {
  id: 'cat_root',
  tenantId: 'default',
  name: 'Joyería',
  slug: 'joyeria',
  description: 'Categoría principal',
  parentId: null,
  isProtected: false,
  isActive: true,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSubCategory = {
  id: 'cat_sub',
  tenantId: 'default',
  name: 'Anillos',
  slug: 'anillos',
  description: null,
  parentId: 'cat_root',
  isProtected: false,
  isActive: true,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('categoryService.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crea una categoría raíz con slug generado', async () => {
    vi.mocked(categoryRepository.findNextAvailableSlug).mockResolvedValue('joyeria');
    vi.mocked(categoryRepository.create).mockResolvedValue(mockRootCategory as any);

    const result = await categoryService.create({ name: 'Joyería' });

    expect(categoryRepository.findNextAvailableSlug).toHaveBeenCalledWith('joyeria');
    expect(categoryRepository.create).toHaveBeenCalledWith({
      name: 'Joyería',
      slug: 'joyeria',
    });
    expect(result.id).toBe('cat_root');
  });

  it('crea una subcategoría válida bajo un padre de primer nivel', async () => {
    vi.mocked(categoryRepository.findParentForValidation).mockResolvedValue({
      id: 'cat_root',
      parentId: null,
    } as any);
    vi.mocked(categoryRepository.findNextAvailableSlug).mockResolvedValue('anillos');
    vi.mocked(categoryRepository.create).mockResolvedValue(mockSubCategory as any);

    const result = await categoryService.create({
      name: 'Anillos',
      parentId: 'cat_root',
    });

    expect(categoryRepository.findParentForValidation).toHaveBeenCalledWith('cat_root');
    expect(result.id).toBe('cat_sub');
  });

  it('lanza NotFoundError si el parentId no existe', async () => {
    vi.mocked(categoryRepository.findParentForValidation).mockResolvedValue(null);

    await expect(
      categoryService.create({ name: 'Anillos', parentId: 'inexistente' })
    ).rejects.toThrow(NotFoundError);
  });

  it('lanza BadRequestError si se intenta crear un tercer nivel de profundidad', async () => {
    vi.mocked(categoryRepository.findParentForValidation).mockResolvedValue({
      id: 'cat_sub',
      parentId: 'cat_root', // El padre ya es hijo de otro
    } as any);

    await expect(
      categoryService.create({ name: 'Anillos de Oro', parentId: 'cat_sub' })
    ).rejects.toThrow(BadRequestError);
  });
});

describe('categoryService.findById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve la categoría si existe', async () => {
    vi.mocked(categoryRepository.findById).mockResolvedValue(mockRootCategory as any);

    const result = await categoryService.findById('cat_root');
    expect(result.name).toBe('Joyería');
  });

  it('lanza NotFoundError si no existe', async () => {
    vi.mocked(categoryRepository.findById).mockResolvedValue(null);

    await expect(categoryService.findById('inexistente')).rejects.toThrow(NotFoundError);
  });
});

describe('categoryService.update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('actualiza la categoría si existe', async () => {
    vi.mocked(categoryRepository.findById).mockResolvedValue(mockRootCategory as any);
    vi.mocked(categoryRepository.update).mockResolvedValue({
      ...mockRootCategory,
      name: 'Alta Joyería',
    } as any);

    const result = await categoryService.update('cat_root', { name: 'Alta Joyería' });
    expect(result.name).toBe('Alta Joyería');
    expect(categoryRepository.update).toHaveBeenCalledWith('cat_root', { name: 'Alta Joyería' });
  });

  it('lanza NotFoundError si no existe', async () => {
    vi.mocked(categoryRepository.findById).mockResolvedValue(null);

    await expect(
      categoryService.update('inexistente', { name: 'Alta Joyería' })
    ).rejects.toThrow(NotFoundError);
  });
});

describe('categoryService.delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lanza NotFoundError si no existe', async () => {
    vi.mocked(categoryRepository.findById).mockResolvedValue(null);
    await expect(categoryService.delete('inexistente')).rejects.toThrow(NotFoundError);
  });

  it('lanza ForbiddenError si la categoría está protegida', async () => {
    vi.mocked(categoryRepository.findById).mockResolvedValue({
      ...mockRootCategory,
      isProtected: true,
    } as any);

    await expect(categoryService.delete('cat_root')).rejects.toThrow(ForbiddenError);
  });

  it('lanza ConflictError si tiene productos asociados', async () => {
    vi.mocked(categoryRepository.findById).mockResolvedValue(mockRootCategory as any);
    vi.mocked(categoryRepository.countProducts).mockResolvedValue(5);

    await expect(categoryService.delete('cat_root')).rejects.toThrow(ConflictError);
  });

  it('lanza ConflictError si tiene subcategorías asociadas', async () => {
    vi.mocked(categoryRepository.findById).mockResolvedValue(mockRootCategory as any);
    vi.mocked(categoryRepository.countProducts).mockResolvedValue(0);
    vi.mocked(categoryRepository.countChildren).mockResolvedValue(2);

    await expect(categoryService.delete('cat_root')).rejects.toThrow(ConflictError);
  });

  it('elimina la categoría si no tiene impedimentos', async () => {
    vi.mocked(categoryRepository.findById).mockResolvedValue(mockRootCategory as any);
    vi.mocked(categoryRepository.countProducts).mockResolvedValue(0);
    vi.mocked(categoryRepository.countChildren).mockResolvedValue(0);
    vi.mocked(categoryRepository.delete).mockResolvedValue(undefined as any);

    await categoryService.delete('cat_root');

    expect(categoryRepository.delete).toHaveBeenCalledWith('cat_root');
  });
});

describe('categoryService.findActiveTree & findAllFlat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('obtiene el árbol activo', async () => {
    vi.mocked(categoryRepository.findActiveTree).mockResolvedValue([mockRootCategory] as any);
    const result = await categoryService.findActiveTree();
    expect(result).toHaveLength(1);
  });

  it('obtiene lista plana para admin', async () => {
    vi.mocked(categoryRepository.findAllFlat).mockResolvedValue([
      mockRootCategory,
      mockSubCategory,
    ] as any);
    const result = await categoryService.findAllFlat();
    expect(result).toHaveLength(2);
  });
});
