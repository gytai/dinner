var express = require('express');
var router = express.Router();
var mysql = app.get("mysql");
var wechat = require('../service/wechat');
var userSvc = require('../service/users');
var config = require('../config');


router.get('/', function(req, res, next){
    if(!req.session.uid){
        //重新授权
        if(req.query.code){
            wechat.getUserInfo(req.query.code).then(function (userinfo) {
                console.log(userinfo);

                if(!userinfo || !userinfo.userid){
                    return res.send("<p style='text-align: center;margin-top: 100px;font-size: 2rem;'>不是公司员工不能使用</p>");
                }

                req.session.uid = userinfo.userid;
                req.session.avatar = userinfo.avatar;
                req.session.name = userinfo.name;

                res.cookie('userid', userinfo.userid);
                res.cookie('avatar', userinfo.avatar);
                res.cookie('name', userinfo.name);

                //检查用户是否注册
                userSvc.register(userinfo.userid,userinfo.name,userinfo.avatar).then(data=>{
                    return res.redirect(config.dinner.client_url);
                }).catch(err=>{
                    console.error(err);
                    return res.send("<p style='text-align: center;margin-top: 100px;font-size: 2rem;'>不是公司员工不能使用</p>");
                });
            }).catch(function (err) {
                console.error(err);
                return res.send("<p style='text-align: center;margin-top: 100px;font-size: 2rem;'>不是公司员工不能使用</p>");
            });
        }else{
            var url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" +
                config.wechat.CORPID+"&redirect_uri="+config.wechat.REDIRECT_URI+"&response_type=code" +
                "&scope=snsapi_userinfo&agentid="+config.wechat.AGENTID+"&state=meyer#wechat_redirect";
            return res.redirect(url);
        }
    }else{
        return res.redirect(config.dinner.client_url);
    }
});

router.get('/stats',function (req, res, next) {
    res.render("stats",{
        dinner_num:10,
        baozi_num:20,
        mantou_num:20
    });
});


module.exports = router;
