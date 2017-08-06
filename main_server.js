var http = require('http');

http.createServer(function(request, response){
    var result = {status:"error"};
    console.log("receive a request!!!");
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
}).listen(9999);

function responseEnd(response,result){
    response.end(JSON.stringify(result));
}
console.log("http.createServer listening on 9999");