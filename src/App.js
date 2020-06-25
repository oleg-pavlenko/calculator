import React from 'react';
import { useImmer } from 'use-immer';
import './App.css';
import StateContext from './StateContext';
import DispatchContext from './DispatchContext';
import Formula from './components/Formula';
import Output from './components/Output';
import Buttons from './components/Buttons';

function App() {
  const [state, updateState] = useImmer({
    currentValue: '0',
    previousValue: '0',
    formula: '',
    currentSign: 'positive',
    lastClicked: '',
  });

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={updateState}>
        <div className="calculator">
          <div className="output">
            <Formula />
            <Output />
          </div>
          <Buttons />
        </div>
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export default App;
