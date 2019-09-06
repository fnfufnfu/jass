/**
 * 方法提供
 */
const vscode = require("vscode")
const j = require("./j")
const jg = require("./jg")
const type = require("./type")
const keyword = require("./keyword")
const itemTool = require("./itemTool")

/**
 * @description 是否可以提示
 * @param {vscode.TextDocument} document 
 * @param {vscode.Position} position 
 * @returns {boolean}
 */
const cantHint = (document, position) => {
  // conment string code type後
  let show = itemTool.cheakInComment(document, position) || itemTool.cheakInString(document, position) || itemTool.cheakInCode(document, position) || (function () {
    // 是否在類型後面
    let types = Object.keys(type)
    types.map(t => {
      return new RegExp(`(?<=${t}\s+)`)
    })
    return false
  })()
  return
}

/**
 * 類型
 */
const clazzs = Object.keys(type)

/**
 * @description 是否可以提示
 * @param {vscode.TextDocument} document 
 * @param {vscode.Position} position 
 * @returns
 */
const getPre = (document, position) => {

  let items = []
  let textLine = document.lineAt(position.line)
  // 開始位置提示
  let startRanges = itemTool.findRanges(textLine, new RegExp(/^\s*\w+/))
  if (startRanges && startRanges.length > 0 && startRanges[0].contains(position)) {
    const is = ["native", "constant", "local", "set", "call", "return", "if", "elseif", "else", "endif", "function", "endfunction", "globals", "endglobals", "loop", "endloop", "exitwhen", "type"]
    is.forEach(s => {
      items.push(new vscode.CompletionItem(s, vscode.CompletionItemKind.Keyword))
    })
    clazzs.forEach(s => {
      items.push(new vscode.CompletionItem(s, vscode.CompletionItemKind.Class))
    })
    return items
  }

  // constant後面 native 或者 類型
  let nativeRanges = itemTool.findRanges(textLine, new RegExp(/(?<=constant\s+)\w+/))
  if (nativeRanges && nativeRanges.length > 0 && nativeRanges.findIndex(s => s.contains(position)) > -1) {
    items.push(new vscode.CompletionItem("native", vscode.CompletionItemKind.Class))
    clazzs.forEach(s => {
      items.push(new vscode.CompletionItem(s, vscode.CompletionItemKind.Class))
    })
    return items
  }

  // constant後面 native 或者 類型
  let localRanges = itemTool.findRanges(textLine, new RegExp(/(?<=local\s+)\w+/))
  if (localRanges && localRanges.length > 0 && localRanges.findIndex(s => s.contains(position)) > -1) {
    clazzs.forEach(s => {
      items.push(new vscode.CompletionItem(s, vscode.CompletionItemKind.Class))
    })
    return items
  }

  // set
  let setRanges = itemTool.findRanges(textLine, new RegExp(/(?<=set\s+)\w+/))
  if (setRanges && setRanges.length > 0 && setRanges.findIndex(s => s.contains(position)) > -1) {
    Object.keys(jg).filter(s => !jg[s].isConstant).forEach(s => {
      let variable = jg[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind.Variable)
      item.detail = `${variable.name} (${variable.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(variable.documentation).appendCodeblock(variable.original)
      item.insertText = variable.name
      items.push(item)
    })
    return items
  }

  // call
  let callRanges = itemTool.findRanges(textLine, new RegExp(/(?<=call\s+)\w+/))
  if (callRanges && callRanges.length > 0 && callRanges.findIndex(s => s.contains(position)) > -1) {
    Object.keys(j).forEach(s => {
      let fn = j[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind.Function)
      item.detail = `${fn.name} (${fn.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(fn.documentation).appendCodeblock(fn.original)
      item.insertText = fn.insertText
      items.push(item)
    })
    return items
  }

  // type name = \w
  let stateRanges = itemTool.findRanges(textLine, new RegExp(`(?<=(${clazzs.join("|")})\\s+\\w+\\s*=\\s*)\\w+`))
  let stateTypeRanges = itemTool.findRanges(textLine, new RegExp(`(${clazzs.join("|")})(?=\\s+\\w+\\s*=\\s*\\w+)`))
  let stateIndex = 0
  if (stateRanges && stateRanges.length > 0 && (stateIndex = stateRanges.findIndex(s => s.contains(position))) > -1) {
    let type = document.getText(stateTypeRanges[stateIndex])
    // 返回類型需一致
    Object.keys(j).filter(s => j[s].returnType == type).forEach(s => {
      let fn = j[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind.Function)
      item.detail = `${fn.name} (${fn.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(fn.documentation).appendCodeblock(fn.original)
      item.insertText = fn.insertText
      items.push(item)
    })
    Object.keys(jg).filter(s => jg[s].type == type).forEach(s => {
      let value = jg[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind[value.isConstant ? "Constant" : "Variable"])
      item.detail = `${value.name} (${value.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(value.documentation).appendCodeblock(value.original)
      item.insertText = value.insertText
      items.push(item)
    })
    return items
  }

  // + \w
  let pushRanges = itemTool.findRanges(textLine, new RegExp(/(?<=\+\s*)\w+/))
  if (pushRanges && pushRanges.length > 0 && pushRanges.findIndex(s => s.contains(position)) > -1) {
    // 返回類型需一致
    Object.keys(j).filter(s => {
      let returnType = j[s].returnType
      return returnType == "integer" || returnType == "real" || returnType == "string"
    }).forEach(s => {
      let fn = j[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind.Function)
      item.detail = `${fn.name} (${fn.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(fn.documentation).appendCodeblock(fn.original)
      item.insertText = fn.insertText
      items.push(item)
    })
    Object.keys(jg).filter(s => {
      let type = jg[s].type
      return type == "integer" || type == "real" || type == "string"
    }).forEach(s => {
      let value = jg[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind[value.isConstant ? "Constant" : "Variable"])
      item.detail = `${value.name} (${value.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(value.documentation).appendCodeblock(value.original)
      item.insertText = value.insertText
      items.push(item)
    })
    return items
  }

  // *-/ \w
  let msdRanges = itemTool.findRanges(textLine, new RegExp(/(?<=(\*|\-|\/)\s*)\w+/))
  if (msdRanges && msdRanges.length > 0 && msdRanges.findIndex(s => s.contains(position)) > -1) {
    // 返回類型需一致
    Object.keys(j).filter(s => {
      let returnType = j[s].returnType
      return returnType == "integer" || returnType == "real"
    }).forEach(s => {
      let fn = j[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind.Function)
      item.detail = `${fn.name} (${fn.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(fn.documentation).appendCodeblock(fn.original)
      item.insertText = fn.insertText
      items.push(item)
    })
    Object.keys(jg).filter(s => {
      let type = jg[s].type
      return type == "integer" || type == "real"
    }).forEach(s => {
      let value = jg[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind[value.isConstant ? "Constant" : "Variable"])
      item.detail = `${value.name} (${value.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(value.documentation).appendCodeblock(value.original)
      item.insertText = value.insertText
      items.push(item)
    })
    return items
  }

  if (itemTool.findGlobals(document).findIndex(s => s.contains(position)) > -1 ||
    itemTool.findFunctions(document).findIndex(s => s.contains(position)) > -1) {
    // 返回類型需一致
    Object.keys(j).forEach(s => {
      let fn = j[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind.Function)
      item.detail = `${fn.name} (${fn.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(fn.documentation).appendCodeblock(fn.original)
      item.insertText = fn.insertText
      items.push(item)
    })
    Object.keys(jg).forEach(s => {
      let value = jg[s]
      let item = new vscode.CompletionItem(s, vscode.CompletionItemKind[value.isConstant ? "Constant" : "Variable"])
      item.detail = `${value.name} (${value.fileName})`
      item.documentation = new vscode.MarkdownString().appendText(value.documentation).appendCodeblock(value.original)
      item.insertText = value.insertText
      items.push(item)
    })
    return items
  }

  // let startRanges = itemTool.findRanges(document.lineAt(position.line), new RegExp(/^\s*\w+/))

  // for (let i = 0; i < startRanges.length; i++) {

  //   if (startRanges[i].contains(position)) {
  //     console.log(document.getText(startRanges[i]))
  //     // native constant local set call return if elseif else endif function endfunction globals endglobals loop endloop exitwhen type 基本數據類型 類
  //     const is = ["native", "constant", "local", "set", "call", "return", "if", "elseif", "else", "endif", "function", "endfunction", "globals", "endglobals", "loop", "endloop", "exitwhen", "type"]
  //     const clazzs = Object.keys(type)
  //     is.forEach(s => {
  //       items.push(new vscode.CompletionItem(s, vscode.CompletionItemKind.Keyword))
  //     })
  //     clazzs.forEach(s => {
  //       items.push(new vscode.CompletionItem(s, vscode.CompletionItemKind.Class))
  //     })
  //   }
  // }

  return items
}


/**
 * 
 * tips 0.0.3 当前能避免在字符串 注释 代号中弹出提示
 * @param {vscode.TextDocument} document 
 * @param {vscode.Position} position 
 * @param {vscode.CancellationToken} token 
 * @param {vscode.CompletionContext} context 
 * @returns {vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList>}
 */
const provideCompletionItems = (document, position, token, context) => {
  /**
   * 字符串 注释 代号 set后 type后 function定义后 takes后 returns后 constant后 array后 native
   */



  let items = []
  if (itemTool.cheakInComment(document, position) || itemTool.cheakInString(document, position) ||
    itemTool.cheakInCode(document, position)) {
    return items
  }
  getPre(document, position).forEach(s => {
    items.push(s)
  })

  /*
  // 添加关键字
  for (const key in keyword) {
    let item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Keyword)
    item.detail = key
    item.documentation = new vscode.MarkdownString(keyword[key])
    items.push(item)
  }
  // 添加内置类
  for (const key in type) {
    let item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Class)
    item.detail = key
    item.documentation = new vscode.MarkdownString(type[key])
    items.push(item)
  }
  if (document.fileName.endsWith(".j")) {
    // 添加方法 全局
    items = Object.keys(j).filter(x => j[x].fileName.endsWith(".j")).map(x => {
      let api = j[x]
      let item = new vscode.CompletionItem(api.name, vscode.CompletionItemKind.Function)
      item.detail = api.name + "(" + api.fileName + ")"
      item.documentation = new vscode.MarkdownString()
        .appendCodeblock(api.documentation)
        .appendCodeblock(api.original)
      item.insertText = api.insertText
      return item
    }).concat(Object.keys(jg).filter(x => jg[x].fileName.endsWith(".j")).map(x => {
      let api = jg[x]
      let item = new vscode.CompletionItem(api.name,
        api.isConstant ? vscode.CompletionItemKind.Constant : vscode.CompletionItemKind.Variable)
      item.detail = api.name + "(" + api.fileName + ")"
      item.documentation = new vscode.MarkdownString()
        .appendCodeblock(api.documentation)
        .appendCodeblock(api.original)
      item.insertText = api.name
      return item
    }))
  } else if (document.fileName.endsWith(".ai")) {
    items = Object.keys(j).filter(x => j[x].fileName == "common.j" || j[x].fileName == "common.ai").map(x => {
      let api = j[x]
      let item = new vscode.CompletionItem(api.name, vscode.CompletionItemKind.Function)
      item.detail = api.name + "(" + api.fileName + ")"
      item.documentation = new vscode.MarkdownString()
        .appendCodeblock(api.documentation)
        .appendCodeblock(api.original)
      item.insertText = api.insertText
      return item
    }).concat(Object.keys(jg).filter(x => jg[x].fileName == "common.j" || jg[x].fileName == "common.ai").map(x => {
      let api = jg[x]
      let item = new vscode.CompletionItem(api.name,
        api.isConstant ? vscode.CompletionItemKind.Constant : vscode.CompletionItemKind.Variable)
      item.detail = api.name + "(" + api.fileName + ")"
      item.documentation = new vscode.MarkdownString()
        .appendCodeblock(api.documentation)
        .appendCodeblock(api.original)
      item.insertText = api.name
      return item
    }))
  }*/
  return items
}

/**
 * 
 * @param {vscode.CompletionItem} item 
 * @param {vscode.CancellationToken} token 
 * @returns {vscode.ProviderResult<vscode.CompletionItem>}
 */
const resolveCompletionItem = (item, token) => {
  return item
}

module.exports = {
  provideCompletionItems, resolveCompletionItem
}
