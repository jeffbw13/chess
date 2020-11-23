import React from 'react';

const Square = ({data, images, squareNum, onSquareClicked}) => {

  return (
    <>
    <div style={{width: '10vw',
                height: '10vw',
                border: '1px solid black',
                boxSizing: 'border-box',}}
          id={data.id}
          onClick={()=>onSquareClicked(data.id, data.piece)}>
    {data.piece &&
      <img src={images[data.piece]}/>
    }
    {data.id}
    </div>
    </>
  )
};

export default Square;