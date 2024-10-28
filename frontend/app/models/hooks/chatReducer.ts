import { useReducer } from 'react';

export type WordProbList = [string, number][];
export type ModelInfo = {
  name: string;
  estimated_ram: number;
  estimated_vram: number;
};
export enum MessageSource {
  USER = 'USER',
  AI = 'AI',
  NONE = 'NONE',
}
export enum WordStatus {
  PREVIOUS = -1,
  PICKED = -2,
}
type AIMessage = {
  content: (WordProbList | string)[];
  source: MessageSource.AI;
};
type UserMessage = {
  content: string;
  source: MessageSource.USER;
};
export type Message = AIMessage | UserMessage;

function isAIMessage(message: Message): message is AIMessage {
  return message.source === MessageSource.AI;
}

export type baseChatState = {
  messages: Message[];
  inputMessage: string;
  originalPrompt: string;
  generatingResponse: boolean;
  openedWord_i: number;
  openedWord_j: number;
  modelInfo: ModelInfo | null;
  temperature: number;
  maxNewTokens: number;
};

export type baseChatAction =
  | {
      type: 'SELECT_NEW_WORD_AT';
      i: number;
      j: number;
      prevWord: string;
      newWord: string;
    }
  | { type: 'SET_MESSAGES'; messages: Message[] }
  | { type: 'APPEND_NEW_AI_MESSAGE'; wordProbList: WordProbList }
  | {
      type: 'UPDATE_WORD_PROB_LIST_AT';
      i: number;
      j: number;
      wordProbList: WordProbList;
    }
  | {
      type: 'EDIT_MESSAGE_AT';
      i: number;
      j: number;
      message: Message;
    }
  | { type: 'CREATE_NEW_USER_MESSAGE'; inputString: string }
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
  messages: [],
  inputMessage: '',
  originalPrompt: '',
  generatingResponse: false,
  openedWord_i: -1,
  openedWord_j: -1,
  modelInfo: null,
  temperature: 1,
  maxNewTokens: 100,
};

function appendNewAIMessage(messages: Message[], wordProbList: WordProbList) {
  const lastMessage = messages.at(-1);
  let newMessage;
  if (lastMessage !== undefined && isAIMessage(lastMessage)) {
    newMessage = JSON.parse(JSON.stringify(lastMessage));
    newMessage.content.push(wordProbList);
    return [...messages.slice(0, messages.length - 1), newMessage];
  } else {
    newMessage = {
      content: [wordProbList],
      source: MessageSource.AI,
    } as AIMessage;
    return [...messages, newMessage];
  }
}

function refreshWordProbListAt(
  messages: Message[],
  i: number,
  j: number,
  wordProbList: WordProbList
): Message[] {
  const targetMessage = messages[i] as {
    content: (WordProbList | string)[];
    source: MessageSource.AI;
  };
  const targetWordProbList = targetMessage.content[j] as WordProbList;
  const updatedWordProbList = [targetWordProbList[0]].concat(
    wordProbList
  ) as WordProbList;
  const newMessage = {
    content: [
      ...targetMessage.content.slice(0, j),
      updatedWordProbList,
      ...targetMessage.content.slice(j + 1),
    ],
    source: targetMessage.source,
  } as Message;
  return [...messages.slice(0, i), newMessage, ...messages.slice(i + 1)];
}

const reducer = (
  state: baseChatState,
  action: baseChatAction
): baseChatState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return {
        ...state,
        openedWord_i: -1,
        openedWord_j: -1,
        messages: action.messages,
      };
    case 'SELECT_NEW_WORD_AT':
      const newMessage = JSON.parse(JSON.stringify(state.messages[action.i]));
      newMessage.content[action.j] = [
        [action.newWord, WordStatus.PICKED],
        [action.prevWord, WordStatus.PREVIOUS],
      ];
      return {
        ...state,
        generatingResponse: true,
        openedWord_i: -1,
        openedWord_j: -1,
        messages: [...state.messages.slice(0, action.i), newMessage],
      };
    case 'CREATE_NEW_USER_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            content: action.inputString,
            source: MessageSource.USER,
          } as UserMessage,
        ],
        generatingResponse: true,
        inputMessage: '',
        openedWord_i: -1,
        openedWord_j: -1,
      };
    case 'APPEND_NEW_AI_MESSAGE':
      return {
        ...state,
        messages: appendNewAIMessage(state.messages, action.wordProbList),
      };
    case 'UPDATE_WORD_PROB_LIST_AT':
      return {
        ...state,
        messages: refreshWordProbListAt(
          state.messages,
          action.i,
          action.j,
          action.wordProbList
        ),
      };
    case 'EDIT_MESSAGE_AT':
      return {
        ...state,
        messages: editMessageAt(
          state.messages,
          action.i,
          action.j,
          action.message
        ),
      };
    case 'CLOSE_OPENED_WORD':
      return { ...state, openedWord_i: -1, openedWord_j: -1 };
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

const editMessageAt = (
  messages: Message[],
  i: number,
  j: number,
  message: Message
) => {
  if (isAIMessage(message)) {
    const targetMessage = JSON.parse(JSON.stringify(messages[i])) as AIMessage;
    targetMessage.content = [
      ...targetMessage.content.slice(0, j),
      ...message.content,
    ];
    return [...messages.slice(0, i), targetMessage];
  } else {
    const targetMessage = JSON.parse(
      JSON.stringify(messages[i])
    ) as UserMessage;
    targetMessage.content = message.content;
    return [...messages.slice(0, i), targetMessage];
  }
};

const useChatReducer = () => useReducer(reducer, initialState);

export default useChatReducer;
