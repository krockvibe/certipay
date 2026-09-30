import { createContext, useContext, useReducer, type ReactNode, useEffect } from "react";
import type { ReceiptData, ReceiptFormData } from "@/types/receipt";
import { defaultFormData } from "@/types/receipt";
import { generateTrackingCode, generateTransactionId } from "@/lib/utils";

interface ReceiptState {
  receipts: ReceiptData[];
  currentForm: ReceiptFormData;
  isLoading: boolean;
}

type ReceiptAction =
  | { type: "SET_RECEIPTS"; payload: ReceiptData[] }
  | { type: "ADD_RECEIPT"; payload: ReceiptData }
  | { type: "UPDATE_FORM"; payload: Partial<ReceiptFormData> }
  | { type: "RESET_FORM" }
  | { type: "SET_LOADING"; payload: boolean };

const initialState: ReceiptState = {
  receipts: [],
  currentForm: defaultFormData,
  isLoading: true,
};

function receiptReducer(state: ReceiptState, action: ReceiptAction): ReceiptState {
  switch (action.type) {
    case "SET_RECEIPTS":
      return { ...state, receipts: action.payload, isLoading: false };
    case "ADD_RECEIPT":
      return { ...state, receipts: [action.payload, ...state.receipts] };
    case "UPDATE_FORM":
      return { ...state, currentForm: { ...state.currentForm, ...action.payload } };
    case "RESET_FORM":
      return { ...state, currentForm: defaultFormData };
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