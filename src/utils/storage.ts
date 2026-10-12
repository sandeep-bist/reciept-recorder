import { Receipt, ItemStats, ItemPurchaseHistory, ItemCategory, UserProfile, AppColorTheme } from '../types';
import { SAMPLE_RECEIPTS } from '../data/sampleReceipts';

const STORAGE_KEY = 'logify_receipts_v2';
const CURRENCY_KEY = 'logify_currency_v2';
const USER_KEY = 'logify_user_profile_v2';
const API_KEY_KEY = 'logify_user_api_key_v2';
const THEME_KEY = 'logify_theme_v2';
const COLOR_THEME_KEY = 'logify_color_theme_v2';
const MODEL_KEY = 'logify_gemini_model_v2';

export const DEFAULT_USER: UserProfile = {
  id: '',
  name: '',
  email: '',
  isLoggedIn: false,
};

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return DEFAULT_USER;
    }
    const parsed = JSON.parse(raw);
    if (parsed.name === 'Sandeep Bisht') {
      localStorage.removeItem(USER_KEY);
      return DEFAULT_USER;
    }
    return parsed;
  } catch {
    return DEFAULT_USER;
  }
}

export function saveUserProfile(user: UserProfile): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Error saving user profile:', err);
  }
}

export function loadSelectedModel(): string {
  try {
    return localStorage.getItem(MODEL_KEY) || 'gemini-3.8-flash';
  } catch {
    return 'gemini-3.8-flash';
  }
}

export function saveSelectedModel(model: string): void {
  try {
    localStorage.setItem(MODEL_KEY, model);
  } catch (err) {
    console.error('Error saving selected model:', err);
  }
}

export function loadCustomApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_KEY) || '';
  } catch {
    return '';
  }
}

export function saveCustomApiKey(key: string): void {
  try {
    if (key) {
      localStorage.setItem(API_KEY_KEY, key.trim());
    } else {
      localStorage.removeItem(API_KEY_KEY);
    }
  } catch (err) {
    console.error('Error saving custom API key:', err);
  }
}

export function loadTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    // Default to system preference or dark
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (err) {
    console.error('Error saving theme:', err);
  }
}

export function loadColorTheme(): AppColorTheme {
  try {
    const saved = localStorage.getItem(COLOR_THEME_KEY) as AppColorTheme | null;
    const validThemes: AppColorTheme[] = ['emerald', 'blue', 'indigo', 'purple', 'rose', 'amber', 'cyan'];
    if (saved && validThemes.includes(saved)) {
      return saved;
    }
    return 'emerald';
  } catch {
    return 'emerald';
  }
}

export function saveColorTheme(color: AppColorTheme): void {
  try {
    localStorage.setItem(COLOR_THEME_KEY, color);
    document.documentElement.setAttribute('data-color-theme', color);
  } catch (err) {
    console.error('Error saving color theme:', err);
  }
}

export function loadReceipts(): Receipt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (err) {
    console.error('Error loading receipts from storage:', err);
    return [];
  }
}

export function loadSampleReceiptsData(): Receipt[] {
  return SAMPLE_RECEIPTS;
}

export function saveReceipts(receipts: Receipt[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
  } catch (err) {
    console.error('Error saving receipts to storage:', err);
  }
}

export function loadCurrency(): string {
  try {
    return localStorage.getItem(CURRENCY_KEY) || '₹';
  } catch {
    return '₹';
  }
}

export function saveCurrency(currency: string): void {
  try {
    localStorage.setItem(CURRENCY_KEY, currency);
  } catch {
    // ignore
  }
}

export function resetToSampleData(): Receipt[] {
  saveReceipts(SAMPLE_RECEIPTS);
  return SAMPLE_RECEIPTS;
}

