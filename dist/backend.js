// @bun
// src/backend.ts
function setup(spindle) {
  spindle.log.info("Looking Glass backend starting...");
  spindle.onFrontendMessage(async (msg) => {
    if (msg.type === "get_notes") {
      try {
        const activeChat = await spindle.chats.getActive();
        if (!activeChat) {
          spindle.sendToFrontend({ type: "notes_result", notes: "No active chat found." });
          return;
        }
        const { text } = await spindle.macros.resolve("{{charCreatorNotes}}", {
          chatId: activeChat.id,
          characterId: activeChat.character_id,
          commit: false
        });
        spindle.sendToFrontend({ type: "notes_result", notes: text || "No creator notes found for this character." });
      } catch (err) {
        spindle.log.error("Failed to resolve creator notes:", err);
        spindle.sendToFrontend({ type: "notes_result", notes: "Error: Failed to load notes." });
      }
    }
  });
  spindle.on("CHAT_SWITCHED", (payload) => {
    spindle.sendToFrontend({ type: "chat_switched", chatId: payload.chatId });
  });
}
export {
  setup
};
