const defaultConfig = require("./default")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const fs = require("fs")
const path = require("path")

/**
 * Message Key Registery
 * @param {String[]} msgArray Array of allowing to registry message parsing
 * @param {object.<object>} msg Object context message
 * @returns {string} String Key Object
 */
function MessageKey(msgArray = [], msg = {}) {
  const msgContexts = (typeof msg === "object" && !Array.isArray(msg))? msg:{}
  const msgArrayContexts = (typeof msgArray === "object" && Array.isArray(msgArray))? msgArray:{}
  return msgArrayContexts.find(keyMsg => (
    Object.prototype.hasOwnProperty.call(msgContexts, keyMsg)
  )) || ""
}

/**
 * Extracted Message From Once View Objected
 * @param {object.<object>} message Object context message
 * @returns {object} Message
 */
function ExtractOnceViewMessages(message = {}) {
  const messageContext = (typeof message === "object" && !Array.isArray(message))? message:{}
  const openKey = MessageKey(defaultConfig.onceViewMessage, messageContext)
  return messageContext[openKey]?.message || messageContext
}

/**
 * Extracted Info Message By Context Info
 * @param {object.<object>} message Object context message
 * @returns {object} Message
 */
function ContextInfoExtraction(message = {}) {
  const messageContext = (typeof message === "object" && !Array.isArray(message))? message:{}
  const openKey = MessageKey([
    ...defaultConfig.mediaSelect,
    ...defaultConfig.onceViewMessage,
    ...defaultConfig.content,
  ], messageContext)
  return messageContext[openKey]?.contextInfo || {}
}

/**
 * Get Text By Message Objected
 * @param {object.<object>} message Object context message
 * @returns {string} Text
 */
function BasicExtraction(message = {}) {
  const messageContext = (typeof message === "object" && !Array.isArray(message))? message:{}
  const openKey = MessageKey(defaultConfig.content, messageContext)
  const openMsg = messageContext[openKey]
  const msgToStr = openMsg?.message || openMsg?.name || openMsg?.text || openMsg?.caption || message?.conversation || ""
  return String(msgToStr||"")
}

/**
 * Parse Text To Get Command Action
 * @param {String} textStr String Message
 * @param {String[]} prefixRegister Perfix Register
 * @returns {{perfix:string,cmd:string,query:string,argv:string[]}} Parsing Command
 */
function ParseCommandString(textStr, prefixRegister = []) {
  if (typeof textStr !== "string" || textStr?.length < 2) { return {} }
  const textSplit = String(textStr||"").split(" ")
  const firstWord = String(textStr||"").slice(0, 1)
  const contextRead = String(textStr||"").slice(0, 1)
  if(!prefixRegister.includes(contextRead)) { return {} }
  if (textSplit[0] === firstWord) {
    return {
      perfix: contextRead,
      cmd: textSplit[1].toLowerCase(),
      query: textSplit.slice(2).join(" "),
      argv: textSplit.slice(2).join(" ").split("|").map(a => a.trim())
    }
  } else {
    return {
      perfix: contextRead,
      cmd: textSplit[0].toLowerCase().slice(1),
      query: textSplit.slice(1).join(" "),
      argv: textSplit.slice(1).join(" ").split("|").map(a => a.trim())
    }
  }
}

/**
 * Get Real Content JID For Removed Authentication
 * @param {String} jidString JID String
 * @returns {String} JID String
 */
function GetRealContentJID(jidString = "") {
  const compailtoString = String(jidString||"")
  const strSplit = compailtoString.split("@")
  const getJidType = strSplit[1]
  const getIdJid = strSplit[0]?.split(":")[0]

  return `${getIdJid}@${getJidType}`
}

/**
 * Get Sending Message Type
 * @param {String} jidString JID String
 * @returns {{isGroup:Boolean,isUsers:Boolean,isStatus:Boolean,isChannel:Boolean}} JID String
 */
