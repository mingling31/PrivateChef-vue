import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/api/login',
    method: 'post',
    data
  })
}

export function chefLogin(data) {
  return request({
    url: '/api/chef/login',
    method: 'post',
    data
  })
}

export function register(data) {
  return request({
    url: '/api/register',
    method: 'post',
    data
  })
}

export function chefRegister(data) {
  return request({
    url: '/api/chef/register',
    method: 'post',
    data
  })
}

export function logout() {
  return request({
    url: '/api/logout',
    method: 'post'
  })
}
