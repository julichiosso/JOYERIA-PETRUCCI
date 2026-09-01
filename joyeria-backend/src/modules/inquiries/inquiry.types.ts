// src/modules/inquiries/inquiry.types.ts

export interface CreateInquiryInput {
  productId: string;
  variantId?: string;
  productUrl?: string;
}

export interface InquiryResult {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  priceSnapshot: string | null;
  createdAt: Date;
}

export interface CreateInquiryResponse {
  inquiryId: string;
  whatsappUrl: string;
}

export interface InquiryListQuery {
  page?: number;
  limit?: number;
  productId?: string;
}

export interface InquiryTopProduct {
  productId: string | null;
  productName: string;
  inquiryCount: number;
}

export interface InquiryStatsResult {
  totalInquiries: number;
  topProducts: InquiryTopProduct[];
}
