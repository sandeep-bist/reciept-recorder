import React, { useState } from 'react';
import { X, Plus, Trash2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Receipt, ReceiptItem, ItemCategory } from '../types';
import { ALL_CATEGORIES, CATEGORIES, formatCurrency } from '../utils/formatters';

interface ManualReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReceipt: (receipt: Receipt) => void;
  currency: string;
  customApiKey?: string;
}

export const ManualReceiptModal: React.FC<ManualReceiptModalProps> = ({
  isOpen,
  onClose,
  onSaveReceipt,
  currency,
  customApiKey,
}) => {
  const [storeName, setStoreName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [billNumber, setBillNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [items, setItems] = useState<ReceiptItem[]>([
    {
      id: `item-${Date.now()}-1`,
      name: '',
      cleanName: '',
      category: 'Dairy',
      quantity: 1,
      unit: 'pack',
      unitPrice: 0,
      totalPrice: 0,
    },
  ]);
  const [isCategorizing, setIsCategorizing] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}-${items.length + 1}`,
        name: '',
        cleanName: '',
        category: 'Groceries & Staples',
        quantity: 1,
        unit: 'pack',
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ReceiptItem, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };

    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(val) : updated[index].quantity;
      const p = field === 'unitPrice' ? Number(val) : updated[index].unitPrice;
      updated[index].totalPrice = Math.round(q * p * 100) / 100;
    }

    // Auto-suggest cleanName if empty
    if (field === 'name' && !updated[index].cleanName) {
      updated[index].cleanName = val.split(' ')[0] || '';
    }

    setItems(updated);
  };

  const handleAutoCategorize = async (index: number) => {
    const itemName = items[index].name;
    if (!itemName) return;
    setIsCategorizing(index);
    try {
      const res = await fetch('/api/categorize-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {}),
        },
        body: JSON.stringify({ itemName, customApiKey: customApiKey || undefined }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const updated = [...items];
        updated[index].cleanName = data.data.cleanName || updated[index].cleanName;
        if (ALL_CATEGORIES.includes(data.data.category)) {
          updated[index].category = data.data.category;
        }
        setItems(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCategorizing(null);
    }
  };

  const grandTotal = items.reduce((sum, it) => sum + (it.totalPrice || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      alert('Please enter a store name (e.g. DMart, Smart Bazaar)');
      return;
    }
    const validItems = items.filter((it) => it.name.trim() || it.cleanName.trim());
    if (validItems.length === 0) {
      alert('Please enter at least one item');
      return;
    }

    const sanitizedItems = validItems.map((it) => ({
      ...it,
      name: it.name.trim() || it.cleanName.trim(),
      cleanName: it.cleanName.trim() || it.name.trim(),
    }));

    const receipt: Receipt = {
      id: `receipt-manual-${Date.now()}`,
      storeName: storeName.trim(),
      date,
      billNumber: billNumber.trim() || `MANUAL-${Math.floor(Math.random() * 90000 + 10000)}`,
      paymentMethod,
      items: sanitizedItems,
      subtotal: grandTotal,
      tax: 0,
      total: grandTotal,
      notes: `Manual receipt entry for ${storeName}`,
      createdAt: new Date().toISOString(),
    };

    onSaveReceipt(receipt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Manual Bill Entry
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add a store receipt without taking a photo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                Store Name *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. DMart, Smart Bazaar"
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Line Items
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-2 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[10px] text-gray-400">Product Full Name</label>
                        <button
                          type="button"
                          onClick={() => handleAutoCategorize(index)}
                          className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5"
                          title="Auto-detect generic name and category using AI"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          {isCategorizing === index ? 'Detecting...' : 'AI Categorize'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="e.g. Amul Cheese Slices 200g"
                        className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mb-0.5">
                        Generic Name
                      </label>
                      <input
                        type="text"
                        value={item.cleanName}
                        onChange={(e) => handleItemChange(index, 'cleanName', e.target.value)}
                        placeholder="e.g. Cheese"
                        className="w-full px-2 py-1.5 rounded border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-gray-400 block mb-0.5">Category</label>
                      <select
                        value={item.category}
                        onChange={(e) =>
                          handleItemChange(index, 'category', e.target.value as ItemCategory)
                        }
                        className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        {ALL_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {CATEGORIES[c]?.icon} {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-1 flex items-end justify-end pb-1">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-200/60 dark:border-gray-700/60">
                    <div>
                      <span className="text-[10px] text-gray-400">Qty:</span>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)
                        }
                        className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400">Unit Price ({currency}):</span>
                      <input
                        type="number"
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-semibold"
                      />
                    </div>
                    <div className="text-right flex flex-col justify-end">
                      <span className="text-[10px] text-gray-400">Total:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formatCurrency(item.totalPrice, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500">Grand Total:</span>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(grandTotal, currency)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save Receipt
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
