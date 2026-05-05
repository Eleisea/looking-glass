// @bun
// src/backend.ts
spindle.log.info("Looking Glass backend starting...");
spindle.onFrontendMessage(async (msg, userId) => {
  spindle.log.info(`Received message from frontend: ${msg.type} (user: ${userId})`);
  spindle.sendToFrontend({ type: "connection_test", status: "ok" }, userId);
  if (msg.type === "get_notes") {
    try {
      const activeChat = await spindle.chats.getActive();
      if (!activeChat) {
        spindle.log.warn("No active chat found when requesting notes.");
        spindle.sendToFrontend({ type: "notes_result", notes: "No active chat found." }, userId);
        return;
      }
      spindle.log.info(`Resolving notes for chat ${activeChat.id} (char: ${activeChat.character_id})`);
      const { text } = await spindle.macros.resolve("{{charCreatorNotes}}", {
        chatId: activeChat.id,
        characterId: activeChat.character_id,
        commit: false
      });
      spindle.log.info(`Successfully resolved notes (${text?.length || 0} chars)`);
      spindle.sendToFrontend({ type: "notes_result", notes: text || "No creator notes found for this character." }, userId);
    } catch (err) {
      spindle.log.error("Failed to resolve creator notes:", err);
      spindle.sendToFrontend({ type: "notes_result", notes: `Error: Failed to load notes. ${err?.message}` }, userId);
    }
  }
});
spindle.on("CHAT_SWITCHED", (payload) => {
  spindle.log.info(`Chat switched to ${payload.chatId}, notifying frontend`);
  spindle.sendToFrontend({ type: "chat_switched", chatId: payload.chatId });
});
