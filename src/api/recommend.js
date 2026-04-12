import request from '@/utils/request'

export function getChefRecommendations(userId, sortBy) {
  return request({
    url: '/api/recommend/chefs',
    method: 'get',
    params: { userId, sortBy }
  })
}
