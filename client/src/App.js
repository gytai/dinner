import React, { Component } from 'react';
import './App.css';
import { NavBar,List, Switch,Toast,Icon,PullToRefresh} from 'antd-mobile';
import {DateFormat,GetQueryString,GetCookie} from "./common"
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
            avatar : props.avatar,
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
                    thumb={this.state.avatar}
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
                                thumb={item.avatar}
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
            order_num:0,
            avatar:"/default_avatar.png",//sessionStorage.getItem("avatar")?sessionStorage.getItem("avatar"):"/default_avatar.png",
            refreshing: false,
            down: false,
            height: document.documentElement.clientHeight - 85,
            page:1,
            size:10,
            isComplete:false
        };
        this.getData = this.getData.bind(this);

        if(GetQueryString("userid")){
            sessionStorage.setItem("uid",GetQueryString("userid"));
            sessionStorage.setItem("uname",GetQueryString("name"));
            sessionStorage.setItem("avatar",GetQueryString("avatar"));
            sessionStorage.setItem("pastry_order_start_time",GetQueryString("pastry_order_start_time"));
            sessionStorage.setItem("pastry_order_end_time",GetQueryString("pastry_order_end_time"));
            sessionStorage.setItem("pastry_baozi_sum",GetQueryString("pastry_baozi_sum"));
            sessionStorage.setItem("pastry_mantou_sum",GetQueryString("pastry_mantou_sum"));
        }

        if(!sessionStorage.getItem("uid")){
            window.location.href = ServerUrl;
        }
    }

    getData(){
        var _self = this;
        if(this.state.isComplete){
            _self.setState({ refreshing: false });
            return;
        }
        _self.setState({ refreshing: true });
        axios.get(ServerUrl+'/get?page='+this.state.page+'&size='+this.state.size).then(function (response) {
            let data = response.data;
            if(data.code == 200){
                let list = _self.state.order_list;
                data.data.forEach(function (d) {
                    if(d.uid != sessionStorage.getItem('uid')){
                        list.push({"name":d.name,"is_order":true});
                    }else{
                        _self.setState({"self_is_order":true});
                    }
                });
                _self.setState({"order_list":list});
                _self.setState({"order_num":data.total});

                if(data.data.length < _self.state.size){
                    _self.setState({ isComplete: true });
                }else{
                    _self.setState({ page: _self.state.page + 1 });
                }

                _self.setState({ refreshing: false });
            }

        }).catch(function (error) {
            console.log(error);
        });
    }

    componentWillMount(){
        this.getData();
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
                  <PullToRefresh
                      ref={el => this.ptr = el}
                      style={{
                          height: this.state.height,
                          overflow: 'auto',
                      }}
                      indicator={this.state.down ? {} : { deactivate: '上拉可以刷新' }}
                      direction={this.state.down ? 'down' : 'up'}
                      refreshing={this.state.refreshing}
                      onRefresh={() => {
                          this.getData();
                      }}
                  >
                      <OrderList date={this.state.date}
                                 avatar={this.state.avatar}
                                 order_list={this.state.order_list}
                                 self_is_order={this.state.self_is_order}
                                 updateOrderNum={this.updateOrderNum.bind(this)}
                      />
                  </PullToRefresh>
              </div>
              <div className="app-footer">
                    今日订餐人数：{this.state.order_num}
              </div>
          </div>
        );
    }
}

export default App;
