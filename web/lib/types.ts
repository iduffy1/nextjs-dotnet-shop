export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
};

export type OrderLineRequest = { productId: number; quantity: number };

export type OrderLine = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = {
  id: number;
  createdAt: string;
  lines: OrderLine[];
  total: number;
};