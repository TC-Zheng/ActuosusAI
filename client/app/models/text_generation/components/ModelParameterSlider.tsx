import { useState } from 'react';

function ModelParameterSlider() {
  const [value, setValue] = useState(1);

  return (
    <div>
      <input
        type="range"
        min="0.1"
        max="3"
        step="0.1" // Ensures only integer values
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value, 10))} // Parse to ensure integer value
        className="slider"
      />
      <p>Value: {value}</p>
    </div>
  );
}

export default ModelParameterSlider;
