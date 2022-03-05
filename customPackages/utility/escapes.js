

/**
 * ArrayBuffer与string的互相转换； 这个不正确： error.message = String.fromCharCode.apply(null,new Uint16Array(error.message))
 */
class ABEscape{
    /**
     * 字符串ArrayBuffer转字符串
     * @param {*} u 
     */
    static ab2str(u) {
        var b = new Blob([u])
        var r = new FileReader()
         r.readAsText(b, 'utf-8')
         return new Promise(function(resolve) {
            r.onload = function (){
                resolve(r.result)
            }
         })         
     }
     /**
      * 字符串转字符串ArrayBuffer
      * @param {*} s 
      */
     static str2ab(s) {
         var b = new Blob([s],{type:'text/plain'})
         var r = new FileReader()
         r.readAsArrayBuffer(b)
        //  r.onload = function (){if(f)f.call(null,r.result)}
         return new Promise(function(resolve) {
            r.onload = function (){
                resolve(r.result)
            }
         })
     }
}

module.exports = {
    ABEscape
}