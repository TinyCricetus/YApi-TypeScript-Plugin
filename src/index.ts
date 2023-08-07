import './index.css'
import { createDiv } from './shared'

const API_PREFIX = 'https://api.zaitugongda.com/api/interface/get?id='

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

function parseApiBody(bodyString: string) {
  const apiBody = JSON.parse(bodyString)
  console.log('api body:', apiBody)
}


function main() {
  const container = createDiv({
    text: 'Declaration',
    class: 'plugin-button',
    onClick: async () => {
      const info = await requestApiInfo()
      const apiBodyString = info.data?.res_body || ''
      if (apiBodyString) {
        parseApiBody(apiBodyString)
      }
    }
  })

  document.body.appendChild(container)
}

main()