import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CacheProvider } from "@/components/CacheProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import AccountsSettings from "./pages/settings/AccountsSettings";
import CategoriesSettings from "./pages/settings/CategoriesSettings";
import TagsSettings from "./pages/settings/TagsSettings";
import TemplatesSettings from "./pages/settings/TemplatesSettings";
import FiltersSettings from "./pages/settings/FiltersSettings";
import ProfileSettings from "./pages/settings/ProfileSettings";
import NotificationsSettings from "./pages/settings/NotificationsSettings";
import Records from "./pages/Records";
import Inventory from "./pages/Inventory";
import Statistics from "./pages/Statistics";
import ProductStatistics from "./pages/ProductStatistics";
import Contacts from "./pages/Contacts";
import Debts from "./pages/Debts";
import ScheduledPayments from "./pages/ScheduledPayments";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CacheProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/accounts" element={<AccountsSettings />} />
              <Route path="/settings/categories" element={<CategoriesSettings />} />
              <Route path="/settings/tags" element={<TagsSettings />} />
              <Route path="/settings/templates" element={<TemplatesSettings />} />
              <Route path="/settings/filters" element={<FiltersSettings />} />
              <Route path="/settings/profile" element={<ProfileSettings />} />
              <Route path="/settings/notifications" element={<NotificationsSettings />} />
              <Route path="/records" element={<Records />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/statistics/products" element={<ProductStatistics />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/debts" element={<Debts />} />
              <Route path="/scheduled-payments" element={<ScheduledPayments />} />
              <Route path="/notifications" element={<Notifications />} />
              {/* Catch all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CacheProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
