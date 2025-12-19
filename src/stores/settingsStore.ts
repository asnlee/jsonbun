import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Settings {
  baseUrl: string
  apiKey: string
  model: string
}

interface SettingsStore {
  open: boolean
  settings: Settings
  setOpen: (open: boolean) => void
  updateSettings: (settings: Partial<Settings>) => void
  getEffectiveSettings: () => Settings
}

const defaultSettings: Settings = {
  baseUrl: 'https://text.pollinations.ai/openai',
  apiKey: 'none',
  model: 'openai',
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      open: false,
      settings: defaultSettings,

      setOpen: (open) => set({ open }),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      getEffectiveSettings: () => {
        const { settings } = get()
        return {
          ...settings,
          apiKey: settings.apiKey || import.meta.env.VITE_OPENAI_API_KEY || '',
        }
      },
    }),
    {
      name: 'json-visualizer-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)
