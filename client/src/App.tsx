import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import GDPR from "@/pages/gdpr";
import Pricing from "@/pages/pricing";
import AdminPanel from "@/pages/admin";
import AdminSecurityPage from "@/pages/admin-security";
import CookieBanner from "@/components/CookieBanner";
import SecurityDetection from "@/components/SecurityDetection";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/landing" component={Landing} />
      <Route path="/" component={Landing} />
      <ProtectedRoute path="/home" component={Home} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/gdpr" component={GDPR} />
      <ProtectedRoute path="/admin" component={AdminPanel} />
      <ProtectedRoute path="/admin/security" component={AdminSecurityPage} />
      <Route path="/pricing" component={Pricing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-slate-900 text-slate-50">
            <Toaster />
            <SecurityDetection />
            <Router />
            <CookieBanner />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
