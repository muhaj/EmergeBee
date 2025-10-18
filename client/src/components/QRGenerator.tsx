import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";
import type { Event } from "@shared/schema";

interface QRGeneratorProps {
  event: Event;
  onClose: () => void;
}

export default function QRGenerator({ event, onClose }: QRGeneratorProps) {
  const { toast } = useToast();
  const [qrCodes, setQrCodes] = useState<Map<string, string>>(new Map());
  const [copiedZone, setCopiedZone] = useState<string | null>(null);

  useEffect(() => {
    generateQRCodes();
  }, [event]);

  const generateQRCodes = async () => {
    const baseUrl = window.location.origin;
    const codes = new Map<string, string>();

    for (const zone of event.zones) {
      const arUrl = `${baseUrl}/ar/${event.id}?zone=${zone}`;
      
      try {
        const qrDataUrl = await QRCode.toDataURL(arUrl, {
          width: 512,
          margin: 2,
          color: {
            dark: '#7c3aed', // purple-600
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H'
        });
        
        codes.set(zone, qrDataUrl);
      } catch (error) {
        console.error(`Failed to generate QR code for zone ${zone}:`, error);
      }
    }
    
    setQrCodes(codes);
  };

  const downloadQRCode = (zone: string) => {
    const qrDataUrl = qrCodes.get(zone);
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `spectacle-${event.name.replace(/\s+/g, '-')}-zone-${zone}.png`;
    link.href = qrDataUrl;
    link.click();

    toast({
      title: "QR Code downloaded",
      description: `Zone ${zone} QR code saved successfully.`,
    });
  };

  const downloadAll = () => {
    qrCodes.forEach((_, zone) => {
      setTimeout(() => downloadQRCode(zone), 100);
    });

    toast({
      title: "All QR codes downloading",
      description: `Downloading ${qrCodes.size} QR codes...`,
    });
  };

  const copyLink = (zone: string) => {
    const baseUrl = window.location.origin;
    const arUrl = `${baseUrl}/ar/${event.id}?zone=${zone}`;
    
    navigator.clipboard.writeText(arUrl);
    setCopiedZone(zone);
    
    setTimeout(() => setCopiedZone(null), 2000);

    toast({
      title: "Link copied",
      description: `AR experience link for Zone ${zone} copied to clipboard.`,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-qr-generator">
        <DialogHeader>
          <DialogTitle className="text-2xl">QR Code Generator</DialogTitle>
          <DialogDescription>
            Generate and download QR codes for {event.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Event Name</p>
                <p className="font-medium" data-testid="text-qr-event-name">{event.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(event.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Game Type</p>
                <Badge variant="outline">{event.gameType.replace('_', ' ')}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Total Zones</p>
                <p className="font-bold text-lg text-primary">{event.zones.length}</p>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <p className="font-semibold">Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Download QR codes for each zone or entrance</li>
                  <li>Print QR codes at a visible size (minimum 4x4 inches)</li>
                  <li>Place QR codes at event locations</li>
                  <li>Attendees scan to launch the AR experience</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* QR Codes Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Zone QR Codes</h3>
              <Button
                onClick={downloadAll}
                variant="outline"
                data-testid="button-download-all"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {event.zones.map(zone => {
                const qrDataUrl = qrCodes.get(zone);
                return (
                  <Card key={zone} className="hover-elevate transition-all" data-testid={`card-qr-${zone}`}>
                    <CardHeader>
                      <CardTitle className="text-center text-lg">
                        Zone {zone}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* QR Code Image */}
                      <div className="aspect-square bg-white rounded-lg p-4 border-2 border-primary/20">
                        {qrDataUrl ? (
                          <img
                            src={qrDataUrl}
                            alt={`QR Code for Zone ${zone}`}
                            className="w-full h-full"
                            data-testid={`img-qr-${zone}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted animate-pulse rounded">
                            <span className="text-sm text-muted-foreground">Generating...</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => downloadQRCode(zone)}
                          disabled={!qrDataUrl}
                          data-testid={`button-download-${zone}`}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => copyLink(zone)}
                          data-testid={`button-copy-${zone}`}
                        >
                          {copiedZone === zone ? (
                            <Check className="w-4 h-4 mr-1" />
                          ) : (
                            <Copy className="w-4 h-4 mr-1" />
                          )}
                          {copiedZone === zone ? "Copied!" : "Copy Link"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
