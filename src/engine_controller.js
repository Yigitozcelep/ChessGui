
const invoke            = window.__TAURI__.invoke
const listen            = window.__TAURI__.event.listen;
const readDir           = window.__TAURI__.fs.readDir;
const createDir         = window.__TAURI__.fs.createDir;
const getAppDataDir     = window.__TAURI__.path.appDataDir;
const tauriOpen         = window.__TAURI__.dialog.open;
const getFileName       = window.__TAURI__.path.basename;
const removeFile        = window.__TAURI__.fs.removeFile;
const copyFile          = window.__TAURI__.fs.copyFile;
const osSpecificSep     = window.__TAURI__.path.sep;
const EngineFolderName  = "ChessEngines";
const START_POS         = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";


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
    _engineNames: [],
    
    getEngineNames()       {return this._engineNames},
    addNewEngineName(name) {this._engineNames.push(name)},
    removeEngineName(name) {this._engineNames =  this._engineNames.filter(engineName => engineName != name)},
    getEngineId(name)      {return this._engineNames.indexOf(name)},
    
    async getEnginesFolder() {
        return (await getAppDataDir()) + EngineFolderName + osSpecificSep;
    },

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

    async uciTest(id, observer) {
        let unlisten = await listen("uci_listener_id" + id, (res) => {
            unlisten();
        })
        invoke("uci_test", {id: id});
    },

    async stopOperation(id) { invoke("stop_operation", {id: id}) },

    async unpipe(id) { invoke("drop_pipe",   {id: id}) },

    async pipe(id)   { invoke("pipe_engine", {id: id}) },
    
    async saveEngine() {
        const sourcePath = await tauriOpen();
        const engineName = await getFileName(sourcePath);
        const targetPath = await this.getEnginesFolder() + engineName;
        copyFile(sourcePath, targetPath);
        invoke("add_unpiped_engine", {path: targetPath})
        this.addNewEngineName(engineName);
    },
    
    async initialie_engines() {
        await invoke("initialize_communication");
        let enginesFolder = await this.getEnginesFolder();
        try {
            let files = await readDir(enginesFolder);
            let engines = files.filter(file => !file.name.startsWith("."));
            
            for (let engine of engines) {
                this.addNewEngineName(engine.name);
                invoke("add_unpiped_engine", {path: engine.path});
            }
        } catch {
            await createDir(enginesFolder, { recursive: true });
        }
    },

    async deleteEngine() {
        let enginesFolder = await this.getEnginesFolder();
        try {
            const enginePath = await tauriOpen({defaultPath: enginesFolder, title: 'Delete', directory: false,});
            await removeFile(enginePath);
            const engineName = await getFileName(enginePath);
            const id = this.getEngineId(engineName);
            this.removeEngineName(engineName);
            invoke("delete_engine", {id: id})
            
        } catch { 

        }
    }
}

EngineController.initialie_engines();

export { EngineController, searchData };