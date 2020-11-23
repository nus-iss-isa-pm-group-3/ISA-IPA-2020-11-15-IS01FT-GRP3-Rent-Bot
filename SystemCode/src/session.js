const uuid = require('uuid');
const df = require('@google-cloud/dialogflow');
const pb = require('pb-util');
const { interpret } = require('@xstate/fsm');
const { fsm } = require('./fsm.js');

exports.Session = class {
    /** @type {string} */
    get state() {
        return this._service.state.value;
    }

    get _ctx() {
        return this._service.state.context;
    }

    constructor() {
        this._id = uuid.v4();
        this._client = new df.SessionsClient;
        this._proj = 'rentagent-wuvr';
        this._path = this._client.projectAgentSessionPath(this._proj, this._id);
        this._contextualStates = [
            'ask_price',
            'ask_detail',
            'ask_built_year'
        ];
        this._init();
        this.baseUrl = '';
    }

    /**
     * @param {string} input
     */
    async handle(input) {
        if (input.startsWith('/')) {
            switch (input = input.slice(1)) {
                case 'search':
                case 'next':
                    this._service.send(input.toUpperCase());
                    break;
                case 'excel':
                case 'pdf':
                    // @ts-ignore
                    this._service.send({ type: input.toUpperCase(), id: this._id, base_url: this.baseUrl });
                    break;
                default:
                    // @ts-ignore
                    this._service.send(/^\d+$/.test(input) ? { type: 'INFO', idx: +input - 1 } : 'UNKNOWN');
            }
        } else {
            const [{
                queryResult: { action, parameters, fulfillmentText }
            }] = await this._client.detectIntent({
                session: this._path,
                queryInput: {
                    text: {
                        text: input,
                        languageCode: 'en'
                    }
                },
                queryParams: {
                    contexts: this._contextualStates.includes(this.state) ? [{
                        name: this._client.projectAgentSessionContextPath(
                            this._proj, this._id, this.state.split('ask_')[1]
                        ), lifespanCount: 1
                    }] : undefined
                }
            });
            // @ts-ignore
            this._service.send({ type: action, fulfillmentText, ...pb.struct.decode(parameters) });
        }
        const response = this._ctx.response;
        return delete this._ctx.response, response;
    }

    _init() {
        const service = interpret(fsm());
        service.subscribe(({ value, context: ctx, changed }) => {
            if ('begin' !== value && !ctx.response) {
                ctx.respond(`${changed ? '' : ctx.reasons[ctx.reason] || ctx.reasons.default}${ctx.msgs[value] || ''}`);
                delete ctx.reason;
            }
        });
        service.start();
        this._service = service;
    }
};
