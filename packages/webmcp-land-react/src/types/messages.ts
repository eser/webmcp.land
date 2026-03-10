export type MessageType = 'user' | 'assistant' | 'tool-call' | 'tool-result' | 'error' | 'system'

export interface MessageAttachment {
  type: 'image' | 'file'
  url: string
  name?: string
  mimeType?: string
}

export type MessageFeedback = 'thumbs-up' | 'thumbs-down' | null

export interface Message {
  id: string
  type: MessageType
  content: string
  timestamp: number
  attachments?: MessageAttachment[]
  isStreaming?: boolean
  feedback?: MessageFeedback
}
