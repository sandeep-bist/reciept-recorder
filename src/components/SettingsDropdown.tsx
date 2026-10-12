import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Moon,
  Sun,
  Key,
  LogOut,
  LogIn,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ChevronDown,
  Shield,
  Cpu,
  Info,
  Loader2,
  Cloud,
  Lightbulb,
  Palette,
} from 'lucide-react';
import { UserProfile, AppColorTheme } from '../types';
import { signInWithGoogle, logOut } from '../firebase';

export interface ModelOption {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  recommendation: string;
}

export interface ColorThemeOption {
  id: AppColorTheme;
  name: string;
  badge: string;
  swatchBg: string;
  accentHex: string;
}

export const APP_COLOR_THEMES: ColorThemeOption[] = [
  { id: 'emerald', name: 'Emerald', badge: 'Default Green', swatchBg: 'bg-emerald-500', accentHex: '#059669' },
  { id: 'blue', name: 'Ocean Blue', badge: 'Sapphire', swatchBg: 'bg-blue-600', accentHex: '#2563eb' },
  { id: 'indigo', name: 'Royal Indigo', badge: 'Deep Indigo', swatchBg: 'bg-indigo-600', accentHex: '#4f46e5' },
  { id: 'purple', name: 'Vivid Violet', badge: 'Purple', swatchBg: 'bg-purple-600', accentHex: '#9333ea' },
  { id: 'rose', name: 'Sunset Rose', badge: 'Crimson', swatchBg: 'bg-rose-600', accentHex: '#e11d48' },
  { id: 'amber', name: 'Golden Amber', badge: 'Warm Orange', swatchBg: 'bg-amber-500', accentHex: '#d97706' },
  { id: 'cyan', name: 'Cyber Cyan', badge: 'Teal & Cyan', swatchBg: 'bg-cyan-600', accentHex: '#0891b2' },
];

export const GEMINI_OCR_MODELS: ModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Recommended',
    badgeColor: 'bg-app-accent-light text-app-accent-light border-app-accent-light',
    description: 'Fast, high-fidelity multimodal OCR for grocery and retail receipts.',
    recommendation: '⭐ Best balance of scan speed, line-item accuracy, and low latency.',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    badge: 'Fast & Budget',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
    description: 'Ultra-fast inference with minimal quota and token usage.',
    recommendation: '⚡ Best for high volumes of clean printed supermarket bills.',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    badge: 'High Precision',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300',
    description: 'Deep multimodal reasoning for complex, long, or folded bills.',
    recommendation: '🧠 Best for faded, crumpled, or partially visible receipts.',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Next-Gen',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
    description: 'Next-generation multimodal model preview.',
    recommendation: '🚀 Cutting edge vision intelligence.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    badge: 'Lightweight',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300',
    description: 'Lightweight model variant.',
    recommendation: '⚡ Fast lightweight OCR.',
  },
];

interface SettingsDropdownProps {
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
  onOpenSuggestions?: () => void;
}

