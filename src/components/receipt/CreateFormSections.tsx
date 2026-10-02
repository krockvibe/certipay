import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Upload, X, FileImage, Palette, CreditCard, Building2, User, Mail, Calendar, DollarSign, Loader2, Edit } from "lucide-react";
import { useReceipts } from "@/context/ReceiptContext";
import type { ReceiptFormData } from "@/types/receipt";
import { CURRENCIES, PAYMENT_METHODS, STATUSES, FEE_STATUSES, defaultFormData } from "@/types/receipt";
import { useImageUpload, useMultipleImageUploads } from "@/hooks/useImageUpload";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Clamps progress while it is being typed, but lets the field sit empty so a
 * half-typed number is not rewritten under the cursor. The empty case still
 * renders as 0% on the receipt via clampProgress.
 */
function clampProgressInput(raw: string): string {
  if (raw === "" || raw === "-") return raw;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) return "0";
  return String(Math.max(0, Math.min(100, parsed)));
}

export function FormSection({ title, description, icon, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4 p-6 bg-card border rounded-xl transition-all duration-200 hover:shadow-md", className)}>
      <div className="flex items-center gap-3 mb-4">
        {icon && <span className="p-2 bg-primary/10 rounded-lg text-primary">{icon}</span>}
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      <Separator className="mb-4" />
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function PartiesSection() {
  const { currentForm, updateForm } = useReceipts();

  return (
    <FormSection title="Parties" description="Sender and receiver information" icon={<User className="h-5 w-5" />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="senderName">Sender Name *</Label>
          <Input
            id="senderName"
            value={currentForm.senderName}
            onChange={(e) => updateForm({ senderName: e.target.value })}
            placeholder="John Doe"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="receiverName">Receiver Name *</Label>
          <Input
            id="receiverName"
            value={currentForm.receiverName}
            onChange={(e) => updateForm({ receiverName: e.target.value })}
            placeholder="Jane Smith"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankName">Bank Name *</Label>
          <Input
            id="bankName"
            value={currentForm.bankName}
            onChange={(e) => updateForm({ bankName: e.target.value })}
            placeholder="CHASE"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number *</Label>
          <Input
            id="accountNumber"
            type="text"
            value={currentForm.accountNumber}
            onChange={(e) => updateForm({ accountNumber: e.target.value })}
            placeholder="**** **** **** 1234"
            required
          />
        </div>
      </div>
    </FormSection>
  );
}

export function TransactionSection() {
  const { currentForm, updateForm } = useReceipts();

  return (
    <FormSection title="Transaction" description="Transfer details and status" icon={<DollarSign className="h-5 w-5" />}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={currentForm.amount}
            onChange={(e) => updateForm({ amount: e.target.value })}
            placeholder="70000.00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={currentForm.currency} onValueChange={(value) => updateForm({ currency: value })} >
            <SelectTrigger id="currency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr} value={curr}>{curr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={currentForm.status} onValueChange={(value) => updateForm({ status: value as ReceiptFormData["status"] })} >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateTime">Date & Time</Label>
          <Input
            id="dateTime"
            type="datetime-local"
            value={currentForm.dateTime}
            onChange={(e) => updateForm({ dateTime: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select value={currentForm.paymentMethod} onValueChange={(value) => updateForm({ paymentMethod: value })} >
            <SelectTrigger id="paymentMethod">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method} value={method}>{method}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="progress">Progress (%)</Label>
          <Input
            id="progress"
            type="number"
            min="0"
            max="100"
            value={currentForm.progress}
            onChange={(e) => updateForm({ progress: clampProgressInput(e.target.value) })}
            placeholder="80"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feeAmount">Fee Amount</Label>
          <Input
            id="feeAmount"
            type="number"
            step="0.01"
            min="0"
            value={currentForm.feeAmount}
            onChange={(e) => updateForm({ feeAmount: e.target.value })}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feeStatus">Fee Status</Label>
          <Select value={currentForm.feeStatus} onValueChange={(value) => updateForm({ feeStatus: value as ReceiptFormData["feeStatus"] })} >
            <SelectTrigger id="feeStatus">
              <SelectValue placeholder="Select fee status" />
            </SelectTrigger>
            <SelectContent>
              {FEE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FormSection>
  );
}

export function MessagingSection() {
  const { currentForm, updateForm } = useReceipts();

  return (
    <FormSection title="Messaging" description="Custom messages displayed on the receipt" icon={<Mail className="h-5 w-5" />}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="billingWarning">Billing Warning</Label>
          <Textarea
            id="billingWarning"
            value={currentForm.billingWarning}
            onChange={(e) => updateForm({ billingWarning: e.target.value })}
            placeholder="Enter billing warning message..."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pendingMessage">Pending Message</Label>
          <Textarea
            id="pendingMessage"
            value={currentForm.pendingMessage}
            onChange={(e) => updateForm({ pendingMessage: e.target.value })}
            placeholder="We are processing your transfer."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maturityMessage">Maturity Message</Label>
          <Textarea
            id="maturityMessage"
            value={currentForm.maturityMessage}
            onChange={(e) => updateForm({ maturityMessage: e.target.value })}
            placeholder="We apologize for any inconvenience..."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customNotes">Custom Notes</Label>
          <Textarea
            id="customNotes"
            value={currentForm.customNotes}
            onChange={(e) => updateForm({ customNotes: e.target.value })}
            placeholder="Additional notes..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cryptoWallet">Crypto Wallet</Label>
          <Input
            id="cryptoWallet"
            value={currentForm.cryptoWallet}
            onChange={(e) => updateForm({ cryptoWallet: e.target.value })}
            placeholder="0x..."
          />
        </div>
      </div>
    </FormSection>
  );
}

export function FooterSection() {
  const { currentForm, updateForm } = useReceipts();

  return (
    <FormSection title="Footer / Legal Disclaimer" description="Legal text displayed at the bottom of the receipt" icon={<Building2 className="h-5 w-5" />}>
      <div className="space-y-2">
        <Label htmlFor="footerText">Footer Text</Label>
        <Textarea
          id="footerText"
          value={currentForm.footerText}
          onChange={(e) => updateForm({ footerText: e.target.value })}
          placeholder="Legal disclaimer text..."
          rows={6}
          className="font-mono text-xs"
        />
        <Button variant="ghost" size="sm" onClick={() => updateForm({ footerText: defaultFormData.footerText })}>
          Reset to Default
        </Button>
      </div>
    </FormSection>
  );
}

export function BrandingSection() {
  const { currentForm, updateForm } = useReceipts();
  const { bankLogo, receiptImage, uploadAll, clearAll } = useMultipleImageUploads();

  const handleColorChange = (field: "backgroundColor" | "brandColor", value: string) => {
    updateForm({ [field]: value });
  };

  // The preview on this page renders the receipt live, so the picked files have
  // to reach the form state. Without this the File objects stay local to the
  // upload hook and the preview only gets a logo after the receipt is generated.
  useEffect(() => {
    updateForm({
      bankLogoFile: bankLogo.file,
      receiptImageFile: receiptImage.file,
    });
  }, [bankLogo.file, receiptImage.file, updateForm]);

  const renderImageUpload = (
    label: string,
    upload: ReturnType<typeof useImageUpload>,
    onClear: () => void
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={upload.handleFileChange}
          className="sr-only"
          id={`${label.toLowerCase().replace(/\s+/g, "-")}-upload`}
        />
        <label
          htmlFor={`${label.toLowerCase().replace(/\s+/g, "-")}-upload`}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-all",
            "hover:border-primary/50 hover:bg-primary/5",
            upload.preview && "border-solid border-primary bg-primary/5"
          )}
        >
          {upload.preview ? (
            <>
              <img src={upload.preview} alt={label} className="h-24 w-auto rounded-lg object-cover" />
              <Button variant="ghost" size="sm" onClick={onClear} className="mt-2">
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
            </>
          ) : (
            <>
              <FileImage className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload {label.toLowerCase()}</span>
              <span className="text-xs text-muted-foreground">PNG, JPG up to 5MB</span>
            </>
          )}
        </label>
      </div>
    </div>
  );

  return (
    <FormSection title="Branding & Images" description="Your bank logo replaces the CertiPay name on the receipt" icon={<Palette className="h-5 w-5" />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="backgroundColor">Background Color</Label>
          <div className="flex items-center gap-3">
            <input
              id="backgroundColor"
              type="color"
              value={currentForm.backgroundColor}
              onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
              className="h-10 w-10 rounded-lg cursor-pointer border border-border"
            />
            <Input
              value={currentForm.backgroundColor}
              onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
              placeholder="#f8fafc"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="brandColor">Brand Color</Label>
          <div className="flex items-center gap-3">
            <input
              id="brandColor"
              type="color"
              value={currentForm.brandColor}
              onChange={(e) => handleColorChange("brandColor", e.target.value)}
              className="h-10 w-10 rounded-lg cursor-pointer border border-border"
            />
            <Input
              value={currentForm.brandColor}
              onChange={(e) => handleColorChange("brandColor", e.target.value)}
              placeholder="#0f766e"
            />
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* One brand image, not two. The uploaded image replaces the CertiPay
          wordmark in the receipt header, so a separate "Logo" slot would only
          ever be a second source for the same thing. */}
      <div className="grid gap-4 sm:grid-cols-2">
        {renderImageUpload("Bank Logo", bankLogo, bankLogo.clear)}
        {renderImageUpload("Receipt Image", receiptImage, receiptImage.clear)}
      </div>
    </FormSection>
  );
}

export function GenerateButton({ onGenerate }: { onGenerate: () => void }) {
  const { currentForm, editingId } = useReceipts();
  const isValid = currentForm.senderName && currentForm.receiverName && currentForm.bankName && currentForm.accountNumber && currentForm.amount;

  return (
    <Button
      onClick={onGenerate}
      disabled={!isValid}
      size="lg"
      className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
      style={{ minWidth: "200px" }}
    >
      {editingId ? <Edit className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
      {editingId ? "Save Changes" : "Generate Receipt"}
    </Button>
  );
}