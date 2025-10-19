import { useWallet } from "@/lib/WalletContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Calendar, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { isConnected, connectWallet } = useWallet();
  const [, setLocation] = useLocation();
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setShowConnectModal(true);
    } else {
      setShowConnectModal(false);
    }
  }, [isConnected]);

  const options = [
    {
      title: "List Props",
      description: "Add and manage your event props for rental",
      icon: <Package className="w-12 h-12" />,
      color: "from-purple-500 to-violet-500",
      path: "/props-management",
      testId: "card-list-props"
    },
    {
      title: "Manage Bookings",
      description: "Check and manage all your prop bookings",
      icon: <Calendar className="w-12 h-12" />,
      color: "from-pink-500 to-rose-500",
      path: "/bookings-management",
      testId: "card-manage-bookings"
    },
    {
      title: "Create AR Events",
      description: "Design AR experiences for your events",
      icon: <Sparkles className="w-12 h-12" />,
      color: "from-violet-500 to-purple-500",
      path: "/events-management",
      testId: "card-create-events"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Connect Wallet Modal */}
      <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
        <DialogContent className="sm:max-w-md" data-testid="modal-connect-wallet">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center" data-testid="text-modal-title">
              Login to Dashboard
            </DialogTitle>
            <DialogDescription className="text-center pt-2" data-testid="text-modal-description">
              Connect your Pera Wallet to manage your props and your AR events experiences.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Package className="w-10 h-10 text-white" />
            </div>
            <Button
              onClick={connectWallet}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="button-connect-wallet-modal"
            >
              Connect Pera Wallet
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Dashboard - Only shown when connected */}
      {isConnected && (
        <>
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-5xl font-bold mb-4" data-testid="text-dashboard-title">
                Dashboard
              </h1>
              <p className="text-xl text-white/90" data-testid="text-dashboard-subtitle">
                Choose what you'd like to manage
              </p>
            </div>
          </div>

          {/* Options Grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid md:grid-cols-3 gap-8">
              {options.map((option) => (
                <Card
                  key={option.path}
                  className="hover-elevate transition-all cursor-pointer group"
                  onClick={() => setLocation(option.path)}
                  data-testid={option.testId}
                >
                  <CardHeader className="text-center pb-4">
                    <div className={`mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                      {option.icon}
                    </div>
                    <CardTitle className="text-2xl mb-2" data-testid={`text-${option.testId}-title`}>
                      {option.title}
                    </CardTitle>
                    <CardDescription className="text-base" data-testid={`text-${option.testId}-description`}>
                      {option.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-6">
                    <Button
                      className="w-full"
                      variant="outline"
                      data-testid={`button-${option.testId}`}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
