'use strict';

const invoke = window.__TAURI__.invoke

const BOARD = document.getElementById("board")
const FILES = ["a","b","c","d","e","f","g","h"]

const PIECE_WIDTH   = 60;
const PIECE_HEIGHT  = 60;
const BOARD_LEFT    = 116;
const BOARD_TOP     = 106;
const SQUARE_WIDTH  = 90;
const SQUARE_HEIGHT = 90;
const SCREEN_WIDTH  = 950;
const SCREEN_HEIGHT = 950;

const MoveAffectSpeed = "0.3";

const PlayersTypes = {
  EngineVsEngine     : "Engine Vs Engine",
  PlayerVsPlayer     : "Player Vs Player",
  PlayerWhiteVsEngine: "PlayerWhite Vs Engine",
  PlayerBlackVsEngine: "PlayerBlack Vs Engine",
  PlayerVsEngine     : "Player Vs Engine",
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
    "fen": "",
    "engineMoveSpeed": 0,
    "playersType": PlayersTypes.PlayerVsPlayer,
    "oldFens": [],

    createBoard(fen, engineMoveSpeed, playersType) {
      document.getElementById("board_container").style.visibility = "visible";
      document.getElementById("menu_container").style.visibility  = "hidden";
      BOARD.innerHTML = "";
      this.fen = fen;
      this.engineMoveSpeed = engineMoveSpeed;
      this.playersType = playersType;
      this.oldFens = [fen];
      buildBoard();
    },

    getColor() {return ColorMapping[this.fen.split(" ")[1]]},
    getOtherColor() {return this.getColor() == "white" ? "black" :"white"},
    getBoardOfFen() {return this.fen.split(" ")[0]},
    async getMoves() {return await invoke("get_moves", {fen: this.fen})},
    async isKingAttacked() {return await invoke("is_king_attacked", {fen: this.fen})},
    async makeMoveAndRebuild(move) {
      BoardState.fen = await invoke("make_move", {fen: this.fen, mov: move})
      buildBoard();
    }
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

const isGrabbable = (pieceColor) => {
  if (BoardState.getColor() != pieceColor) return false;
  if (BoardState.playersType === PlayersTypes.PlayerVsPlayer) return true;
  return (pieceColor === "white" && BoardState.playersType == PlayersTypes.PlayerWhiteVsEngine) || (pieceColor == "black" && BoardState.playersType == PlayersTypes.PlayerBlackVsEngine)
}

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


const isEngineTurn = () => {
  if (BoardState.playersType === PlayersTypes.EngineVsEngine) return true;
  if (BoardState.playersType === PlayersTypes.PlayerWhiteVsEngine && BoardState.getColor() === "black") return true;
  if (BoardState.playersType === PlayersTypes.PlayerBlackVsEngine && BoardState.getColor() === "white") return true;
  return false;
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

  img.style.left = getLeftOfPiece(square) + "px"; 
  img.style.top  = getTopOfPiece(square)  + "px"; 

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
  labelDiv.style.left = getLeftOfSquare(king.currentSquare) + "px";
  labelDiv.style.top  = getTopOfSquare(king.currentSquare) + "px";
  labelDiv.id = "label_king_square";
  BOARD.appendChild(labelDiv);
}

const isGameFnished = (kingAttacked, moves) => kingAttacked && moves.length == 0

const makeEngineMove = async () => {
  let engineMove = await invoke("get_engine_move", {fen: BoardState.fen});
  let [move, score, fen] = engineMove.split(";");
  let currentPiece = document.getElementById(move.slice(0, 2));
  movePieceAndRebuildBoard(currentPiece, move);
}

const buildBoard = async () => {
  if (document.getElementById("board_container").style.visibility === "hidden") return;
  let moves = await BoardState.getMoves();
  let kingAttacked = await BoardState.isKingAttacked();
  
  BOARD.innerHTML = "";
  createPieces(moves, BoardState.fen);
  if (kingAttacked) labelKing();
  if (moves.length == 0) {
    if (kingAttacked) labelTheResult(BoardState.getOtherColor() + " Win")
    else labelTheResult("Draw")
  }
  
  if (isEngineTurn() && !isGameFnished(kingAttacked, moves)) makeEngineMove();
}

const findGrabbingPiece = (pieces) => Array.from(pieces).find((piece) => piece.classList.contains("grabbing"));
const findClickedPiece = (pieces, e) => {
  return Array.from(pieces).find(piece => {
    let left = piece.currentLeft.slice(0, -2) - 0; // removing px from end
    let top  = piece.currentTop.slice(0, -2) - 0;  // same
    return piece.classList.contains("grabbable") && 
           left <= e.pageX && e.pageX <= left + PIECE_WIDTH && 
           top  <= e.pageY && e.pageY <= top  + PIECE_HEIGHT;
  })
}

const createTargetDivs = (piece) => {
  piece.currentMoves.forEach((move) => {
    let targetSquare = getSquare(move.slice(2, move.length));
    let targetDiv = document.createElement("div");
    targetDiv.classList.add("target_square");
    targetDiv.style.left = getLeftOfSquare(targetSquare) + "px";
    targetDiv.style.top  = getTopOfSquare(targetSquare)  + "px";
    targetDiv.currentMove = move;
    targetDiv.currentSquare = getSquare(move.slice(2, targetDiv.currentMove.length));

    BOARD.appendChild(targetDiv);
  })
}

const getTargetDivs = () => Array.from(BOARD.childNodes).filter(el => el.classList.contains("target_square"))

const getClickedDiv = (e) => {
  return getTargetDivs().find(square => {
    let left = square.style.left.slice(0, -2) - 0; // remove px
    let top  = square.style.top.slice(0, -2) - 0;   // remove px
    return left <= e.pageX && e.pageX <= left + SQUARE_WIDTH && top <= e.pageY && e.pageY <= top + SQUARE_HEIGHT;
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
    piece.style.transition = "all " + MoveAffectSpeed + "s ease";
    piece.style.left = getLeftOfPiece(targetSquare) + "px";
    piece.style.top  = getTopOfPiece(targetSquare) + "px";
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
  console.log("geliyor")
  let targetSquare = getSquare(currentMove.slice(2, currentMove.length));
  slowlyMoveAffect(grabbingPiece, targetSquare);
  if (isMoveCastle(grabbingPiece, targetSquare)) slowlyMoveRook(grabbingPiece, currentMove)
  setTimeout(() => BoardState.makeMoveAndRebuild(currentMove), 250);
}

const resetPiece = (piece) => {
  piece.style.left = piece.currentLeft; 
  piece.style.top = piece.currentTop;
  deleteTargetDivs();
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
}

document.addEventListener("click", (e) => {
  let pieces = BOARD.childNodes;
  let grabbingPiece = findGrabbingPiece(pieces);
  if (grabbingPiece) handleMakeMoveAction(grabbingPiece, e);
  else handlePickPieceAction(pieces, e)
})

document.addEventListener('dragstart', (event) => event.preventDefault());

document.addEventListener("mousemove", (e) => {
  let pieces = BOARD.childNodes;
  let grabbingPiece = findGrabbingPiece(pieces)
  if (grabbingPiece) {
    grabbingPiece.style.left = e.pageX - PIECE_WIDTH  / 2 + "px" // for centralize the piece
    grabbingPiece.style.top  = e.pageY - PIECE_HEIGHT / 2 + "px" // for centralize the piece
  }
})

export {BoardState, PlayersTypes};