import React, { useContext } from 'react';
import { evaluate } from 'mathjs';
import StateContext from '../StateContext';
import DispatchContext from '../DispatchContext';

function Buttons() {
  const appState = useContext(StateContext);
  const appDispatch = useContext(DispatchContext);
  const IS_OPERATOR = /[x/+-]/;
  const ENDS_WITH_OPERATOR = /[x+-/]$/;

  function initialize() {
    appDispatch((draft) => {
      draft.currentValue = '0';
      draft.previousValue = '0';
      draft.formula = '';
      draft.currentSign = 'positive';
      draft.lastClicked = '';
    });
  }

  function digitLimit() {
    appDispatch((draft) => {
      draft.currentValue = 'Digit Limit Met';
      draft.previousValue = appState.currentValue;
    });
    setTimeout(() => {
      appDispatch((draft) => {
        draft.currentValue = appState.previousValue;
      });
    }, 750);
  }

  function lock(currentValue, formula) {
    return formula.lastIndexOf('.') === formula.length - 1
      || formula.lastIndexOf('-') === formula.length - 1
      || currentValue.indexOf('Met') !== -1;
  }

  function toggleToPositive(currentValue, formula, lastOpen) {
    appDispatch((draft) => {
      draft.currentSign = 'positive';
      draft.formula = formula.substring(0, lastOpen) + formula.substring(lastOpen + 2);
    });
    if (currentValue === '-') {
      appDispatch((draft) => {
        draft.currentValue = '0';
      });
    } else {
      appDispatch((draft) => {
        draft.currentValue = currentValue.slice(currentValue.indexOf('-') + 1);
      });
    }
  }

  function toggleToNegative(formula) {
    appDispatch((draft) => {
      draft.currentValue = `-${appState.formula.match(/(\d*\.?\d*)$/)[0]}`;
      draft.formula = formula.replace(/(\d*\.?\d*)$/, `(-${appState.formula.match(/(\d*\.?\d*)$/)[0]}`);
      draft.currentSign = 'negative';
    });
  }

  function handleOperand(e) {
    e.persist();
    if (appState.currentValue.indexOf('Limmit') === -1) {
      appDispatch((draft) => {
        draft.lastClicked = 'number';
      });
      if (appState.currentValue.length > 21) {
        digitLimit();
      } else if (appState.formula.indexOf('=') !== -1) {
        appDispatch((draft) => {
          draft.currentValue = e.target.value;
          draft.formula = e.target.value !== '0' ? e.target.value : '';
        });
      } else {
        appDispatch((draft) => {
          draft.currentValue = appState.currentValue === '0' || IS_OPERATOR.test(appState.currentValue)
            ? e.target.value : appState.currentValue + e.target.value;
        });
        if (appState.currentValue === '0' && e.target.value === '0') {
          appDispatch((draft) => {
            draft.formula = appState.formula;
          });
        } else if (/([^.0-9]0)$/.test(appState.formula)) {
          appDispatch((draft) => {
            draft.formula = appState.formula.slice(0, 1) + e.target.value;
          });
        } else {
          appDispatch((draft) => {
            draft.formula = appState.formula + e.target.value;
          });
        }
      }
    }
  }

  function handleOperator(e) {
    e.persist();
    if (!lock(appState.currentValue, appState.formula)) {
      if (appState.formula.lastIndexOf('(') > appState.formula.lastIndexOf(')')) {
        appDispatch((draft) => {
          draft.formula = `${appState.formula})${e.target.value}`;
          draft.previousValue = `${appState.formula})`;
        });
      } else if (appState.formula.indexOf('=') !== -1) {
        appDispatch((draft) => {
          draft.formula = appState.previousValue + e.target.value;
        });
      } else {
        appDispatch((draft) => {
          draft.previousValue = !IS_OPERATOR.test(appState.currentValue)
            ? appState.formula : appState.previousValue;
          draft.formula = !IS_OPERATOR.test(appState.currentValue)
            ? appState.formula + e.target.value : appState.previousValue + e.target.value;
        });
      }
      appDispatch((draft) => {
        draft.currentSign = 'positive';
        draft.currentValue = e.target.value;
        draft.lastClicked = 'operator';
      });
    }
  }

  function handleFloatinP() {
    if (appState.currentValue.indexOf('.') === -1 && appState.currentValue.indexOf('Limit') === -1) {
      appDispatch((draft) => {
        draft.lastClicked = 'decimal';
      });
      if (appState.currentValue.length > 21) {
        digitLimit();
      } else if (
        (appState.lastClicked === 'evaluated'
          || ENDS_WITH_OPERATOR.test(appState.formula)
          || appState.currentValue === '0')
          && (appState.formula === ''
          || /-$/.test(appState.formula))
      ) {
        appDispatch((draft) => {
          draft.currentValue = '0.';
          draft.formula = appState.lastClicked === 'evaluated' ? '0.' : `${appState.formula}0.`;
        });
      } else {
        appDispatch((draft) => {
          draft.currentValue = `${appState.formula.match(/(-?\d+\.?\d*)$/)[0]}.`;
          draft.formula = `${appState.formula}.`;
        });
      }
    }
  }

  function handleToggleSign() {
    appDispatch((draft) => {
      draft.lastClicked = 'toggleSign';
    });
    if (appState.lastClicked === 'evaluated') {
      appDispatch((draft) => {
        draft.currentValue = appState.currentValue.indexOf('-') > -1
          ? appState.currentValue.slice(1) : `-${appState.currentValue}`;
        draft.formula = appState.currentValue.indexOf('-') > -1
          ? appState.currentValue.slice(1) : `(-${appState.currentValue}`;
        draft.currentSign = appState.currentValue.indexOf('-') > -1
          ? 'positive' : 'negative';
      });
    } else if (appState.currentSign === 'negative') {
      toggleToPositive(appState.currentValue, appState.formula, appState.formula.lastIndexOf('(-'));
    } else {
      toggleToNegative(appState.formula);
    }
  }

  function handleEquals() {
    if (appState.lastClicked === 'evaluated') {
      return;
    }
    if (!lock(appState.currentValue, appState.formula)) {
      let expression = appState.formula;
      if (ENDS_WITH_OPERATOR.test(expression)) {
        expression = expression.slice(0, -1);
      }
      expression = expression.replace(/x/g, '*').replace(/-/g, '-');
      expression = expression.lastIndexOf('(') > expression.lastIndexOf(')')
        ? `${expression})` : expression;
      const answer = Math.round(1000000000000 * evaluate(expression)) / 1000000000000;
      appDispatch((draft) => {
        draft.currentValue = answer.toString();
        draft.formula = `${expression.replace(/\*/g, '⋅').replace(/-/g, '-')}=${answer}`;
        draft.previousValue = answer;
        draft.currentSign = answer[0] === '-' ? 'negative' : 'positive';
        draft.lastClicked = 'evaluated';
      });
    }
  }

  return (
    <>
      <button onClick={initialize} value="AC" type="button">AC</button>
      <button onClick={handleToggleSign} value="±" type="button">±</button>
      <button onClick={handleOperator} value="/" type="button">/</button>
      <button onClick={handleOperator} value="x" type="button">x</button>
      <button onClick={handleOperand} value="7" type="button">7</button>
      <button onClick={handleOperand} value="8" type="button">8</button>
      <button onClick={handleOperand} value="9" type="button">9</button>
      <button onClick={handleOperator} value="-" type="button">-</button>
      <button onClick={handleOperand} value="4" type="button">4</button>
      <button onClick={handleOperand} value="5" type="button">5</button>
      <button onClick={handleOperand} value="6" type="button">6</button>
      <button onClick={handleOperator} value="+" type="button">+</button>
      <button onClick={handleOperand} value="1" type="button">1</button>
      <button onClick={handleOperand} value="2" type="button">2</button>
      <button onClick={handleOperand} value="3" type="button">3</button>
      <button onClick={handleEquals} value="=" type="button" className="equals">=</button>
      <button onClick={handleOperand} value="0" type="button" className="zero">0</button>
      <button onClick={handleFloatinP} value="." type="button">.</button>
    </>
  );
}

export default Buttons;
