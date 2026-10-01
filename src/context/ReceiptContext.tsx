import { createContext, useContext, useReducer, type ReactNode, useEffect } from "react";
import type { ReceiptData, ReceiptFormData } from "@/types/receipt";
import { defaultFormData } from "@/types/receipt";
import { generateTrackingCode, generateTransactionId } from "@/lib/utils";

interface ReceiptState {
  receipts: ReceiptData[];
  currentForm: ReceiptFormData;
  isLoading: boolean;
  editingId: string | null;
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
};

function receiptReducer(state: ReceiptState, action: ReceiptAction): ReceiptState {
  switch (action.type) {
    case "SET_RECEIPTS":
      return { ...state, receipts: action.payload, isLoading: false };
    case "ADD_RECEIPT":
      return { ...state, receipts: [action.payload, ...state.receipts] };
    case "UPDATE_RECEIPT":
      return {
        ...state,
        receipts: state.receipts.map((r) => (r.id === action.payload.id ? action.payload : r)),
      };
    case "DELETE_RECEIPT":
      return {
        ...state,
        receipts: state.receipts.filter((r) => r.id !== action.payload),
      };
    case "UPDATE_FORM":
      return { ...state, currentForm: { ...state.currentForm, ...action.payload } };
    case "RESET_FORM":
      return { ...state, currentForm: defaultFormData, editingId: null };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
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
      progress: parseInt(formData.progress) || 0,
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
    };
    dispatch({ type: "ADD_RECEIPT", payload: receipt });
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
      progress: parseInt(formData.progress) || 0,
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
    return receipt;
  };

  const deleteReceipt = (id: string) => {
    dispatch({ type: "DELETE_RECEIPT", payload: id });
    if (state.editingId === id) {
      dispatch({ type: "SET_EDITING", payload: null });
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
        progress: String(receipt.progress),
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