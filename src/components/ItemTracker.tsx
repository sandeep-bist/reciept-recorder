import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Store,
  Tag,
  TrendingDown,
  TrendingUp,
  History,
  CheckCircle,
  ShoppingBag,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Minus,
} from 'lucide-react';
import { ItemStats } from '../types';
import { CATEGORIES, formatCurrency, formatDate, getRelativeTime } from '../utils/formatters';

interface ItemTrackerProps {
  items: ItemStats[];
  currency: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectReceipt?: (receiptId: string) => void;
  onOpenScanner?: () => void;
  onLoadDemoData?: () => void;
}

export const ItemTracker: React.FC<ItemTrackerProps> = ({
  items,
  currency,
  searchQuery,
  setSearchQuery,
  onSelectReceipt,
  onOpenScanner,
  onLoadDemoData,
}) => {
  // Select first item or searched item by default
  const [selectedCleanName, setSelectedCleanName] = useState<string | null>(null);

  // Price trend filter: 'all' | 'increased' | 'decreased'
  const [priceTrendFilter, setPriceTrendFilter] = useState<'all' | 'increased' | 'decreased'>('all');

  // Filter items based on searchQuery & priceTrendFilter
  const filteredItems = useMemo(() => {
    let result = items;

    // Price trend filter
    if (priceTrendFilter === 'increased') {
      result = result.filter((it) => it.isPriceIncreased);
    } else if (priceTrendFilter === 'decreased') {
      result = result.filter((it) => it.isPriceDecreased);
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return result;

    return result.filter(
      (item) =>
        item.cleanName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.history.some(
          (h) => h.fullName.toLowerCase().includes(q) || h.store.toLowerCase().includes(q)
        )
    );
  }, [items, searchQuery, priceTrendFilter]);

  // Counts for filter pills
  const increasedCount = useMemo(() => items.filter((it) => it.isPriceIncreased).length, [items]);
  const decreasedCount = useMemo(() => items.filter((it) => it.isPriceDecreased).length, [items]);

  // Determine current active item for detail view
  const activeItem = useMemo(() => {
    if (filteredItems.length === 0) return null;
    if (selectedCleanName) {
      const match = filteredItems.find(
        (it) => it.cleanName.toLowerCase() === selectedCleanName.toLowerCase()
      );
      if (match) return match;
    }
    // Default to first item
    return filteredItems[0];
  }, [filteredItems, selectedCleanName]);

  const quickPills = ['Cheese', 'Cooking Oil', 'Toor Dal', 'Tea', 'Milk', 'Atta'];

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-app-hero-banner text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-2.5 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            Instant Purchase &amp; Price Lookup
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            &ldquo;When did I last buy Cheese?&rdquo;
          </h1>
          <p className="text-xs sm:text-sm text-white/90 mt-1">
            Instantly see the exact date, which supermarket (DMart, Smart Bazaar, etc.), amount paid,
            and price increases highlighted with red indicators.
          </p>

          {/* Big Search Input */}
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type an item name (e.g. Cheese, Oil, Atta, Milk, Tea)..."
              className="w-full pl-12 pr-10 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-app-accent shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Item Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-1">
            <span className="text-xs text-white/80 font-medium">Quick find:</span>
            {quickPills.map((pill) => (
              <button
                key={pill}
                onClick={() => {
                  setSearchQuery(pill);
                  setSelectedCleanName(pill);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  searchQuery.toLowerCase() === pill.toLowerCase()
                    ? 'bg-white text-gray-900 border-white font-bold shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20 font-medium'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Layout: Active Item Highlight & List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Detail view for active/searched item */}
        <div className="lg:col-span-7 space-y-6">
          {activeItem ? (
            <>
              {/* PRICE INCREASE / DECREASE HIGHLIGHT BANNER */}
              {activeItem.isPriceIncreased && activeItem.previousPurchase && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 dark:from-rose-950/50 dark:via-red-950/40 dark:to-orange-950/30 border-2 border-rose-300 dark:border-rose-800/80 shadow-md flex items-start gap-3.5 animate-in fade-in duration-200">
                  <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/30">
                    <ArrowUpRight className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                        <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                        Price Increased
                      </span>
                      <span className="text-sm sm:text-base font-black text-rose-700 dark:text-rose-400">
                        +{formatCurrency(activeItem.priceChange!, currency)} (+{activeItem.priceChangePercent}%)
                      </span>
                    </div>

                    <p className="text-xs text-rose-900/90 dark:text-rose-200/90 leading-relaxed">
                      Price went up compared to your previous purchase at{' '}
                      <span className="font-bold underline decoration-rose-400">
                        {activeItem.previousPurchase.store}
                      </span>{' '}
                      ({formatCurrency(activeItem.previousPurchase.unitPrice, currency)} on{' '}
                      {formatDate(activeItem.previousPurchase.date)}). Current unit price is{' '}
                      <span className="font-extrabold text-rose-700 dark:text-rose-300">
                        {formatCurrency(activeItem.lastUnitPrice, currency)}
                      </span>{' '}
                      at <span className="font-bold">{activeItem.lastStore}</span>.
                    </p>
                  </div>
                </div>
              )}

              {activeItem.isPriceDecreased && activeItem.previousPurchase && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-green-950/30 border-2 border-emerald-300 dark:border-emerald-800/80 shadow-md flex items-start gap-3.5 animate-in fade-in duration-200">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30">
                    <ArrowDownRight className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                        <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
                        Price Dropped
                      </span>
                      <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-400">
                        -{formatCurrency(Math.abs(activeItem.priceChange!), currency)} ({activeItem.priceChangePercent}%)
                      </span>
                    </div>

                    <p className="text-xs text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed">
                      You saved compared to your prior purchase at{' '}
                      <span className="font-bold underline decoration-emerald-400">
                        {activeItem.previousPurchase.store}
                      </span>{' '}
                      ({formatCurrency(activeItem.previousPurchase.unitPrice, currency)} on{' '}
                      {formatDate(activeItem.previousPurchase.date)}). Current unit price is{' '}
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(activeItem.lastUnitPrice, currency)}
                      </span>{' '}
                      at <span className="font-bold">{activeItem.lastStore}</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Hero "Last Bought" Result Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-900 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-md space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{CATEGORIES[activeItem.category]?.icon || '📦'}</span>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white capitalize">
                        {activeItem.cleanName}
                      </h2>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Last logged variant: &ldquo;{activeItem.lastFullName}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeItem.isPriceIncreased && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        <ArrowUpRight className="w-3.5 h-3.5 stroke-[3] text-rose-600" />
                        Price Hike
                      </span>
                    )}
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        CATEGORIES[activeItem.category]?.bgLight
                      } ${CATEGORIES[activeItem.category]?.color} ${
                        CATEGORIES[activeItem.category]?.borderColor
                      }`}
                    >
                      {activeItem.category}
                    </span>
                  </div>
                </div>

                {/* The 3 Core Answers: DATE, STORE, AMOUNT */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Answer 1: DATE */}
                  <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      When Last Bought
                    </div>
                    <div className="text-lg font-extrabold text-gray-900 dark:text-white">
                      {formatDate(activeItem.lastPurchasedDate)}
                    </div>
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {getRelativeTime(activeItem.lastPurchasedDate)}
                    </div>
                  </div>

                  {/* Answer 2: STORE */}
                  <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">
                      <Store className="w-4 h-4" />
                      Which Store
                    </div>
                    <div className="text-lg font-extrabold text-gray-900 dark:text-white truncate">
                      {activeItem.lastStore}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                      {activeItem.purchaseCount} purchases recorded
                    </div>
                  </div>

                  {/* Answer 3: AMOUNT */}
                  <div
                    className={`p-4 rounded-xl border ${
                      activeItem.isPriceIncreased
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                        : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1.5 text-xs font-bold mb-1 ${
                        activeItem.isPriceIncreased
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      <Tag className="w-4 h-4" />
                      Amount Paid
                    </div>
                    <div className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                      <span>
                        {formatCurrency(activeItem.lastUnitPrice, currency)}
                        <span className="text-xs font-normal text-gray-500">
                          /{activeItem.lastUnit || 'unit'}
                        </span>
                      </span>
                      {activeItem.isPriceIncreased && (
                        <span className="p-0.5 rounded-full bg-rose-600 text-white" title="Price Increased">
                          <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${
                        activeItem.isPriceIncreased
                          ? 'text-rose-600 dark:text-rose-400 font-semibold'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      Total: {formatCurrency(activeItem.lastTotalPrice, currency)} (Qty:{' '}
                      {activeItem.lastQuantity})
                    </div>
                  </div>
                </div>

                {/* Price Intelligence & Store Comparison */}
                {activeItem.history.length > 1 && (
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        <TrendingDown className="w-4 h-4 text-emerald-500" />
                        Price Comparison Across Stores
                      </div>
                      <span className="text-xs text-gray-500">
                        Avg: {formatCurrency(activeItem.averageUnitPrice, currency)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Lowest Price */}
                      <div className="p-2.5 rounded-lg bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Cheapest Store
                          </span>
                          <div className="font-bold text-gray-900 dark:text-white mt-0.5">
                            {activeItem.minPrice.store}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {formatDate(activeItem.minPrice.date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-sm text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(activeItem.minPrice.price, currency)}
                          </span>
                        </div>
                      </div>

                      {/* Highest Price */}
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Highest Price
                          </span>
                          <div className="font-bold text-gray-900 dark:text-white mt-0.5">
                            {activeItem.maxPrice.store}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {formatDate(activeItem.maxPrice.date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-sm text-rose-700 dark:text-rose-400">
                            {formatCurrency(activeItem.maxPrice.price, currency)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price difference callout */}
                    {activeItem.maxPrice.price > activeItem.minPrice.price && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        💡 Buying {activeItem.cleanName} at {activeItem.minPrice.store} saved you{' '}
                        <span className="font-bold">
                          {formatCurrency(
                            activeItem.maxPrice.price - activeItem.minPrice.price,
                            currency
                          )}
                        </span>{' '}
                        compared to {activeItem.maxPrice.store}!
                      </p>
                    )}
                  </div>
                )}

                {/* Purchase History Timeline */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Purchase History ({activeItem.history.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {activeItem.history.map((record, idx) => {
                      // Compare with the prior purchase chronologically (idx + 1)
                      const prior = activeItem.history[idx + 1];
                      let historyDiff = 0;
                      if (prior) {
                        historyDiff = Math.round((record.unitPrice - prior.unitPrice) * 100) / 100;
                      }

                      return (
                        <div
                          key={`${record.receiptId}-${idx}`}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                            historyDiff > 0
                              ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 hover:border-emerald-500'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <span>{record.store}</span>
                              {idx === 0 && (
                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold px-1.5 py-0.2 rounded">
                                  Latest
                                </span>
                              )}
                              {prior && historyDiff > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                  <ArrowUpRight className="w-3 h-3 stroke-[3] text-rose-600" />
                                  +{formatCurrency(historyDiff, currency)} vs prior
                                </span>
                              )}
                              {prior && historyDiff < 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  <ArrowDownRight className="w-3 h-3 stroke-[3] text-emerald-600" />
                                  -{formatCurrency(Math.abs(historyDiff), currency)} vs prior
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {record.fullName}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {formatDate(record.date)} ({getRelativeTime(record.date)}) &bull; Qty:{' '}
                              {record.quantity} {record.unit || 'pack'}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center justify-end gap-1">
                              <span>{formatCurrency(record.unitPrice, currency)}</span>
                              <span className="text-[10px] text-gray-400 font-normal">/unit</span>
                            </div>
                            <div className="text-[11px] text-gray-500">
                              Total: {formatCurrency(record.totalPrice, currency)}
                            </div>
                            {onSelectReceipt && (
                              <button
                                onClick={() => onSelectReceipt(record.receiptId)}
                                className="text-[10px] text-emerald-600 hover:underline mt-0.5 block"
                              >
                                View Bill
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
              <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {items.length === 0 ? 'No items tracked yet' : 'No matching items found'}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {items.length === 0
                    ? 'Scan a receipt from DMart, Smart Bazaar, or any shop to track items and compare prices.'
                    : 'Try clearing your search query or switching to another category.'}
                </p>
              </div>

              {items.length === 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  {onOpenScanner && (
                    <button
                      onClick={onOpenScanner}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                    >
                      Scan Receipt
                    </button>
                  )}
                  {onLoadDemoData && (
                    <button
                      onClick={onLoadDemoData}
                      className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold transition"
                    >
                      Load Sample Bills
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: List of All Tracked Items with Price Increase Filter */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Tracked Items ({filteredItems.length})
            </h3>
            <span className="text-xs text-gray-400">Click to inspect</span>
          </div>

          {/* Quick Filter Buttons: All | Price Increased | Price Decreased */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/80 text-xs">
            <button
              onClick={() => setPriceTrendFilter('all')}
              className={`flex-1 py-1 px-2 rounded-lg font-bold text-center transition-all ${
                priceTrendFilter === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setPriceTrendFilter('increased')}
              className={`flex-1 py-1 px-2 rounded-lg font-bold text-center transition-all flex items-center justify-center gap-1 ${
                priceTrendFilter === 'increased'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              <ArrowUpRight className="w-3 h-3 stroke-[3]" />
              Price Hike ({increasedCount})
            </button>
            <button
              onClick={() => setPriceTrendFilter('decreased')}
              className={`flex-1 py-1 px-2 rounded-lg font-bold text-center transition-all flex items-center justify-center gap-1 ${
                priceTrendFilter === 'decreased'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              <ArrowDownRight className="w-3 h-3 stroke-[3]" />
              Dropped ({decreasedCount})
            </button>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {filteredItems.map((item) => {
              const isSelected =
                activeItem && activeItem.cleanName.toLowerCase() === item.cleanName.toLowerCase();
              return (
                <button
                  key={item.cleanName}
                  onClick={() => setSelectedCleanName(item.cleanName)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 shadow-sm'
                      : item.isPriceIncreased
                      ? 'bg-white dark:bg-gray-900 border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{CATEGORIES[item.category]?.icon || '📦'}</span>
                      <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white capitalize truncate">
                        {item.cleanName}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        ({item.purchaseCount}x)
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
                      <Store className="w-3 h-3 text-gray-400" />
                      <span>{item.lastStore}</span>
                      <span>&bull;</span>
                      <span>{formatDate(item.lastPurchasedDate)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-0.5">
                    <div className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                      {formatCurrency(item.lastUnitPrice, currency)}
                    </div>

                    {/* RED ARROW INDICATOR FOR PRICE INCREASE */}
                    {item.isPriceIncreased && (
                      <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[10px] font-black">
                        <ArrowUpRight className="w-3 h-3 text-rose-600 stroke-[3]" />
                        <span>+{formatCurrency(item.priceChange!, currency)}</span>
                      </div>
                    )}

                    {/* GREEN ARROW INDICATOR FOR PRICE DROP */}
                    {item.isPriceDecreased && (
                      <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-[10px] font-black">
                        <ArrowDownRight className="w-3 h-3 text-emerald-600 stroke-[3]" />
                        <span>-{formatCurrency(Math.abs(item.priceChange!), currency)}</span>
                      </div>
                    )}

                    {!item.isPriceIncreased && !item.isPriceDecreased && (
                      <div className="text-[10px] text-gray-400">
                        {getRelativeTime(item.lastPurchasedDate)}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
