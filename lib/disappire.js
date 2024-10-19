const fs = require("fs")

const defaultFolder = process.cwd()+"/timedestory"

const checkingAndCreateInit = () => {
  if(!fs.existsSync(defaultFolder) || !fs.lstatSync(defaultFolder).isFile()) {
    fs.writeFileSync(defaultFolder, "{}", "utf-8")
  }
}

function ReadTimeDisappire(jid) {
  checkingAndCreateInit()
  try {
    const dataTime = JSON.parse(fs.readFileSync(defaultFolder, "utf-8"))
    return dataTime[jid]
  } catch(err) {
    console.log("TIME READER ERROR:", err)
    fs.writeFileSync(defaultFolder, "{}", "utf-8")
  }
}

function WriteTimeDisappire(jid, time) {
  checkingAndCreateInit()
  try {
    const dataTime = JSON.parse(fs.readFileSync(defaultFolder, "utf-8"))
    if(!time || typeof time != "number" || time < 2) {
      delete dataTime[jid]
      fs.writeFileSync(defaultFolder, JSON.stringify(dataTime,null,2), "utf-8")
      return;
    }
    dataTime[jid] = time
    fs.writeFileSync(defaultFolder, JSON.stringify(dataTime,null,2), "utf-8")
  } catch(err) {
    console.log("TIME READER ERROR:", err)
    fs.writeFileSync(defaultFolder, "{}", "utf-8")
  }
}

module.exports = {
  WriteTimeDisappire,
  ReadTimeDisappire
}