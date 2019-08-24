//防止多次重复点击  （函数节流）
const throttle = (fn, gapTime) => {
    if (gapTime == null || gapTime == undefined) {
        gapTime = 1000
    }
    let _lastTime = null
    // 返回新的函数
    return function (e) {
        let _nowTime = +new Date()
        if (_nowTime - _lastTime > gapTime || !_lastTime) {
            // fn.apply(this, arguments)   //将this和参数传给原函数
            fn(this, e) //上方法不可行的解决办法 改变this和e
            _lastTime = _nowTime
        }
    }
}
const trim = str => {
    return str.replace(/(^[\s\n\t]+|[\s\n\t]+$)/g, "");
};
//时间戳转标准时间 年月日时分
const formatDateYMDHM = time => {
    var date = new Date(time * 1000); //时间戳为10位需*1000，时间戳为13位的话不需乘1000
    var Y = date.getFullYear() + "-";
    var M =
        (date.getMonth() + 1 < 10 ?
            "0" + (date.getMonth() + 1) :
            date.getMonth() + 1) + "-";
    var D = (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) + " ";
    var h =
        (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) + ":";
    var m =
        date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    var s = date.getSeconds();
    return Y + M + D + h + m;
};
module.exports = {
    throttle,
    trim,
    formatDateYMDHM
}