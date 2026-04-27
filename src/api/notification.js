import request from '@/utils/request'

export function getNotifications(params) {
  return request({
    url: '/api/notifications/list',
    method: 'get',
    params
  })
}

export function getUnreadCount() {
  return request({
    url: '/api/notifications/unread-count',
    method: 'get'
  })
}

export function markAsRead(id) {
  return request({
    url: `/api/notifications/${id}/read`,
    method: 'put'
  })
}

export function markAllAsRead() {
  return request({
    url: '/api/notifications/read-all',
    method: 'put'
  })
}
