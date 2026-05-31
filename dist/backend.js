// @bun
// src/backend.ts
spindle.log.info("Looking Glass backend starting...");
spindle.onFrontendMessage(async (msg, userId) => {
  spindle.log.info(`Received message from frontend: ${msg.type} (user: ${userId})`);
  spindle.sendToFrontend({ type: "connection_test", status: "ok" }, userId);
  if (msg.type === "get_notes") {
    try {
      const activeChat = await spindle.chats.getActive(userId);
      if (!activeChat) {
        spindle.log.warn(`No active chat found for user ${userId} when requesting notes.`);
        spindle.sendToFrontend({ type: "notes_result", notes: "No active chat found. Please open a chat first." }, userId);
        return;
      }
      spindle.log.info(`Resolving notes for chat ${activeChat.id} (char: ${activeChat.character_id}) for user ${userId}`);
      const { text } = await spindle.macros.resolve("{{charCreatorNotes}}", {
        chatId: activeChat.id,
        characterId: activeChat.character_id,
        userId,
        commit: false
      });
      spindle.log.info(`Successfully resolved notes (${text?.length || 0} chars)`);
      spindle.sendToFrontend({
        type: "notes_result",
        notes: text || "No creator notes found for this character.",
        characterId: activeChat.character_id
      }, userId);
    } catch (err) {
      const errorMsg = err?.message || String(err);
      spindle.log.error(`Failed to resolve creator notes: ${errorMsg}`);
      spindle.sendToFrontend({ type: "notes_result", notes: `Error: Failed to load notes. ${errorMsg}` }, userId);
    }
  }
});
spindle.on("CHAT_SWITCHED", (payload) => {
  spindle.log.info(`Chat switched to ${payload.chatId}, notifying frontend`);
  spindle.sendToFrontend({ type: "chat_switched", chatId: payload.chatId });
});
