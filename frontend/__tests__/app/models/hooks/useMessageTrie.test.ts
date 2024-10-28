import { MessageTrie } from '@/app/models/hooks/useMessageTrie';
import {
  Message,
  MessageSource,
  WordProbList,
} from '@/app/models/hooks/chatReducer';

describe('MessageTrie', () => {
  let trie: MessageTrie;

  beforeEach(() => {
    trie = new MessageTrie();
  });

  describe('insert', () => {
    it('should insert a simple user message correctly', () => {
      const messages: Message[] = [
        { content: 'hello', source: MessageSource.USER },
      ];

      trie.insert(messages);

      expect(trie.root.children['hello']).toBeDefined();
      expect(trie.root.children['hello'].source).toBe(MessageSource.USER);
      expect(trie.root.children['hello'].index).toBe(0);
    });

    it('should insert an AI message with string content correctly', () => {
      const messages: Message[] = [
        {
          content: ['response'],
          source: MessageSource.AI,
        },
      ];

      trie.insert(messages);

      expect(trie.root.children['response']).toBeDefined();
      expect(trie.root.children['response'].source).toBe(MessageSource.AI);
      expect(trie.root.children['response'].index).toBe(0);
    });

    it('should insert an AI message with WordProbList content correctly', () => {
      const wordProbList: WordProbList = [
        ['test', 0.5],
        ['test2', 0.5],
      ];
      const messages: Message[] = [
        {
          content: [wordProbList],
          source: MessageSource.AI,
        },
      ];

      trie.insert(messages);

      expect(trie.root.children['test']).toBeDefined();
      expect(trie.root.children['test'].source).toBe(MessageSource.AI);
      expect(trie.root.children['test'].content).toEqual(wordProbList);
    });

    it('should handle a conversation sequence correctly', () => {
      const messages: Message[] = [
        { content: 'hello', source: MessageSource.USER },
        {
          content: [
            'hi',
            [
              ['how', 0.8],
              ['I', 0.2],
            ],
          ],
          source: MessageSource.AI,
        },
        { content: 'good', source: MessageSource.USER },
      ];

      trie.insert(messages);

      let node = trie.root.children['hello'];
      expect(node).toBeDefined();
      expect(node.source).toBe(MessageSource.USER);

      node = node.children['hi'];
      expect(node).toBeDefined();
      expect(node.source).toBe(MessageSource.AI);

      node = node.children['how'];
      expect(node).toBeDefined();
      expect(node.source).toBe(MessageSource.AI);
      expect(node.content).toEqual([
        ['how', 0.8],
        ['I', 0.2],
      ]);

      node = node.children['good'];
      expect(node).toBeDefined();
      expect(node.source).toBe(MessageSource.USER);
    });
  });

  describe('searchAndReturn', () => {
    it('should return null for non-existent message sequence', () => {
      const result = trie.searchAndReturn([
        { content: 'nonexistent', source: MessageSource.USER },
      ]);
      expect(result).toBeNull();
    });

    it('should return complete conversation history for messages ending with user', () => {
      const messages: Message[] = [
        { content: 'hello', source: MessageSource.USER },
        {
          content: [
            'hi',
            [
              ['I am', 0.5],
              ['I will', 0.5],
            ],
          ],
          source: MessageSource.AI,
        },
        { content: 'how are you', source: MessageSource.USER },
      ];

      trie.insert(messages);

      const searchResult = trie.searchAndReturn([
        { content: 'hello', source: MessageSource.USER },
      ]);

      expect(searchResult).toEqual(messages);
    });
    it('should return complete conversation history for messages ending with AI', () => {
      const messages: Message[] = [
        { content: 'hello', source: MessageSource.USER },
        {
          content: [
            'hi',
            [
              ['I am', 0.5],
              ['I will', 0.5],
            ],
          ],
          source: MessageSource.AI,
        },
        { content: 'how are you', source: MessageSource.USER },
        {
          content: [
            [
              ['A', 0.5],
              ['B', 0.5],
            ],
            [
              ['C', 0.5],
              ['D', 0.5],
            ],
          ],
          source: MessageSource.AI,
        },
      ];

      trie.insert(messages);

      const searchResult = trie.searchAndReturn([
        { content: 'hello', source: MessageSource.USER },
      ]);

      expect(searchResult).toEqual(messages);
    });
  });

  describe('clear', () => {
    it('should reset the trie to empty state', () => {
      const messages: Message[] = [
        { content: 'hello', source: MessageSource.USER },
      ];

      trie.insert(messages);
      trie.clear();

      expect(trie.root.children).toEqual({});
      expect(trie.root.index).toBe(-1);
      expect(trie.root.source).toBe(MessageSource.NONE);
    });
  });

  describe('edge cases', () => {
    it('should handle empty message arrays', () => {
      trie.insert([]);
      expect(trie.root.children).toEqual({});
    });

    it('should handle AI messages with mixed content types', () => {
      const wordProbList: WordProbList = [['probability', 0.7]];
      const messages: Message[] = [
        {
          content: ['string content', wordProbList],
          source: MessageSource.AI,
        },
      ];

      trie.insert(messages);

      expect(trie.root.children['string content']).toBeDefined();
      const probNode =
        trie.root.children['string content'].children['probability'];
      expect(probNode).toBeDefined();
      expect(probNode.content).toEqual(wordProbList);
    });
  });
});
