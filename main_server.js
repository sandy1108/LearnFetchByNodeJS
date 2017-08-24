var http = require('http');
var URL = require('url');

http.createServer(function(request, response){
    console.log("receive a request!!!");
    handleRequest2(request, response);
}).listen(9999);

function handleRequest2(request, response){
    var result = {status:"error"};
    var url = URL.parse(request.url, true);
    responseEnd(response,result);
}

function handleRequest(request, response){
    var result = {status:"error"};
    switch(request.url){
        case "/dytt":
            result.status = "ok";
            var fetch = require("./spider/spider_dytt");
            fetch.startRequest("",function(resultArray){
                result.data = resultArray;
                responseEnd(response,result);
            })
            break;
        case "/appcanbbs":
            result.status = "ok";
            var fetch = require("./spider/spider_appcanbbs");
            fetch.startRequest("",function(resultArray){
                result.data = resultArray;
                responseEnd(response,result);
            })
            break;
        case "/xiaoshuo":
            result.status = "ok";
            var fetch = require("./spider/spider_dingdianxiaoshuo");
            fetch.startRequest("",function(resultArray){
                result.data = resultArray;
                responseEnd(response,result);
            })
            break;
        default:
            result.status = "fail";
            result.data = "unknown request!!!"
            responseEnd(response,result);
            break;
    }
}

function responseEnd(response,result){
    response.end(JSON.stringify(result));
}
console.log("http.createServer listening on 9999");