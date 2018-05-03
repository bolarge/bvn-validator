/**
 * Created by nonami on 24/04/2018.
 */
const phantom = require('phantom');
const Promise = require('bluebird');
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
let queue = [];
let isLoginInProgress = false;


function redirectOn302(body, response, resolveWithFullResponse) {

  console.log('response code', response.statusCode);

  if (response.headers['set-cookie']) {
    cookie = response.headers['set-cookie'].join("");
    cookie = cookie.split(";")[0];
  }

  if (response.statusCode === 302) {
    console.log(response.headers);
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


function makeRequest(path, method, formData, cookie) {
  const options = {
    uri: baseUrl + path,
    method: method,
    followRedirect: true,
    resolveWithFullResponse: true,
    transform: redirectOn302,
    headers: {
      Host: 'bvnvalidationportal.nibss-plc.com.ng',
      // Connection: 'keep-alive',
      // 'Content-Length': 13,
      Pragma: 'no-cache',
      // 'Cache-Control': 'no-cache',
      Origin: 'https://bvnvalidationportal.nibss-plc.com.ng',
      'Upgrade-Insecure-Requests': 1,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.3',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      Referer: 'https://bvnvalidationportal.nibss-plc.com.ng/bvnnbo/bank/user/search',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
    }
  };

  if (formData) {
    options.form = formData;
  }

  if (cookie) {
    options.headers.Cookie = cookie;
  }

  return rp(options);
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


const doLogin = async (action, args) => {

  queue.push(action);

  if (!isLoginInProgress) {
    isLoginInProgress = true;
    let page = await initPage();
    const status = await page.open(baseUrl + '/bvnnbo/bank/user/search');

    if (status !== 'success') {
      throw new Error('Could not connect to portal, ' + status)
    }

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

    page = await pageLoad(page, PageChecker.isBvnSearchPage, 'Could not log into portal');
    const cookieArray = await page.property('cookies');
    if (cookieArray.length) {
      cookie = cookieArray[0].name + '=' + cookieArray[0].value;
    } else {
      throw new Error('Cookie not found');
    }
    queue.forEach((cb) => {
      cb();
    });
    queue.splice(0, queue.length);
    isLoginInProgress = false;
  }
};


const doBvnSearch = async (bvn) => {
  const formData = {bvn};
  return makeRequest('/bvnnbo/bank/user/search', 'POST', formData, cookie);
};


const doNimcSearch = async (params) => {
  const formData = {idNo: params.idNumber, type: params.idType === 'documentNo' ? '1' : '0'};
  return makeRequest('/bvnnbo/bank/user/nimc', 'POST', formData, cookie);
};


const initPage = async () => {
  return POOL.use(async (phantomInstance) => {
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

    pageInstance.on('onConsoleMessage', function (msg) {
      console.info(msg);
    });

    pageInstance.setting("resourceTimeout", TIMEOUT_SECONDS * 1000);

    console.log('Init complete', moment().format());
    return pageInstance;
  });
};


module.exports.resolveBvn = async (bvn) => {

  const response = await doBvnSearch(bvn);
  if (await PageChecker.isResultNotFoundPage(response.body)) {
    const maskedBvn = "******" + bvn.substr(6);
    console.log('BVN not found:', 'NIBSS:', maskedBvn);
    return null;
  }

  if (PageChecker.isLoginPage(response.body)) {
    return new Promise((resolve, reject) => {
      doLogin(() => {
        return module.exports.resolveBvn(bvn)
          .then((data) => {
            resolve(data);
          })
          .catch((err) => {
            reject(err);
          })
      })
        .catch((err) => reject(err));
    });
  }

  const result = parsers.parseBvnResult(response.body);
  result.provider = module.exports.name;
  return result;

};


module.exports.fetchNimcData = async (idNumber, idType) => {

  const response = await doNimcSearch({idNumber, idType});

  if (await PageChecker.isResultNotFoundPage(response.body)) {
    const masked = "******" + idNumber.substr(6);
    console.log('NIMC data not found:', 'NIBSS:', masked, idType);
    return null;
  }

  if (PageChecker.isLoginPage(response.body)) {
    return new Promise((resolve, reject) => {
      doLogin(() => {
        return module.exports.fetchNimcData(idNumber, idType)
          .then((data) => {
            resolve(data);
          })
          .catch((err) => {
            reject(err);
          })
      })
        .catch((err) => reject(err));
    });
  }

  const result = parsers.parseNimcResult(response.body);
  result.provider = module.exports.name;
  result.idNumber = idNumber;
  result.idType = idType;
  return result;

};

module.exports.name = 'nibss';