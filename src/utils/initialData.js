export const INITIAL_CATEGORIES = [
  'Todos',
  'Botanas',
  'Tacos',
  'Volcanes',
  'Tortas',
  'Cachetadas',
  'Especiales',
  'Cervezas',
  'Miches',
  'Cócteles',
  'Sin Alcohol',
  'El Último Antojo'
];

export const INITIAL_INSUMOS = [
  {
    id: 'ins-001',
    name: 'Cebolla Blanca',
    unit: 'Pieza',
    stock: 10,
    minStock: 2,
    costPerUnit: 12.00,
    yieldNote: '1 cebolla rinde 15 tacos (0.067 pza por taco)'
  },
  {
    id: 'ins-002',
    name: 'Tortilla de Maíz',
    unit: 'Pieza',
    stock: 250,
    minStock: 40,
    costPerUnit: 0.50,
    yieldNote: '2 tortillas por taco / volcan / cachetada'
  },
  {
    id: 'ins-003',
    name: 'Carne Suadero',
    unit: 'Kg',
    stock: 8.5,
    minStock: 2.0,
    costPerUnit: 180.00,
    yieldNote: '0.08 kg por taco / torta'
  },
  {
    id: 'ins-004',
    name: 'Carne Adobada',
    unit: 'Kg',
    stock: 6.0,
    minStock: 2.0,
    costPerUnit: 160.00,
    yieldNote: '0.08 kg por taco / torta'
  },
  {
    id: 'ins-005',
    name: 'Tripita de Res',
    unit: 'Kg',
    stock: 4.0,
    minStock: 1.5,
    costPerUnit: 210.00,
    yieldNote: '0.08 kg por taco / torta'
  },
  {
    id: 'ins-006',
    name: 'Carne Bistek',
    unit: 'Kg',
    stock: 7.0,
    minStock: 2.0,
    costPerUnit: 190.00,
    yieldNote: '0.09 kg por taco / volcan / torta'
  },
  {
    id: 'ins-007',
    name: 'Longaniza / Chorizo',
    unit: 'Kg',
    stock: 5.0,
    minStock: 1.5,
    costPerUnit: 140.00,
    yieldNote: '0.05 kg por taco mestizo / don mestizo'
  },
  {
    id: 'ins-008',
    name: 'Pan para Torta (Telera)',
    unit: 'Pieza',
    stock: 35,
    minStock: 8,
    costPerUnit: 4.50,
    yieldNote: '1 pan por torta'
  },
  {
    id: 'ins-009',
    name: 'Queso Asadero (Costra)',
    unit: 'Kg',
    stock: 4.0,
    minStock: 1.0,
    costPerUnit: 130.00,
    yieldNote: '0.06 kg por el patrón / volcan'
  },
  {
    id: 'ins-010',
    name: 'Aguacate Hass',
    unit: 'Pieza',
    stock: 18,
    minStock: 4,
    costPerUnit: 15.00,
    yieldNote: '0.25 pza por guacamole / el patrón'
  },
  {
    id: 'ins-011',
    name: 'Totopos de Maíz',
    unit: 'Kg',
    stock: 3.5,
    minStock: 1.0,
    costPerUnit: 45.00,
    yieldNote: '0.15 kg por orden de nachos'
  },
  {
    id: 'ins-012',
    name: 'Frijoles Puercos',
    unit: 'Kg',
    stock: 5.0,
    minStock: 1.5,
    costPerUnit: 50.00,
    yieldNote: '0.10 kg por nachos / el esquincle'
  },
  {
    id: 'ins-013',
    name: 'Chistorra',
    unit: 'Kg',
    stock: 3.0,
    minStock: 1.0,
    costPerUnit: 175.00,
    yieldNote: '0.12 kg por paponas con chistorra'
  },
  {
    id: 'ins-014',
    name: 'Papa Francesa / Cambray',
    unit: 'Kg',
    stock: 12.0,
    minStock: 3.0,
    costPerUnit: 28.00,
    yieldNote: '0.25 kg por papas mestizo / paponas'
  },
  {
    id: 'ins-015',
    name: 'Cerveza XX Lager 355ml',
    unit: 'Pieza',
    stock: 48,
    minStock: 12,
    costPerUnit: 18.00
  },
  {
    id: 'ins-016',
    name: 'Cerveza Tecate Light 355ml',
    unit: 'Pieza',
    stock: 48,
    minStock: 12,
    costPerUnit: 16.00
  },
  {
    id: 'ins-017',
    name: 'Cerveza Indio 355ml',
    unit: 'Pieza',
    stock: 36,
    minStock: 10,
    costPerUnit: 18.00
  },
  {
    id: 'ins-018',
    name: 'Cerveza Michelob Ultra 355ml',
    unit: 'Pieza',
    stock: 36,
    minStock: 10,
    costPerUnit: 19.00
  },
  {
    id: 'ins-019',
    name: 'Mezcal Artesanal 750ml',
    unit: 'Botella',
    stock: 4,
    minStock: 1,
    costPerUnit: 350.00,
    yieldNote: '0.06 botella (1.5 oz) por mezcalita / cantarito'
  },
  {
    id: 'ins-020',
    name: 'Pulpa de Mango / Jamaica',
    unit: 'Litro',
    stock: 3.0,
    minStock: 1.0,
    costPerUnit: 60.00,
    yieldNote: '0.08 lts por michelada / mezcalita'
  },
  {
    id: 'ins-021',
    name: 'Refresco Lote 355ml',
    unit: 'Pieza',
    stock: 60,
    minStock: 15,
    costPerUnit: 14.00
  },
  {
    id: 'ins-022',
    name: 'Boing 355ml',
    unit: 'Pieza',
    stock: 40,
    minStock: 10,
    costPerUnit: 10.00
  }
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-101',
    sku: 'BOT-01',
    name: 'Guacamole con Chicharrón',
    category: 'Botanas',
    price: 95,
    description: 'Guacamole preparado al momento con chicharrón crujiente.',
    image: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-010', quantity: 2 },
      { insumoId: 'ins-001', quantity: 0.1 }
    ]
  },
  {
    id: 'prod-102',
    sku: 'BOT-02',
    name: 'Papas Mestizo',
    category: 'Botanas',
    price: 120,
    description: 'Papas a la francesa, salsa de la casa y carne.',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-014', quantity: 0.25 },
      { insumoId: 'ins-003', quantity: 0.08 }
    ]
  },
  {
    id: 'prod-103',
    sku: 'BOT-03',
    name: 'Paponas con Chistorra',
    category: 'Botanas',
    price: 125,
    description: 'Papas cambray, chistorra y salsa de ajo.',
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-014', quantity: 0.25 },
      { insumoId: 'ins-013', quantity: 0.12 }
    ]
  },
  {
    id: 'prod-104',
    sku: 'BOT-04',
    name: 'Nachos Libres',
    category: 'Botanas',
    price: 130,
    description: 'Totopos, frijoles puercos, carne y queso fundido.',
    image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-011', quantity: 0.15 },
      { insumoId: 'ins-012', quantity: 0.10 },
      { insumoId: 'ins-006', quantity: 0.08 },
      { insumoId: 'ins-009', quantity: 0.06 }
    ]
  },

  {
    id: 'prod-201',
    sku: 'TAC-01',
    name: 'Taco de Suadero',
    category: 'Tacos',
    price: 22,
    description: 'Suadero suave sobre doble tortilla de maíz.',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-002', quantity: 2 },
      { insumoId: 'ins-003', quantity: 0.08 },
      { insumoId: 'ins-001', quantity: 0.067 }
    ]
  },
  {
    id: 'prod-202',
    sku: 'TAC-02',
    name: 'Taco de Adobada',
    category: 'Tacos',
    price: 20,
    description: 'Carne adobada sazonada a la plancha.',
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-002', quantity: 2 },
      { insumoId: 'ins-004', quantity: 0.08 },
      { insumoId: 'ins-001', quantity: 0.067 }
    ]
  },
  {
    id: 'prod-203',
    sku: 'TAC-03',
    name: 'Taco de Tripita',
    category: 'Tacos',
    price: 25,
    description: 'Tripita doradita y bien sazonada.',
    image: 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-002', quantity: 2 },
      { insumoId: 'ins-005', quantity: 0.08 },
      { insumoId: 'ins-001', quantity: 0.067 }
    ]
  },
  {
    id: 'prod-204',
    sku: 'TAC-04',
    name: 'Taco de Bistek',
    category: 'Tacos',
    price: 22,
    description: 'Bistek de res jugoso a las brasas.',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-002', quantity: 2 },
      { insumoId: 'ins-006', quantity: 0.08 },
      { insumoId: 'ins-001', quantity: 0.067 }
    ]
  },
  {
    id: 'prod-205',
    sku: 'TAC-05',
    name: 'Taco Mestizo',
    category: 'Tacos',
    price: 22,
    description: 'Combinación especial de suadero y longaniza.',
    image: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-002', quantity: 2 },
      { insumoId: 'ins-003', quantity: 0.04 },
      { insumoId: 'ins-007', quantity: 0.04 },
      { insumoId: 'ins-001', quantity: 0.067 }
    ]
  },

  {
    id: 'prod-301',
    sku: 'VOL-01',
    name: 'Volcán de Bistek',
    category: 'Volcanes',
    price: 32,
    description: 'Tortilla tostada crujiente con queso fundido y bistek.',
    image: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-002', quantity: 1 },
      { insumoId: 'ins-009', quantity: 0.05 },
      { insumoId: 'ins-006', quantity: 0.07 }
    ]
  },
  {
    id: 'prod-302',
    sku: 'VOL-02',
    name: 'Volcán de Adobada',
    category: 'Volcanes',
    price: 30,
    description: 'Tortilla tostada con queso derretido y adobada.',
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-002', quantity: 1 },
      { insumoId: 'ins-009', quantity: 0.05 },
      { insumoId: 'ins-004', quantity: 0.07 }
    ]
  },
  {
    id: 'prod-303',
    sku: 'VOL-03',
    name: 'Volcán El Mestizo',
    category: 'Volcanes',
    price: 32,
    description: 'Tostada especial con queso, suadero y longaniza.',
    image: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-002', quantity: 1 },
      { insumoId: 'ins-009', quantity: 0.05 },
      { insumoId: 'ins-003', quantity: 0.04 },
      { insumoId: 'ins-007', quantity: 0.04 }
    ]
  },

  {
    id: 'prod-401',
    sku: 'TOR-01',
    name: 'Torta de Suadero',
    category: 'Tortas',
    price: 62,
    description: 'Telera artesanal con suadero, verdura y aderezos.',
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-008', quantity: 1 },
      { insumoId: 'ins-003', quantity: 0.12 },
      { insumoId: 'ins-001', quantity: 0.1 }
    ]
  },
  {
    id: 'prod-402',
    sku: 'TOR-02',
    name: 'Torta de Adobada',
    category: 'Tortas',
    price: 60,
    description: 'Telera caliente con carne adobada.',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-008', quantity: 1 },
      { insumoId: 'ins-004', quantity: 0.12 },
      { insumoId: 'ins-001', quantity: 0.1 }
    ]
  },
  {
    id: 'prod-403',
    sku: 'TOR-03',
    name: 'Torta de Tripita',
    category: 'Tortas',
    price: 65,
    description: 'Telera crujiente con tripita bien dorada.',
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-008', quantity: 1 },
      { insumoId: 'ins-005', quantity: 0.12 },
      { insumoId: 'ins-001', quantity: 0.1 }
    ]
  },
  {
    id: 'prod-404',
    sku: 'TOR-04',
    name: 'Torta de Bistek',
    category: 'Tortas',
    price: 62,
    description: 'Bistek a la plancha en pan telera.',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-008', quantity: 1 },
      { insumoId: 'ins-006', quantity: 0.12 },
      { insumoId: 'ins-001', quantity: 0.1 }
    ]
  },
  {
    id: 'prod-405',
    sku: 'TOR-05',
    name: 'Torta Mestizo',
    category: 'Tortas',
    price: 62,
    description: 'Combinación especial de suadero y longaniza en telera.',
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-008', quantity: 1 },
      { insumoId: 'ins-003', quantity: 0.06 },
      { insumoId: 'ins-007', quantity: 0.06 },
      { insumoId: 'ins-001', quantity: 0.1 }
    ]
  },

  {
    id: 'prod-501',
    sku: 'CAC-01',
    name: 'Cachetada de Suadero',
    category: 'Cachetadas',
    price: 42,
    description: 'Doble tortilla dorada con suadero y queso.',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-002', quantity: 2 },
      { insumoId: 'ins-003', quantity: 0.10 },
      { insumoId: 'ins-009', quantity: 0.04 }
    ]
  },
  {
    id: 'prod-502',
    sku: 'CAC-02',
    name: 'Cachetada de Adobada',
    category: 'Cachetadas',
    price: 40,
    description: 'Cachetada con carne adobada y queso.',
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-002', quantity: 2 },
      { insumoId: 'ins-004', quantity: 0.10 },
      { insumoId: 'ins-009', quantity: 0.04 }
    ]
  },
  {
    id: 'prod-503',
    sku: 'CAC-03',
    name: 'Cachetada de Tripita',
    category: 'Cachetadas',
    price: 45,
    description: 'Cachetada crocante con tripita.',
    image: 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-002', quantity: 2 },
      { insumoId: 'ins-005', quantity: 0.10 },
      { insumoId: 'ins-009', quantity: 0.04 }
    ]
  },

  {
    id: 'prod-601',
    sku: 'ESP-01',
    name: 'El Patrón',
    category: 'Especiales',
    price: 35,
    description: 'Suadero, cebolla, costra de queso y aguacate fresco.',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-002', quantity: 2 },
      { insumoId: 'ins-003', quantity: 0.08 },
      { insumoId: 'ins-001', quantity: 0.067 },
      { insumoId: 'ins-009', quantity: 0.05 },
      { insumoId: 'ins-010', quantity: 0.25 }
    ]
  },
  {
    id: 'prod-602',
    sku: 'ESP-02',
    name: 'Don Mestizo',
    category: 'Especiales',
    price: 30,
    description: 'Suadero, chorizo y chicharrón crujiente.',
    image: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-002', quantity: 2 },
      { insumoId: 'ins-003', quantity: 0.05 },
      { insumoId: 'ins-007', quantity: 0.05 }
    ]
  },
  {
    id: 'prod-603',
    sku: 'ESP-03',
    name: 'El Esquincle',
    category: 'Especiales',
    price: 28,
    description: 'Suadero, cebolla picadita y frijoles puercos.',
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-002', quantity: 2 },
      { insumoId: 'ins-003', quantity: 0.06 },
      { insumoId: 'ins-001', quantity: 0.067 },
      { insumoId: 'ins-012', quantity: 0.05 }
    ]
  },

  {
    id: 'prod-701',
    sku: 'CER-01',
    name: 'XX Lager',
    category: 'Cervezas',
    price: 35,
    description: 'Cerveza clara de botella 355ml.',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80',
    recipe: [{ insumoId: 'ins-015', quantity: 1 }]
  },
  {
    id: 'prod-702',
    sku: 'CER-02',
    name: 'Tecate Light',
    category: 'Cervezas',
    price: 32,
    description: 'Cerveza ligera 355ml.',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80',
    recipe: [{ insumoId: 'ins-016', quantity: 1 }]
  },
  {
    id: 'prod-703',
    sku: 'CER-03',
    name: 'Indio',
    category: 'Cervezas',
    price: 35,
    description: 'Cerveza obscura tipo VIENNA 355ml.',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80',
    recipe: [{ insumoId: 'ins-017', quantity: 1 }]
  },
  {
    id: 'prod-704',
    sku: 'CER-04',
    name: 'Michelob Ultra',
    category: 'Cervezas',
    price: 36,
    description: 'Cerveza ultra ligera 355ml.',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80',
    recipe: [{ insumoId: 'ins-018', quantity: 1 }]
  },

  {
    id: 'prod-801',
    sku: 'MIC-01',
    name: 'Michelada de Mango',
    category: 'Miches',
    price: 80,
    description: 'Cerveza helada con pulpa de mango y escarchado de chamoy.',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-015', quantity: 1 },
      { insumoId: 'ins-020', quantity: 0.08 }
    ]
  },
  {
    id: 'prod-802',
    sku: 'MIC-02',
    name: 'Michelada de Tamarindo',
    category: 'Miches',
    price: 80,
    description: 'Michelada preparada con pulpa artesanal de tamarindo.',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-015', quantity: 1 },
      { insumoId: 'ins-020', quantity: 0.08 }
    ]
  },

  {
    id: 'prod-901',
    sku: 'COC-01',
    name: 'Mezcalita Jamaica',
    category: 'Cócteles',
    price: 90,
    description: 'Mezcal artesanal con infusión concentrada de flor de jamaica.',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
    recipe: [
      { insumoId: 'ins-019', quantity: 0.06 },
      { insumoId: 'ins-020', quantity: 0.08 }
    ]
  },
  {
    id: 'prod-902',
    sku: 'COC-02',
    name: 'Cantarito',
    category: 'Cócteles',
    price: 95,
    description: 'Cantarito de barro tradicional con mezcal, toronja y lima.',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80',
    recipe: [{ insumoId: 'ins-019', quantity: 0.06 }]
  },

  {
    id: 'prod-1001',
    sku: 'BEB-01',
    name: 'Refrescos (355ml)',
    category: 'Sin Alcohol',
    price: 30,
    description: 'Coca-Cola, Sprite, Mundet, Fanta.',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
    recipe: [{ insumoId: 'ins-021', quantity: 1 }]
  },
  {
    id: 'prod-1002',
    sku: 'BEB-02',
    name: 'Boing (355ml)',
    category: 'Sin Alcohol',
    price: 20,
    description: 'Jugo Boing sabor mango o guayaba.',
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=400&q=80',
    recipe: [{ insumoId: 'ins-022', quantity: 1 }]
  },

  {
    id: 'prod-1101',
    sku: 'POS-01',
    name: 'Flan Casero',
    category: 'El Último Antojo',
    price: 90,
    description: 'Flan cremoso de la casa con caramelo suave.',
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80',
    recipe: []
  },
  {
    id: 'prod-1102',
    sku: 'POS-02',
    name: 'Churros',
    category: 'El Último Antojo',
    price: 95,
    description: 'Orden de churros crujientes espolvoreados con canela y azúcar.',
    image: 'https://images.unsplash.com/photo-1624371414361-e670edf4898d?auto=format&fit=crop&w=400&q=80',
    recipe: []
  },
  {
    id: 'prod-1103',
    sku: 'POS-03',
    name: 'Pan de Elote',
    category: 'El Último Antojo',
    price: 95,
    description: 'Pan de elote calentito bañado en leche condensada.',
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80',
    recipe: []
  }
];

export const INITIAL_PRINTER_SETTINGS = {
  paperWidth: '80mm',
  businessName: 'MESTIZO COMEDOR & BAR',
  address: 'Av. Principal #450, Centro Histórico',
  phone: '55 1234 5678',
  rfc: 'MEST900812-3X5',
  footerMessage: '¡Gracias por visitarnos en Mestizo!\nConserve este ticket para cualquier aclaración.',
  autoPrintOnPay: true
};
