// Navigation component with wallet connection and auth
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Package, LayoutDashboard, Home, Wallet, LogIn, LogOut, User } from "lucide-react";
import { useWallet } from "@/lib/WalletContext";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const [location] = useLocation();
  const { accountAddress, isConnected, connectWallet, disconnectWallet } = useWallet();
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  const handleSignOut = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
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
            <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
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

          {/* Right side - Wallet + Auth */}
          <div className="flex items-center gap-3">
            {/* Wallet Connection */}
            {!isConnected ? (
              <Button 
                onClick={connectWallet} 
                variant="outline"
                size="sm"
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
                className="font-mono text-sm"
                data-testid="button-disconnect-wallet"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {accountAddress?.slice(0, 6)}...{accountAddress?.slice(-4)}
              </Button>
            )}

            {/* Auth - Sign In/Out */}
            {!isLoading && (
              <>
                {!isAuthenticated ? (
                  <Button 
                    onClick={handleSignIn}
                    size="sm"
                    data-testid="button-signin"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="relative h-9 w-9 rounded-full"
                        data-testid="button-user-menu"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.email || "User"} />
                          <AvatarFallback>
                            {user?.firstName?.[0] || user?.email?.[0] || <User className="w-4 h-4" />}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1">
                          {user?.firstName && user?.lastName && (
                            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <DropdownMenuItem onClick={handleSignOut} data-testid="button-signout">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
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
          ? "bg-primary text-primary-foreground" 
          : "hover-elevate text-muted-foreground hover:text-foreground"
      }`}
      data-testid={`link-${href.slice(1) || "home"}`}
    >
      {icon}
      <span className="font-medium">{children}</span>
    </Link>
  );
}
