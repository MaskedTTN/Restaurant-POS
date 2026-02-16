"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Plus, Search, ArrowLeft } from "lucide-react";
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
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface Organization {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

function OrganizationsContent() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    console.debug("Creating org - token:", token);
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
      const res = await fetch(`${API_URL}/organization/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        }),
      });
      console.debug(
        "Create org request sent. Authorization header present?",
        !!token,
      );

      const data = await res.json();
      if (!res.ok) {
        console.error("Failed creating organization", data);
        if (res.status === 401) {
          // token invalid or missing
          logout();
          router.push("/login");
          return;
        }
        throw new Error(
          data.detail || data.error || "Failed to create organization",
        );
      }

      // refresh the organizations list
      await fetchOrganizations();
      setFormData({ name: "", description: "" });
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      // keep simple UI behavior; developer can show toast here
    }
  };

  const fetchOrganizations = async () => {
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
        console.error("Failed to fetch organizations", data);
        if (res.status === 401) {
          logout();
          router.push("/login");
          return;
        }
        return;
      }

      const mapped: Organization[] = (data.organizations || []).map(
        (o: any) => ({
          id: String(o.organization_id || o.id),
          name: o.name,
          description: o.description || "",
          created_at: o.created_at || new Date().toISOString(),
        }),
      );

      setOrganizations(mapped);
    } catch (err) {
      console.error("Error fetching organizations", err);
    }
  };

  // load organizations when token changes / component mounts
  useEffect(() => {
    if (token) fetchOrganizations();
  }, [token]);

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()),
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
              <Building2 className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Organizations</h1>
            </div>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
                <DialogDescription>
                  Add a new restaurant organization to your account
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOrganization} className="space-y-4">
                <div>
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Downtown Bistro Group"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of your organization"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Organization
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
              placeholder="Search organizations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredOrgs.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                No Organizations Yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first organization to get started
              </p>
              <Button onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrgs.map((org) => (
              <Card
                key={org.id}
                className="hover:border-primary transition-colors"
              >
                <CardHeader>
                  <CardTitle>{org.name}</CardTitle>
                  <CardDescription>{org.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    Created {new Date(org.created_at).toLocaleDateString()}
                  </div>
                  <Link href={`/organizations/${org.id}`}>
                    <Button variant="secondary" className="w-full">
                      View Details
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

export default function OrganizationsPage() {
  return (
    <AuthGuard>
      <OrganizationsContent />
    </AuthGuard>
  );
}
