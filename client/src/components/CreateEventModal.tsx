import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertEvent } from "@shared/schema";

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateEventModal({ open, onClose }: CreateEventModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Partial<InsertEvent>>({
    name: "",
    description: "",
    organizerWallet: "SPECTACLE" + Math.random().toString(36).substring(2, 15).toUpperCase(),
    organizerName: "Event Organizer",
    date: new Date().toISOString().split('T')[0],
    location: "",
    gameType: "tap_targets",
    gameDuration: 30,
    rewards: {
      pointsPerTarget: 10,
      bronzeThreshold: 30,
      silverThreshold: 60,
      goldThreshold: 100,
    },
    zones: ["A1", "A2", "B1", "B2"],
    status: "draft",
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: InsertEvent) => {
      return await apiRequest("POST", "/api/events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event created!",
        description: "Your AR experience is ready. Generate QR codes to share with attendees.",
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      organizerWallet: "SPECTACLE" + Math.random().toString(36).substring(2, 15).toUpperCase(),
      organizerName: "Event Organizer",
      date: new Date().toISOString().split('T')[0],
      location: "",
      gameType: "tap_targets",
      gameDuration: 30,
      rewards: {
        pointsPerTarget: 10,
        bronzeThreshold: 30,
        silverThreshold: 60,
        goldThreshold: 100,
      },
      zones: ["A1", "A2", "B1", "B2"],
      status: "draft",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate(formData as InsertEvent);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-event">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create AR Event</DialogTitle>
          <DialogDescription>
            Set up a new AR experience for your attendees
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Summer Festival AR Experience"
              required
              data-testid="input-event-name"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="An exciting AR game for festival attendees..."
              rows={3}
              required
              data-testid="textarea-event-description"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Event Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                data-testid="input-event-date"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, State"
                required
                data-testid="input-event-location"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Game Type */}
            <div className="space-y-2">
              <Label htmlFor="gameType">Game Type *</Label>
              <Select
                value={formData.gameType}
                onValueChange={(value) => setFormData({ ...formData, gameType: value })}
              >
                <SelectTrigger data-testid="select-game-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tap_targets">Tap Targets</SelectItem>
                  <SelectItem value="ring_toss">Ring Toss</SelectItem>
                  <SelectItem value="scavenger_hunt">Scavenger Hunt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Game Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.gameDuration}
                onChange={(e) => setFormData({ ...formData, gameDuration: parseInt(e.target.value) })}
                min={15}
                max={120}
                required
                data-testid="input-game-duration"
              />
            </div>
          </div>

          {/* Rewards Configuration */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Reward Thresholds</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bronze">Bronze (points)</Label>
                <Input
                  id="bronze"
                  type="number"
                  value={formData.rewards?.bronzeThreshold}
                  onChange={(e) => setFormData({
                    ...formData,
                    rewards: { ...formData.rewards!, bronzeThreshold: parseInt(e.target.value) }
                  })}
                  data-testid="input-bronze-threshold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="silver">Silver (points)</Label>
                <Input
                  id="silver"
                  type="number"
                  value={formData.rewards?.silverThreshold}
                  onChange={(e) => setFormData({
                    ...formData,
                    rewards: { ...formData.rewards!, silverThreshold: parseInt(e.target.value) }
                  })}
                  data-testid="input-silver-threshold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gold">Gold (points)</Label>
                <Input
                  id="gold"
                  type="number"
                  value={formData.rewards?.goldThreshold}
                  onChange={(e) => setFormData({
                    ...formData,
                    rewards: { ...formData.rewards!, goldThreshold: parseInt(e.target.value) }
                  })}
                  data-testid="input-gold-threshold"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-event"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEventMutation.isPending}
              data-testid="button-submit-event"
            >
              {createEventMutation.isPending ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
