const { name, version } = require('../package.json');
const os = require('os');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch').default;
const { Workbook } = require('exceljs');
const probe = require('probe-image-size');

const root = path.join(os.tmpdir(), 'rent-bot');
const creator = `${name.split('-').map(s => `${s[0].toUpperCase()}${s.slice(1)}`).join('')} v${version}`;
const ext = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/gif': 'gif'
};

exports.root = root;

/**
 * @param {string} id
 * @param {import('./scraper.js').Property} param1
 */
exports.createExcel = async (id, {
    price, sqm, sqft, detail: { name, desc, info, facilities: fc_ls, map, photos }
}) => {
    const outdir = path.join(root, id);
    fs.existsSync(outdir) || fs.mkdirSync(outdir, { recursive: true });
    const out = path.join(outdir, `${name}.xlsx`);
    if (fs.existsSync(out)) {
        return `xlsx/${id}/${name}.xlsx`;
    }
    const wb = new Workbook;
    wb.creator = wb.lastModifiedBy = creator;
    wb.created = wb.modified = new Date;
    const desc_ws = wb.addWorksheet('Description', { properties: { defaultColWidth: 16, defaultRowHeight: 16 } });
    desc_ws.getColumn(1).width = 128;
    desc_ws.getColumn(1).alignment = { vertical: 'middle', wrapText: true };
    desc_ws.getRow(2).height = 320;
    desc_ws.getCell(1, 1).value = name;
    desc_ws.getCell(1, 1).font = { bold: true };
    desc_ws.getCell(2, 1).value = desc;
    let row = 2;
    (await Promise.all((await Promise.all([map, ...photos].map(url => fetch(url)))).map(
        /** @returns {Promise<[Buffer, 'png' | 'jpeg' | 'gif']>} */
        async res => [await res.buffer(), ext[res.headers.get('content-type')] || 'png']
    ))).forEach(([buffer, extension]) => {
        const { width, height } = probe.sync(buffer);
        desc_ws.addImage(wb.addImage({ buffer, extension }), {
            tl: { col: 0, row },
            ext: { width, height }
        });
        row += height / 16;
    });
    const info_ws = wb.addWorksheet('Info', { properties: { defaultColWidth: 16, defaultRowHeight: 16 } });
    const info_ls = [['Price', `${price}`], ['Size', `${sqm} sqm, ${sqft} sqft`], ...Object.entries(info)];
    const info_rows = Math.ceil(info_ls.length / 4);
    const info_tb = info_ws.addTable({
        name: 'Information',
        ref: 'A1',
        headerRow: false,
        columns: JSON.parse(`[${Array(4).fill('{"name":"key"},{"name":"value"}').join(',')}]`),
        rows: [...Array(info_rows)].map((_, i) => info_ls.slice(i * 4, (i + 1) * 4).flat())
    });
    // @ts-ignore
    [1, 3, 5, 7].forEach(i => info_tb.getColumn(i).style = { font: { bold: true } });
    info_tb.commit();
    const fc_tb = info_ws.addTable({
        name: 'Facilities',
        ref: `A${info_rows + 2}`,
        headerRow: false,
        columns: JSON.parse(`[${Array(8).fill('{"name":"value"}').join(',')}]`),
        rows: [...Array(Math.ceil(fc_ls.length / 8))].map((_, i) => fc_ls.slice(i * 8, (i + 1) * 8))
    });
    // @ts-ignore
    [1, 3, 5, 7].forEach(i => fc_tb.getColumn(i).style = { font: { bold: true } });
    fc_tb.commit();
    await wb.xlsx.writeFile(out);
    return `xlsx/${id}/${name}.xlsx`;
};
