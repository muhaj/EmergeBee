import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Calendar, Users, Trophy, QrCode, Package, ExternalLink, Shield, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CreateEventModal from "@/components/CreateEventModal";
import QRGenerator from "@/components/QRGenerator";
import type { Event, Booking } from "@shared/schema";

export default function OrganizerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/my-bookings"],
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event deleted",
        description: "The event has been successfully removed.",
      });
      setEventToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const stats = {
    totalEvents: events?.length || 0,
    activeEvents: events?.filter(e => e.status === "active").length || 0,
    totalPlayers: events?.reduce((sum, e) => sum + e.playerCount, 0) || 0,
    activeBookings: bookings?.filter(b => b.status === "pending" || b.status === "confirmed" || b.status === "active").length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2" data-testid="text-dashboard-title">
                Organizer Dashboard
              </h1>
              <p className="text-white/90" data-testid="text-dashboard-subtitle">
                Manage your events, bookings, and AR experiences
              </p>
            </div>
            <Button
              onClick={() => setCreateEventOpen(true)}
              size="lg"
              className="bg-white text-purple-600 hover:bg-white/90"
              data-testid="button-create-event"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Event
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            label="Total Events"
            value={stats.totalEvents}
            color="from-purple-500 to-violet-500"
            testId="stat-total-events"
          />
          <StatCard
            icon={<Trophy className="w-6 h-6" />}
            label="Active Events"
            value={stats.activeEvents}
            color="from-violet-500 to-purple-500"
            testId="stat-active-events"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Players"
            value={stats.totalPlayers}
            color="from-pink-500 to-rose-500"
            testId="stat-total-players"
          />
          <StatCard
            icon={<Package className="w-6 h-6" />}
            label="Active Bookings"
            value={stats.activeBookings}
            color="from-rose-500 to-pink-500"
            testId="stat-active-bookings"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto" data-testid="tabs-list">
            <TabsTrigger value="events" data-testid="tab-events">
              <Calendar className="w-4 h-4 mr-2" />
              My Events
            </TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-bookings">
              <Package className="w-4 h-4 mr-2" />
              My Bookings
            </TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            {eventsLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                  <Card key={i}>
                    <CardHeader className="space-y-2">
                      <div className="h-6 bg-muted animate-pulse rounded" />
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : events && events.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {events.map(event => (
                  <Card key={event.id} className="hover-elevate transition-all" data-testid={`card-event-${event.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2" data-testid={`text-event-name-${event.id}`}>
                            {event.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-event-desc-${event.id}`}>
                            {event.description}
                          </p>
                        </div>
                        <Badge
                          variant={event.status === "active" ? "default" : "secondary"}
                          data-testid={`badge-event-status-${event.id}`}
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium" data-testid={`text-event-date-${event.id}`}>
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium" data-testid={`text-event-location-${event.id}`}>
                            {event.location}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Players</p>
                          <p className="font-bold text-lg text-primary" data-testid={`text-event-players-${event.id}`}>
                            {event.playerCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Zones</p>
                          <p className="font-medium" data-testid={`text-event-zones-${event.id}`}>
                            {event.zones.length}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Game Type</p>
                        <Badge variant="outline" data-testid={`badge-game-type-${event.id}`}>
                          {event.gameType.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowQRGenerator(true);
                        }}
                        data-testid={`button-generate-qr-${event.id}`}
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        QR Codes
                      </Button>
                      <Button
                        variant="default"
                        className="flex-1"
                        data-testid={`button-view-analytics-${event.id}`}
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        Analytics
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEventToDelete(event)}
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        data-testid={`button-delete-event-${event.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="py-16">
                <CardContent className="text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No events yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first AR experience to engage attendees
                  </p>
                  <Button onClick={() => setCreateEventOpen(true)} data-testid="button-create-first-event">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Event
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
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

                            {/* Transaction IDs */}
                            <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                              <p className="text-sm font-semibold text-muted-foreground">Transaction History</p>
                              
                              {booking.deploymentTxId && (
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground">Deployment</p>
                                    <p className="font-mono text-xs break-all" data-testid={`text-deployment-tx-${booking.id}`}>
                                      {booking.deploymentTxId}
                                    </p>
                                  </div>
                                  <a
                                    href={`https://testnet.algoexplorer.io/tx/${booking.deploymentTxId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 text-primary hover:underline"
                                    data-testid={`link-deployment-explorer-${booking.id}`}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                              )}

                              {booking.depositTxId && (
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground">Deposit Paid</p>
                                    <p className="font-mono text-xs break-all" data-testid={`text-deposit-tx-${booking.id}`}>
                                      {booking.depositTxId}
                                    </p>
                                  </div>
                                  <a
                                    href={`https://testnet.algoexplorer.io/tx/${booking.depositTxId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 text-primary hover:underline"
                                    data-testid={`link-deposit-explorer-${booking.id}`}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                              )}

                              {booking.deliveryTxId && (
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground">Delivery Confirmed</p>
                                    <p className="font-mono text-xs break-all" data-testid={`text-delivery-tx-${booking.id}`}>
                                      {booking.deliveryTxId}
                                    </p>
                                  </div>
                                  <a
                                    href={`https://testnet.algoexplorer.io/tx/${booking.deliveryTxId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 text-primary hover:underline"
                                    data-testid={`link-delivery-explorer-${booking.id}`}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                              )}

                              {booking.returnTxId && (
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground">Return Confirmed</p>
                                    <p className="font-mono text-xs break-all" data-testid={`text-return-tx-${booking.id}`}>
                                      {booking.returnTxId}
                                    </p>
                                  </div>
                                  <a
                                    href={`https://testnet.algoexplorer.io/tx/${booking.returnTxId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 text-primary hover:underline"
                                    data-testid={`link-return-explorer-${booking.id}`}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                              )}

                              {booking.refundTxId && (
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground">Refund Processed</p>
                                    <p className="font-mono text-xs break-all" data-testid={`text-refund-tx-${booking.id}`}>
                                      {booking.refundTxId}
                                    </p>
                                  </div>
                                  <a
                                    href={`https://testnet.algoexplorer.io/tx/${booking.refundTxId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 text-primary hover:underline"
                                    data-testid={`link-refund-explorer-${booking.id}`}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* View on Explorer */}
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

                      {/* Legacy Escrow TX (for old bookings without smart contract) */}
                      {!booking.contractAppId && booking.escrowTxId && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Escrow TX (Legacy)</p>
                            <p className="text-xs font-mono" data-testid={`text-booking-tx-${booking.id}`}>
                              {booking.escrowTxId}
                            </p>
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <CreateEventModal
        open={createEventOpen}
        onClose={() => setCreateEventOpen(false)}
      />

      {showQRGenerator && selectedEvent && (
        <QRGenerator
          event={selectedEvent}
          onClose={() => {
            setShowQRGenerator(false);
            setSelectedEvent(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent data-testid="dialog-delete-event">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "<span className="font-semibold">{eventToDelete?.name}</span>"? 
              This action cannot be undone. All associated game sessions and QR codes will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => eventToDelete && deleteEventMutation.mutate(eventToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteEventMutation.isPending ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  testId: string;
}) {
  return (
    <Card className="hover-elevate transition-all" data-testid={testId}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white`}>
            {icon}
          </div>
          <p className="text-3xl font-bold" data-testid={`${testId}-value`}>
            {value}
          </p>
        </div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
      </CardContent>
    </Card>
  );
}
