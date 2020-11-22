const { propertyList } = require('../src/scraper.js');

(async () => {
    (await propertyList('Pasir Panjang', { minRentPrice: 600, maxRentPrice: 1500 })).forEach(p => console.log(p));
})();
