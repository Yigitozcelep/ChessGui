import { BoardState, PlayersTypes } from "./board.js";


const setColorOption = (color) => {
    document.getElementById("set_black_player_button").classList.remove("color_is_clicked")
    document.getElementById("set_white_player_button").classList.remove("color_is_clicked")
    document.getElementById("set_" + color + "_player_button").classList.add("color_is_clicked");
}

const getColorOption = () => document.getElementById("set_white_player_button").classList.contains("color_is_clicked") ? "white" : "black"

const getFenFromEntry = () => document.getElementById('fen_input').value.trim()

const getWhiteTime = () => document.getElementById("white_time_entry").value.trim();
const getBlackTime = () => document.getElementById("black_time_entry").value.trim();

document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById("go_back_main_menu").onclick = createMainMenu;
    document.getElementById("set_white_player_button").onclick = () => setColorOption("white")
    document.getElementById("set_black_player_button").onclick = () => setColorOption("black")
    document.getElementById("PlayerVsPlayer").onclick = () => BoardState.createBoard(getFenFromEntry(), PlayersTypes.PlayerVsPlayer, getWhiteTime(), getBlackTime())
    document.getElementById("PlayerVsEngine").onclick = () => {
        let color = getColorOption();
        if      (color == "white") BoardState.createBoard(getFenFromEntry(), PlayersTypes.PlayerWhiteVsEngine, getWhiteTime(), getBlackTime())
        else if (color == "black") BoardState.createBoard(getFenFromEntry(), PlayersTypes.PlayerBlackVsEngine, getWhiteTime(), getBlackTime())
    }
    document.getElementById("EngineVsEngine").onclick = () => BoardState.createBoard(getFenFromEntry(), PlayersTypes.EngineVsEngine, getWhiteTime(), getBlackTime());
});

const createMainMenu = () => {
    document.getElementById("board").innerHTML = "";
    document.getElementById("board_container").style.visibility = "hidden";
    document.getElementById("menu_container").style.visibility  = "visible";
    document.getElementById("fen_input").value = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    document.getElementById("white_time_entry").value = "5.0"
    document.getElementById("black_time_entry").value = "5.0"
    document.getElementById("white_time_plus_entry").value = "0"
    document.getElementById("black_time_plus_entry").value = "0"

    document.getElementById("white_robot_time_svg").style.visibility = "hidden";
    document.getElementById("black_robot_time_svg").style.visibility = "hidden";
    document.getElementById("white_player_time_svg").style.visibility = "hidden";
    document.getElementById("black_player_time_svg").style.visibility = "hidden";
    
    document.getElementById("board_white_time_div").style.visibility = "hidden";
    document.getElementById("board_black_time_div").style.visibility = "hidden";
}

createMainMenu()



