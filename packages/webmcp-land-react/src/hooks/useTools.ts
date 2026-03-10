import { useMemo, useCallback } from 'react'
import type { ToolDefinition, ToolDeclaration } from '../types'
import { getToolDeclarations, executeTool as execTool, findTool } from '../core/tools'

export interface UseToolsOptions {
  tools?: ToolDefinition[]
  onToolCall?: (name: string, args: Record<string, unknown>) => void
  onToolResult?: (name: string, result: unknown) => void
  onError?: (error: Error) => void
}

export function useTools(options: UseToolsOptions = {}) {
  const { tools = [], onToolCall, onToolResult, onError } = options

  const declarations = useMemo(() => getToolDeclarations(tools), [tools])

  const executeTool = useCallback(
    async (name: string, args: Record<string, unknown>): Promise<unknown> => {
      onToolCall?.(name, args)
      try {
        const result = await execTool(tools, name, args)
        onToolResult?.(name, result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        onError?.(error)
        throw error
      }
    },
    [tools, onToolCall, onToolResult, onError]
  )

  return {
    tools,
    declarations,
    executeTool,
    findTool: (name: string) => findTool(tools, name),
  }
}
