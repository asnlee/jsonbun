import { memo, useState } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import type { NodeData } from '../utils/jsonToGraph'
import { getKindColor } from '../utils/jsonToGraph'
import { Copy, Check, ChevronRight } from 'lucide-react'
import { useEditorStore } from '../stores/editorStore'
import { useJsonStore } from '../stores/jsonStore'
import { getRangeByPath } from '../utils/jsonAstPositions'

const CopyButton = ({ value }: { value: unknown }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // 复制失败，静默处理
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-zinc-700 rounded transition-colors text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100"
      title="复制内容"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  )
}

export const JsonNode = memo(({ data, selected }: NodeProps<NodeData>) => {
  const { label, kind, entries, collapsed, childCount } = data
  const borderColor = getKindColor(kind)
  const revealAndHighlight = useEditorStore((s) => s.revealAndHighlight)
  const positions = useJsonStore((s) => s.parseState.positions)

  const handleEntryClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation()
    const range = getRangeByPath(positions, path)

    if (range && range.start) {
      setTimeout(() => {
        revealAndHighlight(range.start.line, range.start.column)
      }, 0)
    }
  }

  const handleEntryDoubleClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation()
    const event = new CustomEvent('editValue', { detail: { path } })
    window.dispatchEvent(event)
  }

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation()
    const event = new CustomEvent('toggleNodeCollapse', { detail: { path: data.path } })
    window.dispatchEvent(event)
  }

  const hasChildren = childCount > 0

  return (
    <div
      className={`bg-zinc-900 border-2 rounded-lg p-3 min-w-[200px] transition-all ${selected ? 'ring-2 ring-indigo-500' : ''
        }`}
      style={{ borderColor }}
    >
      <Handle type="target" position={Position.Left} />

      <div className="flex items-center gap-2 mb-2">
        {hasChildren && (
          <button
            onClick={handleToggleCollapse}
            className="p-0.5 hover:bg-zinc-700 rounded transition-all"
            title={collapsed ? '展开' : '折叠'}
          >
            <ChevronRight
              size={14}
              className={`transition-transform duration-200 ${
                collapsed ? 'rotate-0' : 'rotate-90'
              }`}
            />
          </button>
        )}
        <span className="font-semibold text-zinc-100">{label}</span>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ backgroundColor: borderColor, color: '#000' }}
        >
          {kind}
        </span>
        {hasChildren && (
          <span className="text-xs text-zinc-500">
            ({childCount} {collapsed ? 'hidden' : 'children'})
          </span>
        )}
      </div>

      {entries.length > 0 && (
        <div className="space-y-1 text-sm">
          {entries.map((entry, index) => (
            <div
              key={index}
              onClick={(e) => handleEntryClick(e, entry.path)}
              onDoubleClick={(e) => handleEntryDoubleClick(e, entry.path)}
              className="flex items-center gap-2 text-zinc-300 hover:bg-zinc-800 px-2 py-1 rounded relative group cursor-pointer"
            >
              <span className="font-mono text-zinc-400">{entry.key}:</span>
              <span
                className="font-mono flex-1 truncate"
                style={{ color: getKindColor(entry.kind) }}
              >
                {String(entry.value)}
              </span>

              <CopyButton value={entry.rawValue} />

              {entry.isRef && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={entry.key}
                  className="!w-2 !h-2 !bg-indigo-500 opacity-0 group-hover:opacity-100"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

JsonNode.displayName = 'JsonNode'
