import React, { useState, FC, ReactNode } from 'react';

interface TooltipWrapperProps {
  tooltipMessage: string;
  children: ReactNode;
}

const TooltipWrapper: FC<TooltipWrapperProps> = ({
  tooltipMessage,
  children,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-flex items-center space-x-1 justify-center">
      <div>{children}</div>
      <div
        className="relative flex items-center cursor-pointer text-secondary-700"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        // onClick={() => setShowTooltip(!showTooltip)}
      >
        <span className="text-xs font-semibold bg-opacity-50 bg-background-500 rounded-full px-1">
          ?
        </span>
        {showTooltip && (
          <div className="absolute top-full mt-1 w-40 bg-primary-400 bg-opacity-75 text-primary-900 text-sm rounded-md p-2 shadow-lg z-10">
            {tooltipMessage}
          </div>
        )}
      </div>
    </div>
  );
};
export default TooltipWrapper;
