import Editor, { type OnMount } from '@monaco-editor/react'
import { useJsonStore } from '../stores/jsonStore'
import { useEditorStore } from '../stores/editorStore'
import { findPathByPosition } from '../utils/jsonAstPositions'

export function JsonEditor() {
  const jsonText = useJsonStore((s) => s.jsonText)
  const setJsonText = useJsonStore((s) => s.setJsonText)
  const setEditor = useEditorStore((s) => s.setEditor)
  const setFocusPath = useEditorStore((s) => s.setFocusPath)

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    setEditor(editor, monaco)

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      trailingCommas: 'error',
    })

    editor.onDidChangeCursorPosition((e) => {
      const currentState = useJsonStore.getState().parseState
      if (!currentState.valid) return
      const { lineNumber, column } = e.position
      const path = findPathByPosition(currentState.positions, lineNumber, column)
      setFocusPath(path)
    })
  }

  return (
    <Editor
      height="100%"
      defaultLanguage="json"
      theme="vs-dark"
      value={jsonText}
      onChange={(value) => setJsonText(value || '')}
      onMount={handleEditorDidMount}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        wordWrap: 'on',
        tabSize: 2,
        automaticLayout: true,
        padding: { top: 12, bottom: 12 },
      }}
    />
  )
}
