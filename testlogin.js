/**
 * Created by nonami on 02/05/2018.
 */
const NIBSS = require('./server/services/BVNProvider/nibss');

NIBSS.login()
  .then((cookie) => console.log(cookie))
  .finally(() => process.exit());