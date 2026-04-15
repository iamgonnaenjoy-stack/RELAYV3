import { api } from '@/lib/api'
import { Channel } from '@/stores/channel.store'
import { Message } from '@/stores/message.store'
import { RelayServer } from '@/stores/server.store'

export const authApi = {
  login: (data: { accessKey: string }) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
}

export const serverApi = {
  getCurrent: () => api.get<RelayServer>('/api/server'),
}

export const channelApi = {
  getAll: () => api.get<Channel[]>('/api/channels'),
  getById: (id: string) => api.get<Channel>(`/api/channels/${id}`),
}

export const messageApi = {
  getByChannel: (channelId: string, cursor?: string) =>
    api.get<Message[]>('/api/messages', {
      params: { channelId, cursor },
    }),
  create: (data: { content: string; channelId: string }) => api.post<Message>('/api/messages', data),
  edit: (id: string, content: string) => api.patch<Message>(`/api/messages/${id}`, { content }),
  delete: (id: string) => api.delete(`/api/messages/${id}`),
}
