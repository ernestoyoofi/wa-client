# WhatsApp Client Bot (@whiskeysockets/baileys)

Simple use of whatsapp client without configuration complexity and just use

## Installation

Use this command or cloneing this repository [[https://github.com/ernestoyoofi/wa-client.git](https://github.com/ernestoyoofi/wa-client.git)]

```bash
npm i wa-client@https://github.com/ernestoyoofi/wa-client.git
```

## Used?

Create Socket Realtime

```js
const WhatsApp = require("wa-client")
const wa = new WhatsApp({
  pinolevel: "silent", // Pino Debugging Baileys Library
  authfolder: `${process.cwd()}/auth`, // Auth Message
  storefolder: `${process.cwd()}/store`, // Store Data Message (Now, it not used to reduce heavy performance)
  version: [2,3000,1019105392], // Version WhatsApp
  debugging: 0,  // Log Debugging
  viewOnLog: true, // Log Debugging 
  perfix: ["!"], // Perfix Code Extracted
  phone: "************", // Phone Number For Login
  qrcode: true, // Qrcode Login Type (If Set False, Try Using Phone Number
  other: {
    // Other Configuration For Balieys MakeWaSocket
  }
})
```

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
