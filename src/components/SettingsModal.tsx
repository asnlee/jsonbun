import { useState } from 'react'
import { X } from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'

export function SettingsModal() {
  const open = useSettingsStore((s) => s.open)
  const settings = useSettingsStore((s) => s.settings)
  const setOpen = useSettingsStore((s) => s.setOpen)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  const [formData, setFormData] = useState(settings)

  if (!open) return null

  const handleSave = () => {
    updateSettings(formData)
    setOpen(false)
  }

  const handleCancel = () => {
    setFormData(settings)
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md p-6 border border-zinc-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-100">设置</h2>
          <button
            onClick={handleCancel}
            className="text-zinc-400 hover:text-zinc-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              OpenAI Base URL
            </label>
            <input
              type="text"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://api.openai.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="sk-..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Model
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="gpt-4o-mini"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
