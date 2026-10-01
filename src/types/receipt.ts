export interface ReceiptData {
  id: string;
  trackingCode: string;
  transactionId: string;
  createdAt: string;
  updatedAt: string;

  // Parties
  senderName: string;
  receiverName: string;
  bankName: string;
  accountNumber: string;

  // Transaction
  amount: number;
  currency: string;
  status: "pending" | "processing" | "successful" | "failed" | "reversed";
  dateTime: string;
  paymentMethod: string;
  progress: number;
  feeAmount: number;
  feeStatus: "unresolved" | "pending" | "paid" | "waived";

  // Messaging
  billingWarning: string;
  pendingMessage: string;
  maturityMessage: string;
  customNotes: string;
  cryptoWallet: string;

  // Footer / Legal
  footerText: string;

  // Branding & Images
  backgroundColor: string;
  brandColor: string;
  logoUrl: string;
  bankLogoUrl: string;
  receiptImageUrl: string;

  // User association
  createdBy?: string;
  // Set for receipts generated while signed out, so the dashboard can tell
  // them apart from receipts that genuinely belong to the current user.
  isAnonymous?: boolean;
}

export interface ReceiptFormData {
  // Parties
  senderName: string;
  receiverName: string;
  bankName: string;
  accountNumber: string;

  // Transaction
  amount: string;
  currency: string;
  status: ReceiptData["status"];
  dateTime: string;
  paymentMethod: string;
  progress: string;
  feeAmount: string;
  feeStatus: ReceiptData["feeStatus"];

  // Messaging
  billingWarning: string;
  pendingMessage: string;
  maturityMessage: string;
  customNotes: string;
  cryptoWallet: string;

  // Footer / Legal
  footerText: string;

  // Branding & Images
  backgroundColor: string;
  brandColor: string;
  logoFile: File | null;
  bankLogoFile: File | null;
  receiptImageFile: File | null;

  // Generated fields (optional, for preview)
  trackingCode?: string;
  transactionId?: string;
}

export const defaultFormData: ReceiptFormData = {
  senderName: "",
  receiverName: "",
  bankName: "",
  accountNumber: "",
  amount: "",
  currency: "USD",
  status: "pending",
  dateTime: new Date().toISOString().slice(0, 16),
  paymentMethod: "Bank Transfer",
  progress: "0",
  feeAmount: "",
  feeStatus: "unresolved",
  billingWarning: "",
  pendingMessage: "We are processing your transfer.",
  maturityMessage: "We apologize for any inconvenience. Thank you for selecting our bank for your financial needs.",
  customNotes: "",
  cryptoWallet: "",
// Blank lines become separate paragraphs in the receipt footer.
  footerText:
    "CertiPay is an authorised electronic money institution (EMI), authorised by the Financial Conduct Authority (FCA) under the Electronic Money Regulations 2011 and the Payment Services Regulations 2017 (Firm registration number: 991295).\n\nCertiPay Lithuania UAB is an electronic money institution established in the Republic of Lithuania and regulated by the Bank of Lithuania (registration number: 304871705).\n\nRegistered office: 1a Old Street Yard, White Collar Factory, EC1Y 8AF, London, United Kingdom.\n\nCopyright 2025 CertiPay Ltd",
  backgroundColor: "#f8fafc",
  brandColor: "#1e40af",
  logoFile: null,
  bankLogoFile: null,
  receiptImageFile: null,
};

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "CNY", "INR", "BRL", "ZAR"];
export const PAYMENT_METHODS = ["Bank Transfer", "Wire Transfer", "ACH", "SWIFT", "SEPA", "Crypto", "Card", "Cash"];
export const STATUSES = ["pending", "processing", "successful", "failed", "reversed"] as const;
export const FEE_STATUSES = ["unresolved", "pending", "paid", "waived"] as const;