import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PreferencesState {
  confirmMessageDelete: boolean
  setConfirmMessageDelete: (confirmMessageDelete: boolean) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      confirmMessageDelete: true,
      setConfirmMessageDelete: (confirmMessageDelete) => set({ confirmMessageDelete }),
    }),
    {
      name: 'relay-preferences',
    }
  )
)
