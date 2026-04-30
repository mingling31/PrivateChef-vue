import request from '@/utils/request'

export function getChefApplications(status) {
    return request({
        url: '/api/admin/chefs',
        method: 'get',
        params: {status}
    })
}

export function reviewChef(chefId, data) {
    return request({
        url: `/api/admin/chefs/${chefId}/review`,
        method: 'post',
        data
    })
}

export function getDashboardStats() {
    return request({
        url: '/api/admin/stats/dashboard',
        method: 'get'
    })
}
