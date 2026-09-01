import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { productRepository } from '../products/product.repository.js';
import { uploadFile, deleteFile } from '../../infra/storage/storage.service.js';
import { BadRequestError, NotFoundError } from '../../shared/errors/index.js';
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_UPLOAD,
  ALLOWED_MIME_TYPES,
} from './media.schema.js';
import type { UploadedImageFile, ProductImageResult } from './media.types.js';

const THUMBNAIL_SIZE = 300;
const FULL_MAX_WIDTH = 1200;
const WEBP_QUALITY = 82;

async function validateImageFile(file: UploadedImageFile): Promise<void> {
  if (file.buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new BadRequestError(
      `La imagen "${file.filename}" supera el tamaño máximo permitido (10MB)`
    );
  }

  // No confiamos en el mimetype que manda el navegador (se puede falsificar).
  // Leemos los bytes reales del archivo para confirmar qué es de verdad.
  const detectedType = await fileTypeFromBuffer(file.buffer);

  if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
    throw new BadRequestError(
      `El archivo "${file.filename}" no es una imagen válida o su formato no está soportado`
    );
  }
}

async function processAndUploadVariant(params: {
  buffer: Buffer;
  width: number;
  folder: string;
}): Promise<{ url: string; width: number; height: number }> {
  const processedBuffer = await sharp(params.buffer)
    .rotate() // corrige orientación según metadata EXIF (fotos de celular vienen rotadas)
    .resize({ width: params.width, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });

  const key = await uploadFile({
    buffer: processedBuffer.data,
    contentType: 'image/webp',
    folder: params.folder,
  });

  return {
    url: key,
    width: processedBuffer.info.width,
    height: processedBuffer.info.height,
  };
}

export const mediaService = {
  async uploadProductImages(params: {
    productId: string;
    files: UploadedImageFile[];
    altTexts: (string | undefined)[];
  }): Promise<ProductImageResult[]> {
    if (params.files.length === 0) {
      throw new BadRequestError('No se recibió ninguna imagen');
    }

    if (params.files.length > MAX_FILES_PER_UPLOAD) {
      throw new BadRequestError(`No se pueden subir más de ${MAX_FILES_PER_UPLOAD} imágenes a la vez`);
    }

    const product = await productRepository.findById(params.productId);
    if (!product) {
      throw new NotFoundError('Producto no encontrado');
    }

    // Validamos TODOS los archivos antes de procesar ninguno —
    // así si uno falla, no dejamos imágenes "a medio subir".
    await Promise.all(params.files.map((file) => validateImageFile(file)));

    const currentMaxOrder = product.images.reduce((max, img) => Math.max(max, img.order), -1);

    const results: ProductImageResult[] = [];

    for (let i = 0; i < params.files.length; i++) {
      const file = params.files[i];
      const altText = params.altTexts[i];

      const [full, thumbnail] = await Promise.all([
        processAndUploadVariant({
          buffer: file.buffer,
          width: FULL_MAX_WIDTH,
          folder: `products/${params.productId}/full`,
        }),
        processAndUploadVariant({
          buffer: file.buffer,
          width: THUMBNAIL_SIZE,
          folder: `products/${params.productId}/thumbnail`,
        }),
      ]);

      const created = await productRepository.createImage({
        productId: params.productId,
        url: full.url,
        thumbnailUrl: thumbnail.url,
        altText: altText ?? null,
        order: currentMaxOrder + 1 + i,
      });

      results.push({
        id: created.id,
        url: created.url,
        thumbnailUrl: created.thumbnailUrl!,
        altText: created.altText,
        order: created.order,
      });
    }

    return results;
  },

  async deleteImage(imageId: string): Promise<void> {
    const image = await productRepository.findImageById(imageId);
    if (!image) {
      throw new NotFoundError('Imagen no encontrada');
    }

    await Promise.all([deleteFile(image.url), deleteFile(image.thumbnailUrl!)]);
    await productRepository.deleteImage(imageId);
  },

  async updateAltText(imageId: string, altText: string) {
    const image = await productRepository.findImageById(imageId);
    if (!image) {
      throw new NotFoundError('Imagen no encontrada');
    }

    return productRepository.updateImageAltText(imageId, altText);
  },

  async reorderImages(productId: string, imageIds: string[]): Promise<void> {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Producto no encontrado');
    }

    const validIds = new Set(product.images.map((img) => img.id));
    const allValid = imageIds.every((id) => validIds.has(id));

    if (!allValid || imageIds.length !== product.images.length) {
      throw new BadRequestError('La lista de imágenes no coincide con las imágenes del producto');
    }

    await Promise.all(
      imageIds.map((id, index) => productRepository.updateImageOrder(id, index))
    );
  },
};