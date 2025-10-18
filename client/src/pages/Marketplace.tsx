import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import PropCard from "@/components/PropCard";
import type { Prop } from "@shared/schema";

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  const { data: props, isLoading } = useQuery<Prop[]>({
    queryKey: ["/api/props"],
  });

  const categories = [
    { id: "all", label: "All Props", count: props?.length || 0 },
    { id: "inflatable", label: "Inflatables", count: props?.filter(p => p.category === "inflatable").length || 0 },
    { id: "sculpture", label: "Sculptures", count: props?.filter(p => p.category === "sculpture").length || 0 },
    { id: "booth", label: "Booths", count: props?.filter(p => p.category === "booth").length || 0 },
    { id: "branded", label: "Branded Setups", count: props?.filter(p => p.category === "branded").length || 0 },
    { id: "giant_props", label: "Giant Props", count: props?.filter(p => p.category === "giant_props").length || 0 },
  ];

  const filteredProps = props?.filter(prop => {
    const matchesSearch = prop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prop.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === "all" || prop.category === selectedCategory;
    const matchesPrice = parseFloat(prop.dailyRate) >= priceRange[0] && 
                        parseFloat(prop.dailyRate) <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" data-testid="text-marketplace-title">
            Prop Marketplace
          </h1>
          <p className="text-xl text-white/90 mb-8" data-testid="text-marketplace-subtitle">
            Browse and rent event props with blockchain-secured deposits
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search props by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60"
                data-testid="input-search"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 space-y-6">
            <Card data-testid="card-filters">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Categories */}
                <div>
                  <h3 className="font-semibold mb-3">Category</h3>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id === "all" ? null : category.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between ${
                          (selectedCategory === category.id || (!selectedCategory && category.id === "all"))
                            ? "bg-primary text-primary-foreground"
                            : "hover-elevate text-muted-foreground hover:text-foreground"
                        }`}
                        data-testid={`button-category-${category.id}`}
                      >
                        <span className="text-sm font-medium">{category.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {category.count}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="font-semibold mb-3">Price Range</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        placeholder="Min"
                        className="text-sm"
                        data-testid="input-price-min"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])}
                        placeholder="Max"
                        className="text-sm"
                        data-testid="input-price-max"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ${priceRange[0]} - ${priceRange[1]} per day
                    </p>
                  </div>
                </div>

                {/* Reset Filters */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory(null);
                    setPriceRange([0, 1000]);
                  }}
                  data-testid="button-reset-filters"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Props Grid */}
          <div className="lg:col-span-3">
            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground" data-testid="text-results-count">
                {isLoading ? "Loading..." : `${filteredProps?.length || 0} props found`}
              </p>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-[4/3] bg-muted animate-pulse" />
                    <CardHeader className="space-y-2">
                      <div className="h-6 bg-muted animate-pulse rounded" />
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {/* Props Grid */}
            {!isLoading && filteredProps && filteredProps.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProps.map(prop => (
                  <PropCard key={prop.id} prop={prop} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredProps && filteredProps.length === 0 && (
              <Card className="py-16">
                <CardContent className="text-center">
                  <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No props found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your filters or search query
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory(null);
                      setPriceRange([0, 1000]);
                    }}
                    data-testid="button-clear-filters-empty"
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
