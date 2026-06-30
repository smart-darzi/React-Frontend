import React, { createContext, useContext, useState, useEffect } from 'react';
import { customerService, sizingService, orderService } from '../api/api';

const LocalStateContext = createContext();

export const LocalStateProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sd_master_auth');
    return saved ? JSON.parse(saved) : null;
  });
  const [customers, setCustomers] = useState([]);
  const [sizes, setSizes] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customersData, ordersData] = await Promise.all([
          customerService.getAll(),
          orderService.getAll()
        ]);

        // Map backend familyName to frontend address
        const mappedCustomers = customersData.map(c => ({
          ...c,
          address: c.familyName || ''
        }));

        setCustomers(mappedCustomers);
        setOrders(ordersData);

        // Sizes are usually fetched per customer, but we can initialize if needed
        // For now, we'll fetch size when needed or fetch all if backend supports it
      } catch (error) {
        console.error('Error fetching data from backend:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auth Simulation
  const login = (email, password) => {
    if (email === 'admin@sd.com' && password === 'admin123') {
      const user = { email, role: 'admin' };
      setCurrentUser(user);
      localStorage.setItem('sd_master_auth', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sd_master_auth');
  };

  // Customer Actions
  const addCustomer = async (data) => {
    try {
      const response = await customerService.add(data);
      const newCustomer = response.data;
      setCustomers(prev => [...prev, newCustomer]);
      return newCustomer;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id) => {
    try {
      // Find customer to get phone number (backend delete uses phone)
      const customer = customers.find(c => c._id === id);
      if (customer) {
        await customerService.delete(customer.phoneNumber);
        setCustomers(prev => prev.filter(c => c._id !== id));
        setOrders(prev => prev.filter(o => o.customerId !== id));
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  };

  // Sizing Actions
  const fetchSize = async (customerId) => {
    try {
      const data = await sizingService.get(customerId);
      if (data) {
        setSizes(prev => ({
          ...prev,
          [customerId]: data
        }));
      }
      return data;
    } catch (error) {
      console.error('Error fetching size:', error);
      // Don't throw if 404, just return null
      if (error.response?.status === 404) return null;
      throw error;
    }
  };

  const saveSize = async (customerId, sizingData) => {
    try {
      const exists = sizes[customerId];
      let response;

      if (exists) {
        response = await sizingService.update({ customerId, ...sizingData });
      } else {
        response = await sizingService.add({ customerId, ...sizingData });
      }

      const updatedData = response.updatedSize || response.size || { ...sizingData, updatedAt: new Date().toISOString() };

      setSizes(prev => ({
        ...prev,
        [customerId]: updatedData
      }));
      return updatedData;
    } catch (error) {
      console.error('Error saving size:', error);
      throw error;
    }
  };

  // Order Actions
  const addOrder = async (orderData) => {
    try {
      const response = await orderService.add(orderData);
      const newOrder = response.data;
      setOrders(prev => [...prev, newOrder]);
      return newOrder;
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await orderService.updateStatus(orderId, status);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: status } : o));
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const getStats = () => {
    return {
      totalCustomers: customers.length,
      activeOrders: orders.filter(o => o.orderStatus !== 'Completed').length,
      completedToday: orders.filter(o =>
        o.orderStatus === 'Completed' &&
        new Date(o.createdAt).toDateString() === new Date().toDateString()
      ).length
    };
  };

  return (
    <LocalStateContext.Provider value={{
      currentUser,
      customers,
      sizes,
      orders,
      loading,
      login,
      logout,
      addCustomer,
      deleteCustomer,
      fetchSize,
      saveSize,
      addOrder,
      updateOrderStatus,
      getStats
    }}>
      {children}
    </LocalStateContext.Provider>
  );
};

export const useLocalState = () => useContext(LocalStateContext);
