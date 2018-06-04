const fs = require('fs');
const slugify = require('slugify');
const puppeteer = require('puppeteer');
const createPuppeteerPool = require('./pool');

let urls = fs.readFileSync('top10.txt').toString();
urls =  urls.split(/\n/).filter(x => !!x);


// (async () => {
//   const browser = await puppeteer.launch();
//
//   for (let url of urls) {
//     const page = await browser.newPage();
//     // page.setViewport({ width: 1400, height: 900 });
//     await page.goto(url, {waitUntil: 'networkidle2'});
//     const filename = slugify(url.replace(/http(s?):/, ''));
//     await page.screenshot({ path: `${filename}.png` });
//   }
//
//   await browser.close();
// })();

// Returns a generic-pool instance
const pool = createPuppeteerPool({
  max: 10, // default
  min: 2, // default
  // how long a resource can stay idle in pool before being removed
  idleTimeoutMillis: 3000, // default.
  // maximum number of times an individual resource can be reused before being destroyed; set to 0 to disable
  maxUses: 50, // default
  // function to validate an instance prior to use; see https://github.com/coopernurse/node-pool#createpool
  validator: () => Promise.resolve(true), // defaults to always resolving true
  // validate resource before borrowing; required for `maxUses and `validator`
  testOnBorrow: true, // default
  // For all opts, see opts at https://github.com/coopernurse/node-pool#createpool
  puppeteerArgs: []
})

// Automatically acquires a puppeteer instance and releases it back to the
// pool when the function resolves or throws
for (let url of urls) {
  pool.use(async (browser) => {
    const page = await browser.newPage()
    const status = await page.goto(url)
    if (!status.ok) {
      throw new Error('cannot open google.com')
    }
    const filename = slugify(url.replace(/http(s?):/, ''));
    await page.screenshot({ path: `${filename}.png` });
    await page.close();
  })
  .catch(err => {
    console.error(err);
  })
}

// Destroying the pool:
pool.drain().then(() => pool.clear())
