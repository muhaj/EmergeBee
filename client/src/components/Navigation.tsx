import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Package, LayoutDashboard, Home, Wallet } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const [location] = useLocation();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  const connectWallet = () => {
    // Mock wallet connection for MVP
    const mockAddress = "SPECTACLE" + Math.random().toString(36).substring(2, 15).toUpperCase();
    setWalletAddress(mockAddress);
    setWalletConnected(true);
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    setWalletConnected(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-2 hover-elevate rounded-lg px-3 py-2 transition-all" data-testid="link-home">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                Spectacle
              </span>
            </a>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink href="/" active={location === "/"} icon={<Home className="w-4 h-4" />}>
              Home
            </NavLink>
            <NavLink href="/marketplace" active={location === "/marketplace"} icon={<Package className="w-4 h-4" />}>
              Marketplace
            </NavLink>
            <NavLink href="/dashboard" active={location === "/dashboard"} icon={<LayoutDashboard className="w-4 h-4" />}>
              Dashboard
            </NavLink>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center gap-3">
            {!walletConnected ? (
              <Button 
                onClick={connectWallet} 
                variant="default"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                data-testid="button-connect-wallet"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            ) : (
              <Button 
                onClick={disconnectWallet} 
                variant="outline"
                className="font-mono text-sm"
                data-testid="button-disconnect-wallet"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ 
  href, 
  active, 
  icon, 
  children 
}: { 
  href: string; 
  active: boolean; 
  icon: React.ReactNode; 
  children: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <a 
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          active 
            ? "bg-primary text-primary-foreground" 
            : "hover-elevate text-muted-foreground hover:text-foreground"
        }`}
        data-testid={`link-${href.slice(1) || "home"}`}
      >
        {icon}
        <span className="font-medium">{children}</span>
      </a>
    </Link>
  );
}

// Import Sparkles from lucide-react
import { Sparkles } from "lucide-react";
