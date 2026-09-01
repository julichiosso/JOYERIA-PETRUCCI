import type { FastifyRequest, FastifyReply } from 'fastify';
import { mediaService } from './media.service.js';
import { BadRequestError } from '../../shared/errors/index.js';
import type { ProductIdParam, ImageIdParam, UpdateImageAltTextInput, ReorderImagesInput } from './media.schema.js';
import type { UploadedImageFile } from './media.types.js';

export const mediaController = {
  async upload(
    request: FastifyRequest<{ Params: ProductIdParam }>,
    reply: FastifyReply
  ) {
    const parts = request.parts();

    const files: UploadedImageFile[] = [];
    const altTexts: (string | undefined)[] = [];

    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        files.push({
          buffer,
          filename: part.filename,
          mimetype: part.mimetype,
        });
      } else if (part.fieldname === 'altText') {
        altTexts.push(part.value as string);
      }
    }

    if (files.length === 0) {
      throw new BadRequestError('No se recibió ninguna imagen en la subida');
    }

    const images = await mediaService.uploadProductImages({
      productId: request.params.productId,
      files,
      altTexts,
    });

    return reply.status(201).send({ images });
  },

  async delete(
    request: FastifyRequest<{ Params: ImageIdParam }>,
    reply: FastifyReply
  ) {
    await mediaService.deleteImage(request.params.imageId);
    return reply.status(204).send();
  },

  async updateAltText(
    request: FastifyRequest<{ Params: ImageIdParam; Body: UpdateImageAltTextInput }>,
    reply: FastifyReply
  ) {
    const image = await mediaService.updateAltText(request.params.imageId, request.body.altText);
    return reply.status(200).send(image);
  },

  async reorder(
    request: FastifyRequest<{ Params: ProductIdParam; Body: ReorderImagesInput }>,
    reply: FastifyReply
  ) {
    await mediaService.reorderImages(request.params.productId, request.body.imageIds);
    return reply.status(200).send({ message: 'Orden actualizado' });
  },
};