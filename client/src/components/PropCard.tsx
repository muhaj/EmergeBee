import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign } from "lucide-react";
import { Link } from "wouter";
import type { Prop } from "@shared/schema";

interface PropCardProps {
  prop: Prop;
}

export default function PropCard({ prop }: PropCardProps) {
  const primaryPhoto = prop.photos.find(p => p.isPrimary) || prop.photos[0];
  
  const statusColors = {
    active: "bg-accent text-accent-foreground",
    rented: "bg-secondary text-secondary-foreground",
    maintenance: "bg-muted text-muted-foreground"
  };

  return (
    <Card 
      className="overflow-hidden hover-elevate transition-all duration-200 group"
      data-testid={`card-prop-${prop.id}`}
    >
      {/* Prop Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {primaryPhoto ? (
          <img 
            src={primaryPhoto.url} 
            alt={prop.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            data-testid={`img-prop-${prop.id}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge 
            className={statusColors[prop.status as keyof typeof statusColors] || statusColors.active}
            data-testid={`badge-status-${prop.id}`}
          >
            {prop.status}
          </Badge>
        </div>
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" data-testid={`badge-category-${prop.id}`}>
            {prop.category.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <h3 className="font-bold text-xl leading-tight" data-testid={`text-name-${prop.id}`}>
          {prop.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-description-${prop.id}`}>
          {prop.description}
        </p>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span data-testid={`text-location-${prop.id}`}>{prop.location}</span>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Daily Rate</p>
            <p className="text-2xl font-bold text-primary" data-testid={`text-rate-${prop.id}`}>
              ${prop.dailyRate}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Deposit</p>
            <p className="text-lg font-semibold" data-testid={`text-deposit-${prop.id}`}>
              ${prop.depositAmount}
            </p>
          </div>
        </div>

        {/* Vendor */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">Vendor</p>
          <p className="text-sm font-medium" data-testid={`text-vendor-${prop.id}`}>
            {prop.vendorName}
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          asChild 
          className="w-full"
          data-testid={`button-view-${prop.id}`}
        >
          <Link href={`/prop/${prop.id}`}>
            <DollarSign className="w-4 h-4 mr-2" />
            View & Book
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
