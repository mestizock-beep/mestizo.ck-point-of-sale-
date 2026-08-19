import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import POSView from './components/POSView';
import InventoryView from './components/InventoryView';
import CorteCajaView from './components/CorteCajaView';
import TableManagementView from './components/TableManagementView';
import KitchenDisplayView from './components/KitchenDisplayView';
import BarDisplayView from './components/BarDisplayView';
import PaymentModal from './components/PaymentModal';
import TicketModal from './components/TicketModal';
import PrinterSettingsModal from './components/PrinterSettingsModal';
import LowStockModal from './components/LowStockModal';
import LoginView from './components/LoginView';
import SettingsModal from './components/SettingsModal';
import ReportsView from './components/ReportsView';
import AIAdvisorView from './components/AIAdvisorView';
import AICopilotWidget from './components/AICopilotWidget';

import {
  initStorage,
  getProducts,
  saveProducts,
  getInsumos,
  saveInsumos,
  updateInsumoStock,
  addSale,
  getSales,
  getCurrentShift,
  openShift,
  closeShift,
  getShiftHistory,
  getPrinterSettings,
  savePrinterSettings,
  resetToOfficialMenu,
  getTableOrders,
  saveTableOrders
} from './utils/storage';
import { INITIAL_CATEGORIES } from './utils/initialData';
import { supabase, isSupabaseConfigured, signInWithEmail, signUpWithEmail, signOutUser } from './utils/supabaseClient';

const USER_SESSION_KEY = 'mestizo_pos_user_session';

