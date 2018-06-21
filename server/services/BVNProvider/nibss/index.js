/**
 * Created by nonami on 24/04/2018.
 */
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


function makeRequest(path, method, formData, cookie) {
  const options = {
    uri: baseUrl + path,
    method: method,
    followRedirect: true,
    resolveWithFullResponse: true,
    transform: redirectOn302,
    headers: {
      Origin: 'https://bvnvalidationportal.nibss-plc.com.ng',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.3',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      Referer: baseUrl + '/bvnnbo/bank/user/search',
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


const processLogin = async (callback) => {
  queue.push(callback);
  let err = null;
  if (!isLoginInProgress) {
    isLoginInProgress = true;
    let {page, phantomInstance} = await initPage();
    const status = await page.open(baseUrl + '/bvnnbo/bank/user/search');

    if (status !== 'success') {
      err = new Error('Could not connect to portal, ' + status)
    } else {
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

      try {
        page = await pageLoad(page, PageChecker.isBvnSearchPage, 'Could not log into portal');
        const cookieArray = await page.property('cookies');
        if (cookieArray.length) {
          cookie = cookieArray[0].name + '=' + cookieArray[0].value;
        } else {
          err = new Error('Login could not be completed, no cookie found');
        }
      } catch (loadErr) {
        err = loadErr;
      }

    }
    isLoginInProgress = false;
    queue.forEach((cb) => {
      cb(err, cookie);
    });

    queue.splice(0, queue.length);
    await page.close();
  }
};

const doLogin = () => {
  return new Promise((resolve, reject) => {
    processLogin((err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
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

  let response = await doBvnSearch(bvn);

  if (PageChecker.isLoginPage(response.body)) {
    await doLogin();
    response = await doBvnSearch(bvn);
  }

  if (!PageChecker.isResultPage(response.body)) {
    throw new Error('BVN Search failed');
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

};


module.exports.fetchNimcData = async (idNumber, idType) => {

  let response = await doNimcSearch({idNumber, idType});


  if (PageChecker.isLoginPage(response.body)) {
    await doLogin();
    response = await doNimcSearch({idNumber, idType});
  }

  if (!PageChecker.isResultPage(response.body)) {
    throw new Error('NIMC Search failed');
  }

  if (PageChecker.isResultNotFoundPage(response.body)) {
    const masked = "******" + idNumber.substr(6);
    console.log('NIMC data not found:', 'NIBSS:', masked, idType);
    return null;
  }

  const result = parsers.parseNimcResult(response.body);
  result.provider = module.exports.name;
  result.idNumber = idNumber;
  result.idType = idType;
  return result;

};

module.exports.name = 'nibss';


const clearPool = function (event) {
  if (POOL) {
    console.log('Clearing pool of PhantomJS process, event =', event);
    POOL.drain().then(() => {
      POOL.clear();
    });
  }
};

[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
  process.on(eventType, clearPool.bind(null, eventType));
});
