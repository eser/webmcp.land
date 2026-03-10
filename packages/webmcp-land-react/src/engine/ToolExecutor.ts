import type { ToolDefinition, ToolDeclaration } from '../types'

export class ToolExecutor {
  private tools: ToolDefinition[] = []

  register(tools: ToolDefinition[]): void {
    this.tools = tools
  }

  getDeclarations(): ToolDeclaration[] {
    return this.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }))
  }

  find(name: string): ToolDefinition | undefined {
    return this.tools.find((t) => t.name === name)
  }

  async execute(name: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = this.find(name)
    if (!tool) {
      throw new Error(`Tool "${name}" not found`)
    }
    return tool.execute(args)
  }

  getAll(): ToolDefinition[] {
    return this.tools
  }
}
