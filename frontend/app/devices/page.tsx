"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tablet,
  Plus,
  Search,
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Clock,
} from "lucide-react";
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

interface Device {
  id: string;
  name: string;
  device_id: string;
  location_id: string;
  location_name: string;
  status: "registered" | "pending" | "inactive";
  registration_code?: string;
}

function DevicesContent() {
  const { token } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    location_id: "",
    device_type: "POS",
  });
  const [locations, setLocations] = useState<
    { location_id: number; name: string; organization_id?: number }[]
  >([]);

  const handleStartRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
      const locId = Number(formData.location_id);
      const res = await fetch(`${API_URL}/devices/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          location_id: locId,
          device_name: formData.name,
          device_type: formData.device_type,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to register device", data);
        return;
      }

      const newDevice: Device = {
        id: String(data.device_id || Math.random().toString(36).substr(2, 9)),
        name: data.device_name || formData.name,
        device_id: String(data.device_id || ""),
        location_id: String(locId),
        location_name:
          locations.find((l) => l.location_id === locId)?.name || "",
        status: data.device_status || "pending",
        registration_code: data.pairing_code || undefined,
      };

      setDevices((prev) => [...prev, newDevice]);
      setFormData({ name: "", location_id: "", device_type: "POS" });
      setIsOpen(false);
    } catch (err) {
      console.error("Error registering device", err);
    }
  };

  const loadOrganizationsAndLocations = async () => {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
      const orgRes = await fetch(`${API_URL}/organization/my`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const orgData = await orgRes.json();
      if (!orgRes.ok) {
        console.error("Failed to load organizations", orgData);
        return;
      }

      const allLocations: {
        location_id: number;
        name: string;
        organization_id?: number;
      }[] = [];
      for (const org of orgData.organizations || []) {
        const locRes = await fetch(
          `${API_URL}/organization/${org.organization_id}/locations`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );
        const locData = await locRes.json();
        if (!locRes.ok) {
          console.error(
            `Failed to load locations for org ${org.organization_id}`,
            locData,
          );
          continue;
        }
        for (const l of locData.locations || []) {
          allLocations.push({
            location_id: l.location_id || l.id,
            name: l.name,
            organization_id: org.organization_id,
          });
        }
      }
      setLocations(allLocations);
      if (allLocations.length && !formData.location_id) {
        setFormData((s) => ({
          ...s,
          location_id: String(allLocations[0].location_id),
        }));
      }
    } catch (err) {
      console.error("Error loading organizations/locations", err);
    }
  };

  const loadDevices = async () => {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
      const res = await fetch(`${API_URL}/devices/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to load devices", data);
        return;
      }
      const mapped: Device[] = (data.devices || []).map((d: any) => ({
        id: String(d.device_id),
        name: d.device_name,
        device_id: String(d.device_id),
        location_id: String(d.location_id),
        location_name:
          locations.find((l) => l.location_id === d.location_id)?.name ||
          String(d.location_id),
        status: d.device_status || "inactive",
        registration_code: undefined,
      }));
      setDevices(mapped);
    } catch (err) {
      console.error("Error loading devices", err);
    }
  };

  // load data when token becomes available
  useEffect(() => {
    if (token) {
      loadOrganizationsAndLocations();
      loadDevices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredDevices = devices.filter(
    (device) =>
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.device_id.toLowerCase().includes(searchQuery.toLowerCase()),
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
              <Tablet className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Device Registration</h1>
            </div>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Register Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Device Registration</DialogTitle>
                <DialogDescription>
                  Generate a registration code for a new POS device
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleStartRegistration} className="space-y-4">
                <div>
                  <Label htmlFor="device-name">Device Name</Label>
                  <Input
                    id="device-name"
                    placeholder="e.g., Front Counter Terminal"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={formData.location_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, location_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.length === 0 ? (
                        <SelectItem value="no-location" disabled>
                          No locations
                        </SelectItem>
                      ) : (
                        locations.map((loc) => (
                          <SelectItem
                            key={loc.location_id}
                            value={String(loc.location_id)}
                          >
                            {loc.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Generate Registration Code
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
              placeholder="Search devices..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredDevices.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Tablet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                No Devices Registered
              </h3>
              <p className="text-muted-foreground mb-4">
                Start the registration process for your first POS device
              </p>
              <Button onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Register Device
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDevices.map((device) => (
              <Card
                key={device.id}
                className="hover:border-primary transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {device.name}
                        {device.status === "registered" && (
                          <CheckCircle2 className="h-4 w-4 text-chart-2" />
                        )}
                        {device.status === "pending" && (
                          <Clock className="h-4 w-4 text-chart-4" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Device ID: {device.device_id}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>{device.location_name}</span>
                  </div>
                  {device.registration_code && device.status === "pending" && (
                    <div className="mb-4">
                      <Label className="text-xs">Registration Code</Label>
                      <div className="text-2xl font-bold font-mono bg-muted p-3 rounded text-center tracking-wider">
                        {device.registration_code}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Enter this code on your POS device
                      </p>
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 rounded text-sm font-medium text-center ${
                      device.status === "registered"
                        ? "bg-chart-2/10 text-chart-2"
                        : device.status === "pending"
                          ? "bg-chart-4/10 text-chart-4"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {device.status === "registered"
                      ? "Active"
                      : device.status === "pending"
                        ? "Awaiting Activation"
                        : "Inactive"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DevicesPage() {
  return (
    <AuthGuard>
      <DevicesContent />
    </AuthGuard>
  );
}
