import request from '@/utils/request'

export function addAction(data) {
  return request({
    method: 'post',
    url: '/action/add',
    data
  })
}

export function updateAction(data) {
  return request({
    method: 'post',
    url: '/action/update',
    data
  })
}

export function getActionList(params) {
  return request({
    method: 'post',
    url: '/action/list',
    params
  })
}

export function deleteAction(actionId) {
  return request({
    method: 'get',
    url: '/action/delete/' + actionId
  })
}

export function getSelectableActions(projectId, platform) {
  return request({
    method: 'get',
    url: '/action/selectable/' + projectId + '/' + platform
  })
}

export function debugAction(data) {
  return request({
    method: 'post',
    url: '/action/debug',
    data
  })
}
