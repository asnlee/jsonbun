import { useState, useCallback, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import { useJsonStore } from '../stores/jsonStore'
import { useEditorStore } from '../stores/editorStore'
import { getRangeByPath } from '../utils/jsonAstPositions'
import { generatePath } from '../utils/jsonPath'
import { getKindColor, type ValueKind } from '../utils/jsonToGraph'

interface TreeNode {
  key: string
  value: unknown
  path: string
  kind: ValueKind
  children?: TreeNode[]
  isExpandable: boolean
}

interface JsonTreeProps {
  onNodeDoubleClick?: (path: string) => void
}

function getKind(value: unknown): ValueKind {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  const t = typeof value
  if (t === 'object') return 'object'
  if (t === 'string') return 'string'
  if (t === 'number') return 'number'
  if (t === 'boolean') return 'boolean'
  return 'unknown'
}

function formatValue(value: unknown, kind: ValueKind): string {
  if (kind === 'string') return `"${value}"`
  if (kind === 'null') return 'null'
  return String(value)
}

function buildTreeNodes(value: unknown, path: (string | number)[] = []): TreeNode[] {
  const nodes: TreeNode[] = []
  const kind = getKind(value)

  if (kind === 'object') {
    const obj = value as Record<string, unknown>
    for (const [key, val] of Object.entries(obj)) {
      const childPath = [...path, key]
      const childKind = getKind(val)
      const isExpandable = childKind === 'object' || childKind === 'array'

      nodes.push({
        key,
        value: val,
        path: generatePath(childPath),
        kind: childKind,
        children: isExpandable ? buildTreeNodes(val, childPath) : undefined,
        isExpandable,
      })
    }
  } else if (kind === 'array') {
    const arr = value as unknown[]
    arr.forEach((val, index) => {
      const childPath = [...path, index]
      const childKind = getKind(val)
      const isExpandable = childKind === 'object' || childKind === 'array'

      nodes.push({
        key: String(index),
        value: val,
        path: generatePath(childPath),
        kind: childKind,
        children: isExpandable ? buildTreeNodes(val, childPath) : undefined,
        isExpandable,
      })
    })
  }

  return nodes
}

function TreeNodeComponent({
  node,
  level,
  onNodeClick,
  onNodeDoubleClick,
  focusPath,
}: {
  node: TreeNode
  level: number
  onNodeClick: (path: string) => void
  onNodeDoubleClick: (path: string) => void
  focusPath: string | null
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const isFocused = focusPath === node.path

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (node.isExpandable) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleClick = () => {
    onNodeClick(node.path)
  }

  const handleDoubleClick = () => {
    onNodeDoubleClick(node.path)
  }

  const kindColor = getKindColor(node.kind)
  const paddingLeft = level * 20 + 8

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-zinc-800/50 transition-colors ${
          isFocused ? 'bg-indigo-600/30 border-l-2 border-indigo-500' : ''
        }`}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {node.isExpandable ? (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-zinc-700 rounded transition-all"
          >
            <ChevronRight
              size={14}
              className={`text-zinc-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : 'rotate-0'
              }`}
            />
          </button>
        ) : (
          <div className="w-4 h-4 flex-shrink-0" />
        )}

        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: kindColor }}
        />

        <span className="text-zinc-300 font-medium flex-shrink-0">{node.key}:</span>

        {node.isExpandable ? (
          <span className="text-zinc-500 text-sm">
            {node.kind === 'object'
              ? `{${Object.keys(node.value as Record<string, unknown>).length} keys}`
              : `[${(node.value as unknown[]).length} items]`}
          </span>
        ) : (
          <span
            className="text-sm truncate"
            style={{ color: kindColor }}
          >
            {formatValue(node.value, node.kind)}
          </span>
        )}
      </div>

      {node.isExpandable && node.children && (
        <div
          className={`transition-all duration-200 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {node.children.map((child, index) => (
            <TreeNodeComponent
              key={`${child.path}-${index}`}
              node={child}
              level={level + 1}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              focusPath={focusPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function JsonTree({ onNodeDoubleClick }: JsonTreeProps) {
  const parseState = useJsonStore((s) => s.parseState)
  const focusPath = useEditorStore((s) => s.focusPath)
  const revealAndHighlight = useEditorStore((s) => s.revealAndHighlight)
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([])

  useEffect(() => {
    if (!parseState.valid) {
      setTreeNodes([])
      return
    }

    const timer = setTimeout(() => {
      const nodes = buildTreeNodes(parseState.parsedValue)
      setTreeNodes(nodes)
    }, 250)

    return () => clearTimeout(timer)
  }, [parseState.valid, parseState.parsedValue])

  const handleNodeClick = useCallback(
    (path: string) => {
      try {
        const currentPositions = useJsonStore.getState().parseState.positions
        const range = getRangeByPath(currentPositions, path)
        if (range && range.start) {
          revealAndHighlight(range.start.line, range.start.column)
        }
      } catch (error) {
        // 静默处理错误
      }
    },
    [revealAndHighlight]
  )

  const handleNodeDoubleClick = useCallback(
    (path: string) => {
      onNodeDoubleClick?.(path)
    },
    [onNodeDoubleClick]
  )

  if (!parseState.valid) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        JSON 不合法,无法生成树状图
      </div>
    )
  }

  const rootKind = getKind(parseState.parsedValue)
  const rootColor = getKindColor(rootKind)

  return (
    <div className="h-full overflow-auto bg-zinc-950">
      <div
        className={`flex items-center gap-2 px-2 py-2 border-b border-zinc-800 ${
          focusPath === '$' ? 'bg-indigo-600/30' : ''
        }`}
        onClick={() => handleNodeClick('$')}
        onDoubleClick={() => handleNodeDoubleClick('$')}
      >
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: rootColor }}
        />
        <span className="text-zinc-200 font-bold">root</span>
        <span className="text-zinc-500 text-sm">
          {rootKind === 'object'
            ? `{${Object.keys(parseState.parsedValue as Record<string, unknown>).length} keys}`
            : rootKind === 'array'
            ? `[${(parseState.parsedValue as unknown[]).length} items]`
            : ''}
        </span>
      </div>

      <div className="py-2">
        {treeNodes.map((node, index) => (
          <TreeNodeComponent
            key={`${node.path}-${index}`}
            node={node}
            level={0}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            focusPath={focusPath}
          />
        ))}
      </div>
    </div>
  )
}
