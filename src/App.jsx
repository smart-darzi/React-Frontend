import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LocalStateProvider } from './context/LocalStateContext';
import { useLocalState } from './context/useLocalState';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import ToastViewport from './components/ToastViewport';
import Layout from './components/Layout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AddCustomer from './pages/AddCustomer';
import ViewCustomers from './pages/ViewCustomers';
import CustomerProfile from './pages/CustomerProfile';
import AddOrder from './pages/AddOrder';
import ViewOrders from './pages/ViewOrders';
import Workers from './pages/Workers';
import WorkerHistory from './pages/WorkerHistory';
import Designs from './pages/Designs';
import Settings from './pages/Settings';
import WorkerPortal from './pages/WorkerPortal';
import WorkerRegister from './pages/WorkerRegister';
import CustomerRegister from './pages/CustomerRegister';
import CustomerPortal from './pages/CustomerPortal';
import OrderDetail from './pages/OrderDetail';
import WorkerDetail from './pages/WorkerDetail';

// Only the admin can reach the admin dashboard routes.
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useLocalState();
  const savedUser = localStorage.getItem('sd_master_auth');

  if (!currentUser && !savedUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Only a logged-in worker can reach their portal.
const WorkerProtectedRoute = ({ children }) => {
  const { currentWorker } = useLocalState();
  const savedWorker = localStorage.getItem('sd_worker_auth');

  if (!currentWorker && !savedWorker) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Only a logged-in customer can reach their portal.
const CustomerProtectedRoute = ({ children }) => {
  const { currentCustomer } = useLocalState();
  const savedCustomer = localStorage.getItem('sd_customer_auth');

  if (!currentCustomer && !savedCustomer) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Order Detail is reachable from all three Work History tables (Admin's
// Workers page, a worker's own portal, a customer's portal), so it accepts
// whichever role is actually logged in rather than assuming Admin.
const AnyProtectedRoute = ({ children }) => {
  const { currentUser, currentWorker, currentCustomer } = useLocalState();
  const loggedIn =
    currentUser || localStorage.getItem('sd_master_auth') ||
    currentWorker || localStorage.getItem('sd_worker_auth') ||
    currentCustomer || localStorage.getItem('sd_customer_auth');

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <LanguageProvider>
    <ToastProvider>
      <LocalStateProvider>
      <ToastViewport />
      <Router>
        <Routes>
          {/* One shared login page for everyone — admin and workers. */}
          <Route path="/login" element={<Login />} />
          {/* Public — worker/customer self-service password reset. */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Public — workers can create their own (pending-approval) account. */}
          <Route path="/register" element={<WorkerRegister />} />
          {/* Public — customers can create their own account (no approval needed). */}
          <Route path="/customer-register" element={<CustomerRegister />} />

          <Route path="/worker-portal" element={
            <WorkerProtectedRoute>
              <WorkerPortal />
            </WorkerProtectedRoute>
          } />
          <Route path="/customer-portal" element={
            <CustomerProtectedRoute>
              <CustomerPortal />
            </CustomerProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/add-customer" element={
            <ProtectedRoute>
              <Layout><AddCustomer /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/view-customers" element={
            <ProtectedRoute>
              <Layout><ViewCustomers /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/customer/:id" element={
            <ProtectedRoute>
              <Layout><CustomerProfile /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/add-order" element={
            <ProtectedRoute>
              <Layout><AddOrder /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/view-orders" element={
            <ProtectedRoute>
              <Layout><ViewOrders /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/workers" element={
            <ProtectedRoute>
              <Layout><Workers /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/worker/:id" element={
            <ProtectedRoute>
              <Layout><WorkerDetail /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/workers/history" element={
            <ProtectedRoute>
              <Layout><WorkerHistory /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/designs" element={
            <ProtectedRoute>
              <Layout><Designs /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout><Settings /></Layout>
            </ProtectedRoute>
          } />
          {/* Shared order detail page — Admin gets it inside <Layout> itself
              (see OrderDetail.jsx), so it isn't wrapped here. */}
          <Route path="/order/:id" element={
            <AnyProtectedRoute>
              <OrderDetail />
            </AnyProtectedRoute>
          } />

          {/* Anything unknown falls back to the single login page. */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      </LocalStateProvider>
    </ToastProvider>
    </LanguageProvider>
  );
}

export default App;
