import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestError, NotFoundError } from '../../src/shared/errors/index.js';

vi.mock('../../src/modules/products/product.repository.js', () => ({
  productRepository: {
    findById: vi.fn(),
    createImage: vi.fn(),
    findImageById: vi.fn(),
    deleteImage: vi.fn(),
    updateImageAltText: vi.fn(),
    updateImageOrder: vi.fn(),
  },
}));

vi.mock('../../src/infra/storage/storage.service.js', () => ({
  uploadFile: vi.fn().mockResolvedValue('fake/key/path.webp'),
  deleteFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('file-type', () => ({
  fileTypeFromBuffer: vi.fn(),
}));

vi.mock('sharp', () => {
  const mockSharpInstance = {
    rotate: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue({
      data: Buffer.from('fake-processed-image'),
      info: { width: 800, height: 600 },
    }),
  };
  return { default: vi.fn(() => mockSharpInstance) };
});

import { mediaService } from '../../src/modules/media/media.service.js';
import { productRepository } from '../../src/modules/products/product.repository.js';
import { fileTypeFromBuffer } from 'file-type';

const mockProduct = {
  id: 'prod_1',
  name: 'Anillo Test',
  images: [
    { id: 'img_1', order: 0 },
    { id: 'img_2', order: 1 },
  ],
} as any;

const validImageFile = {
  buffer: Buffer.from('fake-image-data'),
  filename: 'foto.jpg',
  mimetype: 'image/jpeg',
};

describe('mediaService.uploadProductImages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lanza BadRequestError si no se envía ningún archivo', async () => {
    await expect(
      mediaService.uploadProductImages({ productId: 'prod_1', files: [], altTexts: [] })
    ).rejects.toThrow(BadRequestError);
  });

  it('lanza BadRequestError si se envían más de 10 archivos', async () => {
    const manyFiles = Array(11).fill(validImageFile);
    await expect(
      mediaService.uploadProductImages({
        productId: 'prod_1',
        files: manyFiles,
        altTexts: [],
      })
    ).rejects.toThrow(BadRequestError);
  });

  it('lanza NotFoundError si el producto no existe', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(null);

    await expect(
      mediaService.uploadProductImages({
        productId: 'no_existe',
        files: [validImageFile],
        altTexts: [undefined],
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('lanza BadRequestError si el archivo no es una imagen válida', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct);
    vi.mocked(fileTypeFromBuffer).mockResolvedValue(undefined);

    await expect(
      mediaService.uploadProductImages({
        productId: 'prod_1',
        files: [validImageFile],
        altTexts: [undefined],
      })
    ).rejects.toThrow(BadRequestError);
  });

  it('lanza BadRequestError si el mime detectado no está permitido', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct);
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({ mime: 'application/pdf', ext: 'pdf' } as any);

    await expect(
      mediaService.uploadProductImages({
        productId: 'prod_1',
        files: [validImageFile],
        altTexts: [undefined],
      })
    ).rejects.toThrow(BadRequestError);
  });

  it('lanza BadRequestError si un archivo supera el tamaño máximo', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct);

    const hugeFile = {
      ...validImageFile,
      buffer: Buffer.alloc(11 * 1024 * 1024), // 11MB, supera el límite de 10MB
    };

    await expect(
      mediaService.uploadProductImages({
        productId: 'prod_1',
        files: [hugeFile],
        altTexts: [undefined],
      })
    ).rejects.toThrow(BadRequestError);
  });

  it('procesa y sube correctamente una imagen válida', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct);
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({ mime: 'image/jpeg', ext: 'jpg' } as any);
    vi.mocked(productRepository.createImage).mockResolvedValue({
      id: 'new_img',
      url: 'fake/key/path.webp',
      thumbnailUrl: 'fake/key/path.webp',
      altText: 'Anillo hermoso',
      order: 2,
    } as any);

    const result = await mediaService.uploadProductImages({
      productId: 'prod_1',
      files: [validImageFile],
      altTexts: ['Anillo hermoso'],
    });

    expect(result).toHaveLength(1);
    expect(result[0].altText).toBe('Anillo hermoso');
    expect(productRepository.createImage).toHaveBeenCalledWith(
      expect.objectContaining({ order: 2 }) // currentMaxOrder (1) + 1 + 0
    );
  });
});

describe('mediaService.deleteImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lanza NotFoundError si la imagen no existe', async () => {
    vi.mocked(productRepository.findImageById).mockResolvedValue(null);
    await expect(mediaService.deleteImage('no_existe')).rejects.toThrow(NotFoundError);
  });

  it('borra la imagen y sus archivos en storage si existe', async () => {
    vi.mocked(productRepository.findImageById).mockResolvedValue({
      id: 'img_1',
      url: 'products/1/full/x.webp',
      thumbnailUrl: 'products/1/thumbnail/x.webp',
    } as any);

    await mediaService.deleteImage('img_1');

    expect(productRepository.deleteImage).toHaveBeenCalledWith('img_1');
  });
});

describe('mediaService.updateAltText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lanza NotFoundError si la imagen no existe', async () => {
    vi.mocked(productRepository.findImageById).mockResolvedValue(null);
    await expect(mediaService.updateAltText('no_existe', 'nuevo texto')).rejects.toThrow(
      NotFoundError
    );
  });

  it('actualiza el altText si la imagen existe', async () => {
    vi.mocked(productRepository.findImageById).mockResolvedValue({ id: 'img_1' } as any);
    vi.mocked(productRepository.updateImageAltText).mockResolvedValue({
      id: 'img_1',
      altText: 'nuevo texto',
    } as any);

    await mediaService.updateAltText('img_1', 'nuevo texto');

    expect(productRepository.updateImageAltText).toHaveBeenCalledWith('img_1', 'nuevo texto');
  });
});

describe('mediaService.reorderImages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lanza NotFoundError si el producto no existe', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(null);
    await expect(mediaService.reorderImages('no_existe', ['img_1'])).rejects.toThrow(
      NotFoundError
    );
  });

  it('lanza BadRequestError si los IDs no coinciden con las imágenes del producto', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct);

    await expect(
      mediaService.reorderImages('prod_1', ['id_que_no_existe'])
    ).rejects.toThrow(BadRequestError);
  });

  it('lanza BadRequestError si falta alguna imagen en la lista', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct);

    // mockProduct tiene 2 imágenes (img_1, img_2), mandamos solo 1
    await expect(mediaService.reorderImages('prod_1', ['img_1'])).rejects.toThrow(
      BadRequestError
    );
  });

  it('reordena correctamente si los IDs coinciden', async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct);

    await mediaService.reorderImages('prod_1', ['img_2', 'img_1']);

    expect(productRepository.updateImageOrder).toHaveBeenCalledWith('img_2', 0);
    expect(productRepository.updateImageOrder).toHaveBeenCalledWith('img_1', 1);
  });
});