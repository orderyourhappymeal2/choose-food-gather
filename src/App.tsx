import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import SuperUser from "./pages/SuperUser";
import FoodCategories from "./pages/FoodCategories";
import MenuSelection from "./pages/MenuSelection";
import OrderSummary from "./pages/OrderSummary";
import ThankYou from "./pages/ThankYou";
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
            <Route path="/" element={<Welcome />} />
            <Route path="/admin-login" element={<Login />} />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="user">
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/super-user" element={
              <ProtectedRoute requiredRole="admin">
                <SuperUser />
              </ProtectedRoute>
            } />
            <Route path="/food-categories" element={
              <ProtectedRoute>
                <FoodCategories />
              </ProtectedRoute>
            } />
            <Route path="/menu/:restaurantId" element={
              <ProtectedRoute>
                <MenuSelection />
              </ProtectedRoute>
            } />
            <Route path="/order-summary" element={
              <ProtectedRoute>
                <OrderSummary />
              </ProtectedRoute>
            } />
            <Route path="/thank-you" element={
              <ProtectedRoute>
                <ThankYou />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
