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

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/my-assessments"} component={MyAssessments} />
      <Route path={"/company-assessments"} component={CompanyAssessmentsList} />
      <Route path={"/company-setup"} component={CompanySetup} />
      <Route path={"/respondent-selection"} component={RespondentSelection} />
      <Route path={"/assessment"} component={Assessment} />
      <Route path={"/assessment-admin"} component={AssessmentAdmin} />
      <Route path={"/respondent"} component={RespondentAccess} />
      <Route path={"/respondent-links"} component={RespondentLinksGeneration} />
      <Route path={"/admin"} component={AssessmentAdmin} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

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
