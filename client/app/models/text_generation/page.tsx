'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import WordDropdown from '@/app/models/text_generation/components/WordDropdown';
import useTrie from '@/app/models/text_generation/hooks/useTrie';
import { useWebsocket } from '@/app/hooks/useWebsocket';
import Loader from '@/app/components/Loader';
import { useSearchParams } from 'next/navigation';

type WordProbList = Array<[string, number]>;
type TextGenerationResponse = {
  response: WordProbList;
  end: boolean;
};
type ModelInfo = {
  name: string;
  estimated_ram: number;
  estimated_vram: number;
};

const WebSocketComponent = () => {
  const [displayedWordProbLists, setDisplayedWordProbLists] = useState<
    WordProbList[]
  >([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [originalPrompt, setOriginalPrompt] = useState<string>('');
  const [generatingResponse, setGeneratingResponse] = useState<boolean>(false);
  const [openedWord, setOpenedWord] = useState<number>(-1);
  const refreshingAt = useRef<number | null>(null);
  // This really should have been a state, but I need to use it in the onmessage closure
  const isLoadingModel = useRef<boolean>(true);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const { insertTrie, searchTrie, clearTrie } = useTrie();
  const [temperature, setTemperature] = useState<number>(1);
  const [maxNewTokens, setMaxNewTokens] = useState<number>(100);
  const searchParams = useSearchParams();
  const queryString = new URLSearchParams({
    ai_model_id: `${searchParams.get('ai_model_id')}`,
    quantization: `${searchParams.get('quantization')}`,
    gguf_file_name: `${searchParams.get('gguf_file_name')}`,
  }).toString();

  const { sendMessageToWebsocket, isConnected } = useWebsocket(
    `ws://127.0.0.1:8000/ws/text_generation/?${queryString}`,
    {
      onMessage: (message) => {
        if (isLoadingModel.current) {
          isLoadingModel.current = false;
          setModelInfo(JSON.parse(message.data));
          return;
        }
        const data: TextGenerationResponse = JSON.parse(message.data);
        if (data.end) {
          setGeneratingResponse(false);
        } else {
          if (refreshingAt.current !== null) {
            // Replace the word list at refreshingAt with the new list
            setDisplayedWordProbLists((prev) => {
              const newLists = [...prev];
              newLists[refreshingAt.current!] = [
                newLists[refreshingAt.current ?? 0][0],
                ...data.response,
              ];
              return newLists;
            });
            refreshingAt.current = null;
          } else {
            setDisplayedWordProbLists((prev) => [...prev, data.response]);
          }
        }
      },
    }
  );

  useEffect(() => {
    if (!generatingResponse) {
      // Cache the generated tokens in the trie
      insertTrie(displayedWordProbLists);
    }
  }, [generatingResponse, displayedWordProbLists, insertTrie]);

  // Send message function
  const sendMessage = useCallback(
    (message: string, temperature: number, maxNewTokens: number) => {
      console.log('Sending message:', message);
      const messageWithPayload = JSON.stringify({
        prompt: message,
        temperature: temperature,
        max_new_tokens: maxNewTokens,
      });
      sendMessageToWebsocket(messageWithPayload);
      setInputMessage(''); // Clear input after sending
    },
    [sendMessageToWebsocket]
  );

  const handleWordPick = useCallback(
    (index: number, word: string) => {
      setOpenedWord(-1);
      // Check if the whole words tree up to word is in the trie already
      const prev_words_tree = displayedWordProbLists
        .slice(0, index)
        .map((wpList) => wpList[0][0]);
      const searchResults = searchTrie([...prev_words_tree, word]);
      if (searchResults) {
        // If the word is in the trie, use that instead of generating new tokens
        setDisplayedWordProbLists(searchResults);
        return;
      }
      // If the word is not in the trie, generate new tokens
      const newMessage = originalPrompt + prev_words_tree.join('') + word;
      setGeneratingResponse(true);
      const prev_list = displayedWordProbLists.slice(0, index);
      setDisplayedWordProbLists([
        ...prev_list,
        [
          [word, 1],
          [displayedWordProbLists[index][0][0], -1],
        ],
      ]);
      sendMessage(newMessage, temperature, maxNewTokens);
    },
    [displayedWordProbLists, originalPrompt, searchTrie, sendMessage]
  );
  const handleRefresh = useCallback(
    (index: number) => {
      refreshingAt.current = index;
      sendMessage(
        originalPrompt +
          displayedWordProbLists
            .slice(0, index)
            .map((wpList) => wpList[0][0])
            .join(''),
        temperature,
        1
      );
    },
    [displayedWordProbLists, originalPrompt, sendMessage]
  );
  const onSendClick = () => {
    setOriginalPrompt(inputMessage);
    setGeneratingResponse(true);
    setInputMessage('');
    setDisplayedWordProbLists([]);
    setOpenedWord(-1);
    clearTrie();
    sendMessage(inputMessage, temperature, maxNewTokens);
  };

  return (
    <>
      {isLoadingModel.current && <Loader />}
      {!isLoadingModel.current && (
        <div className="flex flex-row h-screen w-full">
          <div className="flex flex-col bg-background-400 max-w-56 min-w-56 text-center">
            <button onClick={() => window.history.back()} className="mb-8 mt-2">
              Go Back
            </button>
            <h2 className="font-bold text-md text-primary-900">Model name</h2>
            <p className="text-primary-700 text-sm">{modelInfo?.name}</p>
            <h2 className="font-bold text-l text-primary-900">
              Estimated RAM usage:
            </h2>
            <p className="text-primary-700 text-sm">
              {Math.max(0, modelInfo?.estimated_ram ?? 0).toFixed(2)} GB
            </p>
            <h2 className="font-bold text-md text-primary-900">
              Estimated VRAM usage:
            </h2>
            <p className="text-primary-700 text-sm">
              {Math.max(0, modelInfo?.estimated_vram ?? 0).toFixed(2)} GB
            </p>
            <h2 className="font-bold text-md text-primary-900">
              Connection Status
            </h2>
            <p className="text-primary-700 text-sm">
              {isConnected ? 'Connected' : 'Error: Not connected'}
            </p>
            <h2 className="font-bold text-md text-primary-900">Temperature</h2>
            <div className="flex flex-col items-center mb-2 mx-2">
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="flex-grow"
              />
              <input
                type="number"
                min="0.1"
                max="3"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="ml-2 w-12 text-center bg-background-400"
              />
            </div>
            <h2 className="font-bold text-md text-primary-900">
              Max New Tokens
            </h2>
            <div className="flex items-center mb-2 mx-2 flex-col">
              <input
                type="range"
                min="1"
                max="200"
                value={maxNewTokens}
                onChange={(e) => setMaxNewTokens(parseInt(e.target.value))}
                className="flex-grow"
              />
              <input
                type="number"
                min="0.1"
                max="3"
                step="0.1"
                value={maxNewTokens}
                onChange={(e) => setMaxNewTokens(parseInt(e.target.value))}
                className="ml-2 w-12 text-center bg-background-400"
              />
            </div>
          </div>
          <div className="flex flex-col w-full">
            <div className="flex flex-wrap m-20">
              <text>{originalPrompt}</text>
              {displayedWordProbLists.map((wordProbList, index) => (
                <WordDropdown
                  key={index}
                  index={index}
                  isOpen={openedWord === index}
                  wordList={wordProbList}
                  onWordClick={(index) =>
                    openedWord === index
                      ? setOpenedWord(-1)
                      : setOpenedWord(index)
                  }
                  onWordPick={handleWordPick}
                  handleRefresh={handleRefresh}
                />
              ))}
            </div>
            <div className="mt-auto w-full flex flex-row p-8 pr-16 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message"
                className="w-full resize-none overflow-hidden pr-16"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSendClick();
                  }
                }}
              />
              <button
                onClick={onSendClick}
                className="absolute right-16 bottom-8 mr-2"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WebSocketComponent;
