import { searchData } from "./engine_controller.js"

const dialog =  window.__TAURI__.dialog;

async function Something() {
    const filePath = await dialog.open({ multiple: false, directory: false });
    if (filePath) {
        console.log(`Selected file: ${filePath}`);
    } 
}



const SetBlackPlayerButton = document.getElementById("set_black_player_button");
const setWhitePlayerButton = document.getElementById("set_white_player_button");
const FenInput             = document.getElementById('fen_input');
const WincInput            = document.getElementById("white_time_plus_entry");
const BincInput            = document.getElementById("black_time_plus_entry");
const WtimeInput           = document.getElementById("white_time_entry");
const BtimeInput           = document.getElementById("black_time_entry");

setWhitePlayerButton.onclick = () => setColorOption("white")
SetBlackPlayerButton.onclick = () => setColorOption("black")

const MainMenu = {
    observers: [],
    menuDiv: document.getElementById("go_back_main_menu"),
    getClickedEvent()        {   return "main_menu_button_clicked"                            },
    addObserver(observer)    {  this.observers.push(observer)                                 },
    removeObserver(observer) {  this.observers = this.observers.filter(el => el != observer)  },
    clickMainMenu() {
        for (let observer of this.observers) observer.notify(this.getClickedEvent());
        this.menuDiv.style.visibility = "hidden";
    },
    update(event) { this.menuDiv.style.visibility = "visible"; }
}

MainMenu.menuDiv.onclick = () => { MainMenu.clickMainMenu() }

const Colors = {
    white: "white",
    black: "black",
}

class EnginePlayer {
    constructor(id) { this.id = id}
    makeMove() {}
}

class HumanPlayer {
    constructor() {}
    makeMove() {}
}

class BoardBuilder {
    constructor() {
        this.searchData = new searchData().setWtime(getWtime()).setBtime(getBtime()).setWinc(getWinc()).setBinc(getBinc());
        this.players = [];
        this.engineForGetMove               = null;  // bunu eklicen
        this.isFlippedBoard                 = false;
        this.pieceWidth                     = 6;
        this.pieceHeight                    = 6;
        this.boardLeft                      = 10;
        this.boardTop                       = 9;
        this.squareWidth                    = 9;
        this.squareHeight                   = 9;
        this.moveAffectSpeed                = 250;
        this.updateTimeInterval             = 200;
        this.opacityOfNoneTurnPlayerTimeDiv = "0.7";
    }

    addPlayer(player)      {  this.players.push(player); return this;  }
    setPieceWidth(width)   {  this.pieceWidth  = width;  return this;  }
    setPieceHeight(height) {  this.pieceHeight = height; return this;  }
    setBoardLeft(left)     {  this.boardLeft   = left;   return this;  }
    setBoardTop(top)       {  this.boardTop    = top;    return this;  }
    build() {}
}

const setColorOption = (color) => {
    SetBlackPlayerButton.classList.remove("color_is_clicked");
    setWhitePlayerButton.classList.remove("color_is_clicked");
    if (color == Colors.white) setWhitePlayerButton.classList.add("color_is_clicked");
    else SetBlackPlayerButton.classList.add("color_is_clicked");
}

const getColor  = () => setWhitePlayerButton.classList.contains("color_is_clicked") ? "white" : "black"
const getFen    = () => FenInput.value.trim()
const getWinc   = () => WincInput.value.trim()
const getBinc   = () => BincInput.value.trim()
const getWtime  = () => WtimeInput.value.trim();
const getBtime  = () => BtimeInput.value.trim();

export {MainMenu}