import request from '@/utils/request'

export function getPreferenceProfile(userId) {
  return request({
    url: '/api/preferences/profile',
    method: 'get',
    params: { userId }
  })
}

export function savePreferenceProfile(userId, data) {
  return request({
    url: '/api/preferences/profile',
    method: 'put',
    params: { userId },
    data
  })
}

export function extractProfile(userId, data) {
  return request({
    url: '/api/dialogues/extract',
    method: 'post',
    params: { userId },
    data
  })
}
