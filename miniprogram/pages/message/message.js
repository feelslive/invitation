const app = getApp()
const utils = require("../../utils/util")
Page({
    data:{
        msg:"",
        allMsg:[]
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        // 获取用户信息
        wx.getSetting({
            success: res => {
                if (res.authSetting["scope.userInfo"]) {
                    // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
                    wx.getUserInfo({
                        success: res => {
                            // 可以将 res 发送给后台解码出 unionId
                            app.globalData.userInfo = res.userInfo;
                        },
                        fail: err => {
                            wx.switchTab({
                                url: '/pages/home/home'
                            })
                        }
                    });
                } else {
                    wx.switchTab({
                        url: '/pages/home/home'
                    })
                }
            }
        });
        this.onQueryAllMsg();
    },
    sortKey(array, key) {
        return array.sort(function(a, b) {
          var x = a[key];
          var y = b[key];
          return x > y ? -1 : x < y ? 1 : 0;
        });
    },
    getMsg(e){
        console.log(e.detail.value)
        this.setData({
            msg:e.detail.value
        })
    },
    onQueryAllMsg: function () {
        const db = wx.cloud.database()
        db.collection('message').get({
            success: res => {
                console.log("onQueryAllMsg", res)
                if (res.data.length !== 0) {
                    let list = this.sortKey(res.data,"date")
                    for(let i=0;i<list.length;i++){
                        list[i].date = utils.formatDateYMDHM(list[i].date)
                    }
                    this.setData({
                        allMsg: list,
                    })
                    console.log("allMsg", this.data.allMsg)
                }else{
                    this.setData({
                        allMsg: [],
                    })
                }
            },
            fail: err => {
                wx.showToast({
                    icon: 'none',
                    title: '网坏了，没查到你要的信息'
                })
            }
        })
    },
    onAdd: utils.throttle((that, e) => {
        if(!utils.trim(that.data.msg)){
            wx.showToast({
                icon: 'none',
                title: '请写下您的祝福语吧'
            })
            return false;
        }
        const db = wx.cloud.database()
        db.collection('message').add({
            data: {
                msg:that.data.msg,
                avatarUrl: app.globalData.userInfo.avatarUrl,
                nickName: app.globalData.userInfo.nickName,
                date: Date.parse(new Date()) / 1000
            },
            success: res => {
                // 在返回结果中会包含新创建的记录的 _id
                that.setData({
                    msg: ""
                })
                wx.showModal({
                    title: '(✿◡‿◡)',
                    showCancel: false,
                    confirmText: "好的",
                    confirmColor: "#ef8783",
                    content: '您的祝福语我们收到了 o(*￣3￣)o',
                    success(res) {
                        if (res.confirm) {
                            console.log('用户点击确定')
                        } else if (res.cancel) {
                            console.log('用户点击取消')
                        }
                    }
                })
                that.onQueryAllMsg();
                console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
            },
            fail: err => {
                wx.showToast({
                    icon: 'none',
                    title: '网坏了，一会儿再重新送上祝福'
                })
            }
        })
    }),
})