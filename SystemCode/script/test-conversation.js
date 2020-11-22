const readline = require('readline');
const { DOMParser } = require('xmldom');
const xpath = require('xpath');
const { Session } = require('../src/session.js');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const ask = question => new Promise(resolve => rl.question(question, answer => resolve(answer)));

(async () => {
    const session = new Session;
    for (let q = ''; ;) {
        q = xpath.select(
            'string(//Message)',
            new DOMParser().parseFromString(await session.handle(await ask(q)))
        ) + '\n';
    }
})();
