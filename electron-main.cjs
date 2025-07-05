// Electron main process (CommonJS)
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Node.js fs for file storage
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(`file://${path.join(__dirname, 'dist', 'index.html')}`);
  // win.webContents.openDevTools(); // Removed devtools for production
}

// Data storage helpers
const dataDir = app.getPath('userData');
const getFilePath = (key) => path.join(dataDir, `${key}.json`);

ipcMain.handle('save-data', async (event, key, data) => {
  fs.writeFileSync(getFilePath(key), JSON.stringify(data, null, 2), 'utf-8');
  return true;
});

ipcMain.handle('load-data', async (event, key) => {
  const filePath = getFilePath(key);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content.trim()) return {};
      return JSON.parse(content);
    } catch (e) {
      // If file is corrupted or not valid JSON, return empty object
      return {};
    }
  }
  return {};
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
