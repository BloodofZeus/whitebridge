import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Home from "@/pages/home";
import AdminDashboard from "@/pages/admin-dashboard";
import CustomerDashboard from "@/pages/customer-dashboard";
import Transfer from "@/pages/transfer";
import UserManagement from "@/pages/user-management";
import FindBranch from "@/pages/find-branch";
import Personal from "@/pages/personal";
import Business from "@/pages/business";
import Commercial from "@/pages/commercial";
import PrivateClient from "@/pages/private-client";
import Investing from "@/pages/investing";
import Products from "@/pages/products";
import Promotions from "@/pages/promotions";
import Services from "@/pages/services";
import Help from "@/pages/help";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={UserManagement} />
      <Route path="/dashboard" component={CustomerDashboard} />
      <Route path="/transfer" component={Transfer} />
      <Route path="/find-branch" component={FindBranch} />
      <Route path="/personal" component={Personal} />
      <Route path="/business" component={Business} />
      <Route path="/commercial" component={Commercial} />
      <Route path="/private-client" component={PrivateClient} />
      <Route path="/investing" component={Investing} />
      <Route path="/products" component={Products} />
      <Route path="/promotions" component={Promotions} />
      <Route path="/services" component={Services} />
      <Route path="/help" component={Help} />
      <Route path="/home" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
