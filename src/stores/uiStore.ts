import { create } from 'zustand'

export type ViewMode = 'graph' | 'tree'

interface UiStore {
  leftPaneWidth: number
  leftPaneCollapsed: boolean
  compareModalOpen: boolean
  viewMode: ViewMode
  setLeftPaneWidth: (width: number) => void
  toggleLeftPaneCollapsed: () => void
  setCompareModalOpen: (open: boolean) => void
  setViewMode: (mode: ViewMode) => void
  resetLayout: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  leftPaneWidth: 35,
  leftPaneCollapsed: false,
  compareModalOpen: false,
  viewMode: 'graph',

  setLeftPaneWidth: (width) => set({ leftPaneWidth: width }),

  toggleLeftPaneCollapsed: () =>
    set((state) => ({ leftPaneCollapsed: !state.leftPaneCollapsed })),

  setCompareModalOpen: (open: boolean) => set({ compareModalOpen: open }),

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

  resetLayout: () =>
    set({
      leftPaneWidth: 35,
      leftPaneCollapsed: false,
    }),
}))
