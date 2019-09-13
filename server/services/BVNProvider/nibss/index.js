/**
 * Created by nonami on 24/04/2018.
 */
const Promise = require('bluebird');
const httpLib = require('../../../lib/http-lib');

const PageChecker = require('./pageChecker');
const parsers = require('./resultPageParsers');
const config = require('../../../../config');

const TIMEOUT_SECONDS = config.nibss.portal.timeout; // Seconds per page load
const moment = require('moment');
const createPhantomPool = require('phantom-pool');
const rp = require('request-promise');


const baseUrl = config.nibss.portal.baseUrl;
const POOL = createPhantomPool(config.nibss.portal.poolConfig);


let cookie = '';

function redirectOn302(body, response, resolveWithFullResponse) {

  if (response.statusCode === 302) {
    // Set the new url (this is the options object)
    this.uri = isUrls(response.headers.location) ? response.headers.location : baseUrl + response.headers.location;
    this.method = 'GET';
    return rp(this);
  }

  return resolveWithFullResponse ? response : response.body;
}

const isUrls = (str) => {
  return /http/.test(str);
};

function submitFormRequest(path, formData) {
  return httpLib.postForm(baseUrl + path, formData, {
    Origin: 'https://bvnvalidationportal.nibss-plc.com.ng',
    Cookie: `${cookie}`,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/538.1 (KHTML, like Gecko) PhantomJS/2.1.1 Safari/538.1',
    Referer: baseUrl + '/bvnnbo/bank/user/search',
  }).then((data) => {
    return {body: data}
  });
}


const pageLoad = async (page, isCond, errorMessage, checks = 0) => {
  while (checks < TIMEOUT_SECONDS * 2) {
    await Promise.delay(500);
    ++checks;
    if (await isCond(await page.property('content'))) {
      return page;
    }
  }

  throw new Error(errorMessage || 'page time out');
};


const processLogin = async () => {
  let {page} = await initPage();

  page.property('onResourceRequested', function (requestData, networkRequest) {
    var shouldStop = /\.(css|js)$/.test(requestData.url);
    if (shouldStop) {
      networkRequest.abort();
    }
  });

  const status = await page.open(baseUrl + '/bvnnbo/bank/user/search');
  let startTime = Date.now();

  if (status !== 'success') {
    return Promise.reject(new Error('Could not connect to portal, ' + status));
  }

  console.log('Login is being started...');
  await page.evaluate(function (params) {
    // Page context
    var loginForm = document.querySelector('form[action="/bvnnbo/login.stuff"]');
    if (!loginForm) {
      console.error("No log in form found, exiting");
      return;
    }
    console.log(navigator.userAgent);
    loginForm.elements['username'].value = params.username;
    loginForm.elements['password'].value = params.password;
    HTMLFormElement.prototype.submit.call(loginForm);
  }, {
    username: config.nibss.portal.user,
    password: config.nibss.portal.password
  });

  try {
    page = await pageLoad(page, PageChecker.isLoggedInPage, 'Could not log into portal');
    const cookieArray = await page.property('cookies');
    if (cookieArray.length) {
      return Promise.resolve(cookie = (cookieArray[0].name + '=' + cookieArray[0].value).trim());
    } else {
      return Promise.reject(new Error('Login could not be completed, no cookie found'));
    }
  } catch (loadErr) {
    return Promise.reject(loadErr);
  } finally {
    console.log('Cookie: ', cookie);
    console.log(`Login completed after ${(Date.now() - startTime) / 1000}s`);
    page.close().then(() => console.log('Phantom Page closed'))
      .catch((err) => console.log('Could not complete page close'));
  }
};


let loginPromise;
const doLogin = () => {
  if (loginPromise) {
    console.log('Login already in progress...');
    return loginPromise;
  }

  loginPromise = processLogin();
  //on completion clear reference to promise
  loginPromise.then(() => loginPromise = null)
    .catch(() => loginPromise = null);

  return loginPromise;
};


const doBvnSearch = async (bvn) => {
  console.log(bvn, 'Performing BVN search');
  const formData = {bvn};
  return submitFormRequest('/bvnnbo/bank/user/search', formData);
};


const doDlSearch = async (dlNumber) => {
  console.log(dlNumber, 'Performing DL search');
  const formData = {dlNumber};
  return submitFormRequest('/bvnnbo/bank/user/frsc', formData);
};


