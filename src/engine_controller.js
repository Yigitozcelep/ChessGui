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
    async findBestMove(id, listener) {
        invoke("find_best_move", {id: 0, position: "startpos"});
        let unlisten = await listen("best_move_listener_id" + id, (res) => {
            console.log(res);
        })
    },

    async getPefts(id, listener) {

    },

    async getMoves(id, listener) {

    },

    async uciTest(id, listener) {

    },

    async unpipe(id) {

    },

    async pipe(id) {
        invoke("")
    }
}

setTimeout(() => {
    EngineController.findBestMove(0, "");
}, 200);

export { EngineController };