// WebUSB & Web Serial ESC/POS Printer Utility for Mestizo POS

const USB_PRINTER_STORAGE_KEY = 'mestizo_pos_usb_printer_info';

export const isWebUSBSupported = () => {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
};

export const isWebSerialSupported = () => {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
};

export const getSavedUSBPrinterInfo = () => {
  try {
    const saved = localStorage.getItem(USB_PRINTER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

export const saveUSBPrinterInfo = (info) => {
  try {
    if (!info) {
      localStorage.removeItem(USB_PRINTER_STORAGE_KEY);
    } else {
      localStorage.setItem(USB_PRINTER_STORAGE_KEY, JSON.stringify(info));
    }
  } catch (e) {}
};

// Request and pair a USB Printer via WebUSB
export const connectUSBPrinter = async () => {
  if (!isWebUSBSupported()) {
    throw new Error('Tu navegador no soporta WebUSB. Usa Google Chrome o Microsoft Edge para conexión directa por cable.');
  }

  try {
    // Request any USB device or filter by common printer vendor classes
    const device = await navigator.usb.requestDevice({
      filters: [
        { classCode: 7 } // USB Printer Class
      ]
    }).catch(async () => {
      // If no printer class filter matches, allow selecting from all USB devices
      return await navigator.usb.requestDevice({ filters: [] });
    });

    if (!device) {
      throw new Error('No se seleccionó ningún dispositivo USB.');
    }

    const printerInfo = {
      productName: device.productName || 'Impresora Térmica USB',
      manufacturerName: device.manufacturerName || 'Genérica ESC/POS',
      vendorId: device.vendorId,
      productId: device.productId,
      connectedAt: new Date().toISOString()
    };

    saveUSBPrinterInfo(printerInfo);
    return { success: true, device, printerInfo };
  } catch (error) {
    console.warn('Error al conectar impresora USB:', error);
    throw error;
  }
};

export const disconnectUSBPrinter = () => {
  saveUSBPrinterInfo(null);
  return { success: true };
};

// Convert string to ESC/POS bytes with accented Latin1 characters
export const textToEscPosBytes = (text) => {
  const encoder = new TextEncoder();
  // ESC @: Initialize printer
  const init = new Uint8Array([0x1B, 0x40]);
  // ESC t 0: Code table PC437 / CP850
  const codeTable = new Uint8Array([0x1B, 0x74, 0x00]);
  
  const body = encoder.encode(text + '\n\n\n\n');
  
  // GS V 66 0: Partial Cut paper (or full cut)
  const cutPaper = new Uint8Array([0x1D, 0x56, 0x42, 0x00]);
  
  // Combine all buffers
  const totalLength = init.length + codeTable.length + body.length + cutPaper.length;
  const merged = new Uint8Array(totalLength);
  
  let offset = 0;
  merged.set(init, offset);
  offset += init.length;
  merged.set(codeTable, offset);
  offset += codeTable.length;
  merged.set(body, offset);
  offset += body.length;
  merged.set(cutPaper, offset);
  
  return merged;
};

// Send raw ESC/POS bytes to paired USB device
export const sendRawToUSBPrinter = async (dataBytes) => {
  if (!isWebUSBSupported()) {
    throw new Error('WebUSB no soportado');
  }

  const savedInfo = getSavedUSBPrinterInfo();
  if (!savedInfo) {
    throw new Error('No hay impresora USB vinculada.');
  }

  const devices = await navigator.usb.getDevices();
  const device = devices.find(d => d.vendorId === savedInfo.vendorId && d.productId === savedInfo.productId);

  if (!device) {
    throw new Error('La impresora USB no está conectada físicamente por cable a la computadora.');
  }

  await device.open();
  
  if (device.configuration === null) {
    await device.selectConfiguration(1);
  }

  // Find interface with printer class (or interface 0)
  let interfaceNumber = 0;
  let endpointOut = null;

  for (const iface of device.configuration.interfaces) {
    for (const alt of iface.alternates) {
      for (const ep of alt.endpoints) {
        if (ep.direction === 'out') {
          interfaceNumber = iface.interfaceNumber;
          endpointOut = ep.endpointNumber;
          break;
        }
      }
    }
  }

  if (endpointOut === null) {
    endpointOut = 1; // standard default bulk out endpoint
  }

  try {
    await device.claimInterface(interfaceNumber);
    await device.transferOut(endpointOut, dataBytes);
    await device.releaseInterface(interfaceNumber);
    await device.close();
    return { success: true };
  } catch (err) {
    try { await device.close(); } catch (e) {}
    throw err;
  }
};

// Send a formatted test ticket to the USB printer
export const printUSBTestTicket = async (settings = {}) => {
  const businessName = settings.businessName || 'MESTIZO COMEDOR & BAR';
  const width = settings.paperWidth === '58mm' ? 32 : 42;
  const line = '-'.repeat(width);

  const testText = [
    '================================',
    `      ${businessName}      `,
    '    PRUEBA DE IMPRESORA USB     ',
    '================================',
    `Fecha: ${new Date().toLocaleString('es-MX')}`,
    'Conexión: Cable USB Directo (ESC/POS)',
    'Estado: 🟢 COMUNICACIÓN EXITOSA',
    line,
    'Platillos de Prueba:',
    '1x Taco Cochinita Pibil   $45.00',
    '1x Mezcalina de la Casa   $120.00',
    line,
    'SUBTOTAL:                $165.00',
    'TOTAL:                   $165.00',
    line,
    '¡Tu impresora térmica por cable',
    'está lista para cobrar!',
    '================================'
  ].join('\n');

  const bytes = textToEscPosBytes(testText);
  return await sendRawToUSBPrinter(bytes);
};
