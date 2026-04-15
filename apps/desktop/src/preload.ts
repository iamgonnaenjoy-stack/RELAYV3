import { contextBridge } from 'electron'

// Expose safe APIs to the renderer here if needed
// e.g. window controls, native file dialogs, etc.
contextBridge.exposeInMainWorld('relay', {
  platform: process.platform,
})
