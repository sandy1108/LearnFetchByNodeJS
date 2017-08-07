var http = require('http');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');

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
        var bufferHelper = new BufferHelper();
		var html = ''; //用来存储请求网页的整个html内容
		var resultArray = [];
		// res.setEncoding('utf-8'); //防止中文乱码
		//监听data事件，每次取一块数据
		res.on('data',
		function(chunk) {
			// html += chunk;
            bufferHelper.concat(chunk);
		});
		//监听end事件，如果整个网页内容的html都获取完毕，就执行回调函数
		res.on('end',
		function() {
            html = iconv.decode(bufferHelper.toBuffer(),"utf-8");
			var $ = cheerio.load(html,{decodeEntities:false}); //采用cheerio模块解析html
			$('dd a').filter(function(index, element){
				// var abc = "第1章 世界大变";
				// var test = abc.match(/^[第]{1}\d+[章]{1}\s{1}(?:.*)/);
				// console.log("test: "+test);
				var match = $(this).text().trim().match(/^[第]{1}\d+[章]{1}\s{1}(?:.*)/);
				console.log("text: "+$(this).text());
				console.log("match: "+match);
				return match!=null;
				// return true;
			}).each(function(index, element){
				var title = $(this).text();
				var link = url+$(this).attr('href');
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