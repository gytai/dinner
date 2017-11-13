import React, { Component } from 'react';
import { NavBar,InputItem,Button,WhiteSpace,Toast,List } from 'antd-mobile';
import axios from 'axios';
import {
    Link
} from 'react-router-dom'
import {ServerUrl} from "./AppConfig";

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account:'',
            password:''
        };
        this.login = this.login.bind(this);
    }

    login() {
        if(!this.state.account){
            Toast.fail('工号不能为空.', 1);
            return;
        }
        if(!this.state.password){
            Toast.fail('密码不能为空.', 1);
            return;
        }

        axios.post(ServerUrl+'/users/login',{
            account:this.state.account,
            password:this.state.password
        }).then(function(res){
            console.log(res);
            if(res.data && res.data.code == 200){
                Toast.fail('登录成功');
                sessionStorage.setItem("uid",res.data.data.uid);
                sessionStorage.setItem("uname",res.data.data.name);
                setTimeout(function () {
                    window.location.href = '/';
                },1000);
            }else{
                Toast.fail('登录失败：'+res.data.msg);
            }
        }).catch(function(err){
            console.log(err);
            Toast.fail('登录失败');
        });
    }

    handleAccountChange(data){
        this.setState({account: data});
    }

    handlePasswordChange(data){
        this.setState({password: data});
    }

    render() {
        return (
            <div>
                <NavBar
                    mode="dark"
                    onLeftClick={() => console.log('onLeftClick')}
                >订餐系统</NavBar>
                <List style={{marginTop:100}}>
                    <InputItem
                        type="number"
                        placeholder="请输入工号"
                        value={this.state.account}
                        onChange={this.handleAccountChange.bind(this)}
                    >工号</InputItem>
                    <InputItem
                        type="password"
                        placeholder="请输入密码"
                        value={this.state.password}
                        onChange={this.handlePasswordChange.bind(this)}
                    >密码</InputItem>
                </List>
                <Button type="primary" style={{marginTop:40,marginLeft:20,marginRight:20}} onClick={this.login}>登录</Button>
                <WhiteSpace />
                <label style={{ float:'right',marginRight:20,marginTop:20}} onClick={this.register}>
                    <Link to="/register">快速注册</Link>
                </label>
            </div>
        );
    }
}

export default Login;