export function getAllTrackedItems(receipts: Receipt[]): ItemStats[] {
  const itemMap = new Map<string, {
    cleanName: string;
    category: ItemCategory;
    history: ItemPurchaseHistory[];
  }>();

  // Traverse receipts
  for (const receipt of receipts) {
    for (const item of receipt.items) {
      const cleanKey = item.cleanName.trim().toLowerCase();
      if (!cleanKey) continue;

      if (!itemMap.has(cleanKey)) {
        itemMap.set(cleanKey, {
          cleanName: item.cleanName.trim(),
          category: item.category,
          history: [],
        });
      }

      const entry = itemMap.get(cleanKey)!;
      entry.history.push({
        date: receipt.date,
        store: receipt.storeName,
        fullName: item.name,
        cleanName: item.cleanName,
        category: item.category,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        quantity: item.quantity,
        unit: item.unit,
        receiptId: receipt.id,
        billNumber: receipt.billNumber,
      });
    }
  }

  const results: ItemStats[] = [];

  for (const [_, data] of itemMap) {
    // Sort history by date descending (newest first)
    data.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const latest = data.history[0];
    const previous = data.history.length > 1 ? data.history[1] : null;

    let priceChange: number | null = null;
    let priceChangePercent: number | null = null;
    let isPriceIncreased = false;
    let isPriceDecreased = false;

    if (previous) {
      priceChange = Math.round((latest.unitPrice - previous.unitPrice) * 100) / 100;
      if (previous.unitPrice > 0) {
        priceChangePercent = Math.round(((latest.unitPrice - previous.unitPrice) / previous.unitPrice) * 1000) / 10;
      }
      isPriceIncreased = priceChange > 0;
      isPriceDecreased = priceChange < 0;
    }

    let totalSpent = 0;
    let sumUnitPrices = 0;
    let minPrice = { price: latest.unitPrice, store: latest.store, date: latest.date };
    let maxPrice = { price: latest.unitPrice, store: latest.store, date: latest.date };

    for (const record of data.history) {
      totalSpent += record.totalPrice;
      sumUnitPrices += record.unitPrice;

      if (record.unitPrice < minPrice.price) {
        minPrice = { price: record.unitPrice, store: record.store, date: record.date };
      }
      if (record.unitPrice > maxPrice.price) {
        maxPrice = { price: record.unitPrice, store: record.store, date: record.date };
      }
    }

    const averageUnitPrice = data.history.length > 0 ? sumUnitPrices / data.history.length : 0;

    results.push({
      cleanName: data.cleanName,
      category: data.category,
      lastPurchasedDate: latest.date,
      lastStore: latest.store,
      lastUnitPrice: latest.unitPrice,
      lastTotalPrice: latest.totalPrice,
      lastQuantity: latest.quantity,
      lastUnit: latest.unit,
      lastFullName: latest.fullName,
      purchaseCount: data.history.length,
      totalSpent,
      averageUnitPrice,
      minPrice,
      maxPrice,
      previousPurchase: previous
        ? {
            unitPrice: previous.unitPrice,
            store: previous.store,
            date: previous.date,
            fullName: previous.fullName,
          }
        : null,
      priceChange,
      priceChangePercent,
      isPriceIncreased,
      isPriceDecreased,
      history: data.history,
    });
  }

  // Sort overall results: items with most purchases or most recent purchase first
  results.sort((a, b) => {
    const dateDiff = new Date(b.lastPurchasedDate).getTime() - new Date(a.lastPurchasedDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    return b.purchaseCount - a.purchaseCount;
  });

  return results;
}

export function searchTrackedItems(query: string, items: ItemStats[]): ItemStats[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items.filter((item) => {
    // Check clean name
    if (item.cleanName.toLowerCase().includes(q)) return true;
    // Check category
    if (item.category.toLowerCase().includes(q)) return true;
    // Check full product names or stores in history
    return item.history.some(
      (h) => h.fullName.toLowerCase().includes(q) || h.store.toLowerCase().includes(q)
    );
  });
}

export interface MonthlySpendData {
  monthKey: string; // YYYY-MM
  monthLabel: string; // "Oct 2026"
  totalSpend: number;
  receiptCount: number;
  itemsCount: number;
  stores: Record<string, number>;
  categories: Record<string, number>;
}

export function getMonthlySpending(receipts: Receipt[]): MonthlySpendData[] {
  const monthMap = new Map<string, MonthlySpendData>();

  for (const receipt of receipts) {
    if (!receipt.date) continue;
    const parts = receipt.date.split('-');
    if (parts.length < 2) continue;
    const monthKey = `${parts[0]}-${parts[1]}`;

    if (!monthMap.has(monthKey)) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const d = new Date(year, month, 1);
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      monthMap.set(monthKey, {
        monthKey,
        monthLabel,
        totalSpend: 0,
        receiptCount: 0,
        itemsCount: 0,
        stores: {},
        categories: {},
      });
    }

    const mData = monthMap.get(monthKey)!;
    mData.totalSpend += receipt.total;
    mData.receiptCount += 1;
    mData.itemsCount += receipt.items.length;

    // Stores breakdown
    mData.stores[receipt.storeName] = (mData.stores[receipt.storeName] || 0) + receipt.total;

    // Categories breakdown
    for (const item of receipt.items) {
      mData.categories[item.category] = (mData.categories[item.category] || 0) + item.totalPrice;
    }
  }

  // Sort chronologically
  return Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

export function getStoreSpendingBreakdown(receipts: Receipt[]): Array<{ store: string; total: number; count: number; percentage: number }> {
  const storeMap: Record<string, { total: number; count: number }> = {};
  let grandTotal = 0;

  for (const r of receipts) {
    grandTotal += r.total;
    if (!storeMap[r.storeName]) {
      storeMap[r.storeName] = { total: 0, count: 0 };
    }
    storeMap[r.storeName].total += r.total;
    storeMap[r.storeName].count += 1;
  }

  return Object.entries(storeMap)
    .map(([store, val]) => ({
      store,
      total: val.total,
      count: val.count,
      percentage: grandTotal > 0 ? (val.total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function getCategorySpendingBreakdown(receipts: Receipt[]): Array<{ category: ItemCategory; total: number; count: number; percentage: number }> {
  const catMap: Partial<Record<ItemCategory, { total: number; count: number }>> = {};
  let grandTotal = 0;

  for (const r of receipts) {
    for (const item of r.items) {
      grandTotal += item.totalPrice;
      if (!catMap[item.category]) {
        catMap[item.category] = { total: 0, count: 0 };
      }
      catMap[item.category]!.total += item.totalPrice;
      catMap[item.category]!.count += item.quantity || 1;
    }
  }

  return Object.entries(catMap)
    .map(([category, val]) => ({
      category: category as ItemCategory,
      total: val?.total || 0,
      count: val?.count || 0,
      percentage: grandTotal > 0 ? ((val?.total || 0) / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}
