import React from "react";
import type { ReceiptData } from "@/types/receipt";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, XCircle, Loader2, Clock, DollarSign, CreditCard, Truck, Mail, Shield, Globe, Lock, User } from "lucide-react";

interface ReceiptPreviewProps {
  data: ReceiptData;
  className?: string;
}

const statusConfig = {
  pending: { label: "Pending", color: "warning", icon: Clock },
  processing: { label: "Processing", color: "info", icon: Loader2 },
  successful: { label: "Successful", color: "success", icon: CheckCircle },
  failed: { label: "Failed", color: "destructive", icon: XCircle },
  reversed: { label: "Reversed", color: "secondary", icon: AlertCircle },
};

const feeStatusConfig = {
  unresolved: { label: "Unresolved", color: "warning" },
  pending: { label: "Pending", color: "info" },
  paid: { label: "Paid", color: "success" },
  waived: { label: "Waived", color: "secondary" },
};

export function ReceiptPreview({ data, className }: ReceiptPreviewProps) {
  const StatusIcon = statusConfig[data.status].icon;
  const statusLabel = statusConfig[data.status].label;
  const statusColor = statusConfig[data.status].color;
  const feeStatusLabel = feeStatusConfig[data.feeStatus].label;
  const feeStatusColor = feeStatusConfig[data.feeStatus].color;

  const receiptStyle: React.CSSProperties = {
    backgroundColor: data.backgroundColor,
    borderColor: data.brandColor,
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 shadow-xl transition-all duration-300",
        "bg-white dark:bg-gray-900",
        className
      )}
      style={receiptStyle}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-brand-color/5 to-transparent" />
      
      <div className="relative p-6 space-y-6">
        {/* Header: the uploaded bank logo is the only brand mark. The legacy
            logoUrl image is deliberately not rendered, so the header never shows
            two competing logos. */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              {/* The bank logo IS the brand on this receipt. No text fallback:
                  if no logo is uploaded the slot is simply empty. */}
              {data.bankLogoUrl && (
                <img
                  src={data.bankLogoUrl}
                  alt={data.bankName || "Bank Logo"}
                  style={{
                    height: "96px",
                    maxWidth: "576px",
                    width: "auto",
                    objectFit: "contain",
                    objectPosition: "left top",
                    marginLeft: "-8px",
                  }}
                />
              )}
              <p className="text-sm text-muted-foreground">Secure Transfer Receipt</p>
            </div>
          </div>
        </div>

        {/* Receipt Image */}
        {data.receiptImageUrl && (
          <div className="relative aspect-video rounded-xl overflow-hidden">
            <img
              src={data.receiptImageUrl}
              alt="Receipt background"
              className="absolute inset-0 h-full w-full object-cover opacity-10"
            />
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-4">
          {/* Greeting */}
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-1">Hey {data.receiverName},</p>
            <p className="text-lg font-medium text-foreground">{data.bankName} is sending you</p>
            <p className="font-display text-4xl font-bold mt-1" style={{ color: data.brandColor }}>
              {formatCurrency(data.amount, data.currency)}
            </p>
          </div>

          {/* Transaction Summary */}
          <div className="rounded-xl p-4 border" style={{ backgroundColor: data.backgroundColor, borderColor: data.brandColor }}>
            <p className="text-center font-medium text-foreground mb-2">
              {data.bankName} made a {formatCurrency(data.amount, data.currency)} transfer
            </p>
            <p className="text-center text-sm text-muted-foreground">
              {formatDate(data.dateTime)}
            </p>
          </div>

          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Transaction Progress</span>
              <span className="text-sm font-semibold" style={{ color: data.brandColor }}>{data.progress}%</span>
            </div>
            <Progress value={data.progress} className="h-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Started</span>
              <span>In Progress</span>
              <span>Completed</span>
            </div>
          </div>

          {/* Foreign Transaction Fees */}
          {data.feeAmount > 0 && (
            <div className="rounded-lg p-4 border border-warning/30 bg-warning/5">
              <div className="flex items-center gap-2 text-sm font-medium text-warning mb-2">
                <AlertCircle className="h-4 w-4" />
                Foreign Transaction Fees
              </div>
              <p className="text-sm text-muted-foreground">
                You need to make the transaction of {formatCurrency(data.feeAmount, data.currency)}
              </p>
              <Badge variant={feeStatusColor as any} className="mt-2 inline-flex">
                {feeStatusLabel}
              </Badge>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center justify-center gap-2">
            <Badge variant={statusColor as any} className="gap-2 px-4 py-2 text-sm">
              <StatusIcon className="h-4 w-4" />
              Status: {statusLabel}
            </Badge>
          </div>

          {/* Messages */}
          <div className="space-y-3 pt-2">
            {data.pendingMessage && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{data.pendingMessage}</p>
              </div>
            )}
            {data.maturityMessage && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{data.maturityMessage}</p>
              </div>
            )}
            {data.customNotes && (
              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: data.brandColor + "15" }}>
                <Globe className="h-5 w-5 mt-0.5 shrink-0" style={{ color: data.brandColor }} />
                <p className="text-sm text-foreground">{data.customNotes}</p>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            <DetailRow label="From" value={data.senderName} icon={<User className="h-4 w-4" />} brandColor={data.brandColor} />
            <DetailRow label="Method" value={data.paymentMethod} icon={<CreditCard className="h-4 w-4" />} brandColor={data.brandColor} />
            <DetailRow label="Transaction ID" value={data.transactionId} icon={<Lock className="h-4 w-4" />} brandColor={data.brandColor} />
            <DetailRow label="Receipt Code" value={data.trackingCode} icon={<Shield className="h-4 w-4" />} brandColor={data.brandColor} />
          </div>
        </div>

        {/* Footer */}
        <Separator className="my-4" />
        <div className="text-center text-xs text-muted-foreground leading-relaxed max-w-3xl mx-auto">
          {data.footerText}
        </div>

        {/* Receipt Code Display */}
        <div className="pt-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Receipt Code</p>
          <p className="font-mono text-2xl font-bold letter-spacing-wider" style={{ color: data.brandColor }}>
            {data.trackingCode}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon, brandColor }: { label: string; value: string; icon: React.ReactNode; brandColor: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
      <span className="p-2 rounded-lg" style={{ backgroundColor: brandColor + "20", color: brandColor }}>
        {icon}
      </span>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-foreground font-mono">{value}</p>
      </div>
    </div>
  );
}

