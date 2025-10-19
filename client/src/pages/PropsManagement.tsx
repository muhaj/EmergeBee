import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useWallet } from "@/lib/WalletContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, ChevronDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InsertProp } from "@shared/schema";

export default function PropsManagement() {
  const { walletAddress, isConnected } = useWallet();
  const { toast } = useToast();
  const [showPropForm, setShowPropForm] = useState(false);
  const [propForm, setPropForm] = useState({
    name: "",
    description: "",
    category: "inflatable" as const,
    dailyRate: "",
    depositAmount: "",
    location: "",
    photoUrl: "",
  });

  const createPropMutation = useMutation({
    mutationFn: async (data: InsertProp) => {
      return await apiRequest("POST", "/api/props", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/props"] });
      toast({
        title: "Prop Created!",
        description: "Your prop is now available in the marketplace.",
      });
      setPropForm({
        name: "",
        description: "",
        category: "inflatable",
        dailyRate: "",
        depositAmount: "",
        location: "",
        photoUrl: "",
      });
      setShowPropForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create prop",
        variant: "destructive",
      });
    },
  });

  const handleCreateProp = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your Pera Wallet first",
        variant: "destructive",
      });
      return;
    }

    const propData: InsertProp = {
      name: propForm.name,
      description: propForm.description,
      category: propForm.category,
      dailyRate: propForm.dailyRate,
      depositAmount: propForm.depositAmount,
      location: propForm.location,
      vendorName: "Vendor",
      vendorWalletAddress: walletAddress,
      photos: propForm.photoUrl ? [{ url: propForm.photoUrl, isPrimary: true }] : [],
      status: "active",
    };

    createPropMutation.mutate(propData);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Wallet Required</CardTitle>
            <CardDescription>Please connect your wallet to manage props</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-props-title">
            Props Management
          </h1>
          <p className="text-white/90" data-testid="text-props-subtitle">
            List and manage your event props for rental
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* List New Prop Form */}
        <Card className="mb-8">
          <Collapsible open={showPropForm} onOpenChange={setShowPropForm}>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between hover:bg-transparent p-0"
                  data-testid="button-toggle-prop-form"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-xl" data-testid="text-list-prop-title">
                        List a New Prop
                      </CardTitle>
                      <CardDescription>Add a new prop to the marketplace</CardDescription>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showPropForm ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
            </CardHeader>

            <CollapsibleContent>
              <CardContent>
                <form onSubmit={handleCreateProp} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="prop-name">Prop Name *</Label>
                      <Input
                        id="prop-name"
                        value={propForm.name}
                        onChange={(e) => setPropForm({ ...propForm, name: e.target.value })}
                        placeholder="e.g., Giant Inflatable Flamingo"
                        required
                        data-testid="input-prop-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prop-category">Category *</Label>
                      <Select
                        value={propForm.category}
                        onValueChange={(value: any) => setPropForm({ ...propForm, category: value })}
                      >
                        <SelectTrigger id="prop-category" data-testid="select-prop-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inflatable">Inflatable</SelectItem>
                          <SelectItem value="furniture">Furniture</SelectItem>
                          <SelectItem value="decor">Decor</SelectItem>
                          <SelectItem value="lighting">Lighting</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                          <SelectItem value="stage">Stage Equipment</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="daily-rate">Daily Rate ($) *</Label>
                      <Input
                        id="daily-rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={propForm.dailyRate}
                        onChange={(e) => setPropForm({ ...propForm, dailyRate: e.target.value })}
                        placeholder="150.00"
                        required
                        data-testid="input-daily-rate"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deposit">Security Deposit ($) *</Label>
                      <Input
                        id="deposit"
                        type="number"
                        step="0.01"
                        min="0"
                        value={propForm.depositAmount}
                        onChange={(e) => setPropForm({ ...propForm, depositAmount: e.target.value })}
                        placeholder="300.00"
                        required
                        data-testid="input-deposit"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={propForm.location}
                        onChange={(e) => setPropForm({ ...propForm, location: e.target.value })}
                        placeholder="Miami, FL"
                        required
                        data-testid="input-location"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vendor-wallet">Your Wallet Address</Label>
                      <Input
                        id="vendor-wallet"
                        value={walletAddress || "Not connected"}
                        disabled
                        className="bg-muted"
                        data-testid="input-vendor-wallet-display"
                      />
                      <p className="text-xs text-muted-foreground">
                        Auto-filled from connected wallet
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={propForm.description}
                      onChange={(e) => setPropForm({ ...propForm, description: e.target.value })}
                      placeholder="Describe your prop, including size, features, and ideal use cases..."
                      rows={4}
                      required
                      data-testid="textarea-description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo-url">Photo URL</Label>
                    <Input
                      id="photo-url"
                      type="url"
                      value={propForm.photoUrl}
                      onChange={(e) => setPropForm({ ...propForm, photoUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      data-testid="input-photo-url"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={createPropMutation.isPending}
                    data-testid="button-create-prop"
                  >
                    {createPropMutation.isPending ? (
                      "Creating..."
                    ) : (
                      <>
                        <Package className="w-5 h-5 mr-2" />
                        List Prop in Marketplace
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Future: List of existing props */}
        <Card>
          <CardHeader>
            <CardTitle>Your Listed Props</CardTitle>
            <CardDescription>Coming soon: View and manage your existing props</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
