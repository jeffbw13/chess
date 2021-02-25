import React, { useState, useEffect } from "react";
import Square from "./Square";
import * as d from "../data/data";
import * as h from "../library/helpers";
//  this retrieves where in /dist the images now reside
const images = require("../images/pieces/*.png");

const Board = () => {
  const [board, setBoard] = useState([]);
  const [kingLocs, setKingLocs] = useState({ w: "1e", b: "8e" });
  const [turn, setTurn] = useState("White");
  const [move, setMove] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const board = new Array(8)
      .fill(new Array(8).fill("element"))
      .map((a, i) => {
        return a.map((s, j) => {
          const id = `${8 - i}${d.alph[j]}`;
          return { id: id, piece: d.setup[id] || "" };
        });
      });
    setBoard(board);
  }, []);

  const onSquareClicked = (squareId, piece) => {
    setMessage("");
    //  this seems verbose
    if (move.length === 0 && piece !== "") {
      if (turn === "White") {
        if (piece.charAt(0) !== "w") {
          setMessage("Invalid piece selected.");
          piece = "";
        }
      } else {
        if (piece.charAt(0) !== "b") {
          setMessage("Invalid piece selected.");
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
      //  the real action happens here
      if (moveT.length === 2) {
        const from = h.xLateIdIndex(moveT[0].squareId);
        const to = h.xLateIdIndex(moveT[1].squareId);
        const color = moveT[0].piece.charAt(0);
        //  type should probably be enum
        const type = moveT[0].piece.charAt(1);
        console.log("fromtocolortype: ", from, to, color, type);
        //  1. is this a valid move for the piece?
        //  2. did we move onto our own piece?  *invalid*
        //  3. did we move into check? *invalid *
        if (
          !movedOntoOwnPiece(boardT, from, to, color) &&
          moveValidForPiece(boardT, from, to, color, type)
        ) {
          //  so far so good
          //  did we take a piece?  Should we do something with it?
          //  move our piece
          boardT[to[0]][to[1]].piece = boardT[from[0]][from[1]].piece;
          boardT[from[0]][from[1]].piece = "";
          let kLoc = null;
          if (h.pieceAt(boardT, to).charAt(1) === "K") {
            kLoc = to; // just moved it
          }
          if (!kingInCheck(boardT, color, kLoc)) {
            //  finalize move
            setBoard(boardT);
            //  set king's location for checking check
            if (type === "K") {
              const kingLocsT = kingLocs;
              kingLocsT[color] = moveT[1].squareId; // 'to' location
              setKingLocs(kingLocsT);
            }
            setTurn(turn === "White" ? "Black" : "White");
            const oColor = color === "w" ? "b" : "w";
            if (kingInCheck(boardT, oColor)) {
              setMessage(`${oColor} king in check!`); //  what about checkmate?
            }
          } else {
            setMessage("Invalid move - king in check or checkmate!");
          }
        } else {
          setMessage("Invalid move");
        }
        //  when moveT.length = 2, we ALWAYS clear it.  Time for next move
        moveT = [];
      }
      setMove([...moveT]);
    }
  };

  const movedOntoOwnPiece = (boardT, from, to, color) => {
    return h.pieceAt(boardT, to).charAt(0) === color ? true : false;
  };

  const moveValidForPiece = (boardT, from, to, color, type) => {
    let valid = false;
    const pt = d.pieceTravel.get(type);
    if (pt) {
      for (let x = 0; x < pt.length; x++) {
        if (travel(boardT, from, to, pt[x]) === "ok") {
          valid = true;
          break;
        }
      }
    }
    if (type === "P") {
      //  clean this mess up!
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
    //  calculated items might be off board
    if (h.offBoard(from) || h.offBoard(to)) {
      return "notValid";
    }
    //  must be on same row to be horizontal
    if (direction === "h" && from[0] !== to[0]) {
      return "notValid";
    }
    //  pointing to itself
    if (check && JSON.stringify(from) === JSON.stringify(to)) {
      return "ok";
    }
    //  different formula for knights:
    //  diff between from & to is either 1 & 2 or 2 and 1
    if (direction === "n") {
      let first = Math.abs(from[0] - to[0]);
      let second = Math.abs(from[1] - to[1]);
      if ((first === 1 && second === 2) || (first === 2 && second === 1)) {
        if (check) {
          return h.pieceAt(boardT, to) || "ok";
        } else {
          return "ok";
        }
      } else {
        return "notValid";
      }
    }

    let spaces = []; //  spaces in single move length
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
    }
    //  spaces between from and to
    //  how is this different from 'indexToSpaceNo'?
    const diff = Math.abs(from[0] * 8 + from[1] - (to[0] * 8 + to[1]));
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
    //  if 'from' piece is king, only ONE mult of allowed!
    if (!check && h.pieceAt(boardT, from).charAt(1) === "K" && div !== diff) {
      return "notValid";
    }
    //console.log(from, to, "diff", diff, "direction: ", direction);

    //  obstructed?
    //  for the sake of 'check,' we need to travel FROM from and TO to.
    //  we need to know if 'to' is ultimately less or greater than 'from'
    const fromVal = h.xLateIndexSquareNo(from);
    const toVal = h.xLateIndexSquareNo(to);

    const incDec = fromVal < toVal ? div : -div;
    let x = fromVal + incDec;

    while (x !== toVal) {
      const currIndex = h.xLateSquareNoIndex(x);
      //console.log("currIndex: ", currIndex);
      if (boardT[currIndex[0]][currIndex[1]].piece !== "") {
        //console.log(boardT[currIndex[0]][currIndex[1]].piece);
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
  //  4. knight move threats
  //  5. pawn threats
  const kingInCheck = (boardT, color, kLoc = null) => {
    //  gotta be a better way
    if (kLoc === null) {
      kLoc = h.xLateIdIndex(kingLocs[color]);
    }
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
    //  check from pawn?
    //  kLoc - 7 or - 9 if we are white
    //  kLoc + 7 or + 9 if we are black
    //  improvements - it would be good to have a function that would retrieve
    //    the piece from a square, that would
    //  oops!!  I was able to move black king into check with white pawn
    //  K: 5e, P:4f
    let posNeg = color === "w" ? -1 : 1;
    let kSpaceNo = h.xLateIndexSquareNo(kLoc);
    let piece = h.pieceAt(boardT, null, kSpaceNo + 7 * posNeg);
    if (piece !== "" && piece.charAt(0) !== color && piece.charAt(1) === "P") {
      return true;
    }
    piece = h.pieceAt(boardT, null, kSpaceNo + 9 * posNeg);
    if (piece !== "" && piece.charAt(0) !== color && piece.charAt(1) === "P") {
      return true;
    }
    //console.log("kLoc: ", kLoc, "piece", piece, "kSpaceNo: ", kSpaceNo, posNeg);
    //  pawns handled
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
      const pt = d.pieceTravel.get(travelResult.charAt(1));
      if (pt && pt.includes(direction)) {
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

  //console.log(board);
  let squareNum = 0;

  return (
    <>
      <div
        className="container"
        style={{ display: "flex", flexDirection: "row" }}
      >
        <div
          style={{
            width: "64vw",
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
        <header
          style={{
            width: "30vw",
            border: ".5px solid black",
            borderRadius: "5px",
            marginLeft: "15px",
            padding: "10px",
            boxSizing: "border-box"
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h1 style={{ marginTop: "3px" }}>Chess</h1>
          </div>

          <div>
            <h2 style={{ marginTop: "0px" }}>Move: {turn}</h2>
          </div>
          <hr />
          <div className="message">{message}</div>
        </header>
      </div>
    </>
  );
};

export default Board;
