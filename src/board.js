import { EngineController } from "./engine_controller.js";
import { MenuButtonController, Colors } from "./main_menu.js";

const BOARD_CONTAINER = document.getElementById("board_container");
const PIECES_DIV      = document.getElementById("pieces_container");
const SQUARES_DIV     = document.getElementById("square_container");

const FILES           = ["a","b","c","d","e","f","g","h"]
const BoardImg        = document.getElementById("board_img") ;

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

const isNumeric = (value) => /^-?\d+$/.test(value)


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

class BoardConfigs {
    constructor(isFlippedBoard=false, boardLeft=10, boardTop=9, boardSize=72) {
        this.isFlippedBoard                  = isFlippedBoard;
        this._boardLeft                      = boardLeft;
        this._boardTop                       = boardTop;
        this._boardSize                      = boardSize;
        this._squareSize                     = this._boardSize  / 8;
        this._pieceSize                      = this._squareSize * 0.75;
        
    }

    getBoardLeft()                 { return this._boardLeft  + "vw";                 }
    getBoardTop()                  { return this._boardTop   + "vw";                 }
    getBoardSize()                 { return this._boardSize  + "vw";                 }
    getSquareSize()                { return this._squareSize + "vw";                 }
    getPieceSize()                 { return this._pieceSize  + "vw";                 }
    getSquareDiv(squareName)       { return document.getElementById(squareName);     }
    getSquareLeft(file)            { return (this._boardLeft + (this._squareSize * file))      + "vw";  }
    getSquareTop(rank)             { return (this._boardTop + (this._squareSize * (7 - rank))) + "vw";  }
    
    initializeSquares() {
        for (let fileIndex = 7; fileIndex >= 0; fileIndex--) {
            for (let rankIndex = 7; rankIndex >= 0; rankIndex--) {
                const file = FILES[fileIndex];
                const square = document.createElement("div");
                square.classList.add("square");
                square.id = file + (rankIndex + 1);
                square.style.height = square.style.width = this.getSquareSize();
                square.style.left   = this.getSquareLeft(fileIndex);
                square.style.top    = this.getSquareTop(rankIndex);
                SQUARES_DIV.appendChild(square);
            }
        }
    }

    initialize() {
        BOARD_CONTAINER.style.visibility = "visible";
        BoardImg.style.visibility = "visible";
        BoardImg.style.width  = this.getBoardSize();
        BoardImg.style.height = this.getBoardSize();
        BoardImg.style.left   = this.getBoardLeft();
        BoardImg.style.top    = this.getBoardTop();
        this.initializeSquares();
    }
}

class GameState {
    constructor() {
        this._fen  = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        this._turn = 0;
        this._moveCount = 0;
    }
    setFen(fen)       { this._fen  = fen;                                }
    setTurn(turn)     { this._turn = turn;                              }
    getFen()          { return this._fen;                               }
    getTurnIndex()    { return this._turn;                              }
    getPiecesLayout() { return this.getFen().split(" ")[0]              }
    getColor()        { return this._turn ? Colors.black : Colors.white }
}

const boardEvents = {
    clickPieceObservers  : [],
    movedPlayedObservers : [],
    gameFnishedObservers : [],
    firstMoveObservers   : [],
    undoObservers        : [],
    redoObservers        : [],
}

const boardStates = {
    configs         : new BoardConfigs(),
    gameState       : new GameState(),
    boardStrategy   : 2,

    createItem(square, piece, moves, pieceColor) {
        const rank = Math.floor(square / 8);
        const file = square % 8;
        const fileName = "./svgs/" + piece + ".svg"
        
        let img = document.createElement("img");
        img.src = fileName;
        img.classList.add("piece");
        img.id = (FILES[file] + (rank + 1));
      
        
        // if (isGrabbable(pieceColor)) img.classList.add("grabbable")
        
        img.pieceName     = piece;
        img.currentSquare = square;
        img.currentLeft   = img.style.left;
        img.currentTop    = img.style.top;
        img.currentMoves  = moves
        
        PIECES_DIV.appendChild(img);
    },

    createPieces() {
        let square = 56;
        const piecesLayout = this.gameState.getPiecesLayout();
        for (let i = 0; i < piecesLayout.length; i++) {
          if (isNumeric(piecesLayout[i])) { square += parseInt(piecesLayout[i]); }
          else if (piecesLayout[i] == "/") square += -16;
          else {
            this.createItem(square, letterToPiece[piecesLayout[i]], currentMoves);
            square += 1;
          }
       }
    },
    
    initialize() {
        MenuButtonController.addObserver(this);
        MenuButtonController.makeVisible();
        this.configs.initialize();
        this.createPieces();
    },

    notify() {
        BoardImg.style.visibility = "hidden";
    }
}


export { boardStates, BoardConfigs, GameState }