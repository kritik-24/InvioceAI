
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import DashboardLayout from "./components/layout/DashboardLayout";

import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/dashboard/Profile";

import CreateInvoice from "./pages/invoice/CreateInvoice";
import Invoices from "./pages/invoice/Invoices";
import InvoiceDetails from "./pages/invoice/InvoiceDetails";
import EditInvoice from "./pages/invoice/EditInvoice";

import Clients from "./pages/clients/Clients";
import CreateClient from "./pages/clients/CreateClient";
import EditClient from "./pages/clients/EditClient";
import ClientDetails from "./pages/clients/ClientDetails";

import AIAssistant from "./pages/ai/AIAssistant";

function App() {
  return (
    <>
      <Routes>
        {/* =====================================
            PUBLIC AUTH ROUTES
        ===================================== */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        {/* =====================================
            PROTECTED APPLICATION ROUTES
        ===================================== */}

        <Route
          element={<DashboardLayout />}
        >
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/invoices"
            element={<Invoices />}
          />

          <Route
            path="/invoices/create"
            element={<CreateInvoice />}
          />

          <Route
            path="/invoices/:id/edit"
            element={<EditInvoice />}
          />

          <Route
            path="/invoices/:id"
            element={<InvoiceDetails />}
          />

          <Route
            path="/clients"
            element={<Clients />}
          />

          <Route
            path="/clients/create"
            element={<CreateClient />}
          />

          <Route
            path="/clients/:id/edit"
            element={<EditClient />}
          />

          <Route
            path="/clients/:id"
            element={<ClientDetails />}
          />

          <Route
            path="/ai-assistant"
            element={<AIAssistant />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />
        </Route>
      </Routes>

      {/* =====================================
          GLOBAL TOASTS
      ===================================== */}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
}

export default App;