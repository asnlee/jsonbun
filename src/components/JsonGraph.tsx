import { useEffect, useState, useCallback, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { JsonNode } from './JsonNode'
import { jsonToGraph, type NodeData } from '../utils/jsonToGraph'
import { useJsonStore } from '../stores/jsonStore'
import { useEditorStore } from '../stores/editorStore'
import { getRangeByPath } from '../utils/jsonAstPositions'
import { Search, X } from 'lucide-react'

const nodeTypes = {
  jsonNode: JsonNode,
}

interface JsonGraphProps {
  onNodeDoubleClick?: (path: string) => void
}

export function JsonGraph({ onNodeDoubleClick }: JsonGraphProps) {
  const parseState = useJsonStore((s) => s.parseState)
  const focusPath = useEditorStore((s) => s.focusPath)
  const revealAndHighlight = useEditorStore((s) => s.revealAndHighlight)
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [reactFlowInstance, setReactFlowInstance] = useState<unknown>(null)
  const nodesRef = useRef<Node<NodeData>[]>([])
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredNodeIds, setFilteredNodeIds] = useState<Set<string>>(new Set())
  const [highlightedPath, setHighlightedPath] = useState<string[]>([])

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    const handleToggleCollapse = (e: Event) => {
      const event = e as CustomEvent<{ path: string }>
      const path = event.detail.path
      setCollapsedNodes(prev => {
        const next = new Set(prev)
        if (next.has(path)) {
          next.delete(path)
        } else {
          next.add(path)
        }
        return next
      })
    }

    window.addEventListener('toggleNodeCollapse', handleToggleCollapse)
    return () => window.removeEventListener('toggleNodeCollapse', handleToggleCollapse)
  }, [])

  useEffect(() => {
    if (!parseState.valid) {
      setNodes([])
      setEdges([])
      return
    }

    const timer = setTimeout(() => {
      const { nodes: newNodes, edges: newEdges } = jsonToGraph(
        parseState.parsedValue,
        nodesRef.current,
        collapsedNodes
      )
      setNodes(newNodes)
      setEdges(newEdges)
    }, 250)

    return () => clearTimeout(timer)
  }, [parseState.valid, parseState.parsedValue, collapsedNodes, setNodes, setEdges])

  useEffect(() => {
    if (!searchQuery) {
      setFilteredNodeIds(new Set())
      return
    }

    const query = searchQuery.toLowerCase()
    const matchedIds = new Set<string>()
    const pathIds = new Set<string>()

    nodesRef.current.forEach(node => {
      const label = node.data.label.toLowerCase()
      const path = node.data.path.toLowerCase()
      const entries = node.data.entries.map(e => `${e.key}:${e.value}`.toLowerCase())

      if (
        label.includes(query) ||
        path.includes(query) ||
        entries.some(e => e.includes(query))
      ) {
        matchedIds.add(node.id)
      }
    })

    matchedIds.forEach(nodeId => {
      pathIds.add(nodeId)
      let currentPath = nodeId
      while (currentPath) {
        const parentEdge = edges.find(e => e.target === currentPath)
        if (parentEdge) {
          pathIds.add(parentEdge.source)
          currentPath = parentEdge.source
        } else {
          break
        }
      }
    })

    setFilteredNodeIds(pathIds)
  }, [searchQuery, edges])

  useEffect(() => {
    if (!focusPath || !reactFlowInstance) return

    const currentNodes = nodesRef.current

    let targetNode = currentNodes.find((n) => n.data.path === focusPath)

    if (!targetNode && focusPath.length > 1) {
      let parentPath = focusPath
      while (parentPath.includes('.') || parentPath.includes('[')) {
        if (parentPath.endsWith(']')) {
          parentPath = parentPath.substring(0, parentPath.lastIndexOf('['))
        } else {
          parentPath = parentPath.substring(0, parentPath.lastIndexOf('.'))
        }

        if (!parentPath) break

        const parent = currentNodes.find((n) => n.data.path === parentPath)
        if (parent) {
          targetNode = parent
          break
        }
      }
    }

    if (targetNode) {
      const flow = reactFlowInstance as { fitView: (options?: unknown) => void }

      const pathToNode: string[] = []
      let currentPath = targetNode.data.path
      while (currentPath) {
        pathToNode.unshift(currentPath)
        const parentEdge = edges.find(e => e.target === currentPath)
        currentPath = parentEdge ? parentEdge.source : ''
      }
      setHighlightedPath(pathToNode)

      setTimeout(() => setHighlightedPath([]), 3000)

      setNodes((nds) => {
        const needsUpdate = nds.some(n => {
          const isTarget = n.id === targetNode!.id
          return (!!n.selected) !== isTarget || (n.zIndex === 10) !== isTarget
        })

        if (!needsUpdate) return nds

        setTimeout(() => {
          flow.fitView({
            nodes: [{ id: targetNode!.id }],
            padding: 0.5,
            duration: 800,
            maxZoom: 1.2,
          })
        }, 50)

        return nds.map((n) => ({
          ...n,
          selected: n.id === targetNode!.id,
          zIndex: n.id === targetNode!.id ? 10 : 0,
        }))
      })
    }
  }, [focusPath, reactFlowInstance, setNodes, edges])

  const onNodeClick = useCallback(
    (_: unknown, node: Node<NodeData>) => {
      try {
        const currentPositions = useJsonStore.getState().parseState.positions
        const range = getRangeByPath(currentPositions, node.data.path)
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
    (_: unknown, node: Node<NodeData>) => {
      onNodeDoubleClick?.(node.data.path)
    },
    [onNodeDoubleClick]
  )

  if (!parseState.valid) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        JSON 不合法,无法生成图表
      </div>
    )
  }

  const displayNodes = searchQuery && filteredNodeIds.size > 0
    ? nodes.map(n => ({
      ...n,
      style: {
        ...n.style,
        opacity: filteredNodeIds.has(n.id) ? 1 : 0.3,
      },
    }))
    : nodes

  const displayEdges = edges.map(e => {
    const isHighlightedPath = highlightedPath.includes(e.source) && highlightedPath.includes(e.target)
    const isSearchPath = searchQuery && filteredNodeIds.size > 0 &&
                         filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)

    return {
      ...e,
      animated: !!(isHighlightedPath || isSearchPath),
      style: {
        ...e.style,
        stroke: isHighlightedPath ? '#6366f1' : isSearchPath ? '#10b981' : '#52525b',
        strokeWidth: isHighlightedPath || isSearchPath ? 2.5 : 1.5,
        opacity: searchQuery && filteredNodeIds.size > 0 && !isSearchPath ? 0.3 : 1,
      },
    }
  })

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 flex items-center gap-2">
          <Search size={16} className="text-zinc-400" />
          <input
            type="text"
            placeholder="搜索节点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-zinc-100 outline-none w-40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-zinc-400 hover:text-zinc-100"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {searchQuery && filteredNodeIds.size > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300">
          找到 {filteredNodeIds.size} 个节点
        </div>
      )}

      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        panOnScroll={true}
        selectionOnDrag={false}
        panOnDrag={true}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
