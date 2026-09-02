// types/store-config.ts
// Espejo de lo que devuelve GET /catalog/store-config

export interface PublicStoreConfig {
  storeName: string;
  whatsappNumber?: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  address: string | null;
  businessHours: string | null;
  returnPolicy: string | null;
  shippingInfo: string | null;
}
