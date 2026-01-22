// API Response wrapper
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// User
export interface User {
  id: number;
  phone: string;
  nickname: string;
  avatar_url: string;
  last_login_at: string | null;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  expires_at: string;
  user: User;
}

// Category
export interface Category {
  id: number;
  name: string;
  type: 1 | 2; // 1: 支出, 2: 收入
  parent_id: number;
  icon: string;
  sort_order: number;
  children?: Category[];
}

// Bill
export interface Bill {
  id: number;
  uuid: string;
  amount: string;
  bill_type: 1 | 2; // 1: 支出, 2: 收入
  platform: string;
  merchant: string;
  category: Category | null;
  pay_time: string;
  pay_method: string;
  order_no: string;
  remark: string;
  confidence: number;
  is_confirmed: boolean;
  created_at: string;
}

export interface BillListResponse {
  total: number;
  page: number;
  page_size: number;
  list: Bill[];
}

export interface CreateBillRequest {
  amount: string;
  bill_type: 1 | 2;
  platform?: string;
  merchant?: string;
  category_id?: number;
  pay_time: string;
  pay_method?: string;
  order_no?: string;
  remark?: string;
}

export interface UpdateBillRequest {
  amount?: string;
  bill_type?: 1 | 2;
  platform?: string;
  merchant?: string;
  category_id?: number;
  pay_time?: string;
  pay_method?: string;
  order_no?: string;
  remark?: string;
  is_confirmed?: boolean;
}

export interface BillListParams {
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
  category_id?: number;
  bill_type?: 1 | 2;
  keyword?: string;
}

// Stats
export interface CategoryStat {
  id: number;
  name: string;
  amount: string;
  percent: number;
}

export interface TrendItem {
  date: string;
  expense: string;
  income: string;
}

export interface StatsSummary {
  period: string;
  total_expense: string;
  total_income: string;
  bill_count: number;
  daily_average: string;
  top_categories: CategoryStat[];
  trend: TrendItem[];
}

export interface CategoryStats {
  period: string;
  categories: CategoryStat[];
}

// AI Recognition
export interface AIRecognitionResult {
  platform: string;
  amount: string;
  merchant: string;
  category: string;
  sub_category: string;
  pay_time: string;
  pay_method: string;
  order_no: string;
  bill_type: 1 | 2;
  confidence: number;
}

// Import
export interface ImportError {
  row: number;
  column: string;
  message: string;
  row_data: Record<string, string>;
}

export interface ImportResult {
  total: number;
  failed: number;
  errors: ImportError[];
}

// Theme
export type Theme = 'light' | 'dark' | 'system';
