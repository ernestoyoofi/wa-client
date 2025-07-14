const {
  getAggregateVotesInPollMessage,
  useMultiFileAuthState,
  getWAUploadToServer,
  fetchLatestBaileysVersion,
  DisconnectReason,
  proto,
  Browsers
} = require("@whiskeysockets/baileys")
const {
  ModiferMessages
} = require("./modified-msg")
const MakeWhatsAppSocket = require("@whiskeysockets/baileys").default
const P = require("pino")
const qrcodeTerminal = require("qrcode-terminal")
const configDefault = require("./default")
const DebugInit = require("./debugging")
const DatabaseTimeDisappire = require("./db-disappire")
const fs = require("fs")

class WhatsApp {
  constructor(options) {
    this.whatsappconfig = {
      ...configDefault.balieyscontent,
      ...options
    }
    this.events = {}
    this.fn_key = []
    this.debugging___level = configDefault.balieyscontent.debugging
    this.debugging__ = new DebugInit(options.debugging || configDefault.balieyscontent.debugging)
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
    const socket = MakeWhatsAppSocket({
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

    const DefaultConnectionUpdate = async (connect_wa) => {
      const { connection, lastDisconnect, qr } = connect_wa
      if(connection === "close") {
        const tryConnect = lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
        this.connection = false
        this.pairingCode = false
        if(lastDisconnect.error.output?.statusCode === 515) {
          this.debugging__?.info("Restart connection...")
          setTimeout(() => {
            this.debugging__?.warn("Try connection again...")
            this.WhatsAppClientStartUp()
          }, 1500)
          return;
        }
        this.debugging__?.error("Socket connection error!", lastDisconnect.error)
        // Remove Event Because Disconnection
        console.log(this.fn_key)
        for(let { key, fn } of this.fn_key) {
          this.debugging__?.error("Removeing Socket Event:", { key, fn })
          socket.ev.off(key, fn) // Remove Event
        }
        this.fn_key = [] // Reset All Again
        // Other Handle
        if(tryConnect) {
          setTimeout(() => {
            this.debugging__?.warn("Try connection again...")
            this.WhatsAppClientStartUp()
          }, 1500)
        } else {
          if(lastDisconnect.error.output?.statusCode === 401) {
            fs.rmSync(this.whatsappconfig.authfolder, { force: true, recursive: true })
            this.debugging__?.warn("Try connection again to relogin again!...")
            setTimeout(() => {
              this.WhatsAppClientStartUp()
            }, 1500)
          } else {
            this.debugging__?.error("Close!")
            process.exit(1)
          }
        }
      }
      if(connection === "open") {
        this.debugging__?.success("Success To Login!")
        this.connection = true
        this.pairingCode = false
      }
      if(typeof qr === "string") {
        if(this.whatsappconfig?.qrcode === true && this.whatsappconfig?.viewOnLog) {
          this.debugging__?.log("[QRCode To Device Logging]")
          qrcodeTerminal.generate(qr, { small: true })
        }
        if(typeof this.whatsappconfig?.phone != "string" && this.whatsappconfig?.qrcode === false) {
          this.debugging__?.error("Adding your phone in configuration!")
          return process.exit(1)
        }
        if(!this.pairingCode && this.whatsappconfig?.qrcode !== true && this.whatsappconfig?.viewOnLog) {
          const dataCode = await socket.requestPairingCode(this.whatsappconfig?.phone?.replace(/\D/g,""))
          this.debugging__?.warn("[Quick Adding Into Code!]")
          this.debugging__?.log(`Code: ${dataCode}`)
        }
        this.pairingCode = true
      }
    }

    socket.ev.on("creds.update", saveCreds)
    socket.ev.on("connection.update", DefaultConnectionUpdate)
    this.fn_key.push({ key: "creds.update", fn: saveCreds })
    this.fn_key.push({ key: "connection.update", fn: DefaultConnectionUpdate })

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
          const EventsCalling = (data) => {
            let eventModifData = {}
            if(eventName === "message") {
              const contentMsg = ModiferMessages(
                data.messages[0],
                socket, this.whatsappconfig.perfix
              )
              if(contentMsg?.disappireTime) {
                this.timedb.WriteTime(contentMsg.jid, contentMsg.disappireTime)
              }
              eventModifData = contentMsg
            }
            this.events[eventName].map(callback => {
              callback(eventName === "message"? {
                allowParsing: (data?.type === "notify" && !!data?.messages[0]?.message),
                TypeContent: data.type,
                ...data.messages[0],
                ...eventModifData
              }:data)
            })
          }
          socket.ev.on(keyEvent, EventsCalling)
          this.fn_key.push({ key: keyEvent, fn: EventsCalling })
        }
      })
    })
  }
}

module.exports = WhatsApp
