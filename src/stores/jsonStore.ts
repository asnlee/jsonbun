import { create } from 'zustand'
import { buildPositionMap, type PathPosition } from '../utils/jsonAstPositions'

interface ParseState {
  valid: boolean
  errorMessage: string
  parsedValue: unknown
  positions: Map<string, PathPosition>
}

interface JsonStore {
  jsonText: string
  parseState: ParseState
  setJsonText: (text: string) => void
  formatJson: () => void
}

const defaultJson = `{
  "name": "示例",
  "enabled": true,
  "count": 3,
  "items": ["a", "b", "c"],
  "meta": {
    "owner": "you",
    "tags": ["json", "graph"]
  }
}`

function parseJson(text: string): ParseState {
  if (!text.trim()) {
    return {
      valid: false,
      errorMessage: 'JSON 不能为空',
      parsedValue: null,
      positions: new Map(),
    }
  }

  try {
    const parsed = JSON.parse(text)
    const positions = buildPositionMap(text)
    return {
      valid: true,
      errorMessage: '',
      parsedValue: parsed,
      positions,
    }
  } catch (error) {
    return {
      valid: false,
      errorMessage: error instanceof Error ? error.message : 'JSON 解析错误',
      parsedValue: null,
      positions: new Map(),
    }
  }
}

export const useJsonStore = create<JsonStore>((set) => ({
  jsonText: defaultJson,
  parseState: parseJson(defaultJson),

  setJsonText: (text: string) => {
    const parseState = parseJson(text)
    set({ jsonText: text, parseState })
  },

  formatJson: () =>
    set((state) => {
      if (!state.parseState.valid) return state
      try {
        const formatted = JSON.stringify(state.parseState.parsedValue, null, 2)
        return {
          jsonText: formatted,
          parseState: parseJson(formatted),
        }
      } catch {
        return state
      }
    }),
}))
