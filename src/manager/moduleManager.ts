import { Module } from "../classes/module";

//TODO implement module manager

function registerModule(name: string, module: Module) {
    console.debug("Registering module: " + name);
}

export default {
    registerModule
}