
import * as ts from 'typescript'
import * as fs from 'fs'

const options: ts.CompilerOptions = {
  noEmitOnError: true,
  noImplicitAny: true,
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS,
}
const host = ts.createCompilerHost(options)

export function checkDataSatisfiedType(fileWithType: string, typeName: string, data: any) {
  const interfaceData = fs.readFileSync(fileWithType)

  const dataFromAPI = `const res: ${typeName} = ${JSON.stringify(data)}`

  const content = `${interfaceData}\n${dataFromAPI}`
  const dir = fs.mkdtempSync('typescript-runtime-check-cache-')
  const filename = `./${dir}/${Math.random()}.ts`
  fs.writeFileSync(filename, content)

  const program = ts.createProgram([filename], options, host)
  const result = program.getSemanticDiagnostics()
  fs.unlinkSync(filename)
  fs.rmdirSync(dir)

  function getErrors(message: ts.DiagnosticMessageChain | string): (ts.DiagnosticMessage | string)[] {
    if (typeof message === 'string') {
      return [message]
    }

    return message.next
      ? [message.messageText, ...getErrors(message.next)]
      : [message.messageText]
  }

  const errors = result.map(diagnostic => {
    return getErrors(diagnostic.messageText)
  })[0]

  return errors.join('\n')
}
