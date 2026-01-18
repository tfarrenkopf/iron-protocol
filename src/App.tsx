import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ScrollToTop from "@/components/ScrollToTop";
import Dashboard from "./pages/Dashboard";
import Command from "./pages/Command";
import MissionDetail from "./pages/MissionDetail";
import WorkoutSession from "./pages/WorkoutSession";
import HIITTimer from "./pages/HIITTimer";
import Intel from "./pages/Intel";
import AuthPage from "./pages/Auth";
import ProfilePage from "./pages/Profile";
import ExerciseManager from "./pages/ExerciseManager";
import Legal from "./pages/Legal";
import Donate from "./pages/Donate";
import Guide from "./pages/Guide";
import HandlerDashboard from "./pages/HandlerDashboard";
import JoinSquad from "./pages/JoinSquad";
import AssignMission from "./pages/AssignMission";
import CampaignDetail from "./pages/CampaignDetail";
import RivalInvite from "./pages/RivalInvite";
import NotFound from "./pages/NotFound";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

const queryClient = new QueryClient();

function AppContent() {
  useGoogleAnalytics();
  
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/command" element={<Command />} />
        {/* Legacy redirects */}
        <Route path="/missions" element={<Command />} />
        <Route path="/collections" element={<Command />} />
        <Route path="/stats" element={<Intel />} />
        <Route path="/campaign/:collectionId" element={<CampaignDetail />} />
        <Route path="/mission/:missionId" element={<MissionDetail />} />
        <Route path="/workout/:missionId" element={<WorkoutSession />} />
        <Route path="/workout/assignment/:assignmentId" element={<WorkoutSession />} />
        <Route path="/hiit" element={<HIITTimer />} />
        <Route path="/exercises" element={<ExerciseManager />} />
        <Route path="/intel" element={<Intel />} />
        <Route path="/front-lines" element={<Intel />} />
        <Route path="/war-report" element={<Intel />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/handler" element={<HandlerDashboard />} />
        <Route path="/handler/assign/:squadId" element={<AssignMission />} />
        <Route path="/join/:inviteCode" element={<JoinSquad />} />
        <Route path="/rival/:rivalCode" element={<RivalInvite />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
