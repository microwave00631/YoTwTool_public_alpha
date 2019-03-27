"use strict"
const 
https = require('https'),
fs = require('fs'),
conf = require('./conf'),
moment = require('moment');

const httpServ = https.createServer(
	{
			key: fs.readFileSync(conf.key),
			cert: [fs.readFileSync(conf.cert)],
			ca:   [fs.readFileSync(conf.chain), fs.readFileSync(conf.fullchain)]
	},
	(req, res) =>{
			console.log(req);
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.writeHead(200, {
				'Access-Control-Allow-Origin': 'chrome-extension://aajkhajkeiakojmbpklhhlfleicfkapf'		
			});
			res.write(fs.readFileSync("./message.json"));
			res.end();
	}
).listen(50000);
