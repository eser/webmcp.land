export interface JSONSchema {
  type?: string
  properties?: Record<string, JSONSchema>
  required?: string[]
  items?: JSONSchema
  enum?: unknown[]
  const?: unknown
  default?: unknown
  examples?: unknown[]
  oneOf?: JSONSchema[]
  description?: string
  format?: string
  minimum?: number
  [key: string]: unknown
}

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: JSONSchema
  execute: (args: Record<string, unknown>) => Promise<unknown>
}

export interface FunctionCall {
  id?: string
  name: string
  args: Record<string, unknown>
}

export interface ToolResult {
  id?: string
  name: string
  result?: unknown
  error?: string
}

export interface ToolDeclaration {
  name: string
  description: string
  inputSchema: JSONSchema
}