const doNimcSearch = async (params) => {
  const formData = {idNo: params.idNumber, type: params.idType === 'documentNo' ? '1' : '0'};
  return submitFormRequest('/bvnnbo/bank/user/nimc', formData);
};


const initPage = async () => {
  return POOL.use(async (phantomInstance) => {

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

    pageInstance.on('onConsoleMessage', function (msg) {
      console.info(msg);
    });

    pageInstance.setting("resourceTimeout", TIMEOUT_SECONDS * 1000);

    console.log('Init complete', moment().format());
    return {page: pageInstance, phantomInstance};
  });
};


module.exports.resolveBvn = async (bvn) => {
  try {
    let response;
    if (cookie) {
      response = await doBvnSearch(bvn);
    }

    if (!cookie ||
        (response && (PageChecker.isLoginPage(response.body) || !PageChecker.isResultPage(response.body)))) {
      await doLogin();
      response = await doBvnSearch(bvn);
    }

    if (!PageChecker.isResultPage(response.body)) {
      console.error('Fatal unexpected, BVN:', bvn, parsers.parseErrorMessage(response.body));
      return Promise.reject(new Error('BVN Search failed'));
    }


    if (PageChecker.isResultNotFoundPage(response.body)) {
      const maskedBvn = "******" + bvn.substr(6);
      console.log('BVN not found:', 'NIBSS:', maskedBvn);
      console.error('Error: ', parsers.parseErrorMessage(response.body));
      return null;
    }

    const result = parsers.parseBvnResult(response.body);
    result.provider = module.exports.name;
    return result;
  } catch (e) {
    console.error("Failed to complete request:", e.message, e.stack);
    return Promise.reject(e);
  }

};


/**
 * Drivers Licence search
 *
 * @param dlNumber
 * @returns {Promise.<*>}
 */
module.exports.fetchDlData = async (dlNumber) => {
  try {
    let response;
    if (cookie) {
      response = await doDlSearch(dlNumber);
    }

    if (!cookie ||
        (response && (PageChecker.isLoginPage(response.body) || !PageChecker.isResultPage(response.body)))) {
      await doLogin();
      response = await doDlSearch(dlNumber);
    }

    if (!PageChecker.isResultPage(response.body)) {
      console.error('Fatal unexpected, DL:', dlNumber, parsers.parseErrorMessage(response.body));
      return Promise.reject(new Error('Drivers licence Search failed'));
    }


    if (PageChecker.isResultNotFoundPage(response.body)) {
      const maskedDlNumber = "******" + dlNumber.substr(6);
      console.log('DL not found:', 'NIBSS:', maskedDlNumber);
      console.error('Error: ', parsers.parseErrorMessage(response.body));
      return null;
    }

    const result = parsers.parseDlResult(response.body);
    result.provider = module.exports.name;
    return result;
  } catch (e) {
    console.error("Failed to complete request:", e.message, e.stack);
    return Promise.reject(e);
  }

};


module.exports.fetchNimcData = async (idNumber, idType) => {

  let response;

  if (cookie) {
    response = await doNimcSearch({idNumber, idType});
  }

  if (!cookie || (response && PageChecker.isLoginPage(response.body))) {
    await doLogin();
    response = await doNimcSearch({idNumber, idType});
  }

  if (!PageChecker.isResultPage(response.body)) {
    console.error('Fatal unexpected, ID:', idNumber, parsers.parseErrorMessage(response.body));
    throw new Error('NIMC Search failed');
  }

  if (PageChecker.isResultNotFoundPage(response.body)) {
    const masked = "******" + idNumber.substr(6);
    console.log('NIMC data not found:', 'NIBSS:', masked, idType);
    console.error('Error: ', parsers.parseErrorMessage(response.body));
    return null;
  }

  const result = parsers.parseNimcResult(response.body);
  result.provider = module.exports.name;
  result.idNumber = idNumber;
  result.idType = idType;
  return result;

};

module.exports.name = 'nibss';


doLogin().then(() => console.log('Login completed'))
  .catch((err) => console.log('Login failed: ', err));

const clearPool = function (event) {
  if (POOL) {
    console.log('Clearing pool of PhantomJS process, event =', event);
    POOL.drain().then(() => {
      POOL.clear();
    });
  }
  return true;
};


if (require('os').platform() !== 'darwin') {
  [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
    process.on(eventType, clearPool.bind(null, eventType));
  });
}

