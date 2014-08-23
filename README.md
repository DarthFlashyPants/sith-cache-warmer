A Sith's Tableau Cache Warmer
=========

A completely unsupported app which will warm your Tableau VizQL Server processes.

  - Exercises 1-X different reports on your server
  - Repeats report execution on a user-defined interval 
  - Executes multiple requests for the same report in an attempt to populate caches across all processes

A Sith's Cache Warmer simply calls reports you specify on a regular basis. Doing so over time (generally) will populate the cache of each VizQL on your Tableau Server, increasing the perceived performance of Tableau Server for your users.  It is a Node.JS module that utilizes [PhantomJS] as a headless browser to hit your pages [Markdown site] [1]:


Reasons Not To Use This Tool
-----
(They are legion)
 - It is **not supported**. By anyone. Under any circumstances. Ever.
 - There's a good chance the author will never update it again. I'm off slaying Jedi, after all.
 - You need to be somewhat technical to get it installed and running
 - For reasons that won't be explained here, it is very difficult to dependably pre-populate the cache of all VizQL Server processes on your server. This tool uses brute force and generally does a "good enough" job. Not perfect, not even great...not meant to be.


Version
----

1.0



Installation
--------------

 - To begin, you must download and install [Node.Js] for your operating system
 - Then, head to [PhantomJS] to download and install the the distribution for the OS you're running
 - Next, download the code using the **Download** button to your right
 - Unzip to the folder of your choice, and navigate there on the command-line
 - Execute these commands to prepare the app
 
```sh
npm install 
```

##### Windows Only

* You may see a build error related to phantom and installing Microsoft build tools or Visual Studio. Ignore it. Stupid Windows.
* phantomjs.exe was unzipped and copied to **your folder\node_modules\phantom\lib\phantom**. Ensure it is there, and/or read the npm install output to determine where it landed.
* Add the full path to the exe into your computer's PATH statement. Example D:\SithCacher\node_modules\phantom\lib\phantom
* Your current command-line window won't register this change. Close it and launch a new one.

To run the app on Mac \ Windows \ Linux:

```sh
node app
```
Script Configuration
-----------

Modify these settings in **\config\default.json**:

**host**: The location to your Tableau Server. Include http:// or https:// on the URL

**username**: The username which will be used to connect to Tableau Server and request reports
**reload**: The interval, in milliseconds that the script waits to re-request reports. 

>Examples: 
 * 2700000: 45 minutes
 * 10800000: 3 hours 

Do NOT do something foolish and set this to a low value like 10 minutes. 

**executions**: The number of times each report will get executed. Default is 1

#### Reports section
Use this area to define each report you wish to execute. Example:

        {
            "reportName": "Growth of Walmart",
            "reportURL": "/views/Sales/GrowthofWalmart?:refresh=yes",
            "reportSite": ""
        },


Launch the report named "Growth of Walmart" in the defaul site.  The report is found at  /views/Sales/GrowthofWalmart on the Tableau Server. Use the :refresh=yes parameter

        {
           "reportName": "The Hello Viz",
            "reportURL": "/views/Foo/Hello2?:Region=West",
            "reportSite": ""
        },

Execute "The Hello Viz" found at /views/Foo/Hello. Filter down to the West region.

        {
           "reportName": "Rainy days and Mondays always get me down",
            "reportURL": "/t/Site3/views/Songs/ILuvKaren?:refresh=yes",
            "reportSite": "Site3"
        },

Execute a dashboard named after the best song ever and refresh data This report lives in a Tableau multi-tenant site with an ID of "Site3". Does the username you specified in **username** have access to this site? They should.

Tableau Server Configuration
----
This application leverages Tableau **Trusted Authentication** to enable the user specified in the config file to connect and execute reports. Please review the [documentation] on same, and configure Tableau to trust the IP address or Machine Name of the box which runs this application. 

License
----

MIT

**Free Software, Hell Yeah!**

FAQ
----
####Reports come back "out of order" in the display. Why?
The order in which reports are executed against Tableau is irrelevant in terms of the order they'll return - each report takes a different amount of time to complete, after all. 
####Explain why using :refresh=yes on my URL could be a bad idea, please?
:refresh=yes expires the cache on the vizqlserver process it is executed against. This means each time it is used, it wipes out whatever was already cached. If you cache 3 reports and use :refresh=yes on the third, you are most likely de-caching the first two vizzes you just STUCK in cache a second ago. You just wasted your time.
####When I run the app, one (or more) of my reports finishes with: *' ' load complete*. Closing page. Why?
Generally, this means one of two things: 
 - The report that you're asking for lives in a non-default site, and you forgot to set the **reportSite** attribute in the config file
 - The user you are logging in with does not have permissions on the report you are trying to run or doesn't have permissions to get into the site.
 
####Please explain why it is useless to execute the same viz a bunch of times in a row during a single "execution round"?
There is no real reason to request the same viz multiple times in a row since you’ll just end up in a shared session anyway – you WON’T actually be exercising multiple VizQLs by asking for the same viz two/three/four times in a row. Be patient, acolyte. Instead, execute each report ONCE every x minutes with x being a number above the timeout period for wgserver.session_idle_limit and vizqlserver.session.expiry.timeout. That way, the session (and vizql it is bound to) you hit last time will already be dead and buried. Therefore, a NEW vizql session will get bootstrapped - and this new session willl (hopefully) get created on a different vizql than the last time. 


Thanks, [Darth FlashyPants]

[PhantomJS]:http://phantomjs.org
[Node.js]:http://nodejs.org/
[Darth FlashyPants]:http://twitter.com/lordflashypants
[documentation]:http://onlinehelp.tableausoftware.com/current/server/en-us/help.htm#trusted_auth_trustIP.htm

