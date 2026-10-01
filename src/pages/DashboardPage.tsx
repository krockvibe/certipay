import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Copy, Eye, LogOut, ChevronLeft, Shield, DollarSign, Clock, FileText, CheckCircle, XCircle, Loader2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/context/AuthContext";
import { useReceipts } from "@/context/ReceiptContext";
import { ReceiptPreview } from "@/components/receipt/ReceiptPreview";
import { TrackingReceiptPreview } from "@/components/receipt/TrackingReceiptPreview";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ReceiptData } from "@/types/receipt";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobileNav } from "@/components/MobileNav";
import { BrandMark } from "@/components/BrandMark";

const statusConfig = {
  pending: { label: "Pending", color: "warning", icon: Clock },
  processing: { label: "Processing", color: "info", icon: Loader2 },
  successful: { label: "Successful", color: "success", icon: CheckCircle },
  failed: { label: "Failed", color: "destructive", icon: XCircle },
  reversed: { label: "Reversed", color: "secondary", icon: AlertCircle },
};

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="font-display text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${color ? `bg-${color}/10 text-${color}` : "bg-primary/10 text-primary"}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { receipts, deleteReceipt, startEditing } = useReceipts();
  const { toasts, toast, dismiss } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [viewMode, setViewMode] = useState<"receipt" | "tracking">("tracking");

  // Only show receipts that belong to the signed-in user. Legacy receipts
  // saved before ownership was tracked have no createdBy, so they are only
  // surfaced to signed-out visitors rather than leaking into every account.
  const userReceipts = user
    ? receipts.filter((r) => r.createdBy === user.email)
    : receipts.filter((r) => !r.createdBy);
  const sortedReceipts = [...userReceipts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredReceipts = sortedReceipts.filter((receipt) => {
    const matchesSearch = receipt.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.receiverName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || receipt.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (receipt: ReceiptData) => {
    if (!confirm(`Delete receipt ${receipt.trackingCode}? This cannot be undone.`)) return;
    deleteReceipt(receipt.id);
    setSelectedReceipt((current) => (current?.id === receipt.id ? null : current));
    toast({
      title: "Receipt Deleted",
      description: `${receipt.trackingCode} has been removed`,
      variant: "success",
    });
  };

  const handleView = (receipt: ReceiptData) => {
    setSelectedReceipt(receipt);
    setViewMode("tracking");
  };

  const handleEdit = (receipt: ReceiptData) => {
    startEditing(receipt);
    navigate("/create");
  };

  const handlePrint = (receipt: ReceiptData) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              .receipt { max-width: 420px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .code { font-family: monospace; background: #f3f4f6; padding: 10px; border-radius: 5px; margin: 15px 0; }
              .btn { display: inline-block; padding: 8px 16px; background: #078BC5; color: white; text-decoration: none; border-radius: 5px; margin: 5px 0; width: 100%; }
              .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h3>CertiPayReceipt</h3>
              </div>
              <p><strong>Tracking Code:</strong> ${receipt.trackingCode}</p>
              <p><strong>Sender:</strong> ${receipt.senderName}</p>
              <p><strong>Receiver:</strong> ${receipt.receiverName}</p>
              <p><strong>Amount:</strong> ${receipt.amount} ${receipt.currency}</p>
              <p><strong>Status:</strong> ${receipt.status}</p>
              <a href="#" class="btn" onclick="window.print(); return false;">Print Receipt</a>
              <div class="footer">
                Generated on {formatDate(receipt.dateTime)}
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      toast({
        title: "Print Preview",
        description: "Opening print dialog",
        variant: "default",
      });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Receipt code copied", variant: "success" });
  };

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2">
                <BrandMark />
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link to="/create" className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Receipt
                </Link>
                <Link to="/track" className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                  <Search className="h-4 w-4 mr-1" />
                  Track
                </Link>
                <Link to="/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium text-primary bg-primary/10">
                  <Shield className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
              </nav>
              <div className="flex items-center gap-3">
                <span className="hidden md:block text-sm text-muted-foreground">{user?.name}</span>
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="hidden md:inline-flex text-muted-foreground hover:text-foreground">
                  <LogOut className="h-5 w-5" />
                </Button>
                <MobileNav />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ChevronLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Manage your transfer receipts</p>
              </div>
              <Link to="/create">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Receipt
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Receipts" value={userReceipts.length} icon={FileText} />
            <StatCard title="Pending" value={userReceipts.filter(r => r.status === "pending").length} icon={Clock} color="warning" />
            <StatCard title="Completed" value={userReceipts.filter(r => r.status === "successful").length} icon={CheckCircle} color="success" />
            <StatCard title="Total Amount" value={formatCurrency(userReceipts.reduce((sum, r) => sum + r.amount, 0))} icon={DollarSign} />
          </div>

          {/* Search & Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by code, sender, receiver..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="successful">Successful</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="reversed">Reversed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receipts Table */}
          <Card>
            <CardContent className="p-0">
              {filteredReceipts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">No receipts found</h3>
                  <p className="text-muted-foreground mb-6">Create your first receipt or adjust your filters</p>
                  <Link to="/create">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Receipt
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Card list on small screens. The table below needs
                      horizontal scrolling at this width, which hides the
                      action buttons on a phone. */}
                  <ul className="md:hidden divide-y divide-border/50">
                    {filteredReceipts.map((receipt) => (
                      <li key={receipt.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <code className="font-mono text-sm bg-muted px-2 py-1 rounded inline-block">
                              {receipt.trackingCode}
                            </code>
                            <p className="mt-2 font-medium text-foreground truncate">
                              {receipt.senderName}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              to {receipt.receiverName}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-mono font-medium">
                              {formatCurrency(receipt.amount, receipt.currency)}
                            </p>
                            <Badge
                              variant={statusConfig[receipt.status as keyof typeof statusConfig]?.color as any || "secondary"}
                              className="mt-1"
                            >
                              {statusConfig[receipt.status as keyof typeof statusConfig]?.label || receipt.status}
                            </Badge>
                          </div>
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDate(receipt.dateTime)}
                        </p>

                        <div className="mt-3 flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleView(receipt)}
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEdit(receipt)}
                          >
                            <Edit className="h-4 w-4 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyCode(receipt.trackingCode)}
                            title="Copy code"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(receipt)}
                            title="Delete"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 font-semibold text-muted-foreground">Code</th>
                        <th className="text-left p-4 font-semibold text-muted-foreground">Sender → Receiver</th>
                        <th className="text-left p-4 font-semibold text-muted-foreground">Amount</th>
                        <th className="text-left p-4 font-semibold text-muted-foreground">Status</th>
                        <th className="text-left p-4 font-semibold text-muted-foreground">Date</th>
                        <th className="text-right p-4 font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReceipts.map((receipt) => (
                        <tr key={receipt.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{receipt.trackingCode}</code>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{receipt.senderName}</p>
                              <p className="text-sm text-muted-foreground">→ {receipt.receiverName}</p>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-medium">{formatCurrency(receipt.amount, receipt.currency)}</td>
                          <td className="p-4">
                            <Badge variant={statusConfig[receipt.status as keyof typeof statusConfig]?.color as any || "secondary"}>
                              {statusConfig[receipt.status as keyof typeof statusConfig]?.label || receipt.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{formatDate(receipt.dateTime)}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => copyCode(receipt.trackingCode)} title="Copy code">
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleView(receipt)} title="View tracking">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(receipt)} title="Edit">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(receipt)} title="Delete" className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Receipt Detail Modal */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
            <div className="bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Receipt Preview</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setViewMode(v => v === "receipt" ? "tracking" : "receipt")}>
                    <span className="ml-1 sr-only">Switch view</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedReceipt(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="p-6">
                {viewMode === "tracking" ? (
                  <TrackingReceiptPreview data={selectedReceipt} />
                ) : (
                  <ReceiptPreview data={selectedReceipt} />
                )}
              </div>
              <div className="p-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => copyCode(selectedReceipt.trackingCode)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
                <Button onClick={() => navigate(`/track?code=${selectedReceipt.trackingCode}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View on Track Page
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <ToastViewport className="fixed bottom-4 right-4 z-50">
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