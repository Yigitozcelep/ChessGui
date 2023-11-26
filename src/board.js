'use strict';

const invoke = window.__TAURI__.invoke

const BOARD = document.getElementById("board")
const FILES = ["a","b","c","d","e","f","g","h"]

const PIECE_WIDTH   = 6;
const PIECE_HEIGHT  = 6;
const BOARD_LEFT    = 10;
const BOARD_TOP     = 7;
const SQUARE_WIDTH  = 9;
const SQUARE_HEIGHT = 9;

const MoveAffectSpeed = 250;
const UpdateTimeInterval = 200;
const MilliSecond = 3600;

const PlayersTypes = {
  EngineVsEngine     : "Engine Vs Engine",
  PlayerVsPlayer     : "Player Vs Player",
  PlayerWhiteVsEngine: "PlayerWhite Vs Engine",
  PlayerBlackVsEngine: "PlayerBlack Vs Engine",
}

const ColorMapping = {
  "w": "white",
  "b": "black",
}

const letterToPiece = {
  "k": "black_king",
  "q": "black_queen",
  "n": "black_knight",
  "p": "black_pawn",
  "b": "black_bishop",
  "r": "black_rook",
  "K": "white_king",
  "Q": "white_queen",
  "N": "white_knight",
  "P": "white_pawn",
  "B": "white_bishop",
  "R": "white_rook",
}


const BoardState = {
    "_fen": "",
    "_playersType": PlayersTypes.PlayerVsPlayer,
    "_oldFens": [],
    "_white_time": 0,
    "_white_time_plus": 0,
    "_black_time": 0,
    "_black_time_plus": 0,
    "_oldTimes": [0, 0],
    createBoard(fen, playersType, white_time, black_time) {
      document.getElementById("board_container").style.visibility = "visible";
      document.getElementById("menu_container").style.visibility  = "hidden";
      BOARD.innerHTML = "";
      this._fen = fen;
      this._playersType = playersType;
      this._oldFens = [fen];
      this._oldTimes = [white_time, black_time];
      this._white_time = white_time;
      this._black_time = black_time;
      this.makeVisibleTimeSvgs();
      buildBoard();
    },
    
    getColor() {return ColorMapping[this._fen.split(" ")[1]]},
    getOtherColor() {return this.getColor() == "white" ? "black" :"white"},
    getBoardOfFen() {return this._fen.split(" ")[0]},
    async getMoves() {return await invoke("get_moves", {fen: this._fen})},
    async isKingAttacked() {return await invoke("is_king_attacked", {fen: this._fen})},
    async getEngineMove() {return await invoke("get_engine_move", {fen: this._fen})},
    async makeMoveAndRebuild(move) {
      BoardState._fen = await invoke("make_move", {fen: this._fen, mov: move})
      buildBoard();
    },
    makeVisibleTimeSvgs() {
      document.getElementById("board_white_time_div").style.visibility = "visible";
      document.getElementById("board_white_time_div").innerHTML = this._white_time;
      
      document.getElementById("board_black_time_div").style.visibility = "visible";
      document.getElementById("board_black_time_div").innerHTML = this._black_time;
      
      if (this._playersType === PlayersTypes.EngineVsEngine){
        document.getElementById("white_robot_time_svg").style.visibility = "visible"; 
        document.getElementById("black_robot_time_svg").style.visibility = "visible";
      }
      if (this._playersType === PlayersTypes.PlayerWhiteVsEngine) {
        document.getElementById("white_player_time_svg").style.visibility = "visible";
        document.getElementById("black_robot_time_svg").style.visibility  = "visible";
      }
      if (this._playersType === PlayersTypes.PlayerBlackVsEngine) {
        document.getElementById("white_robot_time_svg").style.visibility  = "visible";
        document.getElementById("black_player_time_svg").style.visibility = "visible";
      }
      if (this._playersType === PlayersTypes.PlayerVsPlayer) {
        document.getElementById("white_player_time_svg").style.visibility = "visible";
        document.getElementById("black_player_time_svg").style.visibility = "visible";
      }
    },

    isEngineTurn(){
      if (this._playersType === PlayersTypes.EngineVsEngine) return true;
      if (this._playersType === PlayersTypes.PlayerWhiteVsEngine && this.getColor() === "black") return true;
      if (this._playersType === PlayersTypes.PlayerBlackVsEngine && this.getColor() === "white") return true;
      return false;
    },
}

const formatTimePart = (oldColor) => {
  if (oldColor != BoardState.getColor()) return;
  let timeDiv = document.getElementById("board_" + BoardState.getColor() + "_time_div");
  let time = parseFloat(timeDiv.innerHTML) * MilliSecond - UpdateTimeInterval;
  timeDiv.innerHTML = time;
  setTimeout(formatTimePart, updatedTime);
}

const getFile = (square) => square % 8
const getRank = (square) => Math.floor(square / 8)

const isNumeric = (value) => /^-?\d+$/.test(value)

