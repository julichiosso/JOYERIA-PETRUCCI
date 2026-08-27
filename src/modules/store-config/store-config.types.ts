export interface UpdateStoreConfigInput {
  storeName?: string;
  whatsappNumber?: string;
  whatsappMessageTemplate?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  address?: string;
  businessHours?: string;
}

export interface StoreConfigResult {
  id: string;
  storeName: string;
  whatsappNumber: string;
  whatsappMessageTemplate: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  address: string | null;
  businessHours: string | null;
  updatedAt: Date;
}