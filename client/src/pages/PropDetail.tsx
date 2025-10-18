import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Package, Shield, ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Prop, InsertBooking } from "@shared/schema";

export default function PropDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const propId = params.id;

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [walletAddress, setWalletAddress] = useState("SPECTACLE" + Math.random().toString(36).substring(2, 10).toUpperCase());

  const { data: prop, isLoading } = useQuery<Prop>({
    queryKey: ["/api/props", propId],
    enabled: !!propId,
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: InsertBooking) => {
      return await apiRequest("POST", "/api/bookings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking successful!",
        description: "Your prop rental has been confirmed with blockchain escrow.",
      });
      navigate("/dashboard");
    },
    onError: () => {
      toast({
        title: "Booking failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const calculateRentalFee = () => {
    if (!startDate || !endDate || !prop) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return days * parseFloat(prop.dailyRate);
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prop || !startDate || !endDate) return;

    const booking: InsertBooking = {
      propId: prop.id,
      organizerWallet: walletAddress,
      startDate,
      endDate,
      rentalFee: calculateRentalFee().toString(),
      depositAmount: prop.depositAmount,
      status: "pending",
      escrowTxId: `MOCK_TX_${Date.now()}`,
    };

    bookingMutation.mutate(booking);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading prop details...</p>
        </div>
      </div>
    );
  }

  if (!prop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Prop not found</h2>
            <p className="text-muted-foreground mb-6">The prop you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/marketplace")}>
              Back to Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryPhoto = prop.photos.find(p => p.isPrimary) || prop.photos[0];
  const rentalFee = calculateRentalFee();
  const totalCost = rentalFee + parseFloat(prop.depositAmount);

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/marketplace")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Images & Details */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
              {primaryPhoto ? (
                <img
                  src={primaryPhoto.url}
                  alt={prop.name}
                  className="w-full h-full object-cover"
                  data-testid="img-prop-main"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Thumbnail Grid */}
            {prop.photos.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {prop.photos.slice(0, 4).map((photo, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover-elevate transition-all"
                  >
                    <img
                      src={photo.url}
                      alt={`${prop.name} - View ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Prop Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2" data-testid="text-prop-name">
                    {prop.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">{prop.category.replace('_', ' ')}</Badge>
                    <Badge className={prop.status === 'active' ? 'bg-accent' : 'bg-muted'}>
                      {prop.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-prop-description">
                    {prop.description}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Daily Rate</p>
                    <p className="text-2xl font-bold text-primary" data-testid="text-prop-rate">
                      ${prop.dailyRate}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Security Deposit</p>
                    <p className="text-xl font-semibold" data-testid="text-prop-deposit">
                      ${prop.depositAmount}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span data-testid="text-prop-location">{prop.location}</span>
                  </div>
                  
                  {prop.dimensions && (
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {prop.dimensions.height}H x {prop.dimensions.width}W x {prop.dimensions.depth}D ft
                        ({prop.dimensions.weight} lbs)
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vendor</p>
                  <p className="font-semibold" data-testid="text-prop-vendor">{prop.vendorName}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Book This Prop</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Secured by blockchain escrow
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBooking} className="space-y-6">
                  {/* Dates */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Start Date
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        data-testid="input-start-date"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                        required
                        data-testid="input-end-date"
                      />
                    </div>
                  </div>

                  {/* Wallet Address */}
                  <div className="space-y-2">
                    <Label htmlFor="wallet">
                      <Shield className="w-4 h-4 inline mr-2" />
                      Your Wallet Address
                    </Label>
                    <Input
                      id="wallet"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="ALGORAND_ADDRESS"
                      className="font-mono text-sm"
                      required
                      data-testid="input-wallet"
                    />
                  </div>

                  <Separator />

                  {/* Cost Breakdown */}
                  <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Cost Breakdown</h3>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Rental Fee</span>
                      <span className="font-medium" data-testid="text-calculated-fee">
                        ${rentalFee.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Security Deposit</span>
                      <span className="font-medium">
                        ${parseFloat(prop.depositAmount).toFixed(2)}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between">
                      <span className="font-semibold">Total Due Now</span>
                      <span className="text-2xl font-bold text-primary" data-testid="text-total-cost">
                        ${totalCost.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      *Deposit refunded after prop return
                    </p>
                  </div>

                  {/* Escrow Info */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex gap-3">
                        <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold text-primary">Blockchain Escrow Protection</p>
                          <p className="text-muted-foreground text-xs">
                            Your deposit is held in a smart contract and automatically refunded if the prop is returned undamaged.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-lg"
                    disabled={!startDate || !endDate || bookingMutation.isPending}
                    data-testid="button-confirm-booking"
                  >
                    {bookingMutation.isPending ? (
                      "Processing..."
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
