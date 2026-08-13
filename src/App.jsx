import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import POSView from './components/POSView';
import InventoryView from './components/InventoryView';
import CorteCajaView from './components/CorteCajaView';
import PaymentModal from './components/PaymentModal';
import TicketModal from './components/TicketModal';
import PrinterSettingsModal from './components/PrinterSettingsModal';
import LowStockModal from './components/LowStockModal';

import {
  initStorage,
  getProducts,
  saveProducts,
  getInsumos,
  saveInsumos,
  updateInsumoStock,
  addSale,
  getCurrentShift,
  openShift,
  closeShift,
  getShiftHistory,
  getPrinterSettings,
  savePrinterSettings,
  resetToOfficialMenu
} from './utils/storage';
import { INITIAL_CATEGORIES } from './utils/initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');
  
  // Storage state
  const [products, setProducts] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [cart, setCart] = useState([]);
  const [currentShift, setCurrentShift] = useState(null);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [printerSettings, setPrinterSettings] = useState({});

  // Active Modals state
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [ticketSale, setTicketSale] = useState(null);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  useEffect(() => {
    initStorage();
    refreshAllData();
  }, []);

  const refreshAllData = () => {
    setProducts(getProducts());
    setInsumos(getInsumos());
    setCurrentShift(getCurrentShift());
    setShiftHistory(getShiftHistory());
    setPrinterSettings(getPrinterSettings());
  };

  // Low stock count based on raw insumos
  const lowStockCount = insumos.filter(i => i.stock <= i.minStock).length;

  // Checkout Handlers
  const handleOpenCheckout = (orderCalculations) => {
    setCheckoutOrder(orderCalculations);
  };

  const handleCompleteSale = (salePayload) => {
    const { newSale, updatedInsumos } = addSale(salePayload);
    setInsumos(updatedInsumos);
    setCurrentShift(getCurrentShift());
    setCart([]);
    setCheckoutOrder(null);
    setTicketSale(newSale);
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
    const shift = openShift(initialCash, cashierName);
    setCurrentShift(shift);
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
      />

      {/* Main Tab Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'pos' && (
          <POSView
            products={products}
            categories={INITIAL_CATEGORIES}
            cart={cart}
            setCart={setCart}
            onOpenCheckout={handleOpenCheckout}
            currentShift={currentShift}
          />
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
          />
        )}
      </main>

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

    </div>
  );
}
