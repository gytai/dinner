import React, { Component } from 'react';
import './App.css';
import { NavBar,List, Switch,Toast,Icon} from 'antd-mobile';
import {DateFormat} from "./common"
import { createForm } from 'rc-form';
import axios from 'axios';
import {ServerUrl} from "./AppConfig";
import {
    Link
} from 'react-router-dom'

class  OrderList extends  Component {
    constructor(props) {
        super(props);
        this.state = {
            date : props.date,
            order_list : props.order_list,
            self_is_order :props.self_is_order || false
        };
        const { getFieldProps } = props.form;
        this.getFieldProps = getFieldProps;
        this.updateOrderNum = props.updateOrderNum;
    }

    componentWillReceiveProps(nextProps) {
        this.setState({"self_is_order": nextProps.self_is_order});
        this.setState({"order_list": nextProps.order_list});
    }

    render(){
        let _self = this;
        return (
            <List renderHeader={() =>  this.state.date + ' 订餐明细'}>
                <List.Item
                    extra={<Switch
                        {...this.getFieldProps('Switch1', {
                            initialValue: this.state.self_is_order,
                            valuePropName: 'checked',
                        })}
                        onClick={(checked) => {
                            let url = ServerUrl+'/order';
                            if(!checked){
                                url = ServerUrl+'/cancel';
                            }
                            axios.post(url,{"uid":sessionStorage.getItem("uid")}).then(function (response) {
                                console.log(response);
                                var res = response.data;
                                if(res.code == 200){
                                    Toast.success('操作成功');
                                    _self.updateOrderNum(checked);
                                }else{
                                    Toast.fail('操作失败：'+res.msg);
                                }
                            }).catch(function (error) {
                                console.log(error);
                                Toast.fail('操作失败');
                            });
                        }}
                    />}
                >自己</List.Item>
                {
                    this.state.order_list.map(function (item, i) {
                        return (
                            <List.Item
                                key={item.name}
                                extra={<Switch
                                    {..._self.getFieldProps('Switch'+{i}, {
                                        initialValue: true,
                                        valuePropName: 'checked',
                                    })}
                                    disabled
                                />}
                            >{item.name}</List.Item>
                        )
                    })
                }

            </List>
        );
    }
};

OrderList = createForm()(OrderList);

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            date:DateFormat(new Date(),"yyyy-MM-dd"),
            order_list:[],
            self_no:localStorage.getItem('self_no')?localStorage.getItem('self_no'):'自己',
            self_is_order:false,
            order_num:0
        };

        if(!sessionStorage.getItem("uid")){
            return window.location.href = "/login";
        }

    }

    componentWillMount(){
        var _self = this;
        axios.get(ServerUrl+'/get').then(function (response) {
            let data = response.data;
            if(data.code == 200){
                let list = [];
                data.data.forEach(function (d) {
                    if(d.uid != sessionStorage.getItem('uid')){
                        list.push({"name":d.name,"is_order":true});
                    }else{
                        //_self.state.self_is_order = true;
                        _self.setState({"self_is_order":true});
                    }
                });
                //_self.state.order_list = list;
                _self.setState({"order_list":list});
                if(_self.state.self_is_order){
                    _self.setState({"order_num":_self.state.order_list.length+1});
                }else{
                    _self.setState({"order_num":_self.state.order_list.length});
                }
            }

        }).catch(function (error) {
            console.log(error);
        });
    }

    updateOrderNum(type,e){
        let pre =  this.state.order_num;
        if(type){
            pre += 1;
        }else{
            pre -= 1;
        }
        this.setState({"order_num":pre});
    }

    render() {
        return (
          <div className="App">
              <NavBar
                  mode="dark"
                  onLeftClick={() => console.log('onLeftClick')}
                  rightContent={[
                      <Link key="0" to="/pastry"><Icon type="ellipsis" color="#ffffff"/></Link>,
                  ]}
              >晚餐</NavBar>

              <div className="app-content">
                  <OrderList date={this.state.date}
                             order_list={this.state.order_list}
                             self_is_order={this.state.self_is_order}
                             updateOrderNum={this.updateOrderNum.bind(this)}
                  />
              </div>
              <div className="app-footer">
                    今日订餐人数：{this.state.order_num}
              </div>
          </div>
        );
    }
}

export default App;
