"use client"

import Link from "next/link"
import { Building2, MapPin, Tablet, BarChart3, LogOut } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">RestaurantPOS</span>
          </div>
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/organizations">
                  <Button variant="ghost">Organizations</Button>
                </Link>
                <Link href="/locations">
                  <Button variant="ghost">Locations</Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="ghost">Analytics</Button>
                </Link>
                <div className="flex items-center gap-3 border-l border-border pl-4 ml-2">
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 text-balance">Restaurant Point of Sale Management</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Manage your restaurant operations efficiently with organization setup, location management, device
            registration, and real-time analytics.
          </p>
          {!user && (
            <div className="mt-8 flex gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-chart-1/10 flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-chart-1" />
              </div>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>Create and manage your restaurant organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={user ? "/organizations" : "/login"}>
                <Button className="w-full">Manage Organizations</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-chart-2" />
              </div>
              <CardTitle>Locations</CardTitle>
              <CardDescription>Add locations and manage licenses for your restaurants</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={user ? "/locations" : "/login"}>
                <Button className="w-full">Manage Locations</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4">
                <Tablet className="h-6 w-6 text-chart-3" />
              </div>
              <CardTitle>Device Registration</CardTitle>
              <CardDescription>Register and manage POS devices for your locations</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={user ? "/devices" : "/login"}>
                <Button className="w-full">Register Devices</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-chart-4/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-chart-4" />
              </div>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View comprehensive insights and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={user ? "/analytics" : "/login"}>
                <Button className="w-full">View Analytics</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-primary/5 to-chart-1/5 border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Get Started</CardTitle>
            <CardDescription className="text-base">
              Follow these steps to set up your restaurant POS system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Create Organization</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up your restaurant organization with basic details
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Add Locations</h3>
                  <p className="text-sm text-muted-foreground">Configure restaurant locations and their licenses</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex-shrink-0 flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Register Devices</h3>
                  <p className="text-sm text-muted-foreground">Connect POS devices and start taking orders</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
