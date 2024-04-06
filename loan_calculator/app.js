const HTTP = require('http');
const URL = require ('url').URL;
const QUERYSTRING = require('querystring');
const PATH = require('path');
const FS = require('fs');
const PORT = 3000;
const HANDLEBARS = require('handlebars');
const APR = 5;
const MIME_TYPES = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const LOAN_OFFER_SOURCE = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Loan Calculator</title>
    <link rel="stylesheet" href="/assets/css/styles.css">
  </head>
  <body>
    <article>
      <h1>Loan Calculator</h1>
      <table>
        <tbody>
          <tr>
            <th>Amount:</th>
            <td>
              <a href='/?amount={{amountDecrement}}&duration={{duration}}'>- $100</a>
            </td>
            <td>$ {{amount}}</td>
            <td>
              <a href='/?amount={{amountIncrement}}&duration={{duration}}'>+ $100</a>
            </td>
          </tr>
          <tr>
            <th>Duration:</th>
            <td>
              <a href='/?amount={{amount}}&duration={{durationDecrement}}'>- 1 year</a>
            </td>
            <td>{{duration}} years</td>
            <td>
              <a href='/?amount={{amount}}&duration={{durationIncrement}}'>+ 1 year</a>
            </td>
          </tr>
          <tr>
            <th>APR:</th>
            <td colspan='3'>{{apr}}%</td>
          </tr>
          <tr>
            <th>Monthly payment:</th>
            <td colspan='3'>$ {{payment}}</td>
          </tr>
        </tbody>
      </table>
    </article>
  </body>
</html>
`;

const LOAN_FORM_SOURCE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Loan Calculator</title>
    <link rel="stylesheet" href="/assets/css/styles.css">
  </head>
  <body>
    <article>
      <h1>Loan Calculator</h1>
      <form action="/loan-offer" method="post">
        <p>All loans are offered at an APR of {{apr}}%.</p>
        <label for="amount">How much do you want to borrow (in dollars)?</label>
        <input type="number" name="amount" id="amount" value="">
        <label for="duration">How much time do you want to pay back your loan?</label>
        <input type="number" name="duration" id="duration" value="">
        <input type="submit" name="" value="Get loan offer!">
      </form>
    </article>
  </body>
</html>
`;

const LOAN_OFFER_TEMPLATE = HANDLEBARS.compile(LOAN_OFFER_SOURCE);
const LOAN_FORM_TEMPLATE = HANDLEBARS.compile(LOAN_FORM_SOURCE);

function render(template, data) {
  let html = template(data);
  return html;
};

function parseFormData(request, callback) {
  let body = '';
    request.on('data', chunk => {
      body += chunk.toString();
    });

    request.on('end', () => {
      let data = QUERYSTRING.parse(body);
      data.amount = Number(data.amount);
      data.duration = Number(data.duration);
      callback(data);
    });
}

function getParams(path) {
  const url = new URL(`${path}`, `http://localhost:${PORT}`);

  let searchParams = url.searchParams;
  let data = {};
  data.amount = Number(searchParams.get('amount'));
  data.duration = Number(searchParams.get('duration'));

  return data;
}

function getPathname(path) {
  const myURL = new URL(path, `http://localhost:${PORT}`);
  return myURL.pathname;
};

function calculateMonthly(loanAmount, loanDuration, loanAPR) {
  const MONTHS_IN_A_YEAR = 12;
  const annualInterestRate = loanAPR / 100;
  const monthlyIntRate = annualInterestRate / MONTHS_IN_A_YEAR;
  loanDuration = loanDuration * MONTHS_IN_A_YEAR;

  const monthlyPayment =  loanAmount * 
    (monthlyIntRate / (1 - Math.pow((1 + monthlyIntRate), (-loanDuration)))); 

  return monthlyPayment.toFixed(2);
}

function createLoanOffer(data) {
  data.amountIncrement = data.amount + 100;
  data.amountDecrement = data.amount - 100;
  data.durationIncrement = data.duration + 1;
  data.durationDecrement = data.duration - 1;
  data.apr = APR;
  data.payment = calculateMonthly(data.amount, data.duration, APR);

  return data;
}


const SERVER = HTTP.createServer((req, res) => {
  const path = req.url;
  const pathname = getPathname(path);
  const fileExtension = PATH.extname(pathname);

  FS.readFile(`./public${pathname}`, (_err, data) => {
    if (_err) {
      console.log('\nRequest for:', pathname);
      console.log(_err);
    }

    if (data) {
      console.log('Request for:', pathname);
      res.statusCode = 200;
      res.setHeader('Content-Type', `${MIME_TYPES[fileExtension]}`);
      res.write(`${data}\n`);
      res.end();
    } else {
      const method = req.method;
      if (method === 'GET' && pathname === '/') {
        let content = render(LOAN_FORM_TEMPLATE, {apr : APR});

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.write(`${content}\n`);
        res.end();
      } else if (method === 'GET' && pathname === '/loan-offer') {
        let content = render(LOAN_OFFER_TEMPLATE, {apr: APR});

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.write(`${content}\n`);
        res.end();
      } else if (method === 'POST' && pathname === '/loan-offer') {
        parseFormData(req, parsedData => {
          let data = createLoanOffer(parsedData);
          let content = render(LOAN_OFFER_TEMPLATE, data);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html');
          res.write(`${content}\n`);
          res.end();
        });
      } else {
        res.statusCode = 404;
        res.end();
      }
    }
  });
});

SERVER.listen(PORT, () => {
  console.log('listening . . .');
});