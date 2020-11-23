import React from 'react';
import ReactDOM from 'react-dom';
import Board from './Board';

const App = () => {
  return (
    <>
    <h1>Chess</h1>
    <Board />
    </>
  )
};

ReactDOM.render(<App />, document.getElementById("root"));