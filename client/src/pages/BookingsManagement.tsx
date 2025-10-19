import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/lib/WalletContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Shield, ExternalLink } from "lucide-react";
import type { Booking } from "@shared/schema";

export default function BookingsManagement() {
  const { walletAddress, isConnected } = useWallet();

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/organizer", walletAddress],
    enabled: !!walletAddress,
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Wallet Required</CardTitle>
            <CardDescription>Please connect your wallet to view bookings</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-bookings-title">
            Bookings Management
          </h1>
          <p className="text-white/90" data-testid="text-bookings-subtitle">
            View and manage all your prop rental bookings
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {bookingsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader className="space-y-2">
                  <div className="h-6 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map(booking => (
              <Card key={booking.id} className="hover-elevate transition-all" data-testid={`card-booking-${booking.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1" data-testid={`text-booking-id-${booking.id}`}>
                        Booking #{booking.id.slice(0, 8)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge data-testid={`badge-booking-status-${booking.id}`}>
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Payment Information */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Rental Fee</p>
                      <p className="text-lg font-bold text-primary" data-testid={`text-booking-fee-${booking.id}`}>
                        ${booking.rentalFee}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deposit</p>
                      <p className="text-lg font-semibold" data-testid={`text-booking-deposit-${booking.id}`}>
                        ${booking.depositAmount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Organizer Wallet</p>
                      <p className="text-xs font-mono truncate" data-testid={`text-booking-wallet-${booking.id}`}>
                        {booking.organizerWallet}
                      </p>
                    </div>
                  </div>

                  {/* Smart Contract Information */}
                  {booking.contractAppId && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold">Algorand Smart Contract Escrow</h3>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">App ID</p>
                            <p className="font-mono font-semibold" data-testid={`text-contract-app-id-${booking.id}`}>
                              {booking.contractAppId}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Contract Address</p>
                            <p className="font-mono text-xs break-all" data-testid={`text-contract-address-${booking.id}`}>
                              {booking.contractAddress || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          asChild
                          data-testid={`button-view-contract-${booking.id}`}
                        >
                          <a
                            href={`https://testnet.algoexplorer.io/application/${booking.contractAppId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Contract on TestNet Explorer
                          </a>
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-16">
            <CardContent className="text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
              <p className="text-muted-foreground mb-6">
                Browse the marketplace to rent props for your events
              </p>
              <Button asChild data-testid="button-browse-marketplace">
                <a href="/marketplace">Browse Marketplace</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
