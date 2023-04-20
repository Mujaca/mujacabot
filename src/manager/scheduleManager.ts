const activeRunners: Map<string, number> = new Map();

function addRunner(callback: Function, interval: number, name: string) {
    const id = setInterval(callback, interval);
    activeRunners.set(name, id);
}

function stopRunner(name: string){
    const id = activeRunners.get(name);
    if(id) clearInterval(id);
    activeRunners.delete(name);
}

function stopAllRunners(){
    activeRunners.forEach((value, key) => {
        clearInterval(value);
        activeRunners.delete(key);
    })
}

export default {
    addRunner,
    stopRunner,
    stopAllRunners
}