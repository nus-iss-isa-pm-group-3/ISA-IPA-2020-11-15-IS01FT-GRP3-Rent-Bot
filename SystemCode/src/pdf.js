const { name, version } = require('../package.json');
const os = require('os');
const path = require('path');
const fs = require('fs');
const PdfPrinter = require('pdfmake');
const fetch = require('node-fetch').default;

const creator = `${name.split('-').map(s => `${s[0].toUpperCase()}${s.slice(1)}`).join('')} v${version}`;
const printer = new PdfPrinter({
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
});
const cols = 4;

/**
 * @param {string} id
 * @param {import('./scraper.js').Property} param1
 */
exports.createPDF = async (id, {
    price, sqm, sqft, detail: { name, desc, info, facilities: fc_ls, map, photos }
}) => {
    const outdir = path.join(os.tmpdir(), 'virtual-renting-assistant', id);
    fs.existsSync(outdir) || fs.mkdirSync(outdir, { recursive: true });
    const out = path.join(outdir, `${name}.pdf`);
    if (fs.existsSync(out)) {
        return `pdf/${id}/${name}.pdf`;
    }
    const info_ls = [['Price', `$${price}`], ['Size', `${sqm} sqm, ${sqft} sqft`], ...Object.entries(info)].map(
        ([k, v]) => [{ text: k, bold: true }, v]
    ).flat();
    const info_rows = Math.ceil(info_ls.length / cols);
    const fc_rows = Math.ceil(fc_ls.length / cols);
    const pdf = printer.createPdfKitDocument({
        info: {
            title: name,
            author: creator,
            subject: name,
            creator,
            producer: creator,
            creationDate: new Date,
            modDate: new Date
        },
        pageSize: 'LETTER',
        content: [
            { text: name, style: 'header' },
            desc,
            { text: 'Information', style: 'subheader' },
            {
                table: {
                    body: [...Array(info_rows)].map((_, r) => [...Array(cols)].map((_, c) =>
                        info_ls[r * 2 + c % 2 + info_rows * (c - c % 2)] || ''))
                },
                layout: 'noBorders'
            },
            { text: 'Facilities', style: 'subheader' },
            {
                columns: [...Array(cols)].map((_, i) => ({
                    ul: fc_ls.slice(i * fc_rows, (i + 1) * fc_rows).map(fc => ({ text: fc, bold: true }))
                }))
            },
            { text: 'Location', style: 'subheader', pageBreak: 'before' },
            // @ts-ignore
            { width: 532, image: await (await fetch(map)).buffer() },
            { text: 'Photos', style: 'subheader', pageBreak: 'before' },
            // @ts-ignore
            ...await Promise.all(photos.map(async url => ({ width: 532, image: await (await fetch(url)).buffer() })))
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            subheader: {
                fontSize: 16,
                bold: true,
                margin: [0, 10, 0, 5]
            },
        },
        defaultStyle: {
            font: 'Helvetica'
        }
    });
    const stream = pdf.pipe(fs.createWriteStream(out));
    pdf.end();
    await new Promise((resolve, reject) => (stream.on('finish', resolve), stream.on('error', reject)));
    return `pdf/${id}/${name}.pdf`;
};
