import React, { useState } from 'react';
import { Tags, ArrowRight, Store, Calendar } from 'lucide-react';
import { Receipt, ItemCategory } from '../types';
import { ALL_CATEGORIES, CATEGORIES, formatCurrency, formatDate, getRelativeTime } from '../utils/formatters';
import { getCategorySpendingBreakdown } from '../utils/storage';

interface CategoryViewProps {
  receipts: Receipt[];
  currency: string;
  onSelectProduct: (cleanName: string) => void;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  receipts,
  currency,
  onSelectProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('Dairy');

  const categoryBreakdown = getCategorySpendingBreakdown(receipts);

  // Group items by category
  const itemsByCategory: Record<
    ItemCategory,
    Array<{
      cleanName: string;
      fullName: string;
      lastDate: string;
      lastStore: string;
      lastPrice: number;
      unit: string;
      count: number;
    }>
  > = ALL_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = [];
    return acc;
  }, {} as any);

  // Populate items
  const itemMap = new Map<string, any>();
  receipts.forEach((r) => {
    r.items.forEach((it) => {
      const key = `${it.category}__${it.cleanName.toLowerCase()}`;
      if (!itemMap.has(key)) {
        itemMap.set(key, {
          category: it.category,
          cleanName: it.cleanName,
          fullName: it.name,
          lastDate: r.date,
          lastStore: r.storeName,
          lastPrice: it.unitPrice,
          unit: it.unit || 'pack',
          count: 1,
        });
      } else {
        const existing = itemMap.get(key);
        existing.count += 1;
        if (new Date(r.date) > new Date(existing.lastDate)) {
          existing.lastDate = r.date;
          existing.lastStore = r.storeName;
          existing.lastPrice = it.unitPrice;
          existing.fullName = it.name;
        }
      }
    });
  });

  itemMap.forEach((val) => {
    if (itemsByCategory[val.category as ItemCategory]) {
      itemsByCategory[val.category as ItemCategory].push(val);
    }
  });

  const activeCategoryMeta = CATEGORIES[selectedCategory];
  const activeItems = itemsByCategory[selectedCategory] || [];
  const activeCategoryStats = categoryBreakdown.find((c) => c.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Tags className="w-5 h-5 text-emerald-600" />
          Category Spending &amp; Organization
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          All your purchased items are automatically categorized for simple tracking
        </p>

        {/* Category Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const meta = CATEGORIES[cat];
            const spend = categoryBreakdown.find((c) => c.category === cat)?.total || 0;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{cat}</span>
                {spend > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {formatCurrency(spend, currency)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Category Details */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{activeCategoryMeta.icon}</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {selectedCategory}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activeItems.length} unique items tracked in this category
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total Spend</div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(activeCategoryStats?.total || 0, currency)}
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {activeItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeItems.map((item) => (
              <div
                key={item.cleanName}
                onClick={() => onSelectProduct(item.cleanName)}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-emerald-500 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white capitalize group-hover:text-emerald-600 transition-colors">
                    {item.cleanName}
                  </h4>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold px-1.5 py-0.5 rounded">
                    {item.count}x bought
                  </span>
                </div>

                <div className="text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
                  <div className="flex items-center gap-1 truncate">
                    <Store className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>Last: {item.lastStore}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>
                      {formatDate(item.lastDate)} ({getRelativeTime(item.lastDate)})
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                  <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                    {formatCurrency(item.lastPrice, currency)}
                    <span className="text-[10px] text-gray-400 font-normal">/{item.unit}</span>
                  </span>

                  <span className="text-[11px] text-emerald-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    View Price <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-gray-500">
            No items logged under {selectedCategory} yet. Scan a bill with items from this category!
          </div>
        )}
      </div>
    </div>
  );
};
