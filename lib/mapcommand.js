class MapCommand {
  constructor() {
    this._cmdregister = {}
    this._cmdcategory = {}
    this._shortcut = {}
  }

  set(cmd, category, option, cb) {
    if(typeof cmd != 'string') {
      throw new Error(`${cmd} only string!`)
    }
    if(typeof category != 'string') {
      throw new Error('No category for this command?')
    }
    if(typeof cb != 'function') {
      throw new Error('Only function to apply callback')
    }
    if(!this._cmdcategory[category]) {
      this._cmdcategory[category] = {}
    }
    this._cmdcategory[category][cmd] = option || ""
    this._cmdregister[cmd] = cb
  }

  aliasCommand(shortcut, targetcmd) {
    if(!Array.isArray(shortcut)) {
      throw new Error("To apply shortcut, only array type!")
    }
    if(typeof targetcmd != "string" || !targetcmd) {
      throw new Error("Provide the desired target before execution")
    }
    shortcut.forEach(a => {
      if(this._shortcut[a]) {
        throw new Error(`This shortcut ${a} is already available for commands ${this._shortcut[a]}, you cannot use this`)
      }
      if(this._cmdregister[a]) return;
      this._shortcut[a] = targetcmd
    })
  }
  
  signCommand(msg, wa) {
    if(typeof (msg.cmd && msg.perfix) != 'string') return;
    if(this._cmdregister[msg.cmd]) {
      console.log("[TriggerMessageContext]:", msg.cmd)
      this._cmdregister[msg.cmd](msg, wa)
    }
    if(this._shortcut[msg.cmd]) {
      const sht = this._shortcut[msg.cmd]
      if(this._cmdregister[sht]) {
        this._cmdregister[sht]({
          ...msg,
          cmd: sht,
          shortcut: msg.cmd
        }, wa)
      }
    }
    return;
  }
}

module.exports = MapCommand