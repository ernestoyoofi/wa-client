const { getAggregateVotesInPollMessage, useMultiFileAuthState, getWAUploadToServer, DisconnectReason, generateMessageID, generateWAMessageContent, fetchLatestBaileysVersion, proto } = require("@whiskeysockets/baileys")
const WhatsApp_Websocket = require("@whiskeysockets/baileys").default
const P = require("pino")
const qrcode_tm = require("qrcode-terminal")
const defaultConfig = require("./default")
const { searchKey, extractOnceViewMessage, contextInfoExtract, modiferMessage } = require("./msg-modif")
const { WriteTimeDisappire, ReadTimeDisappire } = require("./disappire")
const { WriteIdOptionReply } = require("./optionreply")

class WhatsApp {
  constructor(options) {
    this.configapp = {
      ...defaultConfig.balieyscontent,
      ...options
    }
    this.events = {}
    this.connection = false
    this.pairingCode = false
    this.WhatsAppClientStartUp()
  }
  async WhatsAppClientStartUp() {
    const { state, saveCreds } = await useMultiFileAuthState(this.configapp.authfolder)
    let lastVersion = null
    if(this.configapp?.useLastVersion == true) {
      const { version, isLatest } = await fetchLatestBaileysVersion()
      console.log(`[📕 Client]: Client has set version to : ${version.join(".")}`)
    }
    const socket = WhatsApp_Websocket({
      auth: state,
      logger: P({ level: this.configapp.pinolevel }),
      printQRInTerminal: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: true,
      version: !!this.configapp.defaultVersion? undefined : !!lastVersion? lastVersion : (this.configapp.waversion || [2,2323,4]),
      browser: ["Google Chrome (Windows)", "browser", "20.0.40"],
    })
    socket.ev.on("creds.update", saveCreds)
    socket.ev.on("connection.update", async (connectWA) => {
      const { connection, lastDisconnect, qr } = connectWA
      if(typeof qr === "string") {
        if(this.configapp?.qrcode === true) {
          qrcode_tm.generate(qr, {small:true})
        }
        if(typeof this.configapp?.phone != "string" && this.configapp?.qrcode === false) {
          console.log('[📌 Error]: Add your phone in config !')
          return process.exit(1)
        }
        if(!this.pairingCode && this.configapp?.qrcode != true) {
          const dataCode = await socket.requestPairingCode(this.configapp.phone.replace(/\D/g,""))
          console.log(`[CODE PAIRING]\n📌 Code: ${dataCode}\n📲 Phone: ${this.configapp.phone.replace(/\D/g,"")}`)
        }
        this.pairingCode = true
      }
      if(connection === "close") {
        const tryConnect = lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
        this.connection = false
        this.pairingCode = false
        console.log("[📕 Client]: SOCKETING ERROR!\n", lastDisconnect.error)
        if(tryConnect) {
          setTimeout(() => {
            console.log("[📕 Connection Status]: Try Connect ...")
            this.WhatsAppClientStartUp()
          }, 1500)
        } else {
          console.log("[📕 Connection Status]: Connection Close !")
          process.exit(1)
        }
      }
      if(connection === "open") {
        this.pairingCode = false
        this.connection = true
        console.log("[📕 Connection Status]: Connection Open !")
      }
    })
    socket.sendMsg = async (jid, message, context) => {
      const dataTime = ReadTimeDisappire(jid)
      return await socket.sendMessage(jid, {
        ...message
      }, {
        ephemeralExpiration: dataTime, ...context
      })
    }
    socket.sendNewsletter = async (jid, message, options) => {
      const messagesBuild = await generateWAMessageContent(message, {
        upload: async (read, opts) => {
          const up = getWAUploadToServer(read, { ...opts })
          return up
        },
        ...options
      })
      const plaintext = proto.Message.encode(messagesBuild).finish()
      const plaintextNode = {
        tag: 'plaintext',
        attrs: {},
        content: plaintext
      }
      const node = {
        tag: 'message',
        attrs: {
          to: jid,
          type: 'text'
        },
        content: [plaintextNode]
      }
      console.log(messagesBuild, node)
      return await socket.query(node)
    }
    socket.sendOptionReply = async (jid, options = { caption, options }, context) => {
      if(typeof options.caption != 'string') {
        throw new Error("Only string or text mode can use!")
      }
      if(Array.isArray(options.options)) {
        throw new Error("Only object cmd string to accpted")
      }
      let createOption = []
      Object.keys(options.options).forEach((a, i) => {
        createOption.push(`${Number(i)+1}. ${options.options[a]}`)
      })
      if(!createOption[0]) {
        throw new Error("Can't create option, please check parameters!")
      }
      const texted = options.caption+"\n\n*[ SELECT REPLY OPTION]*\n"+createOption.join("\n")
      const sendMsg = await socket.sendMsg(jid, {
        text: texted
      }, context)
      const idReplyOption = `${sendMsg.key.remoteJid}-${sendMsg.key.id}`
      WriteIdOptionReply(idReplyOption, options.options)
      return sendMsg
    }
    socket.adminStatus = async (jid, arrayPhone) => {
      const seft = socket.user.id.split("@")[0].split(":")[0]
      const phoneCollect = [...arrayPhone.map(a => a.split("@")[0].split(":")[0].replace(/\D/g,"")), `${seft}` ]
      const getList = await socket.groupMetadata(jid)
      let requestList = {}
      for(let a of phoneCollect) {
        const indexId = getList.participants.map(a => a.id.split("@")[0].split(":")[0].replace(/\D/g,"")).indexOf(a)
        if(indexId != -1) {
          requestList[a === seft? "me": a] = !!getList.participants[indexId].admin
        }
      }
      return requestList
    }
    Object.keys(defaultConfig.event).forEach(eventName => {
      defaultConfig.event[eventName].forEach(balieysKey => {
        if(this.events[eventName]) {
          socket.ev.on(balieysKey, (e) => {
            if(eventName === "message") {
              const contentModif = modiferMessage(
                e.messages[0],
                socket,
                this.configapp.perfix
              )
              if(contentModif?.isContent) {
                WriteTimeDisappire(contentModif.jid, contentModif.disappireTime)
              }
              this.events[eventName].map(cb => {
                cb({
                  TypeContent: e.type,
                  ...e.messages[0],
                  ...contentModif,
                })
              })
            } else {
              this.events[eventName].map(cb => { cb(e) })
            }
          })
        }
      })
    })
    Object.keys(socket).forEach(p => {
      this[p] = socket[p]
    })
  }
  on(eventName, callbackEvent) {
    if(!defaultConfig.event[eventName]) {
      return new Error("No Event Register !")
    }
    if(!this.events[eventName]) {
      this.events[eventName] = []
    }
    this.events[eventName].push(callbackEvent)
  }
}

module.exports = WhatsApp
