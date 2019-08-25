const app = getApp()
Page({
    data: {
        scrollindex: 0, //当前页面的索引值
        totalnum: 4, //总共页面数
        starty: 0, //开始的位置x
        endy: 0, //结束的位置y
        critical: 100, //触发翻页的临界值
        margintop: 0, //滑动下拉距离
        userInfo: {},
        isAuth: false,
        on: true // 控制音乐的状态，以及图标是否旋转
    },
    onLoad: function () {
        // 获取用户信息
        wx.getSetting({
            success: res => {
                if (res.authSetting["scope.userInfo"]) {
                    // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
                    wx.getUserInfo({
                        success: res => {
                            // 可以将 res 发送给后台解码出 unionId
                            app.globalData.userInfo = res.userInfo;
                            this.setData({
                                isAuth: false
                            })
                            wx.showTabBar()
                        },
                        fail: err => {
                            this.setData({
                                isAuth: true
                            })
                            wx.hideTabBar()
                        }
                    });
                } else {
                    this.setData({
                        isAuth: true
                    })
                    wx.hideTabBar()
                }
            }
        });
        this.onGetOpenid()
    },
    onGetUserInfo: function (e) {
        if (e.detail.userInfo) {
            console.log(e.detail.userInfo)
            this.setData({
                avatarUrl: e.detail.userInfo.avatarUrl,
                nickName: e.detail.userInfo.nickName,
                userInfo: e.detail.userInfo,
                isAuth: false
            })
            wx.showTabBar()
            this.onGetOpenid()
        }
    },
    onGetOpenid: function () {
        // 调用云函数
        wx.cloud.callFunction({
            name: 'login',
            data: {},
            success: res => {
                console.log('[云函数] [login] user openid: ', res.result.openid)
                app.globalData.openid = res.result.openid
                this.onAdd()
            },
            fail: err => {
                console.error('[云函数] [login] 调用失败', err)
                // wx.navigateTo({
                //     url: '../deployFunctions/deployFunctions',
                // })
            }
        })
    },
    onAdd: function () {
        const db = wx.cloud.database()
        db.collection('users').add({
            data: {
                nick_name: this.data.nickName,
                avatar_url: this.data.avatarUrl
            },
            success: res => {},
            fail: err => {}
        })
    },

    scrollTouchstart: function (e) {
        let py = e.touches[0].pageY;
        this.setData({
            starty: py
        })
    },
    scrollTouchmove: function (e) {
        let py = e.touches[0].pageY;
        let d = this.data;
        this.setData({
            endy: py,
        })
        if (py - d.starty < 100 && py - d.starty > -100) {
            this.setData({
                margintop: py - d.starty
            })
        }
    },
    scrollTouchend: function (e) {
        let d = this.data;
        if (d.endy - d.starty > 100 && d.scrollindex > 0) {
            this.setData({
                scrollindex: d.scrollindex - 1
            })
        } else if (d.endy - d.starty < -100 && d.scrollindex < this.data.totalnum - 1) {
            this.setData({
                scrollindex: d.scrollindex + 1
            })
        }
        this.setData({
            starty: 0,
            endy: 0,
            margintop: 0
        })
    },
    // 放在onReady函数中，使在进入页面后，音乐就自动开始
    onReady() {
        // 获取BackgroundAudioManager 实例
        this.back = wx.getBackgroundAudioManager()

        // 对实例进行设置
        this.back.src = "cloud://dev-1127.6465-dev-1127/mp3/youdiantian.mp3"
        this.back.title = 'Tassel' // 标题为必选项
        this.back.play() // 开始播放
    },
    stop() {
        this.back.pause(); // 点击音乐图标后出发的操作
        this.setData({
            on: !this.data.on
        })
        console.log(this.data.on)
        if (this.data.on) {
            this.back.play()
        } else {
            this.back.pause()
        }
    },
    //查看地图
    lookMap(e) {
        // 查看地图
        wx.openLocation({
            latitude: Number(38.715351),
            longitude: Number(115.031362),
            scale: 10,
            name: "婚礼地点",
            address: "保定市唐县仁厚镇黄家庄村"
        });
    },
    //查看地图
    lookMap2(e) {
        // 查看地图
        wx.openLocation({
            latitude: Number(39.950970),
            longitude: Number(116.415920),
            scale: 18,
            name: "席设地点",
            address: "东城区和平里西街77号金鼎轩(地坛店)"
        });
    },
    callMan(){
        wx.makePhoneCall({
            phoneNumber: "15711177508",
            success: res => {
                //电话号码
            }
        });
    },
    callWoMan(){
        wx.makePhoneCall({
            phoneNumber: "15010059224",
            success: res => {
                //电话号码
            }
        });
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        return {
            title: '王付康&安灿灿的婚礼诚挚邀请',
            path: '/pages/home/home',
            imageUrl:"../../images/7.jpg"
          }
    }
})