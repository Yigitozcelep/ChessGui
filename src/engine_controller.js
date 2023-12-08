const invoke = window.__TAURI__.invoke
const listen = window.__TAURI__.event.listen;


invoke("initialize_communication");
invoke("get_engine_names").then((res) => {
    for (let i = 0; i < res.length; i++) {
        EngineController._engines.push(res[i])
        invoke("add_unpiped_engine", {id: i, path: "./src/engines/" + res[i]});
    }
})

class TimeHandlerBuilder {
    constructor()   { this.product = {mate: false, infinite: false} }
    setWtime(wtime) { this.product.wtime    = wtime;  return this;    }
    setBtime(btime) { this.product.btime    = btime;  return this;    }
    setWinc(winc)   { this.product.winc     = winc;   return this;    }
    setBinc(binc)   { this.product.binc     = binc;   return this;    }
    setDepth(depth) { this.product.depth    = depth;  return this;    }
    setNodes(nodes) { this.product.nodes    = nodes;  return this;    }
    setSearchMate() { this.product.math     = true;   return this;    }
    setSearchInf()  { this.product.infinite = true;   return this;    }
    build()         { return this.product;                            }
}

const EngineController = {
    _engines: [],

    getEngineNames() {return this._engines},

    async findBestMove(id, position, timeHandler, observer) {
        let unlisten = await listen("best_move_listener_id" + id, (res) => {
            console.log(res);
            unlisten()
        });
        invoke("find_best_move", {id: id, position: position, timeHandler: timeHandler });
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

export { EngineController };