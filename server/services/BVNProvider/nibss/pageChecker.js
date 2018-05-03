/**
 * Created by nonami on 25/04/2018.
 */

const {JSDOM} = require('jsdom');

const PageChecker = module.exports;

module.exports.isLoginPage = (content) => {
  const jsDom = new JSDOM(content);
  const el = jsDom.window.document.querySelector('input[name="username"]');
  return !!el;
};


module.exports.isBvnSearchPage = (content) => {
  const jsDom = new JSDOM(content);
  const el = jsDom.window.document.querySelector('form[action="/bvnnbo/bank/user/search"]');
  return !!el;
};


module.exports.isNimcSearchPage = (content) => {
  const jsDom = new JSDOM(content);
  const el = jsDom.window.document.querySelector('form[action="/bvnnbo/bank/user/nimc"]');
  return !!el;
};


module.exports.isLoggedInPage = (content) => {
  return PageChecker.isBvnSearchPage(content) || PageChecker.isNimcSearchPage(content);
};


module.exports.isResultPage = (content) => {

  if (PageChecker.isResultNotFoundPage(content)) {
    return true;
  }

  const jsDom = new JSDOM(content);
  const div = jsDom.window.document.getElementById('no-more-tables');
  if (!div) {
    return false;
  }

  const tbl = div.querySelector('table');
  return !!tbl;
};


module.exports.isResultNotFoundPage = (content) => {
  return /No results found/i.test(content)
    || /Invalid BVN/i.test(content)
    || /Record not found/i.test(content);
};
