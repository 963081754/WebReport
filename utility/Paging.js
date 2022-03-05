class Paging{
    constructor(list,total,pageSize,pageIndex = 1){
        this.list = list        
        this.pageSize = pageSize
        this.total = total
        this.pageTotal = list.length
        this.pageCount = total < 0 ? -1 : (parseInt((this.total-1)/this.pageSize) + 1)
        this.pageIndex = total < 0 ? pageIndex : (pageIndex > this.pageCount ? this.pageCount : pageIndex)
    }
}
// export default Paging
module.exports = Paging