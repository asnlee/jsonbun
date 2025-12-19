/**
 * 检查字符串是否是安全的标识符
 * 仅包含字母、数字、下划线、$ 符号，首字符必须是字母、下划线或 $ 符号
 */
export function isSafeIdentifier(key: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
}

/**
 * 转义字符串中的特殊字符
 */
function escapeString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * 生成 JSON 路径
 * @param path 路径数组 [key1, key2, 0, key3]
 * @returns JSON 路径字符串 ($.key1.key2[0].key3)
 */
export function generatePath(path: (string | number)[]): string {
  if (path.length === 0) return '$'

  let result = '$'
  for (const segment of path) {
    if (typeof segment === 'number') {
      result += `[${segment}]`
    } else if (isSafeIdentifier(segment)) {
      result += `.${segment}`
    } else {
      result += `["${escapeString(segment)}"]`
    }
  }
  return result
}

/**
 * 解析 JSON 路径为 token 数组
 * 支持: $.foo.bar, $["foo"], $[0], $.foo["bar baz"]
 */
export function parsePath(path: string): (string | number)[] {
  if (!path.startsWith('$')) {
    throw new Error('Path must start with $')
  }

  const tokens: (string | number)[] = []
  let i = 1

  while (i < path.length) {
    const char = path[i]

    if (char === '.') {
      i++
      let key = ''
      while (i < path.length && /[a-zA-Z0-9_$]/.test(path[i])) {
        key += path[i]
        i++
      }
      if (key) tokens.push(key)
    } else if (char === '[') {
      i++
      if (path[i] === '"') {
        i++
        let key = ''
        while (i < path.length) {
          if (path[i] === '\\' && i + 1 < path.length) {
            i++
            key += path[i]
            i++
          } else if (path[i] === '"') {
            i++
            break
          } else {
            key += path[i]
            i++
          }
        }
        tokens.push(key)
        if (path[i] === ']') i++
      } else {
        let indexStr = ''
        while (i < path.length && path[i] !== ']') {
          indexStr += path[i]
          i++
        }
        const index = parseInt(indexStr, 10)
        if (!isNaN(index)) {
          tokens.push(index)
        }
        if (path[i] === ']') i++
      }
    } else {
      i++
    }
  }

  return tokens
}

/**
 * 从对象中根据路径获取值
 */
export function getValueByPath(obj: unknown, path: string): unknown {
  const tokens = parsePath(path)
  let current: unknown = obj

  for (const token of tokens) {
    if (current === null || current === undefined) return undefined
    if (typeof current === 'object') {
      current = (current as Record<string | number, unknown>)[token]
    } else {
      return undefined
    }
  }

  return current
}
