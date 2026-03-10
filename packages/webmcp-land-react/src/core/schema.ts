import type { JSONSchema } from '../types'

export function generateTemplateFromSchema(schema: JSONSchema | null | undefined): unknown {
  if (!schema || typeof schema !== 'object') {
    return null
  }

  if (schema.hasOwnProperty('const')) {
    return schema.const
  }

  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    return generateTemplateFromSchema(schema.oneOf[0])
  }

  if (schema.hasOwnProperty('default')) {
    return schema.default
  }

  if (Array.isArray(schema.examples) && schema.examples.length > 0) {
    return schema.examples[0]
  }

  switch (schema.type) {
    case 'object': {
      const obj: Record<string, unknown> = {}
      if (schema.properties) {
        Object.keys(schema.properties).forEach((key) => {
          obj[key] = generateTemplateFromSchema(schema.properties![key])
        })
      }
      return obj
    }

    case 'array':
      if (schema.items) {
        return [generateTemplateFromSchema(schema.items)]
      }
      return []

    case 'string':
      if (schema.enum && schema.enum.length > 0) {
        return schema.enum[0]
      }
      if (schema.format === 'date') {
        return new Date().toISOString().substring(0, 10)
      }
      if (schema.format === 'email') {
        return 'user@example.com'
      }
      if (schema.format === 'tel') {
        return '123-456-7890'
      }
      return 'example_string'

    case 'number':
    case 'integer':
      if (schema.minimum !== undefined) return schema.minimum
      return 0

    case 'boolean':
      return false

    case 'null':
      return null

    default:
      return {}
  }
}
