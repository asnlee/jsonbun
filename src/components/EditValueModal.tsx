import { useState, useEffect, useRef } from 'react'
import { X, Check, AlertCircle } from 'lucide-react'
import { useJsonStore } from '../stores/jsonStore'
import { updateValueByPath, parseValue, getValueByPath, getValueType } from '../utils/jsonValueMutation'

interface EditValueModalProps {
    isOpen: boolean
    onClose: () => void
    path: string
}

export function EditValueModal({ isOpen, onClose, path }: EditValueModalProps) {
    const parsedValue = useJsonStore((s) => s.parseState.parsedValue)
    const setJsonText = useJsonStore((s) => s.setJsonText)

    const [value, setValue] = useState('')
    const [error, setError] = useState('')
    const [type, setType] = useState('unknown')
    const inputRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (isOpen && path) {
            const val = getValueByPath(parsedValue, path)
            const valType = getValueType(val)
            setType(valType)

            // Format value for editing
            if (valType === 'object' || valType === 'array') {
                setValue(JSON.stringify(val, null, 2))
            } else {
                setValue(String(val))
            }
            setError('')

            // Auto focus
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus()
                    inputRef.current.select()
                }
            }, 50)
        }
    }, [isOpen, path, parsedValue])

    const handleSave = () => {
        try {
            let newVal: unknown

            // Parse value based on type
            if (type === 'object' || type === 'array') {
                newVal = JSON.parse(value)
            } else {
                newVal = parseValue(value, type)
            }

            // Strict type validation - new value must match original type
            const newType = getValueType(newVal)
            if (newType !== type) {
                setError(`类型不匹配：期望 ${type}，但得到 ${newType}`)
                return
            }

            const newRoot = updateValueByPath(parsedValue, path, newVal)
            setJsonText(JSON.stringify(newRoot, null, 2))
            onClose()
        } catch (e) {
            setError(e instanceof Error ? e.message : '无效的值')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-[500px] bg-zinc-900 rounded-lg border border-zinc-700 shadow-xl flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-100">编辑值</h3>
                        <div className="text-xs text-zinc-400 font-mono mt-1 px-1.5 py-0.5 bg-zinc-800 rounded inline-block">
                            {path}
                            <span className="ml-2 px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-300">{type}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 flex-1 flex flex-col min-h-0">
                    <textarea
                        ref={inputRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={`w-full flex-1 bg-zinc-950 border rounded-md p-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${error ? 'border-rose-500 focus:border-rose-500' : 'border-zinc-700 focus:border-indigo-500'}`}
                        spellCheck={false}
                    />
                    {error && (
                        <div className="mt-2 flex items-center gap-2 text-rose-400 text-sm">
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="mt-2 text-xs text-zinc-500">
                        {type === 'string' ? '直接输入文本，类型必须保持为字符串' :
                            type === 'number' ? '输入有效的数字，类型必须保持为数字' :
                            type === 'boolean' ? '输入 true 或 false，类型必须保持为布尔值' :
                            type === 'null' ? '输入 null' :
                            type === 'object' ? '输入有效的 JSON 对象，类型必须保持为对象' :
                            type === 'array' ? '输入有效的 JSON 数组，类型必须保持为数组' :
                                `输入有效的 ${type}`}
                    </div>
                </div>

                <div className="p-4 border-t border-zinc-800 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Check size={16} />
                        应用更改
                    </button>
                </div>
            </div>
        </div>
    )
}
