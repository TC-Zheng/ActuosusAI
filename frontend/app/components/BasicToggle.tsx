import { useState } from 'react';

import React from 'react';

interface ToggleSwitchProps {
  isOn: boolean;
  onClick: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isOn, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`w-6 h-3 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
        isOn ? 'bg-primary-500' : 'bg-neutral-300'
      }`}
    >
      <div
        className={`bg-white w-2 h-2 rounded-full shadow-md transform transition-transform ${
          isOn ? 'translate-x-2' : 'translate-x-0'
        }`}
      />
    </div>
  );
};

export default ToggleSwitch;
