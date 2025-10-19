// Navigation component with wallet connection
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Package, LayoutDashboard, Home, Wallet } from "lucide-react";
import { useWallet } from "@/lib/WalletContext";

export default function Navigation() {
  const [location] = useLocation();
  const { accountAddress, isConnected, connectWallet, disconnectWallet } = useWallet();

  return (
    <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 hover-elevate rounded-lg px-3 py-2 transition-all" 
            data-testid="link-home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <span className="text-white text-xl font-bold">S</span>
            </div>
            <span className="font-bold text-xl text-white">
              Spectacle
            </span>
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

          {/* Right side - Wallet Connection */}
          <div className="flex items-center gap-3">
            {!isConnected ? (
              <Button 
                onClick={connectWallet} 
                variant="outline"
                size="sm"
                className="text-white border-white/30 hover:bg-white/10"
                data-testid="button-connect-wallet"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            ) : (
              <Button 
                onClick={disconnectWallet} 
                variant="outline"
                size="sm"
                className="font-mono text-sm text-white border-white/30 hover:bg-white/10"
                data-testid="button-disconnect-wallet"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {accountAddress?.slice(0, 6)}...{accountAddress?.slice(-4)}
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
    <Link 
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        active 
          ? "bg-white/20 text-white" 
          : "hover-elevate text-white/70 hover:text-white"
      }`}
      data-testid={`link-${href.slice(1) || "home"}`}
    >
      {icon}
      <span className="font-medium">{children}</span>
    </Link>
  );
}
