import React, { useState, useEffect } from "react";
import type { ReceiptData, ReceiptFormData } from "@/types/receipt";
import { formatCurrency, generateTrackingCode, clampProgress } from "@/lib/utils";

interface TrackingReceiptPreviewProps {
  data: ReceiptData | ReceiptFormData;
  className?: string;
}

const statusColors = {
  pending: { badge: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500" },
  processing: { badge: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  successful: { badge: "bg-green-100 text-green-800", dot: "bg-green-500" },
  failed: { badge: "bg-red-100 text-red-800", dot: "bg-red-500" },
  reversed: { badge: "bg-gray-100 text-gray-800", dot: "bg-gray-500" },
};

export function TrackingReceiptPreview({ data, className }: TrackingReceiptPreviewProps) {
  const amount = typeof data.amount === "string" ? parseFloat(data.amount) : (data.amount || 0);
  const money = formatCurrency(amount, data.currency || "USD");
  const progress = clampProgress(data.progress);
  const sender = data.senderName || "IJKL";
  const recipient = data.receiverName || "EFGH";
  const bankName = data.bankName || "CHASE";
  const timestamp = data.dateTime ? new Date(data.dateTime).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) : "Sep 29, 04:21 PM";

  // Stable receipt code: uses the code that will actually be saved
  const [fallbackCode] = useState(() => generateTrackingCode());
  const receiptCode = data.trackingCode || fallbackCode;

  // Object URLs must be created once per file and revoked afterwards,
  // otherwise each render leaks a new blob.
  const bankLogoFile = (data as ReceiptFormData).bankLogoFile;
  const bankLogoUrl = "bankLogoUrl" in data ? (data as ReceiptData).bankLogoUrl : "";

  const [objectUrl, setObjectUrl] = useState("");

  useEffect(() => {
    if (!bankLogoFile) {
      setObjectUrl("");
      return;
    }
    const url = URL.createObjectURL(bankLogoFile);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [bankLogoFile]);

  const logoSrc = objectUrl || bankLogoUrl;

  const feeStatus = statusColors[data.feeStatus as keyof typeof statusColors] || statusColors.pending;
  const transferStatus = statusColors[data.status as keyof typeof statusColors] || statusColors.pending;
  const maturityStatus = statusColors.successful;


  return (
    <div className={`tracking-card ${className || ""}`} style={{ width: "min(100%, 426px)" }}>
      {/* HEADER */}
      <header className="tracking-header">
        {/* The bank logo IS the brand on this receipt. No text fallback: if no
            logo is uploaded the slot is simply empty. */}
        {logoSrc && (
          <img
            src={logoSrc}
            alt={bankName}
            className="brand-image"
            style={{
              height: "64px",
              maxWidth: "320px",
              width: "auto",
              objectFit: "contain",
              objectPosition: "left top",
              marginLeft: "-8px",
            }}
          />
        )}
        <svg className="email-icon" viewBox="0 0 24 24" aria-label="Transfer receipt">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
          <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.8" fill="none" />
        </svg>
      </header>

      {/* SUMMARY */}
      <section className="transfer-summary">
        <div className="greeting">Hey {recipient},</div>
        <div className="sender-line"><strong>{sender}</strong> is sending you</div>
        <div className="amount">{money}</div>
      </section>

      {/* RECEIPT */}
      <section className="receipt">
        {/* TRANSACTION HEADER */}
        <div className="transaction-header">
          <div className="transaction-title">
            <span className="purple-dot"></span>
            <span>{sender} made a {money} transfer</span>
          </div>
          <div className="time-badge">{timestamp}</div>
        </div>

        {/* PROGRESS - Static striped progress bar (original) */}
        <div className="progress-section">
          <div className="progress-label">
            <span>Transaction Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* STATUS LIST */}
        <div className="status-list">
          {/* FEE */}
          <div className="status-row">
            <span className="status-marker marker-orange"></span>
            <div className="status-content">
              <div className="status-title">Foreign Transaction Fees</div>
              <div className="status-description">
                {data.feeAmount ? `You need to make the transaction of ${formatCurrency(typeof data.feeAmount === "string" ? parseFloat(data.feeAmount) : data.feeAmount, data.currency || "USD")}` : "You need to make the transaction of 7000"}
              </div>
            </div>
            <span className={`status-badge ${feeStatus.badge}`}>{data.feeStatus || "Pending"}</span>
          </div>

          {/* STATUS */}
          <div className="status-row">
            <span className="status-marker marker-yellow"></span>
            <div className="status-content">
              <div className="status-title">
                Status
                <svg className="clock-icon" viewBox="0 0 24 24" strokeWidth="1.7" stroke="#e7a921" fill="none">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 8v5l3 2" />
                </svg>
              </div>
              <div className="status-description">{data.pendingMessage || "We are processing your transfer."}</div>
            </div>
            <span className={`status-badge ${transferStatus.badge}`}>{data.status || "Pending"}</span>
          </div>

          {/* MATURITY */}
          <div className="status-row">
            <span className="status-marker marker-red"></span>
            <div className="status-content">
              <div className="status-title">Maturity date</div>
              <div className="status-description">{data.maturityMessage || "We apologize for any inconvenience. Thank you for your patience."}</div>
            </div>
            <span className={`status-badge ${maturityStatus.badge}`}>Completed</span>
          </div>
        </div>

        {/* METADATA */}
        <div className="metadata">
          <div>
            <div className="meta-label">Transaction ID</div>
            <div className="meta-value mono">{data.transactionId || "TRX-463749374"}</div>
          </div>
          <div>
            <div className="meta-label">Account</div>
            <div className="meta-value">{data.accountNumber || "MNOP"}</div>
          </div>
          <div>
            <div className="meta-label">Method</div>
            <div className="meta-value">{data.paymentMethod || "Bank Transfer"}</div>
          </div>
          <div>
            <div className="meta-label">From</div>
            <div className="meta-value">{sender}</div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="receipt-footer">
          <span className="powered">Powered by Secured Transfer</span>
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={`${data.bankName || "Bank"} logo`}
              className="bank-logo-footer"
              style={{
                height: "24px",
                maxWidth: "120px",
                width: "auto",
                objectFit: "contain",
              }}
            />
          ) : (
            <span className="visa-badge">VISA</span>
          )}
        </footer>
      </section>

      {/* RECEIPT CODE */}
      <div className="receipt-code">
        Receipt code: <strong>{receiptCode}</strong>
      </div>

      {/* LEGAL FOOTER TEXT - White, paragraph style */}
      {data.footerText && (
        <div className="legal-footer-text">
          {data.footerText.split('\n').map((paragraph, i) => (
            <p key={i} className="legal-paragraph">{paragraph}</p>
          ))}
        </div>
      )}
    </div>
  );
}