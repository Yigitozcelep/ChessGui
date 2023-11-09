
const invoke = window.__TAURI__.invoke

const BOARD_CONTAINER = document.getElementById("board_container")
const BOARD_DIV = document.getElementById("board_div");
const FILES = ["a","b","c","d","e","f","g","h"]

let isFollowing = false;
let allImgs = [];
let currentImg;
let targetSquares = [];
let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const isNumeric = (value) => {
  return /^-?\d+$/.test(value);
}

const CreateItem = (square, type, color, moves) => {
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
  
  if (piece[0] === color) {img.classList.add("grabbable")}
  img.classList.add(FILES[file] + rank);
  img.style.width = "60px";
  img.style.height = "60px"
  img.style.left = file * 90 + 100 + 30 + "px";
  img.style.top  = (8 - rank) * 90  + 30 + "px";
  img.style.zIndex = "2";
  img.current_left = img.style.left;
  img.current_top  = img.style.top;
  img.current_moves = moves;
  img.addEventListener("click", (e) => {
    if (!img.classList.contains("grabbing")) return;
    
  })
  allImgs.push(img);
  BOARD_CONTAINER.appendChild(img);
}

const CreateBoardSvg = () => {
  let board = document.createElement("img");
  board.src = "./svgs/board.svg";
  board.style.width  = "100%";
  board.style.height = "100%";
  board.style.position = "absolute"
  BOARD_DIV.appendChild(board)
}

const findCurrentMoves = (moves, rank, file) => {
  let data = [];
  for (let i = 0; i < moves.length; i++)  {
    if (moves[i][0] == FILES[file] && moves[i][1]) {}
  }
}

const getSquare = (moveString) => {
  let file = moveString.charCodeAt(0) - "a".charCodeAt(0);
  let rank = moveString[1] - 1;
  return rank * 8 + file;
}

const getCurrentMoves = (square, moves) => {
  let data = [];
  for (let i = 0; i < moves.length; i++) {
    if (getSquare(moves[i]) == square) data.push(moves[i]);
  }
  return data;
}

const CreatePieces = (moves) => {
  let square = 56;
  let currentMoves = [];
  let color = fen.split(" ")[1];
  let boardString = fen.split(" ")[0];
  for (let i = 0; i < boardString.length; i++) {
    if (isNumeric(boardString[i])) { square += parseInt(boardString[i]); }
    else if (boardString[i] == "/") square += -16;
    else {
      let currentMoves = getCurrentMoves(square, moves);
      CreateItem(square, boardString[i], color, currentMoves);
      square += 1;
    }
  }
}

const GetMoves = async () => {
  return invoke("get_moves");
}

const BuildBoard = ()  => {
  CreateBoardSvg();
  GetMoves().then((moves) => {
    CreatePieces(moves);
  })
}

document.addEventListener("mousemove", (e) => {
  if (isFollowing) {
    currentImg.style.top = e.pageY - 30 + "px";
    currentImg.style.left = e.pageX - 30 + "px";
  }
})


const createTargetDiv = (move) => {
  let target = getSquare(move.slice(2, move.length));
  let targetDiv = document.createElement("div");
  targetDiv.move = move;
  targetDiv.classList.add("target_square");
  let rank = Math.floor(target / 8);
  let file = target % 8;
  targetDiv.style.left = file * 90 + 100 + 16 + "px";
  targetDiv.style.top = (8 - rank) * 90  + 16 + "px";
  targetSquares.push(targetDiv);
  BOARD_CONTAINER.appendChild(targetDiv);
}

const getTargetSquare = (e) => {
  for (let i = 0; i < targetSquares.length; i++) {
    let target = targetSquares[i];
    let left = target.style.left.slice(0, -2) - 0;
    let top  = target.style.top.slice(0, -2) - 0;
    if (left <= e.pageX && e.pageX <= left + 89 && top <= e.pageY && e.pageY <= top + 89) {
      return target;
    }
  }
}

const makeMove = (targetSquare) => {
  
}

const resetToInitialState = () => {
  for (let i = 0; i < targetSquares.length; i++) {
    BOARD_CONTAINER.removeChild(targetSquares[i]);
  }
  targetSquares = [];
  isFollowing = false;
  currentImg.style.left = currentImg.current_left;
  currentImg.style.top  = currentImg.current_top;
  currentImg.classList.remove("grabbing");
}

document.addEventListener("click", (e) => {
  if (isFollowing) {
    let targetSquare = getTargetSquare(e)
    if (targetSquare) makeMove(targetSquare)
    else resetToInitialState();
    return;
  }
  for (let i = 0; i < allImgs.length; i++) {
    let left = allImgs[i].style.left.slice(0, -2) - 0;
    let top  = allImgs[i].style.top.slice(0, -2) - 0;
    if (!allImgs[i].classList.contains("grabbable")) continue;
    if (left <= e.pageX && e.pageX <= left + 60 && top <= e.pageY && e.pageY <= top + 60) {
      currentImg = allImgs[i];
      allImgs[i].classList.add("grabbing");
      isFollowing = true;
      for (let j = 0; j < allImgs[i].current_moves.length; j++) {
        createTargetDiv(allImgs[i].current_moves[j]);
      }
    }
  }
})

document.addEventListener('dragstart', function(event) {
  event.preventDefault();
});

BuildBoard();