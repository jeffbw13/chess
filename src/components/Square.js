import React from "react";

const Square = ({ data, images, squareNum, onSquareClicked }) => {
  const modRow = Math.floor((squareNum / 8 - 0.1) % 2);
  const modSquare = squareNum % 2;

  return (
    <>
      <div
        style={{
          width: "10vw",
          height: "10vw",
          border: "1px solid black",
          boxSizing: "border-box",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: modRow !== modSquare ? "black" : "white",
          backgroundColor: modRow !== modSquare ? "#D2AD91" : "#6A4945"
        }}
        id={data.id}
        onClick={() => onSquareClicked(data.id, data.piece)}
      >
        {data.piece && (
          <img style={{ margin: "auto" }} src={images[data.piece]} />
        )}
        <div style={{ position: "absolute", right: "5px", bottom: "5px" }}>
          {data.id}
        </div>
      </div>
    </>
  );
};

export default Square;

//    <div style={{ position: 'fixed', right: '5px', bottom: '5px'}}>
