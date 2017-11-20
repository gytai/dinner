var express = require('express');
var router = express.Router();
var mysql = app.get("mysql");
var common = require('../utils/common');
var config = require('../config');
var redis = require('../utils/redis');
var Sync = require('sync');

router.post('/order', function(req, res, next) {
    var uid = req.body.uid || res.session.uid;
    var baozi_num = req.body.baozi_num;
    var mantou_num = req.body.mantou_num;

    if(typeof baozi_num == 'string'){
        baozi_num = parseInt(baozi_num);
    }
    if(typeof mantou_num == 'string'){
        mantou_num = parseInt(mantou_num);
    }

    Sync(function () {
        try {
            var date = new Date().getTime();

            var pastry_start_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' '+ config.dinner.pastry_order_start_time).getTime();
            var pastry_end_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' '+ config.dinner.pastry_order_end_time).getTime();
            if(date < pastry_start_time){
                return res.send({code:400,msg:"秒杀时间尚未开始..."})
            }

            if(date > pastry_end_time){
                return res.send({code:400,msg:"秒杀时间已经结束..."})
            }

            var pastry_baozi_sum = redis.get.sync(redis,"pastry_baozi_sum");
            var pastry_mantou_sum = redis.get.sync(redis,"pastry_mantou_sum");


            if(typeof pastry_baozi_sum == 'string'){
                pastry_baozi_sum = parseInt(pastry_baozi_sum);
            }
            if(typeof pastry_mantou_sum == 'string'){
                pastry_mantou_sum = parseInt(pastry_mantou_sum);
            }


            if( pastry_baozi_sum == 0){
                return res.send({code:400,msg:"包子已秒杀结束"})
            }

            if( pastry_mantou_sum == 0){
                return res.send({code:400,msg:"馒头已秒杀结束"})
            }

            if(baozi_num > pastry_baozi_sum){
                return res.send({code:400,msg:"包子数量不足..."})
            }

            if(mantou_num > pastry_mantou_sum){
                return res.send({code:400,msg:"馒头数量不足..."})
            }

            if(baozi_num > config.dinner.pastry_baozi_max){
                return res.send({code:400,msg:"包子超出秒杀上限..."})
            }

            if(mantou_num > config.dinner.pastry_mantou_max){
                return res.send({code:400,msg:"馒头超出秒杀上限..."})
            }

            //检查是否预定
            var sql = 'select * from pastry where uid=?';
            var pdata = mysql.query.sync(mysql,sql, [uid]);
            pdata = pdata[0];
            if(pdata.length > 0){
                return res.send({code:400,msg:'已经预定'});
            }

            //更新库存
            pastry_baozi_sum -= baozi_num;
            pastry_mantou_sum -= mantou_num;
            redis.set("pastry_baozi_sum",pastry_baozi_sum);
            redis.set("pastry_mantou_sum",pastry_mantou_sum);

            //插入数据库
            sql = 'insert into pastry(uid,baozi_num,mantou_num,create_time) values(?,?,?,?)';
            mysql.query(sql, [uid,baozi_num,mantou_num,common.dateFormat()],function (err,data) {
                if(err){
                    console.error(err);
                }
            });
            return res.send({code:200,msg:'预定成功'});

        }catch (err){
            console.error(err);
            return res.send({code:400,msg:"系统错误"})
        }
    });

});


router.post('/cancel', function(req, res, next) {

    var uid = req.body.uid || res.session.uid;

    Sync(function () {
        try {
            var date = new Date().getTime();

            var pastry_start_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' ' + config.dinner.pastry_order_start_time).getTime();
            var pastry_end_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' ' + config.dinner.pastry_order_end_time).getTime();
            if(date < pastry_start_time){
                return res.send({code:400,msg:"秒杀时间尚未开始，不能取消..."})
            }

            if(date > pastry_end_time){
                return res.send({code:400,msg:"秒杀时间已经结束，不能取消..."})
            }

            var pastry_baozi_sum = redis.get.sync(redis,"pastry_baozi_sum");
            var pastry_mantou_sum = redis.get.sync(redis,"pastry_mantou_sum");

            //检查是否预定
            var sql = 'select * from pastry where uid=?';
            var pdata = mysql.query.sync(mysql,sql, [uid]);
            pdata = pdata[0];
            if(pdata.length == 0){
                return res.send({code:400,msg:'没有预定，不能取消'});
            }

            //更新库存
            pastry_baozi_sum += baozi_num;
            pastry_mantou_sum += mantou_num;
            redis.set("pastry_baozi_sum",pastry_baozi_sum);
            redis.set("pastry_mantou_sum",pastry_mantou_sum);

            //插入数据库
            sql = 'delete from pastry where uid=?';
            mysql.query(sql, [uid],function (err,data) {
                if(err){
                    console.error(err);
                }
            });
            return res.send({code:200,msg:'取消成功'});

        }catch (err){
            console.error(err);
            return res.send({code:400,msg:"系统错误"})
        }
    });
});

router.get('/left', function(req, res, next) {
    Sync(function () {
        try {
            var pastry_baozi_sum = redis.get.sync(redis,"pastry_baozi_sum");
            var pastry_mantou_sum = redis.get.sync(redis,"pastry_mantou_sum");
            return res.send({code:200,msg:'获取成功',data:{"baozi_num":pastry_baozi_sum,"mantou_num":pastry_mantou_sum}});
        }catch (err){
            console.error(err);
            return res.send({code:400,msg:"系统错误"})
        }
    });
});

module.exports = router;