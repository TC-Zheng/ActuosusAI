import { Message, WordProbList } from '@/app/models/hooks/chatReducer';
import { useCallback, useState } from 'react';

class MessageTrieNode {
  children: { [key: string]: MessageTrieNode } = {};
  content: WordProbList;
  source: string;

  constructor(source: string, content: WordProbList) {
    this.content = content;
    this.source = source;
  }
}

export class MessageTrie {
  root: MessageTrieNode;

  constructor() {
    this.root = new MessageTrieNode('', []);
  }

  serialize(): string {
    return JSON.stringify(this.root);
  }

  static deserialize(jsonString: string): MessageTrie {
    const trie = new MessageTrie();
    trie.root = JSON.parse(jsonString);
    return trie;
  }

  insert(messages: Message[]): void {
    let current = this.root;
    for (const message of messages) {
      for (const item of message.content) {
        const repr = typeof item === 'string' ? item : item[0][0];
        current.children[repr] = new MessageTrieNode(
          message.source,
          typeof item === 'string' ? [] : item
        );
        current = current.children[repr];
      }
    }
  }
  searchAndReturn(messages: Message[]): Message[] | null {
    // First search for messages in the trie, and return null if not found
    const result: Message[] = [];
    let current = this.root;
    for (const message of messages) {
      const newMessage: Message = {
        content: [],
        source: message.source,
      };
      for (const item of message.content) {
        const repr = typeof item === 'string' ? item : item[0][0];
        if (current.children.hasOwnProperty(repr)) {
          if (current.children[repr].source === message.source) {
            newMessage.content.push(
              current.children[repr].content.length > 0
                ? current.children[repr].content
                : repr
            );
            current = current.children[repr];
            continue;
          }
        }
        return null;
      }
      result.push(newMessage);
    }
    // Continue building the tree with the latest children for a complete history
    let curSource = result.at(-1)!.source;
    let newMessage = result.pop();
    while (Object.keys(current.children).length > 0) {
      // Pick the last child
      const lastChildKey = Object.keys(current.children).at(-1)!;
      const lastChild = current.children[lastChildKey];
      // If the source is different, start a new message
      if (lastChild.source !== curSource) {
        if (newMessage) {
          result.push(newMessage);
        }
        newMessage = {
          content: [],
          source: lastChild.source,
        };
        curSource = lastChild.source;
      }
      // Build the message
      newMessage!.content.push(
        lastChild.content.length > 0 ? lastChild.content : lastChildKey
      );
      current = lastChild;
    }
    // Push the last message
    if (newMessage) {
      result.push(newMessage);
    }
    return result;
  }

  clear() {
    this.root = new MessageTrieNode('', []);
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
