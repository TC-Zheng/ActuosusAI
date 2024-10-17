// Trie node structure
class TrieNode {
  children: { [key: string]: TrieNode } = {};
  wordList: Array<[string, number]> = [];
  constructor(wordList: Array<[string, number]> = []) {
    this.wordList = wordList;
  }
}

class WordListsTrie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  passThrough(
    wordLists: Array<Array<[string, number]>>
  ): Array<Array<[string, number]>> {
    let current = this.root;
    const results: Array<Array<[string, number]>> = [];
    for (const wordList of wordLists) {
      const repr = wordList[0][0];
      if (!current.children[repr]) {
        for (const child in current.children) {
          wordList.push([current.children[child].wordList[0][0], -1]);
        }
        current.children[repr] = new TrieNode(wordList);
        results.push(wordList);
      } else {
        results.push(current.children[repr].wordList);
      }
      current = current.children[repr];
    }
    return results;
  }

  // Search if a word is in the trie, return the wordList if it is, otherwise return null
  search(words: string[]): Array<Array<[string, number]>> | null {
    let current = this.root;
    const results: Array<Array<[string, number]>> = [];
    for (const word of words) {
      if (!current.children[word]) {
        return null;
      }
      results.push(current.children[word].wordList);
      current = current.children[word];
    }
    while (current.children) {
      // Pick the first child
      const firstChild = current.children[Object.keys(current.children)[0]];
      if (!firstChild?.wordList) {
        break;
      }
      results.push(firstChild.wordList);
      current = firstChild;
    }
    return results;
  }
}

// Custom hook to manage the Trie in state
import { useState, useCallback } from 'react';

function useTrie() {
  const [trie] = useState(() => new WordListsTrie());

  const passThrough = useCallback(
    (wordLists: Array<Array<[string, number]>>) => {
      return trie.passThrough(wordLists);
    },
    [trie]
  );

  const search = useCallback(
    (words: string[]) => {
      return trie.search(words);
    },
    [trie]
  );

  return {
    passThrough,
    search,
  };
}

export default useTrie;
