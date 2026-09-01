// src/modules/inquiries/inquiry.service.ts
import { inquiryRepository } from './inquiry.repository.js';
import { productRepository } from '../products/product.repository.js';
import { storeConfigService } from '../store-config/store-config.service.js';
import { ProductNotFoundError } from '../products/product.service.js';
import { BadRequestError } from '../../shared/errors/index.js';
import type {
  CreateInquiryInput,
  CreateInquiryResponse,
  InquiryListQuery,
  InquiryStatsResult,
} from './inquiry.types.js';

export const inquiryService = {
  async createInquiry(input: CreateInquiryInput): Promise<CreateInquiryResponse> {
    const product = await productRepository.findById(input.productId);
    if (!product || product.status === 'DRAFT') {
      throw new ProductNotFoundError('El producto no existe o no está disponible');
    }

    let selectedVariant = null;
    if (input.variantId) {
      selectedVariant = product.variants.find((v) => v.id === input.variantId);
      if (!selectedVariant) {
        throw new BadRequestError('La variante seleccionada no pertenece al producto');
      }
      if (!selectedVariant.isAvailable) {
        throw new BadRequestError('La variante seleccionada no se encuentra disponible');
      }
    }

    // Regla de seguridad de precio:
    // Si showPrice es false, NUNCA se expone ni se guarda el precio en el snapshot.
    let priceSnapshot: any = null;
    if (product.showPrice) {
      priceSnapshot = selectedVariant?.price ?? product.price;
    }

    // Construcción de la URL del producto si no vino en el body
    const baseUrl = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '');
    const parentSlug = product.category?.parent?.slug;
    const categorySlug = product.category?.slug ?? '';
    const productPath = parentSlug
      ? `/${parentSlug}/${categorySlug}/${product.slug}`
      : `/${categorySlug}/${product.slug}`;
    const productUrl = input.productUrl ?? `${baseUrl}${productPath}`;

    // Nombre para el mensaje de WhatsApp (incluye variante si aplica)
    const displayName = selectedVariant
      ? `${product.name} (${selectedVariant.name})`
      : product.name;

    const formattedPrice = priceSnapshot !== null ? priceSnapshot.toString() : null;

    const whatsappUrl = await storeConfigService.buildWhatsappLink({
      productName: displayName,
      price: formattedPrice,
      productUrl,
    });

    const inquiry = await inquiryRepository.create({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      productName: product.name,
      variantName: selectedVariant?.name ?? null,
      priceSnapshot: priceSnapshot !== null ? priceSnapshot : null,
    });

    return {
      inquiryId: inquiry.id,
      whatsappUrl,
    };
  },

  async listInquiries(params: InquiryListQuery) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 && params.limit <= 100 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const { items, total } = await inquiryRepository.list({
      productId: params.productId,
      skip,
      take: limit,
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getStats(): Promise<InquiryStatsResult> {
    const [totalInquiries, topProducts] = await Promise.all([
      inquiryRepository.countTotal(),
      inquiryRepository.getTopProducts(5),
    ]);

    return {
      totalInquiries,
      topProducts,
    };
  },
};
