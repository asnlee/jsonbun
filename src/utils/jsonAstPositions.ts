import parse from 'json-to-ast'
import { generatePath } from './jsonPath'

export interface Position {
  line: number
  column: number
}

export interface Range {
  start: Position
  end: Position
}

export interface PathPosition {
  path: string
  keyRange?: Range
  valueRange: Range
}

/**
 * 构建 JSON AST 位置映射表
 */
export function buildPositionMap(jsonText: string): Map<string, PathPosition> {
  const positionMap = new Map<string, PathPosition>()

  try {
    const ast = parse(jsonText, { loc: true })
    traverse(ast, [], positionMap)
  } catch {
    // 解析失败，返回空映射
  }

  return positionMap
}

function traverse(
  node: unknown,
  currentPath: (string | number)[],
  positionMap: Map<string, PathPosition>
): void {
  if (!node || typeof node !== 'object') return

  const n = node as {
    type: string
    children?: unknown[]
    loc?: { start: { line: number; column: number }; end: { line: number; column: number } }
    key?: unknown
    value?: unknown
  }

  const path = generatePath(currentPath)

  // Map the current node's position if it has location data
  if (n.loc) {
    const valueRange: Range = {
      start: { line: n.loc.start.line, column: n.loc.start.column },
      end: { line: n.loc.end.line, column: n.loc.end.column },
    }

    let keyRange: Range | undefined
    if (n.key && typeof n.key === 'object') {
      const keyNode = n.key as {
        loc?: { start: { line: number; column: number }; end: { line: number; column: number } }
      }
      if (keyNode.loc) {
        keyRange = {
          start: { line: keyNode.loc.start.line, column: keyNode.loc.start.column },
          end: { line: keyNode.loc.end.line, column: keyNode.loc.end.column },
        }
      }
    }

    // Only set if not already set, or if this is a more specific node
    // Property nodes and Value nodes might share the same path
    positionMap.set(path, { path, keyRange, valueRange })
  }

  // Handle different node types
  switch (n.type) {
    case 'Object':
      if (n.children) {
        for (const child of n.children) {
          traverse(child, currentPath, positionMap)
        }
      }
      break
    case 'Array':
      if (n.children) {
        n.children.forEach((child, index) => {
          traverse(child, [...currentPath, index], positionMap)
        })
      }
      break
    case 'Property':
      if (n.key && typeof n.key === 'object') {
        const keyNode = n.key as { value?: string }
        if (typeof keyNode.value === 'string') {
          traverse(n.value, [...currentPath, keyNode.value], positionMap)
        }
      }
      break
    default:
      // For literal values, no further traversal needed
      break
  }
}

/**
 * 根据光标位置查找对应的 JSON 路径
 */
export function findPathByPosition(
  positionMap: Map<string, PathPosition>,
  line: number,
  column: number
): string | null {
  let bestMatch: { path: string; range: Range } | null = null
  let bestMatchSize = Infinity

  for (const { path, keyRange, valueRange } of positionMap.values()) {
    if (keyRange && isInRange(line, column, keyRange)) {
      const size = rangeSize(keyRange)
      if (size < bestMatchSize) {
        bestMatch = { path, range: keyRange }
        bestMatchSize = size
      }
    }

    if (isInRange(line, column, valueRange)) {
      const size = rangeSize(valueRange)
      if (size < bestMatchSize) {
        bestMatch = { path, range: valueRange }
        bestMatchSize = size
      }
    }
  }

  return bestMatch ? bestMatch.path : null
}

/**
 * 检查光标是否在某个范围内
 */
function isInRange(line: number, column: number, range: Range): boolean {
  if (line < range.start.line || line > range.end.line) return false

  if (line === range.start.line && column < range.start.column) return false
  if (line === range.end.line && column > range.end.column) return false

  return true
}

/**
 * 计算范围大小
 */
function rangeSize(range: Range): number {
  const lines = range.end.line - range.start.line
  const cols =
    lines === 0 ? range.end.column - range.start.column : range.end.column + 1000 * lines
  return cols
}

/**
 * 根据 JSON 路径获取位置范围
 */
export function getRangeByPath(
  positionMap: Map<string, PathPosition>,
  path: string
): Range | null {
  const pos = positionMap.get(path)
  return pos ? pos.valueRange : null
}
