const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  saveTextFile: (defaultFilename, content) =>
    ipcRenderer.invoke("save-text-file", { defaultFilename, content }),
});
