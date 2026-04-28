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

        // Exhaustive search for creator notes
        const char = character as any;
        const notes = 
          char.extensions?.charCreatorNotes || 
          char.extensions?.creatorNotes || 
          char.charCreatorNotes || 
          char.creatorNotes || 
          char.creator_notes || 
          char.data?.extensions?.charCreatorNotes || 
          char.data?.extensions?.creatorNotes || 
          char.data?.creator_notes || 
          '';
        
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
          const char = character as any;
          const notes = 
            char.extensions?.charCreatorNotes || 
            char.extensions?.creatorNotes || 
            char.charCreatorNotes || 
            char.creatorNotes || 
            char.creator_notes || 
            char.data?.extensions?.charCreatorNotes || 
            char.data?.extensions?.creatorNotes || 
            char.data?.creator_notes || 
            '';
          spindle.sendToFrontend({ type: 'creator_notes', content: notes });
        }
      }
    } catch (err) {
      // ignore
    }
  });
}
