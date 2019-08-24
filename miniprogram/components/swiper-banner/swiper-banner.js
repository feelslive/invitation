// component/swiper-banner/swiper-banner.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        banner: {
            type: Array
        },
        indicatorDots: {
            type: Boolean,
            value: true
        },
        autoplay: {
            type: Boolean,
            value: true
        },
        interval: {
            type: Number,
            value: 5000
        },
        duration: {
            type: Number,
            value: 300
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        banner: [],
        indicatorDots: true,
        autoplay: false,
        interval: 5000,
        duration: 600
    },

    /**
     * 组件的方法列表
     */
    methods: {
      previewImage(e){
        console.log(e)
        wx.previewImage({
          current: e.currentTarget.dataset.item, // 当前显示图片的http链接
          urls: this.data.banner // 需要预览的图片http链接列表
        })
      }
    }
});
