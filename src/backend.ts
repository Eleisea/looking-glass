export function setup() {
  const spindle = (globalThis as any).spindle;

  spindle.onFrontendMessage(async (payload: any, userId: string) => {
    if (payload.type === 'get_creator_notes') {
      try {
        const activeChat = await spindle.chats.getActive();
        if (!activeChat) {
          spindle.sendToFrontend({ type: 'creator_notes', content: '', error: 'No active chat' }, userId);
          return;
        }

        const character = await spindle.characters.get(activeChat.character_id);
        if (!character) {
          spindle.sendToFrontend({ type: 'creator_notes', content: '', error: 'Character not found' }, userId);
          return;
        }

        // Try getting from extensions.charCreatorNotes, then root charCreatorNotes, then creator_notes
        const extData = character.extensions || {};
        const notes = extData.charCreatorNotes || (character as any).charCreatorNotes || character.creator_notes || '';
        
        spindle.sendToFrontend({ type: 'creator_notes', content: notes }, userId);
      } catch (err) {
        spindle.sendToFrontend({ type: 'creator_notes', content: '', error: String(err) }, userId);
      }
    }
  });

  spindle.on('CHAT_CHANGED', async ({ chatId }: { chatId: string }) => {
    try {
      const chat = await spindle.chats.get(chatId);
      if (chat) {
        const character = await spindle.characters.get(chat.character_id);
        if (character) {
          const extData = character.extensions || {};
          const notes = extData.charCreatorNotes || (character as any).charCreatorNotes || character.creator_notes || '';
          spindle.sendToFrontend({ type: 'creator_notes', content: notes });
        }
      }
    } catch (err) {
      // ignore
    }
  });
}
