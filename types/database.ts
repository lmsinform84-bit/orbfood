export type UserRole = 'user' | 'toko' | 'admin';
export type OrderStatus = 'pending' | 'menunggu_persetujuan' | 'diproses' | 'diantar' | 'selesai' | 'dibatalkan';
export type StoreStatus = 'pending' | 'approved' | 'suspended' | 'rejected';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  banner_url: string | null;
  qris_url: string | null;
  orb_qris_url: string | null;
  status: StoreStatus;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreWorkHours {
  id: string;
  store_id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  store_id: string;
  auto_accept_orders: boolean;
  min_order_amount: number;
  delivery_fee: number;
  min_order_free_shipping: number | null;
  estimated_preparation_time: number;
  payment_methods: string[] | null;
  cod_max_limit: number | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  is_available: boolean;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  store_id: string;
  total_price: number;
  delivery_fee: number;
  additional_delivery_fee: number | null;
  additional_delivery_note: string | null;
  final_total: number;
  status: OrderStatus;
  delivery_address: string;
  notes: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: string;
}

export interface OrderWithDetails extends Order {
  store: Store;
  user: User;
  items: (OrderItem & { product: Product })[];
}

export interface Invoice {
  id: string;
  store_id: string;
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'PAID' | 'CANCELLED';
  total_fee: number;
  total_orders: number;
  opened_at: string;
  closed_at: string | null;
  payment_proof_url: string | null;
  payment_submitted_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  previous_invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  order_id: string;
  fee_amount: number;
  created_at: string;
  updated_at: string;
}

