import React from 'react';
import {
  Camera,
  Search,
  LayoutDashboard,
  ReceiptText,
  Tags,
  PlusCircle,
  Lightbulb,
} from 'lucide-react';
import { UserProfile, AppColorTheme } from '../types';
import { SettingsDropdown } from './SettingsDropdown';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  activeTab: 'dashboard' | 'tracker' | 'receipts' | 'categories';
  setActiveTab: (tab: 'dashboard' | 'tracker' | 'receipts' | 'categories') => void;
  onOpenScanner: () => void;
  onOpenManualModal: () => void;
  onOpenSuggestions: () => void;
  onLoadDemoData: () => void;
  receiptsCount: number;
  trackedItemsCount: number;
  currency: string;
  setCurrency: (c: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  theme: 'light' | 'dark';
  onToggleTheme: (theme: 'light' | 'dark') => void;
  colorTheme?: AppColorTheme;
  onSelectColorTheme?: (color: AppColorTheme) => void;
  customApiKey: string;
  onSaveApiKey: (key: string) => void;
  selectedModel?: string;
  onSelectModel?: (model: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenScanner,
  onOpenManualModal,
  onOpenSuggestions,
  receiptsCount,
  currency,
  setCurrency,
  searchQuery,
  setSearchQuery,
  user,
  onUpdateUser,
  theme,
  onToggleTheme,
  colorTheme = 'emerald',
  onSelectColorTheme,
  customApiKey,
  onSaveApiKey,
  selectedModel,
  onSelectModel,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 text-left group focus:outline-none min-w-0"
            >
              {/* Sleek Logify Custom Icon with Dynamic Color Gradient */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-app-logo flex items-center justify-center text-white shadow-md shadow-app-accent group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                  <path d="M8 7h8" />
                  <path d="M8 11h8" />
                  <path d="M8 15h5" />
                  <circle cx="16" cy="15" r="1.5" fill="currentColor" />
                </svg>
              </div>

              <div className="min-w-0">
                <span className="font-black text-lg sm:text-xl text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  Logify
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-app-accent-light text-app-accent-light border border-app-accent-light">
                    AI
                  </span>
                </span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block truncate">
                  Smart Receipt Scanner &bull; Price Tracker
                </p>
              </div>
            </button>
          </div>

          {/* Quick Search Item (Desktop) */}
          <div className="flex-1 max-w-sm hidden md:block mx-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search 'Cheese', 'Oil', 'Atta'..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'tracker') {
                    setActiveTab('tracker');
                  }
                }}
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-xl bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-app-accent focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* PWA Install Button (iOS / Android / Desktop) */}
            <PWAInstallButton />

            {/* Currency selector */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="text-xs font-semibold px-2 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none hidden sm:block"
              title="Select display currency"
            >
              <option value="₹">₹ INR</option>
              <option value="$">$ USD</option>
              <option value="€">€ EUR</option>
              <option value="£">£ GBP</option>
            </select>

            {/* Feature Suggestions Roadmap Button */}
            <button
              onClick={onOpenSuggestions}
              title="View & vote on feature suggestions"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold transition"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Roadmap</span>
            </button>

            {/* Add Manual receipt */}
            <button
              onClick={onOpenManualModal}
              className="hidden xl:flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Manual
            </button>

            {/* Scan Receipt Primary Action */}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 sm:py-2 rounded-xl bg-app-accent hover:bg-app-accent-hover text-white shadow-xs shadow-app-accent active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden xs:inline">Scan Bill</span>
            </button>

            {/* Top Right Dropdown: Google Login, Color Theme, Dark/Light Mode, Gemini Model & Custom API Key */}
            <SettingsDropdown
              user={user}
              onUpdateUser={onUpdateUser}
              theme={theme}
              onToggleTheme={onToggleTheme}
              colorTheme={colorTheme}
              onSelectColorTheme={onSelectColorTheme}
              customApiKey={customApiKey}
              onSaveApiKey={onSaveApiKey}
              selectedModel={selectedModel}
              onSelectModel={onSelectModel}
              onOpenSuggestions={onOpenSuggestions}
            />
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 border-t border-gray-100 dark:border-gray-800/60 pt-1 overflow-x-auto scrollbar-none max-w-full">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'dashboard'
                ? 'border-app-accent text-app-accent font-bold'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'tracker'
                ? 'border-app-accent text-app-accent font-bold'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Search className="w-4 h-4" />
            Last Bought Tracker
          </button>

          <button
            onClick={() => setActiveTab('receipts')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'receipts'
                ? 'border-app-accent text-app-accent font-bold'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            All Bills
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
              {receiptsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'categories'
                ? 'border-app-accent text-app-accent font-bold'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Tags className="w-4 h-4" />
            Categories
          </button>
        </div>
      </div>
    </header>
  );
};
