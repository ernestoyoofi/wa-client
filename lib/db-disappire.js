const configDefault = require("./default")
const DebugInit = require("./debugging")
const fs = require("fs")
const path = require("path")

class DatabaseTimeDisappire {
  constructor({ path, debugging, updateView = 1000*60*2 }) {
    this.db_location = path || configDefault.clientconfig.dbtimepath
    this.debug = new DebugInit(debugging)
    this.intervalSave = updateView
    this.__loadertime = {}
    this.__intervalF = null
    this.__TestRun()
  }
  // Run Test This Part
  __TestRun() {
    const parse = path.parse(this.db_location)
    if(!fs.existsSync(parse.dir) || fs.lstatSync(parse.dir).isFile()) {
      fs.mkdirSync(parse.dir, { recursive: true, force: true })
    }
    fs.writeFileSync(this.db_location, '{}', "utf-8")
    const readFile = fs.readFileSync(this.db_location, "utf-8")
    try {
      const readJson = JSON.parse(readFile)
      this.__loadertime = readJson
    } catch(e) {
      fs.writeFileSync(this.db_location, '{}', "utf-8")
      __TestRun()
    }
    if(this.__intervalF) {
      clearInterval(this.__intervalF)
    }
    this.__intervalF = setInterval(() => {
      fs.writeFileSync(this.db_location, JSON.stringify(this.__loadertime,null,2), "utf8")
    },this.intervalSave)
  }
  ReadTime(id) {
    console.log("Read", this.__loadertime[id], this.__loadertime)
    return this.__loadertime[id] || null
    // try {
    //   const readingFile = fs.readFileSync(this.db_location, "utf-8")
    //   const jsonData = JSON.parse(readingFile)
    //   return jsonData[id]
    // } catch(e) {
    //   this.debug.error('[ReadTime Error]', e.stack)
    //   return null
    // }
  }
  WriteTime(id, value) {
    this.__loadertime[id] = value
    console.log("Write:", this.__loadertime[id])
    return true
    // try {
    //   const readingFile = fs.readFileSync(this.db_location, "utf-8")
    //   let jsonData = JSON.parse(readingFile)
    //   if(jsonData[id] !== value) {
    //     jsonData[id] = value
    //     fs.writeFileSync(this.db_location,JSON.stringify(jsonData,null,2),"utf-8")
    //   }
    //   return true
    // } catch(e) {
    //   this.debug.error('[WriteTime Error]', e.stack)
    //   return false
    // }
  }
}

module.exports = DatabaseTimeDisappire