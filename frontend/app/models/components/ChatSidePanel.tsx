import React from 'react';
import { baseChatAction, baseChatState } from '@/app/models/hooks/chatReducer';

interface ChatSidePanelProps {
  state: baseChatState;
  isConnected: boolean;
  dispatch: (action: baseChatAction) => void;
}

const ChatSidePanel: React.FC<ChatSidePanelProps> = ({
  state,
  isConnected,
  dispatch,
}) => {
  return (
    <div className="flex flex-col bg-background-400 max-w-56 min-w-56 text-center">
      <button onClick={() => window.history.back()} className="mb-8 mt-2">
        Go Back
      </button>
      <h2 className="font-bold text-md text-primary-900">Model name</h2>
      <p className="text-primary-700 text-sm">{state.modelInfo?.name}</p>
      <h2 className="font-bold text-l text-primary-900">
        Estimated RAM usage:
      </h2>
      <p className="text-primary-700 text-sm">
        {Math.max(0, state.modelInfo?.estimated_ram ?? 0).toFixed(2)} GB
      </p>
      <h2 className="font-bold text-md text-primary-900">
        Estimated VRAM usage:
      </h2>
      <p className="text-primary-700 text-sm">
        {Math.max(0, state.modelInfo?.estimated_vram ?? 0).toFixed(2)} GB
      </p>
      <h2 className="font-bold text-md text-primary-900">Connection Status</h2>
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
          value={state.temperature}
          onChange={(e) =>
            dispatch({
              type: 'SET_TEMPERATURE',
              payload: parseFloat(e.target.value),
            })
          }
          className="flex-grow"
        />
        <input
          type="number"
          min="0.1"
          max="3"
          step="0.1"
          value={state.temperature}
          onChange={(e) =>
            dispatch({
              type: 'SET_TEMPERATURE',
              payload: parseFloat(e.target.value),
            })
          }
          className="ml-2 w-12 text-center bg-background-400"
        />
      </div>
      <h2 className="font-bold text-md text-primary-900">Max New Tokens</h2>
      <div className="flex items-center mb-2 mx-2 flex-col">
        <input
          type="range"
          min="1"
          max="200"
          value={state.maxNewTokens}
          onChange={(e) =>
            dispatch({
              type: 'SET_MAX_NEW_TOKENS',
              payload: parseFloat(e.target.value),
            })
          }
          className="flex-grow"
        />
        <input
          type="number"
          min="0.1"
          max="3"
          step="0.1"
          value={state.maxNewTokens}
          onChange={(e) =>
            dispatch({
              type: 'SET_MAX_NEW_TOKENS',
              payload: parseFloat(e.target.value),
            })
          }
          className="ml-2 w-12 text-center bg-background-400"
        />
      </div>
    </div>
  );
};

export default ChatSidePanel;