var express = require('express');
var router = express.Router();
var pastry = require('../service/pastry');
var config = require('../config');

router.use(function (req, res, next) {
    if(!req.session.uid){
        return res.redirect('/');
    }
    next();
});

router.get('/',function (req, res, next) {
    var uid = req.session.uid;
    pastry.checkOrder(uid).then(function (is_order) {
        if(is_order){
            pastry.getOrderDetail(uid).then(function (d) {
                res.render("pastry_order",{
                    pastry_order_start_time:config.dinner.pastry_order_start_time,
                    pastry_baozi_sum:config.dinner.pastry_baozi_sum,
                    pastry_mantou_sum:config.dinner.pastry_mantou_sum,
                    pastry_max:config.dinner.pastry_max,
                    is_order:is_order,
                    baozi_num:d.baozi_num,
                    mantou_num:d.mantou_num
                });
            }).catch(function (err) {
                res.send({code:400,msg:err.toLocaleString()})
            })
        }else{
            res.render("pastry_order",{
                pastry_order_start_time:config.dinner.pastry_order_start_time,
                pastry_baozi_sum:config.dinner.pastry_baozi_sum,
                pastry_mantou_sum:config.dinner.pastry_mantou_sum,
                pastry_max:config.dinner.pastry_max,
                is_order:is_order,
                baozi_num:0,
                mantou_num:0
            });
        }
    }).catch(function (err) {
        res.send({code:400,msg:err.toLocaleString()})
    });

});

router.post('/order', function(req, res, next) {
    pastry.order(req,res);
});


router.post('/cancel', function(req, res, next) {
    pastry.cancel(req,res);
});

router.get('/left', function(req, res, next) {
    pastry.left(req,res);
});

router.post('/check', function(req, res, next) {
    var uid = req.session.uid;
    pastry.checkOrder(uid).then(function (is_order) {
        res.send({code:200,msg:"获取成功",data:is_order})
    }).catch(function (err) {
        res.send({code:400,msg:err.toLocaleString()})
    });
});

module.exports = router;