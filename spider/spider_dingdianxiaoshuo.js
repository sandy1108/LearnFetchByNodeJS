var http = require('http');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');

var oriUrl = "http://www.23us.cc/html/87/87693/";

//主方法
function fetchPage(url) { //封装了一层函数
	startRequest(url);
}

function startRequest(url,callback) {
	if(!url){
		url = oriUrl;
	}
	//采用http模块向服务器发起一次get请求      
	http.get(url,
	function(res) {
		var html = ''; //用来存储请求网页的整个html内容
		var resultArray = [];
		res.setEncoding('utf-8'); //防止中文乱码
		//监听data事件，每次取一块数据
		res.on('data',
		function(chunk) {
			html += chunk;
		});
		//监听end事件，如果整个网页内容的html都获取完毕，就执行回调函数
		res.on('end',
		function() {
			var $ = cheerio.load(html,{decodeEntities:false}); //采用cheerio模块解析html
			$('dd').filter(function(index, element){
				$(this).text()
			}).each(function(index, element){
				var title = $(this).text();
				var link = $(this).attr('href');
				console.log("index: "+index, "title: "+title, "link: " + link);
				resultArray.push({
					index,
					title,
					link
				});
				// resultArray.push({
				// 	index:index,
				// 	title:title,
				// 	link:link
				// });
			});
			if(typeof(callback)!='undefined'){
				callback(resultArray);
			}
		});
	}).on('error',
	function(err) {
		console.log(err);
	});
}

module.exports.startRequest = startRequest;