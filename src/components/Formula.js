import React, { useContext } from 'react';
import StateContext from '../StateContext';

function Formula() {
  const appState = useContext(StateContext);
  return (
    <div className="formula">
      {appState.formula.replace(/x/g, '⋅')}
    </div>
  );
}

export default Formula;
