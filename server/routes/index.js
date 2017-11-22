var express = require('express');
var router = express.Router();
var mysql = app.get("mysql");
var common = require('../utils/common');
var config = require('../config');
var wechat = require('../service/wechat');
var userSvc = require('../service/users');
var config = require('../config');

router.get('/', function(req, res, next){
    var param = "?pastry_order_start_time="+config.dinner.pastry_order_start_time
                +"&pastry_order_end_time="+config.dinner.pastry_order_end_time
                +"&pastry_baozi_sum="+config.dinner.pastry_baozi_sum
                +"&pastry_mantou_sum="+config.dinner.pastry_mantou_sum;

    if(!req.cookies.userid){
        //重新授权
        if(req.query.code){
            wechat.getUserInfo(req.query.code).then(function (userinfo) {
                console.log(userinfo);

                if(!userinfo || !userinfo.userid){
                    res.send("<p style='text-align: center;margin-top: 100px;font-size: 2rem;'>不是公司员工不能使用</p>");
                }

                res.cookie('userid', userinfo.userid);
                res.cookie('avatar', userinfo.avatar);
                res.cookie('name', userinfo.name);

                param += '&userid='+userinfo.userid+'&avatar='+userinfo.avatar+'&name='+userinfo.name;

                //检查用户是否注册
                userSvc.register(userinfo.userid,userinfo.name,userinfo.avatar).then(data=>{
                    console.log(data);
                    res.redirect(config.dinner.client_url+param);
                }).catch(err=>{
                    console.error(err);
                    res.send("服务器异常");
                });
            });
        }else{
            var url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" +
                config.wechat.CORPID+"&redirect_uri="+config.wechat.REDIRECT_URI+"&response_type=code" +
                "&scope=snsapi_userinfo&agentid="+config.wechat.AGENTID+"&state=meyer#wechat_redirect";
            res.redirect(url);
        }
    }else{
         param += '&userid='+req.cookies.userid+'&avatar='+req.cookies.avatar+'&name='+req.cookies.name;
        res.redirect(config.dinner.client_url+param);
    }

});

router.get('/get', function(req, res, next) {
    var now = new Date();
    var start_time = common.dateFormat(now,'yyyy-MM-dd 00:00:00');
    var end_time = common.dateFormat(now,'yyyy-MM-dd 23:59:59');
    var page = req.query.page || 1;
    var size = req.query.size || 10;
    if(typeof page == "string"){
        page = parseInt(page);
    }
    if(typeof size == "string"){
        size = parseInt(size);
    }

    var skip = (page - 1) * size;

    var sql = 'select a.uid,a.create_time as time,b.name,b.avatar from dinner a join users b on a.uid=b.id where a.create_time>? and a.create_time<? limit ?,?';
    var sql_total = "select count(*) as total from dinner where create_time>? and create_time<?";
    mysql.query(sql, [start_time,end_time,skip,size],function (err,data) {
        if(err){
            return res.send({code:400,msg:err.toLocaleString()});
        }
        mysql.query(sql_total, [start_time,end_time],function (err,total) {
            if(err){
                return res.send({code:400,msg:err.toLocaleString()});
            }
            total = total[0].total;
            return res.send({code:200,msg:'获取成功',data:data,total:total});
        });
    });
});

router.post('/order', function(req, res, next) {
    var uid = req.body.uid || res.session.uid;
    if(!uid){
        return res.send({code:400,msg:'未登录'});
    }
    var now = new Date();
    var now_times = now.getTime();

    var dinner_start_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' ' + config.dinner.dinner_order_start_time).getTime();
    var dinner_end_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' ' + config.dinner.dinner_order_end_time).getTime();
    if(now_times < dinner_start_time){
        return res.send({code:400,msg:"预定时间尚未开始..."})
    }

    if(now_times > dinner_end_time){
        return res.send({code:400,msg:"预定时间已经结束..."})
    }

    var start_time = common.dateFormat(now,'yyyy-MM-dd 00:00:00');
    var end_time = common.dateFormat(now,'yyyy-MM-dd 23:59:59');
    var sql = 'select * from dinner  where uid=? and create_time>? and create_time<?';
    mysql.query(sql, [uid,start_time,end_time],function (err,ret) {
        if(err){
            return res.send({code:400,msg:err.toLocaleString()});
        }
        if(ret.length > 0){
            return res.send({code:400,msg:'已经预定'});
        }
        var sql = 'insert into dinner(uid,create_time) values(?,?)';
        mysql.query(sql, [uid,common.dateFormat()],function (err,data) {
            if(err){
                return res.send({code:400,msg:err.toLocaleString()});
            }
            return res.send({code:200,msg:'预定成功'});
        });
    });
});

router.post('/cancel', function(req, res, next) {
    var uid = req.body.uid || res.session.uid;
    if(!uid){
        return res.send({code:400,msg:'未登录'});
    }
    var now = new Date();
    var now_times = now.getTime();

    var dinner_start_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' ' + config.dinner.dinner_order_start_time).getTime();
    var dinner_end_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' ' + config.dinner.dinner_order_end_time).getTime();
    if(now_times < dinner_start_time){
        return res.send({code:400,msg:"尚未开始预定不能取消..."})
    }

    if(now_times > dinner_end_time){
        return res.send({code:400,msg:"时间已过，不能取消..."})
    }

    var start_time = common.dateFormat(now,'yyyy-MM-dd 00:00:00');
    var end_time = common.dateFormat(now,'yyyy-MM-dd 23:59:59');
    var sql = 'select * from dinner where uid=? and create_time>? and create_time<?';
    mysql.query(sql, [uid,start_time,end_time],function (err,data) {
        if(err){
            return res.send({code:400,msg:err.toLocaleString()});
        }
        if(data.length == 0){
            return res.send({code:400,msg:'未预定'});
        }
        var sql = 'delete from dinner where uid=? and create_time>? and create_time<?';
        mysql.query(sql, [uid,start_time,end_time],function (err,data) {
            if(err){
                return res.send({code:400,msg:err.toLocaleString()});
            }
            return res.send({code:200,msg:'取消预定成功'});
        });
    });
});



module.exports = router;
