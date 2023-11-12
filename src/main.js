const invoke = window.__TAURI__.invoke

const BOARD_CONTAINER = document.getElementById("board_container")
const FILES = ["a","b","c","d","e","f","g","h"]

let isFollowing = false;
let allImgs = [];
let currentImg;
let targetSquares = [];

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
  
  if (piece[0] === color && piece[0] !== window.chess_engine_color) {img.classList.add("grabbable")}
  img.classList.add(FILES[file] + rank);
  img.style.width = "60px";
  img.style.height = "60px"
  img.style.left = file * 90 + 100 + 30 + "px";
  img.style.top  = (8 - rank) * 90  + 30 + "px";
  img.style.zIndex = "3";
  if (piece[0] === window.chess_engine_color) img.style.transition = "all 0.5s ease";
  img.current_left = img.style.left;
  img.current_top  = img.style.top;
  img.current_moves = moves;
  img.addEventListener("click", (e) => {
    if (!img.classList.contains("grabbing")) return;
    
  })
  allImgs.push(img);
  BOARD_CONTAINER.appendChild(img);
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
  let color = window.fen.split(" ")[1];
  let boardString = window.fen.split(" ")[0];
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

const labeledKing = () => {
  invoke("get_king_coor", {fen: window.fen}).then((coor) => {
    let res = getSquare(coor);
    let rank = Math.floor(res / 8);
    let file = res % 8;
    let under_attacked = document.createElement("div");
    under_attacked.classList.add("king_under_attacked");
    under_attacked.style.left = file * 90 + 100 + 16 + "px";
    under_attacked.style.top = (8 - rank) * 90  + 16 + "px";
    under_attacked.style.zIndex = "1";
    BOARD_CONTAINER.appendChild(under_attacked);
  })
  
}

const BuildBoard = ()  => {
  allImgs = [];
  invoke("get_moves", {fen: window.fen}).then((moves) => {
    BOARD_CONTAINER.innerHTML = "";
    CreatePieces(moves);
    invoke("is_king_attacked", {fen: window.fen}).then((res) => {
      if (res) labeledKing()
    })
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
  targetDiv.style.zIndex = "2";
  targetSquares.push(targetDiv);
  BOARD_CONTAINER.appendChild(targetDiv);
}

const getMoveOfTargetSquare = (e) => {
  for (let i = 0; i < targetSquares.length; i++) {
    let target = targetSquares[i];
    let left = target.style.left.slice(0, -2) - 0;
    let top  = target.style.top.slice(0, -2) - 0;
    if (left <= e.pageX && e.pageX <= left + 89 && top <= e.pageY && e.pageY <= top + 89) {
      return target.move;
    }
  }
}

const makeEngineMove = () => {
  invoke("get_engine_move", {fen: window.fen}).then((res) => {
    let squareName = res.split(";")[0].slice(0,2);
    let current = getSquare(res.split(";")[0]);
    let target  = getSquare(res.split(";")[0].slice(2, 4));
    console.log(allImgs);
    for (let i = 0; i < allImgs.length; i++) {
      if (allImgs[i].current_moves.length == 0) continue;
      if (allImgs[i].current_moves[0].slice(0,2) == squareName) {
        let left = parseInt(allImgs[i].style.left.slice(0, -2));
        let top  = parseInt(allImgs[i].style.top.slice(0, -2));
        allImgs[i].addEventListener("transitionend", (e) => {
          window.fen = res.split(";")[2];
          BuildBoard();
        })
        allImgs[i].style.left = (left + ((target % 8) - (current % 8)) * 90) + "px";
        allImgs[i].style.top  = (top + (Math.floor(current / 8) - Math.floor(target / 8)) * 90) + "px";
      }
    }
  })
}

const makeMove = (move) => {
  invoke("make_move", {fen: window.fen, mov: move}).then((res) => {
    window.fen = res;
    BuildBoard();
    if (res.split(" ")[1] === window.chess_engine_color) {
      setTimeout(makeEngineMove, 150)
    };
  })
}

const resetToInitialState = (move) => {
  for (let i = 0; i < targetSquares.length; i++) {
    BOARD_CONTAINER.removeChild(targetSquares[i]);
  }
  targetSquares = [];
  isFollowing = false;
  if (!move) {
    currentImg.style.left = currentImg.current_left;
    currentImg.style.top  = currentImg.current_top;
    currentImg.classList.remove("grabbing");
  }
}

document.addEventListener("click", (e) => {
  if (isFollowing) {
    let move = getMoveOfTargetSquare(e)
    resetToInitialState(move);
    if (move) makeMove(move);
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

export {BuildBoard, makeEngineMove}