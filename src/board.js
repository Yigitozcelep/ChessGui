import { EngineController } from "./engine_controller.js";
import { MenuButtonController } from "./main_menu.js";
import { newRoundEventInfos } from "./board_helpers.js";

const BOARD_CONTAINER = document.getElementById("board_container");
const PIECES_DIV      = document.getElementById("pieces_container");
const SQUARES_DIV     = document.getElementById("square_container");
const FILES           = ["a","b","c","d","e","f","g","h"]
const BOARD_IMG       = document.getElementById("board_img") ;
const START_FEN       = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const invoke          = window.__TAURI__.invoke


function getPromiseFromEvent(item, event, name) {
    return new Promise((resolve) => {
      const listener = () => {
        item.removeEventListener(event, listener);
        resolve(name);
      }
      item.addEventListener(event, listener);
    })
}

const Colors = {
    white: "white",
    black: "black",
    charToColor(char) { return char == this.white[0] ? this.white : this.black }
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

class Pieces {
    constructor() {
        this._pieces = {};
    }
    addPieceToList(piece) { this._pieces[piece.squareName] = piece; }
    resetPieces()         { this._pieces = {};                      }
    
    /**
     * @param {Colors[keyof Colors]} color
     * @returns {Piece}
     */
    getKing(color) {
        return this.getAllPieces().find(piece => piece.color == color && piece.pieceName == pieceNames.king)
    }
    /**
     * @param {Move[]} moves 
     * @param {BoardController} boardController
     */
    createPieces(moves, boardController) {
        this._pieces = {};
        PIECES_DIV.innerHTML = "";
        let square = 56;
        const piecesLayout = boardController.gameState.getPiecesLayout();
        for (let i = 0; i < piecesLayout.length; i++) {
          if (isNumeric(piecesLayout[i])) { square += parseInt(piecesLayout[i]); }
          else if (piecesLayout[i] == "/") square += -16;
          else {
            const pieceName = letterToPiece[piecesLayout[i]]
            const [rankIndex, fileIndex] = getRankIndexAndFileIndex(square);
            const pieceMoves = moves.filter(move => move.sourceSquareName == getSquareName(rankIndex, fileIndex))
            this.addPieceToList(new Piece(pieceMoves, pieceName, rankIndex, fileIndex, boardController))
            square += 1;
          }
       }
    }
    /**
     * @returns {Piece[]}
     */
    getAllPieces() { return Array.from(Object.values(this._pieces)); }
    removeGrabbility() { this.getAllPieces().forEach(piece => piece.removeGrabbability())}
}

class Piece {
    /**
     * @param {Move[]} moves 
     * @param {BoardController} boardController 
     */
    constructor(moves, fullName, rankIndex, fileIndex, boardController, containerDiv=PIECES_DIV, isGrabbable=true) {
        this.moves       = moves;
        this.rankIndex   = rankIndex;
        this.fileIndex   = fileIndex;
        this.squareName  = getSquareName(rankIndex, fileIndex);
        this.fullName    = fullName;
        this.color       = fullName.split("_")[0]
        this.pieceName   = fullName.split("_")[1];
        this.initialLeft = boardController.boardConfigs.getPieceLeft(fileIndex);
        this.initialTop  = boardController.boardConfigs.getPieceTop(rankIndex);
        this._isGrabbing = false;
        this.div         = document.createElement("img");
        this.boardController = boardController;
        this.pieceListener = this.pieceListener.bind(this);
        this.initializeDiv(containerDiv, isGrabbable);
    }
    /**
     * @param {BoardController} boardController
     */
    pieceListener(e) { this.boardController.pieceClicked(e, this); }
    initializeDiv(containerDiv, isGrabbable) {
        this.div.src      = "./svgs/" + this.fullName + ".svg";
        this.div.id           = this.fullName;
        this.div.style.left   = this.boardController.boardConfigs.getPieceLeft(this.fileIndex);
        this.div.style.top    = this.boardController.boardConfigs.getPieceTop(this.rankIndex);
        this.div.style.width  = this.boardController.boardConfigs.getPieceSize();
        this.div.style.height = this.boardController.boardConfigs.getPieceSize();
        this.div.classList.add("piece");
        if (isGrabbable && this.color == this.boardController.gameState.getColor()) {
            this.div.classList.add("grabbable");
            this.div.addEventListener("click", this.pieceListener)
        }
        containerDiv.appendChild(this.div);
    }

    isGrabbingPiece()    {  return this._isGrabbing; }
    resetPosition() { 
        this.div.style.left = this.initialLeft; 
        this.div.style.top  = this.initialTop;
    }

    grabPiece() {
        this._isGrabbing = true;
        this.div.classList.add("grabbing");
    }
    removeGrabbability() {
        this.removeGrab();
        this.div.classList.remove("grabbable");
        this.div.removeEventListener("click", this.pieceListener);
    }

    removeGrab() {
        this._isGrabbing = false;
        this.div.classList.remove("grabbing")
    }

    makeHidden() {
        this.div.style.visibility = "hidden";
    }
    makeVisible() {
        this.div.style.visibility = "visible";
    }

    removeDiv() {
        this.div.parentNode.removeChild(this.div);
    }

    move(left, top) {
        this.div.style.zIndex = 500;
        this.div.style.transition = "all " + 0.25 + "s ease";
        this.div.style.left = left;
        this.div.style.top  = top;
        return new Promise(resolve => setTimeout(resolve, 250));
    }
}

class BoardConfigs {
    constructor(isFlippedBoard=false, boardLeft=10, boardTop=9, boardSize=72) {
        this.unit                 = "vw";
        this.isFlippedBoard       = isFlippedBoard;
        this._boardLeft           = boardLeft;
        this._boardTop            = boardTop;
        this._boardSize           = boardSize;
        this._squareSize          = this._boardSize  / 8;
        this._pieceSize           = this._squareSize * 0.70;
        this._squareBorder = this._squareSize / 60;
    }
    getSquareBorder()             { return this._squareBorder + this.unit                          }
    pxToUnitNum(pxNum)            { return (pxNum / window.innerWidth) * 100                       }
    getBoardLeft()                { return this._boardLeft  + this.unit;                           }
    getBoardTop()                 { return this._boardTop   + this.unit;                           }
    getBoardSize()                { return this._boardSize  + this.unit;                           }
    getSquareSize()               { return this._squareSize - this._squareBorder / 2 + this.unit;  }
    getPieceSize()                { return this._pieceSize  + this.unit;                           }
    getSquareLeft(fileIndex)      { return this._getSquareLeftNum(fileIndex)  + this.unit;                                              }
    getSquareTop(rankIndex)       { return this._getSquareTopNum(rankIndex)   + this.unit;                                              }
    _getSquareLeftNum(fileIndex)  { return this._boardLeft + (this._squareSize * fileIndex);                                            }
    _getSquareTopNum(rankIndex)   { return this._boardTop  + (this._squareSize * (7 - rankIndex));                                      }
    getPieceLeft(fileIndex)       { return (this._getSquareLeftNum(fileIndex) + (this._squareSize - this._pieceSize) / 2) + this.unit;  }
    getPieceTop(rankIndex)        { return (this._getSquareTopNum(rankIndex)  + (this._squareSize - this._pieceSize) / 2) + this.unit;  }

    /**
     * @param {MouseEvent} e 
     * @param {Piece} piece 
     */
    setPieceCenterOfTheMouse(e, piece) {
        piece.div.style.left = (this.pxToUnitNum(e.pageX) - this._pieceSize / 2) + this.unit;
        piece.div.style.top  = (this.pxToUnitNum(e.pageY) - this._pieceSize / 2) + this.unit;
    }
    /**
     * @param {BoardController} boardController - Array of Piece objects.
     */
    initialize(boardController) {
        BOARD_CONTAINER.style.visibility = "visible";
        BOARD_IMG.style.visibility        = "visible";
        BOARD_IMG.style.width  = this.getBoardSize();
        BOARD_IMG.style.height = this.getBoardSize();
        BOARD_IMG.style.left   = this.getBoardLeft();
        BOARD_IMG.style.top    = this.getBoardTop();
    }

    terminate() {
        BOARD_CONTAINER.style.visibility = "hidden";
        BOARD_IMG.style.visibility        = "hidden";
        SQUARES_DIV.innerHTML = "";
        PIECES_DIV.innerHTML  = "";
    }
}

class Move {
    /**
    * @param {string} move 
    */
    constructor(move, color) {
        this.name             = move;        
        this.sourceSquareName = move.slice(0, 2);
        this.targetSquareName = move.slice(2, 4);
        this.promotedPiece    = move[4] ? (color == Colors.white ? letterToPiece[move[4].toLocaleUpperCase()] : letterToPiece[move[4]]) : null;
    }
}

class Squares {

    constructor(boardConfig) {
        this._squares = {};
    }
    /**
     * @returns {Square[]}
     */
    getAllSquares()        { return Object.values(this._squares); }

    /**
     * @param {String} squareName 
     * @returns {Square}
     */
    getSquare(squareName) {
        return this._squares[squareName];
    }
    /**
     * @param {MouseEvent} e
     * @returns {Square|null}
     */
    getClickedMovableSquare(e) {
        const divs = document.elementsFromPoint(e.clientX, e.clientY);
        return this.getAllSquares().find(square => divs.includes(square.div) && square.isMovableSquare)
    }
    /**
     * @param {BoardConfigs} boardConfig 
     */
    initialize(boardConfig) {
        for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
            for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
                this.addSquareToList(new Square(rankIndex, fileIndex, boardConfig));
            }
        }
    }
    clearLabelKing() {
        this.getAllSquares().forEach(square => square.clearLabelKingAttacked());
    }
    addSquareToList(square) {this._squares[square.name] = square }
}

