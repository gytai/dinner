var mysql = app.get("mysql");
var common = require('../utils/common');
var crypto = require('crypto');

function register(account,name,avatar) {

    var password = "123456";

    var md5 = crypto.createHash('md5');
    password = md5.update(password).digest('hex');

    return new Promise(function (resolve, reject){
        var sql = 'select * from users where account=?';
        mysql.query(sql, [account,password],function (err,data) {
            if(err){
                return reject(err);
            }
            if(data.length > 0){
                console.log(account+"用户已经注册");
                return resolve(data[0]);
            }
            var sql = 'insert into users(id,account,password,avatar,name,create_time) values(?,?,?,?,?,?)';
            mysql.query(sql, [account,account,password,avatar,name,common.dateFormat()],function (err,data) {
                if(err){
                    return reject(err);
                }
                console.log(account+"用户注册成功");
                return resolve(data)
            });
        });
    });
}

exports.register = register;