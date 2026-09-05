// Event Handler: chats.update
// Description: This event is triggered when a chat is updated.
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

module.exports = {
  eventName: "chats.update",
  /**
   * Handles the chats.update event.
   * @param {object} sock - The WhatsApp socket instance.
   * @param {object} logger - Logger for logging info and errors.
   * @returns {Function}
   */
  handler: (sock, logger) => async (eventData) => {
    logger.info(`[${"chats.update"}] Event triggered:`, eventData);
    // TODO: Implement your logic here.
    const chat = eventData[0];

    const remoteJid = chat.id;
    const pushName = chat.messages[0].message.pushName;

    if (
      chat.messages[0].message.key.participantAlt ==
      "6285171227767@s.whatsapp.net"
    ) {
      const isQuote =
        chat.messages[0].message.message.extendedTextMessage?.text || false;

      if (isQuote == "!kick") {
        const targetLid =
          chat.messages[0].message.message.extendedTextMessage?.contextInfo
            ?.participant;

        const groupJid = chat.id;
        const metadata = await sock.groupMetadata(groupJid);

        const participants = metadata.participants.map((participant) => {
          const jid = participant.id;
          const number = jid.endsWith("@lid")
            ? participant.phoneNumber?.split("@")[0] || "Unknown"
            : jid.split("@")[0];

          return {
            jid,
            number,
            admin: participant.admin || null,
          };
        });

        const kickedUser = participants.find(
          (user) =>
            user.jid ==
            chat.messages[0].message.message.extendedTextMessage?.contextInfo
              ?.participant,
        );

        await sock.groupParticipantsUpdate(remoteJid, [targetLid], "remove");

        await sock.sendMessage(remoteJid, {
          text: `user: @${kickedUser.number} has been kicked`,
          mentions: [`${kickedUser.number}@s.whatsapp.net`],
        });
        // await sock.groupParticipantsUpdate(groupJid, [targetLid], "remove");
      }
    }

    if (
      chat.messages[0].message.message.imageMessage ||
      chat.messages[0].message.message.videoMessage
    ) {
      if (
        chat.messages[0].message.message.imageMessage?.caption == "!sticker" ||
        chat.messages[0].message.message.videoMessage?.caption == "!sticker"
      ) {
        if (
          chat.messages[0].message.message.videoMessage?.fileLength > 10000000
        ) {
          return await sock.sendMessage(
            remoteJid,
            { text: "Yang bener aja mas, filenya kegedean. max 10Mb\n-Yuuna" },
            {
              quoted: chat.messages[0].message,
            },
          );
        } else if (chat.messages[0].message.message.videoMessage?.seconds > 6) {
          await sock.sendMessage(
            remoteJid,
            {
              text: "Maksimal durasi video untuk dijadiin sticker itu 6 detik ya sayang~~\n-Yuuna",
            },
            {
              quoted: chat.messages[0].message,
            },
          );
        }

        const buffer = await downloadMediaMessage(
          chat.messages[0].message,
          "buffer",
          {},
          {
            logger: console,
            reuploadRequest: sock.updateMediaMessage,
          },
        );

        const sticker = new Sticker(buffer, {
          pack: "Yuuna Bot",
          author: "Kermit",
          type: StickerTypes.FULL,
          categories: ["🤣", "😎"],
          id: "12345",
          quality: 50,
          fps: 10,
          crop: false,

          ffmpeg: [
            "-vcodec",
            "libwebp",
            "-filter:v",
            "fps=10,scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3",
            "-loop",
            "0",
            "-ss",
            "00:00:00",
            "-t",
            "00:00:06",
            "-preset",
            "picture",
            "-an",
            "-vsync",
            "0",
          ],
        });
        await sock.sendMessage(remoteJid, await sticker.toMessage(), {
          quoted: chat.messages[0].message,
        });
      }
    }
  },
};
