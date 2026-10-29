import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/lib/user-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { DashboardProvider } from "@/lib/dashboard-context";
import { ExpensesProvider } from "@/lib/expenses-context";
import { ReportsProvider } from "@/lib/reports-context";
import { SyncProvider } from "@/lib/sync-status";
import { BadgeProvider } from "@/lib/badge-sync";
import { MonthEndPrompt } from "@/components/reports/MonthEndPrompt";
import { pageTransition } from "@/lib/motion";
import Dashboard from "./pages/Dashboard.tsx";
import Login from "./pages/Login.tsx";
import Expenses from "./pages/Expenses.tsx";
import NotFound from "./pages/NotFound.tsx";
import Settings from "./pages/Settings.tsx";
import Widget from "./pages/Widget.tsx";
import { Layout, ProtectedRoute } from "./components/Layout.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Firestore listeners already push updates; refetching on focus only
      // causes flicker.
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

/** Wraps each route so navigation cross-fades instead of hard-cutting. */
const Page = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    variants={pageTransition}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="flex flex-1 flex-col"
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Page><Login /></Page>} />

        {/*
          The widget is chrome-free on purpose: it is a home-screen tile, so
          it sits outside the shared Layout and renders no nav or footer.
        */}
        <Route
          path="/widget"
          element={<ProtectedRoute><Page><Widget /></Page></ProtectedRoute>}
        />
        {/* Each view is its own URL so it can be a separate home-screen tile. */}
        <Route
          path="/widget/:view"
          element={<ProtectedRoute><Page><Widget /></Page></ProtectedRoute>}
        />

        {/* Protected routes wrapped in the global layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Page><Dashboard /></Page>} />
          <Route path="/expenses" element={<Page><Expenses /></Page>} />
          <Route path="/settings" element={<Page><Settings /></Page>} />
        </Route>

        <Route path="*" element={<Page><NotFound /></Page>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={200}>
      <Toaster />
      <UserProvider>
        <SyncProvider>
          <CurrencyProvider>
            <DashboardProvider>
              <ExpensesProvider>
                <BadgeProvider>
                  <ReportsProvider>
                    <BrowserRouter>
                      <AnimatedRoutes />
                      <MonthEndPrompt />
                    </BrowserRouter>
                  </ReportsProvider>
                </BadgeProvider>
              </ExpensesProvider>
            </DashboardProvider>
          </CurrencyProvider>
        </SyncProvider>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
