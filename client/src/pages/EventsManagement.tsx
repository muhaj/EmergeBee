import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/lib/WalletContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Calendar, QrCode, Trophy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CreateEventModal from "@/components/CreateEventModal";
import QRGenerator from "@/components/QRGenerator";
import type { Event } from "@shared/schema";

export default function EventsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected } = useWallet();
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  
  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    enabled: isConnected,
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Wallet Required</CardTitle>
            <CardDescription>Please connect your wallet to manage AR events</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const stats = {
    totalEvents: events?.length || 0,
    activeEvents: events?.filter(e => e.status === "active").length || 0,
    totalPlayers: events?.reduce((sum, e) => sum + e.playerCount, 0) || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2" data-testid="text-events-title">
                AR Events Management
              </h1>
              <p className="text-white/90" data-testid="text-events-subtitle">
                Create and manage AR experiences for your events
              </p>
            </div>
            <Button
              onClick={() => setCreateEventOpen(true)}
              size="lg"
              className="bg-white text-violet-600 hover:bg-white/90"
              data-testid="button-create-event"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create AR Event
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-events">{stats.totalEvents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
              <Trophy className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-events">{stats.activeEvents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <QrCode className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-players">{stats.totalPlayers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
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
