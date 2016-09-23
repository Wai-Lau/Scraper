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
    //address = "http://www.concordia.ca/academics/undergraduate/calendar/current/sec71/71-70.html#b71.70.10";
    address = "http://www.concordia.ca/academics/undergraduate/calendar/current/sec71/71-60.html";
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
        stringArray = dataString.match(/((\s*|)<b>(\s*|)(COMP|SOEN|ENGR|ENCS|COEN) \d\d\d)(.|\n)*?(?=((\s*|)<b>[A-Z][A-Z][A-Z][A-Z] \d\d\d|$))/g);

        stringArray = stringArray.filter(checkNull);
        
        function checkNull(e){
            if (!/^\s*$/.test(e))
                return e;
        }
        
        function checkCourse(e){
            if (e != null && /[A-Z][A-Z][A-Z][A-Z] \d\d\d or \d\d\d|[A-Z][A-Z][A-Z][A-Z] \d\d\d or [A-Z][A-Z][A-Z][A-Z] \d\d\d|[A-Z][A-Z][A-Z][A-Z] \d\d\d|\d\d\d/.test(e))
                return e;
        }
        
        for (var key in stringArray){
            if(stringArray[key].match(/Prerequisite:(([^\.]|\n)*?(\d\.\d\d)(.|\n)*?\.|([^\.]|\n)*?\.)/)){
                preArray[key] = stringArray[key].match(/Prerequisite:(([^\.]|\n)*?(\d\.\d\d)(.|\n)*?\.|([^\.]|\n)*?\.)/)[0].match(/[A-Z][A-Z][A-Z][A-Z] \d\d\d or \d\d\d|[A-Z][A-Z][A-Z][A-Z] \d\d\d or [A-Z][A-Z][A-Z][A-Z] \d\d\d|[A-Z][A-Z][A-Z][A-Z] \d\d\d|\d\d\d/g); 
            }
            else
                preArray[key] = null;
            
            if(preArray[key])
                preArray[key] = preArray[key].filter(checkCourse);
            
            for (var i in preArray[key]){
                if (!preArray[key][i].match(/[A-Z][A-Z][A-Z][A-Z]/))
                    preArray[key][i] = preArray[key][i-1].match(/[A-Z][A-Z][A-Z][A-Z]/)[0] + " " + preArray[key][i];
                else if (preArray[key][i].match(/[A-Z][A-Z][A-Z][A-Z] \d\d\d or \d\d\d/)){                                      preArray[key][i] = preArray[key][i].replace(" or "," or " + preArray[key][i].match(/[A-Z][A-Z][A-Z][A-Z]/)[0] + " ");
                }
            }
            
            if(stringArray[key].match(/Prerequisite:(([^\.]|\n)*?(\d\.\d\d)(.|\n)*?\.|([^\.]|\n)*?\.)/)){
                coArray[key] = stringArray[key].match(/Prerequisite:(([^\.]|\n)*?(\d\.\d\d)(.|\n)*?\.|([^\.]|\n)*?\.)/)[0].split(/concurrently/); 
            }
            else
                coArray[key] = null;
            
            if (coArray[key])
                coArray[key] = coArray[key].filter(checkCourse);
            
            var empty = true;
            for (var i in coArray[key]){
                if (coArray[key][i].match(/[A-Z][A-Z][A-Z][A-Z] \d\d\d/)){
                    coArray[key][i] = coArray[key][i].match(/[A-Z][A-Z][A-Z][A-Z] \d\d\d/)[coArray[key][i].match(/[A-Z][A-Z][A-Z][A-Z] \d\d\d/).length-1];
                    empty = false;
                }
            }
            if (empty == true){
                coArray[key] = null;
            }else{
                empty = true;
            }
                
            if (stringArray[key])
                stringArray[key] = stringArray[key].match(/[A-Z][A-Z][A-Z][A-Z] \d\d\d/);
        }
        
        
        
        for (var i in stringArray){
            OUT[i] = new Object;
            OUT[i]["course"] = stringArray[i];
            OUT[i]["prereq"] = preArray[i];
            OUT[i]["coreq"] = coArray[i];
        }
        
        console.log("Course:            "+stringArray[0]);
        console.log("Prerequisites:     " +preArray[0]);
        console.log("Co-requisites:     " +coArray[0]);
        console.log("Course:            " +stringArray[stringArray.length-1]);
        console.log("Prerequisites:     " +preArray[preArray.length-1]);
        console.log("Co-requisites:     " +coArray[coArray.length-1]);
        
        writeToFile(stringArray, preArray);
        phantom.exit();
    }
];

var dataString;
var stringArray = new Array;
var preArray = new Array;
var coArray = new Array;
var OUT = new Array;

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
