var express = require('express');
var router = express.Router();
var mysql = app.get("mysql");
var common = require('../utils/common');
var crypto = require('crypto');
var config = require('../config');

router.use(function (req, res, next) {
    if(!req.session.uid){
        return res.redirect('/');
    }
    next();
});

router.get('/',function (req, res, next) {
    var uid = req.session.uid;
    var now = new Date();
    var start_time = common.dateFormat(now,'yyyy-MM-dd 00:00:00');
    var end_time = common.dateFormat(now,'yyyy-MM-dd 23:59:59');
    var sql = 'select * from pastry where uid=? and create_time>? and create_time<?';
    mysql.query(sql, [uid,start_time,end_time],function (err,pdata) {
        var time = common.dateFormat();
        var baozi_num = 0;
        var mantou_num = 0;
        if(pdata.length > 0){
            pdata = pdata[0];
            baozi_num = pdata.baozi_num;
            mantou_num = pdata.mantou_num;
            time:pdata.time
        }

        sql = "select * from noodles where uid=? and create_time>? and create_time<?";

        mysql.query(sql, [uid,start_time,end_time],function (err,noodles) {
            var noodles_num = 0;
            if(noodles.length > 0){
                noodles_num = 1;
            }
            res.render("users",{
                name:req.session.name,
                uid:req.session.uid,
                avatar:req.session.avatar,
                mantou_num:mantou_num,
                baozi_num:baozi_num,
                time:time,
                noodles_num:noodles_num
            });
        });
    });

});

router.post('/reset', function(req, res, next) {
    var name = req.body.name;
    var password = req.body.password;
    var uid = req.body.uid;

    if(!password){
        return res.send({code:400,msg:'缺少参数'});
    }

    var md5 = crypto.createHash('md5');
    password = md5.update(password).digest('hex');

    var sql = 'update users set password=?';
    var cons = [password];
    if(name){
        sql += ',name=?';
        cons.push(name);
    }
    sql += ' where id=?';
    cons.push(uid);
    mysql.query(sql, cons,function (err,data) {
        if(err){
            return res.send({code:400,msg:err.toLocaleString()});
        }
        return res.send({code:200,msg:'修改成功'});
    });
});

router.post('/login', function(req, res, next) {
    var account = req.body.account;
    var password = req.body.password;

    var md5 = crypto.createHash('md5');
    password = md5.update(password).digest('hex');

    var sql = 'select * from users where account=? and password=?';
    mysql.query(sql, [account,password],function (err,data) {
        if(err){
            return res.send({code:400,msg:err.toLocaleString()});
        }
        if(data.length > 0){
            var user = data[0];
            req.session.uid = user.id;
            req.session.account = user.account;
            return res.send({code:200,msg:'登录成功',data:{uid:user.id,name:user.name},config:config.dinner});
        }else{
            return res.send({code:400,msg:'用户名或者密码错误'});
        }
    });

});

router.post('/register', function(req, res, next) {
    var account = req.body.account;
    var password = req.body.password;
    var name = req.body.name;

    var md5 = crypto.createHash('md5');
    password = md5.update(password).digest('hex');

    var sql = 'select * from users where account=?';
    mysql.query(sql, [account,password],function (err,data) {
        if(err){
            return res.send({code:400,msg:err.toLocaleString()});
        }
        if(data.length > 0){
            return res.send({code:400,msg:'用户名已存在'});
        }
        var sql = 'insert into users(account,password,name,create_time) values(?,?,?,?)';
        mysql.query(sql, [account,password,name,common.dateFormat()],function (err,data) {
            if(err){
                return res.send({code:400,msg:err.toLocaleString()});
            }
            return res.send({code:200,msg:'注册成功'});
        });
    });
});
module.exports = router;
