import type { SpindleBackendContext } from "lumiverse-spindle-types";

export function setup(spindle: SpindleBackendContext) {
  spindle.log.info("Looking Glass backend starting...");

  spindle.onFrontendMessage(async (msg: any) => {
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
          commit: false,
        });

        spindle.sendToFrontend({ type: "notes_result", notes: text || "No creator notes found for this character." });
      } catch (err) {
        spindle.log.error("Failed to resolve creator notes:", err);
        spindle.sendToFrontend({ type: "notes_result", notes: "Error: Failed to load notes." });
      }
    }
  });

  // Also listen for chat switches to notify frontend (optional, frontend can also check)
  spindle.on("CHAT_SWITCHED", (payload) => {
    spindle.sendToFrontend({ type: "chat_switched", chatId: payload.chatId });
  });
}
