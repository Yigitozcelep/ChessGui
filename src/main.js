
function isNumeric(value) {
  return /^-?\d+$/.test(value);
}

const BOARD_DIV = document.getElementById("board_div")

const create_item = (square, type) => {
  let rank = Math.floor(square / 8);
  let file = square % 8;
  let piece;
  if      (type == "k") piece = "black_king"
  else if (type == "q") piece = "black_queen"
  else if (type == "n") piece = "black_knight"
  else if (type == "p") piece = "black_pawn"
  else if (type == "b") piece = "black_bishop"
  else if (type == "r") piece = "black_rook"
  else if (type == "K") piece = "white_king"
  else if (type == "Q") piece = "white_queen"
  else if (type == "N") piece = "white_knight"
  else if (type == "P") piece = "white_pawn"
  else if (type == "B") piece = "white_bishop"
  else if (type == "R") piece = "white_rook"

  let file_name = "./svgs/" + piece + ".svg"
  let img = document.createElement("img");
  img.src = file_name;
  img.style.position = "absolute"
  img.style.bottom = `${rank * 90 + 15}px`; 
  img.style.left   = `${file * 90 + 15}px`;
  console.log("***************************");
  console.log(piece);
  console.log(rank, img.style.bottom);
  console.log(file, img.style.left);
  BOARD_DIV.appendChild(img);
}

const BuildBoard = (fen)  => {
  let board = document.createElement("img");
  board.src = "./svgs/board.svg";
  board.style.width  = "100%";
  board.style.height = "100%";
  board.style.position = "absolute"
  BOARD_DIV.appendChild(board)
  
  let square = 56;
  for (let i = 0; i < fen.length; i++) {
    if (isNumeric(fen[i])) { square += parseInt(fen[i]); }
    else if (fen[i] == "/") square += -16;
    else {
      create_item(square, fen[i])
      square += 1;
    }
  }
}


BuildBoard("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");