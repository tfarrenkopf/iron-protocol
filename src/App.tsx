import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import MissionSelect from "./pages/MissionSelect";
import WorkoutSession from "./pages/WorkoutSession";
import HIITTimer from "./pages/HIITTimer";
import Stats from "./pages/Stats";
import AuthPage from "./pages/Auth";
import ProfilePage from "./pages/Profile";
import ExerciseManager from "./pages/ExerciseManager";
import CreateMission from "./pages/CreateMission";
import FrontLines from "./pages/FrontLines";
import Legal from "./pages/Legal";
import Donate from "./pages/Donate";
import HandlerDashboard from "./pages/HandlerDashboard";
import JoinSquad from "./pages/JoinSquad";
import AssignMission from "./pages/AssignMission";
import AssignmentWorkout from "./pages/AssignmentWorkout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/missions" element={<MissionSelect />} />
            <Route path="/workout/:missionId" element={<WorkoutSession />} />
            <Route path="/workout/assignment/:assignmentId" element={<AssignmentWorkout />} />
            <Route path="/hiit" element={<HIITTimer />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/exercises" element={<ExerciseManager />} />
            <Route path="/create-mission" element={<CreateMission />} />
            <Route path="/front-lines" element={<FrontLines />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/handler" element={<HandlerDashboard />} />
            <Route path="/handler/assign/:squadId" element={<AssignMission />} />
            <Route path="/join/:inviteCode" element={<JoinSquad />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
