import {
  Message,
  MessageSource,
  WordProbList,
} from '@/app/models/hooks/chatReducer';
// Custom hook to manage the Trie in state
import { useCallback, useState } from 'react';

class MessageTrieNode {
  children: { [key: string]: MessageTrieNode } = {};
  content: WordProbList;
  source: MessageSource;
  index: number;
  constructor(index: number, source: MessageSource, content: WordProbList) {
    this.index = index;
    this.content = content;
    this.source = source;
  }
}

export class MessageTrie {
  root: MessageTrieNode;

  constructor() {
    this.root = new MessageTrieNode(-1, MessageSource.NONE, []);
  }

  insert(messages: Message[]): void {
    let current = this.root;
    messages.forEach((message, index) => {
      if (message.source === MessageSource.USER) {
        const repr = message.content;
        if (!current.children[repr]) {
          current.children[repr] = new MessageTrieNode(
            index,
            MessageSource.USER,
            []
          );
        }
        current = current.children[repr];
      } else if (message.source === MessageSource.AI) {
        for (const item of message.content) {
          let repr: string;
          if (typeof item === 'string') {
            repr = item;
            current.children[repr] = new MessageTrieNode(
              index,
              MessageSource.AI,
              []
            );
          } else {
            repr = item[0][0];
            current.children[repr] = new MessageTrieNode(
              index,
              MessageSource.AI,
              item
            );
          }
          current = current.children[repr];
        }
      }
    });
  }

  // Search if a word is in the trie, return the wordList if it is, otherwise return null
  searchAndReturn(messages: Message[]): Message[] | null {
    let current = this.root;
    // Checking if messages is in the trie
    const result: Message[] = [];
    for (const message of messages) {
      // Search for if messages is in trie
      if (typeof message.content === 'string') {
        // source = user
        if (current.children.hasOwnProperty(message.content)) {
          result.push(message);
          current = current.children[message.content];
        } else {
          return null;
        }
      } else {
        // source = ai
        for (const item of message.content) {
          const key = typeof item === 'string' ? item : item[0][0];
          if (current.children.hasOwnProperty(key)) {
            current = current.children[key];
          } else {
            return null;
          }
        }
        result.push(message);
      }
    }
    // After knowing that messages is in the trie, continue building the tree with the latest children for a complete history
    let currentIndex = result.length;
    while (Object.keys(current.children).length > 0) {
      let lastChildKey = Object.keys(current.children).at(-1)!;
      let lastChild = current.children[lastChildKey];
      if (lastChild.source === MessageSource.USER) {
        result.push({
          content: lastChildKey,
          source: MessageSource.USER,
        });
        current = lastChild;
        ++currentIndex;
      } else {
        const newMessage: Message = {
          content: [],
          source: MessageSource.AI,
        };
        while (lastChild.index === currentIndex) {
          if (lastChild.content.length > 0) {
            newMessage.content.push(lastChild.content);
          } else {
            newMessage.content.push(lastChildKey);
          }
          current = lastChild;
          if (Object.keys(current.children).length === 0) {
            result.push(newMessage);
            return result;
          }
          lastChildKey = Object.keys(current.children).at(-1)!;
          lastChild = current.children[lastChildKey];
        }
        result.push(newMessage);
        ++currentIndex;
      }
    }
    return result;
  }

  clear() {
    this.root = new MessageTrieNode(-1, MessageSource.NONE, []);
  }
}

function useMessageTrie() {
  const [trie] = useState(() => new MessageTrie());

  const insertTrie = useCallback(
    (messages: Message[]) => {
      return trie.insert(messages);
    },
    [trie]
  );

  const searchAndReturnTrie = useCallback(
    (messages: Message[]) => {
      return trie.searchAndReturn(messages);
    },
    [trie]
  );

  const clearTrie = useCallback(() => {
    trie.clear();
  }, [trie]);

  return {
    insertTrie,
    searchAndReturnTrie,
    clearTrie,
  };
}

export default useMessageTrie;
