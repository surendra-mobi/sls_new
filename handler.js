const serverless = require("serverless-http");
const express = require("express");
const app = express();
const { Signer } = require("@aws-sdk/rds-signer");
//const host = 'database-1.crsuewgyo9jw.us-east-1.rds.amazonaws.com';
const host = 'rds-proxy-private.proxy-crsuewgyo9jw.us-east-1.rds.amazonaws.com';
const user = 'admin';
//const user = 'jane_doe';
//let AWS = require('aws-sdk');

let mysql2 = require('mysql2'); //https://www.npmjs.com/package/mysql2
let connection;
app.get("/", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from root!",
  });
});

app.get("/hello", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from path!",
  });
});
app.get("/testconn", async(req, res, next)=>{
  const SESConfig = {
  accessKeyId: "AKIAQ3EGURWVWBWMXSEK",      // should be:  process.env.AWS_ACCESS_ID
  secretAccessKey: "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",  
  region: "us-east-1"
 }
  const promise = new Promise(async function(resolve, reject) {   
		  console.log("Starting query ...\n");
	  	console.log("Running iam auth ...\n");
      // rds pass CLN32p9zAWblh7iTaXLg
      //
    	let signer = new Signer({
	        region: 'us-east-1', // example: us-east-2
	        hostname: host,
	        port: 3306,
	        username: user,
          credentials: SESConfig
      });
      let token = await signer.getAuthToken();
      
        console.log("token"+token)
        console.log ("IAM Token obtained\n");
  
        let connectionConfig = {
          host: host,// Store your endpoint as an env var
          user: user,
          database: 'rds_test', // Store your DB schema name as an env var
          ssl: 'Amazon RDS',
          password: token//"Poonam1724", //"CLN32p9zAWblh7iTaXLg", 
          /*authSwitchHandler: function ({pluginName, pluginData}, cb) {
              console.log("Setting new auth handler.");
          }*/,
          insecureAuth: true,
          authPlugins: {
            mysql_clear_password: () => () =>signer.getAuthToken()
            }
    
            
        };
   
    // Adding the mysql_clear_password handler
        /*connectionConfig.authSwitchHandler = (data, cb) => {
            if (data.pluginName === 'mysql_clear_password') {
              // See https://dev.mysql.com/doc/internals/en/clear-text-authentication.html
              console.log("pluginName: "+data.pluginName);
              let password = token + '\0';
              let buffer = Buffer.from(password);
              cb(null, password);
            }
        };*/
        connection = mysql2.createConnection(connectionConfig);
    
    connection.connect(function(err) {
      if (err) {
        console.log('error connecting: ' + err.stack);
        return;
      }
      
      console.log('connected as id ' + connection.threadId + "\n");
      connection.query("SELECT * FROM contacts", function (error, results, fields) {
        if (error){ 
            //throw error;
            reject ("ERROR new ",  error);
        }
          
        if(results.length > 0){
          let result = results[0].email + ' ' + results[0].firstname + ' ' + results[0].lastname;
          console.log(result);
          
          let response = {
                "statusCode": 200,
                "statusDescription": "200 OK",
                "isBase64Encoded": false,
                "headers":{
                  "Content-Type": "text/html"
                },
                body: result,
            };
          
          connection.end(function(error, results) {
              if(error){
                //return "error";
                reject ("ERROR");
              }
              // The connection is terminated now 
              console.log("Connection ended\n");
              
              resolve(response);
          });
        }
      }); 
    });
      
    
    

		
	});
	return promise;

})

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

exports.handler = serverless(app);

