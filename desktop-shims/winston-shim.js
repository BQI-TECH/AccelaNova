// Minimal winston shim to satisfy usage in logger; delegates to console.
class ConsoleTransport { }
const format = {
    combine: () => ({}),
    colorize: () => ({}),
    printf: (fn) => fn,
};

function createLogger() {
    return {
        info: console.log.bind(console),
        error: console.error.bind(console),
        warn: console.warn.bind(console),
        transports: {},
    };
}

module.exports = {
    createLogger,
    format,
    transports: { Console: ConsoleTransport },
};























