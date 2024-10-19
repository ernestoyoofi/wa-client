module.exports = {
  balieyscontent: {
    pinolevel: "silent",
    authfolder: `${process.cwd()}/auth`,
    storefolder: `${process.cwd()}/store`,
    perfix: ["!"]
  },
  event: {
    connection: ["connection.update"],
    call: ["call"],
    message: ["messages.upsert"],
    blocklist: ["blocklist.set", "blocklist.update"]
  },
  mediaSelect: [
    "audioMessage", "documentMessage", "stickerMessage",
    "imageMessage", "videoMessage",
  ],
  onceViewMessage: [
    "documentWithCaptionMessage", "ptvMessage",
    "viewOnceMessage", "viewOnceMessageV2",
    "viewOnceMessageV2Extension", "ephemeralMessage"
  ],
  content: [
    "audioMessage", "documentMessage", "stickerMessage",
    "imageMessage", "videoMessage", "extendedTextMessage",
    "groupInviteMessage", "viewOnceMessageV2Extension",
    "viewOnceMessage", "documentWithCaptionMessage",
    "viewOnceMessageV2", "ephemeralMessage"
  ]
}
