import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Support high-resolution camera bill photos up to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to get GoogleGenAI client (using custom user key if supplied, or server environment key)
function getAiClient(customKey?: string) {
  const effectiveKey = (customKey && customKey.trim()) || process.env.GEMINI_API_KEY;
  if (!effectiveKey) {
    throw new Error('Gemini API key is required. Please insert your own Gemini API key in the top-right Settings menu.');
  }
  return new GoogleGenAI({
    apiKey: effectiveKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Default suggested models for receipt scanning
const DEFAULT_FALLBACK_MODEL = 'gemini-2.5-flash';

// API Route: Scan & parse bill/receipt image
app.post('/api/scan-receipt', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', customApiKey, model } = req.body;
    const userKey = (req.headers['x-gemini-api-key'] as string) || customApiKey;
    const ai = getAiClient(userKey);

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // Clean data URL prefix if sent
    const base64Data = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '').trim();

    // Use user-specified model (custom or preset), or fallback to standard model
    const requestedModel = typeof model === 'string' ? model.trim() : '';
    const targetModel = requestedModel || DEFAULT_FALLBACK_MODEL;

    const systemInstruction = `You are an expert optical character recognition (OCR) and receipt accounting intelligence system.
Analyze the provided store receipt or bill image (which could be from DMart, Smart Bazaar, Reliance Fresh, Nature's Basket, local supermarket, kirana store, or any retail shop).
Extract all metadata and line items accurately.
For each item:
1. Provide the exact printed name ('name', e.g., 'Amul Processed Cheese Block 200g').
2. Provide a normalized generic product name ('cleanName', e.g., 'Cheese', 'Milk', 'Butter', 'Basmati Rice', 'Atta', 'Sunflower Oil', 'Toothpaste') so users can search 'when did I last buy cheese?' and find all cheese purchases across different stores.
3. Classify into one of these exact categories: 'Dairy', 'Groceries & Staples', 'Snacks & Munchies', 'Beverages', 'Fresh Produce & Fruits', 'Personal Care & Hygiene', 'Household & Cleaning', 'Bakery & Biscuits', 'Meat & Seafood', 'Others'.
4. Extract quantity, unit (kg, g, pcs, pack, l), unit price, and total line price.
5. Extract store name (e.g., 'DMart', 'Smart Bazaar', 'Reliance Smart', or detected store), store location if visible, bill date (YYYY-MM-DD format), bill number, payment method, tax, total bill amount.
If dates are in DD/MM/YYYY or DD-Mon-YY format, convert to standard YYYY-MM-DD. If year is missing, assume current year 2026.`;

    const promptText = 'Extract all store details and purchased products from this receipt into the structured JSON format.';

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: base64Data,
      },
    };

    const config = {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          storeName: {
            type: Type.STRING,
            description: 'Name of the supermarket/store, e.g., DMart, Smart Bazaar',
          },
          storeLocation: {
            type: Type.STRING,
            description: 'Location or branch name if available',
          },
          date: {
            type: Type.STRING,
            description: 'Date of bill in YYYY-MM-DD format',
          },
          billNumber: {
            type: Type.STRING,
            description: 'Invoice or bill number if available',
          },
          paymentMethod: {
            type: Type.STRING,
            description: 'Cash, UPI, Card, NetBanking, etc.',
          },
          items: {
            type: Type.ARRAY,
            description: 'List of line items on receipt',
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: 'Full name printed on receipt',
                },
                cleanName: {
                  type: Type.STRING,
                  description: 'Normalized generic name for tracking (e.g. Cheese, Milk, Cooking Oil)',
                },
                category: {
                  type: Type.STRING,
                  description: 'Category name (Dairy, Groceries & Staples, etc.)',
                },
                quantity: {
                  type: Type.NUMBER,
                  description: 'Quantity purchased',
                },
                unit: {
                  type: Type.STRING,
                  description: 'Unit of measure (pcs, kg, g, pack, l)',
                },
                unitPrice: {
                  type: Type.NUMBER,
                  description: 'Price per single unit',
                },
                totalPrice: {
                  type: Type.NUMBER,
                  description: 'Total cost for this item line',
                },
                discount: {
                  type: Type.NUMBER,
                  description: 'Discount applied if any',
                },
              },
              required: ['name', 'cleanName', 'category', 'quantity', 'unitPrice', 'totalPrice'],
            },
          },
          subtotal: { type: Type.NUMBER },
          tax: { type: Type.NUMBER },
          discount: { type: Type.NUMBER },
          total: {
            type: Type.NUMBER,
            description: 'Final grand total amount on receipt',
          },
          notes: {
            type: Type.STRING,
            description: 'Brief summary or notes about the bill',
          },
        },
        required: ['storeName', 'date', 'items', 'total'],
      },
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: targetModel,
        contents: {
          parts: [imagePart, { text: promptText }],
        },
        config,
      });
    } catch (primaryError: any) {
      console.warn(`Primary model ${targetModel} failed:`, primaryError.message);
      // Fallback model
      const fallbackModel = targetModel === 'gemini-2.5-flash' ? 'gemini-2.5-flash-lite' : 'gemini-2.5-flash';
      try {
        console.log(`Retrying OCR with fallback model ${fallbackModel}...`);
        response = await ai.models.generateContent({
          model: fallbackModel,
          contents: {
            parts: [imagePart, { text: promptText }],
          },
          config,
        });
      } catch (fallbackError: any) {
        throw primaryError;
      }
    }

    const textOutput = response.text;
    if (!textOutput) {
      return res.status(500).json({ error: 'Failed to extract receipt data from model response' });
    }

    const parsedData = JSON.parse(textOutput);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error scanning receipt:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process receipt image',
    });
  }
});

// API Route: AI Smart Categorize / Clean item helper
app.post('/api/categorize-item', async (req: Request, res: Response) => {
  try {
    const { itemName, customApiKey } = req.body;
    const userKey = (req.headers['x-gemini-api-key'] as string) || customApiKey;
    const ai = getAiClient(userKey);

    if (!itemName) {
      return res.status(400).json({ error: 'itemName is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Item name: "${itemName}".
Normalize this item name into a clean generic product name (e.g. "Amul Cheese Slices 200g" -> "Cheese") and classify into one category:
'Dairy', 'Groceries & Staples', 'Snacks & Munchies', 'Beverages', 'Fresh Produce & Fruits', 'Personal Care & Hygiene', 'Household & Cleaning', 'Bakery & Biscuits', 'Meat & Seafood', 'Others'.
Return JSON with cleanName and category.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cleanName: { type: Type.STRING },
            category: { type: Type.STRING },
          },
          required: ['cleanName', 'category'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Categorization error' });
  }
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
