export type Product = {
  id: number;
  name: string;
  description: string;
  categoryId?: number;
  variants: ItemVariant[];
};

export type ItemVariant = {
  id: number;
  productId: number;
  sku: string;
  sizing: string;
  currentStock: number;
  expirationDate?: string;
  primarySupplier: string;
  price: number;
};

export type Category = {
  id: number;
  name: string;
  description: string;
};

export type Transaction = {
  id: number;
  itemVariantId: number;
  type: "IN" | "OUT" | "AUDIT";
  quantity: number;
  notes: string;
  timestamp: string;
};
