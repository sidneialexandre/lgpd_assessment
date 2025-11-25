import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Assessment from "./pages/Assessment";
import CompanySetup from "./pages/CompanySetup";
import RespondentSelection from "./pages/RespondentSelection";
import AssessmentAdmin from "./pages/AssessmentAdmin";
import RespondentAccess from "./pages/RespondentAccess";
import MyAssessments from "./pages/MyAssessments";
import CompanyAssessmentsList from "./pages/CompanyAssessmentsList";
import RespondentLinksGeneration from "./pages/RespondentLinksGeneration";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Protected route component for authenticated users only
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-red-900 mb-4">Acesso Restrito</h2>
            <p className="text-red-800 mb-4">Você precisa estar autenticado para acessar esta página.</p>
            <Button
              onClick={() => window.location.href = "/"}
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Component />;
}

// Admin-only route component
function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-red-900 mb-4">Acesso Restrito</h2>
            <p className="text-red-800 mb-4">Você precisa estar autenticado para acessar esta página.</p>
            <Button
              onClick={() => window.location.href = "/"}
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-red-900 mb-4">Acesso Negado</h2>
            <p className="text-red-800 mb-4">Você não tem permissão para acessar esta página. Apenas administradores podem acessar.</p>
            <Button
              onClick={() => window.location.href = "/"}
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Component />;
}

// Respondent-only route component (for assessment page)
function RespondentRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Assessment page is accessible to both authenticated respondents and public access via token
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path={"/"} component={Home} />
      <Route path={"/respondent"} component={RespondentAccess} />
      <Route path={"/assessment"} component={() => <RespondentRoute component={Assessment} />} />
      
      {/* Protected routes - require authentication */}
      <Route path={"/my-assessments"} component={() => <ProtectedRoute component={MyAssessments} />} />
      
      {/* Admin-only routes */}
      <Route path={"/company-assessments"} component={() => <AdminRoute component={CompanyAssessmentsList} />} />
      <Route path={"/company-setup"} component={() => <AdminRoute component={CompanySetup} />} />
      <Route path={"/respondent-selection"} component={() => <AdminRoute component={RespondentSelection} />} />
      <Route path={"/assessment-admin"} component={() => <AdminRoute component={AssessmentAdmin} />} />
      <Route path={"/respondent-links"} component={() => <AdminRoute component={RespondentLinksGeneration} />} />
      <Route path={"/admin"} component={() => <AdminRoute component={AssessmentAdmin} />} />
      
      {/* Error routes */}
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
