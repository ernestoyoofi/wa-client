const configDefault = require("./default")
const DebugInit = require("./debugging")
const fs = require("fs")

class DatabaseTimeDisappire {
  constructor({ path, debugging }) {
    this.db_location = path || configDefault.clientconfig.dbtimepath
    this.debug = new DebugInit(debugging)
    this.__TestRun()
  }
  // Run Test This Part
  __TestRun() {
    fs.writeFileSync(this.db_location, '{}', "utf-8")
  }
  ReadTime(id) {
    try {
      const readingFile = fs.readFileSync(this.db_location, "utf-8")
      const jsonData = JSON.parse(readingFile)
      return jsonData[id]
    } catch(e) {
      this.debug.error('[ReadTime Error]', e.stack)
      return null
    }
  }
  WriteTime(id, value) {
    try {
      const readingFile = fs.readFileSync(this.db_location, "utf-8")
      let jsonData = JSON.parse(readingFile)
      jsonData[id] = value
      fs.writeFileSync(this.db_location,JSON.stringify(jsonData,null,2),"utf-8")
      return true
    } catch(e) {
      this.debug.error('[WriteTime Error]', e.stack)
      return false
    }
  }
}

module.exports = DatabaseTimeDisappire