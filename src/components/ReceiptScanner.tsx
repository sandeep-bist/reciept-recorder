import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  Trash2,
  Plus,
  Store,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Zap,
  Cpu,
  Info,
  Check,
} from 'lucide-react';
import { Receipt, ReceiptItem, ItemCategory } from '../types';
import { ALL_CATEGORIES, CATEGORIES, formatCurrency } from '../utils/formatters';
import { prepareReceiptImage } from '../utils/imageHelper';
import { loadSelectedModel, saveSelectedModel } from '../utils/storage';

export interface GeminiModelInfo {
  id: string;
  name: string;
  tag: string;
  tagColor: string;
  speed: string;
  description: string;
  whyReasonable: string;
}

export const GEMINI_OCR_MODELS: GeminiModelInfo[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    tag: '⭐ Best Value & Recommended',
    tagColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    speed: '~1.2s',
    description: 'Gold standard for receipt OCR: high-precision character recognition, table layout parsing, item names, and tax totals.',
    whyReasonable: 'Best overall choice for 95% of receipts (DMart, Smart Bazaar, Kirana slips). Free tier friendly, reliable, and fast.',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    tag: '⚡ Ultra Fast & Budget',
    tagColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800',
    speed: '~0.6s',
    description: 'Lightweight multimodal engine with lowest token latency and rapid response times.',
    whyReasonable: 'Reasonable for clean, high-contrast, short grocery slips or rapid sequential receipt scanning.',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: '🚀 Next-Gen Preview',
    tagColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    speed: '~1.4s',
    description: 'Advanced vision reasoning and extraction preview model.',
    whyReasonable: 'Reasonable for cutting-edge accuracy and large receipts.',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    tag: '🧠 Deep Reasoning & Tough Bills',
    tagColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    speed: '~3.0s',
    description: 'Maximum character disambiguation and contextual reconstruction for difficult scans.',
    whyReasonable: 'Reasonable when receipts are wrinkled, partially torn, printed with faint thermal ink, or taken under dim lighting.',
  },
];