class Square {
    /**
     * @param {BoardConfigs} boardConfig 
     */
    constructor(rankIndex, fileIndex, boardConfig) {
        this.rankIndex       = rankIndex;
        this.fileIndex       = fileIndex;
        this.name            = getSquareName(rankIndex, fileIndex);
        this.isPieceOnTopOf  = false;
        this.isMovableSquare = false;
        /**
         * @type {Move[]}
         */
        this.moves           = [];
        this.div             = document.createElement("div");
        this.initializeDiv(boardConfig);
    }
    /**
     * @param {Move} move 
     */
    makeMovable(move) {
        this.isMovableSquare = true;
        this.moves.push(move);
        this.div.classList.add("target_square")
    }

    labelKingAttacked() {
        this.div.classList.add("label_king_square");
    }

    clearLabelKingAttacked() {
        this.div.classList.remove("label_king_square")
    }
    
    removeMovable() {
        this.isMovableSquare = false;
        this.moves = [];
        this.div.classList.remove("target_square");
    }
    /**
     * @param {BoardConfigs} boardConfig 
     */
    initializeDiv(boardConfig) {
        this.div.classList.add("square");
        this.div.style.height = this.div.style.width = boardConfig.getSquareSize();
        this.div.style.left   = boardConfig.getSquareLeft(this.fileIndex);
        this.div.style.top    = boardConfig.getSquareTop(this.rankIndex);
        this.div.style.borderWidth = boardConfig.getSquareBorder();
        SQUARES_DIV.appendChild(this.div);
    }

