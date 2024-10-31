import React from 'react';
import {
  baseChatAction,
  baseChatState,
} from '@/app/models/chat/hooks/chatReducer';
import TooltipWrapper from '@/app/components/TooltipWrapper';
const minProbTooltip =
  'The minimum probability of a word being selected. If the probability of the most likely word is below this value, the model will not select any word.';
interface ChatSidePanelProps {
  state: baseChatState;
  isConnected: boolean;
  dispatch: (action: baseChatAction) => void;
  onConfigChange: (config_name: string, config_value: string) => void;
}

const ChatSidePanel: React.FC<ChatSidePanelProps> = ({
  state,
  isConnected,
  dispatch,
  onConfigChange,
}) => {
  return (
    <div className="flex flex-col bg-background-400 max-w-56 min-w-56 text-center z-10">
      <button onClick={() => window.history.back()} className="mb-8 mt-2">
        Go Back
      </button>
      <h2 className="font-bold text-md text-primary-900">Model name</h2>
      <p className="text-primary-700 text-sm">{state.ai_model_name}</p>
      <h2 className="font-bold text-l text-primary-900">
        Estimated RAM usage:
      </h2>
      <p className="text-primary-700 text-sm">
        {Math.max(0, state.estimated_ram ?? 0).toFixed(2)} GB
      </p>
      <h2 className="font-bold text-md text-primary-900">
        Estimated VRAM usage:
      </h2>
      <p className="text-primary-700 text-sm">
        {Math.max(0, state.estimated_vram ?? 0).toFixed(2)} GB
      </p>
      <h2 className="font-bold text-md text-primary-900">Connection Status</h2>
      <p className="text-primary-700 text-sm">
        {isConnected ? 'Connected' : 'Error: Not connected'}
      </p>
      <h2 className="font-bold text-md text-primary-900">Temperature</h2>
      <div className="flex flex-col items-center mx-2">
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={state.temperature}
          onChange={(e) => {
            dispatch({
              type: 'SET_TEMPERATURE',
              temperature: parseFloat(e.target.value),
            });
            onConfigChange('temperature', e.target.value);
          }}
          className="flex-grow"
        />
        <input
          type="numeric"
          min="0.1"
          max="3"
          value={state.temperature}
          onChange={(e) => {
            dispatch({
              type: 'SET_TEMPERATURE',
              temperature: parseFloat(e.target.value),
            });
            onConfigChange('temperature', e.target.value);
          }}
          className="ml-2 w-12 text-center bg-background-400"
        />
      </div>
      <h2 className="font-bold text-md text-primary-900">Max New Tokens</h2>
      <div className="flex items-center mx-2 flex-col">
        <input
          type="range"
          min="1"
          max="200"
          value={state.maxNewTokens}
          onChange={(e) => {
            dispatch({
              type: 'SET_MAX_NEW_TOKENS',
              maxNewTokens: parseFloat(e.target.value),
            });
            onConfigChange('max_new_tokens', e.target.value);
          }}
          className="flex-grow"
        />
        <input
          type="numeric"
          min="0.1"
          max="3"
          value={state.maxNewTokens}
          onChange={(e) => {
            dispatch({
              type: 'SET_MAX_NEW_TOKENS',
              maxNewTokens: parseFloat(e.target.value),
            });
            onConfigChange('max_new_tokens', e.target.value);
          }}
          className="ml-2 w-12 text-center bg-background-400"
        />
      </div>
      <TooltipWrapper tooltipMessage={minProbTooltip}>
        <h2 className="font-bold text-md text-primary-900">
          Minimum Probability
        </h2>
      </TooltipWrapper>
      <div className="flex items-center mx-2 flex-col">
        <input
          type="range"
          min="0.0001"
          max="0.2001"
          step="0.001"
          value={state.minProb}
          onChange={(e) => {
            dispatch({
              type: 'SET_MIN_PROB',
              minProb: parseFloat(e.target.value),
            });
            onConfigChange('min_prob', e.target.value);
          }}
          className="flex-grow"
        />
        <div className="flex items-center">
          <input
            type="numeric"
            min="0.0001"
            max="0.5"
            step="0.01"
            value={(state.minProb * 100).toFixed(2)}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
              if (value === '') value = '0'; // Handle empty input

              // Convert to a number with two decimal places
              const formattedValue = (parseInt(value, 10) / 100).toFixed(2);

              // Update display and state
              dispatch({
                type: 'SET_MIN_PROB',
                minProb: parseFloat(formattedValue) / 100,
              });
              onConfigChange('min_prob', formattedValue);
            }}
            className="ml-2 w-14 text-center bg-background-400"
          />
          <span>{'%'}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatSidePanel;
