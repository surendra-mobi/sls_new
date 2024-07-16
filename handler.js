const serverless = require("serverless-http");
const express = require("express");
const app = express();
const { Signer } = require("@aws-sdk/rds-signer");
//const host = 'database-1.crsuewgyo9jw.us-east-1.rds.amazonaws.com';
const host = 'rds-proxy-private.proxy-crsuewgyo9jw.us-east-1.rds.amazonaws.com';
const user = 'admin';
//const user = 'jane_doe';
//let AWS = require('aws-sdk');

let mysql2 = require('mysql2/promise'); //https://www.npmjs.com/package/mysql2
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
  secretAccessKey: "oPVAXnhDN8NXRMOi6KUvbqd1VjiI7CL5aTZ4Np63",  
  region: "us-east-1"
 }
 let signer = new Signer({
  region: 'us-east-1', // example: us-east-2
  hostname: host,
  port: 3306,
  username: user,
  credentials: SESConfig
});
let token = await signer.getAuthToken();
let connectionConfig = {
  host: host,// Store your endpoint as an env var
  user: user,
  database: 'rds_test', // Store your DB schema name as an env var
  ssl: 'Amazon RDS',
  password: token,
  insecureAuth: true,
  authPlugins: {
    mysql_clear_password: () => () =>signer.getAuthToken()
    } 
};

try {
  connection = await mysql2.createConnection(connectionConfig);
  console.log('connected as id ' + connection.threadId + "\n");  
  const [results, fields] = await connection.query(
    'SELECT * FROM contacts'
  );

  console.log(results); // results contains rows returned by server
  console.log(fields); // fields contains extra meta data about results, if available
  return res.status(200).json({
    message: results,
  });
} catch (err) {
  console.log(err);
}


})

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

exports.handler = serverless(app);


