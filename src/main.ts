import { createDiv } from './dom'
import './main.css'
import { transformByYApiBody } from './transform'
import Highlight from 'highlight.js/lib/core'
import hightTypescript from 'highlight.js/lib/languages/typescript'
import 'highlight.js/styles/github.css'

Highlight.registerLanguage('typescript', hightTypescript)

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
  const requestBody = JSON.parse(data.req_body_other || '{}')
  const responseBody = JSON.parse(data.res_body || '{}')
  return [
    transformByYApiBody(requestBody, 'Request'),
    transformByYApiBody(responseBody, 'Response')
  ]
}

function main() {
  let panelVisible = false

  const pluginButton = createDiv({
    text: 'Declaration',
    class: 'plugin-button',
    onClick: async (event) => {
      event.stopPropagation()
      const info = await requestApiInfo() as ApiInfoResponse
      if (info.data) {
        updateCodePanelInnerHtml(transform(info.data))
      }

      updatePanelVisible()
    }
  })

  const codePanel = createDiv({ class: 'code-panel' })
  const codeContainer = createDiv({
    class: 'code-container',
    children: [codePanel],
    onClick: (event) => {
      event.stopPropagation()
    }
  })

  window.addEventListener('click', () => updatePanelVisible(false))

  function updatePanelVisible(newVisible = !panelVisible) {
    panelVisible = newVisible
    const fixedRight = panelVisible ? '0px' : '-100%'
    codeContainer.style.right = fixedRight
  }

  function updateCodePanelInnerHtml(textList: string[]) {
    let innerHtml = ''
    textList.forEach(text => {
      innerHtml += '<pre>' +
        Highlight.highlight(
          text,
          { language: 'typescript' }
        ).value +
        '</pre>'
    })

    codePanel.innerHTML = innerHtml
  }

  ;[pluginButton, codeContainer].forEach(el => {
    document.body.appendChild(el)
  })
}

main()