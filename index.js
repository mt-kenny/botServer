require('dotenv').config();
const showPicked = require('./showPickedRestaurant').showPicked;
var express = require('express');
var request = require('request');
const bodyParser = require('body-parser');
const axios = require('axios');

// Store our app's ID and Secret. These we got from Step 1. 
// For this tutorial, we'll keep your API credentials right here. But for an actual app, you'll want to  store them securely in environment variables. 
var clientId = process.env.SLACK_CLIENT_ID;
var clientSecret = process.env.SLACK_CLIENT_SECRET;

// Instantiates Express and assigns our app variable to it
var app = express();


// Again, we define a port we want to listen to
const PORT=4390;

// Lets start our server
app.listen(PORT, function () {
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Example app listening on port " + PORT);
});


// This route handles GET requests to our root ngrok address and responds with the same "Ngrok is working message" we used before
app.get('/', function(req, res) {
    res.send('Ngrok is working! Path Hit: ' + req.url);
});

// This route handles get request to a /oauth endpoint. We'll use this endpoint for handling the logic of the Slack oAuth process behind our app.
app.get('/oauth', function(req, res) {
    // When a user authorizes an app, a code query parameter is passed on the oAuth endpoint. If that code is not there, we respond with an error message
    if (!req.query.code) {
        res.status(500);
        res.send({"Error": "Looks like we're not getting code."});
        console.log("Looks like we're not getting code.");
    } else {
        // If it's there...

        // We'll do a GET call to Slack's `oauth.access` endpoint, passing our app's client ID, client secret, and the code we just got as query parameters.
        request({
            url: 'https://slack.com/api/oauth.access', //URL to hit
            qs: {code: req.query.code, client_id: clientId, client_secret: clientSecret}, //Query string data
            method: 'GET', //Specify the method

        }, function (error, response, body) {
            if (error) {
                console.log(error);
            } else {
                res.json(body);
            }
        })
    }
});

const shuffle = (arr) => {
  let m = arr.length;
  while (m) {
    const i = Math.floor(Math.random() * m--);
    [arr[m], arr[i]] = [arr[i], arr[m]];
  }
  return arr;
};

const getJPSearchUrl = function() {
  const keyId = process.env.GURUNAVI_KEY_ID;
  // const place = { lati: '35.658118', long: '139.723798' };// Castalia
  const place = { lati: '35.658436', long: '139.726599' };// Between Castalia & BLINK
  const range = 3;// 1 = 600m
  const hit_per_page = 100;
  const url = `https://api.gnavi.co.jp/RestSearchAPI/v3/?keyid=${keyId}&latitude=${place.lati}&longitude=${place.long}&range=${range}&hit_per_page=${hit_per_page}&lunch=1`;
  return url;
}

const getForeignSearchUrl = function() {
  const lang = 'en';
  const keyId = process.env.GURUNAVI_KEY_ID;
  // const place = { lati: '35.658118', long: '139.723798' };// Castalia
  const place = { lati: '35.658436', long: '139.726599' };// Between Castalia & BLINK
  const range = 4;// 1:300m, 2:500m, 3:1,000m, 4:2,000m, 5:3,000m
  const hit_per_page = 100;
  const url = `https://api.gnavi.co.jp/ForeignRestSearchAPI/v3/?keyid=${keyId}&latitude=${place.lati}&longitude=${place.long}&range=${range}&hit_per_page=${hit_per_page}&lang=${lang}`;
  return url;
}

async function requestGurunavi() {
  try {
    const url = getJPSearchUrl();
    // const url = getForeignSearchUrl();
    const response = await axios.get(url);
    const shuffled = shuffle(response.data.rest);
    const pickNumber = 3;
    const picked = shuffled.slice(0, pickNumber);

    const result = picked.map((v) => {
      // tslint:disable-next-line: no-console
      // console.log('@@@ ', v.budget);
      // jp
      return {
        name: v.name,
        category: v.category,
        lunchBudget: v.lunch,
        url: v.url
      }

      // en
      // return {
      //   name: v.name.name,
      //   nameSub: v.name.name_sub,
      //   category: v.categories.category_name_l[v.categories.category_name_l.length-1],
      //   budget: v.budget,
      //   url: v.url
      // }
    });
    showPicked(result);

  } catch (error) {
    console.error(error);
  }
}

const urlencodedParser = bodyParser.urlencoded({ extended: false })

app.post('/command', urlencodedParser, function (req, res) {
  res.status(200).end()
  const payload = JSON.parse(req.body.payload)
  // console.log(payload)

  if (payload.callback_id && payload.callback_id == 'feeling_lucky') {
    requestGurunavi();
  }
});
