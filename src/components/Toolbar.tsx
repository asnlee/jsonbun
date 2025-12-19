import { FileJson, Settings, Wand2, ArrowRightLeft, LayoutPanelLeft, Check, X, RotateCcw } from 'lucide-react'
import { useJsonStore } from '../stores/jsonStore'
import { useAiFixStore } from '../stores/aiFixStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUiStore } from '../stores/uiStore'
import { useCompareStore } from '../stores/compareStore'

export function Toolbar() {
  const parseState = useJsonStore((s) => s.parseState)
  const formatJson = useJsonStore((s) => s.formatJson)
  const jsonText = useJsonStore((s) => s.jsonText)

  const aiFixMode = useAiFixStore((s) => s.mode)
  const loading = useAiFixStore((s) => s.loading)
  const jsonrepair = useAiFixStore((s) => s.jsonrepair)
  const requestFix = useAiFixStore((s) => s.requestFix)
  const applyFix = useAiFixStore((s) => s.applyFix)
  const discardFix = useAiFixStore((s) => s.discardFix)

  const setSettingsOpen = useSettingsStore((s) => s.setOpen)

  const setCompareModalOpen = useUiStore((s) => s.setCompareModalOpen)
  const leftPaneCollapsed = useUiStore((s) => s.leftPaneCollapsed)
  const toggleLeftPaneCollapsed = useUiStore((s) => s.toggleLeftPaneCollapsed)
  const resetLayout = useUiStore((s) => s.resetLayout)

  const compareActive = useCompareStore((s) => s.active)
  const closeCompare = useCompareStore((s) => s.close)

  const handleFormat = () => {
    if (parseState.valid) {
      formatJson()
    }
  }

  const handleFix = async () => {
    if (!parseState.valid) {
      try {
        jsonrepair(jsonText)
      } catch (error) {
        await requestFix(jsonText)
      }
    }
  }

  // Render different toolbars based on mode
  if (aiFixMode === 'diff') {
    return (
      <div className="h-14 bg-zinc-900 border-b border-zinc-700 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-zinc-100">AI 修复预览</span>
          <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 text-xs font-medium">Review Changes</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={discardFix}
            className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 flex items-center gap-2"
          >
            <X size={16} />
            <span>放弃</span>
          </button>
          <button
            onClick={applyFix}
            className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2"
          >
            <Check size={16} />
            <span>应用更改</span>
          </button>
        </div>
      </div>
    )
  }

  if (compareActive) {
    return (
      <div className="h-14 bg-zinc-900 border-b border-zinc-700 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-zinc-100">JSON 对比</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={closeCompare}
            className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 flex items-center gap-2"
          >
            <X size={16} />
            <span>关闭对比</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-14 bg-zinc-900 border-b border-zinc-700 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <FileJson className="text-indigo-500" size={24} />
        <span className="text-xl font-bold text-zinc-100 hidden sm:inline">Bun Json 可视化编辑器</span>
        <div
          className={`px-2 py-1 rounded text-xs font-medium ${parseState.valid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}
        >
          {parseState.valid ? '合法' : '错误'}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={resetLayout}
          className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
          title="重置布局"
        >
          <RotateCcw size={16} />
        </button>

        <button
          onClick={toggleLeftPaneCollapsed}
          className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
          title={leftPaneCollapsed ? "显示代码" : "隐藏代码"}
        >
          <LayoutPanelLeft size={16} className={leftPaneCollapsed ? "opacity-50" : ""} />
        </button>

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        <button
          onClick={() => setSettingsOpen(true)}
          className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 flex items-center gap-2"
        >
          <Settings size={16} />
          <span className="hidden sm:inline">设置</span>
        </button>

        <button
          onClick={() => setCompareModalOpen(true)}
          className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 flex items-center gap-2"
        >
          <ArrowRightLeft size={16} />
          <span className="hidden sm:inline">对比</span>
        </button>

        <button
          onClick={handleFormat}
          disabled={!parseState.valid}
          className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span className="hidden sm:inline">格式化</span>
          <span className="sm:hidden">fmt</span>
        </button>

        <button
          onClick={handleFix}
          disabled={parseState.valid || loading}
          className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wand2 size={16} />
          <span className="hidden sm:inline">{loading ? '修复中' : '快速修复'}</span>
          <span className="sm:hidden">AI</span>
        </button>
      </div>
    </div>
  )
}
