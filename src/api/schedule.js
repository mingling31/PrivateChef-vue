import request from '@/utils/request'

export function getChefSchedules(params) {
  return request({
    url: '/api/schedules',
    method: 'get',
    params
  })
}

export function saveChefSchedule(data) {
  return request({
    url: '/api/schedules',
    method: 'post',
    data
  })
}

export function saveChefScheduleBatch(data) {
  return request({
    url: '/api/schedules/batch',
    method: 'post',
    data
  })
}
