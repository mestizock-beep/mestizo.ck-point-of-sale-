import { contextBridge } from 'electron';

// Expose safe custom APIs to renderer process if needed in the future
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform
});
