/**
 * Created by nonami on 25/04/2018.
 */

const {JSDOM} = require('jsdom');

const PageChecker = module.exports;

module.exports.isLoginPage = async (page) => {
  const jsDom = new JSDOM(await page.property('content'));
  const el = jsDom.window.document.querySelector('input[name="username"]');
  return !!el;
};

module.exports.isSearchPage = async (page) => {
  const content  = await page.property('content');
  const jsDom = new JSDOM(await page.property('content'));
  const el = jsDom.window.document.querySelector('form[action="/bvnnbo/bank/user/search"]');
  return !!el;
};

module.exports.isNimcPage = async (page) => {
  const content  = await page.property('content');
  const jsDom = new JSDOM(await page.property('content'));
  const el = jsDom.window.document.querySelector('form[action="/bvnnbo/bank/user/nimc"]');
  return !!el;
};

module.exports.isLoggedInPage = async (page) => {
  return await PageChecker.isSearchPage(page) || await PageChecker.isNimcPage(page);
};

module.exports.isResultPage = async (page) => {

  if (await PageChecker.isResultNotFoundPage(page)) {
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


module.exports.isResultNotFoundPage = async (page) => {
  const content = await page.property('content');
  return /No results found/i.test(content)
    || /Invalid BVN/i.test(content)
    || /Record not found/i.test(content);
};
