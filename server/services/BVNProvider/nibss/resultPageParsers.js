/**
 * Created by nonami on 25/04/2018.
 */

const {JSDOM} = require('jsdom');
const bvnSchema = require('./schema').bvnSchema;
const ninSchema = require('./schema').ninSchema;
const dlSchema = require('./schema').dlSchema;
const moment = require('moment');


const isDateData = (dataKey) => {
    return ['registrationDate', 'dob'].includes(dataKey);
};

const convertDate = (content) => {
    let dateFmt;
    if (/\d{1,2}-[a-zA-Z]{3}-\d{4}/.test(content)) {
        dateFmt = "DD-MMM-YYYY";
    } else if (/\d{1,2}-[a-zA-Z]{3}-\d{2}/.test(content)) {
        dateFmt = "DD-MMM-YY";
    } else if (/\d{1,2}-\d{2}-\d{4}/.test(content)) {
        dateFmt = "DD-MM-YYYY";
    } else if (/\d{4}-\d{1,2}-\d{1,2}/.test(content)) {
        dateFmt = "YYYY-MM-DD";
    } else {
        throw new Error(`Unexpected date format. ${content}`)
    }
    return moment(content, dateFmt).format('YYYY-MM-DD');
};

module.exports.parseBvnResult = (content) => {
    const map = new Map();
    Object.keys(bvnSchema).forEach(key => {
        map.set(key, bvnSchema[key]);
    });

    const result = {};
    const jsDom = new JSDOM(content);
    const div = jsDom.window.document.getElementById('no-more-tables');
    if (!div) {
        return false;
    }
    const tbl = div.querySelector('table');
    const items = tbl.rows;

    for (let i = 2; i < items.length - 1; i++) {
        const cells = items[i].cells;
        const key = map.get(cells[0].textContent.trim());
        let content = cells[1].textContent.trim();
        if (isDateData(key)) {
            content = convertDate(content);
        }
        result[key] = content;
    }

    const img = tbl.querySelector('img');
    result.bvn = items[1].cells[2].textContent.trim();
    result.img = img.src;

    return result;
};


module.exports.parseDlResult = (content) => {
    const map = new Map();
    Object.keys(dlSchema).forEach(key => {
        map.set(key, dlSchema[key]);
    });

    const result = {};
    const jsDom = new JSDOM(content);
    const div = jsDom.window.document.getElementById('no-more-tables');
    if (!div) {
        return false;
    }
    const tbl = div.querySelector('table');
    const items = tbl.rows;

    for (let i = 2; i < items.length - 1; i++) {
        const cells = items[i].cells;
        const key = map.get(cells[0].textContent.trim());
        let content = cells[1].textContent.trim();
        if (isDateData(key)) {
            content = convertDate(content);
        }
        result[key] = content;
    }

    const img = tbl.querySelector('img');
    result.img = img.src;

    return result;
};


module.exports.parseNimcResult = (content) => {
    const map = new Map();
    Object.keys(ninSchema).forEach(key => {
        map.set(key, ninSchema[key]);
    });

    const result = {};
    const jsDom = new JSDOM(content);
    const div = jsDom.window.document.getElementById('no-more-tables');
    if (!div) {
        return false;
    }
    const tbl = div.querySelector('table');
    const items = tbl.rows;
    console.log(items.length);
    for (let i = 2; i < items.length - 1; i++) {
        const cells = items[i].cells;
        const key = map.get(cells[0].textContent.trim());
        let content = cells[1].textContent.trim();
        if (isDateData(key)) {
            content = convertDate(content);
        }
        result[key] = content;
    }

    const img = tbl.querySelector('img');
    result.img = img.src;

    return result;
};


module.exports.parseErrorMessage = (content) => {
    const jsDom = new JSDOM(content);
    const div = jsDom.window.document.querySelector("div[style='color:red']");
    if (div) {
        return div.textContent;
    }
    return null;
};
