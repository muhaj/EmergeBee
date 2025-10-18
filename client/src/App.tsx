import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/lib/WalletContext";
import { useClerkToken } from "@/lib/useClerkToken";
import Navigation from "@/components/Navigation";
import Home from "@/pages/Home";
import Marketplace from "@/pages/Marketplace";
import PropDetail from "@/pages/PropDetail";
import OrganizerDashboard from "@/pages/OrganizerDashboard";
import VendorDashboard from "@/pages/VendorDashboard";
import ARGame from "@/pages/ARGame";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/prop/:id" component={PropDetail} />
      <Route path="/dashboard" component={OrganizerDashboard} />
      <Route path="/vendor" component={VendorDashboard} />
      <Route path="/ar/:id" component={ARGame} />
      <Route path="/ar-game/:id" component={ARGame} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  useClerkToken(); // Keep Clerk token synced for API requests

  return (
    <WalletProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Navigation />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </WalletProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
