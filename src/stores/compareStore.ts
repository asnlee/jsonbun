import { create } from 'zustand'

interface CompareStore {
  active: boolean
  leftText: string
  rightText: string
  open: (rightText: string) => void
  close: () => void
}

export const useCompareStore = create<CompareStore>((set) => ({
  active: false,
  leftText: '',
  rightText: '',

  open: (rightText: string) => {
    import('./jsonStore').then((m) => {
      const jsonText = m.useJsonStore.getState().jsonText
      set({ active: true, leftText: jsonText, rightText })
    })
  },

  close: () => set({ active: false, leftText: '', rightText: '' }),
}))
