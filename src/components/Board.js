import React, { useState, useEffect } from "react";
import Square from "./Square";
import { startup } from "../../data/startup";
//  this retrieves where in /dist the images now reside
const images = require("../images/pieces/*.png");

const alph = ["a", "b", "c", "d", "e", "f", "g", "h"];
const Board = () => {
  const [board, setBoard] = useState([]);
  const [kingLocs, setKingLocs] = useState({ w: "1e", b: "8e" });
  const [turn, setTurn] = useState("White");
  const [move, setMove] = useState([]);

  useEffect(() => {
    const board = new Array(8)
      .fill(new Array(8).fill("element"))
      .map((a, i) => {
        return a.map((s, j) => {
          const id = `${8 - i}${alph[j]}`;
          return { id: id, piece: startup[id] || "" };
        });
      });
    setBoard(board);
  }, []);

  const onSquareClicked = (squareId, piece) => {
    //  alerts should be replaced by alarm messages
    //  this seems verbose
    if (move.length === 0 && piece !== "") {
      if (turn === "White") {
        if (piece.charAt(0) !== "w") {
          alert("Invalid piece selected.");
          piece = "";
        }
      } else {
        if (piece.charAt(0) !== "b") {
          alert("Invalid piece selected.");
          piece = "";
        }
      }
    }
    //  first element has to contain a piece; otherwise ignore move
    //  later, may also want to ignore clicking on a piece that cannot move
    if (move.length > 0 || piece !== "") {
      let boardT = JSON.parse(JSON.stringify(board));
      let moveT = [...move];
      moveT.push({ squareId, piece });
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
        //  piece has already been moved
        if (
          !movedOntoOwnPiece(from, to, color) &&
          moveValidForPiece(boardT, from, to, color, type)
        ) {
          //  so far so good
          //  did we take a piece?
          //  move our piece

          // alert(
          //   "is square the same object????" +
          //     (boardT[to[0]][to[1]] === board[to[0]][to[1]])
          // );
          //  move NOT reflected in board above
          //  how can this possibly be making the move in BOTH board and boardT????????????
          boardT[to[0]][to[1]].piece = boardT[from[0]][from[1]].piece;
          boardT[from[0]][from[1]].piece = "";
          //alert("Just updated boardT" + JSON.stringify(board));
          //  alert shows board has been updated as well!!!!!
          if (!kingInCheck(boardT, color)) {
            //  finalize move

            setBoard(boardT);
            //  set king's location
            if (type === "K") {
              const kingLocsT = kingLocs;
              kingLocsT[color] = moveT[1].squareId; // 'to' location
              setKingLocs(kingLocsT);
            }
            setTurn(turn === "White" ? "Black" : "White");
            const oColor = color === "w" ? "b" : "w";
            if (kingInCheck(boardT, oColor)) {
              alert(`${oColor} king in check!`); //  what about checkmate?
            }
          } else {
            alert("Invalid move - king in check!" + JSON.stringify(board));
            //  move ALREADY reflected in board when this alert happens
            //  seems to be moving piece anyway
          }
        } else {
          alert("Invalid move");
        }
        //  when moveT.length = 2, we ALWAYS clear it.  Time for next move
        moveT = [];
      }
      setMove([...moveT]);
    }
  };

  const xLate = squareId => {
    //  translate click position to matrix point
    const row = 8 - parseInt(squareId.charAt(0));
    const col = alph.indexOf(squareId.charAt(1));
    return [row, col];
  };

  const xLateBack = index => {
    //  translate click position to matrix point
    const col = alph[index[1]];
    const row = 8 - index[0];
    return row + col;
  };

  function spaceNoToIndex(spaceNo) {
    const row = Math.floor(spaceNo / 8);
    const col = spaceNo % 8;
    return [row, col];
  }

  function indexToSpaceNo(index) {
    return index[0] * 8 + index[1];
  }

  const movedOntoOwnPiece = (from, to, color) => {
    console.log("to ", to, "board to ", board[to[0]][to[1]]);
    return board[to[0]][to[1]].piece.charAt(0) === color ? true : false;
  };

  const moveValidForPiece = (boardT, from, to, color, type) => {
    let valid = false;
    //  also need to check if move is blocked
    //  should we use a switch?
    //  note: king can put HIMSELF in check from other king
    if (type === "K") {
      if (
        (Math.abs(to[0] - from[0]) === 1 && from[1] === to[1]) ||
        (Math.abs(to[1] - from[1]) === 1 && from[0] === to[0]) ||
        (Math.abs(to[0] - from[0]) === 1 && Math.abs(to[0] - from[0]) === 1)
      ) {
        valid = true;
        //  no obstruction possible
      }
    }
    //  check for horizontal or vertical move
    if (type === "Q" || type === "R") {
      //  if same row
      //valid = travelHoriz(from, to) === "ok" ? true : false;
      //  else if same column
      valid = travel(boardT, from, to, "h") === "ok" ? true : false;

      if (!valid) {
        //valid = travelVert(from, to) === "ok" ? true : false;
        valid = travel(boardT, from, to, "v") === "ok" ? true : false;
      }
    }
    //  +- multiple of seven or nine = diagonal move
    if (!valid && (type === "Q" || type === "B")) {
      valid = travel(boardT, from, to, "d") === "ok" ? true : false;
    }
    //  knight - ??  3 horiz/vert squares, one perpendicular, can't be blocked
    if (type === "N") {
      valid = travel(boardT, from, to, "n") === "ok" ? true : false;
    }
    //  pawn: ahead one; or two if first move; one diag if take opposing piece
    if (type === "P") {
      // this can probably be simplified
      if (
        (color === "b" &&
          ((from[1] === to[1] &&
            to[0] - from[0] === 1 &&
            boardT[to[0]][to[1]].piece === "") ||
            (to[0] - from[0] === 2 &&
              boardT[from[0] + 1][to[1]].piece === "" &&
              boardT[to[0]][to[1]].piece === "" &&
              to[0] === 3))) ||
        (Math.abs(from[1] - to[1]) === 1 &&
          to[0] - from[0] === 1 &&
          boardT[to[0]][to[1]].piece !== "")
      ) {
        valid = true;
      }
      if (
        (color === "w" &&
          ((from[1] === to[1] &&
            from[0] - to[0] === 1 &&
            boardT[to[0]][to[1]].piece === "") ||
            (from[0] - to[0] === 2 &&
              boardT[from[0] - 1][from[1]].piece === "" &&
              boardT[to[0]][to[1]].piece === "" &&
              to[0] === 4))) ||
        (Math.abs(to[1] - from[1]) === 1 &&
          from[0] - to[0] === 1 &&
          boardT[to[0]][to[1]].piece !== "")
      ) {
        valid = true;
      }
    }
    return valid;
  };

  function travel(boardT, from, to, direction, check) {
    //  can't be off board
    if (
      from[0] < 0 ||
      from[0] > 7 ||
      from[1] < 0 ||
      from[1] > 7 ||
      to[0] < 0 ||
      to[0] > 7 ||
      to[1] < 0 ||
      to[1] > 7
    ) {
      return "notValid";
    }
    if (direction === "h" && from[0] !== to[0]) {
      //  must be on same row to be horizontal
      return "notValid";
    }
    if (check && JSON.stringify(from) === JSON.stringify(to)) {
      return "ok";
    }
    //  do knights differently: diff between from & to is either 1 & 2 or 2 and 1
    if (direction === "n") {
      let first = Math.abs(from[0] - to[0]);
      let second = Math.abs(from[1] - to[1]);
      if ((first === 1 && second === 2) || (first === 2 && second === 1)) {
        if (check) {
          return boardT[to[0]][to[1]].piece || "ok";
        } else {
          return "ok";
        }
      } else {
        return "notValid";
      }
    }
    let spaces = []; //  spaces in move length
    switch (direction) {
      case "h":
        spaces = [1];
        break;
      case "v":
        spaces = [8];
        break;
      case "d":
        spaces = [7, 9];
        break;
      case "n":
        spaces = [6, 10, 15, 17];
        break;
    }
    //  spaces between from and to
    const diff = Math.abs(from[0] * 8 + from[1] - (to[0] * 8 + to[1]));
    //  if knight:
    //    1. diff must be one of the items in 'spaces'
    //    2. from, to MUST have different column AND row
    //    3. obstructions not possible
    if (
      direction === "n" &&
      spaces.includes(diff) &&
      from[0] !== to[0] &&
      from[1] !== to[1]
    ) {
      return "ok";
    }
    //  check if diff is a multiple of spaces
    //  is this archaic?
    let div = 0;
    for (let x = 0; x < spaces.length; x++) {
      if (diff % spaces[x] === 0) {
        div = spaces[x];
        break;
      }
    }
    if (div === 0) {
      return "notValid";
    }
    console.log(from, to, "diff", diff, "direction: ", direction);

    //  obstructed?
    //  for the sake of 'check,' we need to travel FROM from and TO to.
    //  we need to know if 'to' is ultimately less or greater than 'from'
    const fromVal = indexToSpaceNo(from);
    const toVal = indexToSpaceNo(to);
    const incDec = fromVal < toVal ? div : -div;
    let x = fromVal + incDec;

    while (x !== toVal) {
      const currIndex = spaceNoToIndex(x);
      //console.log("currIndex: ", currIndex);
      if (boardT[currIndex[0]][currIndex[1]].piece !== "") {
        return boardT[currIndex[0]][currIndex[1]].piece;
      }
      x += incDec;
    }
    if (check) {
      return boardT[to[0]][to[1]].piece || "ok";
    } else {
      return "ok";
    }
  }

  //  kingInCheck
  //  check for:
  //  1. horiz threats (L&R)
  //  2. vertical threats (top and bottom)
  //  3. diagonal threats (4 directions)
  const kingInCheck = (boardT, color) => {
    //  under construction
    //return false;
    const kLoc = xLate(kingLocs[color]);
    //  horiz left
    if (isThreat(travel(boardT, kLoc, [kLoc[0], 0], "h", true), color, "h")) {
      return true;
    }
    //  horiz right
    if (isThreat(travel(boardT, kLoc, [kLoc[0], 7], "h", true), color, "h")) {
      return true;
    }
    //  vert up
    if (isThreat(travel(boardT, kLoc, [0, kLoc[1]], "v", true), color, "v")) {
      return true;
    }
    //  vert down
    if (isThreat(travel(boardT, kLoc, [7, kLoc[1]], "v", true), color, "v")) {
      return true;
    }
    //  diag northwest
    //  calc endpos from kLoc: stop at whichever axis turns zero first
    let endPos = calcEndPos(kLoc, -1, -1);
    //console.log("endPos: ", endPos);
    if (isThreat(travel(boardT, kLoc, endPos, "d", true), color, "d")) {
      return true;
    }
    //  diag northeast
    //  calc endpos from kLoc: stop at whichever axis turns 0/7 first
    endPos = calcEndPos(kLoc, -1, 1);
    //console.log("endPos: ", endPos);
    if (isThreat(travel(boardT, kLoc, endPos, "d", true), color, "d")) {
      return true;
    }
    //  diag southwest
    //  calc endpos from kLoc: stop at whichever axis turns 7/0 first
    endPos = calcEndPos(kLoc, 1, 1);
    //console.log("endPos: ", endPos);
    if (isThreat(travel(boardT, kLoc, endPos, "d", true), color, "d")) {
      return true;
    }
    //  diag southeast
    //  calc endpos from kLoc: stop at whichever axis turns 7/7 first
    endPos = calcEndPos(kLoc, 1, -1);
    //console.log("endPos: ", endPos);
    if (isThreat(travel(boardT, kLoc, endPos, "d", true), color, "d")) {
      return true;
    }
    //  test knight
    //  check each place a horsey could be
    // up 2 left one
    endPos = [kLoc[0] - 2, kLoc[1] - 1];
    if (isThreat(travel(boardT, kLoc, endPos, "n", true), color, "n")) {
      return true;
    }
    // up 2 right one
    endPos = [kLoc[0] - 2, kLoc[1] + 1];
    if (isThreat(travel(boardT, kLoc, endPos, "n", true), color, "n")) {
      return true;
    }
    //  right 2 up one
    endPos = [kLoc[0] - 1, kLoc[1] + 2];
    if (isThreat(travel(boardT, kLoc, endPos, "n", true), color, "n")) {
      return true;
    }
    //  right 2 down one
    endPos = [kLoc[0] + 1, kLoc[1] + 2];
    if (isThreat(travel(boardT, kLoc, endPos, "n", true), color, "n")) {
      return true;
    }
    //  down two left one
    endPos = [kLoc[0] + 2, kLoc[1] - 1];
    if (isThreat(travel(boardT, kLoc, endPos, "n", true), color, "n")) {
      return true;
    }
    //   down two right one
    endPos = [kLoc[0] + 2, kLoc[1] + 1];
    if (isThreat(travel(boardT, kLoc, endPos, "n", true), color, "n")) {
      return true;
    }
    //  left two up one
    endPos = [kLoc[0] - 1, kLoc[1] - 2];
    if (isThreat(travel(boardT, kLoc, endPos, "n", true), color, "n")) {
      return true;
    }
    //  left two down one
    endPos = [kLoc[0] + 1, kLoc[1] - 2];
    if (isThreat(travel(boardT, kLoc, endPos, "n", true), color, "n")) {
      return true;
    }

    return false;
  };

  const isThreat = (travelResult, color, direction) => {
    //console.log("travelResult: ", travelResult, "color: ", color);
    if (
      travelResult &&
      travelResult !== "ok" &&
      travelResult !== "notValid" &&
      travelResult.charAt(0) !== color
    ) {
      if (
        ((direction === "h" || direction === "v") &&
          (travelResult.charAt(1) === "Q" || travelResult.charAt(1) === "R")) ||
        (direction === "v" &&
          (travelResult.charAt(1) === "Q" || travelResult.charAt(1) === "B")) ||
        (direction === "n" && travelResult.charAt(1) === "N") ||
        (travelResult.charAt(1) === "K" && "what?")
      ) {
        return true;
      }
    }
    return false;
  };

  const calcEndPos = (kLoc, rowX, colX) => {
    let endPos = [...kLoc];
    // if first iteration would go beyond board, exit
    if (
      (endPos[0] === 0 && rowX === -1) ||
      (endPos[0] === 7 && rowX === 1) ||
      (endPos[1] === 0 && colX === -1) ||
      (endPos[1] === 7 && colX === 1)
    ) {
      return endPos;
    }
    do {
      endPos[0] += rowX;
      endPos[1] += colX;
    } while (endPos[0] > 0 && endPos[0] < 7 && endPos[1] > 0 && endPos[1] < 7);
    return endPos;
  };

  console.log(board);
  let squareNum = 0;
  return (
    <>
      <h1>Move: {turn}</h1>
      <div
        style={{
          width: "80vw",
          display: "flex",
          flexWrap: "wrap",
          border: "1px solid black"
        }}
      >
        {board.map(r => {
          return r.map(s => {
            return (
              <Square
                key={s.id}
                data={s}
                images={images}
                squareNum={++squareNum}
                onSquareClicked={onSquareClicked}
              />
            );
          });
        })}
      </div>
    </>
  );
};

export default Board;
