import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LocalStateProvider, useLocalState } from './context/LocalStateContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddCustomer from './pages/AddCustomer';
import ViewCustomers from './pages/ViewCustomers';
import CustomerProfile from './pages/CustomerProfile';
import AddOrder from './pages/AddOrder';
import ViewOrders from './pages/ViewOrders';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useLocalState();
  const savedUser = localStorage.getItem('sd_master_auth');
  
  if (!currentUser && !savedUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <LocalStateProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
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
        </Routes>
      </Router>
    </LocalStateProvider>
  );
}

export default App;
