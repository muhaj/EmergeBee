import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Sparkles, Shield, QrCode, Trophy, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-600 via-violet-600 to-pink-600">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <Badge 
            variant="outline" 
            className="mb-6 text-white border-white/30 backdrop-blur-sm bg-white/10 text-sm px-4 py-2"
            data-testid="badge-secured-algorand"
          >
            <Shield className="w-4 h-4 mr-2" />
            Secured by Algorand Blockchain
          </Badge>
          
          <h1 
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight"
            data-testid="text-hero-title"
          >
            Trustless Prop Rentals
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-300">
              Meet AR Rewards
            </span>
          </h1>
          
          <p 
            className="text-xl sm:text-2xl text-white/90 mb-12 max-w-3xl mx-auto font-medium"
            data-testid="text-hero-subtitle"
          >
            Rent event props with blockchain-secured deposits. Run AR mini-games and distribute on-chain rewards to attendees.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              asChild 
              size="lg" 
              className="text-lg px-8 py-6 bg-white text-purple-600 hover:bg-white/90 shadow-2xl"
              data-testid="button-browse-props"
            >
              <Link href="/marketplace">
                <Package className="w-5 h-5 mr-2" />
                Browse Props
              </Link>
            </Button>
            
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 text-white border-white/40 backdrop-blur-sm bg-white/10 hover:bg-white/20"
              data-testid="button-create-event"
            >
              <Link href="/dashboard">
                <Sparkles className="w-5 h-5 mr-2" />
                Create Event
              </Link>
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap gap-8 justify-center text-white/80 text-sm">
            <div data-testid="stat-props-listed">
              <span className="font-bold text-2xl text-white">1000+</span>
              <p>Props Listed</p>
            </div>
            <div data-testid="stat-events-hosted">
              <span className="font-bold text-2xl text-white">500+</span>
              <p>Events Hosted</p>
            </div>
            <div data-testid="stat-rewards-distributed">
              <span className="font-bold text-2xl text-white">$50K+</span>
              <p>Rewards Distributed</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4" data-testid="text-how-it-works">
              How Spectacle Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple roles, one powerful platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Vendors */}
            <Card className="hover-elevate transition-all duration-200" data-testid="card-vendors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Prop Vendors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">List your props with photos and pricing</p>
                <p className="text-muted-foreground">Smart contracts protect against damage</p>
                <p className="text-muted-foreground">Earn rental income with guaranteed payment</p>
              </CardContent>
            </Card>

            {/* Organizers */}
            <Card className="hover-elevate transition-all duration-200" data-testid="card-organizers">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Event Organizers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">Rent props with blockchain escrow</p>
                <p className="text-muted-foreground">Create AR games for attendees</p>
                <p className="text-muted-foreground">Track engagement & distribute rewards</p>
              </CardContent>
            </Card>

            {/* Attendees */}
            <Card className="hover-elevate transition-all duration-200" data-testid="card-attendees">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Attendees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">Scan QR codes to play AR games</p>
                <p className="text-muted-foreground">Earn points and tier-based coupons</p>
                <p className="text-muted-foreground">Redeem rewards on-chain</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4" data-testid="text-features">
              Platform Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for trustless prop rentals and gamified events
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Blockchain Escrow"
              description="Smart contracts hold deposits until props are returned undamaged"
              testId="feature-escrow"
            />
            <FeatureCard
              icon={<QrCode className="w-6 h-6" />}
              title="QR-Activated AR"
              description="Attendees scan codes to instantly launch AR experiences"
              testId="feature-ar-games"
            />
            <FeatureCard
              icon={<Trophy className="w-6 h-6" />}
              title="NFT Rewards"
              description="Distribute points, coupons, and exclusive NFTs on-chain"
              testId="feature-rewards"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Photo Verification"
              description="AI-powered condition checks before and after rentals"
              testId="feature-verification"
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="Live Analytics"
              description="Real-time leaderboards and engagement metrics"
              testId="feature-analytics"
            />
            <FeatureCard
              icon={<Package className="w-6 h-6" />}
              title="Prop Marketplace"
              description="Browse hundreds of inflatables, sculptures, and branded setups"
              testId="feature-marketplace"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-600 via-violet-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6" data-testid="text-cta-title">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join hundreds of event organizers creating unforgettable AR experiences
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild 
              size="lg" 
              className="text-lg px-8 py-6 bg-white text-purple-600 hover:bg-white/90 shadow-xl"
              data-testid="button-cta-browse"
            >
              <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 text-white border-white/40 backdrop-blur-sm bg-white/10 hover:bg-white/20"
              data-testid="button-cta-dashboard"
            >
              <Link href="/dashboard">Launch Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  testId 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  testId: string;
}) {
  return (
    <Card className="hover-elevate transition-all duration-200" data-testid={testId}>
      <CardHeader>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
