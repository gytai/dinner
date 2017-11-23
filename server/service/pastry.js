var mysql = app.get("mysql");
var common = require('../utils/common');
var config = require('../config');
var redis = require('../utils/redis');

function getBaoziMantouNum() {
    return new Promise(function (resolve, reject){
        redis.get("pastry_baozi_sum",function (err,pastry_baozi_sum) {
            if(err){
                return reject(err,null);
            }
            pastry_baozi_sum = parseInt(pastry_baozi_sum);
            redis.get("pastry_mantou_sum",function (err,pastry_mantou_sum) {
                if(err){
                    return reject(err,null);
                }
                pastry_mantou_sum = parseInt(pastry_mantou_sum);
                return resolve({pastry_baozi_sum:pastry_baozi_sum,pastry_mantou_sum:pastry_mantou_sum});
            });
        });

    });
}

function checkOrder(uid) {
    return new Promise(function (resolve, reject){
        var now = new Date();
        var start_time = common.dateFormat(now,'yyyy-MM-dd 00:00:00');
        var end_time = common.dateFormat(now,'yyyy-MM-dd 23:59:59');
        var sql = 'select * from pastry where uid=? and create_time>? and create_time<?';
        mysql.query(sql, [uid,start_time,end_time],function (err,pdata) {
            if(err){
                return reject(err,null);
            }
            if(pdata.length > 0){
                return resolve(true)
            }else{
                return resolve(false)
            }
        });
    });
}

function getOrderDetail(uid) {
    return new Promise(function (resolve, reject){
        var now = new Date();
        var start_time = common.dateFormat(now,'yyyy-MM-dd 00:00:00');
        var end_time = common.dateFormat(now,'yyyy-MM-dd 23:59:59');
        var sql = 'select * from pastry where uid=? and create_time>? and create_time<?';
        mysql.query(sql, [uid,start_time,end_time],function (err,pdata) {
            if(err){
                return reject(err,null);
            }
            if(pdata.length > 0){
                return resolve({baozi_num:pdata[0].baozi_num,mantou_num:pdata[0].mantou_num})
            }else{
                return resolve({baozi_num:0,mantou_num:0})
            }
        });
    });
}

async function order(req,res) {
    var uid = req.session.uid;
    var baozi_num = req.body.baozi_num || 0;
    var mantou_num = req.body.mantou_num || 0;

    if(typeof baozi_num == 'string'){
        baozi_num = parseInt(baozi_num);
    }
    if(typeof mantou_num == 'string'){
        mantou_num = parseInt(mantou_num);
    }

    var date = new Date().getTime();

    var pastry_start_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' '+ config.dinner.pastry_order_start_time).getTime();
    var pastry_end_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' '+ config.dinner.pastry_order_end_time).getTime();
    if(date < pastry_start_time){
        return res.send({code:400,msg:"秒杀时间尚未开始..."})
    }

    if(date > pastry_end_time){
        return res.send({code:400,msg:"秒杀时间已经结束..."})
    }

    var dd = await getBaoziMantouNum().catch(function (err){
        console.error(err);
    });

    var pastry_baozi_sum = dd.pastry_baozi_sum;
    var pastry_mantou_sum = dd.pastry_mantou_sum;


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

    var is_order = await checkOrder(uid).catch(function (err){
        console.error(err);
    });

    if(is_order){
        return res.send({code:400,msg:'已经预定'});
    }

    //更新库存
    pastry_baozi_sum -= baozi_num;
    pastry_mantou_sum -= mantou_num;
    redis.set("pastry_baozi_sum",pastry_baozi_sum);
    redis.set("pastry_mantou_sum",pastry_mantou_sum);

    console.log("面点库存-包子："+pastry_baozi_sum+"，馒头："+pastry_mantou_sum);

    //插入数据库
    sql = 'insert into pastry(uid,baozi_num,mantou_num,create_time) values(?,?,?,?)';
    mysql.query(sql, [uid,baozi_num,mantou_num,common.dateFormat()],function (err,data) {
        if(err){
            console.error(err);
        }
    });
    return res.send({code:200,msg:'预定成功'});
}

async function cancel(req,res) {
    var uid = req.session.uid;

    var date = new Date().getTime();

    var pastry_start_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' ' + config.dinner.pastry_order_start_time).getTime();
    var pastry_end_time = new Date(common.dateFormat(new Date(),"yyyy-MM-dd") + ' ' + config.dinner.pastry_order_end_time).getTime();
    if(date < pastry_start_time){
        return res.send({code:400,msg:"秒杀时间尚未开始，不能取消..."})
    }

    if(date > pastry_end_time){
        return res.send({code:400,msg:"秒杀时间已经结束，不能取消..."})
    }

    var dd = await getBaoziMantouNum().catch(function (err){
        console.error(err);
    });

    var pastry_baozi_sum = dd.pastry_baozi_sum;
    var pastry_mantou_sum = dd.pastry_mantou_sum;

    //检查是否预定
    var is_order = await checkOrder(uid).catch(function (err){
        console.error(err);
    });

    if(!is_order){
        return res.send({code:400,msg:'没有预定，不能取消'});
    }

    var d_num = await getOrderDetail(uid).catch(function (err) {
        console.error(err);
    });

    //更新库存
    pastry_baozi_sum += d_num.baozi_num;
    pastry_mantou_sum += d_num.mantou_num;
    redis.set("pastry_baozi_sum",pastry_baozi_sum);
    redis.set("pastry_mantou_sum",pastry_mantou_sum);

    console.log("面点库存-包子："+pastry_baozi_sum+"，馒头："+pastry_mantou_sum);

    //插入数据库
    sql = 'delete from pastry where uid=?';
    mysql.query(sql, [uid],function (err,data) {
        if(err){
            console.error(err);
        }
    });
    return res.send({code:200,msg:'取消成功'});
}

async function left() {
    var dd = await pastry.getBaoziMantouNum().catch(function (err){
        console.error(err);
    });
    var pastry_baozi_sum = dd.pastry_baozi_sum;
    var pastry_mantou_sum = dd.pastry_mantou_sum;
    return res.send({code:200,msg:'获取成功',data:{"baozi_num":pastry_baozi_sum,"mantou_num":pastry_mantou_sum}});
}

exports.getBaoziMantouNum = getBaoziMantouNum;
exports.checkOrder = checkOrder;
exports.order = order;
exports.cancel = cancel;
exports.left = left;