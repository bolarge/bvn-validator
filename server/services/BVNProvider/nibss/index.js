/**
 * Created by nonami on 24/04/2018.
 */
const phantom = require('phantom');
const Promise = require('bluebird');
const PageChecker = require('./pageChecker');
const parsers = require('./parsers');
const config = require('../../../../config');
const TIMEOUT_SECONDS = config.nibss.portal.timeout; // Seconds per page load
const moment = require('moment');


const baseUrl = config.nibss.portal.baseUrl;
const bvnSearchPath = '/bvnnbo/bank/user/search';
const ninSearchPath = '/bvnnbo/bank/user/nimc';


let phantomInstance;


const pageLoad = async (page, isCond, errorMessage, checks = 0) => {
  if (await isCond(page)) {
    return true;
  }
  if (checks < TIMEOUT_SECONDS * 2) {
    return Promise.delay(500)
      .then(() => pageLoad(page, isCond, errorMessage, ++checks));
  }

  console.log(await page.property('content'));
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

  await pageLoad(page, PageChecker.isSearchPage, 'Could not log into portal');
  return page;
};


const doBvnSearch = async (page, params) => {
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

  await pageLoad(page, PageChecker.isResultPage);
  return page;
};


const doNinSearch =  async (page, params) => {
  const result = await page.evaluate(function (params) {
    // Page context
    var form = document.querySelector('form[action="/bvnnbo/bank/user/nimc"]');
    if (!form) {
      console.error("No search form found");
      return;
    }
    form.elements['idNo'].value = params.nin;
    HTMLFormElement.prototype.submit.call(form);
  }, params);
  return page;
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
  const status = await page.open(baseUrl + bvnSearchPath);

  if (status !== 'success') {
    throw new Error('Could not connect to portal, ' + status)
  }

  if (await PageChecker.isLoginPage(page)) {
    console.log("------Login page-----", new Date());
    console.log('Doing log in');
    page = await doLogin(page);
  }

  try {
    page = await doBvnSearch(page, {bvn});
    if (await PageChecker.isResultNotFoundPage(page)) {
      return null;
    }
    const result =  parsers.parseBvnResult(await page.property('content'));
    result.provider = module.exports.name;
    return result;
  } finally {
    page.close();
  }
};


module.exports.fetchNinData = async (nin) => {

  let page = await initPage();
  let status = await page.open(baseUrl + ninSearchPath);

  if (await PageChecker.isLoginPage(page)) {
    console.log("------Login page-----", new Date());
    console.log('Doing log in');
    page = await doLogin(page);
    status = await page.open(baseUrl + ninSearchPath);
  }

  if (status !== 'success') {
    throw new Error('Could not connect to portal, ' + status)
  }

  page = await doNinSearch(page, {nin});

  if (await PageChecker.isResultNotFoundPage(page)) {
    return null;
  }

  const result = parsers.parseNinResult(await page.property('content'));
  result.provider = module.exports.name;
  return result;
};

module.exports.name = 'nibss';