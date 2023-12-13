import { EngineController } from "./engine_controller.js";
import { MenuButtonController } from "./main_menu.js";

const BOARD_CONTAINER = document.getElementById("board_container");
const PIECES_DIV      = document.getElementById("pieces_container");
const SQUARES_DIV     = document.getElementById("square_container");

const FILES           = ["a","b","c","d","e","f","g","h"]
const BoardImg        = document.getElementById("board_img") ;

const Colors = {
    white: "white",
    black: "black",
}

const pieceNames = {
    king   : "king",
    queen  : "queen",
    knight : "knight",
    pawn   : "pawn",
    bishop : "bishop",
    rook   : "rook",
}

const letterToPiece = {
    "k": Colors.black + "_" + pieceNames.king,
    "q": Colors.black + "_" + pieceNames.queen,
    "n": Colors.black + "_" + pieceNames.knight,
    "p": Colors.black + "_" + pieceNames.pawn,
    "b": Colors.black + "_" + pieceNames.bishop,
    "r": Colors.black + "_" + pieceNames.rook,
    "K": Colors.white + "_" + pieceNames.king,
    "Q": Colors.white + "_" + pieceNames.queen,
    "N": Colors.white + "_" + pieceNames.knight,
    "P": Colors.white + "_" + pieceNames.pawn,
    "B": Colors.white + "_" + pieceNames.bishop,
    "R": Colors.white + "_" + pieceNames.rook,
}

const isNumeric = (value) => /^-?\d+$/.test(value)

const pxToVw = (px) => ((px / window.innerWidth) * 100) + "vw"

const getSquareName = (rankIndex, fileIndex) => FILES[fileIndex] + (rankIndex + 1);

const getRankIndexAndFileIndex = (square) => [Math.floor(square / 8), square % 8]


class EnginePlayer {
    constructor(id) { this.id = id}
    makeMove() {}
}

class HumanPlayer {
    constructor() {}
    makeMove() {}
}

class TimeController {
    constructor() {

    }
}

class Piece {
    constructor(moves, fullName, rankIndex, fileIndex) {
        this.moves       = moves;
        this.rankIndex   = rankIndex;
        this.fileIndex   = fileIndex;
        this.img         = document.createElement("img");
        this.squareName  = getSquareName(rankIndex, fileIndex);
        this.color       = fullName.split("_")[0]
        this.pieceName   = fullName.split("_")[1];
        this.fullName    = fullName;
        this._isGrabbing = false;
        this.initialLeft = 0;
        this.initialTop  = 0;
    }
    setInitialLeft(left) {  this.initialLeft = left; }
    setInitialTop(top)   {  this.initialTop  = top;  }

    resetPosition() { 
        this.img.style.left = this.initialLeft; 
        this.img.style.top  = this.initialTop;
    }

    /**
     * @param {BoardEvents} boardEvents 
     */
    grabPiece(boardEvents) {
        this._isGrabbing = true;
        this.img.classList.add("grabbing");
        boardEvents.setClickPiece(this);
    }

    /**
     * @param {BoardEvents} boardEvents 
     */
    removeGrab(boardEvents) {
        this._isGrabbing = false;
        this.img.classList.remove("grabbing")
        boardEvents.removeClickedPiece()
    }
    /**
     * @param {BoardEvents} boardEvents 
     */
    clicked(boardEvents) {
        if (!this._isGrabbing) this.grabPiece(boardEvents)
        else this.removeGrab(boardEvents);
    } 
}


class BoardConfigs {
    constructor(isFlippedBoard=false, boardLeft=10, boardTop=9, boardSize=72) {
        this.isFlippedBoard    = isFlippedBoard;
        this._boardLeft        = boardLeft;
        this._boardTop         = boardTop;
        this._boardSize        = boardSize;
        this._squareSize       = this._boardSize  / 8;
        this._pieceSize        = this._squareSize * 0.70;
    }
    
    getBoardLeft()                { return this._boardLeft  + "vw";                 }
    getBoardTop()                 { return this._boardTop   + "vw";                 }
    getBoardSize()                { return this._boardSize  + "vw";                 }
    getSquareSize()               { return this._squareSize + "vw";                 }
    getPieceSize()                { return this._pieceSize  + "vw";                 }
    getSquareLeft(fileIndex)      { return this._getSquareLeftNum(fileIndex) + "vw";                                               }
    getSquareTop(rankIndex)       { return this._getSquareTopNum(rankIndex)  + "vw";                                               }
    _getSquareLeftNum(fileIndex)  { return this._boardLeft + (this._squareSize * fileIndex);                                       }
    _getSquareTopNum(rankIndex)   { return this._boardTop  + (this._squareSize * (7 - rankIndex));                                 }
    getPieceLeft(fileIndex)       { return (this._getSquareLeftNum(fileIndex) + (this._squareSize - this._pieceSize) / 2) + "vw";  }
    getPieceTop(rankIndex)        { return (this._getSquareTopNum(rankIndex)  + (this._squareSize - this._pieceSize) / 2) + "vw";  }
    
    initializeSquares() {
        for (let fileIndex = 7; fileIndex >= 0; fileIndex--) {
            for (let rankIndex = 7; rankIndex >= 0; rankIndex--) {
                const squareName = getSquareName(rankIndex, fileIndex);
                const squareDiv = document.createElement("div");
                squareDiv.classList.add("square");
                squareDiv.id = squareName;
                squareDiv.style.height = squareDiv.style.width = this.getSquareSize();
                squareDiv.style.left   = this.getSquareLeft(fileIndex);
                squareDiv.style.top    = this.getSquareTop(rankIndex);
                SQUARES_DIV.appendChild(squareDiv);
            }
        }
    }
    
