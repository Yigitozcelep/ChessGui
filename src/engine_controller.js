const invoke = window.__TAURI__.invoke
const listen = window.__TAURI__.event.listen;


invoke("initialize_communication");
invoke("get_engine_names").then((res) => {
    for (let i = 0; i < res.length; i++) {
        EngineController.engines.push(res[i])
        invoke("add_unpiped_engine", {id: i, path: "./src/engines/" + res[i]});
    }
})

const EngineController = {
    engines: [],
    async findBestMove(id, position, observer) {
        let unlisten = await listen("best_move_listener_id" + id, (res) => {
            unlisten()
        });
        invoke("find_best_move", {id: id, position: position});
    },
    
    async getPefts(id, position, depth, observer) {
        let unlisten = await listen("perft_listener_id" + id, (res) => {
            for (let key in res.payload) {
                console.log(key, res.payload[key]);
            }
            unlisten()
        });
        invoke("search_perft", {id: id, position: position, depth: depth});
    },

    async getMoves(id, position, observer) {
        let unlisten = await listen("perft_listener_id" + id, (res) => {
            let data = []
            for (let key in res.payload) {
                if (key ===  "Nodes searched") continue;
                data.push(key);
            }
            unlisten()
        });
        invoke("search_perft", {id: id, position: position, depth: 1});
    },

    async uciTest(id, observer) {
        let unlisten = await listen("uci_listener_id" + id, (res) => {
            console.log(res);
            unlisten();
        })
        invoke("uci_test", {id: id});
    },

    async unpipe(id) { invoke("drop_pipe",   {id: id}) },

    async pipe(id)   { invoke("pipe_engine", {id: id}) }
}

setTimeout(() => {
    EngineController.pipe(0);
    EngineController.getPefts(0, "startpos", 3);
}, 200);

export { EngineController };