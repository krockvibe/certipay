import React from "react";
import { Link } from "react-router-dom";
import { DollarSign, ArrowRight, FileText, Search, CreditCard, Clock, Globe, Lock, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "@/components/MobileNav";

const features = [
  {
    Icon: FileText,
    title: "Create Receipts",
    description: "Generate professional transfer receipts with custom branding, messaging, and detailed transaction information.",
    href: "/create",
    color: "bg-emerald-500",
  },
  {
    Icon: Search,
    title: "Track Transfers",
    description: "Instantly look up any transfer using the 10-digit receipt code. View status, progress, and full details.",
    href: "/track",
    color: "bg-blue-500",
  },
  {
    Icon: CreditCard,
    title: "Multiple Payment Methods",
    description: "Support for Bank Transfer, Wire, ACH, SWIFT, SEPA, Crypto, Card, and Cash payments.",
    href: "/create",
    color: "bg-purple-500",
  },
  {
    Icon: Globe,
    title: "Global Currencies",
    description: "Support for USD, EUR, GBP, CAD, AUD, JPY, CHF, CNY, INR, BRL and more currencies.",
    href: "/create",
    color: "bg-orange-500",
  },
  {
    Icon: Lock,
    title: "Secure Tracking Codes",
    description: "Unique 10-digit codes for each receipt. Share securely with receivers for tracking.",
    href: "/track",
    color: "bg-red-500",
  },
  {
    Icon: Sparkles,
    title: "Custom Branding",
    description: "Upload logos, customize colors, add custom messages, and legal disclaimers.",
    href: "/create",
    color: "bg-pink-500",
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <DollarSign className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">CertiPay</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/create" className="px-3 py-2 rounded-lg text-sm font-medium text-primary bg-primary/10">
                Create Receipt
              </Link>
              <Link to="/track" className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                Track Transfer
              </Link>
              <Link to="/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                Dashboard
              </Link>
            </nav>
            <div className="flex items-center gap-2 md:hidden">
              <MobileNav />
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-4xl mx-auto animate-fade-in">
              <Badge variant="secondary" className="mb-6 inline-flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                CertiPay - Secure Transfer Receipts
              </Badge>
              <h1 className="font-display text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
                Create & Track
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Transfer Receipts
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Generate professional transfer receipts with custom branding, real-time status tracking, 
                and secure 10-digit codes. Built for modern financial transactions.
              </p>
<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/create">
                  <Button size="lg" className="w-full sm:w-auto gap-2 text-lg px-8 py-4" style={{ minWidth: "220px" }}>
                    <FileText className="h-5 w-5" />
                    Create Receipt
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/track">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 text-lg px-8 py-4" style={{ minWidth: "220px" }}>
                    <Search className="h-5 w-5" />
                    Track Transfer
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/track">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2 text-lg px-8 py-4" style={{ minWidth: "220px" }}>
                    <Eye className="h-5 w-5" />
                    Live Tracking Preview
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 animate-slide-in">
              <StatCard value="10-Digit" label="Tracking Codes" Icon={DollarSign} />
              <StatCard value="Real-time" label="Status Updates" Icon={Clock} />
              <StatCard value="10+" label="Currencies" Icon={Globe} />
              <StatCard value="8" label="Payment Methods" Icon={CreditCard} />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-28 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="font-display text-4xl font-bold text-foreground mb-4">Everything You Need</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful features for creating professional transfer receipts and tracking them securely.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Link key={feature.title} to={feature.href} className="group">
                  <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-primary/10 group-hover:border-primary/20">
                    <CardContent className="p-6">
                      <div className={`p-3 rounded-xl ${feature.color} text-white mb-4 inline-block group-hover:scale-110 transition-transform`}>
                        <feature.Icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-display text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="font-display text-4xl font-bold text-foreground mb-4">How It Works</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Simple three-step process to create and share transfer receipts.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <StepCard step={1} title="Fill Details" description="Enter sender, receiver, bank, amount, and customize messages and branding." Icon={FileText} />
              <StepCard step={2} title="Generate Code" description="Click generate to create a unique 10-digit tracking code and professional receipt." Icon={DollarSign} />
              <StepCard step={3} title="Share & Track" description="Share the code with the receiver. They can track status anytime at /track." Icon={Search} />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28 bg-primary">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
              Ready to Create Your First Receipt?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join thousands of users creating professional transfer receipts in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/create">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2 text-lg px-8 py-4" style={{ minWidth: "220px" }}>
                  <FileText className="h-5 w-5" />
                  Create Receipt Now
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/track">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 text-lg px-8 py-4 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" style={{ minWidth: "220px" }}>
                  <Search className="h-5 w-5" />
                  Track a Transfer
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
<Link to="/" className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary rounded-lg">
                <DollarSign className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">CertiPay</span>
            </Link>
              <p className="text-muted-foreground max-w-sm">
                Secure transfer receipt generation and tracking. Built with modern technology for reliable financial transactions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/create" className="hover:text-foreground transition-colors">Create Receipt</Link></li>
                <li><Link to="/track" className="hover:text-foreground transition-colors">Track Transfer</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Custom Branding</li>
                <li>Multi-Currency</li>
                <li>Secure Codes</li>
                <li>Real-time Status</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2025 CertiPay. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="#" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="#" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ value, label, Icon }: { value: string; label: string; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="text-center">
      <CardContent className="py-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
          <Icon className="h-6 w-6" />
        </div>
        <p className="font-display text-3xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({ step, title, description, Icon }: { step: number; title: string; description: string; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="relative">
      <CardContent className="p-6 text-center">
        <div className="relative mb-4">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-full h-full flex items-center justify-center pointer-events-none">
            <div className="w-full h-0.5 bg-muted" />
          </div>
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-display text-2xl font-bold">
            {step}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-primary/10 text-primary mb-4 inline-block">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}