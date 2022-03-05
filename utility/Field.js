class Field
{
    constructor(id,alias,expr,cname){
        this.id = id // 在SELECT里的顺序，从1开始
        this.alias = this._aliasFilter(alias)
        this.expr = expr
        this.cname = cname
    }
    _aliasFilter(value)
    {
        if (value.indexOf('[') === 0)
        {
            if (value.lastIndexOf(']') !== value.length - 1)
                throw Error('列名错误')
            return value.substring(1, value.length - 1)
        }
        else
        {
            return value
        }
    }
}

module.exports = Field