function GetSendingMessageType(jidString = "") {
  const typeJidMail = {
    "c.us": "user", // Users
    "s.whatsapp.net": "user", // Users
    "g.us": "group", // Group
    "newsletter": "channel", // Channel
    "broadcast": "status" // Status WhatsApp
  }
  const parsingMail = String(jidString||"").split("@")[1]
  const typeContext = typeJidMail[parsingMail] || "unknowing"
  return {
    isGroup: typeContext === "group",
    isUsers: typeContext === "user",
    isStatus: typeContext === "status",
    isChannel: typeContext === "channel",
  }
}

function ObjectMsgToExtFile(objectMsg = {}) {
  const extFile = objectMsg.message?.videoMessage? "mp4"
  :objectMsg.message?.imageMessage? "jpeg" 
  :(objectMsg.message?.videoMessage || objectMsg.message?.imageMessage || objectMsg.message?.stickerMessage || objectMsg.message?.audioMessage || objectMsg.message?.documentMessage)?.mimetype?.split("/")[1]
  return extFile
}

async function MediaDownloading(objectMsg = {}, folder = `${process.cwd()}/media`) {
  if(!fs.existsSync(folder) || fs.lstatSync(folder).isFile()) {
    fs.mkdirSync(folder, { recursive: true })
  }
  const extFile = ObjectMsgToExtFile(objectMsg)
  const isStickerAnimate = objectMsg.message?.stickerMessage?.isAnimated
  const generateId = require('crypto').randomBytes(20).toString("hex")
  const fileName = `${generateId}${isStickerAnimate?"-animated":""}.${extFile}`
  const downloadBuffer = await downloadMediaMessage(objectMsg, "buffer")
  const pathFile = path.join(folder, fileName)
  fs.writeFileSync(pathFile, downloadBuffer)
  return pathFile
}

function ModiferMessages(mg, socket, prefixRegister) {
  if(!mg.message) return {}
  // Base
  const meUserSocket = GetRealContentJID(socket?.user?.id||"")
  // Main Message
  const messages = ExtractOnceViewMessages(mg.message) // Remove Once View
  const getTextMsg = BasicExtraction(messages) // Get Message Extraction
  const messageParser = ParseCommandString(getTextMsg, prefixRegister||[]) // Parsing
  const typeMailLocation = GetSendingMessageType(mg?.key?.remoteJid||"")
  const pollingKey = MessageKey(defaultConfig.polling_create, messages)
  // Info Context
  const messagesContext = ContextInfoExtraction(messages) // Context Info
  const msgContext = ExtractOnceViewMessages(messagesContext?.quotedMessage||{}) // Context Info Message
  const getTextMsgReply = BasicExtraction(msgContext) // Get Message Extraction
  const buildReplyMsg = messagesContext?.quotedMessage?{
    key: {
      remoteJid: mg.key.remoteJid,
      fromMe: messagesContext.participant === meUserSocket,
      id: messagesContext.stanzaId,
      participant: messagesContext.participant,
    },
    message: messagesContext?.quotedMessage,
    text: getTextMsgReply
  }:null
  // Get Media
  const getMediaObjectReply = messagesContext.quotedMessage||{}
  const getMediaMsg = getMediaObjectReply[
    MessageKey(defaultConfig.mediaSelect, getMediaObjectReply)
  ] || (messages||{})[
    MessageKey(defaultConfig.mediaSelect, (messages||{}))
  ] || undefined
  const mediaTypeFromReply = !!(getMediaObjectReply[
    MessageKey(defaultConfig.mediaSelect, getMediaObjectReply)
  ])
  const getMediaKey = mediaTypeFromReply?
  MessageKey(defaultConfig.mediaSelect, getMediaObjectReply):
  MessageKey(defaultConfig.mediaSelect, (messages||{}))
  // Returning
  return {
    key: {
      remoteJid: mg.key?.remoteJid || meUserSocket,
      fromMe: mg.key?.fromMe || false,
      id: mg.key?.id || null,
      participant: mg.key?.participant || null,
    },
    jid: GetRealContentJID(mg.key?.remoteJid || ""),
    user: GetRealContentJID(mg?.participant || mg?.key?.participant || mg?.key?.remoteJid),
    nickname: String(mg.pushName||"").trim(),
    text: getTextMsg,
    perfix: messageParser.perfix || "",
    cmd: messageParser.cmd || "",
    query: messageParser.query || "",
    argv: messageParser.argv || [],
    polling: !!pollingKey? {
      text: getTextMsg,
      options: messages[pollingKey]?.options,
      selectable: messages[pollingKey]?.selectableOptionsCount
    }:null,
    media: !!getMediaMsg? {
      fromReply: mediaTypeFromReply,
      ext: ObjectMsgToExtFile(mediaTypeFromReply? buildReplyMsg.message : mg.message),
      download: async (folder = "./media") => {
        return MediaDownloading({
          key: mediaTypeFromReply? buildReplyMsg.key : mg.key,
          message: mediaTypeFromReply? buildReplyMsg.message : mg.message
        }, folder)
      },
      seconds: (mediaTypeFromReply?messagesContext:messages)[getMediaKey]?.seconds,
      width: (mediaTypeFromReply?messagesContext:messages)[getMediaKey]?.width,
      height: (mediaTypeFromReply?messagesContext:messages)[getMediaKey]?.height,
      isAnimated: (mediaTypeFromReply?messagesContext:messages)?.videoMessage? true
      :(mediaTypeFromReply?messagesContext:messages)?.stickerMessage?.isAnimated,
    }:null,
    userMentions: messagesContext?.mentionedJid?.map(a => String(a||"").trim()) || [],
    groupMentions: messagesContext?.groupMentions?.map(a => ({
      jid: a.groupJid,
      subject: a.groupSubject
    })) || [],
    isMentionMe: messagesContext?.mentionedJid?.includes(meUserSocket) || false,
    isReplyMyMessage: (messagesContext?.participant||"") === meUserSocket,
    ...typeMailLocation,
    disappireTime: messagesContext.expiration < 3? null : messagesContext.expiration || null,
    reply: buildReplyMsg,
    contextInfo: messagesContext,
  }
}

