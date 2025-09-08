import "./global.css";

import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DevErrorBoundary from "@/components/DevErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MySQLVehiclesOriginalStyle from "./pages/MySQLVehiclesOriginalStyle";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Global handler to avoid unhandled promise rejection noise during background fetches
  useEffect(() => {
    const onUnhandled = (e: PromiseRejectionEvent) => {
      console.warn('Unhandled promise rejection captured:', e.reason);
      // prevent default devtools noisy logging
      try {
        e.preventDefault();
      } catch {}
    };
    window.addEventListener('unhandledrejection', onUnhandled);
    return () => window.removeEventListener('unhandledrejection', onUnhandled);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DevErrorBoundary>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MySQLVehiclesOriginalStyle />} />
              <Route
                path="/cars-for-sale/*"
                element={<MySQLVehiclesOriginalStyle />}
              />
              <Route
                path="/mysql-vehicles"
                element={<MySQLVehiclesOriginalStyle />}
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DevErrorBoundary>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