interface ReceiptScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReceipt: (receipt: Receipt) => void;
  currency: string;
  customApiKey?: string;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  isOpen,
  onClose,
  onSaveReceipt,
  currency,
  customApiKey,
}) => {
  const [mode, setMode] = useState<'options' | 'camera' | 'upload' | 'scanning' | 'review'>('options');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState<string>('Uploading image...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Gemini Model selection state
  const [selectedModel, setSelectedModel] = useState<string>(() => loadSelectedModel());
  const [customModelInput, setCustomModelInput] = useState<string>(() => loadSelectedModel());
  const [showModelAdvisor, setShowModelAdvisor] = useState(false);

  // Editable parsed receipt state
  const [scannedReceipt, setScannedReceipt] = useState<Partial<Receipt> | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close & clean camera on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetState();
    } else {
      const current = loadSelectedModel();
      setSelectedModel(current);
      setCustomModelInput(current);
    }
  }, [isOpen]);

  const handleSelectModel = (modelId: string) => {
    const trimmed = modelId.trim();
    if (!trimmed) return;
    setSelectedModel(trimmed);
    setCustomModelInput(trimmed);
    saveSelectedModel(trimmed);
  };

  const resetState = () => {
    setMode('options');
    setCapturedImage(null);
    setCameraError(null);
    setErrorMessage(null);
    setScannedReceipt(null);
    stopCamera();
  };

  const startCamera = async () => {
    setCameraError(null);
    setMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        'Could not access camera. Please allow camera permissions or upload a receipt photo instead.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      stopCamera();
      try {
        setMode('scanning');
        setScanStep('Optimizing photo frame for OCR...');
        const { dataUrl } = await prepareReceiptImage(rawDataUrl);
        setCapturedImage(dataUrl);
        processReceiptImage(dataUrl);
      } catch (err) {
        setCapturedImage(rawDataUrl);
        processReceiptImage(rawDataUrl);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setMode('scanning');
      setScanStep('Compressing & optimizing image for scanning...');
      // Prepare image client-side to prevent "Load failed" on large mobile photos
      const { dataUrl } = await prepareReceiptImage(file, 1600, 0.85);
      setCapturedImage(dataUrl);
      // Reset input so same file can be re-uploaded if desired
      e.target.value = '';
      processReceiptImage(dataUrl);
    } catch (err: any) {
      console.error('File optimization error:', err);
      setErrorMessage('Could not process this image file. Please choose a standard JPG, PNG, or WEBP file.');
      setMode('options');
    }
  };

  // Helper to create a realistic receipt test canvas image to demonstrate instant OCR
  const generateSampleBillImage = async (type: 'dmart' | 'smartbazaar' | 'reliance') => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d')!;

    // White paper background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 800);

    // Subtle paper grain
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(10, 10, 580, 780);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';

    let storeTitle = 'DMART SUPERCENTER';
    let billNo = 'INV-DM-84910';
    let dateStr = '2026-10-01';
    let items = [
      { name: 'AMUL CHEESE CUBES 200G', qty: 1, price: 125 },
      { name: 'FORTUNE SUNFLOWER OIL 1L', qty: 2, price: 270 },
      { name: 'TATA TOOR DAL 1KG', qty: 1, price: 165 },
      { name: 'AMUL MILK 1L TETRA', qty: 2, price: 144 },
      { name: 'PARLE-G GOLD BISCUITS 1KG', qty: 1, price: 90 },
    ];

    if (type === 'smartbazaar') {
      storeTitle = 'SMART BAZAAR (RELIANCE RETAIL)';
      billNo = 'SB-RC-54312';
      dateStr = '2026-09-15';
      items = [
        { name: 'BRITANNIA CHEEZZA CHEESE 200G', qty: 1, price: 138 },
        { name: 'AASHIRVAAD CHAKKI ATTA 5KG', qty: 1, price: 245 },
        { name: 'COLGATE TOTAL TOOTHPASTE 120G', qty: 1, price: 99 },
        { name: 'TROPICANA ORANGE JUICE 1L', qty: 2, price: 240 },
      ];
    } else if (type === 'reliance') {
      storeTitle = 'RELIANCE SMART FRESH';
      billNo = 'RS-HG-11094';
      dateStr = '2026-08-20';
      items = [
        { name: 'MOTHER DAIRY CHEESE SLICES 200G', qty: 1, price: 130 },
        { name: 'INDIA GATE BASMATI RICE 1KG', qty: 2, price: 220 },
        { name: 'SURF EXCEL MATIC 2KG', qty: 1, price: 430 },
        { name: 'LAYS SALTED CHIPS 100G', qty: 3, price: 90 },
      ];
    }

    ctx.fillText(storeTitle, 300, 60);

    ctx.font = '14px monospace';
    ctx.fillText('TAX INVOICE / RETAIL RECEIPT', 300, 85);
    ctx.fillText(`DATE: ${dateStr}   BILL: ${billNo}`, 300, 110);
    ctx.fillText('------------------------------------------------', 300, 130);

    ctx.textAlign = 'left';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('ITEM NAME                      QTY    AMOUNT', 40, 160);
    ctx.fillText('------------------------------------------------', 40, 180);

    ctx.font = '14px monospace';
    let y = 210;
    let total = 0;
    items.forEach((it) => {
      total += it.price;
      const namePadded = it.name.padEnd(28, ' ').substring(0, 28);
      ctx.fillText(`${namePadded} ${it.qty}     Rs.${it.price}`, 40, y);
      y += 35;
    });

    y += 20;
    ctx.fillText('------------------------------------------------', 40, y);
    y += 30;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`TOTAL AMOUNT PAYABLE:          Rs.${total}`, 40, y);
    y += 30;
    ctx.font = '13px monospace';
    ctx.fillText('PAYMENT METHOD: UPI / CARD', 40, y);
    y += 40;
    ctx.textAlign = 'center';
    ctx.fillText('*** THANK YOU FOR SHOPPING WITH US! ***', 300, y);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataUrl);
    processReceiptImage(dataUrl);
  };

  const currentModelInfo =
    GEMINI_OCR_MODELS.find((m) => m.id === selectedModel) || {
      id: selectedModel,
      name: selectedModel,
      tag: 'Custom Model',
      tagColor: 'bg-app-accent-light text-app-accent-light border-app-accent-light',
      speed: 'Dynamic',
      description: `User-specified custom model: ${selectedModel}`,
      whyReasonable: 'Custom model configured by user.',
    };

  const processReceiptImage = async (dataUrl: string) => {
    setMode('scanning');
    setErrorMessage(null);
    setScanStep(`Sending receipt to ${currentModelInfo.name}...`);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 60000); // 60s timeout

    try {
      const stepTimer1 = setTimeout(() => {
        setScanStep(`Reading printed text & line items with ${currentModelInfo.name}...`);
      }, 1000);

      const stepTimer2 = setTimeout(() => {
        setScanStep('Detecting products, prices & categorizing...');
      }, 2400);

      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {}),
        },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType: 'image/jpeg',
          customApiKey: customApiKey || undefined,
          model: selectedModel,
        }),
        signal: abortController.signal,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error('Could not parse receipt data from response');
      }

      const extracted = json.data;
      const formattedItems: ReceiptItem[] = (extracted.items || []).map(
        (it: any, index: number) => ({
          id: `item-${Date.now()}-${index}`,
          name: it.name || 'Unnamed Item',
          cleanName: it.cleanName || it.name || 'Product',
          category: (ALL_CATEGORIES.includes(it.category) ? it.category : 'Groceries & Staples') as ItemCategory,
          quantity: Number(it.quantity) || 1,
          unit: it.unit || 'pack',
          unitPrice: Number(it.unitPrice) || Number(it.totalPrice) || 0,
          totalPrice: Number(it.totalPrice) || Number(it.unitPrice) || 0,
          discount: Number(it.discount) || 0,
          notes: it.notes || '',
        })
      );

      const newReceipt: Partial<Receipt> = {
        id: `receipt-${Date.now()}`,
        storeName: extracted.storeName || 'Supermarket',
        storeLocation: extracted.storeLocation || '',
        date: extracted.date || new Date().toISOString().split('T')[0],
        billNumber: extracted.billNumber || `BILL-${Math.floor(Math.random() * 90000 + 10000)}`,
        paymentMethod: extracted.paymentMethod || 'UPI',
        items: formattedItems,
        subtotal: extracted.subtotal || extracted.total || 0,
        tax: extracted.tax || 0,
        discount: extracted.discount || 0,
        total: extracted.total || formattedItems.reduce((acc, it) => acc + it.totalPrice, 0),
        notes: extracted.notes || `Scanned bill using ${currentModelInfo.name}`,
        imageUrl: dataUrl,
        createdAt: new Date().toISOString(),
      };

      setScannedReceipt(newReceipt);
      setMode('review');
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Scan failed:', err);
      let errorMsg = err.message || 'Failed to scan receipt.';
      if (err.name === 'AbortError') {
        errorMsg = 'Scan timed out after 60 seconds. Please try again or switch model.';
      } else if (
        errorMsg.toLowerCase().includes('load failed') ||
        errorMsg.toLowerCase().includes('failed to fetch')
      ) {
        errorMsg =
          'Image upload connection failed. Please ensure the receipt photo is clear, and verify your network connection.';
      }
      setErrorMessage(errorMsg);
      setMode('options');
    }
  };

  const handleItemChange = (index: number, field: keyof ReceiptItem, val: any) => {
    if (!scannedReceipt || !scannedReceipt.items) return;
    const items = [...scannedReceipt.items];
    items[index] = { ...items[index], [field]: val };

    if (field === 'unitPrice' || field === 'quantity') {
      const q = field === 'quantity' ? Number(val) : items[index].quantity;
      const p = field === 'unitPrice' ? Number(val) : items[index].unitPrice;
      items[index].totalPrice = Math.round(q * p * 100) / 100;
    }

    const newTotal = items.reduce((sum, it) => sum + (it.totalPrice || 0), 0);
    setScannedReceipt({
      ...scannedReceipt,
      items,
      total: newTotal,
      subtotal: newTotal,
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!scannedReceipt || !scannedReceipt.items) return;
    const items = scannedReceipt.items.filter((_, i) => i !== index);
    const newTotal = items.reduce((sum, it) => sum + (it.totalPrice || 0), 0);
    setScannedReceipt({
      ...scannedReceipt,
      items,
      total: newTotal,
      subtotal: newTotal,
    });
  };

  const handleAddItem = () => {
    if (!scannedReceipt) return;
    const newItem: ReceiptItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      name: '',
      cleanName: '',
      category: 'Groceries & Staples',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      totalPrice: 0,
    };
    const items = [...(scannedReceipt.items || []), newItem];
    setScannedReceipt({
      ...scannedReceipt,
      items,
    });
  };

  const handleSaveConfirmed = () => {
    if (!scannedReceipt) return;
    if (!scannedReceipt.storeName) {
      setErrorMessage('Please enter a Store Name');
      return;
    }
    if (!scannedReceipt.items || scannedReceipt.items.length === 0) {
      setErrorMessage('Please add at least one item');
      return;
    }

    const sanitizedItems = scannedReceipt.items.map((it) => ({
      ...it,
      cleanName: it.cleanName?.trim() || it.name.trim() || 'Item',
      name: it.name?.trim() || it.cleanName?.trim() || 'Item',
    }));

    const completeReceipt: Receipt = {
      id: scannedReceipt.id || `receipt-${Date.now()}`,
      storeName: scannedReceipt.storeName.trim(),
      storeLocation: scannedReceipt.storeLocation?.trim(),
      date: scannedReceipt.date || new Date().toISOString().split('T')[0],
      billNumber: scannedReceipt.billNumber?.trim(),
      paymentMethod: scannedReceipt.paymentMethod || 'UPI',
      items: sanitizedItems,
      subtotal: scannedReceipt.subtotal || scannedReceipt.total || 0,
      tax: scannedReceipt.tax || 0,
      discount: scannedReceipt.discount || 0,
      total: scannedReceipt.total || 0,
      notes: scannedReceipt.notes || '',
      imageUrl: scannedReceipt.imageUrl,
      createdAt: scannedReceipt.createdAt || new Date().toISOString(),
    };

    onSaveReceipt(completeReceipt);
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Scan Bill with AI
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {currentModelInfo.name}
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                DMart, Smart Bazaar, Kirana bills &bull; Auto-extracts prices &amp; products
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              resetState();
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* GEMINI MODEL SELECTOR & ADVISOR (Available in options mode) */}
          {mode === 'options' && (
            <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-app-accent" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Gemini OCR Model
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModelAdvisor(!showModelAdvisor)}
                  className="text-[11px] font-bold text-app-accent hover:underline flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  {showModelAdvisor ? 'Hide Model Guide' : 'Which model is better?'}
                </button>
              </div>

              {/* Custom Model Input Box */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  placeholder="Input custom model: e.g. gemini-2.5-flash, gemini-2.0-flash-exp..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-app-accent"
                />
                <button
                  type="button"
                  onClick={() => handleSelectModel(customModelInput)}
                  className="px-3 py-1.5 rounded-xl bg-app-accent hover:bg-app-accent-hover text-white text-xs font-bold transition shadow-xs shrink-0"
                >
                  Set Model
                </button>
              </div>

              {/* Model Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                {GEMINI_OCR_MODELS.map((m) => {
                  const isSelected = selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectModel(m.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white dark:bg-gray-900 border-app-accent ring-2 ring-app-accent shadow-xs'
                          : 'bg-white/60 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700/70 hover:border-gray-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                            {m.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-app-accent shrink-0" />}
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border inline-block mb-1 ${m.tagColor}`}
                        >
                          {m.tag}
                        </span>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug">
                          {m.description}
                        </p>
                      </div>
                      <div className="mt-1.5 pt-1 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 flex items-center justify-between">
                        <span>Latency</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{m.speed}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* MODEL SUGGESTION ADVISOR ACCORDION / NOTE */}
              {showModelAdvisor && (
                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2 animate-in fade-in duration-150">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    AI Model Suggestion &amp; Recommendation
                  </div>
                  <ul className="space-y-1.5 text-emerald-900/90 dark:text-emerald-200/90 text-[11px] leading-relaxed">
                    <li>
                      &bull; <strong>Recommended (95% of receipts):</strong> Choose{' '}
                      <strong>Gemini 3.8 Flash</strong>. It is the most reasonable, fast, and highly
                      accurate choice. It recognizes complex store receipt columns, discounts, and item names effortlessly.
                    </li>
                    <li>
                      &bull; <strong>For quick small receipts:</strong> <strong>Gemini 3.1 Flash Lite</strong> offers near-instant speed and lowest token footprint.
                    </li>
                    <li>
                      &bull; <strong>For faded, damaged, or dark bills:</strong> Switch to{' '}
                      <strong>Gemini 3.1 Pro</strong> for deep contextual reconstruction.
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Mode: Options */}
          {mode === 'options' && (
            <div className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Live Camera Button */}
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 transition-all group text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform mb-3">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                    Take Photo with Camera
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                    Hold receipt flat and capture directly using your device webcam or phone camera
                  </p>
                </button>

                {/* Upload Image Button (with automatic client-side compression) */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100/50 dark:hover:bg-gray-800/60 transition-all group text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-800 dark:bg-gray-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform mb-3">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                    Upload Receipt Photo
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                    Auto-optimized &bull; Supports smartphone camera photos without size errors
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </button>
              </div>

              {/* Sample receipts to try instantly */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Try Instant OCR with Sample Bills
                  </h4>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Test live OCR reading with simulated store receipts:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => generateSampleBillImage('dmart')}
                    className="p-3 text-left rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 bg-white dark:bg-gray-800/80 hover:shadow-sm transition-all"
                  >
                    <div className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                      <span>DMart Grocery Bill</span>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                        Oct 1
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      Cheese Cubes, Oil, Toor Dal, Milk, Biscuits
                    </div>
                  </button>

                  <button
                    onClick={() => generateSampleBillImage('smartbazaar')}
                    className="p-3 text-left rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 bg-white dark:bg-gray-800/80 hover:shadow-sm transition-all"
                  >
                    <div className="font-bold text-xs text-sky-700 dark:text-sky-400 flex items-center justify-between">
                      <span>Smart Bazaar Bill</span>
                      <span className="text-[10px] bg-sky-100 dark:bg-sky-950 px-1.5 py-0.5 rounded">
                        Sep 15
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      Cheezza Cheese, Atta, Toothpaste, Juice
                    </div>
                  </button>

                  <button
                    onClick={() => generateSampleBillImage('reliance')}
                    className="p-3 text-left rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 bg-white dark:bg-gray-800/80 hover:shadow-sm transition-all"
                  >
                    <div className="font-bold text-xs text-rose-700 dark:text-rose-400 flex items-center justify-between">
                      <span>Reliance Smart Bill</span>
                      <span className="text-[10px] bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 rounded">
                        Aug 20
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      Cheese Slices, Basmati Rice, Detergent, Chips
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mode: Camera capture */}
          {mode === 'camera' && (
            <div className="flex flex-col items-center">
              {cameraError ? (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm text-center">
                  <p>{cameraError}</p>
                  <button
                    onClick={() => setMode('options')}
                    className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white"
                  >
                    Back to Options
                  </button>
                </div>
              ) : (
                <div className="relative w-full max-w-lg aspect-[3/4] bg-black rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-500/50">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                  {/* Receipt Guide Bounding Box */}
                  <div className="absolute inset-6 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                    <div className="text-[11px] font-semibold text-emerald-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs self-center">
                      Align receipt borders within frame
                    </div>
                    <div className="text-[10px] text-center text-white/80 bg-black/40 py-1 rounded backdrop-blur-xs">
                      Hold still for sharp text &bull; Using {currentModelInfo.name}
                    </div>
                  </div>

                  {/* Shutter Button */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                    <button
                      onClick={() => {
                        stopCamera();
                        setMode('options');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-black/60 text-white rounded-lg backdrop-blur-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-xl flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                      title="Capture Photo"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                        <Camera className="w-6 h-6" />
                      </div>
                    </button>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Mode: Scanning with AI Animation */}
          {mode === 'scanning' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-5">
              <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center overflow-hidden">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Reading Receipt with {currentModelInfo.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">{scanStep}</p>
              </div>
              <div className="w-48 bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full animate-indeterminate" />
              </div>
            </div>
          )}

          {/* Mode: Review & Edit Extracted Bill */}
          {mode === 'review' && scannedReceipt && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold text-sm text-gray-900 dark:text-white">
                    Receipt Extracted by {currentModelInfo.name}! Verify &amp; Save
                  </span>
                </div>
                <button
                  onClick={() => setMode('options')}
                  className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Rescan
                </button>
              </div>

              {/* Receipt Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                    <Store className="w-3.5 h-3.5" /> Store Name
                  </label>
                  <input
                    type="text"
                    value={scannedReceipt.storeName || ''}
                    onChange={(e) =>
                      setScannedReceipt({ ...scannedReceipt, storeName: e.target.value })
                    }
                    placeholder="e.g. DMart, Smart Bazaar"
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Purchase Date
                  </label>
                  <input
                    type="date"
                    value={scannedReceipt.date || ''}
                    onChange={(e) =>
                      setScannedReceipt({ ...scannedReceipt, date: e.target.value })
                    }
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                    Bill / Invoice #
                  </label>
                  <input
                    type="text"
                    value={scannedReceipt.billNumber || ''}
                    onChange={(e) =>
                      setScannedReceipt({ ...scannedReceipt, billNumber: e.target.value })
                    }
                    placeholder="Invoice #"
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Extracted Items ({scannedReceipt.items?.length || 0})
                  </h4>
                  <button
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {scannedReceipt.items?.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/90 shadow-2xs space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        {/* Printed Full Name */}
                        <div className="sm:col-span-5">
                          <label className="text-[10px] text-gray-400 block mb-0.5">
                            Printed Product Name
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            placeholder="e.g. Amul Cheese Slices 200g"
                            className="w-full text-xs font-medium px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                          />
                        </div>

                        {/* Normalized Name for tracking */}
                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 block mb-0.5">
                            Generic Name (for tracking)
                          </label>
                          <input
                            type="text"
                            value={item.cleanName}
                            onChange={(e) => handleItemChange(index, 'cleanName', e.target.value)}
                            placeholder="e.g. Cheese"
                            className="w-full text-xs font-semibold px-2 py-1 rounded border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200"
                          />
                        </div>

                        {/* Category Selector */}
                        <div className="sm:col-span-3">
                          <label className="text-[10px] text-gray-400 block mb-0.5">Category</label>
                          <select
                            value={item.category}
                            onChange={(e) =>
                              handleItemChange(index, 'category', e.target.value as ItemCategory)
                            }
                            className="w-full text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                          >
                            {ALL_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {CATEGORIES[cat]?.icon} {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Delete action */}
                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Quantities & Price line */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1 border-t border-gray-100 dark:border-gray-800 text-xs">
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
                            className="w-full px-1.5 py-0.5 mt-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400">Unit:</span>
                          <input
                            type="text"
                            value={item.unit || 'pcs'}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            className="w-full px-1.5 py-0.5 mt-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs"
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
                            className="w-full px-1.5 py-0.5 mt-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-semibold"
                          />
                        </div>
                        <div className="text-right flex flex-col justify-end">
                          <span className="text-[10px] text-gray-400">Line Total:</span>
                          <span className="font-bold text-gray-900 dark:text-white mt-0.5">
                            {formatCurrency(item.totalPrice, currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Confirm Bar */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    Grand Total Amount
                  </span>
                  <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(scannedReceipt.total || 0, currency)}
                  </div>
                </div>
                <button
                  onClick={handleSaveConfirmed}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 flex items-center gap-2 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save to Purchase Tracker
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
