import { createContext, useContext, useReducer, useRef, type ReactNode, useEffect } from "react";
import type { ReceiptData, ReceiptFormData } from "@/types/receipt";
import { defaultFormData } from "@/types/receipt";
import { generateTrackingCode, generateTransactionId, clampProgress } from "@/lib/utils";
import { publishReceipt, unpublishReceipt, backfillReceipts, flushPendingSync, queueSync } from "@/lib/receiptApi";

interface ReceiptState {
  receipts: ReceiptData[];
  currentForm: ReceiptFormData;
  isLoading: boolean;
  editingId: string | null;
  /**
   * Bumped whenever receipts are created, edited, or deleted. Pages that hold a
   * receipt outside the context (the track page snapshots one so it can render a
   * receipt created on another device) watch this to know their snapshot is stale.
   */
  revision: number;
}

type ReceiptAction =
  | { type: "SET_RECEIPTS"; payload: ReceiptData[] }
  | { type: "ADD_RECEIPT"; payload: ReceiptData }
  | { type: "UPDATE_RECEIPT"; payload: ReceiptData }
  | { type: "DELETE_RECEIPT"; payload: string }
  | { type: "UPDATE_FORM"; payload: Partial<ReceiptFormData> }
  | { type: "RESET_FORM" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_EDITING"; payload: string | null };

const initialState: ReceiptState = {
  receipts: [],
  currentForm: defaultFormData,
  isLoading: true,
  editingId: null,
  revision: 0,
};

function receiptReducer(state: ReceiptState, action: ReceiptAction): ReceiptState {
  switch (action.type) {
    case "SET_RECEIPTS":
      return { ...state, receipts: action.payload, isLoading: false };
    case "ADD_RECEIPT":
      return { ...state, receipts: [action.payload, ...state.receipts], revision: state.revision + 1 };
    case "UPDATE_RECEIPT":
      return {
        ...state,
        receipts: state.receipts.map((r) => (r.id === action.payload.id ? action.payload : r)),
        revision: state.revision + 1,
      };
    case "DELETE_RECEIPT":
      return {
        ...state,
        receipts: state.receipts.filter((r) => r.id !== action.payload),
        revision: state.revision + 1,
      };
    case "UPDATE_FORM":
      return { ...state, currentForm: { ...state.currentForm, ...action.payload } };
    case "RESET_FORM":
      return { ...state, currentForm: defaultFormData, editingId: null };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_EDITING":
      return { ...state, editingId: action.payload };
    default:
      return state;
  }
}

interface ReceiptContextType extends ReceiptState {
  updateForm: (data: Partial<ReceiptFormData>) => void;
  resetForm: () => void;
  saveReceipt: (formData: ReceiptFormData, logoUrl: string, bankLogoUrl: string, receiptImageUrl: string, userEmail?: string) => ReceiptData;
  updateReceipt: (formData: ReceiptFormData, logoUrl: string, bankLogoUrl: string, receiptImageUrl: string) => ReceiptData | null;
  deleteReceipt: (id: string) => void;
  startEditing: (receipt: ReceiptData) => void;
  getReceiptByCode: (code: string) => ReceiptData | undefined;
}

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

const STORAGE_KEY = "receipt-tracker-receipts";

export function ReceiptProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(receiptReducer, initialState);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        dispatch({ type: "SET_RECEIPTS", payload: JSON.parse(stored) });
      } catch {
        dispatch({ type: "SET_RECEIPTS", payload: [] });
      }
    } else {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  useEffect(() => {
    if (!state.isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.receipts));
    }
  }, [state.receipts, state.isLoading]);

  // Keep open tabs in step. The storage event only fires in *other* tabs, so
  // editing a receipt on the dashboard in one tab updates the track page open in
  // another without a reload.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        dispatch({ type: "SET_RECEIPTS", payload: JSON.parse(e.newValue) });
      } catch {
        // Ignore an unreadable value rather than clearing the list.
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Publish receipts that predate the shared store. Their codes only ever lived
  // in this browser's localStorage, so they were invisible to every other device
  // until they are uploaded. Runs once per session, after hydration.
  const didBackfill = useRef(false);
  useEffect(() => {
    if (state.isLoading || didBackfill.current || state.receipts.length === 0) return;
    didBackfill.current = true;
    void backfillReceipts(state.receipts);
  }, [state.isLoading, state.receipts]);

  /**
   * Push anything that failed to reach the store. A create or edit made on a
   * flaky connection, or while the API was briefly unavailable, would otherwise
   * stay local for good; these hooks retry it on the next load, when the network
   * comes back, and when the tab is opened again.
   */
  const receiptsRef = useRef(state.receipts);
  useEffect(() => {
    receiptsRef.current = state.receipts;
  }, [state.receipts]);

  useEffect(() => {
    if (state.isLoading) return;

    // Rebuilt per attempt rather than captured once, so a receipt created after
    // this effect ran is still found when the network comes back.
    const flush = () => {
      const byCode = new Map(
        receiptsRef.current.map((r) => [r.trackingCode?.trim().toUpperCase(), r])
      );
      void flushPendingSync((code) => byCode.get(code));
    };

    flush();
    const onOnline = () => flush();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [state.isLoading]);

  /**
   * Publish a receipt, and if that fails remember to try again. Queueing on
   * failure is what turns a dropped network request into a delayed update
   * instead of a permanent divergence between this device and the shared store.
   */
  const syncOrQueue = (receipt: ReceiptData) => {
    void publishReceipt(receipt).then((ok) => {
      if (!ok) queueSync(receipt.trackingCode ?? "");
    });
  };

  const updateForm = (data: Partial<ReceiptFormData>) => {
    dispatch({ type: "UPDATE_FORM", payload: data });
  };

  const resetForm = () => {
    dispatch({ type: "RESET_FORM" });
  };

  const saveReceipt = (formData: ReceiptFormData, logoUrl: string, bankLogoUrl: string, receiptImageUrl: string, userEmail?: string): ReceiptData => {
    const now = new Date().toISOString();
    const receipt: ReceiptData = {
      id: crypto.randomUUID(),
      trackingCode: formData.trackingCode || generateTrackingCode(),
      transactionId: generateTransactionId(),
      createdAt: now,
      updatedAt: now,
      senderName: formData.senderName,
      receiverName: formData.receiverName,
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
      amount: parseFloat(formData.amount) || 0,
      currency: formData.currency,
      status: formData.status,
      dateTime: formData.dateTime,
      paymentMethod: formData.paymentMethod,
      progress: clampProgress(formData.progress),
      feeAmount: parseFloat(formData.feeAmount) || 0,
      feeStatus: formData.feeStatus,
      billingWarning: formData.billingWarning,
      pendingMessage: formData.pendingMessage,
      maturityMessage: formData.maturityMessage,
      customNotes: formData.customNotes,
      cryptoWallet: formData.cryptoWallet,
      footerText: formData.footerText,
      backgroundColor: formData.backgroundColor,
      brandColor: formData.brandColor,
      logoUrl,
      bankLogoUrl,
      receiptImageUrl,
      createdBy: userEmail,
      isAnonymous: !userEmail,
    };
    dispatch({ type: "ADD_RECEIPT", payload: receipt });
    // Publish so the code resolves on other devices too. Failure is non-fatal:
    // the local copy is already saved, and the queue guarantees a retry.
    syncOrQueue(receipt);
    return receipt;
  };

  const updateReceipt = (
    formData: ReceiptFormData,
    logoUrl: string,
    bankLogoUrl: string,
    receiptImageUrl: string,
  ): ReceiptData | null => {
    if (!state.editingId) return null;
    const existing = state.receipts.find((r) => r.id === state.editingId);
    if (!existing) return null;

    const receipt: ReceiptData = {
      ...existing,
      // Keep the original tracking code so shared links keep working
      trackingCode: existing.trackingCode,
      transactionId: existing.transactionId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
      senderName: formData.senderName,
      receiverName: formData.receiverName,
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
      amount: parseFloat(formData.amount) || 0,
      currency: formData.currency,
      status: formData.status,
      dateTime: formData.dateTime,
      paymentMethod: formData.paymentMethod,
      progress: clampProgress(formData.progress),
      feeAmount: parseFloat(formData.feeAmount) || 0,
      feeStatus: formData.feeStatus,
      billingWarning: formData.billingWarning,
      pendingMessage: formData.pendingMessage,
      maturityMessage: formData.maturityMessage,
      customNotes: formData.customNotes,
      cryptoWallet: formData.cryptoWallet,
      footerText: formData.footerText,
      backgroundColor: formData.backgroundColor,
      brandColor: formData.brandColor,
      // Fall back to the existing image when no new file was uploaded
      logoUrl: logoUrl || existing.logoUrl,
      bankLogoUrl: bankLogoUrl || existing.bankLogoUrl,
      receiptImageUrl: receiptImageUrl || existing.receiptImageUrl,
    };

    dispatch({ type: "UPDATE_RECEIPT", payload: receipt });
    dispatch({ type: "SET_EDITING", payload: null });
    // Re-publish under the same code so edits are visible to anyone tracking it.
    syncOrQueue(receipt);
    return receipt;
  };

  const deleteReceipt = (id: string) => {
    const target = state.receipts.find((r) => r.id === id);
    dispatch({ type: "DELETE_RECEIPT", payload: id });
    if (state.editingId === id) {
      dispatch({ type: "SET_EDITING", payload: null });
    }
    // Also remove the shared copy. Otherwise anyone still holding this code
    // keeps resolving the receipt after it has been deleted here.
    if (target?.trackingCode) {
      void unpublishReceipt(target.trackingCode);
    }
  };

  const startEditing = (receipt: ReceiptData) => {
    dispatch({
      type: "UPDATE_FORM",
      payload: {
        senderName: receipt.senderName,
        receiverName: receipt.receiverName,
        bankName: receipt.bankName,
        accountNumber: receipt.accountNumber,
        amount: String(receipt.amount),
        currency: receipt.currency,
        status: receipt.status,
        dateTime: receipt.dateTime,
        paymentMethod: receipt.paymentMethod,
        progress: String(clampProgress(receipt.progress)),
        feeAmount: String(receipt.feeAmount),
        feeStatus: receipt.feeStatus,
        billingWarning: receipt.billingWarning,
        pendingMessage: receipt.pendingMessage,
        maturityMessage: receipt.maturityMessage,
        customNotes: receipt.customNotes,
        cryptoWallet: receipt.cryptoWallet,
        footerText: receipt.footerText,
        backgroundColor: receipt.backgroundColor,
        brandColor: receipt.brandColor,
        // Carried over so the edit form and its live preview show the original
        // identifiers. Without these the create page sees no code and generates
        // a fresh one, so the preview disagreed with the receipt being edited
        // even though the save itself kept the real code.
        trackingCode: receipt.trackingCode,
        transactionId: receipt.transactionId,
        logoFile: null,
        bankLogoFile: null,
        receiptImageFile: null,
      },
    });
    dispatch({ type: "SET_EDITING", payload: receipt.id });
  };

  const getReceiptByCode = (code: string): ReceiptData | undefined => {
    return state.receipts.find((r) => r.trackingCode === code.toUpperCase());
  };

  return (
    <ReceiptContext.Provider
      value={{
        ...state,
        updateForm,
        resetForm,
        saveReceipt,
        updateReceipt,
        deleteReceipt,
        startEditing,
        getReceiptByCode,
      }}
    >
      {children}
    </ReceiptContext.Provider>
  );
}

export function useReceipts() {
  const context = useContext(ReceiptContext);
  if (!context) {
    throw new Error("useReceipts must be used within a ReceiptProvider");
  }
  return context;
}