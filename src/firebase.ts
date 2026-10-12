import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Receipt } from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Validate connection to Firestore on initialization
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline notice:', error.message);
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Google Sign-In via popup
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    console.error('Google Sign In Error:', err);
    throw err;
  }
}

// Sign-out
export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Save a receipt to user's Firestore collection
export async function saveReceiptToFirestore(userId: string, receipt: Receipt): Promise<void> {
  const docPath = `users/${userId}/receipts/${receipt.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'receipts', receipt.id);
    const receiptToSave = {
      ...receipt,
      userId,
      createdAt: receipt.createdAt || new Date().toISOString(),
    };
    await setDoc(docRef, receiptToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// Delete a receipt from user's Firestore collection
export async function deleteReceiptFromFirestore(userId: string, receiptId: string): Promise<void> {
  const docPath = `users/${userId}/receipts/${receiptId}`;
  try {
    const docRef = doc(db, 'users', userId, 'receipts', receiptId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// Realtime subscription to user receipts
export function subscribeToUserReceipts(
  userId: string,
  onReceiptsChange: (receipts: Receipt[]) => void,
  onError?: (err: any) => void
) {
  const collectionPath = `users/${userId}/receipts`;
  const receiptsCol = collection(db, 'users', userId, 'receipts');

  return onSnapshot(
    receiptsCol,
    (snapshot) => {
      const items: Receipt[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Receipt;
        items.push({
          ...data,
          id: docSnap.id,
        });
      });
      // Sort newest date first
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onReceiptsChange(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
      if (onError) onError(error);
    }
  );
}
