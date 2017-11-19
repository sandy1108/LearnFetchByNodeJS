/**
 * Created by zhangyipeng on 2017/11/15.
 */
var https = require('https');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');
var xmlreader = require("xmlreader");

var PER_PAGE = 100;

function fetchOnePluginInfo(urlPath,callback) {
    if(!urlPath){
        urlPath = oriUrl;
    }
    //采用https模块向服务器发起一次get请求
    var option={
        hostname:'raw.githubusercontent.com',
        path:urlPath,
        method:'GET',
        rejectUnauthorized: false,
        headers:{
            'Accept':'*/*',
            'Accept-Encoding':'utf-8',
            'Accept-Language':'zh-CN,zh;q=0.8',
            'Connection':'keep-alive',
            "User-Agent":"LearnFetchByNodeJS-NodeJSApp"
        }
    };
    https.get(option,
        function(res) {
            var bufferHelper = new BufferHelper();
            var xmlData = '';
            var resultArray = [];
            //res.setEncoding('utf-8'); //防止中文乱码
            //监听data事件，每次取一块数据
            res.on('data',
                function(chunk) {
                    bufferHelper.concat(chunk);
                });
            //监听end事件，如果整个网页内容的html都获取完毕，就执行回调函数
            res.on('end',
                function() {
                    try{
                        xmlData = iconv.decode(bufferHelper.toBuffer(),"utf-8");
                        xmlreader.read(xmlData, function(errors, result){
                            if(null !== errors){
                                console.log(errors);
                                console.log("error xmlData===>"+xmlData);
                            }else{
                                var pluginObject = parseAppCanPluginInfoXML(result);
                                if(typeof(callback)!=undefined){
                                    callback(pluginObject);
                                }
                            }
                        });
                    }catch(e){
                        console.log("xmlreader===>read exception: "+e);
                        if(typeof(callback)!=undefined){
                            callback(undefined);
                        }
                    }
                });
        }).on('error',
        function(err) {
            console.log(err);
        });
}

function parseAppCanPluginInfoXML(xmlResult){
    var pluginObject = {};
    pluginObject.attributes = xmlResult.uexplugins.plugin.attributes;
    pluginObject.uexName = xmlResult.uexplugins.plugin.attributes().uexName;
    pluginObject.version = xmlResult.uexplugins.plugin.attributes().version;
    pluginObject.build = xmlResult.uexplugins.plugin.attributes().build;
    pluginObject.info = xmlResult.uexplugins.plugin.info.text();
    return pluginObject;
}

function fetchPluginInfo(pluginNameArray, platformName, callback, index){
    if(!index){
        index = 0;
    }
    var pluginName = pluginNameArray[index];
    var fetchUrlPath;
    if(platformName=="android"){
        fetchUrlPath = "/"
            + platformName
            + "-plugin/"+pluginName+"/master/"
            + pluginName
            + "/info.xml";
    }else if(platformName=="ios"){
        var iosPluginName = "EUEx" + pluginName.substring(3);//EUEx+截取uex之后的部分
        fetchUrlPath = "/"
            + platformName
            + "-plugin/"+pluginName+"/master/"
            + iosPluginName
            + "/"
            + pluginName
            + "/info.xml";
    }
    console.log("fetchPluginInfo===>URLPath is : " + fetchUrlPath);
    fetchOnePluginInfo(fetchUrlPath, function(pluginObject){
       if(callback){
           callback(pluginObject, true);
           if (index < pluginNameArray.length-1){
               //还需要继续递归遍历插件名，继续获取下一个插件信息
               fetchPluginInfo(pluginNameArray, platformName, callback, index + 1);
           }else{
               //获取结束
               callback(undefined, false);
           }
       }
    });
}

function fetchAllPluginInfo(platformName){
    var pluginNameArray = [];
    var pluginObjectArray = [];
    fetchPluginList(platformName, function(pluginName, isValid){
        if(isValid){
            if(pluginName.indexOf("uex")==0){
                //以uex开头，则认为是插件仓库，否则不是
                pluginNameArray.push(pluginName);
            }
        }else{
            //插件列表获取完成
            console.log("插件列表获取完成，共"+pluginNameArray.length+"个");
            fetchPluginInfo(pluginNameArray, platformName, function(pluginObject, isValid){
                if(isValid){
                    if(pluginObject!=undefined){
                        console.log("插件名："+pluginObject.uexName
                            +" 插件版本："+pluginObject.version
                            +" build号："+pluginObject.build
                            +" 更新说明："+pluginObject.info);
                        pluginObjectArray.push(pluginObject);
                    }
                }else{
                    //获取完成
                    console.log("获取插件信息完成，共处理了"+pluginObjectArray.length+"个插件信息");
                }
            });
        }
    });
}

function getPluginListURL(platformName,pageNum){
    var pluginListURLPath = "/orgs/"
        +platformName+"-plugin/repos?per_page="
        +PER_PAGE+"&page="
        +pageNum;
    var option={
        hostname:'api.github.com',
        path:pluginListURLPath,
        method:'GET',
        rejectUnauthorized: false,
        headers:{
            'Accept':'*/*',
            'Accept-Encoding':'utf-8',
            'Accept-Language':'zh-CN,zh;q=0.8',
            'Connection':'keep-alive',
            "User-Agent":"LearnFetchByNodeJS-NodeJSApp"
        }
    };
    return option;
}

//外部调用只需要传入前两个参数
function fetchPluginList(platformName, callback, pageNum){
    if(!pageNum){
        pageNum = 1;
    }
    var pluginListURLOptions = getPluginListURL(platformName, pageNum);
    https.get(pluginListURLOptions,
        function(res) {
            var bufferHelper = new BufferHelper();
            var resultData = '';
            //res.setEncoding('utf-8'); //防止中文乱码
            //监听data事件，每次取一块数据
            res.on('data',
                function(chunk) {
                    bufferHelper.concat(chunk);
                });
            //监听end事件，如果整个网页内容的html都获取完毕，就执行回调函数
            res.on('end',
                function() {
                    resultData = iconv.decode(bufferHelper.toBuffer(),"utf-8");
                    var resultJsonArray = JSON.parse(resultData);
                    var isContinue = (PER_PAGE == resultJsonArray.length);//还需要请求下一页数据
                    for (var i=0; i<resultJsonArray.length;i++){
                        var gitObj = resultJsonArray[i];
                        callback(gitObj.name, true);//第一参数为插件名称，第二参数为是否有效且是否还有后续数据
                    }
                    if(isContinue){
                        fetchPluginList(platformName, callback, pageNum+1);
                    }else{
                        callback(undefined, false);
                    }
                });
        }).on('error',
        function(err) {
            console.log(err);
        });
}

module.exports.fetchAppCanGithubPluginInfo = fetchPluginInfo;

// fetchPluginInfo(["uexButton"], "android");
fetchAllPluginInfo("android");