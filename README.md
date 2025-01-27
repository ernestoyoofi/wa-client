# WhatsApp Client Bot (@whiskeysockets/baileys)

Simple use of whatsapp client without configuration complexity and just use

## Installation

Use this command or cloneing this repository [[https://github.com/ernestoyoofi/wa-client.git](https://github.com/ernestoyoofi/wa-client.git)]

```bash
npm i wa-client@https://github.com/ernestoyoofi/wa-client.git
```

## Used?

Connect WhatsApp

```js
const WhatsApp = require("wa-client")
const wa = new WhatsApp({
  qrcode: true // Use With QRCode
})
wa.on("message", async (msg) => {
  console.log(msg)
})
```

Simple register command

```js
const WhatsApp = require("wa-client")
const Mapping = require("wa-client/mapping")

const cmd = new Mapping()
const wa = new WhatsApp({
  qrcode: true
})

//    Command | Category | Option | Callback
cmd.set("test", "test", "<text>", (msg, wa) => {
  wa.sendMsg(msg.jid, {
    text: "Halo!"
  }, { quoted: msg })
})

wa.on("message", async (msg) => {
  cmd.regcmd(msg, wa)
})
```
