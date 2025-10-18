import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Users, Trophy, QrCode, Package } from "lucide-react";
import CreateEventModal from "@/components/CreateEventModal";
import QRGenerator from "@/components/QRGenerator";
import type { Event, Booking } from "@shared/schema";

export default function OrganizerDashboard() {
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showQRGenerator, setShowQRGenerator] = useState(false);

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/my-bookings"],
  });

  const stats = {
    totalEvents: events?.length || 0,
    activeEvents: events?.filter(e => e.status === "active").length || 0,
    totalPlayers: events?.reduce((sum, e) => sum + e.playerCount, 0) || 0,
    activeBookings: bookings?.filter(b => b.status === "active").length || 0,
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
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg" data-testid={`text-booking-id-${booking.id}`}>
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
                    <CardContent className="grid sm:grid-cols-3 gap-4">
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
                        <p className="text-sm text-muted-foreground">Escrow TX</p>
                        <p className="text-xs font-mono" data-testid={`text-booking-tx-${booking.id}`}>
                          {booking.escrowTxId ? `${booking.escrowTxId.slice(0, 12)}...` : 'Pending'}
                        </p>
                      </div>
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
