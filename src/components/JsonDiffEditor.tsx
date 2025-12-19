import { DiffEditor } from '@monaco-editor/react'

interface JsonDiffEditorProps {
    original: string
    modified: string
}

export function JsonDiffEditor({ original, modified }: JsonDiffEditorProps) {
    return (
        <DiffEditor
            height="100%"
            language="json"
            theme="vs-dark"
            original={original}
            modified={modified}
            options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: 'on',
                automaticLayout: true,
                readOnly: true,
                renderSideBySide: true,
            }}
        />
    )
}
