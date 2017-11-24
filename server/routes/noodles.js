var express = require('express');
var router = express.Router();
var mysql = app.get("mysql");
var common = require('../utils/common');
var config = require('../config');

router.use(function (req, res, next) {
    if(!req.session.uid){
        return res.redirect('/');
    }
    next();
});

router.get('/',function (req, res, next) {
    res.render("noodles_order");
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

    var sql = 'select a.uid,a.create_time as time,b.name,b.avatar from noodles a join users b on a.uid=b.id where a.create_time>? and a.create_time<? limit ?,?';
    var sql_total = "select count(*) as total from noodles where create_time>? and create_time<?";
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
    var uid = req.body.uid || req.session.uid;
    if(!uid){
        return res.send({code:400,msg:'未登录'});
    }
    var now = new Date();
    var now_times = now.getTime();

    var noodles_start_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' ' + config.dinner.noodles_order_start_time).getTime();
    var noodles_end_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' ' + config.dinner.noodles_order_end_time).getTime();
    if(now_times < noodles_start_time){
        return res.send({code:400,msg:"预定时间尚未开始..."})
    }

    if(now_times > noodles_end_time){
        return res.send({code:400,msg:"预定时间已经结束..."})
    }

    var start_time = common.dateFormat(now,'yyyy-MM-dd 00:00:00');
    var end_time = common.dateFormat(now,'yyyy-MM-dd 23:59:59');
    var sql = 'select count(*) as num from noodles  where uid=? and create_time>? and create_time<?';
    mysql.query(sql, [uid,start_time,end_time],function (err,ret) {
        if(err){
            return res.send({code:400,msg:err.toLocaleString()});
        }
        if(ret.length > config.dinner.noodles_max){
            return res.send({code:400,msg:'预定超出当日上限'});
        }else{
            sql = 'select * from noodles  where uid=? and create_time>? and create_time<?';
            mysql.query(sql, [uid,start_time,end_time],function (err,ret) {
                if(err){
                    return res.send({code:400,msg:err.toLocaleString()});
                }
                if(ret.length > 0){
                    return res.send({code:400,msg:'已经预定'});
                }
                var sql = 'insert into noodles(uid,create_time) values(?,?)';
                mysql.query(sql, [uid,common.dateFormat()],function (err,data) {
                    if(err){
                        return res.send({code:400,msg:err.toLocaleString()});
                    }
                    return res.send({code:200,msg:'预定成功'});
                });
            });
        }

    });


});

router.post('/cancel', function(req, res, next) {
    var uid = req.body.uid || req.session.uid;
    if(!uid){
        return res.send({code:400,msg:'未登录'});
    }
    var now = new Date();
    var now_times = now.getTime();

    var noodles_start_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' ' + config.dinner.noodles_order_start_time).getTime();
    var noodles_end_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' ' + config.dinner.noodles_order_end_time).getTime();
    if(now_times < noodles_start_time){
        return res.send({code:400,msg:"尚未开始预定不能取消..."})
    }

    if(now_times > noodles_end_time){
        return res.send({code:400,msg:"时间已过，不能取消..."})
    }

    var start_time = common.dateFormat(now,'yyyy-MM-dd 00:00:00');
    var end_time = common.dateFormat(now,'yyyy-MM-dd 23:59:59');
    var sql = 'select * from noodles where uid=? and create_time>? and create_time<?';
    mysql.query(sql, [uid,start_time,end_time],function (err,data) {
        if(err){
            return res.send({code:400,msg:err.toLocaleString()});
        }
        if(data.length == 0){
            return res.send({code:400,msg:'未预定'});
        }
        var sql = 'delete from noodles where uid=? and create_time>? and create_time<?';
        mysql.query(sql, [uid,start_time,end_time],function (err,data) {
            if(err){
                return res.send({code:400,msg:err.toLocaleString()});
            }
            return res.send({code:200,msg:'取消预定成功'});
        });
    });
});

router.post('/check',function(req, res, next) {
    var uid = req.body.uid || req.session.uid;
    var now = new Date();
    var start_time = common.dateFormat(now,'yyyy-MM-dd 00:00:00');
    var end_time = common.dateFormat(now,'yyyy-MM-dd 23:59:59');
    var sql = 'select * from noodles  where uid=? and create_time>? and create_time<?';
    mysql.query(sql, [uid,start_time,end_time],function (err,ret) {
        if(err){
            return res.send({code:400,msg:err.toLocaleString()});
        }
        if(ret.length > 0){
            return res.send({code:200,msg:'已经预定',data:1});
        }else{
            return res.send({code:200,msg:'没有预定',data:0});
        }

    });

});


module.exports = router;