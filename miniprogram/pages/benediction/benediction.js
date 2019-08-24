const app = getApp()
const utils = require("../../utils/util")
var ctx = null;
var factor = {
    speed: .008, // 运动速度，值越小越慢
    t: 0 //  贝塞尔函数系数
};
var timer = null; // 循环定时器
var lastFrameTime = 0;
// 模拟 requestAnimationFrame
var doAnimationFrame = function (callback) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (currTime - lastFrameTime));
    var id = setTimeout(function () {
        callback(currTime + timeToCall);
    }, timeToCall);
    lastFrameTime = currTime + timeToCall;
    return id;
};
// 模拟 cancelAnimationFrame
var abortAnimationFrame = function (id) {
    clearTimeout(id)
}
Page({

    /**
     * 页面的初始数据
     */
    data: {
        style_img: '',
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        if (app.globalData.openid) {
            this.setData({
                openid: app.globalData.openid
            })
        }
        ctx = wx.createCanvasContext('canvas_wi')
        this.startTimer();
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
        this.onQueryAllUser()
        this.onQueryUser()
    },
    sortKey(array, key) {
        return array.sort(function(a, b) {
          var x = a[key];
          var y = b[key];
          return x > y ? -1 : x < y ? 1 : 0;
        });
    },
    onQueryAllUser: function () {
        const db = wx.cloud.database()
        // 查询当前用户所有的 counters
        db.collection('blessings').get({
            success: res => {
                console.log("onQueryAllUser", res)
                if (res.data.length !== 0) {
                    let list = this.sortKey(res.data,"date")
                    this.setData({
                        queryAllResult: list,
                    })
                    console.log("queryAllResult", this.data.queryAllResult)
                }else{
                    this.setData({
                        queryAllResult: [],
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
    onQueryUser: function () {
        const db = wx.cloud.database()
        // 查询当前用户所有的 counters
        console.log("this.data.openid", this.data.openid)
        db.collection('blessings').where({
            _openid: this.data.openid
        }).get({
            success: res => {
                console.log("onQueryUser==", res)
                if (res.data.length == 0) {
                    this.setData({
                        isLike: false
                    })
                    console.log("isLike==", this.data.isLike)
                } else {
                    this.setData({
                        isLike: true
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
        const db = wx.cloud.database()
        db.collection('blessings').add({
            data: {
                avatarUrl: app.globalData.userInfo.avatarUrl,
                nickName: app.globalData.userInfo.nickName,
                date: Date.parse(new Date())
            },
            success: res => {
                // 在返回结果中会包含新创建的记录的 _id
                that.setData({
                    isLike: true
                })
                wx.showModal({
                    title: '(✿◡‿◡)',
                    showCancel: false,
                    confirmText: "好的",
                    confirmColor: "#ef8783",
                    content: '您的爱心祝福我们收到了 o(*￣3￣)o',
                    success(res) {
                        if (res.confirm) {
                            console.log('用户点击确定')
                        } else if (res.cancel) {
                            console.log('用户点击取消')
                        }
                    }
                })
                that.onQueryAllUser()
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
    twice:utils.throttle((that, e) => {
        console.log("twice")
        wx.showModal({
            title: '(✿◡‿◡)',
            showCancel: false,
            confirmText: "好的",
            confirmColor: "#ef8783",
            content: '您已经祝福过了 o(*￣3￣)o',
            success(res) {
                if (res.confirm) {
                    console.log('用户点击确定')
                } else if (res.cancel) {
                    console.log('用户点击取消')
                }
            }
        })
    }),
    drawImage: function (data) {
        var that = this
        var p10 = data[0][0]; // 三阶贝塞尔曲线起点坐标值
        var p11 = data[0][1]; // 三阶贝塞尔曲线第一个控制点坐标值
        var p12 = data[0][2]; // 三阶贝塞尔曲线第二个控制点坐标值
        var p13 = data[0][3]; // 三阶贝塞尔曲线终点坐标值

        var p20 = data[1][0];
        var p21 = data[1][1];
        var p22 = data[1][2];
        var p23 = data[1][3];

        var p30 = data[2][0];
        var p31 = data[2][1];
        var p32 = data[2][2];
        var p33 = data[2][3];

        var t = factor.t;

        /*计算多项式系数 （下同）*/
        var cx1 = 3 * (p11.x - p10.x);
        var bx1 = 3 * (p12.x - p11.x) - cx1;
        var ax1 = p13.x - p10.x - cx1 - bx1;

        var cy1 = 3 * (p11.y - p10.y);
        var by1 = 3 * (p12.y - p11.y) - cy1;
        var ay1 = p13.y - p10.y - cy1 - by1;

        var xt1 = ax1 * (t * t * t) + bx1 * (t * t) + cx1 * t + p10.x;
        var yt1 = ay1 * (t * t * t) + by1 * (t * t) + cy1 * t + p10.y;

        /** ---------------------------------------- */
        var cx2 = 3 * (p21.x - p20.x);
        var bx2 = 3 * (p22.x - p21.x) - cx2;
        var ax2 = p23.x - p20.x - cx2 - bx2;

        var cy2 = 3 * (p21.y - p20.y);
        var by2 = 3 * (p22.y - p21.y) - cy2;
        var ay2 = p23.y - p20.y - cy2 - by2;

        var xt2 = ax2 * (t * t * t) + bx2 * (t * t) + cx2 * t + p20.x;
        var yt2 = ay2 * (t * t * t) + by2 * (t * t) + cy2 * t + p20.y;


        /** ---------------------------------------- */
        var cx3 = 3 * (p31.x - p30.x);
        var bx3 = 3 * (p32.x - p31.x) - cx3;
        var ax3 = p33.x - p30.x - cx3 - bx3;

        var cy3 = 3 * (p31.y - p30.y);
        var by3 = 3 * (p32.y - p31.y) - cy3;
        var ay3 = p33.y - p30.y - cy3 - by3;

        /*计算xt yt的值 */
        var xt3 = ax3 * (t * t * t) + bx3 * (t * t) + cx3 * t + p30.x;
        var yt3 = ay3 * (t * t * t) + by3 * (t * t) + cy3 * t + p30.y;
        factor.t += factor.speed;
        ctx.drawImage("../../images/heart1.png", xt1, yt1, 30, 30);
        ctx.drawImage("../../images/heart2.png", xt2, yt2, 30, 30);
        ctx.drawImage("../../images/heart3.png", xt3, yt3, 30, 30);
        ctx.draw();
        if (factor.t > 1) {
            factor.t = 0;
            // cancelAnimationFrame(timer);
            abortAnimationFrame(timer);
            that.startTimer();
        } else {
            // timer = requestAnimationFrame(function () {
            timer = doAnimationFrame(function () {
                that.drawImage([
                    [{
                        x: 30,
                        y: 400
                    }, {
                        x: 70,
                        y: 300
                    }, {
                        x: -50,
                        y: 150
                    }, {
                        x: 30,
                        y: 0
                    }],
                    [{
                        x: 30,
                        y: 400
                    }, {
                        x: 30,
                        y: 300
                    }, {
                        x: 80,
                        y: 150
                    }, {
                        x: 30,
                        y: 0
                    }],
                    [{
                        x: 30,
                        y: 400
                    }, {
                        x: 0,
                        y: 90
                    }, {
                        x: 80,
                        y: 100
                    }, {
                        x: 30,
                        y: 0
                    }]
                ])
            })
        }


    },
    onClickImage: function (e) {
        var that = this
        that.setData({
            style_img: 'transform:scale(1.3);'
        })
        setTimeout(function () {
            that.setData({
                style_img: 'transform:scale(1);'
            })
        }, 500)
    },
    startTimer: function () {
        var that = this
        that.setData({
            style_img: 'transform:scale(1.3);'
        })
        setTimeout(function () {
            that.setData({
                style_img: 'transform:scale(1);'
            })
        }, 500)
        that.drawImage([
            [{
                x: 30,
                y: 400
            }, {
                x: 70,
                y: 300
            }, {
                x: -50,
                y: 150
            }, {
                x: 30,
                y: 0
            }],
            [{
                x: 30,
                y: 400
            }, {
                x: 30,
                y: 300
            }, {
                x: 80,
                y: 150
            }, {
                x: 30,
                y: 0
            }],
            [{
                x: 30,
                y: 400
            }, {
                x: 0,
                y: 90
            }, {
                x: 80,
                y: 100
            }, {
                x: 30,
                y: 0
            }]
        ])

    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        if (timer != null) {
            // cancelAnimationFrame(timer);
            abortAnimationFrame(timer);
        }
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})