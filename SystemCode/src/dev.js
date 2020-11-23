const ngrok = require('ngrok');
const { main } = require('../src/main.js');

const port = 5000;

(async () => {
    const url = await ngrok.connect(port);
    main(port, () => console.log(`Server is running on ${url}`));
})();
