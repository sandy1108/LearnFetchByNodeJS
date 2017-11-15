/**
 * Created by zhangyipeng on 2017/11/15.
 */
var https = require('https');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');
var xmlreader = require("xmlreader");

function startRequest(url,callback) {
    if(!url){
        url = oriUrl;
    }
    //采用http模块向服务器发起一次get请求
    https.get(url,
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
                    xmlData = iconv.decode(bufferHelper.toBuffer(),"utf-8");
                    xmlreader.read(xmlData, function(errors, result){
                        if(null !== errors){
                            console.log(errors)
                            return;
                        }
                        var pluginObject = parseAppCanPluginInfoXML(result);
                        if(typeof(callback)!='undefined'){
                            callback(pluginObject);
                        }
                    });
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

function fetchPluginInfo(pluginName, platformName, callback){
    var fetchUrl;
    if(platformName=="android"){
        fetchUrl = "https://raw.githubusercontent.com/"
            + platformName
            + "-plugin/uexJPush/master/"
            + pluginName
            + "/info.xml";
    }else if(platformName=="ios"){
        var iosPluginName = "EUEx"+pluginName.substring(3);//EUEx+截取uex之后的部分
        fetchUrl = "https://raw.githubusercontent.com/"
            + platformName
            + "-plugin/uexJPush/master/"
            + iosPluginName
            + "/"
            + pluginName
            + "/info.xml";
    }
    console.log("fetchPluginInfo===>URL is : " + fetchUrl);
    startRequest(fetchUrl, function(pluginInfo){
       console.log("插件名："+pluginInfo.uexName
           +" 插件版本："+pluginInfo.version
           +" build号："+pluginInfo.build
           +" 更新说明："+pluginInfo.info);
       if(callback){
           callback(pluginInfo);
       }
    });
}

module.exports.fetchAppCanGithubPluginInfo = fetchPluginInfo;

fetchPluginInfo("uexJPush", "ios");