import { useRef, useState, useEffect } from 'react'
import { Toolbar } from './components/Toolbar'
import { JsonEditor } from './components/JsonEditor'
import { JsonGraph } from './components/JsonGraph'
import { JsonTree } from './components/JsonTree'
import { SettingsModal } from './components/SettingsModal'
import { JsonDiffEditor } from './components/JsonDiffEditor'
import { CompareModal } from './components/CompareModal'
import { EditValueModal } from './components/EditValueModal'
import { useJsonStore } from './stores/jsonStore'
import { useAiFixStore } from './stores/aiFixStore'
import { useCompareStore } from './stores/compareStore'
import { useUiStore } from './stores/uiStore'
import { Network, List } from 'lucide-react'

function App() {
  const parseState = useJsonStore((s) => s.parseState)

  // Stores
  const aiFixMode = useAiFixStore((s) => s.mode)
  const aiOriginal = useAiFixStore((s) => s.originalText)
  const aiFixed = useAiFixStore((s) => s.fixedText)
  const aiExplanation = useAiFixStore((s) => s.explanation)

  const compareActive = useCompareStore((s) => s.active)
  const compareLeft = useCompareStore((s) => s.leftText)
  const compareRight = useCompareStore((s) => s.rightText)

  const leftPaneWidth = useUiStore((s) => s.leftPaneWidth)
  const leftPaneCollapsed = useUiStore((s) => s.leftPaneCollapsed)
  const setLeftPaneWidth = useUiStore((s) => s.setLeftPaneWidth)
  const viewMode = useUiStore((s) => s.viewMode)
  const setViewMode = useUiStore((s) => s.setViewMode)

  // Resizable logic
  const containerRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)

  const handleMouseDown = () => {
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleMouseUp = () => {
    isResizing.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current || !containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
    if (newWidth >= 10 && newWidth <= 90) {
      setLeftPaneWidth(newWidth)
    }
  }

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', handleMouseMove)

    const handleEditValue = (e: Event) => {
      const customEvent = e as CustomEvent<{ path: string }>
      setEditPath(customEvent.detail.path)
      setIsEditModalOpen(true)
    }
    window.addEventListener('editValue', handleEditValue)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('editValue', handleEditValue)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Edit Value Modal State
  const [editPath, setEditPath] = useState<string>('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleNodeDoubleClick = (path: string) => {
    setEditPath(path)
    setIsEditModalOpen(true)
  }

  // Render Content based on mode
  const renderContent = () => {
    // 1. AI Fix Diff Mode
    if (aiFixMode === 'diff') {
      return (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bg-indigo-900/20 border-b border-indigo-500/30 px-4 py-3">
            <h3 className="text-sm font-bold text-indigo-400 mb-1">AI 修复建议:</h3>
            <p className="text-zinc-300 text-sm leading-relaxed">{aiExplanation}</p>
          </div>
          <div className="flex-1 min-h-0">
            <JsonDiffEditor original={aiOriginal} modified={aiFixed} />
          </div>
        </div>
      )
    }

    // 2. Compare Mode
    if (compareActive) {
      return (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-10 bg-zinc-900 border-b border-zinc-700 px-4 flex items-center justify-between">
            <span className="text-sm text-zinc-400">JSON 对比模式</span>
          </div>
          <div className="flex-1 min-h-0">
            <JsonDiffEditor original={compareLeft} modified={compareRight} />
          </div>
        </div>
      )
    }

    // 3. Normal Split Mode
    return (
      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        {/* Left Pane: Editor */}
        {!leftPaneCollapsed && (
          <div
            className="flex flex-col min-w-0"
            style={{ width: `${leftPaneWidth}%` }}
          >
            <div className="h-10 bg-zinc-900 border-b border-zinc-700 px-4 flex items-center">
              <span className="text-sm text-zinc-400">代码编辑区 - 编辑后自动刷新可视化</span>
            </div>
            <div className="flex-1 min-h-0 flex flex-col relative">
              {parseState.errorMessage && (
                <div className="bg-rose-500/20 border-b border-rose-500/50 px-4 py-2 text-rose-400 text-sm">
                  {parseState.errorMessage}
                </div>
              )}
              <div className="flex-1 relative">
                <JsonEditor />
              </div>
            </div>
          </div>
        )}

        {/* Resizer Handle */}
        {!leftPaneCollapsed && (
          <div
            className="w-1 bg-zinc-800 hover:bg-indigo-500 cursor-col-resize transition-colors z-10"
            onMouseDown={handleMouseDown}
          />
        )}

        {/* Right Pane: Graph */}
        <div className={`flex flex-col min-w-0 ${leftPaneCollapsed ? 'w-full' : 'flex-1'}`}>
          <div className="h-10 bg-zinc-900 border-b border-zinc-700 px-4 flex items-center justify-between">
            <span className="text-sm text-zinc-400">
              {viewMode === 'graph' ? '可视化图表区' : '树状图浏览区'} - 点击定位，双击改值
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('graph')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'graph'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
                title="图谱视图"
              >
                <Network size={14} />
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'tree'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
                title="树状图视图"
              >
                <List size={14} />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative">
            {viewMode === 'graph' ? (
              <JsonGraph onNodeDoubleClick={handleNodeDoubleClick} />
            ) : (
              <JsonTree onNodeDoubleClick={handleNodeDoubleClick} />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      <Toolbar />
      {renderContent()}
      <SettingsModal />
      <CompareModal />
      <EditValueModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        path={editPath}
      />
    </div>
  )
}

export default App
