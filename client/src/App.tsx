// Main application with routing
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/lib/WalletContext";
import Navigation from "@/components/Navigation";
import Home from "@/pages/Home";
import Marketplace from "@/pages/Marketplace";
import PropDetail from "@/pages/PropDetail";
import Dashboard from "@/pages/Dashboard";
import PropsManagement from "@/pages/PropsManagement";
import BookingsManagement from "@/pages/BookingsManagement";
import EventsManagement from "@/pages/EventsManagement";
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
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/props-management" component={PropsManagement} />
      <Route path="/bookings-management" component={BookingsManagement} />
      <Route path="/events-management" component={EventsManagement} />
      <Route path="/organizer" component={OrganizerDashboard} />
      <Route path="/organizer-dashboard" component={OrganizerDashboard} />
      <Route path="/vendor" component={VendorDashboard} />
      <Route path="/vendor-dashboard" component={VendorDashboard} />
      <Route path="/ar/:id" component={ARGame} />
      <Route path="/ar-game/:id" component={ARGame} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Navigation />
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
