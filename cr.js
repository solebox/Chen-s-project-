var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var fs = require('fs');

var START_URL = "http://forecast.israelinfo.co.il/?gclid=Cj0KCQiAuZXQBRDKARIsAMwpUeQV-938UDavA90tNe1jcSdn1mkRMOXG4SCa0P0Yp65gDgDkT_iUB-kaAj6aEALw_wcB";
var MAX_PAGES_TO_VISIT = 10;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;
var results = [];

pagesToVisit.push(START_URL);
crawl();

function crawl() {
  if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
    console.log("Reached max limit of number of pages to visit.");
    console.log(results);
      fs.writeFile("./output.json", JSON.stringify(results), function(err){
            if (err) {
                    console.log(err);
            }
      });
    return;
  }
  var nextPage = pagesToVisit.pop();
  if (nextPage in pagesVisited) {
    // We've already visited this page, so repeat the crawl
    crawl();
  } else {
    // New page we haven't visited
    visitPage(nextPage, crawl);
  }
}

function visitPage(url, callback) {
  // Add page to our set
  pagesVisited[url] = true;
  numPagesVisited++;

  // Make the request
//  console.log("Visiting page: " + url);
  request(url, function(error, response, body) {
     // Check status code (200 is HTTP OK)
     //console.log("Status code: " + response.statusCode);
     if(response.statusCode !== 200) {
       callback();
       return;
     }
     // Parse the document body"
     var json = {
       "temperature": "",
       "title": "no",
       "windspeed": "",
       "humidity": "",
       "url": ""
     }
     var $ = cheerio.load(body);
     var isWordFound = false;
     if (url.indexOf("city") > -1 ){
         // console.log("scraping url: " + url);
        json.url = url;
        isWordFound = searchForWords($,json );
      }
     if(!isWordFound) {
       collectInternalLinks($);
       callback();

     } else {
     }
  });
}

function searchForWords($, json) {
    json.title = $("span.changeCity").text();
    json.temperature = $('span.tBig').children().eq(0).text();

    $('.dl-horizontal').filter(function(){

      var data = $(this);


    json.humidity= $('.dl-horizontal > dd').eq(1).text()

    })
    $('.dl-horizontal').filter(function(){

      var data = $(this);

    json.windspeed= $('.dl-horizontal>dd').eq(0).children().eq(0).text();

    if (json.title){
      results.push(json);
      return true;
    }else{
      return false;
    }

  })

        }


function collectInternalLinks($) {
    var relativeLinks = $("a[href^='/']");
    console.log("Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function() {
        pagesToVisit.push(baseUrl + $(this).attr('href'));
    });
}