    makeSelectionSquare() {
        this.div.classList.add("promotion_selection_square")
    }

    removeSelection() {
        this.div.classList.remove("promotion_selection_square")
    }

 
}

class GameState {
    constructor(fen=START_FEN) {
        this._fen       = fen;
        this._moveCount = 0;
        this._pieces    = new Pieces();
        this._squares   = new Squares();
    }
    getReverseDirection()              {  return this.getColor() == Colors.white ? -1 : 1     }
    setFen(fen)                        {  this._fen  = fen;     return this;                  }
    getFen()                           {  return this._fen;                                   }
    getTurnIndex()                     {  return this._turn;                                  }
    getPiecesLayout()                  {  return this.getFen().split(" ")[0]                  }
    getColor()                         {  return Colors.charToColor(this._fen.split(" ")[1])  }
    addSquareToList(square)            {  this._squares[square.name] = square                 }
    /**
     * @param {MouseEvent} e
     */
    getClickedMovableSquare(e) { return this._squares.getClickedMovableSquare(e); }
    async getMoves() {
        /**
         * @type {string[]}
         */
        const results = await invoke("get_moves", {fen: this._fen})
        return Array.from(results, (move) => new Move(move, this.getColor()));
    }

    getAllPieces()                     { return this._pieces.getAllPieces();}

