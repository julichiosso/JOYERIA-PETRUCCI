import type { FastifyRequest, FastifyReply } from 'fastify';
import { mediaService } from './media.service.js';
import { auditService } from '../audit/audit.service.js';
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

    const user = (request as any).user;
    await auditService.log({
      userId: user?.userId,
      userEmail: user?.email,
      userName: user?.name ?? (user?.email === 'webya@joyeriapetrucci.com' ? 'WebYa (Admin Dev)' : 'Víctor'),
      action: 'MEDIA_UPLOAD',
      entityType: 'Media',
      entityId: request.params.productId,
      description: `Subió ${files.length} foto(s) para el producto ID: ${request.params.productId}`,
    });

    return reply.status(201).send({ images });
  },

  async delete(
    request: FastifyRequest<{ Params: ImageIdParam }>,
    reply: FastifyReply
  ) {
    const user = (request as any).user;
    await mediaService.deleteImage(request.params.imageId);

    await auditService.log({
      userId: user?.userId,
      userEmail: user?.email,
      userName: user?.name ?? (user?.email === 'webya@joyeriapetrucci.com' ? 'WebYa (Admin Dev)' : 'Víctor'),
      action: 'MEDIA_DELETE',
      entityType: 'Media',
      entityId: request.params.imageId,
      description: `Eliminó la imagen ID: ${request.params.imageId}`,
    });

    return reply.status(204).send();
  },

  async updateAltText(
    request: FastifyRequest<{ Params: ImageIdParam; Body: UpdateImageAltTextInput }>,
    reply: FastifyReply
  ) {
    const user = (request as any).user;
    const image = await mediaService.updateAltText(request.params.imageId, request.body.altText);

    await auditService.log({
      userId: user?.userId,
      userEmail: user?.email,
      userName: user?.name ?? (user?.email === 'webya@joyeriapetrucci.com' ? 'WebYa (Admin Dev)' : 'Víctor'),
      action: 'MEDIA_UPDATE',
      entityType: 'Media',
      entityId: request.params.imageId,
      description: `Actualizó texto Alt (SEO) de la imagen ID: ${request.params.imageId} a "${request.body.altText}"`,
    });

    return reply.status(200).send(image);
  },

  async reorder(
    request: FastifyRequest<{ Params: ProductIdParam; Body: ReorderImagesInput }>,
    reply: FastifyReply
  ) {
    const user = (request as any).user;
    await mediaService.reorderImages(request.params.productId, request.body.imageIds);

    await auditService.log({
      userId: user?.userId,
      userEmail: user?.email,
      userName: user?.name ?? (user?.email === 'webya@joyeriapetrucci.com' ? 'WebYa (Admin Dev)' : 'Víctor'),
      action: 'MEDIA_REORDER',
      entityType: 'Media',
      entityId: request.params.productId,
      description: `Reordenó las fotos del producto ID: ${request.params.productId}`,
    });

    return reply.status(200).send({ message: 'Orden actualizado' });
  },
};