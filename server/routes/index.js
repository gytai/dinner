var express = require('express');
var router = express.Router();
var mysql = app.get("mysql");
var common = require('../utils/common');
var config = require('../config');

router.get('/', function(req, res, next) {
   res.redirect('/index.html');
});

router.get('/get', function(req, res, next) {
    var now = new Date();
    var start_time = common.dateFormat(now,'yyyy-MM-dd 00:00:00');
    var end_time = common.dateFormat(now,'yyyy-MM-dd 23:59:59');
    var sql = 'select a.uid,a.create_time as time,b.name from dinner a join users b on a.uid=b.id where a.create_time>? and a.create_time<?';
    mysql.query(sql, [start_time,end_time],function (err,data) {
        if(err){
            return res.send({code:400,msg:err.toLocaleString()});
        }
        return res.send({code:200,msg:'获取成功',data:data});
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
