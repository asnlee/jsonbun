import { useState, useRef, useEffect } from 'react'
import { X, ArrowRightLeft } from 'lucide-react'
import { useUiStore } from '../stores/uiStore'
import { useCompareStore } from '../stores/compareStore'

export function CompareModal() {
    const isOpen = useUiStore((s) => s.compareModalOpen)
    const setOpen = useUiStore((s) => s.setCompareModalOpen)
    const openCompare = useCompareStore((s) => s.open)

    const [input, setInput] = useState('')
    const [error, setError] = useState('')
    const inputRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (isOpen) {
            setInput('')
            setError('')
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [isOpen])

    const handleCompare = () => {
        if (!input.trim()) {
            setError('Please enter JSON content to compare')
            return
        }
        openCompare(input)
        setOpen(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-[600px] bg-zinc-900 rounded-lg border border-zinc-700 shadow-xl flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                        <ArrowRightLeft size={20} className="text-indigo-500" />
                        Diff Compare
                    </h3>
                    <button
                        onClick={() => setOpen(false)}
                        className="text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 flex-1 flex flex-col min-h-0">
                    <p className="text-sm text-zinc-400 mb-2">
                        Paste the JSON you want to compare with the current editor content:
                    </p>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className={`w-full flex-1 bg-zinc-950 border rounded-md p-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${error ? 'border-rose-500' : 'border-zinc-700'
                            }`}
                        placeholder='{"key": "value"}'
                        spellCheck={false}
                    />
                    {error && (
                        <p className="text-sm text-rose-400 mt-2">{error}</p>
                    )}
                </div>

                <div className="p-4 border-t border-zinc-800 flex justify-end gap-2">
                    <button
                        onClick={() => setOpen(false)}
                        className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCompare}
                        className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                    >
                        Compare
                    </button>
                </div>
            </div>
        </div>
    )
}
