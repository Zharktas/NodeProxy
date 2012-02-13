var httpProxy = require('http-proxy'),
	util = require('util'),
	colors = require('colors'),
	http = require('http');

if ( process.argv.length > 2 && process.argv[2] == '--debug' ){
	var debug = true;
}


var https = require('https');
var fs = require('fs');
var options = {
	https: {
		key: fs.readFileSync('../server.key', 'utf8'),
		cert: fs.readFileSync('../server.crt', 'utf8')
	}
};	


var routes = eval(fs.readFileSync('routes.js', 'utf8'));


var matchers = [];
routes.forEach(function(route, index, routes){
	var r = new RegExp(route.path.replace(/\//, '\^\\/'));
	var matcher = { 
			'path': route.path,
			'host': route.host,
			'port': route.port,
			'r': r
		};
	matchers.push(matcher);
});

function matches (url) {
	for ( var i in matchers ){
		var m = url.match(matchers[i].r);
		if (m){
			return { 'path': matchers[i].path, 'host': matchers[i].host, 'port': matchers[i].port }
		}
	};
	return;
};

httpProxy.createServer(function(req,res, proxy){
 	var m = matches(req.url);
	if (m){
		req.url = req.url.substr(m.path.length - 1);
		
		if ( debug == true ){
			console.log("Proxying to: " + req.url);
		}
		proxy.proxyRequest(req, res, {
			host: m.host,
			port: m.port
		});
	} 
	else{
		if ( debug == true ){
			console.log("Proxying to: " + req.url);
		}
		proxy.proxyRequest(req, res, {
    			host: 'localhost',
    			port: 80
  		});
	}
	
}).listen(8000);


var proxyServer = new httpProxy.HttpProxy({
	target: {
		host: 'localhost',
		port: 8000
	}
});

https.createServer(options.https, function(req,res){
	proxyServer.proxyRequest(req,res);
}).listen(8080);;


util.puts("Proxy Server".blue + ' running '.green.bold + ' on'.blue + " http://127.0.0.1:8000".yellow);
util.puts("SSL Proxy Server".blue + ' running '.green.bold + ' on'.blue + " http://127.0.0.1:8080".yellow);
