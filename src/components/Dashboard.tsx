import React, { useState } from 'react';
import {
  TrendingUp,
  ReceiptText,
  Package,
  Store,
  Sparkles,
  Camera,
  Calendar,
  Search,
  CheckCircle2,
  FileText,
  Cloud,
} from 'lucide-react';
import { Receipt, ItemStats, UserProfile } from '../types';
import {
  getMonthlySpending,
  getCategorySpendingBreakdown,
  getStoreSpendingBreakdown,
} from '../utils/storage';
import { CATEGORIES, formatCurrency, formatDate } from '../utils/formatters';

interface DashboardProps {
  receipts: Receipt[];
  trackedItems: ItemStats[];
  currency: string;
  onOpenScanner: () => void;
  onGoToTracker: (itemQuery?: string) => void;
  onSelectReceipt: (id: string) => void;
  onLoadDemoData?: () => void;
  user?: UserProfile;
}

export const Dashboard: React.FC<DashboardProps> = ({
  receipts,
  trackedItems,
  currency,
  onOpenScanner,
  onGoToTracker,
  onSelectReceipt,
  onLoadDemoData,
  user,
}) => {
  const [chartView, setChartView] = useState<'monthly' | 'categories'>('monthly');

  const monthlyData = getMonthlySpending(receipts);
  const categoryData = getCategorySpendingBreakdown(receipts);
  const storeData = getStoreSpendingBreakdown(receipts);

  // Totals
  const totalSpend = receipts.reduce((sum, r) => sum + r.total, 0);

  // Current month
  const currentMonthKey = new Date().toISOString().substring(0, 7);
  const currentMonthSpend = receipts
    .filter((r) => r.date && r.date.startsWith(currentMonthKey))
    .reduce((sum, r) => sum + r.total, 0);

  // Highest spend category
  const topCategory = categoryData[0];

  // Most visited store
  const topStore = storeData[0];

  // Max value for monthly chart normalization
  const maxMonthSpend = Math.max(...monthlyData.map((m) => m.totalSpend), 100);

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Hero Welcome & Quick Scanner Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-app-hero-banner text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl z-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Logify AI Receipt Scanner &bull; Price Tracker
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Smart Receipt Expense Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
            Snap store bills from DMart, Smart Bazaar, Reliance or local shops. Logify automatically records every purchased item, shows when you last bought it, and flags price increases.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10 w-full sm:w-auto">
          {receipts.length > 0 && (
            <button
              onClick={() => onGoToTracker(trackedItems[0]?.cleanName || 'Cheese')}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-xs sm:text-sm backdrop-blur-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Search className="w-4 h-4" />
              Find Last Bought
            </button>
          )}
          <button
            onClick={onOpenScanner}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-extrabold text-xs sm:text-sm shadow-lg shadow-black/10 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4 text-app-accent" />
            Scan New Bill
          </button>
        </div>
      </div>

      {/* Zero State if no receipts logged */}
      {receipts.length === 0 && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-app-accent-light text-app-accent flex items-center justify-center mx-auto">
            <ReceiptText className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              No bills logged yet
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Snap a photo of your supermarket bill or upload an invoice to start tracking your purchases, grocery categories, and price changes.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenScanner}
              className="px-4 py-2.5 rounded-xl bg-app-accent hover:bg-app-accent-hover text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition"
            >
              <Camera className="w-4 h-4" />
              Scan Store Bill Now
            </button>
            {onLoadDemoData && (
              <button
                onClick={onLoadDemoData}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs sm:text-sm flex items-center gap-2 transition"
              >
                <FileText className="w-4 h-4 text-app-accent" />
                Explore Demo Bills (DMart &amp; Smart Bazaar)
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total This Month */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold">
            <span>This Month Spend</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white mt-2 truncate">
            {formatCurrency(currentMonthSpend, currency)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Current month total</div>
        </div>

        {/* Card 2: Total Overall Spend */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold">
            <span>Total Tracked Spend</span>
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white mt-2 truncate">
            {formatCurrency(totalSpend, currency)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Across all {receipts.length} bills</div>
        </div>

        {/* Card 3: Products Tracked */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold">
            <span>Unique Products</span>
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white mt-2">
            {trackedItems.length} items
          </div>
          <div className="text-[11px] text-gray-400 mt-1">With price histories</div>
        </div>

        {/* Card 4: Top Store */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold">
            <span>Top Store</span>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
              <Store className="w-4 h-4" />
            </span>
          </div>
          <div className="text-base sm:text-xl font-black text-gray-900 dark:text-white mt-2 truncate">
            {topStore ? topStore.store.split(' ')[0] : 'None'}
          </div>
          <div className="text-[11px] text-gray-400 mt-1 truncate">
            {topStore ? `${formatCurrency(topStore.total, currency)} (${topStore.count} bills)` : '—'}
          </div>
        </div>
      </div>

      {/* Main Expense Trends Chart Section (if data present) */}
      {receipts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Left: Monthly Expense Trends Visualizer */}
          <div className="lg:col-span-8 p-4 sm:p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Monthly Spending Trends
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Visual history of your grocery &amp; supermarket bills
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setChartView('monthly')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    chartView === 'monthly'
                      ? 'bg-white dark:bg-gray-700 text-app-accent font-bold shadow-xs'
                      : 'text-gray-500'
                  }`}
                >
                  Monthly Bars
                </button>
                <button
                  onClick={() => setChartView('categories')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    chartView === 'categories'
                      ? 'bg-white dark:bg-gray-700 text-app-accent font-bold shadow-xs'
                      : 'text-gray-500'
                  }`}
                >
                  Category Shares
                </button>
              </div>
            </div>

            {chartView === 'monthly' ? (
              <div className="space-y-4 pt-3">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 items-end h-44 sm:h-52 pb-2 border-b border-gray-100 dark:border-gray-800">
                  {monthlyData.map((m) => {
                    const barHeightPct = Math.max(15, Math.round((m.totalSpend / maxMonthSpend) * 100));
                    return (
                      <div
                        key={m.monthKey}
                        className="flex flex-col items-center justify-end h-full group"
                      >
                        <div className="text-[10px] sm:text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatCurrency(m.totalSpend, currency)}
                        </div>
                        <div
                          style={{ height: `${barHeightPct}%` }}
                          className="w-full max-w-[48px] rounded-t-xl bg-app-logo hover:opacity-90 transition-all shadow-xs relative flex items-center justify-center"
                        >
                          <span className="text-[9px] sm:text-[10px] font-bold text-white px-0.5 truncate">
                            {formatCurrency(m.totalSpend, currency)}
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 mt-2 truncate w-full text-center">
                          {m.monthLabel}
                        </span>
                        <span className="text-[9px] text-gray-400">
                          {m.receiptCount} bill{m.receiptCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="pt-2 space-y-3">
                {categoryData.slice(0, 6).map((c) => (
                  <div key={c.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <span>{CATEGORIES[c.category]?.icon || '📦'}</span>
                        {c.category}
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {formatCurrency(c.total, currency)} ({Math.round(c.percentage)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        style={{ width: `${c.percentage}%` }}
                        className="h-full rounded-full bg-app-accent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Supermarket Distribution Breakdown */}
          <div className="lg:col-span-4 p-4 sm:p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              Supermarket Visits
            </h3>

            <div className="space-y-3">
              {storeData.map((s) => (
                <div key={s.store} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                    <span className="truncate">{s.store}</span>
                    <span>{formatCurrency(s.total, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{s.count} bills</span>
                    <span>{Math.round(s.percentage)}% of spend</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Scanned Bills Section */}
      {receipts.length > 0 && (
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Recent Bills Scanned ({receipts.length})
              </h2>
            </div>
            <button
              onClick={onOpenScanner}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              + Scan Another Bill
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {receipts.slice(0, 4).map((r) => (
              <div
                key={r.id}
                onClick={() => onSelectReceipt(r.id)}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-emerald-500 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                    {r.storeName}
                  </span>
                  <span className="text-[10px] text-gray-500 bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                    {formatDate(r.date)}
                  </span>
                </div>

                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 truncate">
                  {r.items.map((i) => i.cleanName).join(', ')}
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                  <span className="text-[11px] text-gray-400">
                    {r.items.length} item{r.items.length > 1 ? 's' : ''}
                  </span>
                  <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                    {formatCurrency(r.total, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
