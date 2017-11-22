import React, { Component } from 'react';
import { Toast,NavBar,InputItem,Button,List,Icon } from 'antd-mobile';
import axios from 'axios';
import {ServerUrl} from "./AppConfig";
import PropTypes from 'prop-types';
import './Pastry.css'

class Register extends Component {
    constructor(props) {
        super(props);
        this.state = {
            baozi_num:'0',
            mantou_num:'0',
            baozi_left_num:'0',
            mantou_left_num:'0',
            pastry_order_start_time:sessionStorage.getItem("pastry_order_start_time"),
            pastry_order_end_time:sessionStorage.getItem("pastry_order_end_time"),
            pastry_baozi_sum:sessionStorage.getItem("pastry_baozi_sum"),
            pastry_mantou_sum:sessionStorage.getItem("pastry_mantou_sum"),
        };
        this.order = this.order.bind(this);

        if(!sessionStorage.getItem("uid")){
            window.location.href = ServerUrl;
        }

        var _self = this;
        this.timer = setInterval(function () {
            axios.get(ServerUrl+'/pastry/left').then(function(res){
                console.log(res);
                if(res.data && res.data.code == 200){
                    var data = res.data.data;
                    _self.setState({baozi_left_num: data.baozi_num});
                    _self.setState({mantou_left_num: data.mantou_num});
                }
            });
        },1500);
    }

    componentWillUnmount(){
        clearInterval(this.timer);
    }

    static contextTypes = {
        router: PropTypes.object.isRequired
    };

    handleBaoziChange(data) {
        this.setState({baozi_num: data});
    }

    handleMantouChange(data) {
        this.setState({mantou_num: data});
    }


    order() {
        if(this.state.baozi_num + this.state.mantou_num == 0){
            return Toast.fail('请输入面点数量');
        }

        var _self = this;
        axios.post(ServerUrl+'/pastry/order',{
            baozi_num:this.state.baozi_num,
            mantou_num:this.state.mantou_num,
            uid:sessionStorage.getItem("uid")
        }).then(function(res){
            console.log(res);
            if(res.data && res.data.code == 200){
                Toast.success('预定成功');
            }else{
                Toast.fail('预定失败：'+res.data.msg);
            }
        }).catch(function(err){
            console.log(err);
            Toast.fail('预定失败');
        });
    }

    render() {
        return (
            <div>
                <NavBar
                    mode="dark"
                    icon={<Icon type="left" />}
                    onLeftClick={() =>  this.context.router.history.push("/")}
                >面点秒杀</NavBar>

                <div className="marquee">
                    <marquee>预定开始时间：{ this.state.pastry_order_start_time},预定结束时间：{ this.state.pastry_order_end_time}</marquee>
                </div>

                <div>
                    <List>
                        <InputItem
                            type="number"
                            placeholder="请输入包子数量"
                            value={this.state.baozi_num}
                            onChange={this.handleBaoziChange.bind(this)}
                        >包子</InputItem>
                        <InputItem
                            type="text"
                            placeholder="请输入包子数量"
                            value={this.state.mantou_num}
                            onChange={this.handleMantouChange.bind(this)}
                        >馒头</InputItem>
                    </List>
                </div>
                <Button type="primary" style={{marginTop:40,marginLeft:20,marginRight:20}} onClick={this.order}>立即秒杀</Button>

                <div className="bottom-display">
                    <div>
                        包子剩余数量：{this.state.baozi_left_num}
                    </div>
                    <div>
                        馒头剩余数量：{this.state.mantou_left_num}
                    </div>
                </div>
            </div>
        );
    }
}

export default Register;