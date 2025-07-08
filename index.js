const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer-core');

const app = express();
app.use(bodyParser.json());

const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

app.get('/', (req, res) => {
  res.send('PetPocketBot is live');
});

app.post('/webhook', async (req, res) => {
  const { first_name, last_name, email } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ status: 'error', message: 'Missing data' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: '/usr/bin/google-chrome-stable' // default Render path
    });

    const page = await browser.newPage();

    await page.goto('https://www.petpocketbook.com/login', { waitUntil: 'networkidle2' });
    await page.type('input[name="email"]', USERNAME);
    await page.type('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    await page.goto('https://www.petpocketbook.com/add-client/client-search', { waitUntil: 'networkidle2' });
    await page.type('input[name="emailSearch"]', email);
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')];
      const invite = buttons.find(b => b.textContent.includes('Invite to join'));
      if (invite) invite.click();
    });

    await page.waitForSelector('input[name="firstName"]', { timeout: 5000 });
    await page.type('input[name="firstName"]', first_name);
    await page.type('input[name="lastName"]', last_name);
    await page.type('input[name="email"]', email);

    await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')];
      const invite = buttons.find(b => b.textContent.includes('Invite'));
      if (invite) invite.click();
    });

    await browser.close();
    res.json({ status: 'success' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
