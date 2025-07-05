const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hospitalAPI', {
  saveData: (key, data) => ipcRenderer.invoke('save-data', key, data),
  loadData: (key) => ipcRenderer.invoke('load-data', key)
});
