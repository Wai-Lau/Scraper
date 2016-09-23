"use strict";

var loadInProgress = false;
var page = require('webpage').create(),
    system = require('system'),
    t, address;
page.viewportSize = {
  width: 1920,
  height: 1080
};
page.settings.userAgent = "Mozilla/5.0 (Windows NT 6.0) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.41 Safari/535.1";
page.settings.javascriptEnabled = true;
page.settings.loadImages = false;

page.onConsoleMessage = function(msg) {
  console.log(msg);
};
page.onLoadStarted = function() {
    loadInProgress = true;
};
page.onLoadFinished = function() {
    loadInProgress = false;
};

var action = [
    function openPage(){
    address = "http://www.concordia.ca/academics/undergraduate/calendar/current/sec71/71-70.html#b71.70.10";
    //address = "http://www.concordia.ca/academics/undergraduate/calendar/current/sec71/71-60.html";
        page.open(address, function (status) {
            if (status !== 'success') {
                console.log('FAIL to load the address');
                phantom.exit();
            } else {
                console.log('Page Loaded. \n' + page.evaluate(function () {
                    return document.title;
                }));      
            }
        });
    },
    
    function scrape(){
        page.includeJs(
        "https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js", 
            dataString = page.evaluate(
                function() {
                    console.log("Pulling data...");
                    var stuff = $("div[class='parbase section wysiwyg']");
                    var output = "";
                    for (var i = 0; i < stuff.length; i++)
                        output += stuff[i].innerHTML;
                    return output;
                }
            )
        );
        loadInProgress = false;
    },
    
    function write(){
        stringArray = dataString.match(/((\s*|)<b>(COMP|SOEN|ENGR|ENCS|COEN) \d\d\d)(.|\n)*?(?=((\s*|)<b>[A-Z][A-Z][A-Z][A-Z] \d\d\d))|$/g);
        
        for (var key in stringArray){
            if(stringArray[key].match(/Prerequisite:(([^\.]|\n)*?(\d\.\d\d)(.|\n)*?\.|([^\.]|\n)*?\.)/)){
                preArray[key] = stringArray[key].match(/Prerequisite:(([^\.]|\n)*?(\d\.\d\d)(.|\n)*?\.|([^\.]|\n)*?\.)/)[0].match(/[A-Z][A-Z][A-Z][A-Z] \d\d\d or \d\d\d|[A-Z][A-Z][A-Z][A-Z] \d\d\d or [A-Z][A-Z][A-Z][A-Z] \d\d\d|[A-Z][A-Z][A-Z][A-Z] \d\d\d|\d\d\d/g); 
            }
            else
                preArray[key] = [];
            
            for (var i in preArray[key]){
                if (!preArray[key][i].match(/[A-Z][A-Z][A-Z][A-Z]/))
                    preArray[key][i] = preArray[key][i-1].match(/[A-Z][A-Z][A-Z][A-Z]/)[0] + " " + preArray[key][i];
            }
                
                
            if(stringArray[key])
                stringArray[key] = stringArray[key].match(/[A-Z][A-Z][A-Z][A-Z] \d\d\d/);
        }
        
        
        
        for (var i in stringArray){
            OUT[i] = new Object;
            OUT[i]["course"] = stringArray[i];
            OUT[i]["prereq"] = preArray[i];
        }
        
        console.log(stringArray[0]);
        console.log(preArray[0]);
        console.log(stringArray[1]);
        console.log(preArray[1]);
        writeToFile(stringArray, preArray);
        phantom.exit();
    }
];

var dataString;
var stringArray = [];
var preArray = [];
var OUT = [];

function writeToFile(){
    if(OUT){
        try{
            var path = "out.txt";
            var content = "";
            content += JSON.stringify(OUT);
            console.log("Writing to file...");
            var fs = require('fs');
            fs.write(path, content, 'w');
        }catch(err){
            console.log("Write error.");
            phantom.exit();
        }
    }else{
        console.log("Empty dataString.");
        phantom.exit()
    }
}

console.log("Starting...");
var step = 0;
var interval = setInterval(
    function(){
        if (loadInProgress != true)
            {
                loadInProgress = true;
                action[step]();
                step++;
            }
        },
500); 
