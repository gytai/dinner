var config = require('../config');
var axios = require('axios');
var redis = require('../utils/redis');

function getAccessToken(){

    var token_url = "https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid="+config.wechat.CORPID+"&corpsecret="+config.wechat.SECRET;
    return new Promise(function (resolve, reject){
        redis.get("access_token",function (err,access_token) {
            if(!err && access_token){
                return resolve(access_token);
            }else{
                axios.get(token_url).then(response => {
                    redis.set("access_token",response.data.access_token,response.data.expires_in);
                    return resolve(response.data.access_token);
                }).catch(error => {
                    console.log(error);
                    return reject(error);
                });
            }
        });
    });
}

function getUserID(token,code) {
    var url = 'https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token='+token+'&code='+code;
    return new Promise(function (resolve, reject){
        axios.get(url).then(response => {
            redis.set("user_ticket",response.data.user_ticket,response.data.expires_in);
            return resolve(response.data.UserId);
        }).catch(error => {
            console.log(error);
            return reject(error);
        });
    });
}

async function getUserInfo(code) {
    var token = await getAccessToken().catch(function (err){
        console.error(err);
    });
    var userid = await getUserID(token,code).catch(function (err){
        console.error(err);
    });
    var  url = 'https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token='+token+'&userid='+userid;
    return new Promise(function (resolve, reject){
        axios.get(url).then(response => {
            return resolve(response.data);
        }).catch(error => {
            console.log(error);
            return reject(error);
        });
    });
}

exports.getAccessToken = getAccessToken;
exports.getUserID = getUserID;
exports.getUserInfo = getUserInfo;