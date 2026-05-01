import { loadChat, saveChat, loadIndex, deleteChat } from '@/app/dashboard/agent/_lib/storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadChat', () => {
    it('returns empty array when no chat exists', () => {
      expect(loadChat('nonexistent')).toEqual([]);
    });

    it('returns messages after saving', () => {
      const messages = [{ id: '1', role: 'user' as const, content: 'hello' }];
      saveChat('chat-1', messages);
      expect(loadChat('chat-1')).toEqual(messages);
    });
  });

  describe('saveChat', () => {
    it('saves title from first user message, truncated to 60 chars', () => {
      const longContent = 'a'.repeat(80);
      saveChat('chat-1', [{ id: '1', role: 'user' as const, content: longContent }]);
      expect(loadIndex()[0].title).toHaveLength(60);
    });

    it('updates index with newest chat first', () => {
      saveChat('chat-1', [{ id: '1', role: 'user' as const, content: 'First' }]);
      saveChat('chat-2', [{ id: '2', role: 'user' as const, content: 'Second' }]);
      const index = loadIndex();
      expect(index[0].id).toBe('chat-2');
      expect(index[1].id).toBe('chat-1');
    });

    it('prunes index to 20 entries', () => {
      for (let i = 0; i < 25; i++) {
        saveChat(`chat-${i}`, [{ id: '1', role: 'user' as const, content: `Message ${i}` }]);
      }
      expect(loadIndex()).toHaveLength(20);
    });

    it('preserves createdAt on re-save', () => {
      saveChat('chat-1', [{ id: '1', role: 'user' as const, content: 'hi' }]);
      const first = loadIndex()[0].createdAt;
      saveChat('chat-1', [
        { id: '1', role: 'user' as const, content: 'hi' },
        { id: '2', role: 'assistant' as const, content: 'reply' },
      ]);
      expect(loadIndex()[0].createdAt).toBe(first);
    });
  });

  describe('deleteChat', () => {
    it('removes chat data and index entry', () => {
      saveChat('chat-1', [{ id: '1', role: 'user' as const, content: 'hi' }]);
      deleteChat('chat-1');
      expect(loadChat('chat-1')).toEqual([]);
      expect(loadIndex()).toHaveLength(0);
    });
  });
});
