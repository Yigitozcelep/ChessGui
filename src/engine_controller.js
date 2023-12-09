const invoke = window.__TAURI__.invoke
const listen = window.__TAURI__.event.listen;
const baseDirectory = window.__TAURI__.path.BaseDirectory;
const readDir = window.__TAURI__.fs.readDir;
const createDir = window.__TAURI__.fs.createDir;
const getAppDataDir = window.__TAURI__.path.appDataDir;



async function readEngines() {
    let appDataDir = await getAppDataDir()
    try {
        let res = await readDir('ChessEngines', { dir: baseDirectory.AppData, recursive: true });
    } catch {
        await createDir('ChessEngines', { dir: baseDirectory.AppData, recursive: true });
    }
}

readEngines();


invoke("initialize_communication");

class searchData {
    constructor() {
        this.wtime = this.btime = this.winc = this.binc = this.depth = this.nodes = null;
        this.mate = this.infinite = false;
    }
    setWtime(wtime) { this.wtime    = wtime;  return this;    }
    setBtime(btime) { this.btime    = btime;  return this;    }
    setWinc(winc)   { this.winc     = winc;   return this;    }
    setBinc(binc)   { this.binc     = binc;   return this;    }
    setDepth(depth) { this.depth    = depth;  return this;    }
    setNodes(nodes) { this.nodes    = nodes;  return this;    }
    setSearchMate() { this.mate     = true;   return this;    }
    setSearchInf()  { this.infinite = true;   return this;    }
}

const EngineController = {
    _engines: [],

    getEngineNames() {return this._engines},

    async findBestMove(id, position, searchData, observer) {
        let unlisten = await listen("best_move_listener_id" + id, (res) => {
            console.log(res);
            unlisten()
        });
        invoke("find_best_move", {id: id, position: position, searchData: searchData });
    },
    
    async getPefts(id, position, depth, observer) {
        let unlisten = await listen("perft_listener_id" + id, (res) => {
            
            unlisten()
        });
        invoke("search_perft", {id: id, position: position, depth: depth});
    },

    async getMoves(id, position, observer) {
        let unlisten = await listen("perft_listener_id" + id, (res) => {
            let data = Object.keys(res.payload).filter(pos => pos != "total");
            unlisten()
        });
        invoke("search_perft", {id: id, position: position, depth: 1});
    },

    async uciTest(id, observer) {
        let unlisten = await listen("uci_listener_id" + id, (res) => {
            unlisten();
        })
        invoke("uci_test", {id: id});
    },

    async stopOperation(id) { invoke("stop_operation", {id: id}) },

    async unpipe(id) { invoke("drop_pipe",   {id: id}) },

    async pipe(id)   { invoke("pipe_engine", {id: id}) }
}

export { EngineController, searchData };