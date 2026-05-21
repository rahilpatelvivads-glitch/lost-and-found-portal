/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import LostItems from "./pages/LostItems";
import FoundItems from "./pages/FoundItems";
import ReportItem from "./pages/ReportItem";
import Claims from "./pages/Claims";
import ReturnedItems from "./pages/ReturnedItems";
import SearchResults from "./pages/SearchResults";
import SmartSearch from "./pages/SmartSearch";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import MyReports from "./pages/MyReports";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  if (!session) return <Navigate to="/auth" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/lost" element={<LostItems />} />
            <Route path="/found" element={<FoundItems />} />
            <Route path="/returned-items" element={<ReturnedItems />} />
            <Route path="/search-results" element={<SearchResults />} />
            <Route path="/smart-search" element={<SmartSearch />} />
            <Route 
              path="/profile" 
              element={<ProtectedRoute><Profile /></ProtectedRoute>} 
            />
            <Route 
              path="/my-reports" 
              element={<ProtectedRoute><MyReports /></ProtectedRoute>} 
            />
            <Route 
              path="/settings" 
              element={<ProtectedRoute><Settings /></ProtectedRoute>} 
            />
            <Route 
              path="/notifications" 
              element={<ProtectedRoute><Notifications /></ProtectedRoute>} 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/report" 
              element={<ProtectedRoute><ReportItem /></ProtectedRoute>} 
            />
             <Route 
              path="/report/:type" 
              element={<ProtectedRoute><ReportItem /></ProtectedRoute>} 
            />
            <Route 
              path="/claims" 
              element={<ProtectedRoute><Claims /></ProtectedRoute>} 
            />
            <Route 
              path="/admin" 
              element={<ProtectedRoute><Admin /></ProtectedRoute>} 
            />
            
            {/* Static Content placeholders */}
            <Route path="/about" element={<div className="py-20 text-center"><h1 className="text-4xl font-bold">About Us</h1><p className="mt-4 text-slate-500">Connecting campus through technology.</p></div>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}
