import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A2D5E] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showLogin={false} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to NorthBridge Capital Bank
          </h1>
          <p className="text-lg text-gray-600 mb-8">Redirecting you to your dashboard...</p>

          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.role === "admin" ? (
                <>
                  <p className="text-gray-600">You have admin access.</p>
                  <Button
                    onClick={() => setLocation("/admin")}
                    className="w-full bg-[#0A2D5E] hover:bg-[#051A3E] text-white"
                    data-testid="button-admin-dashboard"
                  >
                    Go to Admin Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-gray-600">Welcome to your banking portal.</p>
                  <Button
                    onClick={() => setLocation("/dashboard")}
                    className="w-full bg-[#0A2D5E] hover:bg-[#051A3E] text-white"
                    data-testid="button-customer-dashboard"
                  >
                    Go to Dashboard
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