    getAllSquares()                    { return this._squares.getAllSquares();}

    getSquare(name)                    { return this._squares.getSquare(name)}
    
    async createPieces(boardController) {
        const moves = await this.getMoves();
        this._pieces.createPieces(moves, boardController);
    }
    
    async initialize(boardController) {
        this._squares.initialize(boardController.boardConfigs);
        await this.createPieces(boardController);
    }

    async makeMove(move) {
        this._fen = await invoke("make_move", {fen: this._fen, moveName: move.name});
    }
    async isKingAttacked() {
        return await invoke("is_king_attacked", {fen: this._fen});
    }

    labelKing() {
        const king = this._pieces.getKing(this.getColor())
        const square = this._squares.getSquare(king.squareName)
        square.labelKingAttacked();
    }
    clearLabelKing() {
        this._squares.clearLabelKing();
    }
    removeGrabbability() { this._pieces.removeGrabbility() }
}

class BoardEvents {
    constructor() {
        this.moveStarting         = [];
        this.newRound             = [];
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
     * @param {BoardConfigs} boardConfig
     */
    movePieceWithMouse(e, boardConfig) {
        const piece = this.getClickedPiece();
        if (piece) boardConfig.setPieceCenterOfTheMouse(e, piece);
    }

    /**
     * @param {MouseEvent} e - The mouse event triggered by moving the mouse.
     * @param {Piece} piece
     * @param {BoardConfigs} boardConfig 
     */
    grabPiece(e, piece, boardConfig) {
        this.setClickPiece(piece);
        piece.grabPiece();
        boardConfig.setPieceCenterOfTheMouse(e, piece);
    }   

    /**
     * @param {Piece} piece
     * @param {GameState} gameState 
     */
    showMovableSquares(piece, gameState) {
        piece.moves.forEach(move => {
            gameState.getAllSquares().forEach(square => {
                if (move.targetSquareName == square.name) { square.makeMovable(move); }
            })
        })
    }

    /**
     * @param {Square} square 
     * @param {Piece} piece
     * @param {Move[]} moves
     * @param {BoardController} boardController
     */
    async showMoveOptions(square, piece, moves, boardController) {
        PIECES_DIV.style.opacity = "0.8";
        BOARD_IMG.style.opacity  = "0.8";
        const events       = []
        const newPieces    = []
        const newSquares   = []
        const direction    = boardController.gameState.getReverseDirection();
        piece.removeDiv();
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            const newPiece = new Piece(move, move.promotedPiece, square.rankIndex + direction * i, square.fileIndex, boardController, SQUARES_DIV, false);
            newPieces.push(newPiece);
            const squareOfNewPiece = boardController.gameState.getSquare(getSquareName(square.rankIndex + direction * i, square.fileIndex));
            newPiece.div.style.cursor = "pointer";
            squareOfNewPiece.makeSelectionSquare();
            newPiece.div.addEventListener("mouseenter", () => squareOfNewPiece.div.classList.add("promotion_selection_square_mouse_in"))
            newPiece.div.addEventListener("mouseleave", () => squareOfNewPiece.div.classList.remove("promotion_selection_square_mouse_in"))
            newSquares.push(squareOfNewPiece);
            events.push(getPromiseFromEvent(newPiece.div, "click", move))
        }
        const result = await Promise.race(events);
        new Piece([], result.promotedPiece, square.rankIndex, square.fileIndex, boardController, PIECES_DIV, false);
        for (const newPiece of newPieces) newPiece.removeDiv();
        for (const newSquare of newSquares) newSquare.removeSelection();
        const targetPiece = boardController.gameState.getAllPieces().find(p => p.fileIndex == square.fileIndex && p.rankIndex == square.rankIndex);
        if (targetPiece) targetPiece.removeDiv();
        PIECES_DIV.style.opacity = "1";
        BOARD_IMG.style.opacity  = "1";
        boardController.makeMove(result, piece, square);
    }
    /**
     * @param {GameState} gameState 
     */
    hideMovableSquares(gameState) {
        gameState.getAllSquares().forEach(square => square.removeMovable())
    }
    /**
     * @param {Piece} piece
     */
    ungrabPiece(piece) {
        piece.removeGrab();
        this.removeClickedPiece();
    }
    /**
     * @param {MouseEvent} e - The mouse event triggered by moving the mouse.
     * @param {Piece} piece
     * @param {BoardController} boardController 
     */
    handleGrabbingPieceClick(e, piece, boardController) {
        const clickedMovableSquare = boardController.gameState.getClickedMovableSquare(e);
        const moves = clickedMovableSquare ? clickedMovableSquare.moves : null;
        this.hideMovableSquares(boardController.gameState);
        this.ungrabPiece(piece);
        if      (moves && moves.length > 1) { this.showMoveOptions(clickedMovableSquare, piece, moves, boardController)  }
        else if (moves && moves.length == 1) boardController.makeMove(moves[0], piece, clickedMovableSquare);
        else piece.resetPosition();
    }
    /**
     * @param {MouseEvent} e - The mouse event triggered by moving the mouse.
     * @param {Piece} piece
     * @param {BoardController} boardController 
     */
    pieceClicked(e, piece, boardController) {
        if (piece.isGrabbingPiece()) this.handleGrabbingPieceClick(e, piece, boardController)
        else {
            this.grabPiece(e, piece, boardController.boardConfigs)
            this.showMovableSquares(piece, boardController.gameState);
        }
    }
}

