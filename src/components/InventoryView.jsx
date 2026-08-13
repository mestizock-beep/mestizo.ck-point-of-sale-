import React, { useState } from 'react';
import { Package, ShieldAlert, Plus, Edit2, Trash2, Search, RefreshCw, Layers, BookOpen, X, Check, Upload, Image as ImageIcon, Camera, PlusCircle } from 'lucide-react';

export default function InventoryView({
  insumos,
  products,
  categories,
  onSaveInsumo,
  onDeleteInsumo,
  onQuickRestockInsumo,
  onSaveProduct,
  onDeleteProduct,
  onSaveProductRecipe,
  onResetOfficialMenu
}) {
  const [activeSubtab, setActiveSubtab] = useState('recetas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const [insumoModal, setInsumoModal] = useState(null);
  const [restockModal, setRestockModal] = useState(null);
  const [recipeModal, setRecipeModal] = useState(null);
  const [productModal, setProductModal] = useState(null);

  const [showQuickAddInsumo, setShowQuickAddInsumo] = useState(false);
  const [quickInsumoName, setQuickInsumoName] = useState('');
  const [quickInsumoUnit, setQuickInsumoUnit] = useState('Pieza');
  const [quickInsumoStock, setQuickInsumoStock] = useState(10);
  const [quickInsumoMinStock, setQuickInsumoMinStock] = useState(2);

  const PRESET_IMAGES = [
    { label: 'XX Lager', url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80' },
    { label: 'Tecate Light', url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=400&q=80' },
    { label: 'Indio', url: 'https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=400&q=80' },
    { label: 'Michelob Ultra', url: 'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=400&q=80' },
    { label: 'Tacos al Pastor/Suadero', url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80' },
    { label: 'Torta Tradicional', url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=400&q=80' },
    { label: 'Michelada / Coctel', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80' },
    { label: 'Guacamole', url: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=400&q=80' }
  ];

  const filteredInsumos = insumos.filter(ins =>
    ins.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ins.unit.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(prod => {
    const matchesCat = selectedCategory === 'Todos' || prod.category === selectedCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const lowStockInsumos = insumos.filter(i => i.stock <= i.minStock);

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductModal(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const productPayload = {
      id: productModal.id || `prod-${Date.now().toString().slice(-6)}`,
      sku: formData.get('sku') || `SKU-${Date.now().toString().slice(-4)}`,
      name: formData.get('name'),
      category: formData.get('category'),
      price: Number(formData.get('price')),
      description: formData.get('description'),
      image: productModal.image || formData.get('image') || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
      recipe: productModal.recipe || []
    };

    onSaveProduct(productPayload);
    setProductModal(null);
  };

  const handleInsumoSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      id: insumoModal.id || `ins-${Date.now().toString().slice(-6)}`,
      name: formData.get('name'),
      unit: formData.get('unit'),
      stock: Number(formData.get('stock')),
      minStock: Number(formData.get('minStock')),
      yieldNote: formData.get('yieldNote') || ''
    };
    onSaveInsumo(payload);
    setInsumoModal(null);
  };

  const handleQuickCreateInsumo = () => {
    if (!quickInsumoName.trim()) {
      alert('Ingresa el nombre del nuevo ingrediente');
      return;
    }
    const newInsumo = {
      id: `ins-${Date.now().toString().slice(-6)}`,
      name: quickInsumoName.trim(),
      unit: quickInsumoUnit,
      stock: Number(quickInsumoStock),
      minStock: Number(quickInsumoMinStock),
      yieldNote: ''
    };

    onSaveInsumo(newInsumo);
    addIngredientToRecipe(newInsumo.id);
    setQuickInsumoName('');
    setShowQuickAddInsumo(false);
  };

  const handleRecipeSubmit = (e) => {
    e.preventDefault();
    if (!recipeModal) return;
    onSaveProductRecipe(recipeModal.id, recipeModal.recipe);
    setRecipeModal(null);
  };

  const addIngredientToRecipe = (insumoId) => {
    if (!recipeModal) return;
    const currentRecipe = recipeModal.recipe || [];
    if (currentRecipe.some(r => r.insumoId === insumoId)) return;

    setRecipeModal(prev => ({
      ...prev,
      recipe: [...(prev.recipe || []), { insumoId, quantity: 1 }]
    }));
  };

  const updateRecipeQty = (insumoId, qty) => {
    if (!recipeModal) return;
    setRecipeModal({
      ...recipeModal,
      recipe: recipeModal.recipe.map(r => r.insumoId === insumoId ? { ...r, quantity: Number(qty) } : r)
    });
  };

  const removeRecipeItem = (insumoId) => {
    if (!recipeModal) return;
    setRecipeModal({
      ...recipeModal,
      recipe: recipeModal.recipe.filter(r => r.insumoId !== insumoId)
    });
  };

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, width: '100%', minWidth: 0, overflowX: 'hidden' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            GESTIÓN DE INVENTARIOS, FOTOS & RECETAS
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--dark-text)' }}>
            Catálogo & Materias Primas
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              if (confirm('¿Cargar el menú oficial de Mestizo.ck (Botanas, Tacos, Volcanes, Tortas, Miches, etc.)?')) {
                onResetOfficialMenu();
              }
            }}
            style={{
              backgroundColor: 'var(--sand-muted)',
              color: 'var(--dark-text)',
              border: '1px solid var(--sand-border)',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={16} /> Restablecer Menú Oficial
          </button>

          {activeSubtab === 'insumos' ? (
            <button
              onClick={() => setInsumoModal({})}
              style={{
                backgroundColor: 'var(--terracotta)',
                color: '#FFF',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Plus size={18} /> Nuevo Insumo / Ingrediente
            </button>
          ) : (
            <button
              onClick={() => setProductModal({})}
              style={{
                backgroundColor: 'var(--terracotta)',
                color: '#FFF',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Plus size={18} /> Nuevo Platillo / Foto
            </button>
          )}
        </div>
      </div>

      {lowStockInsumos.length > 0 && (
        <div style={{
          backgroundColor: 'var(--warning-bg)',
          border: '1px solid #FFE0B2',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--warning)' }}>
            <ShieldAlert size={24} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
              Aviso de Insumos Críticos ({lowStockInsumos.length} materias primas por agotarse)
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {lowStockInsumos.map(ins => (
              <div
                key={ins.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid #FFCC80',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  whiteSpace: 'nowrap'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', color: 'var(--dark-text)' }}>
                    {ins.name}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: ins.stock <= 0 ? 'var(--danger)' : 'var(--warning)', fontWeight: 700 }}>
                    {ins.stock <= 0 ? '🔴 AGOTADO' : `⚠️ Quedan: ${ins.stock} ${ins.unit}s (Mín: ${ins.minStock})`}
                  </span>
                </div>
                <button
                  onClick={() => setRestockModal({ insumo: ins, addQty: 5 })}
                  style={{
                    backgroundColor: 'var(--terracotta)',
                    color: '#FFF',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  + Surtir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid var(--sand-border)', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveSubtab('productos')}
          style={{
            padding: '10px 20px',
            fontSize: '0.95rem',
            fontWeight: 800,
            border: 'none',
            borderBottom: activeSubtab === 'productos' ? '3px solid var(--terracotta)' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeSubtab === 'productos' ? 'var(--terracotta)' : 'var(--dark-subdued)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Camera size={18} /> Fotos y Platillos del Menú ({products.length})
        </button>

        <button
          onClick={() => setActiveSubtab('insumos')}
          style={{
            padding: '10px 20px',
            fontSize: '0.95rem',
            fontWeight: 800,
            border: 'none',
            borderBottom: activeSubtab === 'insumos' ? '3px solid var(--terracotta)' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeSubtab === 'insumos' ? 'var(--terracotta)' : 'var(--dark-subdued)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Layers size={18} /> Insumos & Materia Prima ({insumos.length})
        </button>

        <button
          onClick={() => setActiveSubtab('recetas')}
          style={{
            padding: '10px 20px',
            fontSize: '0.95rem',
            fontWeight: 800,
            border: 'none',
            borderBottom: activeSubtab === 'recetas' ? '3px solid var(--terracotta)' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeSubtab === 'recetas' ? 'var(--terracotta)' : 'var(--dark-subdued)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <BookOpen size={18} /> Recetas por Platillo (Escandallos)
        </button>
      </div>

      <div style={{ position: 'relative', width: '320px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dark-subdued)' }} />
        <input
          type="text"
          placeholder={activeSubtab === 'insumos' ? "Buscar ingrediente..." : "Buscar platillo o cerveza..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px 8px 38px',
            borderRadius: '8px',
            border: '1px solid var(--sand-border)',
            backgroundColor: '#FFF',
            fontSize: '0.9rem'
          }}
        />
      </div>

      {activeSubtab === 'productos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {filteredProducts.map(product => (
            <div
              key={product.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--sand-border)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ position: 'relative', height: '140px', backgroundColor: 'var(--sand-muted)' }}>
                <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                <button
                  onClick={() => setProductModal({ ...product })}
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(28, 43, 34, 0.85)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}
                >
                  <Camera size={14} /> Cambiar Foto
                </button>
              </div>

              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase' }}>
                    {product.category}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--dark-text)' }}>{product.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--dark-subdued)', marginTop: '2px' }}>{product.description}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--sand-border)', paddingTop: '8px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--dark-text)' }}>${product.price.toFixed(2)}</span>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setProductModal({ ...product })}
                      style={{ backgroundColor: 'var(--sand-muted)', border: '1px solid var(--sand-border)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar platillo "${product.name}"?`)) onDeleteProduct(product.id);
                      }}
                      style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubtab === 'insumos' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--sand-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--sand-muted)', borderBottom: '1px solid var(--sand-border)', color: 'var(--dark-subdued)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Materia Prima / Insumo</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Unidad</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Stock Actual</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Stock Mínimo</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Rendimiento / Equivalencia</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Estado</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInsumos.map(ins => {
                const isOut = ins.stock <= 0;
                const isLow = ins.stock > 0 && ins.stock <= ins.minStock;

                return (
                  <tr key={ins.id} style={{ borderBottom: '1px solid var(--sand-border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--dark-text)' }}>
                      {ins.name}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ backgroundColor: 'var(--sand-muted)', padding: '4px 10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}>
                        {ins.unit}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: isOut ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--dark-text)' }}>
                        {ins.stock} {ins.unit}s
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--dark-subdued)' }}>
                      {ins.minStock} {ins.unit}s
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--dark-subdued)', fontStyle: 'italic' }}>
                      {ins.yieldNote || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isOut ? (
                        <span style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
                          🔴 Agotado
                        </span>
                      ) : isLow ? (
                        <span style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
                          ⚠️ Stock Bajo
                        </span>
                      ) : (
                        <span style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
                          ✓ Abastecido
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => setRestockModal({ insumo: ins, addQty: 5 })}
                          style={{ backgroundColor: 'var(--terracotta)', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          + Surtir
                        </button>
                        <button
                          onClick={() => setInsumoModal(ins)}
                          style={{ backgroundColor: 'var(--sand-muted)', border: '1px solid var(--sand-border)', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar insumo "${ins.name}"?`)) onDeleteInsumo(ins.id);
                          }}
                          style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeSubtab === 'recetas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredProducts.map(product => {
            const hasRecipe = product.recipe && product.recipe.length > 0;

            return (
              <div
                key={product.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--sand-border)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase' }}>
                      {product.category}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark-text)' }}>{product.name}</h3>
                  </div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--dark-text)' }}>${product.price}</span>
                </div>

                <div style={{ backgroundColor: 'var(--sand-bg)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--sand-border)', flex: 1 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--dark-subdued)', display: 'block', marginBottom: '6px' }}>
                    🥩 Receta de Ingredientes por Orden:
                  </span>
                  {hasRecipe ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {product.recipe.map(item => {
                        const ins = insumos.find(i => i.id === item.insumoId);
                        return (
                          <div key={item.insumoId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                            <span>• {ins ? ins.name : 'Insumo desconocido'}</span>
                            <span style={{ fontWeight: 800 }}>{item.quantity} {ins ? ins.unit : ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--dark-subdued)', fontStyle: 'italic' }}>
                      Sin ingredientes configurados
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setRecipeModal({ ...product })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--sand-muted)',
                    border: '1px solid var(--sand-border)',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Edit2 size={16} /> Configurar Receta de Ingredientes
                </button>
              </div>
            );
          })}
        </div>
      )}

      {recipeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <form onSubmit={handleRecipeSubmit} style={{ backgroundColor: '#FFF', padding: '1.5rem', borderRadius: 'var(--radius-md)', width: '580px', maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase' }}>CONFIGURAR ESCANDALLO</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Receta para: {recipeModal.name} (${recipeModal.price})</h3>
              </div>
              <button type="button" onClick={() => { setRecipeModal(null); setShowQuickAddInsumo(false); }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ backgroundColor: 'var(--sand-bg)', padding: '12px', borderRadius: '10px', border: '1px solid var(--sand-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Agregar Ingrediente a la Receta</label>
                
                <button
                  type="button"
                  onClick={() => setShowQuickAddInsumo(!showQuickAddInsumo)}
                  style={{
                    backgroundColor: showQuickAddInsumo ? 'var(--dark-subdued)' : 'var(--terracotta)',
                    color: '#FFF',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <PlusCircle size={14} /> {showQuickAddInsumo ? 'Cerrar Formulario' : '+ Escribir Nuevo Ingrediente'}
                </button>
              </div>

              {showQuickAddInsumo ? (
                <div style={{ backgroundColor: '#FFF', padding: '10px', borderRadius: '8px', border: '1px dashed var(--terracotta)', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--terracotta)' }}>
                    ✨ Escribir e Ingresar Nuevo Ingrediente al Sistema:
                  </span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Nombre (ej. Cilantro, Pico de Gallo, Chile...)"
                      value={quickInsumoName}
                      onChange={(e) => setQuickInsumoName(e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--sand-border)', fontSize: '0.85rem' }}
                    />
                    <select
                      value={quickInsumoUnit}
                      onChange={(e) => setQuickInsumoUnit(e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--sand-border)', fontSize: '0.85rem' }}
                    >
                      <option value="Pieza">Pieza</option>
                      <option value="Kg">Kg</option>
                      <option value="Litro">Litro</option>
                      <option value="Botella">Botella</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--dark-subdued)' }}>Stock inicial:</span>
                      <input
                        type="number"
                        step="any"
                        value={quickInsumoStock}
                        onChange={(e) => setQuickInsumoStock(e.target.value)}
                        style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--sand-border)', fontSize: '0.82rem' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--dark-subdued)' }}>Stock mínimo:</span>
                      <input
                        type="number"
                        step="any"
                        value={quickInsumoMinStock}
                        onChange={(e) => setQuickInsumoMinStock(e.target.value)}
                        style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--sand-border)', fontSize: '0.82rem' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickCreateInsumo}
                      style={{
                        backgroundColor: 'var(--terracotta)',
                        color: '#FFF',
                        border: 'none',
                        padding: '8px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        marginTop: '12px'
                      }}
                    >
                      ✓ Guardar & Agregar
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addIngredientToRecipe(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--sand-border)' }}
                >
                  <option value="">-- Seleccionar insumo para agregar --</option>
                  {insumos.map(ins => (
                    <option key={ins.id} value={ins.id}>
                      {ins.name} ({ins.unit}) {ins.yieldNote ? `- ${ins.yieldNote}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Ingredientes Requeridos por Platillo:</span>
              {(!recipeModal.recipe || recipeModal.recipe.length === 0) ? (
                <p style={{ fontStyle: 'italic', color: 'var(--dark-subdued)', fontSize: '0.85rem' }}>No hay ingredientes agregados.</p>
              ) : (
                recipeModal.recipe.map(item => {
                  const ins = insumos.find(i => i.id === item.insumoId);
                  return (
                    <div key={item.insumoId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--sand-muted)', padding: '8px 12px', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ins ? ins.name : 'Insumo'}</span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => updateRecipeQty(item.insumoId, e.target.value)}
                          style={{ width: '90px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--sand-border)', fontWeight: 800 }}
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{ins ? ins.unit : ''}s</span>
                        <button type="button" onClick={() => removeRecipeItem(item.insumoId)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button type="button" onClick={() => { setRecipeModal(null); setShowQuickAddInsumo(false); }} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--sand-border)' }}>Cancelar</button>
              <button type="submit" style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'var(--terracotta)', color: '#FFF', fontWeight: 700 }}>Guardar Receta</button>
            </div>
          </form>
        </div>
      )}

      {productModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <form
            onSubmit={handleProductSubmit}
            style={{
              backgroundColor: '#FFF',
              borderRadius: 'var(--radius-lg)',
              width: '560px',
              maxWidth: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {productModal.id ? `Editar Platillo: ${productModal.name}` : 'Registrar Nuevo Platillo'}
              </h3>
              <button type="button" onClick={() => setProductModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--sand-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--sand-border)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--dark-text)' }}>
                📷 Foto del Platillo o Logo de la Cerveza
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img
                  src={productModal.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80'}
                  alt="Vista previa"
                  style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover', border: '2px solid var(--terracotta)' }}
                />
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--terracotta)',
                      color: '#FFF',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      alignSelf: 'flex-start'
                    }}
                  >
                    <Upload size={16} /> Subir Foto desde Computadora
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--dark-subdued)' }}>
                    Soporta imágenes JPG, PNG, WEBP directamente desde tu disco.
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--dark-subdued)', display: 'block', marginBottom: '6px' }}>
                  O selecciona una imagen precargada:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESET_IMAGES.map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setProductModal(prev => ({ ...prev, image: p.url }))}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--sand-border)',
                        backgroundColor: '#FFF',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--dark-subdued)', display: 'block', marginBottom: '2px' }}>
                  O escribe/pega un enlace URL de imagen:
                </label>
                <input
                  name="image"
                  value={productModal.image || ''}
                  onChange={(e) => setProductModal(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://..."
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--sand-border)', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Nombre</label>
                <input name="name" defaultValue={productModal.name || ''} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--sand-border)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>SKU Código</label>
                <input name="sku" defaultValue={productModal.sku || ''} placeholder="Ej: CER-05" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--sand-border)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Categoría</label>
                <select name="category" defaultValue={productModal.category || 'Tacos'} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--sand-border)' }}>
                  {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Precio ($ MXN)</label>
                <input name="price" type="number" step="any" defaultValue={productModal.price || ''} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--sand-border)' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Descripción</label>
              <textarea name="description" defaultValue={productModal.description || ''} rows={2} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--sand-border)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button type="button" onClick={() => setProductModal(null)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--sand-border)' }}>Cancelar</button>
              <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--terracotta)', color: '#FFF', fontWeight: 700 }}>Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}

      {insumoModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <form onSubmit={handleInsumoSubmit} style={{ backgroundColor: '#FFF', padding: '1.5rem', borderRadius: 'var(--radius-md)', width: '420px', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{insumoModal.id ? 'Editar Insumo' : 'Registrar Nuevo Insumo'}</h3>
            
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Nombre de la Materia Prima</label>
              <input name="name" defaultValue={insumoModal.name || ''} placeholder="Ej: Cebolla Blanca, Suadero, Tortilla..." required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--sand-border)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Unidad</label>
                <select name="unit" defaultValue={insumoModal.unit || 'Pieza'} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--sand-border)' }}>
                  <option value="Pieza">Pieza</option>
                  <option value="Kg">Kg</option>
                  <option value="Litro">Litro</option>
                  <option value="Botella">Botella</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Stock Actual</label>
                <input name="stock" type="number" step="any" defaultValue={insumoModal.stock ?? 10} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--sand-border)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Stock Mínimo</label>
                <input name="minStock" type="number" step="any" defaultValue={insumoModal.minStock ?? 2} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--sand-border)' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Nota de Rendimiento / Rendimiento</label>
              <input name="yieldNote" defaultValue={insumoModal.yieldNote || ''} placeholder="Ej: 1 cebolla rinde 15 tacos (0.067 pza por taco)" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--sand-border)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button type="button" onClick={() => setInsumoModal(null)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--sand-border)' }}>Cancelar</button>
              <button type="submit" style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'var(--terracotta)', color: '#FFF', fontWeight: 700 }}>Guardar Insumo</button>
            </div>
          </form>
        </div>
      )}

      {restockModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <form onSubmit={(e) => {
            e.preventDefault();
            onQuickRestockInsumo(restockModal.insumo.id, Number(restockModal.addQty));
            setRestockModal(null);
          }} style={{ backgroundColor: '#FFF', padding: '1.5rem', borderRadius: 'var(--radius-md)', width: '380px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>Surtir Insumo</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--dark-subdued)', marginBottom: '1rem' }}>
              Materia prima: <strong>{restockModal.insumo.name}</strong> (Stock actual: {restockModal.insumo.stock} {restockModal.insumo.unit}s)
            </p>

            <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Cantidad a Añadir (+ {restockModal.insumo.unit}s)
            </label>
            <input
              type="number"
              step="any"
              min="0.1"
              value={restockModal.addQty}
              onChange={(e) => setRestockModal({ ...restockModal, addQty: e.target.value })}
              style={{ width: '100%', padding: '10px', fontSize: '1.1rem', fontWeight: 800, borderRadius: '8px', border: '1px solid var(--sand-border)', marginBottom: '1.25rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setRestockModal(null)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--sand-border)' }}>Cancelar</button>
              <button type="submit" style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'var(--terracotta)', color: '#FFF', fontWeight: 700 }}>Confirmar Reabastecimiento</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
