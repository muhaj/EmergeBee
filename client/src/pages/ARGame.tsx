import { useState, useEffect, useRef } from "react";
import { useParams, useRoute, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Share2, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWallet } from "@/lib/WalletContext";
import type { Event, SignedVoucher } from "@shared/schema";

export default function ARGame() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { accountAddress, isConnected, connectWallet } = useWallet();
  
  const eventId = params.id;
  const urlParams = new URLSearchParams(window.location.search);
  const zone = urlParams.get('zone') || 'A1';

  const [gameState, setGameState] = useState<'loading' | 'ready' | 'playing' | 'finished'>('loading');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetsHit, setTargetsHit] = useState(0);
  const [voucher, setVoucher] = useState<SignedVoucher | null>(null);

  const sceneRef = useRef<any>(null);

  const { data: event } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  const submitScoreMutation = useMutation({
    mutationFn: async (data: { 
      eventId: string; 
      zone: string; 
      score: number; 
      targetsHit: number;
      playerWallet?: string;
      rewardTier?: string;
    }) => {
      const response = await apiRequest("POST", "/api/game-sessions", data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      console.log("Game session response:", data);
      if (data?.voucher) {
        console.log("Voucher received:", data.voucher);
        setVoucher(data.voucher as SignedVoucher);
      } else {
        console.log("No voucher in response");
      }
      toast({
        title: "Score submitted!",
        description: `You earned ${score} points!`,
      });
    },
    onError: (error: any) => {
      console.error("Game session error:", error);
      toast({
        title: "Failed to submit score",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (event) {
      setTimeLeft(event.gameDuration);
      setTimeout(() => setGameState('ready'), 1500);
    }
  }, [event]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'playing' && timeLeft === 0) {
      endGame();
    }
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTargetsHit(0);
    
    // Initialize A-Frame scene
    initializeARScene();
  };

  const initializeARScene = () => {
    // A-Frame AR scene initialization would go here
    // For MVP, we'll simulate target spawning
    const interval = setInterval(() => {
      if (gameState !== 'playing') {
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleTargetHit = () => {
    setScore(prev => prev + (event?.rewards.pointsPerTarget || 10));
    setTargetsHit(prev => prev + 1);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const endGame = () => {
    setGameState('finished');
    
    // Calculate reward tier
    const tier = getRewardTier();
    
    // Submit score to backend with all required fields
    if (eventId) {
      submitScoreMutation.mutate({
        eventId,
        zone,
        score,
        targetsHit,
        playerWallet: accountAddress || undefined,
        rewardTier: tier || undefined,
      });
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      toast({
        title: "Wallet connected!",
        description: "You can now claim your rewards on-chain.",
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Please make sure Pera Wallet is installed and try again.",
        variant: "destructive",
      });
    }
  };

  const claimRewardsMutation = useMutation({
    mutationFn: async (voucherData: SignedVoucher) => {
      console.log("Starting claim mutation with voucher:", voucherData);
      const response = await apiRequest("POST", "/api/rewards/prepare-claim", voucherData);
      const data = await response.json();
      console.log("Received prepare-claim response:", data);
      
      // If needs opt-in, handle it immediately
      if (data.needsOptin) {
        console.log("Needs opt-in, calling handleOptIn...");
        return await handleOptIn(data);
      }
      
      console.log("Already opted in, returning data");
      return data;
    },
    onSuccess: (data: any) => {
      // Only show success if we got here (opt-in flow handles its own success)
      if (data && data.txId) {
        toast({
          title: "🎉 Reward Claimed!",
          description: `${data.tierName} medal sent to your wallet! TX: ${data.txId.substring(0, 10)}...`,
        });
      }
    },
    onError: (error: any) => {
      console.error("Claim mutation error:", error);
      
      // Check if it's a wallet connection issue
      if (error.message?.includes("connect your wallet")) {
        toast({
          title: "Wallet Required",
          description: "Please connect your wallet before claiming rewards.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Claim failed",
          description: error.message || "Failed to claim reward",
          variant: "destructive",
        });
      }
    },
  });

  const completeClaimMutation = useMutation({
    mutationFn: async (data: { sessionId: string; optInTxId: string; playerWallet: string; asaId: string }) => {
      const response = await apiRequest("POST", "/api/rewards/complete-claim", data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "🎉 Reward Claimed!",
        description: `Medal sent to your wallet! TX: ${data.txId.substring(0, 10)}...`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Transfer failed",
        description: error.message || "Failed to transfer reward",
        variant: "destructive",
      });
    },
  });

  const handleOptIn = async (claimData: any) => {
    try {
      // @ts-ignore - Pera Wallet types
      const { PeraWalletConnect } = await import("@perawallet/connect");
      const peraWallet = new PeraWalletConnect();

      // Reconnect to existing session
      const accounts = await peraWallet.reconnectSession();
      console.log("Reconnected accounts:", accounts);

      // Import algosdk to decode the transaction
      const algosdk = await import("algosdk");

      // Decode base64 unsigned transaction into Transaction object
      const unsignedTxnB64 = claimData.unsignedTxn;
      const unsignedTxnBytes = Uint8Array.from(atob(unsignedTxnB64), c => c.charCodeAt(0));
      const unsignedTxn = algosdk.decodeUnsignedTransaction(unsignedTxnBytes);
      
      console.log("Decoded transaction:", unsignedTxn);

      // Ask player to sign opt-in transaction (pass Transaction object, not bytes)
      const signedTxns = await peraWallet.signTransaction([[{ txn: unsignedTxn, signers: [accountAddress!] }]]);
      
      // Submit opt-in transaction
      const client = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
      const response = await client.sendRawTransaction(signedTxns).do();
      const txId = response.txId || response.txid || "";

      toast({
        title: "Opt-in successful!",
        description: "Transferring reward to your wallet...",
      });

      // Wait a moment for confirmation, then complete claim
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const completeResponse = await apiRequest("POST", "/api/rewards/complete-claim", {
        sessionId: claimData.sessionId,
        optInTxId: txId,
        playerWallet: accountAddress!,
        asaId: claimData.asaId,
      });
      
      const completeData = await completeResponse.json();
      
      toast({
        title: "🎉 Reward Claimed!",
        description: `Medal sent to your wallet! TX: ${completeData.txId?.substring(0, 10)}...`,
      });

      return completeData;

    } catch (error: any) {
      console.error("Opt-in error:", error);
      toast({
        title: "Opt-in failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const claimRewards = () => {
    if (!accountAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!voucher) {
      toast({
        title: "No voucher available",
        description: "You need to earn a reward tier first.",
        variant: "destructive",
      });
      return;
    }

    // Start the claim process
    claimRewardsMutation.mutate(voucher);
  };

  const getRewardTier = () => {
    if (!event) return null;
    if (score >= event.rewards.goldThreshold) return 'gold';
    if (score >= event.rewards.silverThreshold) return 'silver';
    if (score >= event.rewards.bronzeThreshold) return 'bronze';
    return null;
  };

  const tierColors = {
    gold: 'from-yellow-500 to-orange-500',
    silver: 'from-gray-400 to-gray-600',
    bronze: 'from-orange-600 to-orange-800',
  };

  if (!event) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-white mx-auto mb-4" />
          <p className="text-xl">Loading AR Experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* A-Frame Scene (mock for MVP) */}
      {gameState === 'playing' && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-pink-900/30">
          {/* Simulated AR View */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-white text-opacity-60 mb-4">
                [Camera View Placeholder]
              </div>
              <Button
                size="lg"
                onClick={handleTargetHit}
                className="animate-pulse bg-gradient-to-r from-red-500 to-pink-500 text-white"
                data-testid="button-tap-target"
              >
                Tap Target!
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* HUD Overlay */}
      {gameState === 'playing' && (
        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-10">
          <div className="flex items-center justify-between text-white">
            <div>
              <div className="text-4xl font-bold" data-testid="text-score">
                {score}
              </div>
              <div className="text-sm text-white/80">Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold" data-testid="text-time">
                {timeLeft}s
              </div>
              <div className="text-sm text-white/80">Time Left</div>
            </div>

            <div className="text-right">
              <div className="text-4xl font-bold" data-testid="text-targets">
                {targetsHit}
              </div>
              <div className="text-sm text-white/80">Targets Hit</div>
            </div>
          </div>

          {zone && (
            <div className="mt-4">
              <Badge variant="secondary" className="backdrop-blur-sm bg-white/20 text-white">
                Zone: {zone}
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {gameState === 'playing' && (
        <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-10">
          <p className="text-white bg-black/50 inline-block px-6 py-3 rounded-full text-sm backdrop-blur-sm">
            Tap the glowing targets to score points!
          </p>
        </div>
      )}

      {/* Start Screen */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900 z-20">
          <div className="max-w-lg w-full mx-4">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="pt-8 pb-8 text-center space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-event-name">
                    {event.name}
                  </h1>
                  <p className="text-white/80" data-testid="text-event-description">
                    {event.description}
                  </p>
                </div>

                <div className="flex justify-center gap-4 text-white/90 text-sm">
                  <div>
                    <div className="text-2xl font-bold">{event.gameDuration}s</div>
                    <div className="text-white/60">Duration</div>
                  </div>
                  <div className="border-l border-white/20" />
                  <div>
                    <div className="text-2xl font-bold">{event.rewards.pointsPerTarget}</div>
                    <div className="text-white/60">Points/Target</div>
                  </div>
                </div>

                <div className="space-y-2 text-left text-white/90 text-sm">
                  <p className="font-semibold">Reward Tiers:</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>🥉 Bronze:</span>
                      <span>{event.rewards.bronzeThreshold}+ points</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🥈 Silver:</span>
                      <span>{event.rewards.silverThreshold}+ points</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🥇 Gold:</span>
                      <span>{event.rewards.goldThreshold}+ points</span>
                    </div>
                  </div>
                </div>

                {!isConnected && (
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 text-center">
                    <p className="text-yellow-200 text-sm font-semibold mb-2">⚠️ Connect Wallet First!</p>
                    <p className="text-yellow-100/80 text-xs">
                      Connect your Pera Wallet before playing to claim blockchain rewards after the game.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleConnectWallet}
                      className="mt-3 bg-white text-purple-600 hover:bg-white/90"
                      data-testid="button-connect-start-wallet"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Now
                    </Button>
                  </div>
                )}

                <Button
                  size="lg"
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xl py-6"
                  data-testid="button-start-game"
                >
                  <Trophy className="w-6 h-6 mr-2" />
                  Start Game
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Results Screen */}
      {gameState === 'finished' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900 z-20 overflow-y-auto">
          <div className="max-w-lg w-full mx-4 my-8">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="pt-8 pb-8 space-y-6">
                <div className="text-center">
                  <div className="mb-4">
                    <Trophy className="w-20 h-20 mx-auto text-yellow-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2" data-testid="text-game-over">
                    Game Over!
                  </h2>
                  <p className="text-white/80">Great job!</p>
                </div>

                {/* Final Score */}
                <div className="bg-white/10 rounded-lg p-6 text-center">
                  <p className="text-white/60 text-sm mb-1">Final Score</p>
                  <p className="text-6xl font-bold text-white" data-testid="text-final-score">
                    {score}
                  </p>
                  <p className="text-white/60 text-sm mt-2">
                    {targetsHit} targets hit
                  </p>
                </div>

                {/* Reward Tier */}
                {getRewardTier() && (
                  <div className={`bg-gradient-to-r ${tierColors[getRewardTier()!]} rounded-lg p-6 text-center`}>
                    <p className="text-white text-sm mb-1">You earned</p>
                    <p className="text-3xl font-bold text-white capitalize" data-testid="text-reward-tier">
                      {getRewardTier()} Tier!
                    </p>
                  </div>
                )}

                {/* Wallet Connection */}
                {!isConnected ? (
                  <Button
                    size="lg"
                    onClick={handleConnectWallet}
                    className="w-full bg-white text-purple-600 hover:bg-white/90"
                    data-testid="button-connect-claim-wallet"
                  >
                    <Wallet className="w-5 h-5 mr-2" />
                    Connect Pera Wallet to Claim
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <p className="text-white/60 text-xs mb-1">Connected Wallet</p>
                      <p className="text-white font-mono text-sm" data-testid="text-connected-wallet">
                        {accountAddress ? `${accountAddress.slice(0, 8)}...${accountAddress.slice(-6)}` : 'Not connected'}
                      </p>
                    </div>
                    
                    <Button
                      size="lg"
                      onClick={claimRewards}
                      disabled={submitScoreMutation.isPending || !voucher || !getRewardTier()}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-claim-rewards"
                    >
                      <Trophy className="w-5 h-5 mr-2" />
                      {submitScoreMutation.isPending 
                        ? 'Submitting Score...' 
                        : voucher 
                        ? 'Claim Rewards On-Chain' 
                        : 'Waiting for Voucher...'}
                    </Button>
                    
                    {!submitScoreMutation.isPending && !voucher && getRewardTier() && (
                      <p className="text-white/60 text-xs text-center">
                        Generating cryptographic voucher...
                      </p>
                    )}
                    
                    {!getRewardTier() && !submitScoreMutation.isPending && (
                      <p className="text-white/60 text-xs text-center">
                        You need to earn a reward tier to claim
                      </p>
                    )}
                  </div>
                )}

                {/* Social Share */}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-white/40 text-white hover:bg-white/10"
                  data-testid="button-share"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share Your Score
                </Button>

                {/* Play Again */}
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    setGameState('ready');
                    setScore(0);
                    setTargetsHit(0);
                    setTimeLeft(event.gameDuration);
                    setVoucher(null);
                  }}
                  className="w-full text-white hover:bg-white/10"
                  data-testid="button-play-again"
                >
                  Play Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
