class Paging{
    constructor(list,total,pageSize,pageIndex = 1){
        this.list = list
        this.pageIndex = pageIndex
        this.pageSize = pageSize
        this.total = total
        this.pageCount = parseInt((this.total-1)/this.pageSize) + 1
    }
}
export default Paging
// module.exports = Paging