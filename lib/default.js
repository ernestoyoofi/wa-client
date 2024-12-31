module.exports = {
  clientconfig: {
    dbtimepath: `${process.cwd()}/time.json`,
    dbtimedebug: 0
  },
  balieyscontent: {
    pinolevel: "silent",
    authfolder: `${process.cwd()}/auth`,
    storefolder: `${process.cwd()}/store`,
    version: [2,3000,1019105392],
    debugging: 0,
    viewOnLog: true,
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