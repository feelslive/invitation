const app = getApp()
const utils = require("../../utils/util")
let currentPage = 0 // 当前第几页,0代表第一页 
let pageSize = 10 //每页显示多少数据 
Page({
    data: {
        msg: "",
        flag: true,
        allMsg: [],
        dataList: [], //放置返回数据的数组  
        loadMore: false, //"上拉加载"的变量，默认false，隐藏  
        loadAll: false //“没有数据”的变量，默认false，隐藏 
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
        // this.onQueryAllMsg();
        // this.getData();
        this.getAll()
    },
    getAll(){
        // 调用云函数
        wx.cloud.callFunction({
            name: 'queryMsg',
            data: {},
            success: res => {
                console.log('[云函数]', res.result.data)
                if (res.result.data.length !== 0) {
                    let list = this.sortKey(res.result.data, "date")
                    for (let i = 0; i < list.length; i++) {
                        list[i].date = utils.formatDateYMDHM(list[i].date)
                    }
                    this.setData({
                        dataList: list,
                    })
                } else {
                    this.setData({
                        dataList: [],
                    })
                }
            },
            fail: err => {
                console.error('[云函数]', err)
            }
        })
    },
    sortKey(array, key) {
        return array.sort(function (a, b) {
            var x = a[key];
            var y = b[key];
            return x > y ? -1 : x < y ? 1 : 0;
        });
    },
    getMsg(e) {
        this.setData({
            msg: e.detail.value
        })
    },
    onQueryAllMsg: function () {
        const db = wx.cloud.database()
        db.collection('message').get({
            success: res => {
                console.log("onQueryAllMsg", res)
                if (res.data.length !== 0) {
                    let list = this.sortKey(res.data, "date")
                    for (let i = 0; i < list.length; i++) {
                        list[i].date = utils.formatDateYMDHM(list[i].date)
                    }
                    this.setData({
                        allMsg: list,
                    })
                    console.log("allMsg", this.data.allMsg)
                } else {
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
        if (!utils.trim(that.data.msg)) {
            wx.showToast({
                icon: 'none',
                title: '请写下您的祝福语吧'
            })
            return false;
        }
        that.setData({
            flag: false
        })
        const db = wx.cloud.database()
        db.collection('message').add({
            data: {
                msg: that.data.msg,
                avatarUrl: app.globalData.userInfo.avatarUrl,
                nickName: app.globalData.userInfo.nickName,
                date: Date.parse(new Date()) / 1000
            },
            success: res => {
                // 在返回结果中会包含新创建的记录的 _id
                that.setData({
                    msg: "",
                    flag: true
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
                            // that.getData();
                        } else if (res.cancel) {
                            console.log('用户点击取消')
                        }
                    }
                })
                // that.getData();
                that.getAll()
                // that.onQueryAllMsg();
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
    //页面上拉触底事件的处理函数
    // onReachBottom: function () {
    //     console.log("上拉触底事件")
    //     let that = this
    //     if (!that.data.loadMore) {
    //         that.setData({
    //             loadMore: true, //加载中  
    //             loadAll: false //是否加载完所有数据
    //         });

    //         //加载更多，这里做下延时加载
    //         setTimeout(function () {
    //             that.getData()
    //         }, 1000)
    //     }


    // },
    //分页 -- 访问网络,请求数据  
    getData() {
        let that = this;
        //第一次加载数据
        if (currentPage == 1) {
            this.setData({
                loadMore: true, //把"上拉加载"的变量设为true，显示  
                loadAll: false //把“没有数据”设为false，隐藏  
            })
        }
        //云数据的请求
        wx.cloud.database().collection("message")
            .skip(currentPage * pageSize) //从第几个数据开始
            .limit(pageSize)
            .get({
                success(res) {
                    if (res.data && res.data.length > 0) {
                        console.log("请求成功", res.data)
                        currentPage++
                        // let newList = that.sortKey(res.data, "date")
                        let newList = res.data
                        for (let i = 0; i < newList.length; i++) {
                            newList[i].date = utils.formatDateYMDHM(newList[i].date)
                        }
                        //把新请求到的数据添加到dataList里  
                        let list = that.data.dataList.concat(res.data)
                        let newDataList = that.sortKey(list, "date")
                        that.setData({
                            dataList: newDataList, //获取数据数组    
                            loadMore: false //把"上拉加载"的变量设为false，显示  
                        });
                        if (res.data.length < pageSize) {
                            that.setData({
                                loadMore: false, //隐藏加载中。。
                                loadAll: true //所有数据都加载完了
                            });
                        }
                    } else {
                        that.setData({
                            loadAll: true, //把“没有数据”设为true，显示  
                            loadMore: false //把"上拉加载"的变量设为false，隐藏  
                        });
                    }
                },
                fail(res) {
                    console.log("请求失败", res)
                    that.setData({
                        loadAll: false,
                        loadMore: false
                    });
                }
            })
    },
})