import './main.css'

const PLUGIN_SIGN = 'plugin'
const COPY_SIGN = 'copy'

interface Variant {
  name: string
  type: string
  require: boolean
  description: string
  level: number
  id: number

  properties: Variant[]
}

/**
 * 从样式中解析对象等级
 * 
 * 样式形如：
 * - ant-table-row  ant-table-row-level-0
 * - ant-table-row  ant-table-row-level-1
 */
function parseElementLevel(el: HTMLElement) {
  const targetClassName = el.classList.item(el.classList.length - 1)
  if (targetClassName && targetClassName.startsWith('ant')) {
    const strList = targetClassName.split('-')
    const levelStr = strList[strList.length - 1]
    return Number(levelStr)
  }

  return 0
}

function parseVariant(variant: Variant) {
  if (!variant.properties.length) {
    return {
      [variant.name]: variant.type
    }
  }

  let struct: Record<string, any> = {}

  for (const v of variant.properties) {
    struct = v.properties.length ? {
      ...struct,
      [variant.name]: parseVariant(v)
    } : {
      ...struct,
      ...parseVariant(v)
    }
  }

  return struct
}

function generateDeclaration() {
  const tbodyList = document.querySelectorAll('.ant-table-tbody')
  tbodyList.forEach((tbody, index) => {
    if (index === 0) {
      // 舍弃第一个，一般第一个是请求头的参数描述，如果遇到特殊情况需要改动
      return
    }

    const tableBody = tbody.parentElement?.parentElement
    if (!tableBody) {
      return
    }

    while (tableBody.lastElementChild && [PLUGIN_SIGN, COPY_SIGN].includes(tableBody.lastElementChild.id)) {
      tableBody.lastElementChild.remove()
    }

    let order = 1
    const list: Variant[] = []
    for (const tr of tbody.children) {
      const text: string[] = []

      for (const td of tr.children) {
        if (td instanceof HTMLElement) {
          text.push(td.innerText)
        }
      }

      const require = text[2] === '必须'
      const variant: Variant = {
        name: order + '+' + text[0] + (require ? '' : '?'),
        type: text[1],
        require,
        description: text[4] || '',
        level: parseElementLevel(tr as HTMLElement),
        properties: [],
        id: order
      }

      list.push(variant)
      order++
    }

    let beforeLevel = 0
    let properties: Variant[] = [];
    [...list].reverse().forEach(variant => {
      if (!properties.length && variant.level === 0) {
        beforeLevel = variant.level
        return
      }

      if (beforeLevel - variant.level > 0) {
        variant.properties = properties.reverse()
        properties = []
      } else {
        properties.push(variant)
      }

      beforeLevel = variant.level
    })

    const finalList = list.filter(item => !item.level)

    const topVariant: Variant = {
      name: '0+data',
      type: 'object',
      require: false,
      description: '数据声明',
      level: 0,
      properties: finalList,
      id: 0
    }

    const display = document.createElement('pre')
    display.className = 'declare'
    display.id = PLUGIN_SIGN

    const result = parseVariant(topVariant)
    let str = JSON.stringify(result, null, '&nbsp;')
    str = str.replace(/[",]/g, '')

    // 加入注释
    const strList = str.split('\n')
    let finalStr = 'interface Struct '
    let copyStr = 'interface Struct '
    for (const s of strList) {
      let temp = s
      const matchResult = s.match(/\d+\+/)
      if (matchResult) {
        const targetStr = matchResult[0]
        temp = temp.replace(targetStr, '')

        const index = Number(targetStr.replace('+', ''))
        const comment = list.find(l => l.id === index)?.description || ''

        const nbspResult = temp.match(/&nbsp;/g)
        const nbspCount = nbspResult?.length || 0
        const nbsp = Array.from({ length: nbspCount }).map(_ => '&nbsp;').join('')

        if (comment) {
          finalStr += `<span>${nbsp}/** ${comment} */</span><br>`
          copyStr += `${nbsp}/** ${comment} */\n`
        }
      }

      finalStr += `<span>${temp}</span><br>`
      copyStr += temp + '\n'
    }

    display.innerHTML = finalStr
    tableBody.appendChild(display)

    const copyButton = document.createElement('button')
    copyButton.id = COPY_SIGN
    copyButton.className = "copy-button"
    tableBody.appendChild(copyButton)
    copyButton.innerText = '复制'
    copyButton.addEventListener('click', event => {
      event.stopPropagation()
      navigator.clipboard.writeText(copyStr.replace(/&nbsp;/g, ''))
    })
  })
}

function createSwitch() {
  const button = document.createElement('div')
  button.className = 'plugin-button'
  button.innerText = '生成接口声明'

  return button
}

function main() {
  const switchButton = createSwitch()

  document.body.append(switchButton)

  switchButton.addEventListener('click', event => {
    event.stopPropagation()
    generateDeclaration()
  })
}

main()
