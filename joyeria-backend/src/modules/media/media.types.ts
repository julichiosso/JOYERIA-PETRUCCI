export interface UploadedImageFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

export interface ImageVariant {
  url: string;
  width: number;
  height: number;
}

export interface ProcessedImageResult {
  full: ImageVariant;
  thumbnail: ImageVariant;
}

export interface CreateProductImageInput {
  productId: string;
  altText?: string;
}

export interface ProductImageResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  altText: string | null;
  order: number;
}