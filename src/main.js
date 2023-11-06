
function isNumeric(value) {
  return /^-?\d+$/.test(value);
}

const BOARD = document.getElementById("board_div")

const create_item = () => {
  
}

const BuildBoard = (fen)  => {
  let square = 56;
  for (let i = 0; i < fen.length; i++) {
    if (isNumeric(fen[i])) { square += parseInt(fen[i]); }
    else if (fen[i] == "/") square += -16;
    else {
      create_item()
    }
  }
}


BuildBoard("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");