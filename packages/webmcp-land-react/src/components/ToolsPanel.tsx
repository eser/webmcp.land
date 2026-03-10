import React, { useState, useCallback, useMemo } from 'react'
import type { ToolsPanelProps } from '../types'
import { generateTemplateFromSchema } from '../core/schema'

export function ToolsPanel({ tools, onExecute }: ToolsPanelProps) {
  const [selectedTool, setSelectedTool] = useState(tools[0]?.name || '')
  const [inputArgs, setInputArgs] = useState('')
  const [result, setResult] = useState('')
  const [executing, setExecuting] = useState(false)

  const selectedToolDef = useMemo(
    () => tools.find((t) => t.name === selectedTool),
    [tools, selectedTool]
  )

  const handleToolChange = useCallback(
    (name: string) => {
      setSelectedTool(name)
      const tool = tools.find((t) => t.name === name)
      if (tool) {
        const template = generateTemplateFromSchema(tool.inputSchema)
        setInputArgs(JSON.stringify(template, null, 2))
      }
      setResult('')
    },
    [tools]
  )

  React.useEffect(() => {
    if (tools.length > 0 && !inputArgs) {
      handleToolChange(tools[0].name)
    }
  }, [tools])

  const handleExecute = useCallback(async () => {
    if (!selectedTool) return
    setExecuting(true)
    setResult('')
    try {
      const args = JSON.parse(inputArgs || '{}')
      const res = await onExecute(selectedTool, args)
      setResult(typeof res === 'string' ? res : JSON.stringify(res, null, 2))
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setExecuting(false)
    }
  }, [selectedTool, inputArgs, onExecute])

  if (tools.length === 0) {
    return (
      <div className="wmcp-panel-inner">
        <div className="wmcp-panel-title">Registered Tools</div>
        <p style={{ color: 'var(--wmcp-text-2)', fontSize: 12 }}>No tools registered.</p>
      </div>
    )
  }

  return (
    <div className="wmcp-panel-inner">
      <div className="wmcp-panel-title">Registered Tools</div>
      <div className="wmcp-tools-grid">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className={`wmcp-tool-card${selectedTool === tool.name ? ' wmcp-active' : ''}`}
            onClick={() => handleToolChange(tool.name)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToolChange(tool.name) }}
          >
            <div className="wmcp-tool-card-name">{tool.name}</div>
            {tool.description && (
              <div className="wmcp-tool-card-desc">{tool.description}</div>
            )}
          </div>
        ))}
      </div>

      <div className="wmcp-manual-tool-section">
        <div className="wmcp-panel-title" style={{ marginTop: 4 }}>
          Execute Manually
        </div>
        <label>Arguments</label>
        <textarea
          className="wmcp-tool-args"
          value={inputArgs}
          onChange={(e) => setInputArgs(e.target.value)}
          placeholder='{"key": "value"}'
        />
        <button
          className="wmcp-btn-accent wmcp-btn-full"
          onClick={handleExecute}
          disabled={executing}
        >
          {executing ? 'Running...' : `Run ${selectedTool}`}
        </button>
        {result && <pre className="wmcp-tool-results">{result}</pre>}
      </div>
    </div>
  )
}
