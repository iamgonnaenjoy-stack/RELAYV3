import { create } from 'zustand'

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'

interface ShellState {
  bootstrapError: string | null
  connectionStatus: ConnectionStatus
  connectionMessage: string | null
  setBootstrapError: (message: string | null) => void
  setConnectionState: (status: ConnectionStatus, message?: string | null) => void
  resetShell: () => void
}

export const useShellStore = create<ShellState>((set) => ({
  bootstrapError: null,
  connectionStatus: 'idle',
  connectionMessage: null,
  setBootstrapError: (message) => set({ bootstrapError: message }),
  setConnectionState: (status, message = null) =>
    set({
      connectionStatus: status,
      connectionMessage: message,
    }),
  resetShell: () =>
    set({
      bootstrapError: null,
      connectionStatus: 'idle',
      connectionMessage: null,
    }),
}))
