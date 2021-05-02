class command {
    constructor(prefix, description, category, callback) {
        this.prefix = prefix;
        this.description = description;
        this.category = category;
        this.run = callback;
    }
}

exports.command = command;