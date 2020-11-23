import React, { useState, useEffect } from 'react';
import Square from './Square';
import { startup } from '../../data/startup';
//  this retrieves where in /dist the images now reside
const images = require('../images/pieces/*.png');

const alph = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const Board= () => {

  const [ board, setBoard ] = useState([]);
  const [ kingLocs, setKingLocs ] = useState({'w': '1d', 'b': '8d'});
  const [ turn, setTurn ] = useState('White');
  const [ move, setMove ] = useState([]);

  useEffect(() => {
    const board = new Array(8).fill(new Array(8).fill('element')).map((a, i) => {
      return a.map((s, j) => {
        const id = `${8-i}${alph[j]}`;
        return {"id":id, "piece": startup[id] || ""};
      })
    });
    setBoard(board);
  }, [])

  const onSquareClicked = (squareId, piece) => {
    //  this seems verbose
    if (move.length === 0 && piece !== '') {
      //  right color?
      if (turn === 'White') {
        if (piece.charAt(0) !== 'w') {
          alert('Invalid piece selected.');
          piece = '';
        }
      } else {
        if (piece.charAt(0) !== 'b') {
          alert('Invalid piece selected.')
          piece = '';
        }
      }
    }
    //  first element has to contain a piece; otherwise ignore
    //  later, may also want to ignore clicking on a piece that cannot move
    if (move.length > 0 || piece !== '') {
      let boardT = [...board];
      let moveT = [...move];
      moveT.push({squareId, piece});
      //  buncha logic goes here
      if (moveT.length === 2) {
        const from = xLate(moveT[0].squareId);
        const to = xLate(moveT[1].squareId);
        const color = moveT[0].piece.charAt(0);
        //  type should probably be enum
        const type = moveT[0].piece.charAt(1);
        console.log("fromtocolortype: ", from, to, color, type);
        //  1. is this a valid move for the piece?
        //  2. did we move onto our own piece?  *invalid*
        //  3. did we move into check? *invalid *
        if (!movedOntoOwnPiece(from, to, color) &&
            moveValidForPiece(from, to, color, type)) {
          //  so far so good
          //  did we take a piece?
          //  move our piece
          boardT[to[0]][to[1]].piece = board[from[0]][from[1]].piece;
          boardT[from[0]][from[1]].piece = '';
          if (!kingInCheck(boardT, color)) {
            //  finalize move
            setBoard(boardT);
            //  set king's location
            if (type === 'K') {
              const kingLocs = kingLocs;
              kingLocs[color] = moveT[1];    // 'to' location
              setKingLocs(kingLocs);
            }
            setTurn(turn === 'White' ? 'Black' : 'White')
            const oColor = color === 'w' ? 'b' : 'w';
            if (kingInCheck(board, oColor)) {
              alert(`${oColor} king in check!`);   //  what about checkmate?
            }
          } else {
            alert('Invalid move - king in check!');
          }
        } else {
          alert("Invalid move");
        }
        //  when moveT.length = 2, we ALWAYS clear it.  Time for next move
        moveT = [];
      }
      setMove(moveT);
    }
  };

  const xLate = (squareId) => {
    //  translate click position to matrix point
    const row = 8 - parseInt(squareId.charAt(0));
    const col = alph.indexOf(squareId.charAt(1));
    return [row, col];
  };

  const xLateBack = (index) => {
    //  translate click position to matrix point
    const col = alph[index[1]];
    const row = 8 - index[0];
    return row+col;
  };

  const movedOntoOwnPiece = (from, to, color) => {
    console.log('to ', to, 'board to ', board[to[0]][to[1]]);
    return board[to[0]][to[1]].piece.charAt(0) === color ? true : false;
  };

  const moveValidForPiece = (from, to, color, type) => {
    let valid = false;
    //  also need to check if move is blocked
    //  should we use a switch?
    if (type === 'K') {
      if ((Math.abs(to[0]-from[0]) === 1 && from[1] === to[1]) ||
          (Math.abs(to[1]-from[1]) === 1 && from[0] === to[0]) ||
          (Math.abs(to[0]-from[0]) === 1 && Math.abs(to[0]-from[0]) === 1)) {
            valid = true;
            //  no obstruction possible
          }
    }
    //  same row = horiz move; same col = vert move
    if (type === 'Q' || type === 'R') {
      if (from[0] === to[0] || from [1] === to[1]) {
        //  if same column
        if (from[0] === to[0]) {
          valid = true;
          //  obstructed?
          const lower = Math.min(from[1], to[1]);
          const higher = Math.max(from[1], to[1]);
          for (let x = lower + 1; x < higher; x++) {
            if (board[from[0]][x].piece !== '') {
              valid = false;
              break;
            }
          }
        }
        //  if same row
        if (from[1] === to[1]) {
          valid = true;
          //  obstructed?
          const lower = Math.min(from[0], to[0]);
          const higher = Math.max(from[0], to[0]);
          for (let x = lower + 1; x < higher; x++) {
            if (board[x][from[1]].piece !== '') {
              valid = false;
              break;
            }
          }
        }
      }
    }
    //  +- multiple of seven or nine = diagonal move
    if (!valid && (type === 'Q' || type === 'B')) {
      const diff = Math.abs((from[0]*8+from[1]) - (to[0]*8+to[1]));
      if (diff%7 === 0) {
        valid = true;
        //  obstructed?
        //  refactor
        const lower = Math.min(from[0]*8+from[1], to[0]*8+to[1]);
        const higher = Math.max(from[0]*8+from[1], to[0]*8+to[1]);
        for (let x = lower + 7; x < higher; x+=7) {
          //  translate x into a board position
          const y = Math.floor(x / 8);
          const z = x - y * 8;
          if (board[y][z].piece !== '') {
            valid = false;
            break;
          }
        }
      }
      if (diff%9 === 0) {
        valid = true;
        //  obstructed?
        const lower = Math.min(from[0]*8+from[1], to[0]*8+to[1]);
        const higher = Math.max(from[0]*8+from[1], to[0]*8+to[1]);
        for (let x = lower + 9; x < higher; x+=9) {
          //  translate x into a board position
          const y = Math.floor(x / 8);
          const z = x - y * 8;
          if (board[y][z].piece !== '') {
            valid = false;
            break;
          }
        }
      }
    }
    //  knight - ??  3 horiz/vert squares, one perpendicular, can't be blocked
    if (type === 'N') {
      //  aw, hell no
      const diff = Math.abs((from[0]*8+from[1]) - (to[0]*8+to[1]));
      console.log('diff: ', diff);
      if (diff === 6 || diff === 10 || diff === 15 || diff === 17) {
        valid = true;
        //  knight can't be obstructed
      }
    }
    //  pawn: ahead one; or two if first move; one diag if take opposing piece
    if (type === 'P') {
      // this can probably be simplified
      if (color === 'b' &&
      (from[1] === to[1] &&
        (to[0] - from[0] === 1 && board[to[0]][to[1]].piece === '') ||
        (to[0] - from[0] === 2 && board[from[0]+1][to[1]].piece === '' && board[to[0]][to[1]].piece === '' && to[0] === 3)) ||
      (Math.abs(from [1] - to[1]) === 1 && to[0] - from[0] === 1 && board[to[0]][to[1]].piece !== '')) {
        valid = true;
      }
      if (color === 'w' &&
      (from[1] === to[1] &&
        (from[0] - to[0] === 1 && board[to[0]][to[1]].piece === '') ||
        (from[0] - to[0] === 2 && board[from[0]-1][from[1]].piece === '' && board[to[0]][to[1]].piece === '' && to[0] === 4)) ||
      (Math.abs(to[1] - from [1]) === 1 && from[0] - to[0] === 1 && board[to[0]][to[1]].piece !== '')) {
        valid = true;
      }
    }
    return valid;
  };

  const kingInCheck = (board, color) => {
    const kLoc = xLate(kingLocs[color]);
    //  danger from above or below?
    //  danger from L / R?
    //  diagonal danger?
    //  danger from horsies?
    return false;
  }

  console.log(board);
  let squareNum = 0;
  return (
    <>
    <h1>Move: {turn}</h1>
    <div style={{width: '80vw', display: 'flex', flexWrap: 'wrap', border: '1px solid black',}}>
      {board.map(r => {
        return(r.map(s => {
          return <Square
                  key={s.id}
                  data={s}
                  images={images}
                  squareNum={++squareNum}
                  onSquareClicked={onSquareClicked}
                  />
        }))
      })}
    </div>
    </>
  )
};

export default Board;