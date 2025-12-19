import { create } from 'zustand'
import type { editor } from 'monaco-editor'
import type { Monaco } from '@monaco-editor/react'

interface EditorStore {
  editor: editor.IStandaloneCodeEditor | null
  monaco: Monaco | null
  focusPath: string | null
  setEditor: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void
  setFocusPath: (path: string | null) => void
  revealAndHighlight: (lineNumber: number, column: number) => void
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  editor: null,
  monaco: null,
  focusPath: null,

  setEditor: (editor, monaco) => set({ editor, monaco }),

  setFocusPath: (path) => set({ focusPath: path }),

  revealAndHighlight: (lineNumber, column) => {
    const { editor } = get()
    if (!editor) return

    const position = { lineNumber, column }
    editor.setPosition(position)
    editor.revealPositionInCenter(position)

    const range = {
      startLineNumber: lineNumber,
      startColumn: column,
      endLineNumber: lineNumber,
      endColumn: column + 1,
    }

    editor.setSelection(range)
    editor.focus()
  },
}))
