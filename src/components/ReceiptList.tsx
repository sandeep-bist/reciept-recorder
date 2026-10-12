import React, { useState } from 'react';
import {
  Search,
  Download,
  PlusCircle,
  ReceiptText,
  Calendar,
  Store,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { Receipt } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ReceiptListProps {
  receipts: Receipt[];
  currency: string;
  onSelectReceipt: (id: string) => void;
  onDeleteReceipt: (id: string) => void;
  onOpenScanner: () => void;
  onOpenManualModal: () => void;
  onLoadDemoData?: () => void;
}

export const ReceiptList: React.FC<ReceiptListProps> = ({
  receipts,
  currency,
  onSelectReceipt,
  onDeleteReceipt,
  onOpenScanner,
  onOpenManualModal,
  onLoadDemoData,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Unique stores for filter dropdown
  const uniqueStores = Array.from(new Set(receipts.map((r) => r.storeName)));

  const filteredReceipts = receipts.filter((r) => {
    if (storeFilter !== 'ALL' && r.storeName !== storeFilter) return false;
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      r.storeName.toLowerCase().includes(q) ||
      r.date.includes(q) ||
      (r.billNumber && r.billNumber.toLowerCase().includes(q)) ||
      r.items.some(
        (i) => i.name.toLowerCase().includes(q) || i.cleanName.toLowerCase().includes(q)
      )
    );
  });

  const exportCSV = () => {
    const rows = [
      ['Receipt ID', 'Store', 'Date', 'Bill No', 'Total', 'Item Full Name', 'Generic Item', 'Category', 'Quantity', 'Unit Price', 'Item Total'],
    ];

    receipts.forEach((r) => {
      r.items.forEach((item) => {
        rows.push([
          r.id,
          `"${r.storeName}"`,
          r.date,
          r.billNumber || '',
          r.total.toString(),
          `"${item.name.replace(/"/g, '""')}"`,
          `"${item.cleanName.replace(/"/g, '""')}"`,
          item.category,
          item.quantity.toString(),
          item.unitPrice.toString(),
          item.totalPrice.toString(),
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `billtrack_receipts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-emerald-600" />
            All Bills &amp; Receipts ({receipts.length})
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            View full itemized bills, export purchase history, or add receipts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportCSV}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={onOpenManualModal}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Manual Bill
          </button>
          <button
            onClick={onOpenScanner}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            + Scan Bill
          </button>
        </div>
      </div>

      {/* Filter and search controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter by store, date (YYYY-MM-DD), or item name..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-app-accent"
          />
        </div>

        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
        >
          <option value="ALL">All Supermarkets ({uniqueStores.length})</option>
          {uniqueStores.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Receipts list */}
      <div className="space-y-3">
        {filteredReceipts.map((receipt) => (
          <div
            key={receipt.id}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-app-accent shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-app-accent shrink-0" />
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  {receipt.storeName}
                </h3>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                  {formatDate(receipt.date)}
                </span>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xl">
                Items: {receipt.items.map((i) => `${i.cleanName} (${i.quantity})`).join(', ')}
              </p>

              <div className="text-[11px] text-gray-400 flex items-center gap-3 pt-0.5">
                <span>{receipt.items.length} items logged</span>
                {receipt.billNumber && <span>Bill #{receipt.billNumber}</span>}
                {receipt.paymentMethod && <span>via {receipt.paymentMethod}</span>}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
              <div className="sm:text-right">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total Bill</div>
                <div className="font-black text-base sm:text-lg text-gray-900 dark:text-white">
                  {formatCurrency(receipt.total, currency)}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSelectReceipt(receipt.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 font-semibold text-xs flex items-center gap-1 transition-colors"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (deletingId === receipt.id) {
                      onDeleteReceipt(receipt.id);
                      setDeletingId(null);
                    } else {
                      setDeletingId(receipt.id);
                      setTimeout(() => setDeletingId(null), 3000);
                    }
                  }}
                  className={`p-1.5 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 ${
                    deletingId === receipt.id
                      ? 'bg-red-600 text-white px-2 py-1'
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                  }`}
                  title={deletingId === receipt.id ? 'Click to confirm delete' : 'Delete receipt'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deletingId === receipt.id && <span>Delete?</span>}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredReceipts.length === 0 && (
          <div className="text-center p-8 sm:p-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
            <ReceiptText className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
            <h3 className="font-bold text-gray-900 dark:text-white">
              {receipts.length === 0 ? 'No receipts logged yet' : 'No matching receipts'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {receipts.length === 0
                ? 'Scan a receipt photo or enter a store bill manually to get started.'
                : 'Try adjusting your search filter or store dropdown.'}
            </p>
            {receipts.length === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={onOpenScanner}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                >
                  Scan Receipt
                </button>
                {onLoadDemoData && (
                  <button
                    onClick={onLoadDemoData}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold transition"
                  >
                    Explore Sample Bills
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
