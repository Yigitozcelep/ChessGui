import { Colors, eventTypes } from "./board.js";


class TimeDiv {
    /**
    * @param {HTMLDivElement} div
    * @param {Colors[keyof Colors]} color
    */
    constructor(div, color) {
        this.div = div
        this.div.style.visibility = "visible";
    }
    
    notify(event) {
        if      (event.type == eventTypes.quit.type) { this.div.style.visibility = "hidden";}
    }
}