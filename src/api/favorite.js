import request from '@/utils/request'

export function toggleFavorite(data) {
  return request({
    url: '/api/favorites/toggle',
    method: 'post',
    data
  })
}

export function getFavoriteStatus(params) {
  return request({
    url: '/api/favorites/status',
    method: 'get',
    params
  })
}

export function getFavoriteList(params) {
  return request({
    url: '/api/favorites/list',
    method: 'get',
    params
  })
}

export function deleteFavorite(favoriteId, userId) {
  return request({
    url: `/api/favorites/${favoriteId}`,
    method: 'delete',
    params: { userId }
  })
}

