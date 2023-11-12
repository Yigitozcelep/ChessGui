import {BuildBoard } from "./main.js";

const BOARD_CONTAINER = document.getElementById("board_container");

const createMainMenu = () => {
    window.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    window.chess_engine_color = "";
    let fen_div = document.createElement("div");
    fen_div.innerHTML += "Fen:";
    fen_div.classList.add("fen");

    let input = document.createElement("input");
    input.value = "   rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    input.classList.add("input_entry")

    let button_person_vs_person = document.createElement("button");
    button_person_vs_person.innerHTML = "Person vs Person";
    button_person_vs_person.classList.add("options");
    button_person_vs_person.style.left = "10vw"
    button_person_vs_person.onclick = () => {
        window.fen = input.value.trim();
        BuildBoard();
    }
    let button_person_vs_engine_white = document.createElement("button");
    button_person_vs_engine_white.innerHTML = "Person Vs Engine (white)";
    button_person_vs_engine_white.classList.add("options");
    button_person_vs_engine_white.style.left = "30vw"
    button_person_vs_engine_white.onclick = () => {
        window.fen = input.value.trim();
        window.chess_engine_color = "b";
        BuildBoard();
    }

    let button_person_vs_engine_black = document.createElement("button");
    button_person_vs_engine_black.innerHTML = "Person Vs Engine (black)";
    button_person_vs_engine_black.classList.add("options");
    button_person_vs_engine_black.style.left = "50vw"

    let button_engine_vs_engine = document.createElement("button");
    button_engine_vs_engine.innerHTML = "Engine Vs Engine";
    button_engine_vs_engine.classList.add("options");
    button_engine_vs_engine.style.left = "70vw"

    BOARD_CONTAINER.appendChild(fen_div);
    BOARD_CONTAINER.appendChild(input)
    BOARD_CONTAINER.appendChild(button_person_vs_person)
    BOARD_CONTAINER.appendChild(button_person_vs_engine_white)
    BOARD_CONTAINER.appendChild(button_person_vs_engine_black)
    BOARD_CONTAINER.appendChild(button_engine_vs_engine)
}

createMainMenu()