const getSquare = (moveString) => {
  let file = moveString.charCodeAt(0) - "a".charCodeAt(0);
  let rank = moveString[1] - 1;
  return rank * 8 + file;
}

const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1)

const getCurrentMoves = (square, moves) => moves.filter(move => getSquare(move) == square)

const labelTheResult = (result) => {
  let div = document.createElement("div");
  div.innerHTML = capitalize(result);
  div.classList.add("winner_label")
  BOARD.appendChild(div);
}

const getReverseRank  = (square) => 7 - getRank(square)
const getLeftOfSquare = (square) => getFile(square) * SQUARE_WIDTH  + BOARD_LEFT
const getTopOfSquare  = (square) => getReverseRank(square) * SQUARE_HEIGHT + BOARD_TOP

const getLeftOfPiece  = (square) => getLeftOfSquare(square) + (SQUARE_WIDTH  - PIECE_WIDTH)  / 2 // centralize the piece
const getTopOfPiece   = (square) => getTopOfSquare(square)  + (SQUARE_HEIGHT - PIECE_HEIGHT) / 2 // centralize the piece

const isGrabbable = (pieceColor) => !BoardState.isEngineTurn() & BoardState.getColor() == pieceColor

const createPieces = (moves) => {
  let square = 56;
  let boardString = BoardState.getBoardOfFen();

  for (let i = 0; i < boardString.length; i++) {
    if (isNumeric(boardString[i])) { square += parseInt(boardString[i]); }
    else if (boardString[i] == "/") square += -16;
    else {
      let currentMoves = getCurrentMoves(square, moves);
      createItem(square, letterToPiece[boardString[i]], currentMoves);
      square += 1;
    }
  }
}

const createItem = (square, piece, moves) => {
  let rank = Math.floor(square / 8);
  let file = square % 8;
  let fileName = "./svgs/" + piece + ".svg"
  let img = document.createElement("img");
  let pieceColor = ColorMapping[piece[0]];
  img.src = fileName;
  img.classList.add("piece");
  img.id = (FILES[file] + (rank + 1));

  img.style.left = getLeftOfPiece(square) + "vw"; 
  img.style.top  = getTopOfPiece(square)  + "vw"; 

  if (isGrabbable(pieceColor)) img.classList.add("grabbable")

  img.pieceName     = piece;
  img.currentSquare = square;
  img.currentLeft   = img.style.left;
  img.currentTop    = img.style.top;
  img.currentMoves  = moves

  BOARD.appendChild(img);
}

const labelKing = () => {
  let king = Array.from(BOARD.childNodes).find((piece => piece.pieceName == (BoardState.getColor() + "_" + "king")));
  let labelDiv = document.createElement("div");
  labelDiv.style.left = getLeftOfSquare(king.currentSquare) + "vw";
  labelDiv.style.top  = getTopOfSquare(king.currentSquare) + "vw";
  labelDiv.id = "label_king_square";
  BOARD.appendChild(labelDiv);
}

const isGameFnished = (kingAttacked, moves) => kingAttacked && moves.length == 0

const makeEngineMove = async () => {
  let engineMove = await BoardState.getEngineMove();
  let [move, score, fen] = engineMove.split(";");
  let currentPiece = document.getElementById(move.slice(0, 2));
  movePieceAndRebuildBoard(currentPiece, move);
}

const buildBoard = async () => {
  if (document.getElementById("board_container").style.visibility === "hidden") return;
  let moves = await BoardState.getMoves();
  let kingAttacked = await BoardState.isKingAttacked();
  
  BOARD.innerHTML = "";
  createPieces(moves);
  if (kingAttacked) labelKing();
  if (moves.length == 0) {
    if (kingAttacked) labelTheResult(BoardState.getOtherColor() + " Win")
    else labelTheResult("Draw")
  }
  
  if (BoardState.isEngineTurn() && !isGameFnished(kingAttacked, moves)) makeEngineMove();
}

const pxToVw = (px) => (px / window.innerWidth) * 100

const findGrabbingPiece = (pieces) => Array.from(pieces).find((piece) => piece.classList.contains("grabbing"));
const findClickedPiece = (pieces, e) => {
  return Array.from(pieces).find(piece => {
    let left = piece.currentLeft.slice(0, -2) - 0; // removing vw from end
    let top  = piece.currentTop.slice(0, -2) - 0;  // same
    let pageX = pxToVw(e.pageX);
    let pageY = pxToVw(e.pageY);
    return piece.classList.contains("grabbable") && 
           left <= pageX && pageX <= left + PIECE_WIDTH && 
           top  <= pageY && pageY <= top  + PIECE_HEIGHT;
  })
}

const createTargetDivs = (piece) => {
  piece.currentMoves.forEach((move) => {
    let targetSquare = getSquare(move.slice(2, move.length));
    let targetDiv = document.createElement("div");
    targetDiv.classList.add("target_square");
    targetDiv.style.left = getLeftOfSquare(targetSquare) + "vw";
    targetDiv.style.top  = getTopOfSquare(targetSquare)  + "vw";
    targetDiv.currentMove = move;
    targetDiv.currentSquare = getSquare(move.slice(2, targetDiv.currentMove.length));

    BOARD.appendChild(targetDiv);
  })
}

