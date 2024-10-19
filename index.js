const WhatsApp = require("./lib/main")

const wa = new WhatsApp({
  waversion: [2, 3000, 1015901307],
  qrcode: true,
  perfix: "!.$".split("")
})

wa.on("message", async (msg) => {
  console.log(msg)
  if (msg?.text?.startsWith('>')) {
    try {
      let evaled = await eval(msg.text.slice(2))
      if (typeof evaled !== 'string') {
        evaled = require('util').inspect(evaled)
      }
      wa.sendMsg(msg.jid, {
        text: evaled
      }, { quoted: msg })
    } catch (err) {
      wa.sendMsg(msg.jid, {
        text: String(err)
      }, { quoted: msg })
    }
  }
})