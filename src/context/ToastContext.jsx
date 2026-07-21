import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

// ✅ App-wide toast/popup system — fired from LocalStateContext right after
// any successful create/update/delete (customers, orders, workers, designs,
// sizing, etc.) so a small confirmation popup shows up no matter which page
// the admin/worker/customer is on when the change happens. Lives as its own
// context (instead of inside LocalStateContext) purely so the UI piece
// (ToastViewport) can be swapped/restyled without touching data logic.
const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // type: 'success' | 'error' | 'info'
  const showToast = useCallback((message, type = 'success') => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, message, type }]);
    window.setTimeout(() => dismissToast(id), 3500);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

export { ToastContext };
