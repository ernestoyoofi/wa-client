const defaultConfig = require("./default")
const { ReadIdOptionReply } = require("./optionreply")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const fs = require("fs")

const searchKey = (arrayRecreate, msg) => {
  for(let key of Object.keys(msg)) {
    if(arrayRecreate.indexOf(key) != -1) {
      return key
    }
  }
  return ""
}

const extractOnceViewMessage = (msg) => {
  const openKey = searchKey(defaultConfig.onceViewMessage, msg)

  if(!openKey) {
    return msg
  }
  return msg[openKey].message
}

const contextInfoExtract = (msg) => {
  const dataInfo = msg?.extendedTextMessage || msg?.videoMessage || msg?.imageMessage || msg?.groupInviteMessage || msg?.documentWithCaptionMessage?.message?.documentMessage || msg?.documentMessage || msg?.stickerMessage || msg?.pollCreationMessage || msg?.pollCreationMessageV2 || msg?.pollCreationMessageV3 || msg?.productMessage || msg?.ptvMessage || msg?.orderMessage
  if(!dataInfo) {
    return {}
  }
  return dataInfo?.contextInfo || {}
}

const textStringToCommand = (textString, perfix) => {
  if(textString?.length < 4) return;
  if(typeof textString != "string") return {}
  const textSpliting = textString.split(" ")
  if(perfix.indexOf(textSpliting[0]) != -1) {
    return {
      perfix: textSpliting[0],
      cmd: textSpliting[1].toLowerCase(),
      query: textSpliting.slice(2).join(" "),
      argv: textSpliting.slice(2).join(" ").split("|")
    }
  }
  if(perfix.indexOf(textSpliting[0].slice(0,1)) != -1) {
    return {
      perfix: textSpliting[0].slice(0,1),
      cmd: textSpliting[0].slice(1).toLowerCase(),
      query: textSpliting.slice(1).join(" "),
      argv: textSpliting.slice(1).join(" ").split("|")
    }
  }
  return {}
}

const modiferMessage = (m, socket, perfix) => {
  if(!m.message) return;
  const msg = extractOnceViewMessage(m.message)
  const contextData = contextInfoExtract(msg)
  const textMessage = msg?.conversation || msg?.extendedTextMessage?.text || msg?.videoMessage?.caption || msg?.imageMessage?.caption || msg?.groupInviteMessage?.caption || msg?.documentWithCaptionMessage?.message?.documentMessage?.caption || msg?.documentMessage?.caption
  const optionReplyMsg = ReadIdOptionReply(`${m.key.remoteJid}-${contextData.stanzaId}`)
  const mediaView = contextData.quotedMessage? contextData.quotedMessage : msg

  return {
    jid: m.key.remoteJid,
    user: (m.key.remoteJid?.split("@")[1] === "s.whatsapp.net"? m.key.remoteJid : m.key.participant)?.split("@")[0]?.split(":")[0]+"@s.whatsapp.net",
    text: textMessage || "",
    includeMedia: !!searchKey(defaultConfig.mediaSelect, mediaView),
    mediaOption: !!searchKey(defaultConfig.mediaSelect, mediaView)? {
      seconds: mediaView?.videoMessage?.seconds,
      width: mediaView?.videoMessage?.width || mediaView?.imageMessage?.width,
      height: mediaView?.videoMessage?.height || mediaView?.imageMessage?.height,
      isAnimated: mediaView?.videoMessage? true : mediaView?.stickerMessage?.isAnimated,
      ext: (mediaView.videoMessage || mediaView.imageMessage || mediaView.stickerMessage || mediaView.audioMessage || mediaView.documentMessage)?.mimetype?.split("/")[1],
    } : undefined,
    downloadMedia: !!searchKey(defaultConfig.mediaSelect, mediaView)? async (folder) => {
      if(!fs.existsSync(folder) || fs.lstatSync(folder).isFile()) {
        return await new Promise((a, b) => { b(new Error("Folder not accpted"))})
      }
      const msgContext = contextData.quotedMessage? {
        key: {
          remoteJid: m.key.remoteJid,
          fromMe: false,
          id: contextData.stanzaId,
          participant: contextData.participant,
        },
        message: contextData.quotedMessage
      }: {
        key: m.key,
        message: msg
      }
      const extFile = msgContext.message?.videoMessage? "mp4" : msgContext.message?.imageMessage? "jpeg" : (mediaView.videoMessage || mediaView.imageMessage || mediaView.stickerMessage || mediaView.audioMessage || mediaView.documentMessage)?.mimetype?.split("/")[1]
      const animatedTg = msgContext.message?.stickerMessage?.isAnimated? "-animated":""

      const fileName = `${require('crypto').randomBytes(20).toString("hex")}${animatedTg}.${extFile}`
      const bufferDown = await downloadMediaMessage(msgContext, "buffer")
      fs.writeFileSync(`${folder}/${fileName}`, bufferDown)
      return `${folder}/${fileName}`
    } : undefined,
    optreply: optionReplyMsg? {
      cmd: optionReplyMsg[Number(textMessage)-1],
      context: optionReplyMsg
    }:{},
    ...textStringToCommand(optionReplyMsg? optionReplyMsg[isNaN(textMessage)? -1 : Number(textMessage)-1]||"" : textMessage, perfix),
    disappireTime: contextData.expiration < 3? null : contextData.expiration,
    isGroup: !!m.key.remoteJid.match("@g.us"),
    isContent: !!searchKey(defaultConfig.content, msg),
    contextInfo: contextData,
    replyMessage: contextData.quotedMessage? {
      key: {
        remoteJid: m.key.remoteJid,
        fromMe: false,
        id: contextData.stanzaId,
        participant: contextData.participant,
      },
      message: contextData.quotedMessage
    }:{}
  }
}

module.exports = {
  searchKey,
  extractOnceViewMessage,
  contextInfoExtract,
  modiferMessage
}