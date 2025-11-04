export interface Product {
  _id?: string;
  sku: string;
  name: string;
  category?: string;
  price: number;
  stock: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface StockMovement {
  _id?: string;
  productId: string;
  type: 'IN' | 'OUT';
  qty: number;
  reason?: string;
  at: Date;
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface Order {
  _id?: string;
  number: string;
  at: Date;
  items: OrderItem[];
  total: number;
}
