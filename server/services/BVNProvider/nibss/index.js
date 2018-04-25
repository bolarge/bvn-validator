/**
 * Created by nonami on 24/04/2018.
 */
const phantom = require('phantom');
const Promise = require('bluebird');
const PageChecker = require('./pageChecker');
const parsers = require('./parsers');
const config = require('../../../../config');
const TIMEOUT_SECONDS = config.nibss.portal.timeout; // Seconds per page load


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
    document.createElement('form').submit.call(loginForm);
  }, {
    username: config.nibss.portal.user,
    password: config.nibss.portal.password
  });

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
    document.createElement('form').submit.call(form);
  }, params);
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
    document.createElement('form').submit.call(form);
  }, params);
  return page;
};

const initPage = async () => {
  let pageInstance;
  if (!phantomInstance) {
    console.log('Creating instance', new Date());
    phantomInstance = await phantom.create();
  }
  console.log('Creating page', new Date());
  pageInstance = await phantomInstance.createPage();

  pageInstance.property('onConfirm', function () {
    return true;
  });

  pageInstance.property("onResourceTimeout", function (err) {
    console.error(JSON.stringify(err));
  });

  pageInstance.property('onError', function (msg, trace) {
    const msgStack = [msg];
    trace.forEach(function (err) {
      msgStack.push(' -> ' + err.file + ': ' + err.line + (err.function ? ' (in function "' + err.function + '")' : ''));
    });
    console.error(msgStack.join('\n'));
  });

  pageInstance.setting("resourceTimeout", TIMEOUT_SECONDS * 1000);
  console.log('Ending init', new Date());

  return pageInstance;
};


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
    await pageLoad(page, PageChecker.isSearchPage, 'Could not log into portal');
  }

  page = await doBvnSearch(page, {bvn});
  await pageLoad(page, PageChecker.isResultPage);

  if (await PageChecker.isResultNotFoundPage(page)) {
    return null;
  }

  const result = parsers.parseBvnResult(await page.property('content'));
  result.provider = module.exports.name;
  return result;
};


module.exports.fetchNinData = async (nin) => {

  let page = await initPage();
  let status = await page.open(baseUrl + ninSearchPath);

  if (await PageChecker.isLoginPage(page)) {
    console.log("------Login page-----", new Date());
    console.log('Doing log in');
    page = await doLogin(page);
    await pageLoad(page, PageChecker.isLoggedInPage, 'Could not log into portal');
    status = await page.open(baseUrl + ninSearchPath);
  }

  if (status !== 'success') {
    throw new Error('Could not connect to portal, ' + status)
  }

  page = await doNinSearch(page, {nin});
  await pageLoad(page, PageChecker.isResultPage);

  if (await PageChecker.isResultNotFoundPage(page)) {
    return null;
  }

  const result = parsers.parseNinResult(await page.property('content'));
  result.provider = module.exports.name;
  return result;
};

module.exports.name = 'nibss';