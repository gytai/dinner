var schedule = require("node-schedule");
var redis = require('../utils/redis');
var config = require('../config');

function reset_pastry_num() {
    //每天凌晨一点重置面点数量
    schedule.scheduleJob('00 00 01 * * *', function(){
        redis.set("pastry_baozi_sum",config.dinner.pastry_baozi_sum);
        redis.set("pastry_mantou_sum",config.dinner.pastry_mantou_sum);
        console.log("重置面点数量成功");
    });

    redis.set("pastry_baozi_sum",config.dinner.pastry_baozi_sum);
    redis.set("pastry_mantou_sum",config.dinner.pastry_mantou_sum);
}

exports.reset_pastry_num = reset_pastry_num;