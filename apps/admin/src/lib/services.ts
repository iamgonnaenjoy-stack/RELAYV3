import { api } from '@/lib/api'
import { AdminChannel, AdminMember, AdminOverview, RelayServer } from '@/lib/types'

export const adminApi = {
  login: (data: { accessKey: string }) => api.post('/api/admin/auth/login', data),
  overview: () => api.get<AdminOverview>('/api/admin/overview'),
  getServer: () => api.get<RelayServer>('/api/admin/server'),
  updateServer: (data: { name: string; description?: string }) =>
    api.put<RelayServer>('/api/admin/server', data),
  getUsers: () => api.get<AdminMember[]>('/api/admin/users'),
  createUser: (data: { username: string; email?: string; avatar?: string }) =>
    api.post<{ user: AdminMember; accessKey: string }>('/api/admin/users', data),
  resetUserAccessKey: (id: string) =>
    api.post<{ user: AdminMember; accessKey: string }>(`/api/admin/users/${id}/reset-access-key`),
  getChannels: () => api.get<AdminChannel[]>('/api/admin/channels'),
  createChannel: (data: { name: string; description?: string; type: 'TEXT' | 'VOICE' }) =>
    api.post<AdminChannel>('/api/admin/channels', data),
  deleteChannel: (id: string) => api.delete(`/api/admin/channels/${id}`),
}
