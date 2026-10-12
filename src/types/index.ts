export type AppColorTheme =
  | 'emerald'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'rose'
  | 'amber'
  | 'cyan';

export type ItemCategory =
  | 'Dairy'
  | 'Groceries & Staples'
  | 'Snacks & Munchies'
  | 'Beverages'
  | 'Fresh Produce & Fruits'
  | 'Personal Care & Hygiene'
  | 'Household & Cleaning'
  | 'Bakery & Biscuits'
  | 'Meat & Seafood'
  | 'Others';

export interface ReceiptItem {
  id: string;
  name: string; // Exact name from bill, e.g. "Amul Processed Cheese 200g"
  cleanName: string; // Generic normalized name, e.g. "Cheese"
  category: ItemCategory;
  quantity: number;
  unit?: string; // pcs, kg, g, pack, L
  unitPrice: number;
  totalPrice: number;
  discount?: number;
  notes?: string;
}

export interface Receipt {
  id: string;
  userId?: string;
  storeName: string; // e.g. "DMart", "Smart Bazaar"
  storeLocation?: string;
  date: string; // YYYY-MM-DD
  billNumber?: string;
  paymentMethod?: string;
  items: ReceiptItem[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  total: number;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface ItemPurchaseHistory {
  date: string;
  store: string;
  fullName: string;
  cleanName: string;
  category: ItemCategory;
  unitPrice: number;
  totalPrice: number;
  quantity: number;
  unit?: string;
  receiptId: string;
  billNumber?: string;
}

export interface ItemStats {
  cleanName: string;
  category: ItemCategory;
  lastPurchasedDate: string;
  lastStore: string;
  lastUnitPrice: number;
  lastTotalPrice: number;
  lastQuantity: number;
  lastUnit?: string;
  lastFullName: string;
  purchaseCount: number;
  totalSpent: number;
  averageUnitPrice: number;
  minPrice: { price: number; store: string; date: string };
  maxPrice: { price: number; store: string; date: string };
  // Comparison vs previous purchase
  previousPurchase: {
    unitPrice: number;
    store: string;
    date: string;
    fullName: string;
  } | null;
  priceChange: number | null; // latestUnitPrice - previousUnitPrice
  priceChangePercent: number | null;
  isPriceIncreased: boolean;
  isPriceDecreased: boolean;
  history: ItemPurchaseHistory[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  isLoggedIn: boolean;
}

export interface CategoryMeta {
  name: ItemCategory;
  icon: string;
  color: string;
  bgLight: string;
  borderColor: string;
}
