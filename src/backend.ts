declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

spindle.log.info("Looking Glass backend starting...");

spindle.onFrontendMessage(async (msg: any, userId: string) => {
  spindle.log.info(`Received message from frontend: ${msg.type} (user: ${userId})`);
  
  // Immediate connectivity test
  spindle.sendToFrontend({ type: "connection_test", status: "ok" }, userId);

  if (msg.type === "get_notes") {
    try {
      // Some host versions require userId for getActive in operator-scoped contexts
      const activeChat = await (spindle.chats as any).getActive(userId);
      
      if (!activeChat) {
        spindle.log.warn(`No active chat found for user ${userId} when requesting notes.`);
        spindle.sendToFrontend({ type: "notes_result", status: "no_chat", notes: "No active chat found. Please open a chat first." }, userId);
        return;
      }

      spindle.log.info(`Resolving notes for chat ${activeChat.id} (char: ${activeChat.character_id}) for user ${userId}`);

      const { text } = await spindle.macros.resolve("{{charCreatorNotes}}", {
        chatId: activeChat.id,
        characterId: activeChat.character_id,
        userId: userId,
        commit: false,
      });

      spindle.log.info(`Successfully resolved notes (${text?.length || 0} chars)`);
      const hasNotes = !!text && text.trim().length > 0;
      spindle.sendToFrontend({ 
        type: "notes_result", 
        status: hasNotes ? "ok" : "empty",
        notes: hasNotes ? text : "No creator notes found for this character.",
        characterId: activeChat.character_id
      }, userId);
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      spindle.log.error(`Failed to resolve creator notes: ${errorMsg}`);
      spindle.sendToFrontend({ type: "notes_result", status: "error", notes: `Error: Failed to load notes. ${errorMsg}` }, userId);
    }
  }
});

// Also listen for chat switches to notify frontend
spindle.on("CHAT_SWITCHED", (payload: any) => {
  spindle.log.info(`Chat switched to ${payload.chatId}, notifying frontend`);
  spindle.sendToFrontend({ type: "chat_switched", chatId: payload.chatId });
});

// Phone-line protocol handler to expose character notes to LumiAgent
async function getNotesForCharacter(characterId: string | undefined, userId: string): Promise<string> {
  if (!characterId) return "";
  try {
    const char = await spindle.characters.get(characterId, userId);
    return char?.creator_notes || "";
  } catch (err: any) {
    spindle.log.error(`[Looking Glass] Failed to get character notes: ${err.message}`);
    return "";
  }
}

async function updateNotesForCharacter(characterId: string | undefined, text: string, userId: string): Promise<void> {
  if (!characterId) return;
  try {
    await spindle.characters.update(characterId, { creator_notes: text }, userId);
  } catch (err: any) {
    spindle.log.error(`[Looking Glass] Failed to update character notes: ${err.message}`);
    throw err;
  }
}

try {
    (spindle.rpcPool.handle as any)("phoneline", async ({ requesterExtensionId }: any) => {
    try {
      const request = await spindle.rpcPool.read<any>(`${requesterExtensionId}.phoneline_request`);
      const { op, userId, characterId, surfaceId, itemId, field, value } = request;

      if (op === "describe") {
        return {
          extension: {
            id: "looking_glass",
            name: "Looking Glass",
            version: "1.0.0",
          },
          surfaces: [
            {
              id: "character_notes",
              label: "Character Notes",
              description: "View and edit character creator notes.",
              scope: "per_character",
            },
          ],
        };
      }

      if (op === "system_prompt") {
        return { text: null };
      }

      if (op === "list_items") {
        if (surfaceId === "character_notes") {
          const notes = await getNotesForCharacter(characterId, userId);
          return {
            items: [
              {
                id: "notes",
                label: "Creator Notes",
                brief: { length: notes.length },
              },
            ],
            total: 1,
          };
        }
        throw new Error(`Unknown surface: ${surfaceId}`);
      }

      if (op === "read_item") {
        if (surfaceId === "character_notes" && itemId === "notes") {
          const notes = await getNotesForCharacter(characterId, userId);
          return { value: notes };
        }
        throw new Error(`Unknown surface/item: ${surfaceId}/${itemId}`);
      }

      if (op === "write_field") {
        if (surfaceId === "character_notes" && itemId === "notes") {
          if (typeof value !== "string") {
            throw new Error("Value must be a string");
          }
          await updateNotesForCharacter(characterId, value, userId);
          return { ok: true };
        }
        throw new Error(`Unknown surface/item: ${surfaceId}/${itemId}`);
      }

      throw new Error(`Unknown operation: ${op}`);
    } catch (err: any) {
      spindle.log.error(`[Looking Glass] phoneline handler error: ${err.message}`);
      throw err;
    }
  }, { requires: [] });
  spindle.log.info("Looking Glass phoneline handler registered successfully.");
} catch (err: any) {
  spindle.log.error(`[Looking Glass] Failed to register phoneline handler: ${err.message}`);
}

