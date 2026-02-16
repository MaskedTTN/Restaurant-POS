"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Plus, Search, ArrowLeft, Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/lib/auth";

interface Organization {
  organization_id: number;
  name: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  organization_id: string;
  license_key?: string;
  license_status: "active" | "pending" | "expired";
}

function LocationsContent() {
  const { token } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    organization_id: "",
    license_key: "",
  });

  useEffect(() => {
    if (token) {
      loadOrganizations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (isOpen && token) {
      loadOrganizations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (organizations.length) {
      setFormData((s) =>
        s.organization_id
          ? s
          : { ...s, organization_id: String(organizations[0].organization_id) },
      );
      loadLocations();
    } else {
      setLocations([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizations]);

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
      const orgId = Number(formData.organization_id);
      const res = await fetch(`${API_URL}/organization/${orgId}/add_location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          timezone: "UTC",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Failed creating location", data);
        return;
      }

      // refresh locations
      await loadLocations();
      setFormData({
        name: "",
        address: "",
        organization_id: String(orgId),
        license_key: "",
      });
      setIsOpen(false);
    } catch (err) {
      console.error("Error creating location", err);
    }
  };

  const loadOrganizations = async () => {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
      const res = await fetch(`${API_URL}/organization/my`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to load organizations", data);
        return;
      }
      const orgs: Organization[] = (data.organizations || []).map((o: any) => ({
        organization_id: o.organization_id,
        name: o.name,
      }));
      setOrganizations(orgs);
      if (orgs.length && !formData.organization_id) {
        setFormData((s) => ({
          ...s,
          organization_id: String(orgs[0].organization_id),
        }));
      }
    } catch (err) {
      console.error("Error loading organizations", err);
    }
  };

  const loadLocations = async () => {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
      const all: Location[] = [];
      for (const org of organizations) {
        const res = await fetch(
          `${API_URL}/organization/${org.organization_id}/locations`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );
        const data = await res.json();
        if (!res.ok) {
          console.error(
            `Failed loading locations for org ${org.organization_id}`,
            data,
          );
          continue;
        }
        const mapped: Location[] = (data.locations || []).map((l: any) => ({
          id: String(l.location_id || l.id),
          name: l.name,
          address: l.address || "",
          organization_id: String(org.organization_id),
          license_key: l.license_key || undefined,
          license_status:
            l.license_status || (l.license_key ? "active" : "pending"),
        }));
        all.push(...mapped);
      }
      setLocations(all);
    } catch (err) {
      console.error("Error loading locations", err);
    }
  };

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Locations</h1>
            </div>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
                <DialogDescription>
                  Add a new restaurant location and configure its license
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateLocation} className="space-y-4">
                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Select
                    value={formData.organization_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, organization_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.length === 0 ? (
                        <SelectItem value="no-org" disabled>
                          No organizations
                        </SelectItem>
                      ) : (
                        organizations.map((org) => (
                          <SelectItem
                            key={org.organization_id}
                            value={String(org.organization_id)}
                          >
                            {org.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location-name">Location Name</Label>
                  <Input
                    id="location-name"
                    placeholder="e.g., Main Street Location"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main St, City, State 12345"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="license">License Key (Optional)</Label>
                  <Input
                    id="license"
                    placeholder="Enter license key"
                    value={formData.license_key}
                    onChange={(e) =>
                      setFormData({ ...formData, license_key: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Location
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredLocations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Locations Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first location to start managing devices
              </p>
              <Button onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredLocations.map((location) => (
              <Card
                key={location.id}
                className="hover:border-primary transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{location.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {location.address}
                      </CardDescription>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        location.license_status === "active"
                          ? "bg-chart-2/10 text-chart-2"
                          : location.license_status === "pending"
                            ? "bg-chart-4/10 text-chart-4"
                            : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {location.license_status}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Building2 className="h-4 w-4" />
                    <span>Organization ID: {location.organization_id}</span>
                  </div>
                  {location.license_key && (
                    <div className="text-xs text-muted-foreground mb-4 font-mono bg-muted p-2 rounded">
                      License: {location.license_key}
                    </div>
                  )}
                  <Link href={`/locations/${location.id}`}>
                    <Button variant="secondary" className="w-full">
                      Manage Location
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function LocationsPage() {
  return (
    <AuthGuard>
      <LocationsContent />
    </AuthGuard>
  );
}
