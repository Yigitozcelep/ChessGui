import { BoardState, PlayersTypes } from "./main.js";

const BOARD_CONTAINER = document.getElementById("board_container");

const setColorOption = (color) => {
    document.getElementById("set_black_player_button").classList.remove("color_is_clicked")
    document.getElementById("set_white_player_button").classList.remove("color_is_clicked")
    document.getElementById("set_" + color + "_player_button").classList.add("color_is_clicked");
}

const getColorOption = () => document.getElementById("set_white_player_button").classList.contains("color_is_clicked") ? "white" : "black"

const getFenFromEntry = () => document.getElementById('fen_input').value.trim()

document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById("go_back_main_menu").onclick = createMainMenu;
    document.getElementById("set_white_player_button").addEventListener("click", () => setColorOption("white"))
    document.getElementById("set_black_player_button").addEventListener("click", () => setColorOption("black"))
    document.getElementById("PlayerVsPlayer").addEventListener("click", () => BoardState.createBoard(getFenFromEntry(), 300, PlayersTypes.PlayerVsPlayer))
    document.getElementById("PlayerVsEngine").addEventListener("click", () => {
        let color = getColorOption();
        if (color == "white") BoardState.createBoard(getFenFromEntry(), 300, PlayersTypes.PlayerWhiteVsEngine)
        else if (color == "black") BoardState.createBoard(getFenFromEntry(), 300, PlayersTypes.PlayerBlackVsEngine)
    })
});

const createMainMenu = () => {
    document.getElementById("board_container").style.visibility = "hidden";
    document.getElementById("menu_container").style.visibility  = "visible";
}

createMainMenu()



