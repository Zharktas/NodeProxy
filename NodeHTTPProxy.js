var httpProxy = require('http-proxy'),
	util = require('util'),
	colors = require('colors'),
	http = require('http');

var https = require('https');
var fs = require('fs');
var options = {
	https: {
		key: fs.readFileSync('../server.key'),
		cert: fs.readFileSync('../server.crt')
	}
};	



var servers = {
	router: {
		'/lively3d/node/': '127.0.0.1:8081',
		'/ambrosia/': '127.0.0.1:3000',
		'/': '127.0.0.1:80'
	}
};


var routes = [
	{ 'path': '/lively3d/node/', 'host': '127.0.0.1', 'port': '8081' },
    {'path': '/ambrosia/', 'host': '127.0.0.1', 'port': '3000'}
]


//httpProxy.createServer(servers).listen(8000);
var matchers = [];
routes.forEach(function(route, index, routes){
	var r = new RegExp(route.path.replace(/\//, '\^\\/'));
	//console.log(r);
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
		//console.log('url:' + url);
		var m = matchers[i].r(url);
		//console.log(m);
		if (m){
			return { 'path': matchers[i].path, 'host': matchers[i].host, 'port': matchers[i].port }
		}
	};
	return;
};

httpProxy.createServer(function(req,res, proxy){
	//console.log(req.url);
		
 	var m = matches(req.url);
	//console.log('m: ' + m );
	if (m){
		req.url = req.url.substr(m.path.length - 1);
		console.log('Proxying to: ' + req.url + ' host: ' + m.host + ' port: ' + m.port);
		proxy.proxyRequest(req, res, {
			host: m.host,
			port: m.port
		});
	} 
	else{
		//console.log('Proxying to: ' + req.url);
		proxy.proxyRequest(req, res, {
    			host: 'localhost',
    			port: 80
  		});
	}
	
}).listen(8000);


	
//	require('proxy-by-url')({
//		'/ambrosia': {port: 3000, host: 'localhost' },
//		'/lively3d/node': {port: 8081, host: 'localhost' },

//	}), 80, 'localhost'
	

//	require('./logger')(true),
//	require('./logger2')(true),
//  	80, 'localhost'

//).listen(8000);

var proxyServer = new httpProxy.HttpProxy({
	target: {
		host: 'localhost',
		port: 8000
	}
});

https.createServer(options.https, function(req,res){
	console.log(require('sys').inspect(req));
	proxyServer.proxyRequest(req,res);
}).listen(8080);;


util.puts("Proxy Server".blue + ' running '.green.bold + ' on'.blue + " http://127.0.0.1:8000".yellow);
util.puts("SSL Proxy Server".blue + ' running '.green.bold + ' on'.blue + " http://127.0.0.1:8080".yellow);
