import { EngineController, searchData } from "./engine_controller.js"
import { BoardConfigs, BoardController, GameState, BoardEvents, Colors } from "./board.js";
import { TimeDiv } from "./board_helpers.js";

const SetBlackPlayerButton     = document.getElementById("set_black_player_button");
const setWhitePlayerButton     = document.getElementById("set_white_player_button");
const FenInput                 = document.getElementById('fen_input');
const WincInput                = document.getElementById("white_time_plus_entry");
const BincInput                = document.getElementById("black_time_plus_entry");
const WtimeInput               = document.getElementById("white_time_entry");
const BtimeInput               = document.getElementById("black_time_entry");
const MainEngineDiv            = document.getElementById("main_engine_div");
const SaveEngineDiv            = document.getElementById("save_engine");
const DeleteEngineDiv          = document.getElementById("delete_engine_container");
const PlayerVsPlayerButton     = document.getElementById("PlayerVsPlayer");
const PlayerVsEngineButton     = document.getElementById("PlayerVsEngine");
const EngineVsEngineButton     = document.getElementById("EngineVsEngine");
const TestEngineButton         = document.getElementById("TestEngine");
const MenuContainer            = document.getElementById("menu_container");
const MenuButton               = document.getElementById("menu_button");

const TopTimePlayerDiv         = document.getElementById("top_player_time_svg");
const TopTimeRobotDiv          = document.getElementById("top_robot_time_svg");
const TopTimeDiv               = document.getElementById("top_time_div");

const BottomTimePlayerDiv      = document.getElementById("bottom_player_time_svg");
const BottomTimeRobotDiv       = document.getElementById("bottom_robot_time_svg");
const BottomTimeDiv            = document.getElementById("bottom_time_div");

SaveEngineDiv.onclick        = () => EngineController.saveEngine();
setWhitePlayerButton.onclick = () => setColorOption(Colors.white)
SetBlackPlayerButton.onclick = () => setColorOption(Colors.black)
PlayerVsEngineButton.onclick = () => {
    const boardEvents = new BoardEvents();
    const topTimeClass    = new TimeDiv(TopTimePlayerDiv, TopTimeDiv, Colors.black, 1000, boardEvents.gameFnishedObservers);
    const bottomTimeClass = new TimeDiv(BottomTimeRobotDiv, BottomTimeDiv, Colors.white, 1000, boardEvents.gameFnishedObservers);
    MenuButtonController.addObserver(topTimeClass);
    MenuButtonController.addObserver(bottomTimeClass);
    boardEvents.newRound.push(topTimeClass);
    const board = new BoardController(new BoardConfigs(), new GameState().setFen(getFen()), boardEvents, "");
    boardEvents.gameFnishedObservers.push(board);
    MenuContainer.style.visibility = "hidden";
};

const PushEnginesNamesToDiv = (div) => {
    div.innerHTML = "";
    for (let name of EngineController.getEngineNames()) {
        const listItem = document.createElement("li");
        listItem.textContent = name;
        listItem.classList.add("engine_list");
        listItem.onclick = () => {
            div.innerHTML = "";
            const topName = document.createElement("li");
            topName.classList.add("engine_list");
            topName.innerHTML = name;
            div.appendChild(topName);
            topName.onclick = () => PushEnginesNamesToDiv(div);
        }
        div.appendChild(listItem);
    }
}

document.getElementById("main_engine_top_name").onclick = () => PushEnginesNamesToDiv(MainEngineDiv)
DeleteEngineDiv.onclick = () => EngineController.deleteEngine() 

const MenuButtonController = {
    observers: [],
    addObserver(observer)    {  this.observers.push(observer)                                 },
    removeObserver(observer) {  this.observers = this.observers.filter(el => el != observer)  },
    clickMainMenu() {
        for (let observer of this.observers) observer.terminate();
        MenuContainer.style.visibility = "visible";
        MenuButton.style.visibility = "hidden";
    },
    makeVisible() { MenuButton.style.visibility = "visible" }
}

MenuButton.onclick = () => { MenuButtonController.clickMainMenu() }

const setColorOption = (color) => {
    SetBlackPlayerButton.classList.remove("color_is_clicked");
    setWhitePlayerButton.classList.remove("color_is_clicked");
    if (color == Colors.white) setWhitePlayerButton.classList.add("color_is_clicked");
    else SetBlackPlayerButton.classList.add("color_is_clicked");
}

const getColor  = () => setWhitePlayerButton.classList.contains("color_is_clicked") ? Colors.white: Colors.black
const getFen    = () => FenInput.value.trim()
const getWinc   = () => WincInput.value.trim()
const getBinc   = () => BincInput.value.trim()
const getWtime  = () => WtimeInput.value.trim();
const getBtime  = () => BtimeInput.value.trim();

export { MenuButtonController }