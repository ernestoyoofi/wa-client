class DebuggingConsole {
  constructor(level = 0) {
    // Level 0 = "all", 1 = "error", 2 = "warn", 3 = "debug/info"
    this.level = level
  }
  log(...message) {
    if(this.level == 0 || this.level == 3) {
      console.log("[\x1b[90mLOG\x1b[0m]:",...message)
    }
  }
  info(...message) {
    if(this.level == 0 || this.level == 3) {
      console.log("[\x1b[34mINFO\x1b[0m]:",...message)
    }
  }
  success(...message) {
    if(this.level == 0 || this.level == 3) {
      console.log("[\x1b[32mSUCCESS\x1b[0m]:",...message)
    }
  }
  warn(...message) {
    if(this.level == 0 || this.level == 3) {
      console.warn("[\x1b[33mWARN\x1b[0m]:",...message)
    }
  }
  error(...message) {
    if(this.level == 0 || this.level == 1) {
      console.error("[\x1b[31mERROR\x1b[0m]:",...message)
    }
  }
}

module.exports = DebuggingConsole