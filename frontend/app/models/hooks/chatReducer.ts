import { useReducer } from 'react';

type WordProbList = Array<[string, number]>;
type ModelInfo = {
  name: string;
  estimated_ram: number;
  estimated_vram: number;
};

type Message =
  | {
      user_content: string;
      ai_content: WordProbList;
      source: 'ai';
      id: number;
    }
  | {
      user_content: string;
      source: 'user';
      id: number;
    };

export type baseChatState = {
  currentWordProbLists: WordProbList[];
  inputMessage: string;
  originalPrompt: string;
  generatingResponse: boolean;
  openedWord: number;
  modelInfo: ModelInfo | null;
  temperature: number;
  maxNewTokens: number;
  turnIndex: number;
};

export type baseChatAction =
  | {
      type: 'UPDATE_CURRENT_WORD_PROB_LISTS_AT';
      index: number;
      newWordProbList: WordProbList;
    }
  | { type: 'SELECT_CACHED_WORD'; cachedWordProbLists: WordProbList[] }
  | {
      type: 'SELECT_NEW_WORD';
      index: number;
      prevWord: string;
      newWord: string;
    }
  | { type: 'STOP_GENERATING_RESPONSE' }
  | { type: 'APPEND_CURRENT_WORD_PROB_LISTS'; payload: WordProbList }
  | { type: 'SET_INPUT_MESSAGE'; payload: string }
  | { type: 'SEND_NEW_MESSAGE'; inputMessage: string }
  | { type: 'SET_OPENED_WORD'; payload: number }
  | { type: 'CLOSE_OPENED_WORD' }
  | { type: 'SET_MODEL_INFO'; payload: ModelInfo | null }
  | { type: 'SET_TEMPERATURE'; payload: number }
  | { type: 'SET_MAX_NEW_TOKENS'; payload: number };

const initialState: baseChatState = {
  currentWordProbLists: [],
  inputMessage: '',
  originalPrompt: '',
  generatingResponse: false,
  openedWord: -1,
  modelInfo: null,
  temperature: 1,
  maxNewTokens: 100,
  turnIndex: 1,
};

const reducer = (
  state: baseChatState,
  action: baseChatAction
): baseChatState => {
  switch (action.type) {
    case 'UPDATE_CURRENT_WORD_PROB_LISTS_AT':
      const newCurrentWordProbLists = [...state.currentWordProbLists];
      newCurrentWordProbLists[action.index] = [
        newCurrentWordProbLists[action.index][0],
        ...action.newWordProbList,
      ];
      return { ...state, currentWordProbLists: newCurrentWordProbLists };
    case 'APPEND_CURRENT_WORD_PROB_LISTS':
      return {
        ...state,
        currentWordProbLists: [...state.currentWordProbLists, action.payload],
      };
    case 'SELECT_CACHED_WORD':
      return {
        ...state,
        openedWord: -1,
        currentWordProbLists: action.cachedWordProbLists,
      };
    case 'SELECT_NEW_WORD':
      return {
        ...state,
        generatingResponse: true,
        openedWord: -1,
        currentWordProbLists: [
          ...state.currentWordProbLists.slice(0, action.index),
          [
            [action.newWord, 1],
            [action.prevWord, -1],
          ],
        ],
      };
    case 'SEND_NEW_MESSAGE':
      return {
        ...state,
        originalPrompt: action.inputMessage,
        generatingResponse: true,
        inputMessage: '',
        currentWordProbLists: [],
        openedWord: -1,
      };
    case 'CLOSE_OPENED_WORD':
      return { ...state, openedWord: -1 };
    case 'STOP_GENERATING_RESPONSE':
      return { ...state, generatingResponse: false };
    case 'SET_OPENED_WORD':
      return { ...state, openedWord: action.payload };
    case 'SET_MODEL_INFO':
      return { ...state, modelInfo: action.payload };
    case 'SET_TEMPERATURE':
      return { ...state, temperature: action.payload };
    case 'SET_MAX_NEW_TOKENS':
      return { ...state, maxNewTokens: action.payload };
    case 'SET_INPUT_MESSAGE':
      return { ...state, inputMessage: action.payload };
    default:
      return state;
  }
};

const useChatReducer = () => useReducer(reducer, initialState);

export default useChatReducer;