const getTargetDivs = () => Array.from(BOARD.childNodes).filter(el => el.classList.contains("target_square"))

const getClickedDiv = (e) => {
  return getTargetDivs().find(square => {
    let left = square.style.left.slice(0, -2) - 0; // remove vw
    let top  = square.style.top.slice(0, -2) - 0;   // remove vw
    let pageX = pxToVw(e.pageX);
    let pageY = pxToVw(e.pageY);
    return left <= pageX && pageX <= left + SQUARE_WIDTH && top <= pageY && pageY <= top + SQUARE_HEIGHT;
  })
}

const removeGrabbableFromAllPieces = () => Array.from(BOARD.childNodes).forEach((piece) => piece.classList.remove("grabbable"))

const isMoveCastle = (grabbingPiece, targetSquare) => grabbingPiece.pieceName.includes("king") && Math.abs(getFile(grabbingPiece.currentSquare) - getFile(targetSquare)) >= 2
const findCastlingRook = (rookSquare) => Array.from(BOARD.childNodes).find(piece => piece.currentSquare === rookSquare)
const findCastlingRookSquares = (currentMove) => {
  if (currentMove == "e1g1") return [getSquare("h1"), getSquare("f1")];
  if (currentMove == "e1c1") return [getSquare("a1"), getSquare("d1")];
  if (currentMove == "e8g8") return [getSquare("h8"), getSquare("f8")];
  if (currentMove == "e8c8") return [getSquare("a8"), getSquare("d8")];
}

const slowlyMoveAffect = (piece, targetSquare) => {
    piece.style.transition = "all " + MoveAffectSpeed / 1000 + "s ease";
    piece.style.left = getLeftOfPiece(targetSquare) + "vw";
    piece.style.top  = getTopOfPiece(targetSquare) + "vw";
}

const slowlyMoveRook = (grabbingPiece, targetDiv) => {
  let [rookSquare, rookTargetSquare] = findCastlingRookSquares(targetDiv);
  let rook = findCastlingRook(rookSquare);
  slowlyMoveAffect(rook, rookTargetSquare);
}

const movePieceAndRebuildBoard = (grabbingPiece, currentMove) => {
  deleteTargetDivs();
  deleteKingLabel();
  removeGrabbableFromAllPieces();
  let targetSquare = getSquare(currentMove.slice(2, currentMove.length));
  slowlyMoveAffect(grabbingPiece, targetSquare);
  if (isMoveCastle(grabbingPiece, targetSquare)) slowlyMoveRook(grabbingPiece, currentMove)
  setTimeout(() => BoardState.makeMoveAndRebuild(currentMove), MoveAffectSpeed);
}

const resetPiece = (piece) => {
  piece.style.left = piece.currentLeft; 
  piece.style.top = piece.currentTop;
  deleteTargetDivs();
}

const setPieceCenterOfTheMouse = (piece, e) => {
  let pageX = pxToVw(e.pageX);
  let pageY = pxToVw(e.pageY);
  piece.style.left = pageX - PIECE_WIDTH  / 2 + "vw" // for centralize the piece
  piece.style.top  = pageY - PIECE_HEIGHT / 2 + "vw" // for centralize the piece
}

const deleteTargetDivs = () => getTargetDivs().forEach(square => BOARD.removeChild(square));
const deleteKingLabel  = () => {
  let label = document.getElementById("label_king_square");
  if (label) BOARD.removeChild(document.getElementById("label_king_square"));
}
const handleMakeMoveAction = (grabbingPiece, e) => {
  grabbingPiece.classList.remove("grabbing");
  grabbingPiece.classList.add("grabbable");
  let targetDiv = getClickedDiv(e);
  if (targetDiv) movePieceAndRebuildBoard(grabbingPiece, targetDiv.currentMove);
  else resetPiece(grabbingPiece);
}

const handlePickPieceAction = (pieces, e) => {
  let clickedPiece = findClickedPiece(pieces, e);
  if (!clickedPiece) return;
  createTargetDivs(clickedPiece);
  clickedPiece.classList.remove("grabbable");
  clickedPiece.classList.add("grabbing");
  setPieceCenterOfTheMouse(clickedPiece, e);
}


document.addEventListener("click", (e) => {
  let pieces = BOARD.childNodes;
  let grabbingPiece = findGrabbingPiece(pieces);
  if (grabbingPiece) handleMakeMoveAction(grabbingPiece, e);
  else handlePickPieceAction(pieces, e)
})

document.addEventListener('dragstart', (event) => event.preventDefault());

document.addEventListener("mousemove", (e) => {
  let grabbingPiece = findGrabbingPiece(BOARD.childNodes);
  if (grabbingPiece) setPieceCenterOfTheMouse(grabbingPiece, e); 
})

export {BoardState, PlayersTypes};