import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ItemTracker } from './components/ItemTracker';
import { ReceiptList } from './components/ReceiptList';
import { CategoryView } from './components/CategoryView';
import { ReceiptScanner } from './components/ReceiptScanner';
import { ReceiptDetailModal } from './components/ReceiptDetailModal';
import { ManualReceiptModal } from './components/ManualReceiptModal';
import { SuggestionsModal } from './components/SuggestionsModal';
import { Receipt, UserProfile, AppColorTheme } from './types';
import {
  loadReceipts,
  saveReceipts,
  loadCurrency,
  saveCurrency,
  loadSampleReceiptsData,
  getAllTrackedItems,
  loadUserProfile,
  saveUserProfile,
  loadTheme,
  saveTheme,
  loadColorTheme,
  saveColorTheme,
  loadCustomApiKey,
  saveCustomApiKey,
  loadSelectedModel,
  saveSelectedModel,
} from './utils/storage';
import {
  auth,
  saveReceiptToFirestore,
  deleteReceiptFromFirestore,
  subscribeToUserReceipts,
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { CheckCircle2, Cloud } from 'lucide-react';

export default function App() {
  const [receipts, setReceipts] = useState<Receipt[]>(() => loadReceipts());
  const [currency, setCurrencyState] = useState<string>(() => loadCurrency());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracker' | 'receipts' | 'categories'>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User Profile
  const [user, setUser] = useState<UserProfile>(() => loadUserProfile());

  // Dark / Light Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadTheme());

  // App Accent Color Theme
  const [colorTheme, setColorTheme] = useState<AppColorTheme>(() => loadColorTheme());

  // Custom User Gemini API key
  const [customApiKey, setCustomApiKey] = useState<string>(() => loadCustomApiKey());

  // Selected Gemini Model for OCR
  const [selectedModel, setSelectedModel] = useState<string>(() => loadSelectedModel());

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  // Success toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Apply dark theme class to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Apply app color theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-color-theme', colorTheme);
  }, [colorTheme]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const updatedProfile: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Google User',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || undefined,
          isLoggedIn: true,
        };
        setUser(updatedProfile);
        saveUserProfile(updatedProfile);
      } else {
        // Only reset if user was logged in with Firebase UID
        if (user.isLoggedIn && user.id && user.id.length > 20) {
          const guest: UserProfile = { id: '', name: '', email: '', isLoggedIn: false };
          setUser(guest);
          saveUserProfile(guest);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to real-time Firestore receipts when logged in
  useEffect(() => {
    if (!user.isLoggedIn || !user.id) {
      return;
    }

    const unsubscribe = subscribeToUserReceipts(
      user.id,
      (cloudReceipts) => {
        setReceipts(cloudReceipts);
        saveReceipts(cloudReceipts);
      },
      (err) => {
        console.warn('Firestore subscription note:', err);
      }
    );

    return () => unsubscribe();
  }, [user.isLoggedIn, user.id]);

  const handleToggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    saveTheme(newTheme);
  };

  const handleSelectColorTheme = (newColor: AppColorTheme) => {
    setColorTheme(newColor);
    saveColorTheme(newColor);
    showToast(`Color theme set to ${newColor.toUpperCase()}`);
  };

  const handleUpdateUser = (newUser: UserProfile) => {
    setUser(newUser);
    saveUserProfile(newUser);
    showToast(newUser.isLoggedIn ? `Welcome, ${newUser.name}!` : 'Signed out.');
  };

  const handleSaveApiKey = (newKey: string) => {
    setCustomApiKey(newKey);
    saveCustomApiKey(newKey);
    showToast(newKey ? 'Personal Gemini API key active!' : 'Reset to default system API key.');
  };

  const handleSelectModel = (model: string) => {
    setSelectedModel(model);
    saveSelectedModel(model);
    showToast(`Gemini OCR model set to ${model}`);
  };

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    saveCurrency(c);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Save new receipt (both locally and to cloud if logged in)
  const handleSaveReceipt = async (newReceipt: Receipt) => {
    const updated = [newReceipt, ...receipts];
    setReceipts(updated);
    saveReceipts(updated);

    if (user.isLoggedIn && user.id) {
      try {
        await saveReceiptToFirestore(user.id, newReceipt);
        showToast(`Bill from ${newReceipt.storeName} saved & synced to your Google account!`);
      } catch (e) {
        console.error('Cloud sync error:', e);
        showToast(`Bill from ${newReceipt.storeName} saved locally.`);
      }
    } else {
      showToast(`Bill from ${newReceipt.storeName} saved! Added ${newReceipt.items.length} items to tracker.`);
    }

    setActiveTab('tracker');
    if (newReceipt.items.length > 0) {
      setSearchQuery(newReceipt.items[0].cleanName);
    }
  };

  // Delete receipt (both locally and from cloud)
  const handleDeleteReceipt = async (id: string) => {
    const updated = receipts.filter((r) => r.id !== id);
    setReceipts(updated);
    saveReceipts(updated);

    if (user.isLoggedIn && user.id) {
      try {
        await deleteReceiptFromFirestore(user.id, id);
      } catch (e) {
        console.error('Cloud delete error:', e);
      }
    }

    showToast('Receipt deleted.');
  };

  // Explicit user action to load demo bills (not forced automatically)
  const handleLoadDemoBills = () => {
    const demoBills = loadSampleReceiptsData();
    setReceipts(demoBills);
    saveReceipts(demoBills);
    setSearchQuery('Cooking Oil');
    setActiveTab('tracker');
    showToast('Loaded demo bills from DMart, Smart Bazaar & Reliance.');
  };

  // Tracked items analytics
  const trackedItems = useMemo(() => {
    return getAllTrackedItems(receipts);
  }, [receipts]);

  const selectedReceipt = useMemo(() => {
    if (!selectedReceiptId) return null;
    return receipts.find((r) => r.id === selectedReceiptId) || null;
  }, [receipts, selectedReceiptId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors w-full overflow-x-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top duration-300 max-w-sm">
          <div className="px-4 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xl text-xs font-semibold flex items-center gap-2 border border-gray-700/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenManualModal={() => setIsManualModalOpen(true)}
        onOpenSuggestions={() => setIsSuggestionsOpen(true)}
        onLoadDemoData={handleLoadDemoBills}
        receiptsCount={receipts.length}
        trackedItemsCount={trackedItems.length}
        currency={currency}
        setCurrency={setCurrency}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        onUpdateUser={handleUpdateUser}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        colorTheme={colorTheme}
        onSelectColorTheme={handleSelectColorTheme}
        customApiKey={customApiKey}
        onSaveApiKey={handleSaveApiKey}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
      />

      {/* Main Content Area - strictly bounded to prevent horizontal scrolling */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 min-w-0 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <Dashboard
            receipts={receipts}
            trackedItems={trackedItems}
            currency={currency}
            onOpenScanner={() => setIsScannerOpen(true)}
            onGoToTracker={(query) => {
              if (query) setSearchQuery(query);
              setActiveTab('tracker');
            }}
            onSelectReceipt={(id) => setSelectedReceiptId(id)}
            onLoadDemoData={handleLoadDemoBills}
            user={user}
          />
        )}

        {activeTab === 'tracker' && (
          <ItemTracker
            items={trackedItems}
            currency={currency}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectReceipt={(id) => setSelectedReceiptId(id)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onLoadDemoData={handleLoadDemoBills}
          />
        )}

        {activeTab === 'receipts' && (
          <ReceiptList
            receipts={receipts}
            currency={currency}
            onSelectReceipt={(id) => setSelectedReceiptId(id)}
            onDeleteReceipt={handleDeleteReceipt}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenManualModal={() => setIsManualModalOpen(true)}
            onLoadDemoData={handleLoadDemoBills}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryView
            receipts={receipts}
            currency={currency}
            onSelectProduct={(cleanName) => {
              setSearchQuery(cleanName);
              setActiveTab('tracker');
            }}
          />
        )}
      </main>

      {/* Modals */}
      <ReceiptScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSaveReceipt={handleSaveReceipt}
        currency={currency}
        customApiKey={customApiKey}
      />

      <ReceiptDetailModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceiptId(null)}
        onDeleteReceipt={handleDeleteReceipt}
        currency={currency}
      />

      <ManualReceiptModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSaveReceipt={handleSaveReceipt}
        currency={currency}
        customApiKey={customApiKey}
      />

      <SuggestionsModal
        isOpen={isSuggestionsOpen}
        onClose={() => setIsSuggestionsOpen(false)}
      />
    </div>
  );
}
