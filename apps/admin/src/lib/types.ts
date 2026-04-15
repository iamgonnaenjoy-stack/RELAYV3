export interface RelayServer {
  id: string
  key: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminOverview {
  server: RelayServer
  stats: {
    members: number
    channels: number
    messages: number
  }
}

export interface AdminMember {
  id: string
  username: string
  email: string | null
  avatar: string | null
  accessKeyId: string
  lastLoginAt: string | null
  createdAt: string
  _count?: {
    messages: number
  }
}

export interface AdminChannel {
  id: string
  name: string
  description: string | null
  type: 'TEXT' | 'VOICE'
  position: number
  createdAt: string
  _count?: {
    messages: number
  }
}
