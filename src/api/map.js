import request from '@/utils/request'

export function suggestAddress({ query, city = '青岛市' }) {
  return request({
    url: '/api/maps/suggest',
    method: 'get',
    params: { query, city }
  })
}

export function geocodeAddress({ address, city = '青岛市' }) {
  return request({
    url: '/api/maps/geocode',
    method: 'get',
    params: { address, city }
  })
}

export function reverseGeocode({ lng, lat }) {
  return request({
    url: '/api/maps/reverse',
    method: 'get',
    params: { lng, lat }
  })
}
