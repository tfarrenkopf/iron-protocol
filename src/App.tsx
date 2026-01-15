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
            <Route path="/hiit" element={<HIITTimer />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/exercises" element={<ExerciseManager />} />
            <Route path="/create-mission" element={<CreateMission />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
