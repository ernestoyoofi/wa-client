const fs = require("fs")

const defaultFolder = process.cwd()+"/optionreply"

const checkingAndCreateInit = () => {
  if(!fs.existsSync(defaultFolder) || !fs.lstatSync(defaultFolder).isFile()) {
    fs.writeFileSync(defaultFolder, "", "utf-8")
  }
}

function ReadIdOptionReply(id) {
  checkingAndCreateInit()
  const texted = fs.readFileSync(defaultFolder, "utf8").split("\n").map(a => a.trim())
  if(texted.map(a => a.split(" ===")[0]).indexOf(id) == -1) {
    return null
  }
  return texted[texted.map(a => a.split(" ===")[0]).indexOf(id)].split("===")[1].split("|||")
}

function WriteIdOptionReply(id, option) {
  checkingAndCreateInit()
  const readData = fs.readFileSync(defaultFolder, "utf8").split("\n")
  const texted = readData.length > 200? readData.slice(0, 200).map(a => a.trim()) : readData.map(a => a.trim())
  const optnX = id+" ==="+Object.keys(option).join("|||")
  let toTxted = texted
  if(!texted[0]) {
    toTxted += optnX
  } else {
    toTxted += '\n'+optnX
  }

  fs.writeFileSync(defaultFolder, toTxted, "utf8")
  return true
}

module.exports = {
  ReadIdOptionReply,
  WriteIdOptionReply
}