class BoardController {
    /**
     * @param {BoardConfigs} boardConfigs 
     * @param {GameState} gameState
     * @param {BoardEvents} boardEvents
     */
    constructor(boardConfigs, gameState, boardEvents, boardStrategy) {
        this.boardConfigs = boardConfigs;
        this.gameState = gameState;
        this.boardEvents = boardEvents;
        this.boardStrategy = boardStrategy;
        this.mouseMoveEvent = this.mouseMoveEvent.bind(this);
        this.initialize();
    }
    mouseMoveEvent(e) { this.boardEvents.movePieceWithMouse(e, this.boardConfigs) }
    
    /**
     * @param {Move} mov 
     * @param {Piece} piece
     * @param {Square} targetSquare
     */
    async makeMove(mov, piece, targetSquare) {
        await piece.move(this.boardConfigs.getPieceLeft(targetSquare.fileIndex), this.boardConfigs.getPieceTop(targetSquare.rankIndex));
        await this.gameState.makeMove(mov);
        const isKingAttacked = await this.gameState.isKingAttacked();
        this.gameState.clearLabelKing();
        if (isKingAttacked) this.gameState.labelKing();
        this.gameState.createPieces(this);
        console.log(this.boardEvents.newRound)
        for (let obj of this.boardEvents.newRound) {obj.newRound(new newRoundEventInfos(mov, piece, this.gameState.getColor(), targetSquare, this.gameState.getFen()));}
    }
    
    async initialize() {
        document.addEventListener("mousemove", this.mouseMoveEvent)
        MenuButtonController.addObserver(this);
        MenuButtonController.makeVisible();
        await this.gameState.initialize(this);
        this.boardConfigs.initialize(this);
    }

    pieceClicked(e, piece) {
        this.boardEvents.pieceClicked(e, piece, this);
    }

    gameFnished() {
        this.gameState.removeGrabbability();
        
    }
    
    terminate() {
        document.removeEventListener("mousemove", this.mouseMoveEvent);
        this.boardConfigs.terminate();
    }
}

document.addEventListener('dragstart', (event) => event.preventDefault());

export { BoardController, BoardConfigs, GameState, BoardEvents, Colors }