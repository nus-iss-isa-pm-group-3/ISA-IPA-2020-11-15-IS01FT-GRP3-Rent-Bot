const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const { Session } = require('./session.js');

const host = '127.0.0.1';
/** @type {Map<string, Session>} */
const sessions = new Map;
const content_types = {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf'
};
const pt_uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const pt_ct = Object.keys(content_types).join('|');
const re_file = new RegExp(String.raw`^/(?<ext>${pt_ct})/(?<id>${pt_uuid})/(?<name>[^/]+\.\1)$`);

/**
 * @param {http.ServerResponse} res
 */
const error = res => (console.error('request not supported'), res.writeHead(404, 'Resource not found').end());

/**
 * @param {() => void} callback
 */
const main = async (port = 5000, callback = undefined) => {
    http.createServer(async (req, res) => {
        const buf = [];
        console.debug(`\nMethod: ${req.method}\nURL: ${req.url}\nHeaders:
${Object.entries(req.headers).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n`);
        req.on('data', chunk => buf.push(chunk));
        await new Promise((resolve, reject) => (req.on('end', resolve), req.on('error', reject)));
        const body = Buffer.concat(buf).toString();
        console.debug(`${body}\n`);
        if ('/' === req.url && 'POST' === req.method) {
            const { From: k, Body: msg } = 'application/json' === req.headers['content-type'] ?
                JSON.parse(body) :
                Object.fromEntries(new URLSearchParams(body).entries());
            const session = sessions.get(k) || sessions.set(k, new Session).get(k);
            session.baseUrl || (session.baseUrl = `https://${req.headers.host}`);
            const xml = await session.handle(msg);
            console.debug(xml);
            res.writeHead(200, { 'content-type': 'text/xml' }).end(xml);
            if ('end' === session.state) {
                sessions.delete(k);
            }
        } else if (re_file.test(req.url) && !req.url.includes('..') && 'GET' == req.method) {
            const { ext, id, name } = req.url.match(re_file).groups;
            res.writeHead(200, {
                'content-type': content_types[ext],
                'content-disposition': `attachment; filename="${name}"`
            }).end(await fs.readFile(path.join(
                os.tmpdir(), 'virtual-renting-assistant', id, decodeURIComponent(name)
            )));
        } else {
            error(res);
        }
    }).listen({ host, port }, callback || (() => console.log(`Server is running on http://${host}:${port}`)));
};

exports.main = main;

if (require.main === module) {
    main(+process.argv[2] || undefined);
}
