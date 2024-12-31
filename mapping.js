class MappingCommand {
  constructor() {
    this.register = {}
    this.category = {}
    this.shortcutcmd = {}
  }

  set(cmd, category, option, cb) {
    if(cmd === null || !["string","object"].includes(typeof cmd)) {
      throw new Error(`${cmd} only string!`)
    }
    if(typeof category != 'string') {
      throw new Error('No category for this command?')
    }
    if(typeof cb != 'function') {
      throw new Error('Only function to apply callback')
    }
    if(!this.category[category]) {
      this.shortcutcmd[category] = {}
      this.category[category] = {}
    }
    if(Array.isArray(cmd)) {
      cmd.forEach(cmd_tc => {
        if(cmd[0] === cmd_tc) {
          this.category[category][cmd_tc] = option || ""
        } else {
          this.shortcutcmd[category][cmd_tc] = option || ""
        }
        this.register[cmd_tc] = cb
      })
    } else {
      this.category[category][cmd] = option || ""
      this.register[cmd] = cb
    }
  }

  use(Route) {
    for(let cmdkey of Object.keys(Route.register)) {
      if(this.register[cmdkey]) {
        throw new Error(`${cmdkey} is ready register in other function register!`)
      }
      this.register[cmdkey] = Route.register[cmdkey]
    }
    for(let cate of Object.keys(Route.category)) {
      if(!this.category[cate]) {
        this.category[cate] = {}
      }
      for(let cmdReg of Object.keys(Route.category[cate])) {
        this.category[cate][cmdReg] = Route.category[cate][cmdReg]
      }
    }
    for(let cate of Object.keys(Route.shortcutcmd)) {
      if(!this.shortcutcmd[cate]) {
        this.shortcutcmd[cate] = {}
      }
      for(let cmdReg of Object.keys(Route.shortcutcmd[cate])) {
        this.shortcutcmd[cate][cmdReg] = Route.shortcutcmd[cate][cmdReg]
      }
    }
  }

  listMsg(prefix) {
    let tgList = {}
    for(let cate of Object.keys(this.category)) {
      let toTextList = []
      for(let cmdReg of Object.keys(this.category[cate])) {
        toTextList.push(`› ${prefix||"/"}${cmdReg} ${this.category[cate][cmdReg]}`)
      }
      tgList[cate] = toTextList
    }
    return tgList
  }

  regcmd(msg, wa) {
    if(typeof (msg.cmd && msg.perfix) != "string") return;
    if(this.register[msg.cmd]) {
      console.log("[Trigger]:", msg.cmd)
      this.register[msg.cmd](msg, wa)
    }
  }
}

module.exports = MappingCommand