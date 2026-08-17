import React, { createContext, useState, useEffect } from 'react';
import { customerService, sizingService, orderService, workerService, authService, designService } from '../api/api';
import { useToast } from './ToastContext';
import { useLanguage } from './LanguageContext';

const LocalStateContext = createContext();

export const LocalStateProvider = ({ children }) => {
  const { t, tn } = useLanguage();
  // ✅ Global update popups — fired right after any successful add/update/
  // delete below, so a small confirmation toast shows up no matter which
  // page (Designs, Orders, Workers, Customers, ...) the change was made
  // from and no matter which page is currently being viewed elsewhere.
  const toastCtx = useToast();
  const notify = (message, type = 'success') => { if (toastCtx) toastCtx.showToast(message, type); };
  const toast = (en, ur, type = 'success') => notify(t(en, ur), type);
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sd_master_auth')); } catch { return null; }
  });
  // ✅ Admin's own display name — separate from the shop's "Owner Name" in
  // Settings (the logged-in admin and the shop owner aren't necessarily the
  // same field conceptually), editable from Settings → Admin Account, and
  // shown in the Topbar/AdminMenu dropdown instead of just the raw email.
  const [adminName, setAdminNameState] = useState(() => {
    try { return localStorage.getItem('sd_admin_display_name') || ''; } catch { return ''; }
  });
  const updateAdminName = (name) => {
    setAdminNameState(name);
    try { localStorage.setItem('sd_admin_display_name', name); } catch {}
  };
  const [currentWorker, setCurrentWorker] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sd_worker_auth')); } catch { return null; }
  });
  const [currentCustomer, setCurrentCustomer] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sd_customer_auth')); } catch { return null; }
  });

  const [customers, setCustomers] = useState([]);
  const [sizes,     setSizes]     = useState({});
  const [orders,    setOrders]    = useState([]);
  const [workers,   setWorkers]   = useState([]);
  const [designs,   setDesigns]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Workers who self-registered (pending approval) that the admin hasn't
  // seen a popup for yet. IDs the admin has already been shown/dismissed
  // are remembered in localStorage so they don't pop up again on refresh.
  const [pendingWorkerAlerts, setPendingWorkerAlerts] = useState([]);
  const [pendingCustomerAlerts, setPendingCustomerAlerts] = useState([]);
  const getSeenPendingWorkerIds = () => {
    try { return JSON.parse(localStorage.getItem('sd_seen_pending_workers')) || []; } catch { return []; }
  };
  const getSeenPendingCustomerIds = () => {
    try { return JSON.parse(localStorage.getItem('sd_seen_customer_portal_accounts')) || []; } catch { return []; }
  };
  const dismissWorkerAlert = (id) => {
    const seen = getSeenPendingWorkerIds();
    if (!seen.includes(id)) {
      localStorage.setItem('sd_seen_pending_workers', JSON.stringify([...seen, id]));
    }
    setPendingWorkerAlerts(prev => prev.filter(w => w._id !== id));
  };
  const dismissCustomerAlert = (id) => {
    const seen = getSeenPendingCustomerIds();
    if (!seen.includes(id)) {
      localStorage.setItem('sd_seen_customer_portal_accounts', JSON.stringify([...seen, id]));
    }
    setPendingCustomerAlerts(prev => prev.filter(c => c._id !== id));
  };

  const VALID_STATUSES = ['Pending','Active','In Progress','Completed','Received By Customer'];

  const normalizeOrder = (o) => {
    const raw = (o.orderStatus || '').trim();
    const matched = VALID_STATUSES.find(s => s.toLowerCase() === raw.toLowerCase());
    return { ...o, orderStatus: matched || 'Pending' };
  };

  useEffect(() => {
    // These lists are shared across all three portals, but they now require
    // a logged-in session (JWT) — skip the fetch entirely on public pages
    // (login, worker/customer self-registration) where no token exists yet.
    if (!localStorage.getItem('sd_auth_token')) { setLoading(false); return; }
    (async () => {
      try {
        setLoading(true);
        const [cData, oData, wData, dData] = await Promise.all([
          customerService.getAll(),
          orderService.getAll(),
          workerService.getAll(),
          designService.getAll(),
        ]);
        setCustomers(cData.map(c => ({ ...c, address: c.familyName || '' })));
        setOrders(oData.map(normalizeOrder));
        setWorkers(wData);
        setDesigns(dData);

        // Show a popup right away on login for anything the admin hasn't
        // seen/dismissed yet — including registrations that happened while
        // the admin was logged out. Previously these were silently marked
        // "seen" on load, so the admin never got notified about them at all.
        const seen = getSeenPendingWorkerIds();
        const initiallyPending = wData.filter(w => w.isApproved === false && !seen.includes(w._id));
        if (initiallyPending.length) {
          setPendingWorkerAlerts(prev => {
            const existingIds = prev.map(w => w._id);
            const toAdd = initiallyPending.filter(w => !existingIds.includes(w._id));
            return toAdd.length ? [...prev, ...toAdd] : prev;
          });
        }

        // Same for customers who already have portal access but haven't
        // been shown to the admin yet.
        const seenCustomers = getSeenPendingCustomerIds();
        const unseenWithPortalAccess = cData.filter(c => Boolean(c.email) && !seenCustomers.includes(c._id));
        if (unseenWithPortalAccess.length) {
          setPendingCustomerAlerts(prev => {
            const existingIds = prev.map(c => c._id);
            const toAdd = unseenWithPortalAccess.filter(c => !existingIds.includes(c._id));
            return toAdd.length ? [...prev, ...toAdd] : prev;
          });
        }
      } catch (e) {
        console.error('Fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // While the admin is logged in, periodically re-check for workers who
  // just self-registered and pop up an alert for any not seen before.
  useEffect(() => {
    if (!currentUser) return;
    const poll = async () => {
      try {
        const [wData, cData] = await Promise.all([
          workerService.getAll(),
          customerService.getAll(),
        ]);
        setWorkers(wData);
        setCustomers(cData.map(c => ({ ...c, address: c.familyName || '' })));

        const seen = getSeenPendingWorkerIds();
        const freshlyPending = wData.filter(w => w.isApproved === false && !seen.includes(w._id));
        if (freshlyPending.length) {
          setPendingWorkerAlerts(prev => {
            const existingIds = prev.map(w => w._id);
            const toAdd = freshlyPending.filter(w => !existingIds.includes(w._id));
            return toAdd.length ? [...prev, ...toAdd] : prev;
          });
        }

        const seenCustomers = getSeenPendingCustomerIds();
        const newlyRegisteredCustomers = cData.filter(c => Boolean(c.email) && !seenCustomers.includes(c._id));
        if (newlyRegisteredCustomers.length) {
          setPendingCustomerAlerts(prev => {
            const existingIds = prev.map(c => c._id);
            const toAdd = newlyRegisteredCustomers.filter(c => !existingIds.includes(c._id));
            return toAdd.length ? [...prev, ...toAdd] : prev;
          });
        }
      } catch (e) {
        console.error('Worker/customer poll error:', e);
      }
    };
    const interval = setInterval(poll, 20000); // check every 20s
    return () => clearInterval(interval);
  }, [currentUser]);

  /* ── Auth ──
     One shared login for everyone. The backend tells us whether the
     person is the admin, a worker, or a customer, and we store the right
     session accordingly. */
  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.token) localStorage.setItem('sd_auth_token', res.token);
    if (res.role === 'admin') {
      setCurrentUser(res.user);
      localStorage.setItem('sd_master_auth', JSON.stringify(res.user));
    } else if (res.role === 'worker') {
      setCurrentWorker(res.worker);
      localStorage.setItem('sd_worker_auth', JSON.stringify(res.worker));
    } else if (res.role === 'customer') {
      setCurrentCustomer(res.customer);
      localStorage.setItem('sd_customer_auth', JSON.stringify(res.customer));
    }
    return res;
  };
  const logout = () => { setCurrentUser(null); localStorage.removeItem('sd_master_auth'); localStorage.removeItem('sd_auth_token'); };
  const workerLogout = () => { setCurrentWorker(null); localStorage.removeItem('sd_worker_auth'); localStorage.removeItem('sd_auth_token'); };
  const customerLogout = () => { setCurrentCustomer(null); localStorage.removeItem('sd_customer_auth'); localStorage.removeItem('sd_auth_token'); };

  /* ── Customers ── */
  const addCustomer = async (data) => {
    const res = await customerService.add(data);
    const c = { ...(res.data || res), address: (res.data || res).familyName || '' };
    setCustomers(prev => [c, ...prev]);      // newest first
    toast(`Customer added: ${c.name}`, `کسٹمر شامل ہو گیا: ${tn(c.name)}`);
    return c;
  };

  const deleteCustomer = async (id) => {
    await customerService.delete(id);        // ✅ passes _id directly
    setCustomers(prev => prev.filter(c => c._id?.toString() !== id?.toString()));
    setOrders(prev => prev.filter(o => o.customerId?.toString() !== id?.toString()));
    toast('Customer deleted', 'کسٹمر حذف ہو گیا', 'info');
  };

  // Customer Portal self-signup. Unlike registerWorker, this logs the
  // customer straight in — no admin approval step — and keeps the shared
  // `customers` list in sync so the admin's Customers page also reflects
  // the new (or upgraded/linked) account right away.
  const registerCustomer = async (data) => {
    const res = await customerService.register(data);
    if (res.token) localStorage.setItem('sd_auth_token', res.token);
    const c = { ...(res.customer || res), address: (res.customer || res).familyName || '' };
    setCurrentCustomer(c);
    localStorage.setItem('sd_customer_auth', JSON.stringify(c));
    setCustomers(prev => {
      const exists = prev.some(x => x._id?.toString() === c._id?.toString());
      return exists ? prev.map(x => x._id?.toString() === c._id?.toString() ? c : x) : [c, ...prev];
    });
    toast(`Welcome, ${c.name}!`, `خوش آمدید، ${tn(c.name)}!`);
    return c;
  };

  /* ── Sizing ── */
  const fetchSize = async (customerId) => {
    try {
      const data = await sizingService.get(customerId);
      if (data) setSizes(prev => ({ ...prev, [customerId]: data }));
      return data;
    } catch (e) {
      if (e.response?.status === 404) return null;
      throw e;
    }
  };
  const saveSize = async (customerId, sizingData) => {
    const mergedPayload = { ...(sizes[customerId] || {}), ...(sizingData || {}) };
    const exists = sizes[customerId];
    const res = exists
      ? await sizingService.update({ customerId, ...mergedPayload })
      : await sizingService.add({ customerId, ...mergedPayload });
    const saved = res.updatedSize || res.size || mergedPayload;
    setSizes(prev => ({
      ...prev,
      [customerId]: { ...(prev[customerId] || {}), ...saved },
    }));
    toast('Sizing saved', 'ماپ محفوظ ہو گئی');
    return { ...(sizes[customerId] || {}), ...saved };
  };

  /* ── Orders ── */
  const addOrder = async (data) => {
    const res = await orderService.add(data);
    const o = normalizeOrder({ ...(res.order || res), createdAt: (res.order || res).createdAt || new Date().toISOString() });
    setOrders(prev => [...prev, o]);
    toast(`Order added: ${o.orderType || ''}`.trim(), `آرڈر شامل ہو گیا: ${o.orderType || ''}`.trim());
    return o;
  };
  const updateOrder = async (id, data) => {
    const res = await orderService.update(id, data);
    const updated = res.order || res;
    setOrders(prev => prev.map(o => o._id?.toString() === id?.toString() ? normalizeOrder({ ...o, ...updated }) : o));
    toast('Order updated', 'آرڈر اپڈیٹ ہو گیا');
    return updated;
  };
  const updateOrderStatus = async (id, payload) => {
    const body = typeof payload === 'string' ? { orderStatus: payload } : payload;
    const res = await orderService.updateStatus(id, body);
    const updated = res.order;
    setOrders(prev => prev.map(o =>
      o._id?.toString() === id?.toString()
        ? normalizeOrder({ ...o, ...body, ...(updated || {}) })
        : o
    ));
    toast('Order status updated', 'آرڈر کی حالت اپڈیٹ ہو گئی');
  };
  const deleteOrder = async (id) => {
    await orderService.delete(id);
    setOrders(prev => prev.filter(o => o._id?.toString() !== id?.toString()));
    toast('Order deleted', 'آرڈر حذف ہو گیا', 'info');
  };
  // Worker flags their stage as done — order's real status/stage stays put,
  // we just attach pendingCompletion so the admin sees a "worker says done"
  // banner and can confirm it themselves.
  const requestOrderCompletion = async (id, payload) => {
    const res = await orderService.requestCompletion(id, payload);
    const updated = res.order;
    setOrders(prev => prev.map(o =>
      o._id?.toString() === id?.toString() ? normalizeOrder({ ...o, ...(updated || {}) }) : o
    ));
    toast('Marked done - waiting on admin', 'مکمل بھیج دیا گیا');
    return updated;
  };
  // Worker moves their own status forward through the happy path:
  // Pending -> In-Progress -> Completed-Review -> Completed. The last step
  // also attaches pendingCompletion (handled server-side), same as before.
  const updateWorkerStatus = async (id, payload) => {
    const res = await orderService.updateWorkerStatus(id, payload);
    const updated = res.order;
    setOrders(prev => prev.map(o =>
      o._id?.toString() === id?.toString() ? normalizeOrder({ ...o, ...(updated || {}) }) : o
    ));
    toast('Status updated', 'حالت اپڈیٹ ہو گئی');
    return updated;
  };
  // Admin replies to a worker's "Blocked" note with written guidance —
  // doesn't touch orderStatus/workStage/workerStatus, just attaches a
  // message the worker can read on their own portal.
  const sendGuidance = async (id, payload) => {
    const res = await orderService.sendGuidance(id, payload);
    const updated = res.order;
    setOrders(prev => prev.map(o =>
      o._id?.toString() === id?.toString() ? normalizeOrder({ ...o, ...(updated || {}) }) : o
    ));
    toast('Guidance sent', 'رہنمائی بھیج دی گئی');
    return updated;
  };

  /* ── Workers ── */
  const addWorker = async (data) => {
    const res = await workerService.add(data);
    const w = res.worker || res;
    setWorkers(prev => [w, ...prev]);
    toast(`Worker added: ${w.name}`, `ورکر شامل ہو گیا: ${tn(w.name)}`);
    return w;
  };
  const updateWorker = async (id, data) => {
    const res = await workerService.update(id, data);
    const w = res.worker || res;
    setWorkers(prev => prev.map(x => x._id === id ? w : x));
    toast('Worker updated', 'ورکر اپڈیٹ ہو گیا');
    return w;
  };
  const deleteWorker = async (id) => {
    await workerService.delete(id);
    setWorkers(prev => prev.filter(w => w._id !== id));
    toast('Worker deleted', 'ورکر حذف ہو گیا', 'info');
  };
  // Public self-registration — creates a pending (unapproved) worker account.
  // Doesn't log the person in or touch currentWorker; they still have to
  // wait for admin approval and sign in normally afterwards.
  const registerWorker = async (data) => {
    const res = await workerService.register(data);
    toast('Registration submitted - waiting for approval', 'درخواست جمع ہو گئی');
    return res;
  };
  const approveWorker = async (id) => {
    const res = await workerService.approve(id);
    const w = res.worker || res;
    setWorkers(prev => prev.map(x => x._id === id ? w : x));
    toast(`Worker approved: ${w.name || ''}`.trim(), `ورکر منظور ہو گیا: ${tn(w.name) || ''}`.trim());
    return w;
  };

  /* ── Designs ── */
  // add/update take a plain object ({ name, description, category, price,
  // isFeatured, imageFiles, imageUrls, existingImages }) and build the
  // multipart FormData here, so pages don't have to deal with FormData
  // construction themselves.
  // - imageFiles: File[] to upload (appended, not a replacement)
  // - imageUrls: string[] of pasted image URLs to fetch+upload (appended)
  // - existingImages: on update only — {url, publicId}[] of the design's
  //   current images to KEEP; whatever's missing from this list vs. what
  //   the design had before is treated as removed. Omit entirely on add.
  const buildDesignFormData = ({ name, nameUrdu, description, descriptionUrdu, category, price, isFeatured, imageFiles, imageUrls, existingImages }) => {
    const formData = new FormData();
    if (name !== undefined) formData.append('name', name);
    if (nameUrdu !== undefined) formData.append('nameUrdu', nameUrdu);
    if (description !== undefined) formData.append('description', description);
    if (descriptionUrdu !== undefined) formData.append('descriptionUrdu', descriptionUrdu);
    if (category !== undefined) formData.append('category', category);
    if (price !== undefined) formData.append('price', price === null ? '' : price);
    if (isFeatured !== undefined) formData.append('isFeatured', String(isFeatured));
    (imageFiles || []).forEach(file => formData.append('images', file));
    if (imageUrls !== undefined) formData.append('imageUrls', JSON.stringify(imageUrls || []));
    if (existingImages !== undefined) formData.append('existingImages', JSON.stringify(existingImages || []));
    return formData;
  };
  const addDesign = async (data) => {
    const res = await designService.add(buildDesignFormData(data));
    const d = res.design || res;
    setDesigns(prev => [d, ...prev]);
    toast(`Design added: ${d.name}`, `ڈیزائن شامل ہو گیا: ${d.name}`);
    return d;
  };
  const updateDesign = async (id, data) => {
    const res = await designService.update(id, buildDesignFormData(data));
    const d = res.design || res;
    setDesigns(prev => prev.map(x => x._id === id ? d : x));
    toast('Design updated', 'ڈیزائن اپڈیٹ ہو گیا');
    return d;
  };
  const deleteDesign = async (id) => {
    await designService.delete(id);
    setDesigns(prev => prev.filter(d => d._id !== id));
    toast('Design deleted', 'ڈیزائن حذف ہو گیا', 'info');
  };
  // ✅ Backfills Urdu name/description for existing designs that don't
  // have them yet, then re-fetches the catalog so the updated translations
  // show up immediately without a manual page refresh.
  const translateMissingDesigns = async () => {
    const res = await designService.translateMissing();
    const fresh = await designService.getAll();
    setDesigns(fresh);
    notify(
      `${res.updatedCount} design(s) translated / ${res.updatedCount} ڈیزائنز ترجمہ ہو گئے`,
      'info'
    );
    return res;
  };

  /* ── Stats ── */
  const getStats = () => ({
    totalCustomers: customers.length,
    activeOrders: orders.filter(o => ['Pending','Active','In Progress'].includes(o.orderStatus)).length,
    completedToday: orders.filter(o =>
      ['Completed','Received By Customer'].includes(o.orderStatus) &&
      new Date(o.updatedAt || o.createdAt).toDateString() === new Date().toDateString()
    ).length,
    pendingOrders: orders.filter(o => o.orderStatus === 'Pending').length,
  });

  return (
    <LocalStateContext.Provider value={{
      currentUser, currentWorker, currentCustomer,
      adminName, updateAdminName,
      customers, sizes, orders, workers, designs, loading,
      login, logout, workerLogout, customerLogout,
      addCustomer, deleteCustomer, registerCustomer,
      fetchSize, saveSize,
      addOrder, updateOrder, updateOrderStatus, deleteOrder, requestOrderCompletion, updateWorkerStatus, sendGuidance,
      addWorker, updateWorker, deleteWorker,
      registerWorker, approveWorker,
      addDesign, updateDesign, deleteDesign, translateMissingDesigns,
      pendingWorkerAlerts, dismissWorkerAlert,
      pendingCustomerAlerts, dismissCustomerAlert,
      getStats,
    }}>
      {children}
    </LocalStateContext.Provider>
  );
};

export { LocalStateContext };
