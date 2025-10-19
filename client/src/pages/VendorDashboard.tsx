import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWallet } from "@/lib/WalletContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wallet, DollarSign, CreditCard, Building2, TrendingUp, History, CheckCircle2, Clock, XCircle, User } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Vendor, Payout } from "@shared/schema";

export default function VendorDashboard() {
  const { walletAddress, connectWallet, isConnected } = useWallet();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<string>("pending");
  const [blockchainWallet, setBlockchainWallet] = useState("");
  const [bankAccount, setBankAccount] = useState({
    accountName: "",
    accountNumber: "",
    routingNumber: "",
    bankName: "",
  });

  // Fetch vendor data
  const { data: vendor, isLoading: vendorLoading } = useQuery<Vendor>({
    queryKey: ["/api/vendors/wallet", walletAddress],
    enabled: !!walletAddress,
  });

  // Fetch payout history
  const { data: payouts = [], isLoading: payoutsLoading } = useQuery<Payout[]>({
    queryKey: ["/api/payouts/vendor", vendor?.id],
    enabled: !!vendor?.id,
  });

  // Create/update vendor mutation
  const updateVendorMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/vendors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/wallet"] });
      toast({
        title: "Settings Saved",
        description: "Your payment preferences have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  // Request payout mutation
  const requestPayoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/payouts/request", {
        vendorId: vendor?.id,
        method: vendor?.paymentMethod,
        bookingIds: [],
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payouts/vendor"] });
      
      // Auto-process the payout after creation
      const payoutsData: any = await queryClient.fetchQuery({
        queryKey: ["/api/payouts/vendor", vendor?.id],
      });
      const latestPayout = payoutsData[payoutsData.length - 1];
      
      if (latestPayout) {
        await apiRequest("POST", `/api/payouts/${latestPayout.id}/process`, {});
        queryClient.invalidateQueries({ queryKey: ["/api/payouts/vendor"] });
        queryClient.invalidateQueries({ queryKey: ["/api/vendors/wallet"] });
      }

      toast({
        title: "Payout Requested",
        description: "Your payout is being processed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to request payout",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    if (!walletAddress) return;

    const paymentDetails: any = {
      walletAddress,
      name: vendor?.name || "Vendor",
      paymentMethod,
    };

    if (paymentMethod === "blockchain") {
      paymentDetails.blockchainWallet = blockchainWallet;
    } else if (paymentMethod === "bank") {
      paymentDetails.bankAccountInfo = bankAccount;
    }

    updateVendorMutation.mutate(paymentDetails);
  };

  const handleClaimEarnings = () => {
    if (!vendor || parseFloat(vendor.pendingBalance || "0") <= 0) {
      toast({
        title: "No Balance",
        description: "You don't have any pending earnings to claim.",
        variant: "destructive",
      });
      return;
    }

    if (vendor.paymentMethod === "pending") {
      toast({
        title: "Setup Required",
        description: "Please set up your payment method first.",
        variant: "destructive",
      });
      return;
    }

    requestPayoutMutation.mutate();
  };

  const getPayoutStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "pending":
      case "processing":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Require wallet connection
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Vendor Dashboard</CardTitle>
            <CardDescription className="text-center">
              Connect your Pera Wallet to manage props and earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={connectWallet}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="button-connect-wallet-prompt"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Connect Pera Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-vendor-dashboard-title">Vendor Dashboard</h1>
          <p className="text-muted-foreground">Manage your props and earnings</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {walletAddress && (
            <span data-testid="text-wallet-address">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          )}
        </div>
      </div>

      {/* Earnings Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-balance">
              ${vendor?.pendingBalance || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Available to claim
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-earnings">
              ${vendor?.totalEarnings || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-payouts">
              ${vendor?.totalPayouts || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully withdrawn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Settings
          </CardTitle>
          <CardDescription>
            Choose how you want to receive your earnings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              data-testid="select-payment-method"
            >
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Not Set Up</SelectItem>
                <SelectItem value="blockchain">Blockchain (Algorand)</SelectItem>
                <SelectItem value="stripe">Stripe (Bank Transfer)</SelectItem>
                <SelectItem value="bank">Manual Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === "blockchain" && (
            <div className="space-y-2">
              <Label htmlFor="blockchain-wallet">Algorand Wallet Address</Label>
              <Input
                id="blockchain-wallet"
                placeholder="Enter your Algorand wallet address"
                value={blockchainWallet}
                onChange={(e) => setBlockchainWallet(e.target.value)}
                data-testid="input-blockchain-wallet"
              />
              <p className="text-sm text-muted-foreground">
                Batch payouts reduce transaction fees
              </p>
            </div>
          )}

          {paymentMethod === "stripe" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Stripe Connect integration - Coming soon!
              </p>
            </div>
          )}

          {paymentMethod === "bank" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-name">Account Name</Label>
                <Input
                  id="account-name"
                  value={bankAccount.accountName}
                  onChange={(e) => setBankAccount({ ...bankAccount, accountName: e.target.value })}
                  data-testid="input-account-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-number">Account Number</Label>
                <Input
                  id="account-number"
                  value={bankAccount.accountNumber}
                  onChange={(e) => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
                  data-testid="input-account-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="routing-number">Routing Number</Label>
                <Input
                  id="routing-number"
                  value={bankAccount.routingNumber}
                  onChange={(e) => setBankAccount({ ...bankAccount, routingNumber: e.target.value })}
                  data-testid="input-routing-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank-name">Bank Name</Label>
                <Input
                  id="bank-name"
                  value={bankAccount.bankName}
                  onChange={(e) => setBankAccount({ ...bankAccount, bankName: e.target.value })}
                  data-testid="input-bank-name"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleSaveSettings}
              disabled={updateVendorMutation.isPending}
              data-testid="button-save-settings"
            >
              {updateVendorMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
            {vendor && vendor.paymentMethod !== "pending" && (
              <Button
                variant="outline"
                onClick={handleClaimEarnings}
                disabled={requestPayoutMutation.isPending || parseFloat(vendor.pendingBalance || "0") <= 0}
                data-testid="button-claim-earnings"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {requestPayoutMutation.isPending ? "Processing..." : "Claim Earnings"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Payout History
          </CardTitle>
          <CardDescription>
            Track your payout transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payoutsLoading ? (
            <p className="text-sm text-muted-foreground">Loading payouts...</p>
          ) : payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="text-no-payouts">
              No payouts yet
            </p>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`payout-${payout.id}`}
                >
                  <div className="flex items-center gap-4">
                    {getPayoutStatusIcon(payout.status)}
                    <div>
                      <p className="font-medium">${payout.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        {payout.method.charAt(0).toUpperCase() + payout.method.slice(1)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium capitalize">{payout.status}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payout.requestedAt).toLocaleDateString()}
                    </p>
                    {payout.transactionId && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {payout.transactionId.slice(0, 12)}...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
