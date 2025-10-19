import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, MapPin, Package, Shield, ArrowLeft, Check, ExternalLink, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWallet } from "@/lib/WalletContext";
import type { Prop, InsertBooking } from "@shared/schema";

export default function PropDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { accountAddress, isConnected, connectWallet } = useWallet();

  const propId = params.id;

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Contract deployment state
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [contractInfo, setContractInfo] = useState<{
    appId: number;
    address: string;
    txId: string;
    explorerUrl: string;
  } | null>(null);

  const { data: prop, isLoading } = useQuery<Prop>({
    queryKey: ["/api/props", propId],
    enabled: !!propId,
  });

  // Step 1: Create booking
  const bookingMutation = useMutation({
    mutationFn: async (data: InsertBooking) => {
      return await apiRequest("POST", "/api/bookings", data);
    },
    onSuccess: (data: any) => {
      setBookingId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking created!",
        description: "Now deploying smart contract to Algorand TestNet...",
      });
    },
    onError: () => {
      toast({
        title: "Booking failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  // Step 2: Deploy smart contract
  const deployContractMutation = useMutation({
    mutationFn: async (params: {
      bookingId: string;
      organizerAddress: string;
      vendorAddress: string;
      depositAmountAlgo: number;
      rentalFeeAlgo: number;
      leaseStartTimestamp: number;
      leaseEndTimestamp: number;
    }) => {
      return await apiRequest("POST", "/api/algorand/deploy-contract", params);
    },
    onSuccess: (data: any) => {
      setContractInfo({
        appId: data.appId,
        address: data.contractAddress,
        txId: data.txId,
        explorerUrl: data.explorerUrl,
      });
      toast({
        title: "Smart contract deployed!",
        description: "Your rental escrow is now active on Algorand TestNet.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Contract deployment failed",
        description: error.message || "Please check your deployer mnemonic and try again.",
        variant: "destructive",
      });
    },
  });

  const calculateRentalFee = () => {
    if (!startDate || !endDate || !prop || !prop.dailyRate) return 0;
    
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const diffTime = end.getTime() - start.getTime();
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const dailyRateNum = parseFloat(String(prop.dailyRate));
    if (isNaN(dailyRateNum)) return 0;
    
    return days * dailyRateNum;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prop || !startDate || !endDate) return;

    if (!isConnected || !accountAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your Pera Wallet to make a booking.",
        variant: "destructive",
      });
      connectWallet();
      return;
    }

    if (!prop.vendorWalletAddress) {
      toast({
        title: "Vendor wallet not found",
        description: "This prop doesn't have a vendor wallet address configured.",
        variant: "destructive",
      });
      return;
    }

    const rentalFee = calculateRentalFee();
    
    if (rentalFee <= 0) {
      toast({
        title: "Invalid dates",
        description: "Please select valid start and end dates.",
        variant: "destructive",
      });
      return;
    }

    const booking: InsertBooking = {
      propId: prop.id,
      organizerWallet: accountAddress,
      vendorWallet: prop.vendorWalletAddress,
      startDate: startDate,
      endDate: endDate,
      rentalFee: rentalFee.toFixed(2),
      depositAmount: prop.depositAmount,
      status: "pending",
    };

    const result = await bookingMutation.mutateAsync(booking);
    
    // Now deploy the smart contract (using backend ALGORAND_DEPLOYER_MNEMONIC secret)
    if (result.id) {
      const startTimestamp = Math.floor(new Date(startDate + 'T00:00:00').getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate + 'T00:00:00').getTime() / 1000);
      
      await deployContractMutation.mutateAsync({
        bookingId: result.id,
        organizerAddress: accountAddress,
        vendorAddress: prop.vendorWalletAddress,
        depositAmountAlgo: parseFloat(prop.depositAmount),
        rentalFeeAlgo: rentalFee,
        leaseStartTimestamp: startTimestamp,
        leaseEndTimestamp: endTimestamp,
      });
    }
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
  const depositNum = parseFloat(String(prop.depositAmount || '0'));
  const totalCost = rentalFee + (isNaN(depositNum) ? 0 : depositNum);

  const isProcessing = bookingMutation.isPending || deployContractMutation.isPending;
  const isSuccess = bookingId && contractInfo;

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
                  Secured by Algorand smart contract escrow
                </p>
              </CardHeader>
              <CardContent>
                {/* Success State */}
                {isSuccess && (
                  <Alert className="mb-6 border-primary/50 bg-primary/5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription className="ml-2">
                      <p className="font-semibold text-primary mb-2">Contract Deployed Successfully!</p>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">App ID: </span>
                          <span className="font-mono font-semibold" data-testid="text-contract-app-id">
                            {contractInfo.appId}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Contract: </span>
                          <span className="font-mono text-xs break-all" data-testid="text-contract-address">
                            {contractInfo.address}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">TX ID: </span>
                          <span className="font-mono text-xs break-all" data-testid="text-deployment-tx">
                            {contractInfo.txId}
                          </span>
                        </div>
                        <a
                          href={contractInfo.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                          data-testid="link-explorer"
                        >
                          View on TestNet Explorer
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <Button
                          onClick={() => navigate("/organizer-dashboard")}
                          className="w-full"
                          data-testid="button-view-dashboard"
                        >
                          View Dashboard
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setBookingId(null);
                            setContractInfo(null);
                            setDeployerMnemonic("");
                            setVendorWallet("");
                            setStartDate("");
                            setEndDate("");
                          }}
                          className="w-full"
                          data-testid="button-new-booking"
                        >
                          Make Another Booking
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Booking Form */}
                {!isSuccess && (
                  <form onSubmit={handleBooking} className="space-y-6">
                    {/* Progress Indicator */}
                    {isProcessing && (
                      <Alert className="border-primary/50 bg-primary/5">
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                        <AlertDescription className="ml-2">
                          {bookingMutation.isPending && "Creating booking..."}
                          {deployContractMutation.isPending && "Deploying smart contract to TestNet..."}
                        </AlertDescription>
                      </Alert>
                    )}

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
                          disabled={isProcessing}
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
                          disabled={isProcessing}
                          data-testid="input-end-date"
                        />
                      </div>
                    </div>

                    {/* Wallet Address */}
                    <div className="space-y-2">
                      <Label htmlFor="wallet">
                        <Shield className="w-4 h-4 inline mr-2" />
                        Your Wallet Address (Organizer)
                      </Label>
                      <Input
                        id="wallet"
                        value={accountAddress || "Not connected"}
                        readOnly
                        placeholder="Connect Pera Wallet first"
                        className="font-mono text-sm bg-muted"
                        data-testid="input-wallet"
                      />
                      {!isConnected && (
                        <p className="text-xs text-muted-foreground">
                          Connect your Pera Wallet using the button in the header
                        </p>
                      )}
                    </div>

                    {/* Vendor Wallet - Display Only */}
                    <div className="space-y-2">
                      <Label htmlFor="vendorWallet">
                        Vendor Wallet Address
                      </Label>
                      <Input
                        id="vendorWallet"
                        value={prop?.vendorWalletAddress || "Not configured"}
                        readOnly
                        disabled
                        className="font-mono text-sm bg-muted"
                        data-testid="input-vendor-wallet"
                      />
                      <p className="text-xs text-muted-foreground">
                        Vendor's Algorand wallet address (automatically set)
                      </p>
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
                        *Deposit refunded after prop return via smart contract
                      </p>
                    </div>

                    {/* Escrow Info */}
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex gap-3">
                          <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="space-y-1 text-sm">
                            <p className="font-semibold text-primary">Algorand Smart Contract Escrow</p>
                            <p className="text-muted-foreground text-xs">
                              Your deposit is held in a trustless smart contract on Algorand TestNet and automatically refunded if the prop is returned undamaged.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full text-lg"
                      disabled={!startDate || !endDate || !isConnected || !prop?.vendorWalletAddress || isProcessing}
                      data-testid="button-confirm-booking"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {bookingMutation.isPending ? "Creating Booking..." : "Deploying Contract..."}
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Confirm Booking & Deploy Contract
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