    /**
     * @param {BoardController} boardController - Array of Piece objects.
     */
    configurePiecesDiv(boardController) {
        for (const piece of boardController.gameState.getAllPieces()) {
            piece.setInitialLeft(this.getPieceLeft(piece.fileIndex));
            piece.setInitialTop(this.getPieceTop(piece.rankIndex));
            piece.img.src          = "./svgs/" + piece.fullName + ".svg";
            piece.img.id           = piece.fullName;
            piece.img.style.left   = this.getPieceLeft(piece.fileIndex);
            piece.img.style.top    = this.getPieceTop(piece.rankIndex);
            piece.img.style.width  = this.getPieceSize();
            piece.img.style.height = this.getPieceSize();
            piece.img.classList.add("piece");
            if (true && piece.color == boardController.gameState.getColor()) {
                piece.img.classList.add("grabbable");
                piece.img.addEventListener("click", () => piece.clicked(boardController.boardEvents) )
            }
            PIECES_DIV.appendChild(piece.img);
        }
    }
    
    initialize() {
        BOARD_CONTAINER.style.visibility = "visible";
        BoardImg.style.visibility        = "visible";
        BoardImg.style.width  = this.getBoardSize();
        BoardImg.style.height = this.getBoardSize();
        BoardImg.style.left   = this.getBoardLeft();
        BoardImg.style.top    = this.getBoardTop();
        this.initializeSquares();
    }

    terminate() {
        BOARD_CONTAINER.style.visibility = "hidden";
        BoardImg.style.visibility        = "hidden";
        SQUARES_DIV.innerHTML = "";
        PIECES_DIV.innerHTML  = "";
    }
    
}

class GameState {
    constructor() {
        this._fen       = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        this._turn      = 0;
        this._moveCount = 0;
        this._pieces    = {};
    }
    setFen(fen)                        { this._fen  = fen;                               }
    setTurn(turn)                      { this._turn = turn;                              }
    getFen()                           { return this._fen;                               }
    getTurnIndex()                     { return this._turn;                              }
    getPiecesLayout()                  { return this.getFen().split(" ")[0]              }
    getColor()                         { return this._turn ? Colors.black : Colors.white }
    addPieceToList(piece)              { this._pieces[piece.squareName] = piece          }
    getPiece(squareName)               { this._pieces[squareName];                       }
    /**
     * @returns {Piece[]}
     */
    getAllPieces()                     { return Object.values(this._pieces);             }
    createPieces() {
        let square = 56;
        const piecesLayout = this.getPiecesLayout();
        for (let i = 0; i < piecesLayout.length; i++) {
          if (isNumeric(piecesLayout[i])) { square += parseInt(piecesLayout[i]); }
          else if (piecesLayout[i] == "/") square += -16;
          else {
            const pieceName = letterToPiece[piecesLayout[i]]
            const [rankIndex, fileIndex] = getRankIndexAndFileIndex(square);
            this.addPieceToList(new Piece("", pieceName, rankIndex, fileIndex));
            square += 1;
          }
       }
    }
}

class BoardEvents {
    constructor() {
        this.movedPlayedObservers = [];
        this.gameFnishedObservers = [];
        this.firstMoveObservers   = [];
        this.undoObservers        = [];
        this.redoObservers        = [];
        this._clickedPiece        = null;
        this.movePieceWithMouse   = this.movePieceWithMouse.bind(this);
    }
    /**
     * @returns {Piece|null}
     */
    getClickedPiece()      { return this._clickedPiece;  }
    /**
     * @param {Piece} piece
     */
    setClickPiece(piece)   { this._clickedPiece = piece; }
    removeClickedPiece()   { this._clickedPiece = null;  }

    /**
     * @param {MouseEvent} e - The mouse event triggered by moving the mouse.
     */
    movePieceWithMouse(e) {
        const piece = this.getClickedPiece();
        if (!piece) return;
        piece.img.style.left = pxToVw(e.pageX);
        piece.img.style.top  = pxToVw(e.pageY);
    }

    initialize() {
        document.addEventListener("mousemove", this.movePieceWithMouse)
    }

    terminate() {
        document.removeEventListener("mousemove", this.movePieceWithMouse)
    }
}


class BoardController {
    /**
     * @param {BoardConfigs} boardConfigs 
     * @param {GameState} gameState
     * @param {BoardEvents} boardEvents
     */
    constructor(boardConfigs, gameState, boardEvents, boardStrategy) {
        this.configs = boardConfigs;
        this.gameState = gameState;
        this.boardEvents = boardEvents;
        this.boardStrategy = boardStrategy;
        this.initialize();
    }

    initialize() {
        MenuButtonController.addObserver(this);
        MenuButtonController.makeVisible();
        this.boardEvents.initialize();
        this.gameState.createPieces();
        this.configs.initialize();
        this.configs.configurePiecesDiv(this);
        
    }

    notify() {
        this.boardEvents.terminate();
        this.configs.terminate();
    }
}

document.addEventListener('dragstart', (event) => event.preventDefault());

export { BoardController, BoardConfigs, GameState, BoardEvents, Colors }