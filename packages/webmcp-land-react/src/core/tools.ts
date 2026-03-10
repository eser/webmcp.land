import type { ToolDefinition, ToolDeclaration, JSONSchema } from '../types'

export function defineTool(tool: ToolDefinition): ToolDefinition {
  return tool
}

export function getToolDeclarations(tools: ToolDefinition[]): ToolDeclaration[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }))
}

export function findTool(tools: ToolDefinition[], name: string): ToolDefinition | undefined {
  return tools.find((t) => t.name === name)
}

export async function executeTool(
  tools: ToolDefinition[],
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const tool = findTool(tools, name)
  if (!tool) {
    throw new Error(`Tool "${name}" not found`)
  }
  return tool.execute(args)
}

export function toolsToInputSchema(tools: ToolDefinition[]): JSONSchema[] {
  return tools.map((t) => t.inputSchema)
}
