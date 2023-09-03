import {
  EmitHint,
  InterfaceDeclaration,
  NewLineKind,
  PropertySignature,
  ScriptKind,
  ScriptTarget,
  SyntaxKind,
  TypeNode,
  addSyntheticLeadingComment,
  createPrinter,
  createSourceFile,
  factory,
  isPropertySignature
} from 'typescript'

export interface YApiBody {
  type: string

  required?: string[]
  title?: string

  /** type === 'array' */
  items?: YApiBody

  /** type === 'object' */
  properties?: {
    [key: string]: YApiBody
  }
}

export function transformByYApiBody(source: YApiBody, name = 'Struct', desertTop = false) {
  if (!source.type) {
    return ''
  }

  const resultFile = createSourceFile(
    "someFileName.ts",
    "",
    ScriptTarget.Latest,
    false,
    ScriptKind.TS
  )

  const printer = createPrinter({ newLine: NewLineKind.LineFeed })
  const declarations = makeInterface(source, name, desertTop)

  let printString = ''
  declarations.forEach(declaration => {
    printString += printer.printNode(EmitHint.Unspecified, declaration, resultFile).replace(/;/g, '') + '\n'
  })

  // 注释优化
  printString = printString.replace(/\/\*/g, '/** ')
  printString = printString.replace(/\*\//g, ' */')

  return printString
}

export function makeInterface(source: YApiBody, name: string, desertTop = false) {
  const declarations: InterfaceDeclaration[] = []

  const generateRecursive = (
    source: YApiBody,
    name: string,
    isRequired = false,
    isTop = false,
    desertTop = false
  ) => {
    const requiredMap: Record<string, boolean> = {}
    source.required?.forEach(key => (requiredMap[key] = true))

    let node: PropertySignature | InterfaceDeclaration
    if (source.type === 'array') {
      if (source.items?.properties) {
        const properties = source.items.properties
        const keys = Object.keys(properties)
        const typeNodes: PropertySignature[] = []

        for (const key of keys) {
          const value = properties[key]
          const node = generateRecursive(value, key, requiredMap[key])
          if (isPropertySignature(node)) {
            typeNodes.push(node)
          }
        }

        const newInterfaceName = formatInterfaceName(name)
        const newInterface = createInterfaceDeclaration(newInterfaceName, typeNodes)
        declarations.push(newInterface)

        node = createPropertySignature(
          name,
          isRequired,
          factory.createArrayTypeNode(
            factory.createTypeReferenceNode(
              factory.createIdentifier(newInterfaceName),
              undefined
            )
          )
        )
      } else {
        node = createPropertySignature(
          name,
          isRequired,
          factory.createArrayTypeNode(factory.createKeywordTypeNode(parseSimpleType(source.type)))
        )
      }
    } else if (source.type === 'object' && source.properties) {
      const keys = Object.keys(source.properties)
      const typeNodes: PropertySignature[] = []

      for (const key of keys) {
        const value = source.properties[key]
        const node = generateRecursive(value, key, requiredMap[key])
        if (isPropertySignature(node)) {
          typeNodes.push(node)
        }
      }

      if (isTop) {
        node = createInterfaceDeclaration(name, typeNodes)
        if (!desertTop) {
          declarations.push(node)
        }
      } else {
        const newInterfaceName = formatInterfaceName(name)
        const newInterface = createInterfaceDeclaration(newInterfaceName, typeNodes)
        declarations.push(newInterface)

        node = createPropertySignature(
          name,
          isRequired,
          factory.createTypeReferenceNode(
            factory.createIdentifier(newInterfaceName),
            undefined
          )
        )
      }
    } else {
      node = createPropertySignature(
        name,
        isRequired,
        factory.createKeywordTypeNode(parseSimpleType(source.type))
      )
    }

    if (source.title) {
      addSyntheticLeadingComment(node, SyntaxKind.MultiLineCommentTrivia, source.title, true)
    }

    return node
  }

  const result = generateRecursive(source, name, true, true, desertTop)

  if (isPropertySignature(result)) {
    const newInterface = createInterfaceDeclaration(name, [result])
    declarations.push(newInterface)
  }

  return declarations
}

function formatInterfaceName(name: string) {
  return name[0].toUpperCase() + name.substring(1)
}

function createInterfaceDeclaration(name: string, childNodes: PropertySignature[]) {
  return factory.createInterfaceDeclaration(
    [factory.createToken(SyntaxKind.ExportKeyword)],
    factory.createIdentifier(name),
    undefined,
    undefined,
    childNodes
  )
}

function createPropertySignature(name: string, isRequired: boolean, childNode: TypeNode) {
  return factory.createPropertySignature(
    undefined,
    factory.createIdentifier(name),
    isRequired ? undefined : factory.createToken(SyntaxKind.QuestionToken),
    childNode
  )
}

function parseSimpleType(type: string) {
  switch (type) {
    case 'string':
      return SyntaxKind.StringKeyword

    case 'integer':
    case 'number':
      return SyntaxKind.NumberKeyword

    case 'boolean':
      return SyntaxKind.BooleanKeyword

    default:
      return SyntaxKind.StringKeyword
  }
}