export const SettingsDropdown: React.FC<SettingsDropdownProps> = ({
  user,
  onUpdateUser,
  theme,
  onToggleTheme,
  colorTheme = 'emerald',
  onSelectColorTheme,
  customApiKey,
  onSaveApiKey,
  selectedModel = 'gemini-2.5-flash',
  onSelectModel,
  onOpenSuggestions,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Loading state for Google Auth
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // API Key input state
  const [apiKeyInput, setApiKeyInput] = useState(customApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySavedNotice, setApiKeySavedNotice] = useState(false);

  // Custom Model input state
  const [modelInput, setModelInput] = useState(selectedModel);
  const [modelSavedNotice, setModelSavedNotice] = useState(false);

  useEffect(() => {
    setApiKeyInput(customApiKey);
  }, [customApiKey]);

  useEffect(() => {
    setModelInput(selectedModel);
  }, [selectedModel]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const firebaseUser = await signInWithGoogle();
      onUpdateUser({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Google User',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || undefined,
        isLoggedIn: true,
      });
      setIsOpen(false);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err.message || 'Google sign-in failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      onUpdateUser({
        id: '',
        name: '',
        email: '',
        isLoggedIn: false,
      });
      setIsOpen(false);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(apiKeyInput.trim());
    setApiKeySavedNotice(true);
    setTimeout(() => setApiKeySavedNotice(false), 3000);
  };

  const handleClearApiKey = () => {
    setApiKeyInput('');
    onSaveApiKey('');
    setApiKeySavedNotice(true);
    setTimeout(() => setApiKeySavedNotice(false), 3000);
  };

  const handleApplyCustomModel = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = modelInput.trim();
    if (trimmed && onSelectModel) {
      onSelectModel(trimmed);
      setModelSavedNotice(true);
      setTimeout(() => setModelSavedNotice(false), 3000);
    }
  };

  const handleSelectSuggestedModel = (modelId: string) => {
    setModelInput(modelId);
    if (onSelectModel) {
      onSelectModel(modelId);
      setModelSavedNotice(true);
      setTimeout(() => setModelSavedNotice(false), 3000);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button - prominent, shows user avatar or sign in */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all text-xs font-semibold shadow-xs"
        title="Account, Theme Color, AI Models & Settings"
      >
        {user.isLoggedIn ? (
          user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.name}
              className="w-5 h-5 rounded-full object-cover ring-2 ring-app-accent"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-app-accent text-white flex items-center justify-center text-[10px] font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )
        ) : (
          <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        )}

        <span className="hidden sm:inline max-w-[100px] truncate">
          {user.isLoggedIn ? user.name.split(' ')[0] : 'Sign In'}
        </span>

        {/* Current color dot indicator */}
        <span
          className="w-2 h-2 rounded-full border border-white dark:border-gray-800 shrink-0"
          style={{ backgroundColor: APP_COLOR_THEMES.find((t) => t.id === colorTheme)?.accentHex || '#059669' }}
          title={`App color theme: ${colorTheme}`}
        />

        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - Always floating on top with z-[100] and bound to screen width */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl z-[100] p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
          {/* Section 1: User Account & Google Sign-In */}
          <div className="space-y-2.5 pb-3.5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                User Account &amp; Sync
              </span>
              {user.isLoggedIn && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-app-accent bg-app-accent-light px-2 py-0.5 rounded-full">
                  <Cloud className="w-3 h-3" />
                  Cloud Synced
                </span>
              )}
            </div>

            {user.isLoggedIn ? (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 space-y-2">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-app-accent"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-app-accent text-white font-bold flex items-center justify-center text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                    Receipts sync across all your devices
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 dark:text-red-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-app-accent-light border border-app-accent-light space-y-2.5">
                <p className="text-xs text-app-accent-light">
                  Sign in with Google to sync your bills, item tracker, and expense history across phone, tablet, and PC.
                </p>

                {authError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{authError}</p>
                )}

                <button
                  onClick={handleGoogleSignIn}
                  disabled={isAuthLoading}
                  className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white text-xs font-bold shadow-xs hover:bg-gray-50 dark:hover:bg-gray-750 flex items-center justify-center gap-2 transition active:scale-98"
                >
                  {isAuthLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-app-accent" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Sign In with Google</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 2: App Accent Color Picker (User Customizable Color) */}
          <div className="space-y-2.5 pb-3.5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                App Color Theme
              </span>
              <span className="text-[10px] font-semibold capitalize text-app-accent">
                {colorTheme}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Customize the look of Logify. Change from default green to your favorite theme:
            </p>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {APP_COLOR_THEMES.map((themeOption) => {
                const isSelected = colorTheme === themeOption.id;
                return (
                  <button
                    key={themeOption.id}
                    type="button"
                    onClick={() => onSelectColorTheme && onSelectColorTheme(themeOption.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-gray-900 dark:border-white ring-2 ring-gray-900 dark:ring-white bg-gray-50 dark:bg-gray-800 shadow-sm scale-102'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                    }`}
                    title={`${themeOption.name} (${themeOption.badge})`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full ${themeOption.swatchBg} shadow-xs flex items-center justify-center text-white`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate w-full">
                      {themeOption.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Gemini OCR Model Selector & Custom Model Input Box */}
          <div className="space-y-2.5 pb-3.5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Gemini OCR Model
              </span>
              <span className="text-[10px] font-mono font-bold text-app-accent truncate max-w-[140px]">
                {selectedModel}
              </span>
            </div>

            {/* Custom Model Input Box */}
            <form onSubmit={handleApplyCustomModel} className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 block">
                Input Custom Model:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  placeholder="e.g. gemini-2.5-flash, gemini-2.0-flash-exp..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-app-accent"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-app-accent hover:bg-app-accent-hover text-white text-xs font-bold transition shadow-xs"
                >
                  Apply
                </button>
              </div>

              {modelSavedNotice && (
                <div className="text-[11px] text-app-accent font-semibold flex items-center gap-1 animate-in fade-in duration-200">
                  <Check className="w-3 h-3" /> Model updated to {selectedModel}
                </div>
              )}
            </form>

            {/* Model Suggestions Chips */}
            <div className="space-y-1 pt-1">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                Suggested Models (Click to switch):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {GEMINI_OCR_MODELS.map((model) => {
                  const isSelected = selectedModel === model.id;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => handleSelectSuggestedModel(model.id)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'border-app-accent bg-app-accent-light text-app-accent'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-app-accent' : 'bg-gray-400'}`} />
                      <span>{model.name}</span>
                      <span className="text-[9px] opacity-75">({model.badge})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Insert Custom Gemini API Key */}
          <div className="space-y-2.5 pb-3.5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                Custom Gemini API Key
              </span>
              {customApiKey && (
                <span className="text-[10px] font-semibold text-app-accent bg-app-accent-light px-1.5 py-0.2 rounded">
                  Active
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Optional: Enter your personal Google AI Studio Gemini API key to use your own quotas.
            </p>

            <form onSubmit={handleSaveApiKey} className="space-y-2">
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pr-8 pl-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-app-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-1.5 px-3 rounded-lg bg-app-accent hover:bg-app-accent-hover text-white text-xs font-semibold shadow-xs transition"
                >
                  Save Key
                </button>
                {customApiKey && (
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    className="py-1.5 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Reset
                  </button>
                )}
              </div>

              {apiKeySavedNotice && (
                <div className="text-[11px] text-app-accent font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Key configuration updated
                </div>
              )}
            </form>
          </div>

          {/* Section 5: Theme Toggle (Dark / Light) & Feature Suggestions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                Appearance Mode
              </span>
              <div className="flex items-center p-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => onToggleTheme('light')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    theme === 'light'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => onToggleTheme('dark')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Feature Suggestions Roadmap Button */}
            {onOpenSuggestions && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSuggestions();
                }}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-between transition"
              >
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Roadmap &amp; Feature Ideas
                </span>
                <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                  Vote
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