export default function App() {
  const [activeTab, setActiveTab] = useState('tables');
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Storage state
  const [products, setProducts] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [sales, setSales] = useState([]);
  const [cart, setCart] = useState([]);
  const [tables, setTables] = useState([]);
  const [currentShift, setCurrentShift] = useState(null);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [printerSettings, setPrinterSettings] = useState({});

  // Active Modals state
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [ticketSale, setTicketSale] = useState(null);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    initStorage().then(() => {
      refreshAllData();
    });

    // Cross-tab / Window live synchronization
    const handleStorageUpdate = () => {
      refreshAllData();
    };

    window.addEventListener('mestizo_pos_storage_update', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    // Check stored user session
    const savedUser = localStorage.getItem(USER_SESSION_KEY);
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem(USER_SESSION_KEY);
      }
    }

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          const userMeta = session.user.user_metadata || {};
          const userObj = {
            email: session.user.email,
            fullName: userMeta.fullName || session.user.email.split('@')[0],
            role: userMeta.role || 'admin'
          };
          setCurrentUser(userObj);
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userObj));
        }
        setCheckingAuth(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session && session.user) {
          const userMeta = session.user.user_metadata || {};
          const userObj = {
            email: session.user.email,
            fullName: userMeta.fullName || session.user.email.split('@')[0],
            role: userMeta.role || 'admin'
          };
          setCurrentUser(userObj);
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userObj));
        }
      });

      return () => {
        subscription.unsubscribe();
        window.removeEventListener('mestizo_pos_storage_update', handleStorageUpdate);
        window.removeEventListener('storage', handleStorageUpdate);
      };
    } else {
      setCheckingAuth(false);
      return () => {
        window.removeEventListener('mestizo_pos_storage_update', handleStorageUpdate);
        window.removeEventListener('storage', handleStorageUpdate);
      };
    }
  }, []);

  const refreshAllData = () => {
    setProducts(getProducts());
    setInsumos(getInsumos());
    setSales(getSales());
    setTables(getTableOrders());
    setCurrentShift(getCurrentShift());
    setShiftHistory(getShiftHistory());
    setPrinterSettings(getPrinterSettings());
  };

  const handleSaveTables = (newTables) => {
    setTables(newTables);
    saveTableOrders(newTables);
  };

  const handleLoginSuccess = async (credentials) => {
    if (!credentials.email || !credentials.password) {
      return { error: 'Por favor ingresa tu correo y contraseña.' };
    }

    if (credentials.password.length < 6) {
      return { error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    // Check registered team users list
    let registeredTeam = [
      { email: 'usiel@restaurantemestizo.com', fullName: 'Usiel Chi (Dueño)', password: 'Mestizo2026!', role: 'admin' },
      { email: 'roberto@restaurantemestizo.com', fullName: 'Roberto Chi', password: 'RobertoChi123@', role: 'cajero' },
      { email: 'cajero@restaurantemestizo.com', fullName: 'Cajero de Turno', password: 'Caja123456', role: 'cajero' }
    ];
    try {
      const stored = localStorage.getItem('mestizo_pos_team_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          registeredTeam = parsed;
        }
      }
    } catch (e) {}

    const matchedUser = registeredTeam.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await signInWithEmail(credentials.email, credentials.password);
        
        if (error) {
          if (error.message && error.message.toLowerCase().includes('api key')) {
            // Local check if password matches matchedUser or admin default
            if (matchedUser && matchedUser.password && matchedUser.password !== credentials.password) {
              return { error: 'Contraseña incorrecta. Inténtalo de nuevo.' };
            }
            const userRole = matchedUser ? matchedUser.role : (credentials.email.includes('admin') || credentials.email.includes('usiel') ? 'admin' : 'cajero');
            const userObj = {
              email: credentials.email,
              fullName: matchedUser ? matchedUser.fullName : credentials.email.split('@')[0],
              role: userRole
            };
            setCurrentUser(userObj);
            localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userObj));
            return { success: true };
          }
          return { error: error.message || 'Credenciales incorrectas. Verifica tu contraseña.' };
        }

        const userMeta = (data && data.user && data.user.user_metadata) || {};
        const userObj = {
          email: credentials.email,
          fullName: matchedUser ? matchedUser.fullName : (userMeta.fullName || credentials.email.split('@')[0]),
          role: matchedUser ? matchedUser.role : (userMeta.role || 'admin')
        };
        setCurrentUser(userObj);
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userObj));
        return { success: true };
      } catch (err) {
        return { error: err.message || 'Error de conexión al verificar credenciales.' };
      }
    } else {
      // Local auth validation
      if (matchedUser && matchedUser.password && matchedUser.password !== credentials.password) {
        return { error: 'Contraseña incorrecta. Inténtalo de nuevo.' };
      }

      const userRole = matchedUser ? matchedUser.role : (credentials.email.includes('admin') || credentials.email.includes('usiel') ? 'admin' : 'cajero');
      const userObj = {
        email: credentials.email,
        fullName: matchedUser ? matchedUser.fullName : credentials.email.split('@')[0],
        role: userRole
      };
      setCurrentUser(userObj);
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userObj));
      return { success: true };
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await signOutUser();
    }
    setCurrentUser(null);
    localStorage.removeItem(USER_SESSION_KEY);
    setActiveTab('pos');
  };

  // Low stock count based on raw insumos
  const lowStockCount = insumos.filter(i => i.stock <= i.minStock).length;

  // Checkout Handlers
  const handleOpenCheckout = (orderCalculations) => {
    setCheckoutOrder(orderCalculations);
  };

  const handleCompleteSale = (salePayload) => {
    const { newSale, updatedInsumos } = addSale(salePayload);
    setSales(getSales());
    setInsumos(updatedInsumos);
    setCurrentShift(getCurrentShift());
    setCart([]);
    setCheckoutOrder(null);
    setTicketSale(newSale);

    // If the sale was for a Table, automatically free the table!
    if (salePayload.tableNumber) {
      const resetTable = {
        id: salePayload.tableNumber,
        tableNumber: salePayload.tableNumber,
        name: `Mesa ${salePayload.tableNumber}`,
        status: 'free',
        waiterName: '',
        items: [],
        notes: '',
        createdAt: null,
        updatedAt: null
      };
      const updatedTables = tables.map(t => t.tableNumber === salePayload.tableNumber ? resetTable : t);
      handleSaveTables(updatedTables);
    }
  };

  // Product & Photo Handlers
  const handleSaveProduct = (productData) => {
    const existing = products.find(p => p.id === productData.id);
    let updated;
    if (existing) {
      updated = products.map(p => p.id === productData.id ? productData : p);
    } else {
      updated = [productData, ...products];
    }
    saveProducts(updated);
    setProducts(updated);
  };

  const handleDeleteProduct = (productId) => {
    const updated = products.filter(p => p.id !== productId);
    saveProducts(updated);
    setProducts(updated);
  };

  // Insumo Handlers
  const handleSaveInsumo = (insumoData) => {
    const existing = insumos.find(i => i.id === insumoData.id);
    let updated;
    if (existing) {
      updated = insumos.map(i => i.id === insumoData.id ? insumoData : i);
    } else {
      updated = [insumoData, ...insumos];
    }
    saveInsumos(updated);
    setInsumos(updated);
  };

  const handleDeleteInsumo = (insumoId) => {
    const updated = insumos.filter(i => i.id !== insumoId);
    saveInsumos(updated);
    setInsumos(updated);
  };

  const handleQuickRestockInsumo = (insumoId, addQty) => {
    const updated = updateInsumoStock(insumoId, addQty);
    setInsumos(updated);
  };

  // Product Recipe Handler
  const handleSaveProductRecipe = (productId, recipe) => {
    const updated = products.map(p => p.id === productId ? { ...p, recipe } : p);
    saveProducts(updated);
    setProducts(updated);
  };

  // Reset Official Menu Handler
  const handleResetOfficialMenu = () => {
    const { products: p, insumos: i } = resetToOfficialMenu();
    setProducts(p);
    setInsumos(i);
  };

  // Shift Handlers
  const handleOpenShift = (initialCash, cashierName) => {
    const shift = openShift(initialCash, cashierName || (currentUser ? currentUser.fullName : 'Cajero Turno'));
    setCurrentShift(shift);
    setActiveTab('pos');
    return shift;
  };

  const handleCloseShift = (actualCash, notes) => {
    const closed = closeShift(actualCash, notes);
    refreshAllData();
    return closed;
  };

  // Printer Settings Handler
  const handleSavePrinterSettings = (newSettings) => {
    savePrinterSettings(newSettings);
    setPrinterSettings(newSettings);
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--sand-bg)' }}>
        <p style={{ fontWeight: 600, color: 'var(--terracotta)' }}>Verificando sesión segura de Mestizo POS...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentShift={currentShift}
        lowStockCount={lowStockCount}
        onOpenPrinterSettings={() => setShowPrinterSettings(true)}
        onOpenLowStockModal={() => setShowLowStockModal(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Main Tab Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'pos' && (
          <POSView
            products={products}
            insumos={insumos}
            categories={INITIAL_CATEGORIES}
            cart={cart}
            setCart={setCart}
            onOpenCheckout={handleOpenCheckout}
            currentShift={currentShift}
            currentUser={currentUser}
            tables={tables}
            onSelectTableForCheckout={(table) => {
              const subtotal = table.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              handleOpenCheckout({
                tableNumber: table.tableNumber,
                waiterName: table.waiterName || '',
                cart: table.items,
                subtotal,
                discountPercent: 0,
                discountAmount: 0,
                tipPercent: 0,
                tipAmount: 0,
                total: subtotal
              });
            }}
          />
        )}

        {activeTab === 'tables' && (
          <TableManagementView
            tables={tables}
            setTables={handleSaveTables}
            products={products}
            insumos={insumos}
            categories={INITIAL_CATEGORIES}
            currentUser={currentUser}
            onSendToCheckout={(orderData) => {
              setCheckoutOrder(orderData);
              setActiveTab('pos');
            }}
          />
        )}

        {activeTab === 'kitchen' && (
          <KitchenDisplayView />
        )}

        {activeTab === 'bar' && (
          <BarDisplayView />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            insumos={insumos}
            products={products}
            categories={INITIAL_CATEGORIES}
            onSaveInsumo={handleSaveInsumo}
            onDeleteInsumo={handleDeleteInsumo}
            onQuickRestockInsumo={handleQuickRestockInsumo}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onSaveProductRecipe={handleSaveProductRecipe}
            onResetOfficialMenu={handleResetOfficialMenu}
          />
        )}

        {activeTab === 'corte' && (
          <CorteCajaView
            currentShift={currentShift}
            shiftHistory={shiftHistory}
            onOpenShift={handleOpenShift}
            onCloseShift={handleCloseShift}
            onNavigateToPOS={() => setActiveTab('pos')}
            onNavigateToTables={() => setActiveTab('tables')}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            salesHistory={sales}
            shiftHistory={shiftHistory}
            products={products}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'ai' && (
          <AIAdvisorView
            products={products}
            insumos={insumos}
            sales={sales}
            shiftHistory={shiftHistory}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onOpenSettings={() => setShowSettingsModal(true)}
            onRefreshData={refreshAllData}
          />
        )}
      </main>

      {/* Floating Copilot Widget */}
      <AICopilotWidget onOpenFullAIView={() => setActiveTab('ai')} />

      {/* MODALS */}
      {checkoutOrder && (
        <PaymentModal
          orderData={checkoutOrder}
          onClose={() => setCheckoutOrder(null)}
          onCompleteSale={handleCompleteSale}
        />
      )}

      {ticketSale && (
        <TicketModal
          saleData={ticketSale}
          printerSettings={printerSettings}
          onClose={() => setTicketSale(null)}
          onNewSale={() => {
            setTicketSale(null);
            setActiveTab('pos');
          }}
        />
      )}

      {showPrinterSettings && (
        <PrinterSettingsModal
          settings={printerSettings}
          onSave={handleSavePrinterSettings}
          onClose={() => setShowPrinterSettings(false)}
        />
      )}

      {showLowStockModal && (
        <LowStockModal
          products={insumos}
          onClose={() => setShowLowStockModal(false)}
          onGoToInventory={() => setActiveTab('inventory')}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          currentUser={currentUser}
          printerSettings={printerSettings}
          onSavePrinterSettings={handleSavePrinterSettings}
          onLogout={handleLogout}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

    </div>
  );
}
