const defaultConfig = require("./default")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const fs = require("fs")
const path = require("path")

function MessageApplyParticipants(group_metaall) {
  const parse = group_metaall

  return Object.keys(parse)
  .map(group_key => (parse[group_key].participants||[])
    .map(group_item => ({ lid: group_item.lid, jid: group_item.jid }))
  )
  .flat().map(item => {
    if(!item.jid) {
      item.jid = lastJid
    } else {
      lastJid = item.jid
    }
    return item
  })
}

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

function ModiferMessages(mg, socket, prefixRegister, lidCache = []) {
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
  const getUser = GetRealContentJID(mg?.participant || mg?.key?.participant || mg?.key?.remoteJid)
  const findUser = (lidCache?.find(a => getUser === a.lid)?.jid)
  // Returning
  return {
    key: {
      remoteJid: mg.key?.remoteJid || meUserSocket,
      fromMe: mg.key?.fromMe || false,
      id: mg.key?.id || null,
      participant: findUser || mg.key?.participant || null,
    },
    jid: GetRealContentJID(mg.key?.remoteJid || ""),
    user: findUser||getUser,
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
      ext: ObjectMsgToExtFile({ message: mediaTypeFromReply? buildReplyMsg.message : mg.message }),
      download: async (folder = "./media") => {
        return MediaDownloading({
          key: mediaTypeFromReply? buildReplyMsg.key : mg.key,
          message: mediaTypeFromReply? buildReplyMsg.message : mg.message
        }, folder)
      },
      seconds: (mediaTypeFromReply?msgContext:messages)[getMediaKey]?.seconds,
      width: (mediaTypeFromReply?msgContext:messages)[getMediaKey]?.width,
      height: (mediaTypeFromReply?msgContext:messages)[getMediaKey]?.height,
      isAnimated: (mediaTypeFromReply?msgContext:messages)?.videoMessage? true
      :(mediaTypeFromReply?msgContext:messages)?.stickerMessage?.isAnimated,
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
  MessageApplyParticipants,
  ModiferMessages
}

