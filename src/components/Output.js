import React, { useContext } from 'react';
import StateContext from '../StateContext';

function Output() {
  const appState = useContext(StateContext);
  return (
    <div className="currentValue">
      {appState.currentValue}
    </div>
  );
}

export default Output;
