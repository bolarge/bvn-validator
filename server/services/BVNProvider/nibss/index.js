/**
 * Created by nonami on 24/04/2018.
 */
const phantom = require('phantom');
const {JSDOM} = require('jsdom');
const Promise = require('bluebird');
const schema = require('./schema');
const moment = require('moment');
const config = require('../../../../config');
const TIMEOUT_SECONDS = config.nibss.portal.timeout; // Seconds per page load


const baseUrl = config.nibss.portal.baseUrl;
const searchPath = '/bvnnbo/bank/user/search';


let phantomInstance;


const isLoginPage = async (page) => {
  const jsDom = new JSDOM(await page.property('content'));
  const el = jsDom.window.document.querySelector('input[name="username"]');
  return !!el;
};

const isSearchPage = async (page) => {
  const content = await page.property('content');
  const jsDom = new JSDOM(await page.property('content'));
  const el = jsDom.window.document.querySelector('form[action="/bvnnbo/bank/user/search"]');
  return !!el;
};

const isResultPage = async (page) => {

  if (await isResultNotFoundPage(page)) {
    return true;
  }

  const jsDom = new JSDOM(await page.property('content'));
  const div = jsDom.window.document.getElementById('no-more-tables');
  if (!div) {
    return false;
  }

  const tbl = div.querySelector('table');
  return !!tbl;
};


const isResultNotFoundPage = async (page) => {
  const content = await page.property('content');
  return /No results found/i.test(content) || /Invalid BVN/i.test(content);
};


const pageLoad = async (page, isCond, errorMessage, checks = 0) => {
  while (checks < TIMEOUT_SECONDS * 2) {
    await Promise.delay(500);
    ++checks;
    if (await isCond(page)) {
      return page;
    }
  }

  throw new Error(errorMessage || 'page time out');
};


const doLogin = async (page) => {

  const result = await page.evaluate(function (params) {
    // Page context
    var loginForm = document.querySelector('form[action="/bvnnbo/login.stuff"]');
    if (!loginForm) {
      console.error("No log in form found, exiting");
      return;
    }
    loginForm.elements['username'].value = params.username;
    loginForm.elements['password'].value = params.password;
    HTMLFormElement.prototype.submit.call(loginForm);
  }, {
    username: config.nibss.portal.user,
    password: config.nibss.portal.password
  });

  return await pageLoad(page, isSearchPage, 'Could not log into portal');
};


const doSearch = async (page, params) => {
  const result = await page.evaluate(function (params) {
    // Page context
    var form = document.querySelector('form[action="/bvnnbo/bank/user/search"]');
    if (!form) {
      console.error("No search form found");
      return;
    }
    form.elements['bvn'].value = params.bvn;
    HTMLFormElement.prototype.submit.call(form);
  }, params);

  return await pageLoad(page, isResultPage);
};


const isDateData = (dataKey) => {
  return ['registrationDate', 'dob'].includes(dataKey);
};

const parseResult = async (content) => {
  const map = new Map();
  Object.keys(schema).forEach(key => {
    map.set(key, schema[key]);
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

  result.provider = module.exports.name;
  return result;
};


const initPage = async () => {
    if (!phantomInstance) {
      console.log('Creating instance', moment().format());
      phantomInstance = await phantom.create();
    }

    console.log('Creating page', moment().format());
    let pageInstance = await phantomInstance.createPage();

    pageInstance.on('onConfirm', function () {
      return true;
    });

    pageInstance.on("onResourceTimeout", function (err) {
      console.error(JSON.stringify(err));
    });

    pageInstance.on('onError', function (msg, trace) {
      const msgStack = [msg];
      trace.forEach(function (err) {
        msgStack.push(' -> ' + err.file + ': ' + err.line + (err.function ? ' (in function "' + err.function + '")' : ''));
      });
      console.error(msgStack.join('\n'));
    });

    pageInstance.setting("resourceTimeout", TIMEOUT_SECONDS * 1000);

    console.log('Init complete', moment().format());
    return pageInstance;
  }
;


module.exports.resolve = async (bvn) => {

  let page = await initPage();
  const status = await page.open(baseUrl + searchPath);

  if (status !== 'success') {
    throw new Error('Could not connect to portal, ' + status)
  }

  if (await isLoginPage(page)) {
    console.log("------Login page-----", new Date());
    console.log('Doing log in');
    page = await doLogin(page);
  }

  try {
    page = await doSearch(page, {bvn});
    if (await isResultNotFoundPage(page)) {
      return null;
    }
    return parseResult(await page.property('content'));
  } finally {
    page.close();
  }
};

module.exports.name = 'nibss';