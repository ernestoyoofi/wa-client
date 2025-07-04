const {
  getAggregateVotesInPollMessage,
  useMultiFileAuthState,
  getWAUploadToServer,
  fetchLatestBaileysVersion,
  DisconnectReason,
  proto,
  Browsers
} = require("@whiskeysockets/baileys")
const WhatsAppClient = require("@whiskeysockets/baileys").default
const P = require("pino")
const qrcodeTerminal = require("qrcode-terminal")
const configDefault = require("./default")
const { searchKey, extractOnceViewMessage, contextInfoExtract, modiferMessage } = require("./modified-msg")
const DebugInit = require("./debugging")
const DatabaseTimeDisappire = require("./db-disappire")

class WhatsApp {
  constructor(options) {
    this.whatsappconfig = {
      ...configDefault.balieyscontent,
      ...options
    }
    this.events = {}
    this.debugging_level = configDefault.balieyscontent.debugging
    this.debugging = new DebugInit(options.debugging || configDefault.balieyscontent.debugging)
    this.timedb = new DatabaseTimeDisappire({
      path: this.whatsappconfig.db_path||configDefault.clientconfig.dbtimepath
    })
    this.connection = false
    this.pairingCode = false
    this.WhatsAppClientStartUp()
  }
  on(event, callback) {
    if(!configDefault.event[event]) {
      return new Error("No Event Register!")
    }
    if(!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }
  async WhatsAppClientStartUp() {
    const { state, saveCreds } = await useMultiFileAuthState(this.whatsappconfig.authfolder)
    let lastVersion = null
    if(this.whatsappconfig?.useLastVersion === true) {
      const { version } = await fetchLatestBaileysVersion()
      lastVersion = version
    }
    const useLinuxBrowser = (!this.whatsappconfig?.qrcode && !!this.whatsappconfig?.phone)
    const socket = WhatsAppClient({
      auth: state,
      logger: P({ level: this.whatsappconfig.pinolevel }),
      printQRInTerminal: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: true,
      version: this.whatsappconfig.lastVersion === true? lastVersion
      :(this.whatsappconfig.version||configDefault.balieyscontent.version),
      browser: this.whatsappconfig?.browser||(useLinuxBrowser? ["Linux", "Chrome", "Chrome 114.0.5735.198"] : Browsers.windows("Dekstop")),
      ...(this.whatsappconfig?.others||{})
    })
    socket.ev.on("creds.update", saveCreds)
    socket.ev.on("connection.update", async (connect_wa) => {
      const botIdUni = (socket.user?.id?.split("@")[0]?.split(":")[0])
      const botIdProfile = {
        tag: botIdUni+"@s.whatsapp.net",
        text: "@"+botIdUni
      }
      socket.profile = botIdProfile
      const { connection, lastDisconnect, qr } = connect_wa
      if(connection === "close") {
        const tryConnect = lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
        this.connection = false
        this.pairingCode = false
        this.debugging.error("Socket connection error!", lastDisconnect.error)
        if(tryConnect) {
          setTimeout(() => {
            this.debugging.warn("Try connection again...")
            this.WhatsAppClientStartUp()
          }, 1500)
        } else {
          this.debugging.error("Close!")
          process.exit(1)
        }
      }
      if(connection === "open") {
        this.debugging.success("Success To Login!")
        this.connection = true
        this.pairingCode = false
      }
      if(typeof qr === "string") {
        if(this.whatsappconfig?.qrcode === true && this.whatsappconfig?.viewOnLog) {
          this.debugging.log("[QRCode To Device Logging]")
          qrcodeTerminal.generate(qr, { small: true })
        }
        if(typeof this.whatsappconfig?.phone != "string" && this.whatsappconfig?.qrcode === false) {
          this.debugging.error("Adding your phone in configuration!")
          return process.exit(1)
        }
        if(!this.pairingCode && this.whatsappconfig?.qrcode !== true && this.whatsappconfig?.viewOnLog) {
          const dataCode = await socket.requestPairingCode(this.whatsappconfig?.phone?.replace(/\D/g,""))
          this.debugging.warn("[Quick Adding Into Code!]")
          this.debugging.log(`Code: ${dataCode}`)
        }
        this.pairingCode = true
      }
    })
    const botIdUni = (socket.user?.id?.split("@")[0]?.split(":")[0])
    const botIdProfile = {
      tag: botIdUni+"@s.whatsapp.net",
      text: "@"+botIdUni
    }
    socket.profile = botIdProfile
    socket.sendMsg = async (jid, content, options) => {
      const dataTime = this.timedb.ReadTime(jid)
      return await socket.sendMessage(jid, content, {
        ephemeralExpiration: dataTime,
        ...options,
      })
    }
    Object.keys(socket).forEach(key => {
      this[key] = socket[key]
    })
    Object.keys(configDefault.event).forEach(eventName => {
      configDefault.event[eventName].forEach(keyEvent => {
        if(this.events[eventName]) {
          socket.ev.on(keyEvent, (data) => {
            let eventModifData = {}
            if(eventName === "message") {
              const contentMsg = modiferMessage(
                data.messages[0],
                socket, this.whatsappconfig.perfix
              )
              if(contentMsg?.isContent) {
                this.timedb.WriteTime(contentMsg.jid, contentMsg.disappireTime)
              }
              eventModifData = contentMsg
            }
            this.events[eventName].map(callback => {
              callback(eventName === "message"? {
                allowParsing: data.type === "notify",
                TypeContent: data.type,
                ...data.messages[0],
                ...eventModifData
              }:data)
            })
          })
        }
      })
    })
  }
}

module.exports = WhatsApp
