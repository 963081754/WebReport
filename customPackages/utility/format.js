/* eslint-disable */
//Intl.NumberFormat.prototype.format
/**
 Intl 对象是 ECMAScript 国际化 API 的一个命名空间，它提供了精确的字符串对比、数字格式化，和日期时间格式化。
 Collator，NumberFormat 和 DateTimeFormat 对象的构造函数是 Intl 对象的属性。
 本页文档内容包括了这些属性，以及国际化使用的构造器和其他语言的方法等常见的功能。
 */
// Number.prototype.format = function(){
//      /*
//     * 参数说明：
//     * number：要格式化的数字
//     * decimals：保留几位小数
//     * dec_point：小数点符号
//     * thousands_sep：千分位符号
//     * */
// }

// number_format(1234567.089, 2, ".", ",")//1,234,567.08

const weeks = ['日','一','二','三','四','五','六']

function dateFormat(date,fmt) {
    let ret = null
    const options = {
        "y+": date.getFullYear().toString(),        // 年
        "m+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "M+": date.getMinutes().toString(),         // 分
        "S+": date.getSeconds().toString(),          // 秒
        "W+": weeks[date.getDay()],          // 周几
        "A+": date.getHours()>12 ? `pm ${date.getHours()-12}` : `am ${date.getHours()}`,          // am pm
        "午+": date.getHours()>12 ? `下午${date.getHours()-12}` : `上午${date.getHours()}`          // 上午  下午
    }
    for (let key in options) {
        ret = new RegExp('(' + key + ')').exec(fmt)
        if (ret) {
            fmt = fmt.replace(ret[1], 
                                (ret[1].length == 1 || ret[1].length <= options[key].length) ? options[key] : ((ret[1].replace(new RegExp(ret[1][0],'g'),'0') + options[key]).slice(0 - ret[1].length))
                            )
        }
    }
    return fmt
}

function permillageFormat (num) { 
    return (num+ '').replace(/(\d{1,3})(?=(\d{3})+(?:$|\.))/g,'$1,')
}

const commonDateTimeFormats =  Object.freeze([
    (value)=>dateFormat(value,'yyyy'),
    (value)=>dateFormat(value,'mm'),
    (value)=>dateFormat(value,'dd'),
    
    // (value)=>dateFormat(value,'yyyy-mm-dd'),
    // (value)=>dateFormat(value,'yyyy/mm/dd'),
    // (value)=>dateFormat(value,'yyyy年m月dd日'),

    (value)=>dateFormat(value,'yyyy-mm'),
    (value)=>dateFormat(value,'yyyy-mm-dd'),
    (value)=>dateFormat(value,'yyyy-mm-dd HH'),
    (value)=>dateFormat(value,'yyyy-mm-dd HH:MM'),
    (value)=>dateFormat(value,'yyyy-mm-dd HH:MM:SS'),

    (value)=>dateFormat(value,'yyyy/mm'),
    (value)=>dateFormat(value,'yyyy/mm/dd'),
    (value)=>dateFormat(value,'yyyy/mm/dd HH'),
    (value)=>dateFormat(value,'yyyy/mm/dd HH:MM'),
    (value)=>dateFormat(value,'yyyy/mm/dd HH:MM:SS'),

    (value)=>dateFormat(value,'yyyy年'),
    (value)=>dateFormat(value,'m月'),
    (value)=>dateFormat(value,'d日'),
    (value)=>dateFormat(value,'yyyy年mm月'),
    (value)=>dateFormat(value,'yyyy年mm月dd日'),
    (value)=>dateFormat(value,'yyyy年mm月dd日 HH点'),  
    (value)=>dateFormat(value,'yyyy年mm月dd日 HH点MM分'), 
    (value)=>dateFormat(value,'yyyy年mm月dd日 HH点MM分SS秒'),  
    (value)=>dateFormat(value,'yyyy年mm月dd日 午点'),
    (value)=>dateFormat(value,'yyyy年mm月dd日 午点M分'),
    (value)=>dateFormat(value,'yyyy年mm月dd日 午点MM分SS秒'),

    (value)=>dateFormat(value,'HH'),
    (value)=>dateFormat(value,'HH:MM'),
    (value)=>dateFormat(value,'HH:MM:SS'),
    (value)=>dateFormat(value,'AA'),
    (value)=>dateFormat(value,'AA:MM'),
    (value)=>dateFormat(value,'AA:MM:SS'),
    (value)=>dateFormat(value,'午点M分'),
    (value)=>dateFormat(value,'午点M分S秒'),

    (value)=>dateFormat(value,'周W')
])

const commonNumberFormats = Object.freeze([ // value=Number
    {demo:'12345',func:(value)=>Math.round(new Number(value))},
    {demo:'12345.00',func:(value)=>new Number(value).toFixed(2)},
    {demo:'12,345.00',func:(value)=>permillageFormat(new Number(value).toFixed(2))},
    {demo:'1.23e+4',func:(value)=>new Number(value).toExponential(2)},
    {demo:'1.2e+4',func:(value)=>new Number(value).toPrecision(2)}
])

const commonFormat = function(value,{format,type}){
    if(value === null || value === undefined || value === '') return value

    if(type === 'd'){
      const dt = new Date(value)
      if(isNaN(dt)){
        return value
      }else{
        return commonDateTimeFormats[format-1](dt)
      }
    }else if(type === 'n'){
      return commonNumberFormats[format-1].func(value)
    }
    return value
}

// const isGuid = function(str){
//     return new RegExp(/^[0-9a-zA-Z]{8}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{12}$/).test(str)
// }

module.exports = {
    dateFormat,
    commonDateTimeFormats,
    commonNumberFormats,
    commonFormat,
    // isGuid
}