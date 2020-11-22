const fetch = require('node-fetch').default;
const { JSDOM } = require('jsdom');

/**
 * @typedef {{
 *     minRentPrice: number,
 *     maxRentPrice: number,
 *     builtYearMin?: number,
 *     builtYearMax?: number
 * }} SearchOpt
 */

/**
 * @typedef {{
 *     thumbnail: string,
 *     title: string,
 *     price: number,
 *     sqm: number,
 *     sqft: number,
 *     room: string,
 *     recency: Date,
 *     detail_url: string
 *     detail?: {
 *         name: string,
 *         desc: string,
 *         info: {[key: string]: string},
 *         facilities: string[],
 *         map: string,
 *         photos: string[]
 *     }
 * }} Property
 */

const base_url = 'https://www.stproperty.sg/search/rent/';
const js_url = 'https://www.stproperty.sg/srx/version/v4/js/dist/listingdetails/listingdetails.js';
const gm_api = {
    key: '',
    time: new Date().getTime()
};
const map_url = 'https://maps.googleapis.com/maps/api/staticmap';
const marker_url = 'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2.png';
const headers = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'accept-language': 'en-US,zh-CN;q=0.9,en,zh;q=0.8,*;q=0.5',
    'cache-control': 'no-cache',
    'dnt': 1,
    'pragma': 'no-cache',
    'referer': base_url,
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4307.0 Safari/537.36 Edg/88.0.692.0'
};

/**
 * @param {string} location
 * @param {SearchOpt} opt
 * @param {string} type
 */
exports.propertyList = async (location, opt, type = 'residential') => {
    /** @type {Property[]} */
    const properties = [];
    const url = new URL(`${type}/${location}`, base_url);
    Object.entries({ orderCriteria: 'datePostedDesc', ...opt }).forEach(([k, v]) => url.searchParams.set(k, `${v}`));
    const earliest_date = new Date(new Date().toDateString());
    earliest_date.setDate(earliest_date.getDate() - 14);
    page:
    for (let i = 1; ; i++) {
        url.searchParams.set('page', `${i}`);
        console.debug(`scraping ${url}`);
        // @ts-ignore
        const response = await fetch(url, { headers });
        if (200 !== response.status || response.redirected) {
            break;
        }
        const { document } = new JSDOM(await response.text()).window;
        const listings = [...document.querySelectorAll('.listingContainer')];
        if (!listings.length) {
            break;
        }
        for (const e of listings) {
            const recency = new Date(+e.querySelector('.listing-date-posted').getAttribute('data-date') * 1000);
            if (recency < earliest_date) {
                break page;
            }
            const [value, unit] = e.querySelector('.listingDetailValues').textContent.replace(
                /([\d,]+) sq(m|ft)/, (_, p1, p2) => `${p1.replace(',', '')} ${p2}`
            ).split(' ');
            const rooms = [];
            if (e.querySelector('.listingDetailRoomNo')) {
                rooms.push(+e.querySelector('.listingDetailRoomNo').textContent + ' Beds');
            }
            if (e.querySelector('.listingDetailToiletNo')) {
                rooms.push(+e.querySelector('.listingDetailToiletNo').textContent + ' Baths');
            }
            properties.push({
                thumbnail: new URL(
                    e.querySelector('.listingPhoto').getAttribute('listing-photo').split('?')[0]
                ).toString(),
                title: e.querySelector('.listingDetailTitle').textContent.trim(),
                price: +e.querySelector('.listingDetailPrice').textContent.replace(/[$,]/g, ''),
                sqm: 'm' === unit ? +value : Math.round(+value / 10.76391041671 * 100) / 100,
                sqft: 'ft' == unit ? +value : Math.round(+value * 10.76391041671 * 100) / 100,
                room: rooms.join(', '),
                recency,
                detail_url: new URL(e.querySelector('.listingDetailsDivLink').getAttribute('href'), base_url).toString()
            });
        }
        if (document.querySelector('#listingResultPagination .active:last-child')) {
            break;
        }
    }
    return properties;
};

/**
 * @param {Property} property
 */
exports.propertyDetail = async property => {
    console.debug(`scraping ${property.detail_url}`);
    // @ts-ignore
    const { document } = new JSDOM(await (await fetch(property.detail_url, { headers })).text()).window;
    const url = new URL(map_url);
    Object.entries({
        size: '640x640',
        markers: `icon:${marker_url}|\
${document.querySelector('#listing-latitude').getAttribute('value')},\
${document.querySelector('#listing-longitude').getAttribute('value')}`,
        key: (new Date().getTime() - gm_api.time) < 3600000 && gm_api.key ||
            (gm_api.time = new Date().getTime(),
                gm_api.key = (await (await fetch(js_url)).text()).split('key=')[1].split('&')[0])
    }).forEach(([k, v]) => url.searchParams.set(k, v));
    property.detail = {
        name: document.querySelector('.listing-name').textContent.trim(),
        desc: document.querySelector('.listing-description').textContent.trim(),
        info: Object.fromEntries([...document.querySelectorAll('.listing-about')].map(e => [
            '.listing-about-main-key', '.listing-about-main-value'
        ].map(s => e.querySelector(s).textContent.trim())).filter(([k]) => !/^Asking|Size|PSF$/.test(k))),
        facilities: [...document.querySelectorAll('.listing-about-facility-span')].map(e => e.textContent.trim()),
        map: url.toString(),
        photos: [...document.querySelectorAll('.photo-box-item')]
            .map(e => new URL(e.getAttribute('data-url')).toString()).slice(0, 9)
    };
    return property;
};
