import React, { useState } from 'react';
import {
  Sparkles,
  X,
  ThumbsUp,
  MessageSquare,
  Clock,
  Send,
  CheckCircle2,
  ShieldCheck,
  Receipt,
  Users,
  Smartphone,
  Globe,
  BellRing,
} from 'lucide-react';

interface SuggestionItem {
  id: string;
  title: string;
  category: string;
  badge: string;
  description: string;
  impact: string;
  icon: React.ReactNode;
  upvotes: number;
}

const INITIAL_SUGGESTIONS: SuggestionItem[] = [
  {
    id: 'sugg-1',
    title: 'WhatsApp & Telegram Bill Drop Bot',
    category: 'Capture & Input',
    badge: 'Popular Request',
    description:
      'Forward printed receipts or PDF bills directly to a secure Logify WhatsApp bot number. It extracts products, prices, and store details via Gemini and syncs automatically into your account without needing to open the app.',
    impact: 'Cuts receipt entry friction down to 2 seconds while leaving the grocery checkout.',
    icon: <Smartphone className="w-5 h-5 text-emerald-500" />,
    upvotes: 42,
  },
  {
    id: 'sugg-2',
    title: 'Grocery Inflation & Price Spike Alert',
    category: 'Price Intelligence',
    badge: 'High Value',
    description:
      'Automated price intelligence detecting sudden spikes (e.g. +15% on sunflower oil or atta). Alerts you when an item has spiked and recommends nearby stores where the item was recorded cheaper.',
    impact: 'Saves typical households ₹1,200–₹3,000 monthly on regular pantry staples.',
    icon: <BellRing className="w-5 h-5 text-rose-500" />,
    upvotes: 38,
  },
  {
    id: 'sugg-3',
    title: 'Multilingual Vernacular Receipt Support',
    category: 'AI & OCR',
    badge: 'India Specific',
    description:
      'Support for handwritten and local language bills (Hindi, Tamil, Kannada, Marathi, Telugu, Bengali) commonly issued by local Kirana, Mandi, and neighborhood provision stores.',
    impact: 'Expands tracking beyond supermarkets to 100% of daily grocery spending.',
    icon: <Globe className="w-5 h-5 text-indigo-500" />,
    upvotes: 31,
  },
  {
    id: 'sugg-4',
    title: 'Split Bill & Roommate Expense Settlement',
    category: 'Finance & Sharing',
    badge: 'Social',
    description:
      'Tag items on a receipt to specific roommates or family members (e.g. "Personal snacks vs Shared household"). Automatically generates UPI payment links (GPay, PhonePe, Paytm).',
    impact: 'Ends awkward manual calculations after group DMart or Costco runs.',
    icon: <Users className="w-5 h-5 text-cyan-500" />,
    upvotes: 27,
  },
  {
    id: 'sugg-5',
    title: 'Product Expiry & Appliance Warranty Vault',
    category: 'Pantry Management',
    badge: 'Convenience',
    description:
      'For electronics, cosmetics, and packaged foods, Logify detects warranty durations and expiration dates, sending a reminder before expiry or return policy cutoff.',
    impact: 'Never miss an appliance warranty claim or let perishable items spoil in the fridge.',
    icon: <Clock className="w-5 h-5 text-amber-500" />,
    upvotes: 24,
  },
  {
    id: 'sugg-6',
    title: 'Tax Deduction & CA Export (GST / HRA / Medical)',
    category: 'Accounting',
    badge: 'Tax Season',
    description:
      'One-click export of categorized expenses filterable by business reimbursements, pharmacy medicines (80D), and home improvement with original receipt photo attachments for tax filing.',
    impact: 'Simplifies year-end tax computations and reimbursement submissions.',
    icon: <Receipt className="w-5 h-5 text-violet-500" />,
    upvotes: 19,
  },
];

interface SuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuggestionsModal: React.FC<SuggestionsModalProps> = ({ isOpen, onClose }) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>(INITIAL_SUGGESTIONS);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());
  const [customIdea, setCustomIdea] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  if (!isOpen) return null;

  const handleToggleVote = (id: string) => {
    const nextVoted = new Set(upvotedIds);
    const hasVoted = nextVoted.has(id);

    if (hasVoted) {
      nextVoted.delete(id);
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, upvotes: s.upvotes - 1 } : s))
      );
    } else {
      nextVoted.add(id);
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, upvotes: s.upvotes + 1 } : s))
      );
    }
    setUpvotedIds(nextVoted);
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIdea.trim()) return;

    const newSuggestion: SuggestionItem = {
      id: `custom-${Date.now()}`,
      title: customIdea.trim(),
      category: 'Community Suggestion',
      badge: 'Your Idea',
      description: 'Custom feature idea contributed by you.',
      impact: 'Under evaluation for Logify roadmap.',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      upvotes: 1,
    };

    setSuggestions([newSuggestion, ...suggestions]);
    setUpvotedIds((prev) => new Set(prev).add(newSuggestion.id));
    setCustomIdea('');
    setSubmittedMessage(true);
    setTimeout(() => setSubmittedMessage(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-700 via-teal-800 to-cyan-900 text-white flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-200 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Enhancement Suggestions &amp; Future Features
            </div>
            <h2 className="text-lg sm:text-xl font-black">Logify Feature Roadmap</h2>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Vote on planned capabilities or suggest enhancements you would love to see.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {submittedMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Thank you! Your feature enhancement suggestion was added to the voting list.
            </div>
          )}

          {/* Quick Submit Idea */}
          <form onSubmit={handleSubmitCustom} className="flex gap-2">
            <input
              type="text"
              value={customIdea}
              onChange={(e) => setCustomIdea(e.target.value)}
              placeholder="Suggest a new enhancement or feature for Logify..."
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition"
            >
              <Send className="w-3.5 h-3.5" />
              Submit
            </button>
          </form>

          {/* Feature List */}
          <div className="space-y-3">
            {suggestions.map((item) => {
              const isVoted = upvotedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 hover:border-emerald-500/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xs shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                          {item.title}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          {item.badge}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          &bull; {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {item.description}
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        💡 Benefit: {item.impact}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleVote(item.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shrink-0 transition active:scale-95 ${
                      isVoted
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-500'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${isVoted ? 'fill-white' : ''}`} />
                    <span>{item.upvotes}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <span>Logify is powered by Gemini AI OCR &amp; Firebase</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
