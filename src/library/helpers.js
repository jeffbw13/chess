const alph = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function xLateIdIndex(squareId) {
  //  translate click position to matrix point
  const row = 8 - parseInt(squareId.charAt(0));
  const col = alph.indexOf(squareId.charAt(1));
  return [row, col];
}

export function xLateIndexId(index) {
  //  translate click position to matrix point
  const col = alph[index[1]];
  const row = 8 - index[0];
  return row + col;
}

export function xLateSquareNoIndex(spaceNo) {
  const row = Math.floor(spaceNo / 8);
  const col = spaceNo % 8;
  return [row, col];
}

export function xLateIndexSquareNo(index) {
  return index[0] * 8 + index[1];
}

export function pieceAt(boardT, index, spaceNo) {
  // if index is null, calculate from squareno
  if (index === null) {
    index = xLateSquareNoIndex(spaceNo);
  }
  //  should there be a routine "index not valid"?  Cuz we do a lot of this
  if (index[0] < 0 || index[0] > 7 || index[1] < 0 || index[1] > 7) {
    return ""; // for now, return nothing
  }
  return boardT[index[0]][index[1]].piece;
}

export function offBoard(index) {
  if (index[0] < 0 || index[0] > 7 || index[1] < 0 || index[1] > 7) {
    return true;
  }
}
