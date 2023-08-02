import './main.css'

const PLUGIN_SIGN = 'plugin'

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

    if (tableBody.lastElementChild?.id === PLUGIN_SIGN) {
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

      const variant: Variant = {
        name: order + '+' + text[0],
        type: text[1],
        require: text[2] === '必须',
        description: text[4] || '',
        level: parseElementLevel(tr as HTMLElement),
        properties: [],
        id: order
      }

      list.push(variant)
      order++
    }

    let beforeLevel = 0
    let properties: Variant[] = []
      ;[...list].reverse().forEach(variant => {
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
    let str = JSON.stringify(result, null, '··')
    str = str.replace(/[",]/g, '')

    // 加入注释
    const strList = str.split('\n')
    let finalStr = 'interface Struct '
    for (const s of strList) {
      let temp = s
      const matchResult = s.match(/\d+\+/)
      if (matchResult) {
        const targetStr = matchResult[0]
        temp = temp.replace(targetStr, '')

        const index = Number(targetStr.replace('+', ''))        
        const comment = list.find(l => l.id === index)?.description || ''

        const nbspResult = temp.match(/·/g)
        const nbspCount = nbspResult?.length || 0

        if (comment) {
          finalStr += `${Array.from({length: nbspCount}).map(_ => '·').join('')}/** ${comment} */` + '\n'
        }
      }

      finalStr += temp + '\n'
    }

    display.innerText = finalStr
    tableBody.appendChild(display)

    const copyButton = document.createElement('button')
    tableBody.appendChild(copyButton)
    copyButton.innerText = '复制接口声明'
    copyButton.addEventListener('click', event => {
      event.stopPropagation()
      navigator.clipboard.writeText(finalStr.replaceAll('··', '\t'))
    })
  })
}

function createSwitch() {
  const button = document.createElement('div')
  button.className = 'plugin-button'
  button.innerText = '接口声明'

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

interface Struct {
	code: string
	data: {
		/** 用户标识 */
		id: number
		/** 用户类型 1物流公司，2工厂，3货物代理公司，4司机，5其他 */
		userType: number
		/** 名称 用户姓名 */
		userName: string
		/** 手机号码 */
		mobileNumber: string
		/** 用户角色 1老板，2调度，3操作，4司机 */
		userRole: number
		/** 账户类型 1主账号，2子账号 */
		accountType: number
		/** 用户状态 1已注册，2入驻中，3已入驻，4入驻失败 */
		status: number
		/** token */
		token: string
		/** token 过期时间 */
		expiresAt: number
	}
	msg: string
}
