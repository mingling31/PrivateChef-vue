import request from '@/utils/request'

export function getPublicHomeData() {
  return request({
    url: '/api/public/home',
    method: 'get'
  })
}

export function filterPackages(params) {
  return request({
    url: '/api/public/packages/filter',
    method: 'get',
    params
  })
}

export function comparePackages(params) {
  return request({
    url: '/api/public/packages/compare',
    method: 'get',
    params
  })
}

export function getCuisineTags() {
  return request({
    url: '/api/public/cuisine-tags',
    method: 'get'
  })
}
