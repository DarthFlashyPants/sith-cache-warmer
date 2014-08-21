//setup environment
process.env.NODE_ENV = "default";
process.env.NODE_CONFIG_DIR = "config";

//modules ==========================================



// Modules for handling xml requests and responses
//var jsxml = require("node-jsxml");
var request = require("request");

// Modules used for uploading files, writing to the file system, and publishing to Tableau
//var exec = require('exec');
var phantom = require('phantom');
var config = require('config');


// Phantom's variable
var session;

//location of the server
tableau = config.get('ServerInfo');
var tableauServer = tableau.get('ServerConfig.host');
// admin username, reload interval & # executions per report
var user = tableau.get('ServerConfig.username');
var interval = tableau.get('ServerConfig.reload');
var executions = tableau.get('ServerConfig.executions');   

console.log("I will be connecting to " + tableauServer + " as user '" + user + "'" + " in " + interval.toString() + " ms, executing each report " + executions + " times.");

// Info about reports
var reports = config.get('Reports');
console.log("Count of reports to exercise: " + reports.length.toString());

// Array of URLs complete w/ Trusted Ticket included
var urls = [];


// Before we do anything, let's attempt to keep phantomJS instances from hanging around
// It seems they don't always go away gracefully. 
process.on('exit', function(code, signal) {
    console.log("Exiting inline, killing Phantom.");
    session.exit();
});


// Every <interval> MS, repeat this. 

function loopingSetupLogic() {
    for(i=0; i < executions; i++){
        var keys = Object.keys(reports);
        var tasksToGo = keys.length;
            // Execute x times to try and load up all VizQLs


        // Loop through each report detailed in default.json, getting a trusted ticket for each
        // Add each URL to the urls[] array for processing in onTicketComplete()

        if (tasksToGo === 0) {
           onTicketComplete();
        } else {
            // There is at least one element, so the callback will be called.
            keys.forEach(function(key) {
                var url = reports[key].reportURL;
                var site = reports[key].reportSite;
                getTicket(user, site, function(err, result) {
                    var trustedURL =  tableauServer + "/trusted/" + result + url;               
                    urls.push(trustedURL); 
                    if (--tasksToGo === 0) {
                        // No tasks left, good to go
                        onTicketComplete();
                    }
                });
            });
        }
    }
}



// run the function above once, then set the timer to execute every x ms
loopingSetupLogic();

setInterval( function() {
    loopingSetupLogic();
}, interval);

var onTicketComplete = function() {

    console.log("Work array populated.");  
    
    // Begin processing URLS
    
    //Start Phantom Session
    createPhantomSession( function(){
        console.log ("Session Created");
        processURLs( function (err) {
            console.log ("Back in OnTicketComplete");
        });
    });

};

function processURLs() {
    if (urls.length > 0) {
        var url = urls[0];
        urls.splice(0, 1);
            renderPage(url, processURLs);
    } else {
        console.log("Processing Complete.");
        
    }
}

var  renderPage = function(url, cb) {
    
    var page;

      try {
        session.createPage(function(_page) {
          page = _page;
          page.open(url, function (status) {
            if (status !== 'success') {
                console.log('Unable to load the address! ' + status);
                page.close();
                page = null;
                return cb(null);
            } else {
                
                d = new Date();
                t = d.toLocaleTimeString();
                console.log(t + ' ' + url);
                
                setTimeout(function () {
                     page.evaluate(function () { return document.title; console.log(document.title);}, function (result) {
                         if(result == "Views") // "Views" appears as page title when a bad URL is plugged in by user
                         {
                             console.log("NO VIEW FOUND. Check your reportURL -- you did something wrong");
                         }
                         else{ 
                            console.log("'" + result + "' load complete. Closing page.");
                         }
                     });
                    
                    
                    page.close();
                    page = null;
                    return cb(null);
                }, 1000 );
            }
          });
        });
      } catch(e) {
        try {
          if (page != null) {
            page.close(); // try close the page in case it opened but never rendered a pdf due to other issues
          }
        } catch(e) {
          // ignore as page may not have been initialised
        }
        return cb('Exception calling page:' + e.toString());
      }
};


////////// Helpers

function createPhantomSession (callback) {
  if (session) {
    console.log("Session Exists");
    return callback(null, session);
  } else {
    console.log("Creating new Session");
    require('phantom').create({dnodeOpts: {weak: false}}, function(_session) {
      session = _session;
       callback(null, session);
    });
  }
};


function getTicket (userName, site, callback) {

  var user = userName; 
  var siteID = site;
  request.post( 
		{
			url: tableauServer + '/trusted',
			form: { 'username': user,
                    'target_site': siteID
                  }
		},
		// Requests take a 'callback' function which will be called when the request has been processed. The
		// response from the server will be contained in the 3rd parameter 'body'.
		function(err, response, body) {
			if(err) {
				callback(err);
				return;
			} else {
                ticket = body;        
            }
            callback(null, body);
            return;
        });
}