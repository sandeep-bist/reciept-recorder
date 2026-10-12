import { ItemCategory, CategoryMeta } from '../types';

export const CATEGORIES: Record<ItemCategory, CategoryMeta> = {
  Dairy: {
    name: 'Dairy',
    icon: '🧀',
    color: 'text-amber-700 dark:text-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  'Groceries & Staples': {
    name: 'Groceries & Staples',
    icon: '🌾',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  'Snacks & Munchies': {
    name: 'Snacks & Munchies',
    icon: '🍿',
    color: 'text-orange-700 dark:text-orange-400',
    bgLight: 'bg-orange-50 dark:bg-orange-950/40',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  Beverages: {
    name: 'Beverages',
    icon: '☕',
    color: 'text-sky-700 dark:text-sky-400',
    bgLight: 'bg-sky-50 dark:bg-sky-950/40',
    borderColor: 'border-sky-200 dark:border-sky-800',
  },
  'Fresh Produce & Fruits': {
    name: 'Fresh Produce & Fruits',
    icon: '🥦',
    color: 'text-green-700 dark:text-green-400',
    bgLight: 'bg-green-50 dark:bg-green-950/40',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  'Personal Care & Hygiene': {
    name: 'Personal Care & Hygiene',
    icon: '🧴',
    color: 'text-purple-700 dark:text-purple-400',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  'Household & Cleaning': {
    name: 'Household & Cleaning',
    icon: '🧼',
    color: 'text-blue-700 dark:text-blue-400',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  'Bakery & Biscuits': {
    name: 'Bakery & Biscuits',
    icon: '🍞',
    color: 'text-yellow-700 dark:text-yellow-400',
    bgLight: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  'Meat & Seafood': {
    name: 'Meat & Seafood',
    icon: '🥩',
    color: 'text-rose-700 dark:text-rose-400',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-200 dark:border-rose-800',
  },
  Others: {
    name: 'Others',
    icon: '📦',
    color: 'text-gray-700 dark:text-gray-400',
    bgLight: 'bg-gray-50 dark:bg-gray-800/40',
    borderColor: 'border-gray-200 dark:border-gray-700',
  },
};

export const ALL_CATEGORIES: ItemCategory[] = [
  'Dairy',
  'Groceries & Staples',
  'Snacks & Munchies',
  'Beverages',
  'Fresh Produce & Fruits',
  'Personal Care & Hygiene',
  'Household & Cleaning',
  'Bakery & Biscuits',
  'Meat & Seafood',
  'Others',
];

export function formatCurrency(amount: number, currency: string = '₹'): string {
  const rounded = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  // Add thousands commas
  const parts = rounded.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${currency}${parts.join('.')}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'Unknown date';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, monthIndex, day);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch (e) {
    // fallback
  }
  return dateString;
}

export function getRelativeTime(dateString: string): string {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    let targetDate: Date;
    if (parts.length === 3) {
      targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      targetDate = new Date(dateString);
    }

    const today = new Date();
    // Normalize to midnight
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - targetDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays > 1 && diffDays < 30) return `${diffDays} days ago`;
    if (diffDays >= 30 && diffDays < 60) return '1 month ago';
    if (diffDays >= 60 && diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} months ago`;
    }
    if (diffDays >= 365) {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
    if (diffDays < 0) return `In ${Math.abs(diffDays)} days`;
  } catch (e) {
    // ignore
  }
  return '';
}
