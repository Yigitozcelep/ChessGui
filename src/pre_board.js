import { BoardState, PlayersTypes } from "./main.js";



const setColorOption = (color) => {
    document.getElementById("set_black_player_button").classList.remove("color_is_clicked")
    document.getElementById("set_white_player_button").classList.remove("color_is_clicked")
    document.getElementById("set_" + color + "_player_button").classList.add("color_is_clicked");
}

const getColorOption = () => document.getElementById("set_white_player_button").classList.contains("color_is_clicked") ? "white" : "black"

const getFenFromEntry = () => document.getElementById('fen_input').value.trim()

document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById("go_back_main_menu").onclick = createMainMenu;
    document.getElementById("set_white_player_button").onclick = () => setColorOption("white")
    document.getElementById("set_black_player_button").onclick = () => setColorOption("black")
    document.getElementById("PlayerVsPlayer").onclick = () => BoardState.createBoard(getFenFromEntry(), PlayersTypes.PlayerVsPlayer)
    document.getElementById("PlayerVsEngine").onclick = () => {
        let color = getColorOption();
        if (color == "white") BoardState.createBoard(getFenFromEntry(), PlayersTypes.PlayerWhiteVsEngine)
        else if (color == "black") BoardState.createBoard(getFenFromEntry(), PlayersTypes.PlayerBlackVsEngine)
    }
    document.getElementById("EngineVsEngine").onclick = () => BoardState.createBoard(getFenFromEntry(), PlayersTypes.EngineVsEngine);
});

const createMainMenu = () => {
    document.getElementById("board").innerHTML = "";
    document.getElementById("board_container").style.visibility = "hidden";
    document.getElementById("menu_container").style.visibility  = "visible";
    document.getElementById("fen_input").value = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    document.getElementById("white_time_entry").value = "5.0"
    document.getElementById("black_time_entry").value = "5.0"
}

createMainMenu()