module.exports = {
  ModiferMessages
}




// const searchKey = (arrayRecreate, msg = {}) => {
//   for(let key of Object.keys(msg)) {
//     if(arrayRecreate.indexOf(key) != -1) {
//       return key
//     }
//   }
//   return ""
// }

// const extractOnceViewMessage = (msg = {}) => {
//   const openKey = searchKey(defaultConfig.onceViewMessage, msg)

//   if(!openKey) {
//     return msg
//   }
//   return msg[openKey]?.message
// }

// const contextInfoExtract = (msg = {}) => {
//   const dataInfo = msg?.extendedTextMessage || msg?.videoMessage || msg?.imageMessage || msg?.groupInviteMessage || msg?.documentWithCaptionMessage?.message?.documentMessage || msg?.documentMessage || msg?.stickerMessage || msg?.pollCreationMessage || msg?.pollCreationMessageV2 || msg?.pollCreationMessageV3 || msg?.productMessage || msg?.ptvMessage || msg?.orderMessage || msg?.viewOnceMessageV2 || msg?.viewOnceMessage
//   if(!dataInfo) {
//     return {}
//   }
//   return dataInfo?.contextInfo || {}
// }

// const textStringToCommand = (textString, perfix) => {
//   if(textString?.length < 4) return;
//   if(typeof textString != "string") return {}
//   const textSpliting = textString.split(" ")
//   if(perfix.indexOf(textSpliting[0]) != -1) {
//     return {
//       perfix: textSpliting[0],
//       cmd: textSpliting[1].toLowerCase(),
//       query: textSpliting.slice(2).join(" "),
//       argv: textSpliting.slice(2).join(" ").split("|")
//     }
//   }
//   if(perfix.indexOf(textSpliting[0].slice(0,1)) != -1) {
//     return {
//       perfix: textSpliting[0].slice(0,1),
//       cmd: textSpliting[0].slice(1).toLowerCase(),
//       query: textSpliting.slice(1).join(" "),
//       argv: textSpliting.slice(1).join(" ").split("|")
//     }
//   }
//   return {}
// }

