import { parsePath } from './jsonPath'

/**
 * 根据路径和新值更新 JSON 对象 (不可变更新)
 */
export function updateValueByPath(
  obj: unknown,
  path: string,
  newValue: unknown
): unknown {
  const tokens = parsePath(path)
  if (tokens.length === 0) return newValue

  return updateRecursive(obj, tokens, 0, newValue)
}

/**
 * 根据路径获取值
 */
export function getValueByPath(obj: unknown, path: string): unknown {
  const tokens = parsePath(path)
  let current = obj

  for (const token of tokens) {
    if (current === null || typeof current !== 'object') {
      return undefined
    }

    if (Array.isArray(current)) {
      if (typeof token !== 'number') return undefined
      current = current[token]
    } else {
      if (typeof token !== 'string') return undefined
      const record = current as Record<string, unknown>
      if (!(token in record)) return undefined
      current = record[token]
    }
  }

  return current
}

function updateRecursive(
  current: unknown,
  tokens: (string | number)[],
  index: number,
  newValue: unknown
): unknown {
  if (index === tokens.length) return newValue

  const token = tokens[index]

  if (Array.isArray(current)) {
    if (typeof token !== 'number') {
      throw new Error(`Expected array index, got ${token}`)
    }
    if (token < 0 || token >= current.length) {
      throw new Error(`Array index out of bounds: ${token}`)
    }
    const newArray = [...current]
    newArray[token] = updateRecursive(current[token], tokens, index + 1, newValue)
    return newArray
  }

  if (current !== null && typeof current === 'object') {
    if (typeof token !== 'string') {
      throw new Error(`Expected object key, got ${token}`)
    }
    const newObj = { ...current } as Record<string, unknown>
    newObj[token] = updateRecursive(
      (current as Record<string, unknown>)[token],
      tokens,
      index + 1,
      newValue
    )
    return newObj
  }

  throw new Error('Cannot update value: target is not an object or array')
}

/**
 * 解析用户输入的值
 */
export function parseValue(input: string, expectedType: string): unknown {
  if (expectedType === 'string') {
    return input
  }

  if (expectedType === 'number') {
    const num = Number(input)
    if (isNaN(num)) {
      throw new Error('Invalid number')
    }
    return num
  }

  if (expectedType === 'boolean') {
    if (input === 'true') return true
    if (input === 'false') return false
    throw new Error('Invalid boolean, must be "true" or "false"')
  }

  if (expectedType === 'null') {
    if (input === 'null') return null
    throw new Error('Invalid null, must be "null"')
  }

  if (expectedType === 'object' || expectedType === 'array') {
    try {
      return JSON.parse(input)
    } catch {
      throw new Error('Invalid JSON')
    }
  }

  throw new Error(`Unknown type: ${expectedType}`)
}

/**
 * 获取值的类型
 */
export function getValueType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}
