import { MessageTrie } from '@/app/models/hooks/MessageTrie';
import { Message, WordProbList } from '@/app/models/hooks/chatReducer';

describe('MessageTrie', () => {
  let trie: MessageTrie;

  beforeEach(() => {
    trie = new MessageTrie();
  });

  describe('insert', () => {
    it('should insert a simple user message correctly with a string', () => {
      const messages: Message[] = [{ content: ['hello'], source: 'user' }];

      trie.insert(messages);

      expect(trie.root.children['hello']).toBeDefined();
      expect(trie.root.children['hello'].source).toBe('user');
      expect(trie.root.children['hello'].content).toEqual([]);
    });

    it('should insert an AI message with WordProbList content correctly', () => {
      const wordProbList: WordProbList = [
        ['test', 0.5],
        ['test2', 0.5],
      ];
      const messages: Message[] = [
        {
          content: ['string text', wordProbList],
          source: 'ai',
        },
      ];

      trie.insert(messages);

      expect(trie.root.children['string text']).toBeDefined();
      expect(trie.root.children['string text'].source).toBe('ai');
      expect(trie.root.children['string text'].content).toEqual([]);
      expect(trie.root.children['string text'].children['test']).toBeDefined();
      expect(
        trie.root.children['string text'].children['test'].content
      ).toEqual(wordProbList);
    });

    it('should handle a conversation sequence correctly', () => {
      const messages: Message[] = [
        { content: ['hello'], source: 'user' },
        {
          content: [
            'hi',
            [
              ['how', 0.8],
              ['I', 0.2],
            ],
          ],
          source: 'ai',
        },
        { content: ['good'], source: 'user' },
      ];

      trie.insert(messages);

      let node = trie.root.children['hello'];
      expect(node).toBeDefined();
      expect(node.source).toBe('user');

      node = node.children['hi'];
      expect(node).toBeDefined();
      expect(node.source).toBe('ai');

      node = node.children['how'];
      expect(node).toBeDefined();
      expect(node.source).toBe('ai');
      expect(node.content).toEqual([
        ['how', 0.8],
        ['I', 0.2],
      ]);

      node = node.children['good'];
      expect(node).toBeDefined();
      expect(node.source).toBe('user');
    });
  });

  describe('searchAndReturn', () => {
    it('should return null for non-existent message sequence', () => {
      const result = trie.searchAndReturn([
        { content: ['nonexistent'], source: 'user' },
      ]);
      expect(result).toBeNull();
    });

    it('should return complete conversation history', () => {
      const messages: Message[] = [
        { content: ['hello'], source: 'user' },
        {
          content: [
            'hi',
            [
              ['I am', 0.5],
              ['I will', 0.5],
            ],
            [
              ['how', 0.8],
              ['I', 0.2],
            ],
          ],
          source: 'ai',
        },
        { content: ['how are you'], source: 'user' },
      ];

      trie.insert(messages);

      const searchResult = trie.searchAndReturn([
        { content: ['hello'], source: 'user' },
        {
          content: [
            'hi',
            [
              ['I am', 0.5],
              ['I will', 0.5],
            ],
          ],
          source: 'ai',
        },
      ]);

      expect(searchResult).toEqual(messages);
    });
  });

  describe('clear', () => {
    it('should reset the trie to empty state', () => {
      const messages: Message[] = [{ content: ['hello'], source: 'user' }];

      trie.insert(messages);
      trie.clear();

      expect(trie.root.children).toEqual({});
      expect(trie.root.source).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle empty message arrays', () => {
      trie.insert([]);
      expect(trie.root.children).toEqual({});
    });
  });

  describe('serialize', () => {
    it('should serialize the trie to a JSON string and back', () => {
      const messages: Message[] = [
        { content: ['hello'], source: 'user' },
        {
          content: [
            'hi',
            [
              ['I am', 0.5],
              ['I will', 0.5],
            ],
          ],
          source: 'ai',
        },
        { content: ['how are you'], source: 'user' },
      ];

      trie.insert(messages);

      const serialized = trie.serialize();

      expect(serialized).toEqual(
        '{"children":{"hello":{"children":{"hi":{"children":{"I am":{"children":{"how are you":{"children":{},"content":[],"source":"user"}},"content":[["I am",0.5],["I will",0.5]],"source":"ai"}},"content":[],"source":"ai"}},"content":[],"source":"user"}},"content":[],"source":""}'
      );

      const deserialized = MessageTrie.deserialize(serialized);
      expect(deserialized).toEqual(trie);
    });
  });
});
