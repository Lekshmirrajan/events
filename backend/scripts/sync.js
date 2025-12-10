// quick db sync script
const { initDb } = require('../models');

initDb().then(() => {
  console.log('OK');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
