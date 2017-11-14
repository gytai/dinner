import React, { Component } from 'react';
import { Toast,NavBar,InputItem,Button,List,Icon } from 'antd-mobile';
import axios from 'axios';
import {ServerUrl} from "./AppConfig";
import PropTypes from 'prop-types';

class Register extends Component {
    constructor(props) {
        super(props);
        this.state = {
            job_no:'',
            job_name:'',
            password1:'',
            password2:''
        };
        this.register = this.register.bind(this);
    }

    static contextTypes = {
        router: PropTypes.object.isRequired
    };

    handleJobNoChange(data) {
        this.setState({job_no: data});
    }

    handleJobNameChange(data) {
        this.setState({job_name: data});
    }

    handlePassword1Change(data) {
        this.setState({password1: data});
    }

    handlePassword2Change(data) {
        this.setState({password2: data});
    }

    register() {
        if(!this.state.job_no){
            Toast.fail('工号不能为空.', 1);
            return;
        }
        if(!this.state.job_name){
            this.state.job_name = this.state.job_no;
            return;
        }
        if(this.state.password1 != this.state.password2){
            Toast.fail('两次密码不一致', 1);
            return;
        }
        var _self = this;
        axios.post(ServerUrl+'/users/register',{
            account:this.state.job_no,
            password:this.state.password1,
            name:this.state.job_name?this.state.job_name:this.state.job_no
        }).then(function(res){
            console.log(res);
            if(res.data && res.data.code == 200){
                Toast.fail('注册成功');
                setTimeout(function () {
                    _self.context.router.history.push("/login");
                },1000);
            }else{
                Toast.fail('注册失败：'+res.data.msg);
            }
        }).catch(function(err){
            console.log(err);
            Toast.fail('注册失败');
        });
    }

    render() {
        return (
            <div>
                <NavBar
                    mode="dark"
                    icon={<Icon type="left" />}
                    onLeftClick={() =>  this.context.router.history.push("/login")}
                >注册</NavBar>
                <div>
                    <List>
                        <InputItem
                            type="number"
                            placeholder="请输入工号"
                            value={this.state.job_no}
                            onChange={this.handleJobNoChange.bind(this)}
                        >工号</InputItem>
                        <InputItem
                            type="text"
                            placeholder="请输入真实姓名"
                            value={this.state.job_name}
                            onChange={this.handleJobNameChange.bind(this)}
                        >姓名</InputItem>
                        <InputItem
                            type="password"
                            placeholder="请输入密码"
                            value={this.state.password1}
                            onChange={this.handlePassword1Change.bind(this)}
                        >密码</InputItem>
                        <InputItem
                            type="password"
                            placeholder="请再次输入密码"
                            value={this.state.password2}
                            onChange={this.handlePassword2Change.bind(this)}
                        >确认密码</InputItem>
                    </List>
                </div>
                <Button type="primary" style={{marginTop:40,marginLeft:20,marginRight:20}} onClick={this.register}>注册</Button>
            </div>
        );
    }
}

export default Register;