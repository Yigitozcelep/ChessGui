import { Colors } from "./board.js";

const formatMiliSecond = (miliSec) => `${Math.floor(miliSec / MinuteToMilliSecond)}.${Math.floor((miliSec % 60000) / SecondToMilliSecond)}`
const MinuteToMilliSecond = 60000;
const SecondToMilliSecond = 1000;


class TimeDiv {
    /**
    * @param {HTMLDivElement} imgDiv
    * @param {HTMLDivElement} timeDiv
    * @param {Colors[keyof Colors]} color
    * @param {Number} totalTime,
    */
    constructor(imgDiv, timeDiv, color, totalTime) {
        this.imgDiv                   = imgDiv
        this.timeDiv                  = timeDiv;
        this.totalTime                = totalTime;
        this.imgDiv.style.visibility  = "visible";
        this.timeDiv.style.visibility = "visible";
        this.timeDiv.innerHTML        = formatMiliSecond(totalTime);
    }
    
    terminate() {
        this.imgDiv.style.visibility  = "hidden";
        this.timeDiv.style.visibility = "hidden";
    }
}



export { TimeDiv }