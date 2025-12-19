import type { Node, Edge } from 'reactflow'
import { generatePath } from './jsonPath'

export type ValueKind = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'unknown'

export interface EntryData {
  key: string
  value: unknown
  rawValue: unknown
  kind: ValueKind
  isRef: boolean
  path: string
}

export interface NodeData {
  path: string
  label: string
  kind: ValueKind
  entries: EntryData[]
  depth: number
  collapsed: boolean
  childCount: number
}

/**
 * 获取值的类型
 */
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

/**
 * 格式化值显示
 */
function formatValue(value: unknown, kind: ValueKind): string {
  if (kind === 'object') {
    const keys = Object.keys(value as Record<string, unknown>)
    return keys.length === 0 ? 'Empty' : `{${keys.length} keys}`
  }
  if (kind === 'array') {
    const arr = value as unknown[]
    return arr.length === 0 ? 'Empty' : `[${arr.length} items]`
  }
  if (kind === 'string') return `"${value}"`
  if (kind === 'null') return 'null'
  return String(value)
}

/**
 * 获取节点类型颜色
 */
export function getKindColor(kind: ValueKind): string {
  switch (kind) {
    case 'object':
      return '#06b6d4' // cyan-500
    case 'array':
      return '#8b5cf6' // violet-500
    case 'string':
      return '#10b981' // emerald-500
    case 'number':
      return '#f59e0b' // amber-500
    case 'boolean':
      return '#ec4899' // pink-500
    case 'null':
      return '#64748b' // slate-500
    default:
      return '#71717a' // zinc-500
  }
}

/**
 * 将 JSON 转换为 ReactFlow 节点和边
 */
export function jsonToGraph(
  value: unknown,
  existingNodes?: Node<NodeData>[],
  collapsedNodes?: Set<string>
): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const nodes: Node<NodeData>[] = []
  const edges: Edge[] = []
  const existingPositions = new Map<string, { x: number; y: number }>()
  const existingCollapsed = new Map<string, boolean>()

  if (existingNodes) {
    for (const node of existingNodes) {
      existingPositions.set(node.id, node.position)
      existingCollapsed.set(node.id, node.data.collapsed)
    }
  }

  const collapsedSet = collapsedNodes || new Set(
    Array.from(existingCollapsed.entries())
      .filter(([, collapsed]) => collapsed)
      .map(([id]) => id)
  )

  traverse(value, [], 0)

  const visibleNodes = filterCollapsedNodes(nodes, edges, collapsedSet)

  layoutNodes(visibleNodes.nodes)
  mergeNodePositions(visibleNodes.nodes, existingPositions)

  return visibleNodes

  function traverse(
    current: unknown,
    path: (string | number)[],
    depth: number,
  ): number {
    const kind = getKind(current)
    if (kind !== 'object' && kind !== 'array') return 0

    const pathStr = generatePath(path)
    const label = path.length === 0 ? 'root' : String(path[path.length - 1])
    const entries: EntryData[] = []
    let totalChildren = 0

    if (kind === 'object') {
      const obj = current as Record<string, unknown>
      for (const [key, val] of Object.entries(obj)) {
        const valKind = getKind(val)
        const isRef = valKind === 'object' || valKind === 'array'
        const entryPath = generatePath([...path, key])
        entries.push({
          key,
          value: isRef ? formatValue(val, valKind) : val,
          rawValue: val,
          kind: valKind,
          isRef,
          path: entryPath,
        })

        if (isRef) {
          const childCount = traverse(val, [...path, key], depth + 1)
          totalChildren += childCount + 1
          const childPath = entryPath
          edges.push({
            id: `${pathStr}::${key}->${childPath}`,
            source: pathStr,
            target: childPath,
            sourceHandle: `${key}`,
            animated: true,
            style: { stroke: '#52525b', strokeWidth: 1.5 },
          })
        }
      }
    }

    if (kind === 'array') {
      const arr = current as unknown[]
      arr.forEach((val, index) => {
        const valKind = getKind(val)
        const isRef = valKind === 'object' || valKind === 'array'
        const entryPath = generatePath([...path, index])
        entries.push({
          key: String(index),
          value: isRef ? formatValue(val, valKind) : val,
          rawValue: val,
          kind: valKind,
          isRef,
          path: entryPath,
        })

        if (isRef) {
          const childCount = traverse(val, [...path, index], depth + 1)
          totalChildren += childCount + 1
          const childPath = entryPath
          edges.push({
            id: `${pathStr}::${index}->${childPath}`,
            source: pathStr,
            target: childPath,
            sourceHandle: `${index}`,
            animated: true,
            style: { stroke: '#52525b', strokeWidth: 1.5 },
          })
        }
      })
    }

    const collapsed = collapsedSet.has(pathStr)

    nodes.push({
      id: pathStr,
      type: 'jsonNode',
      data: { path: pathStr, label, kind, entries, depth, collapsed, childCount: totalChildren },
      position: { x: 0, y: 0 },
    })

    return totalChildren
  }
}

/**
 * 过滤被折叠节点的子节点
 */
function filterCollapsedNodes(
  nodes: Node<NodeData>[],
  edges: Edge[],
  collapsedSet: Set<string>
): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const hiddenNodes = new Set<string>()

  function markHidden(nodeId: string) {
    if (hiddenNodes.has(nodeId)) return
    hiddenNodes.add(nodeId)
    edges
      .filter(e => e.source === nodeId)
      .forEach(e => markHidden(e.target))
  }

  collapsedSet.forEach(nodeId => {
    edges
      .filter(e => e.source === nodeId)
      .forEach(e => markHidden(e.target))
  })

  const visibleNodes = nodes.filter(n => !hiddenNodes.has(n.id))
  const visibleEdges = edges.filter(e => !hiddenNodes.has(e.target))

  return { nodes: visibleNodes, edges: visibleEdges }
}

/**
 * 自动布局节点
 */
function layoutNodes(nodes: Node<NodeData>[]): void {
  const layers = new Map<number, Node<NodeData>[]>()

  for (const node of nodes) {
    const depth = node.data.depth
    if (!layers.has(depth)) {
      layers.set(depth, [])
    }
    layers.get(depth)!.push(node)
  }

  const horizontalSpacing = 400
  const nodeGap = 40

  for (const [depth, layerNodes] of layers.entries()) {
    const x = depth * horizontalSpacing

    const nodeHeights = layerNodes.map(node => 60 + node.data.entries.length * 36)
    const totalHeight = nodeHeights.reduce((sum, h) => sum + h, 0) + (layerNodes.length - 1) * nodeGap

    let currentY = -totalHeight / 2

    layerNodes.forEach((node, index) => {
      node.position.x = x
      node.position.y = currentY
      currentY += nodeHeights[index] + nodeGap
    })
  }
}

/**
 * 合并用户拖动后的节点位置
 */
function mergeNodePositions(
  nodes: Node<NodeData>[],
  existingPositions: Map<string, { x: number; y: number }>
): void {
  for (const node of nodes) {
    const existing = existingPositions.get(node.id)
    if (existing) {
      node.position = existing
    }
  }
}
