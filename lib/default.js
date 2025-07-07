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
  polling_create: [
    "pollCreationMessage",
    "pollCreationMessageV2", "pollCreationMessageV3",
    "pollCreationMessageV4"
  ],
  onceViewMessage: [
    "documentWithCaptionMessage", "ptvMessage",
    "viewOnceMessage", "viewOnceMessageV2",
    "viewOnceMessageV2Extension", "ephemeralMessage",
    "groupMentionedMessage", "associatedChildMessage",
  ],
  content: [
    "pollCreationMessageV3", "pollCreationMessage",
    "audioMessage", "documentMessage", "stickerMessage",
    "imageMessage", "videoMessage", "extendedTextMessage",
    "groupInviteMessage", "viewOnceMessageV2Extension",
    "viewOnceMessage", "documentWithCaptionMessage",
    "viewOnceMessageV2", "ephemeralMessage", "groupMentionedMessage"
  ]
}