// const modiferMessage = (m = {}, socket, perfix) => {
//   if(!m.message) return {};
//   const msg = extractOnceViewMessage(m.message)
//   const contextData = contextInfoExtract(msg)
//   const textMessage = msg?.conversation || msg?.extendedTextMessage?.text || msg?.videoMessage?.caption || msg?.imageMessage?.caption || msg?.groupInviteMessage?.caption || msg?.documentWithCaptionMessage?.message?.documentMessage?.caption || msg?.documentMessage?.caption
//   const mediaView = contextData.quotedMessage? contextData.quotedMessage : msg
//   const botIdUni = (socket.user.id.split("@")[0].split(":")[0])
//   // For Quoted Message
//   const msgReply = extractOnceViewMessage(contextData.quotedMessage||{})
//   return {
//     jid: m.key.remoteJid,
//     nickname: m.pushName,
//     user: (m.key.remoteJid?.split("@")[1] === "s.whatsapp.net"? m.key.remoteJid : m.key.participant)?.split("@")[0]?.split(":")[0]+"@s.whatsapp.net",
//     text: textMessage || "",
//     mentionMe: !!(contextData?.mentionedJid || []).includes(`${botIdUni}@s.whatsapp.net`),
//     replyText: String((contextData.quotedMessage || {})?.conversation || ""),
//     replyUser: contextData.participant || undefined,
//     replyMe: (String(contextData.participant?.split("@")[0]?.split(":")[0]) === botIdUni),
//     includeMedia: !!searchKey(defaultConfig.mediaSelect, mediaView),
//     mediaOption: !!searchKey(defaultConfig.mediaSelect, mediaView)? {
//       seconds: mediaView?.videoMessage?.seconds,
//       width: mediaView?.videoMessage?.width || mediaView?.imageMessage?.width,
//       height: mediaView?.videoMessage?.height || mediaView?.imageMessage?.height,
//       isAnimated: mediaView?.videoMessage? true : mediaView?.stickerMessage?.isAnimated,
//       ext: (mediaView.videoMessage || mediaView.imageMessage || mediaView.stickerMessage || mediaView.audioMessage || mediaView.documentMessage)?.mimetype?.split("/")[1],
//     } : undefined,
//     downloadMedia: !!searchKey(defaultConfig.mediaSelect, mediaView)? async (folder) => {
//       if(!fs.existsSync(folder) || fs.lstatSync(folder).isFile()) {
//         return await new Promise((a, b) => { b(new Error("Folder not accpted"))})
//       }
//       const msgContext = contextData.quotedMessage? {
//         key: {
//           remoteJid: m.key.remoteJid,
//           fromMe: false,
//           id: contextData.stanzaId,
//           participant: contextData.participant,
//         },
//         message: contextData.quotedMessage
//       }: {
//         key: m.key,
//         message: msg
//       }
//       const extFile = msgContext.message?.videoMessage? "mp4" : msgContext.message?.imageMessage? "jpeg" : (mediaView.videoMessage || mediaView.imageMessage || mediaView.stickerMessage || mediaView.audioMessage || mediaView.documentMessage)?.mimetype?.split("/")[1]
//       const animatedTg = msgContext.message?.stickerMessage?.isAnimated? "-animated":""

//       const fileName = `${require('crypto').randomBytes(20).toString("hex")}${animatedTg}.${extFile}`
//       const bufferDown = await downloadMediaMessage(msgContext, "buffer")
//       fs.writeFileSync(`${folder}/${fileName}`, bufferDown)
//       return `${folder}/${fileName}`
//     } : undefined,
//     ...textStringToCommand(textMessage, perfix),
//     disappireTime: contextData.expiration < 3? null : contextData.expiration,
//     isGroup: !!m.key.remoteJid.match("@g.us"),
//     isContent: !!searchKey(defaultConfig.content, msg),
//     contextInfo: contextData,
//     replyMessage: contextData.quotedMessage? {
//       key: {
//         remoteJid: m.key.remoteJid,
//         fromMe: false,
//         id: contextData.stanzaId,
//         participant: contextData.participant,
//       },
//       message: contextData.quotedMessage
//     }:{}
//   }
// }

// module.exports = {
//   searchKey,
//   extractOnceViewMessage,
//   contextInfoExtract,
//   modiferMessage
// }
