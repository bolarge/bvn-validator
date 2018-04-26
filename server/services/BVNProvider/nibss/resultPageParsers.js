/**
 * Created by nonami on 25/04/2018.
 */

const {JSDOM} = require('jsdom');
const bvnSchema = require('./schema').bvnSchema;
const ninSchema = require('./schema').ninSchema;
const moment = require('moment');


const isDateData = (dataKey) => {
  return ['registrationDate', 'dob'].includes(dataKey);
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
  console.log(items.length);
  for (let i = 2; i < items.length - 1; i++) {
    const cells = items[i].cells;
    const key = map.get(cells[0].textContent.trim());
    let content = cells[1].textContent.trim();
    if (isDateData(key)) {
      content = moment(content, "DD-MMM-YY").format('YYYY-MM-DD');
    }
    result[key] = content;
  }

  const img = tbl.querySelector('img');
  result.bvn = items[1].cells[2].textContent.trim();
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
      content = moment(content, "DD-MM-YYYY").format('YYYY-MM-DD');
    }
    result[key] = content;
  }

  const img = tbl.querySelector('img');
  result.img = img.src;

  return result;
};
