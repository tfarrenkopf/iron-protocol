import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ScrollToTop from "@/components/ScrollToTop";
import Dashboard from "./pages/Dashboard";
import MissionSelect from "./pages/MissionSelect";
import MissionDetail from "./pages/MissionDetail";
import WorkoutSession from "./pages/WorkoutSession";
import HIITTimer from "./pages/HIITTimer";
import Stats from "./pages/Stats";
import AuthPage from "./pages/Auth";
import ProfilePage from "./pages/Profile";
import ExerciseManager from "./pages/ExerciseManager";
import FrontLines from "./pages/FrontLines";
import Legal from "./pages/Legal";
import Donate from "./pages/Donate";
import Guide from "./pages/Guide";
import HandlerDashboard from "./pages/HandlerDashboard";
import JoinSquad from "./pages/JoinSquad";
import AssignMission from "./pages/AssignMission";
import AssignmentWorkout from "./pages/AssignmentWorkout";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import { useTimeTracking } from "@/hooks/useTimeTracking";

const queryClient = new QueryClient();

function AppContent() {
  useTimeTracking();
  
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/missions" element={<MissionSelect />} />
        <Route path="/mission/:missionId" element={<MissionDetail />} />
        <Route path="/workout/:missionId" element={<WorkoutSession />} />
        <Route path="/workout/assignment/:assignmentId" element={<AssignmentWorkout />} />
        <Route path="/hiit" element={<HIITTimer />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/exercises" element={<ExerciseManager />} />
        <Route path="/front-lines" element={<FrontLines />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/handler" element={<HandlerDashboard />} />
        <Route path="/handler/assign/:squadId" element={<AssignMission />} />
        <Route path="/join/:inviteCode" element={<JoinSquad />} />
        <Route path="/x7k9m2" element={<Analytics />} />
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
