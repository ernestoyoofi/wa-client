class DebuggingConsole {
  constructor(level = 0) {
    // Level 0 = "all", 1 = "error", 2 = "warn", 3 = "debug/info"
    this.level = level
  }
  log(...message) {
    if(this.level == 0 || this.level == 3) {
      console.log("[\x1b[90m LOG \x1b[0m]:",...message)
    }
  }
  info(...message) {
    if(this.level == 0 || this.level == 3) {
      console.log("[\x1b[34m INFO \x1b[0m]:",...message)
    }
  }
  success(...message) {
    if(this.level == 0 || this.level == 3) {
      console.log("[\x1b[32m SUCCESS \x1b[0m]:",...message)
    }
  }
  warn(...message) {
    if(this.level == 0 || this.level == 3) {
      console.warn("[\x1b[33m WARN \x1b[0m]:",...message)
    }
  }
  error(...message) {
    if(this.level == 0 || this.level == 1) {
      console.error("[\x1b[31m ERROR \x1b[0m]:",...message)
    }
  }
}

module.exports = DebuggingConsole
