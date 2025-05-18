import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ResumeProvider } from "./contexts/ResumeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AppLayout } from "./components/Layout/AppLayout";
import WelcomePage from "./pages/Auth/WelcomePage";
import LoginPage from "./pages/Auth/LoginPage";
import SignupPage from "./pages/Auth/SignupPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import UploadResumePage from "./pages/Resume/UploadResumePage";

import ContactPage from "./pages/Contact/ContactPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import NotFound from "./pages/NotFound";
import JobListingsPage from "./pages/Jobs/JobListingsPage";
import AuthCallback from '@/pages/Auth/AuthCallback';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ResumeProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/upload-resume" element={<UploadResumePage />} />
                  <Route path="/job-listings" element={<JobListingsPage />} />

                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/contact" element={<ContactPage />} />
                </Route>
                
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </ResumeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
