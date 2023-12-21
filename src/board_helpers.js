import { Colors } from "./board.js";

const formatMiliSecond = (miliSec) => `${Math.floor(miliSec / MinuteToMilliSecond)}.${Math.floor((miliSec % 60000) / SecondToMilliSecond)}`
const MinuteToMilliSecond = 60000;
const SecondToMilliSecond = 1000;

class newRoundEventInfos {
    /**
     * @param {Move} move 
     * @param {Piece} piece 
     * @param {Colors[keyof Colors]} color
     * @param {Square} targetSquare 
     * @param {string} fen 
     */
    constructor(move, piece, color, targetSquare, fen) {
        this.move = move;
        this.piece = piece;
        this.color = color;
        this.targetSquare = targetSquare;
        this.fen = fen;
    }
}

class TimeDiv {
    /**
    * @param {HTMLDivElement} imgDiv
    * @param {HTMLDivElement} timeDiv
    * @param {Colors[keyof Colors]} color
    * @param {Number} totalTime,
    */
    constructor(imgDiv, timeDiv, color, totalTime) {
        this.updateTimeInterval       = 200;
        this.imgDiv                   = imgDiv
        this.timeDiv                  = timeDiv;
        this.totalTime                = totalTime;
        this.imgDiv.style.visibility  = "visible";
        this.timeDiv.style.visibility = "visible";
        this.timeDiv.innerHTML        = formatMiliSecond(totalTime);
        this.pastTimes                = [totalTime]
        this.color                    = color;
        this.currentInterval          = null;
    }
    getCurrentTime() { return this.pastTimes.at(-1); }
    
    /**
     * @param {newRoundEventInfos} newRoundInfos
     */
    newRound(newRoundInfos) {
        if (newRoundInfos.color == this.color) this.startTime() 
        else this.stopTime();
    }

    startTime() {
        this.currentInterval = setInterval(() => {
            const currentTime = this.getCurrentTime() - 200;
            this.pastTimes.push(currentTime)
            this.timeDiv.innerHTML = formatMiliSecond(currentTime);
        }, 200);
    }
    
    stopTime() {
        clearInterval(this.currentInterval);
        this.currentInterval = null;
    }

    terminate() {
        this.imgDiv.style.visibility  = "hidden";
        this.timeDiv.style.visibility = "hidden";
    }
}



export { TimeDiv, newRoundEventInfos }