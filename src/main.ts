import { createDiv } from './dom'
import './main.css'
import { transformByYApiBody } from './transform'

const API_PREFIX = 'https://api.zaitugongda.com/api/interface/get?id='

interface ApiInfoResponse {
  errcode: number // 0
  errmsg: string // 成功！
  data: {
    title: string // 额外费用审核列表数据,
    path: string // /order-center/sender/page/otherFee,
    res_body_type: string // json,
    req_body_other: string // 请求结构字符串
    req_body_type: string // json,
    res_body: string // 响应结构字符串
  }
}

function parseApiUrlFromPathname() {
  const apiPathname = window.location.pathname
  const nameList = apiPathname.split('\/').filter(Boolean)
  const apiNumber = nameList[nameList.length - 1]

  return API_PREFIX + apiNumber
}

async function requestApiInfo() {
  const requestUrl = parseApiUrlFromPathname()
  const response = await window.fetch(requestUrl)
  const data = await response.json()

  return data
}

function transform(data: ApiInfoResponse['data']) {
  const requestBody = JSON.parse(data.req_body_other)
  console.log('request:', transformByYApiBody(requestBody))

  const responseBody = JSON.parse(data.res_body)
  console.log('response:', transformByYApiBody(responseBody))
}

function main() {
  const container = createDiv({
    text: 'Declaration',
    class: 'plugin-button',
    onClick: async () => {
      const info = await requestApiInfo() as ApiInfoResponse
      if (info.data) {
        transform(info.data)
      }
    }
  })

  document.body.appendChild(container)
}

main()