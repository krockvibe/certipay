import { DollarSign } from "lucide-react";
import { useReceipts } from "@/context/ReceiptContext";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  /** Icon tile classes, kept so the light and dark header variants match. */
  iconClassName?: string;
  iconColorClassName?: string;
  textClassName?: string;
  className?: string;
}

/**
 * Site brand mark for the app chrome.
 *
 * The receipt header is the uploaded bank logo with no text fallback, so the
 * chrome follows the same rule: once any saved receipt carries a bank logo, that
 * image is the brand everywhere. Receipts are stored newest first, so the most
 * recently generated logo wins.
 *
 * With no saved logo there is nothing to show, so the name is kept as a
 * placeholder until the first upload.
 */
export function BrandMark({
  iconClassName = "p-2 bg-primary rounded-lg",
  iconColorClassName = "text-primary-foreground",
  textClassName = "font-display text-xl font-bold text-foreground",
  className,
}: BrandMarkProps) {
  const { receipts } = useReceipts();
  const logoUrl = receipts.find((r) => r.bankLogoUrl)?.bankLogoUrl;

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="CertiPay"
        className={cn("h-6 w-auto object-contain object-left", className)}
        style={{ maxWidth: "120px", height: "24px", width: "auto" }}
      />
    );
  }

  return (
    <>
      <div className={cn(iconClassName, className)}>
        <DollarSign className={cn("h-5 w-5", iconColorClassName)} />
      </div>
      <span className={textClassName}>CertiPay</span>
    </>
  );
}
