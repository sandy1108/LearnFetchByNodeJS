/**
 * Created by zhangyipeng on 2017/11/15.
 */
var https = require('https');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');
var xmlreader = require("xmlreader");

var PER_PAGE = 100;

function fetchOnePluginInfo(url,callback) {
    if(!url){
        url = oriUrl;
    }
    //采用http模块向服务器发起一次get请求
    var option={
        hostname:'m.baidu.com',
        path:'/tcx?appui=alaxs&page=api/chapterList&gid=4315647048&pageNum=1&chapter_order=asc&site=&saveContent=1',
        headers:{
            'Accept':'*/*',
            'Accept-Encoding':'utf-8',  //这里设置返回的编码方式 设置其他的会是乱码
            'Accept-Language':'zh-CN,zh;q=0.8',
            'Connection':'keep-alive',
            'Cookie':'BAIDUID=A78C39414751FF9349AAFB0FDA505058:FG=1; true; __bsi=12248088537049104479_00_7_N_R_33_0303_cca8_Y',
            'Host':'m.baidu.com',
            'Referer':'https://m.baidu.com/tcx?appui=alaxs&page=detail&gid=4305265392&from=dushu'

        }
    };
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

function fetchPluginInfo(pluginNameArray, platformName, callback, index){
    if(!index){
        index = 0;
    }
    var pluginName = pluginNameArray[index];
    var fetchUrl;
    if(platformName=="android"){
        fetchUrl = "https://raw.githubusercontent.com/"
            + platformName
            + "-plugin/"+pluginName+"/master/"
            + pluginName
            + "/info.xml";
    }else if(platformName=="ios"){
        var iosPluginName = "EUEx" + pluginName.substring(3);//EUEx+截取uex之后的部分
        fetchUrl = "https://raw.githubusercontent.com/"
            + platformName
            + "-plugin/"+pluginName+"/master/"
            + iosPluginName
            + "/"
            + pluginName
            + "/info.xml";
    }
    console.log("fetchPluginInfo===>URL is : " + fetchUrl);
    fetchOnePluginInfo(fetchUrl, function(pluginInfo){
       console.log("插件名："+pluginInfo.uexName
           +" 插件版本："+pluginInfo.version
           +" build号："+pluginInfo.build
           +" 更新说明："+pluginInfo.info);
       if(callback){
           callback(pluginInfo, true);
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
            pluginNameArray.push(pluginName);
        }else{
            //插件列表获取完成
            console.log("插件列表获取完成，共"+pluginNameArray.length+"个");
            var index = 0;
            fetchPluginInfo(pluginNameArray[index], platformName, function(pluginObject, isValid){
                if(isValid){
                    pluginObjectArray.push(pluginObject);
                }else{
                    //获取完成
                    console.log("获取插件信息完成！！！");
                }
            });
        }
    });
}

function getPluginListURL(platformName,pageNum){
    var pluginListURL = "https://api.github.com/orgs/"
        +platformName+"-plugin/repos?per_page="
        +PER_PAGE+"&page="
        +pageNum;
    return pluginListURL;
}

//外部调用只需要传入前两个参数
function fetchPluginList(platformName, callback, pageNum){
    if(!pageNum){
        pageNum = 1;
    }
    var pluginListURL = getPluginListURL(platformName, pageNum);
    https.setHeader("User-Agent","LearnFetchByNodeJS-NodeJSApp");
    https.get(pluginListURL,
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

// fetchPluginInfo("uexJPush", "ios");
fetchAllPluginInfo("android");