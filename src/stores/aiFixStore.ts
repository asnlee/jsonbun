import { create } from 'zustand'

interface AiFixStore {
  mode: 'normal' | 'diff'
  loading: boolean
  errorMessage: string
  originalText: string
  fixedText: string
  explanation: string
  requestFix: (jsonText: string) => Promise<void>
  applyFix: () => void
  discardFix: () => void
  clearError: () => void
}

export const useAiFixStore = create<AiFixStore>((set, get) => ({
  mode: 'normal',
  loading: false,
  errorMessage: '',
  originalText: '',
  fixedText: '',
  explanation: '',

  requestFix: async (jsonText: string) => {
    set({ loading: true, errorMessage: '', originalText: jsonText })

    try {
      const { fixJson } = await import('../lib/openai')
      const result = await fixJson(jsonText)

      set({
        loading: false,
        mode: 'diff',
        fixedText: result.fixedJson,
        explanation: result.explanation,
      })
    } catch (error) {
      set({
        loading: false,
        errorMessage: error instanceof Error ? error.message : 'AI 修复失败',
      })
    }
  },

  applyFix: () => {
    const { fixedText } = get()
    import('./jsonStore').then((m) => {
      m.useJsonStore.getState().setJsonText(fixedText)
    })
    set({ mode: 'normal', fixedText: '', explanation: '', originalText: '' })
  },

  discardFix: () => {
    set({ mode: 'normal', fixedText: '', explanation: '', originalText: '' })
  },

  clearError: () => set({ errorMessage: '' }),
}))
