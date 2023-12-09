import { EngineController } from "./engine_controller.js";

const invoke = window.__TAURI__.invoke
const listen = window.__TAURI__.event.listen;

const BOARD = document.getElementById("board")
const FILES = ["a","b","c","d","e","f","g","h"]


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

class BoardController {
    constructor() {

    }
}
