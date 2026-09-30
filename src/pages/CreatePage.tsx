import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check, AlertTriangle, Loader2, DollarSign, Eye, Edit, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { useToast } from "@/hooks/useToast";
import { useReceipts } from "@/context/ReceiptContext";
import { useAuth } from "@/context/AuthContext";
import type { ReceiptFormData } from "@/types/receipt";
import { defaultFormData } from "@/types/receipt";
import { generateTrackingCode } from "@/lib/utils";
import {
  FormSection,
  PartiesSection,
  TransactionSection,
  MessagingSection,
  FooterSection,
  BrandingSection,
  GenerateButton,
} from "@/components/receipt/CreateFormSections";
import { ReceiptPreview } from "@/components/receipt/ReceiptPreview";
import { TrackingReceiptPreview } from "@/components/receipt/TrackingReceiptPreview";
import { useMultipleImageUploads } from "@/hooks/useImageUpload";

const previewData: ReceiptFormData = {
  senderName: "John Doe",
  receiverName: "Jane Smith",
  bankName: "CHASE",
  accountNumber: "**** **** **** 1234",
  amount: "70000.00",
  currency: "USD",
  status: "processing",
  dateTime: new Date().toISOString().slice(0, 16),
  paymentMethod: "Bank Transfer",
  progress: "80",
  feeAmount: "7000",
  feeStatus: "unresolved",
  billingWarning: "",
  pendingMessage: "We are processing your transfer.",
  maturityMessage: "We apologize for any inconvenience. Thank you for selecting our bank for your financial needs.",
  customNotes: "",
  cryptoWallet: "",
  footerText: defaultFormData.footerText,
  backgroundColor: "#f8fafc",
  brandColor: "#1e40af",
  logoFile: null,
  bankLogoFile: null,
  receiptImageFile: null,
};

export function CreatePage() {
  const navigate = useNavigate();
  const { currentForm, updateForm, resetForm, saveReceipt, isLoading } = useReceipts();
  const { user } = useAuth();
  const { logo, bankLogo, receiptImage, uploadAll, clearAll } = useMultipleImageUploads();
  const { toasts, toast, dismiss } = useToast();
  const [generatedReceipt, setGeneratedReceipt] = useState<{ code: string; data: any } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "tracking">("form");

  // Assign a stable receipt code up front so the preview shows the same
  // code that gets saved (and can be looked up on /track).
  useEffect(() => {
    if (!currentForm.trackingCode) {
      updateForm({ trackingCode: generateTrackingCode() });
    }
  }, [currentForm.trackingCode, updateForm]);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const { logoUrl, bankLogoUrl, receiptImageUrl } = await uploadAll();
      const receipt = saveReceipt(currentForm, logoUrl, bankLogoUrl, receiptImageUrl, user?.email);
      setGeneratedReceipt({ code: receipt.trackingCode, data: receipt });
      toast({
        title: "Receipt Generated!",
        description: `Your receipt code is ${receipt.trackingCode}`,
        variant: "success",
      });
      setActiveTab("form");
      resetForm();
      updateForm({ trackingCode: generateTrackingCode() });
      clearAll();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [currentForm, uploadAll, saveReceipt, toast, resetForm, updateForm, clearAll, isGenerating]);

  const copyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Receipt code copied to clipboard",
      variant: "success",
    });
  }, [toast]);

  const goToTrack = useCallback((code: string) => {
    navigate(`/track?code=${code}`);
  }, [navigate]);

  const isFormValid = currentForm.senderName && currentForm.receiverName && currentForm.bankName && currentForm.accountNumber && currentForm.amount;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-6">
<Link to="/" className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <DollarSign className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">CertiPay</span>
            </Link>
                <nav className="hidden md:flex items-center gap-1">
                  <Link to="/create" className="px-3 py-2 rounded-lg text-sm font-medium text-primary bg-primary/10">
                    Create
                  </Link>
                  <Link to="/track" className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                    Track
                  </Link>
                </nav>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/track">Track a Transfer</Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">Create Receipt</h1>
                <p className="text-muted-foreground mt-1">
                  Fill in the details below. A unique 10-digit tracking code will be generated on save.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Live Preview
                </Badge>
              </div>
            </div>
          </div>

          {/* Form & Preview Grid */}
          <div className="grid lg:grid-cols-[1fr_480px] gap-8">
            {/* Form Side */}
            <div className="space-y-6 animate-fade-in">
              <PartiesSection />
              <TransactionSection />
              <MessagingSection />
              <FooterSection />
              <BrandingSection />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-card border rounded-xl">
                <div className="flex flex-wrap items-center gap-3">
                  <GenerateButton onGenerate={handleGenerate} />
                  <Button
                    variant="outline"
                    onClick={() => { resetForm(); clearAll(); }}
                    disabled={isGenerating}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Reset Form
                  </Button>
                </div>
                {!isFormValid && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
                    <AlertTriangle className="h-4 w-4" />
                    Please fill in all required fields (marked with *)
                  </div>
                )}
              </div>
            </div>

            {/* Preview Side */}
            <div className="hidden lg:block animate-slide-in">
              <div className="sticky top-24">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Live Preview</CardTitle>
                      <Badge variant="default" className="px-2 py-1 text-xs">
                        <Eye className="h-3 w-3 mr-1" /> Tracking
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="aspect-[4/3] relative">
                      <TrackingReceiptPreview data={currentForm} isDemo={true} />
                    </div>
                  </CardContent>
                </Card>

                {generatedReceipt && (
                  <div className="mt-4 space-y-3 animate-fade-in">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground text-center">Share this code with the receiver</p>
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex-1 text-center p-4 rounded-lg border bg-muted/50">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tracking Code</p>
                              <p className="font-mono text-2xl font-bold text-foreground">{generatedReceipt.code}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyCode(generatedReceipt.code)}
                              aria-label="Copy tracking code"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button className="flex-1" onClick={() => goToTrack(generatedReceipt.code)}>
                              <Check className="h-4 w-4 mr-2" />
                              Track This Receipt
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={() => setGeneratedReceipt(null)}>
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Create Another
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Mobile Preview Toggle */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-4 z-50 animate-slide-in">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Button variant={activeTab === "form" ? "default" : "outline"} className="flex-1" onClick={() => setActiveTab("form")}>
              Form
            </Button>
            <Button variant={activeTab === "tracking" ? "default" : "outline"} className="flex-1" onClick={() => setActiveTab("tracking")}>
              <Eye className="h-4 w-4 mr-1" /> Tracking
            </Button>
          </div>
        </div>

        {/* Toast Notifications */}
        <ToastViewport>
          {toasts.map((t) => (
            <Toast key={t.id} variant={t.variant}>
              <div className="grid gap-1">
                <ToastTitle>{t.title}</ToastTitle>
                {t.description && <ToastDescription>{t.description}</ToastDescription>}
              </div>
              <ToastClose onClick={() => dismiss(t.id)} />
            </Toast>
          ))}
        </ToastViewport>
      </div>
    </ToastProvider>
  );
}