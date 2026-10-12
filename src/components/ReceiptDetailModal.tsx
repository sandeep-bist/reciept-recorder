import React from 'react';
import { X, Calendar, Store, Tag, ReceiptText, Trash2 } from 'lucide-react';
import { Receipt } from '../types';
import { CATEGORIES, formatCurrency, formatDate } from '../utils/formatters';

interface ReceiptDetailModalProps {
  receipt: Receipt | null;
  onClose: () => void;
  onDeleteReceipt?: (id: string) => void;
  currency: string;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  receipt,
  onClose,
  onDeleteReceipt,
  currency,
}) => {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                {receipt.storeName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(receipt.date)} &bull; {receipt.billNumber || 'Bill Details'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Metadata badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-800 text-xs">
            <div>
              <span className="text-[10px] text-gray-400 block">Date</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {formatDate(receipt.date)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block">Payment</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {receipt.paymentMethod || 'UPI / Cash'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block">Items Count</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {receipt.items.length} items
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block">Location</span>
              <span className="font-bold text-gray-900 dark:text-white truncate block">
                {receipt.storeLocation || 'Main Store'}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Purchased Items
            </h4>
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
              {receipt.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 flex items-center justify-between gap-3 text-xs bg-white dark:bg-gray-900 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span>{CATEGORIES[item.category]?.icon || '📦'}</span>
                      <span>{item.name}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-2">
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        [{item.cleanName}]
                      </span>
                      <span>&bull;</span>
                      <span>
                        Qty: {item.quantity} {item.unit || 'pack'} @{' '}
                        {formatCurrency(item.unitPrice, currency)}
                      </span>
                      {item.discount ? (
                        <span className="text-emerald-600 font-semibold">
                          (Saved {formatCurrency(item.discount, currency)})
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-sm text-gray-900 dark:text-white">
                      {formatCurrency(item.totalPrice, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bill summary totals */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-800 space-y-1.5 text-xs">
            {receipt.subtotal && (
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(receipt.subtotal, currency)}</span>
              </div>
            )}
            {receipt.discount ? (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Total Savings / Discount</span>
                <span>-{formatCurrency(receipt.discount, currency)}</span>
              </div>
            ) : null}
            {receipt.tax ? (
              <div className="flex justify-between text-gray-500">
                <span>Estimated Tax (GST/VAT)</span>
                <span>{formatCurrency(receipt.tax, currency)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-extrabold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Grand Total</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {formatCurrency(receipt.total, currency)}
              </span>
            </div>
          </div>

          {/* Notes if any */}
          {receipt.notes && (
            <div className="text-xs text-gray-500 italic p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30">
              &ldquo;{receipt.notes}&rdquo;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between">
          {onDeleteReceipt && (
            <button
              onClick={() => {
                if (confirmDelete) {
                  onDeleteReceipt(receipt.id);
                  onClose();
                } else {
                  setConfirmDelete(true);
                  setTimeout(() => setConfirmDelete(false), 3000);
                }
              }}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {confirmDelete ? 'Confirm Delete?' : 'Delete Bill'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
