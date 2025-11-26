// Preload script for secure IPC communication
const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Preload script loaded');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => {
      // Whitelist channels
      const validChannels = [
        'agent:initialize',
        'agent:execute',
        'agent:stop',
        'agent:respond'
      ];
      
      console.log('[Preload] IPC invoke:', channel, args);
      
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      } else {
        console.warn('[Preload] Invalid channel:', channel);
        return Promise.reject(new Error(`Invalid IPC channel: ${channel}`));
      }
    },
    on: (channel, func) => {
      const validChannels = ['agent:event'];
      
      console.log('[Preload] IPC on:', channel);
      
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => {
          console.log('[Preload] IPC event received:', channel, args);
          func(event, ...args);
        });
      } else {
        console.warn('[Preload] Invalid channel for on:', channel);
      }
    },
    once: (channel, func) => {
      const validChannels = ['agent:event'];
      
      if (validChannels.includes(channel)) {
        ipcRenderer.once(channel, (event, ...args) => func(event, ...args));
      }
    },
    removeListener: (channel, func) => {
      const validChannels = ['agent:event'];
      
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func);
      }
    }
  }
});

console.log('[Preload] window.electron exposed');
