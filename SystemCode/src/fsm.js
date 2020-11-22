const { createMachine } = require('@xstate/fsm');
const MessagingResponse = require('twilio/lib/twiml/MessagingResponse');
const { createExcel } = require('./excel.js');
const { createPDF } = require('./pdf.js');
const { propertyList, propertyDetail } = require('./scraper.js');

/** @typedef {import('./scraper.js').Property} Property */

class Context {
    /** @type {Property} */
    get property() {
        return this.properties[this.idx];
    }

    constructor() {
        this._reset();
        this.idx = this.page = 0;
        /** @type {Property[] | Promise<Property[]>} */
        this.properties = [];
        this.msgs = {
            welcome: `Hello, this is Joey, your renting virtual assistant, I am here to help you find a dream residence~
I am still a very young robot, so please type one question at a time. Now let's start!
Could you please describe your criteria? (e.g. location, price)`,
            ask_location: 'Where would you like to rent?',
            ask_price: 'How much are you willing to pay for the tenancy?',
            ask_detail: 'Would you like to provide some more detail about your desired residence?',
            ask_type: 'Which kind of residence do you want? (e.g. HDB, Condo, Landed)',
            ask_built_year: "What's your preferred constructed year of the residence?",
            list: `Which one would you like to learn more? \
Please type its name or number (e.g. \`\`\`/1\`\`\`).
If none of these residences match your need, you can type \`\`\`/next\`\`\` to other candidates, \
or type \`\`\`/search\`\`\` to adjust your criteria.`,
            end: 'Hope I have helped you, bye~'
        };
        this.reasons = {
            default: 'Whooops, I cannot understand what you said. Please rephrase and try again.',
            out_of_range: 'Whoops, it seems that the index is too large. Please try with a smaller one.'
        };
        this.reason = '';
    }

    /**
     * @param {string | ((twiml: MessagingResponse) => Promise<any>)} msg
     */
    respond(msg) {
        const twiml = new MessagingResponse;
        /** @type {string | Promise<string>} */
        this.response = typeof msg === 'string' ?
            (twiml.message(msg), twiml.toString()) :
            msg(twiml).then(() => twiml.toString());
    }

    _reset() {
        this.location = '';
        this.hasPrice = false;
        this.opt = this.type = undefined;
    }

    _handleLocation({ location }) {
        /** @type {string} */
        this.location = this.location || Object.values(location).filter(x => x).join(' ');
        return false;
    }

    _handlePrice({ minRentPrice, maxRentPrice, rentPrice }) {
        /** @type {import('./scraper.js').SearchOpt} */
        this.opt = rentPrice ?
            { minRentPrice: rentPrice - 100, maxRentPrice: rentPrice + 100, ...this.opt } :
            { minRentPrice, maxRentPrice, ...this.opt };
        this.hasPrice = undefined !== rentPrice;
        return false;
    }

    /**
     * @param {number} idx
     */
    _desc(idx) {
        const { title, price, sqm, sqft, room } = this.properties[idx];
        return `*${idx + 1}.${title}*\nPrice: $${price}\nSize: ${sqm} sqm, ${sqft} sqft\nRooms: ${room}`;
    }
};

const page_size = 3;
const ask_price = { target: 'ask_price', cond: ctx => !ctx.hasPrice };
const ask_location = { target: 'ask_location', cond: ctx => !ctx.location };
const search = {
    target: 'list', actions: ctx => {
        ctx.page = 0;
        ctx.properties = propertyList(ctx.location, ctx.opt, ctx.type);
    }
};
const criteria = {
    LOCATION: [
        { cond: (ctx, ev) => ctx._handleLocation(ev) },
        ask_price, 'ask_detail'
    ],
    PRICE: [
        { cond: (ctx, ev) => ctx._handlePrice(ev) },
        ask_location, 'ask_detail'
    ],
    LOCATION_PRICE: [
        { cond: (ctx, ev) => ctx._handleLocation(ev) || ctx._handlePrice(ev) },
        ask_location, ask_price, 'ask_detail'
    ],
    END: 'end'
};
const view = {
    INFO: [
        { target: 'info', cond: (ctx, ev) => +ev.idx < ctx.properties.length && (ctx.idx = +ev.idx, true) },
        { cond: ctx => (ctx.reason = 'out_of_range', false) }
    ],
    NEXT: { target: 'list', actions: ctx => ctx.page++ },
    SEARCH: { target: 'ask_location', actions: ctx => ctx._reset() },
    END: 'end'
};

exports.fsm = createMachine({
    context: new Context,
    initial: 'begin',
    states: {
        begin: { on: { WELCOME: 'welcome', ...criteria } },
        welcome: { on: criteria },
        ask_location: { on: criteria },
        ask_price: { on: criteria },
        ask_detail: { on: { DETAIL: 'ask_type', NO_DETAIL: search, END: 'end' } },
        ask_type: {
            on: {
                // @ts-ignore
                PROPERTY_TYPE: { target: 'ask_built_year', actions: (ctx, { propertyType }) => ctx.type = propertyType },
                END: 'end'
            }
        },
        ask_built_year: {
            on: {
                BUILT_YEAR: [
                    {
                        cond: (ctx, { builtYearMin, builtYearMax }) =>
                            (ctx.opt = { builtYearMin, builtYearMax, ...ctx.opt }, false)
                    },
                    search
                ],
                BUILT_YEAR_ANY: search,
                END: 'end'
            }
        },
        list: {
            entry: ctx => ctx.respond(async twiml => {
                (ctx.properties instanceof Array ? ctx.properties : ctx.properties = await ctx.properties)
                    .slice(ctx.page * page_size, (ctx.page + 1) * page_size)
                    .forEach(({ thumbnail, }, i) =>
                        twiml.message(ctx._desc(i + ctx.page * page_size)).media(thumbnail));
                twiml.message(ctx.msgs.list);
            }),
            on: view
        },
        info: {
            entry: ctx => ctx.respond(async twiml => {
                const { facilities, map, photos } = ctx.property.detail || (await propertyDetail(ctx.property)).detail;
                twiml.message(`${ctx._desc(ctx.idx)}\n${'—'.repeat(22)}
*Features:*\n${facilities.map(f => `+ ${f}`).join('\n')}`).media(map);
                photos.forEach(photo => twiml.message('').media(photo));
            }),
            on: {
                EXCEL: {
                    cond: (ctx, { id, base_url }) => (ctx.respond(async twiml => {
                        const url = new URL(await createExcel(id, ctx.property), base_url).toString();
                        // FIXME: Twilio currently does not support sending xlsx through WhatsApp
                        twiml.message(url);
                    }), false)
                },
                PDF: {
                    cond: (ctx, { id, base_url }) => (ctx.respond(async twiml =>
                        twiml.message('').media(new URL(await createPDF(id, ctx.property), base_url).toString())
                    ), false)
                },
                ...view
            }
        },
        end: {}
    }
});
