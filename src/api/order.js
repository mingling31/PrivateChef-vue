import request from '@/utils/request'

export function getOrders(params) {
  return request({
    url: '/api/orders/list',
    method: 'get',
    params
  })
}

export function getOrderDetail(orderId) {
  return request({
    url: `/api/orders/${orderId}`,
    method: 'get'
  })
}

export function createOrder(userId, data) {
  return request({
    url: '/api/orders/create',
    method: 'post',
    params: { userId },
    data
  }).then(res => {
    if (res?.code !== 200 || res?.success === false) {
      const err = new Error(res?.message || '下单失败')
      err.biz = res
      throw err
    }
    return res
  })
}

export function payOrder(orderId) {
  return request({
    url: `/api/orders/pay/${orderId}`,
    method: 'put'
  })
}

export function cancelOrder(orderId, cancelReason) {
  return request({
    url: `/api/orders/${orderId}/cancel`,
    method: 'post',
    data: { cancelReason }
  })
}

export function acceptOrder(orderId) {
  return request({
    url: `/api/orders/${orderId}/accept`,
    method: 'post'
  })
}

export function completeOrder(orderId) {
  return request({
    url: `/api/orders/${orderId}/complete`,
    method: 'post'
  })
}

export function rejectOrder(orderId, rejectReason) {
  return request({
    url: `/api/orders/${orderId}/reject`,
    method: 'post',
    data: { rejectReason }
  })
}

export function reviewOrder(orderId, data) {
  return request({
    url: `/api/orders/${orderId}/review`,
    method: 'post',
    data
  })
}
