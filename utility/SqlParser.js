const Field = require('./Field')

const isEmpty = (s)=> s===undefined || s===null || s.trim()===''


const regexps = {
    // sub : /\(([^()]|(?<a>\()|(?<-a>\)))*\)/img, //匹配括号（****）里的字符 // JS正则不支持 递归
    // //subSql : "\(\s*\bselect\s+([^()]|(?<a>\()|(?<-a>\)))*\)", //匹配了查询（select ****）里的字符
    str : /'.*?'/img,  //匹配用户输入字符串'xxxx'
    from : /\bfrom\b((.|\r|\n)+?)(?:(?:\bwhere\b)|(?:\bgroup\s+by\b)|(?:\border\s+by\b)|$)/i, //匹配from后的。注意：加“m”反而匹配不到多行
    top : /\bselect\s+((?:distinct\s+)?(?:top\s+\d+\s+)?)/i, //匹配distinct+top
    select : /\bselect\s+(?:distinct\s+)?(?:top\s+\d+\s+)?((.|\r|\n)+?)\bfrom\b/i, //匹配select后的
    where : /\bwhere\s+((.|\r|\n)+?)((?:\border\s+by\b)|(?:\bgroup\s+by\b)|$)/i, //匹配where后的
    groupBy : /\bgroup\s+by\s+((.|\r|\n)+?)((?:\border\s+by\b)|$)/i, //匹配group by后的
    orderBy : /\border\s+by\s+((.|\r|\n)+)$/i //匹配order by后的
}

//select:未考虑不带括号的case、其它函数 

const RowNumFieldName = 'rownum' 
const SqlPlaceholders = {
    $startPage: '@startPage',
    $endPage: '@endPage',
    startPage: 'startPage',
    endPage: 'endPage',
    where: '@where',
    fullWhere: '@fullWhere',
    select: '@select'
}
const PageSize = 30
const forbidSqlChars = ["insert", "update", "delete", "create", "primary", "drop", "alter", "grant", "revoke", "union", "intersect", "minus"]

class SqlParser{
    constructor(sql)
    {
        this.strValue = []
        this.subValue = []
        this.orginalSql = sql // sql.toLowerCase()
        this.baseSql = null
        this.errors = []

        forbidSqlChars.forEach(char=>{
            if(new RegExp(`\b${char}\b`,'img').test(sql)){
                throw Error(`不允许的操作：${char}`)
            }
        }) // 特殊 关键字 处理

        {
            let i = 0
            regexps.str.lastIndex = 0
            this.baseSql = this.orginalSql.replace(regexps.str, m =>
            {
                this.strValue.push(m)
                return `@strValue${i++}`
            })
        } // 字符串 处理

        {
            this.baseSql = this.baseSql.replace(/--.*?(\r|\n)/img,'') // 清除 单行注释
            if(this.baseSql.includes('/*') || this.baseSql.includes('*/')){
                throw Error(`为了SQL简洁明澈，不允许使用 多行注释，只允许使用 单行注释。`)
            }
        } // 注释 处理
        
        {
            this._replaceParenthesis()
            // i = 0
            // this.baseSql = this.baseSql.replace(regexps.sub, m =>
            // {
            //     this.subValue.push(m)
            //     return `@sub${i++}`
            // })           // JS正则不支持 递归，这个 不能用
        } // 小括号()处理

        {
            const fields = this.outputFields //.map(f=>f.alias)
            const meterField = fields.find(f=>f.alias === '*')
            if(meterField){
                // this.errors.push(`这里禁止使用“*”号代替字段名(${meterField.expr})`)
                throw Error(`不允许使用 如select * from t ，请用具体的字段列表代替“*”，不要返回用不到的任何字段`)
            }
            if(fields.find(f=>f.alias === this.RowNumFieldName)){
                // this.errors.push(`“${this.RowNumFieldName}”是这里的关键字，不能在select field里使用`)
                throw Error(`“${this.RowNumFieldName}”是这里的关键字，不能在select field里使用`)
            }
            const  repeatFields = fields.filter(t=>fields.filter(t2=>t2.alias===t.alias).length>1)
            if(repeatFields.length > 1){
                // this.errors.push(`这里不允许select的field名称重复（${repeatFields.join('，')}），请另起 别名。`)
                throw Error(`这里不允许select的field名称重复（${repeatFields.map(t=>t.expr).join('，')}），请另起 别名。`)
            }
        } // 解析错误
    }

    /**
     * replace 小括号里的：(xxxx)
     */
    _replaceParenthesis(){
        let stack = []
        let substrings = []
        this.baseSql.split('').forEach((char,i)=>{
            if(char === '('){
                stack.push(i)
            }else if(char === ')'){
                const startIndex = stack.pop()
                if(stack.length === 0){
                    substrings.push(this.baseSql.slice(startIndex,i+1))
                }
            }
        })
        substrings.forEach((str,i)=>{
            this.subValue.push(str)
            this.baseSql = this.baseSql.replace(str,`@sub${i}`)
        })
    }

    // /**
    //  * 替换 多行注释
    //  */
    // _replaceMultiLineAnnotation(){
    //     const stack = []
    //     this.baseSql
    // }

    get from(){
        if (!this._from)
        {
            regexps.from.lastIndex = 0 // 重要事项：如果在一个字符串中完成了一次模式匹配之后要开始检索新的字符串，就必须手动地把 lastIndex 属性重置为 0。
            const matchs = regexps.from.exec(this.baseSql)
            if(matchs){
                this._from = matchs[1].trim()
                this._from = this.restoreSql(this._from).trim()
            }
            if(!this._from){
                throw Error('SQL解析错误，没有表名。')
            }
        }
        return this._from
    }

    get select(){
        if (!this._select)
        {
            regexps.select.lastIndex = 0
            const matchs = regexps.select.exec(this.baseSql)
            if(matchs){
                this._select = matchs[1].trim()
                this._select = this.restoreSql(this._select).trim()
            }
        }

        if(!this._includeFields && !this._excludeFields){
            return this._select
        }else{
            let outputFields = this._includeFields ? 
                this.outputFields.filter(t=>this._includeFields.includes(t.alias)) :                 
                this.outputFields.filter(t=>!this._excludeFields.includes(t.alias))
            if(this.hasDistinct && this.orderBy){
                let orderFields = this.outputFields.filter(({expr})=>{
                    expr = expr.replace('.','\\.').replace('(','\\(').replace(')','\\)')
                    return new RegExp(`\\b${expr}\\b`,'img').test(this.orderBy)
                })
                orderFields = orderFields.filter(t1=>!outputFields.find(t2=>t1===t2))
                outputFields = outputFields.concat(orderFields)
            } // 如果hasDistinct=true，则 order by 的字段 必须包含在 select 中，否则sql执行报错 
            return outputFields.map(t=>(t.expr === t.alias ? t.expr : (`${t.expr} ${t.alias}`))).join(',')
        }        
    }

    get top(){
        if (!this._top)
        {
            regexps.top.lastIndex = 0
            const matchs = regexps.top.exec(this.baseSql)
            if(matchs){
                this._top = matchs[1].trim()
            }
        }
        return this._top
    }
    set top(n){
        if(typeof(n) === 'number'){ // 设置top条数
            if(this._top){
                this._top = this._top.replace(/\btop\s+\d+\b/,`top ${n}`).trim()
            }else{
                this._top = `top ${n}`
            }
        }else{
            if(this._top){
                this._top = this._top.replace(/\btop\s+\d+\b/,'').trim()
            }
        } // 清除top
    }

    get hasDistinct(){
        return (/\bdistinct\b/img).test(this.top)
    }

    get where(){
        if (!this._where)
        {
            regexps.where.lastIndex = 0
            const matchs = regexps.where.exec(this.baseSql)
            if(matchs){
                this._where = matchs[1].trim()
                this._where = this.restoreSql(this._where).trim()
            }
        }
        return this._where
    }
    set where(value){
        this._where = value.trim()
    }
    /**
     * 追加查询条件
     */
    appendWhere(where)
    {
        where = where.trim()
        if(!where) return this
        
        if (this.where)
            this.where += (' and ' + where)
        else
            this.where = where
        return this
    }

    get groupBy(){
        if (!this._groupBy)
            {
                regexps.groupBy.lastIndex = 0
                const matchs = regexps.groupBy.exec(this.baseSql)
                if(matchs)
                {
                    this._groupBy = matchs[1].trim()
                    this._groupBy = this.restoreSql(this._groupBy).trim()
                }
            }
            return this._groupBy
    }

    get orderBy(){
        if (!this._orderBy)
            {
                regexps.orderBy.lastIndex = 0
                const matchs = regexps.orderBy.exec(this.baseSql)
                if(matchs){
                    this._orderBy = matchs[1].trim()
                    this._orderBy = this.restoreSql(this._orderBy).trim()
                }
            }
            return this._orderBy
    }

    // List<Field> outputFields = new List<Field>();//字段
    get outputFields()
    {
        if (!this._outputFields || this._outputFields.count === 0)
        {
            this._parseOutputFields()
        }

        return this._outputFields
    }

    /**
     * 如果distinct，则order by 的字段不会被排除
     */
    set excludeFields(names){
        this._excludeFields = names instanceof Array && names.length > 0 ? names : undefined
    } // 设置 排除在查询之外的字段（优先2）

    /**
     * 如果distinct，则order by 的字段不会被排除
     */
    set includeFields(names){
        this._includeFields = names instanceof Array && names.length > 0 ? names : undefined
    } // 设置 查询是使用的字段（优先1）

    /**
     * 输出SQL语句
     * @param {string} selects 
     */
    toString(selects = '', enableSort = true)
    {
        const sql = `select ${(selects || '').trim() || (this.top +' '+ this.select)} from ${this.from}
                    ${this.where ? ` where ${this.where}`:''}
                    ${this.groupBy ? ` group by ${this.groupBy}`:''}
                    ${enableSort && this.orderBy ? ` order by ${this.orderBy}`:''}`
        return sql.trim()
    }

    toJoinString(){
        const sql = `select ${this.top} ${this.select} from ${this.from}
                    ${this.where ? ` where ${this.where}`:''}
                    ${this.groupBy ? ` group by ${this.groupBy}`:''}`
                    // ${this.orderBy ? ` order by ${this.orderBy}`:''} 不要order by
        return sql.trim()
    }

    /**
     * 查询总条数的SQL
     */
    getCountSql(mode = true)
    {
        const selectFields = !this.hasDistinct ? `${this.top} 0 n` : `${this.top} ${this.select}`
        let sql = `select count(0) c from 
            (
                select ${selectFields} from ${this.from} 
                    ${this.where ? ` where ${this.where} ${SqlPlaceholders.where}`: SqlPlaceholders.fullWhere }
                    ${this.groupBy ? ` group by ${this.groupBy} `:''}
            ) a`
        if(mode){
            sql = sql.replace(SqlPlaceholders.where,'')
                     .replace(SqlPlaceholders.fullWhere,'')
        }
        return sql.trim()
    }

    /**
     * 获取 分页SQL
     * @param {number} pageIndex 
     * @param {number} pageSize 
     */
    getPagingSql(pageIndex,pageSize,mode=true,hasOrder=true)
    {
        // let orderBy = this.orderBy || '(select null)'
        let childSql = `
            select ${this.top}
                @@@row_number,
                ${SqlPlaceholders.select} ${this.select} ${SqlPlaceholders.select}
            from ${this.from}
                ${this.where ? ` where ${this.where} ${SqlPlaceholders.where}` : SqlPlaceholders.fullWhere}
                ${this.groupBy ? ` group by ${this.groupBy}`:''}`

        if(this.hasDistinct){
            let orderBy = this.orderBy
            if(orderBy){
                this.outputFields.forEach(({expr,alias})=>{
                    expr = expr.replace('.','\\.').replace('(','\\(').replace(')','\\)')
                    orderBy = orderBy.replace(new RegExp(`\\b${expr}\\b`,'img'),alias)
                })
            }else{
                orderBy = '(select null)'
            }
            childSql = childSql.replace('@@@row_number,','')
            childSql = `
                select 
                    row_number() over(order by ${orderBy}) ${RowNumFieldName},* 
                from (${childSql}) a`
        }else{
            let orderBy = this.orderBy || '(select null)'
            childSql = childSql.replace('@@@row_number,',`row_number() over(order by ${orderBy}) ${RowNumFieldName},`)
        }

        let sql = `select * from 
        (
            ${childSql}
        ) as a 
        where [${RowNumFieldName}] between ${SqlPlaceholders.$startPage} and ${SqlPlaceholders.$endPage} 
        ${hasOrder ? `order by [${RowNumFieldName}] asc` : ''}`

        // let sql = `select * from 
        // (
        //     select ${this.top} 
        //         row_number() over(order by ${orderBy}) ${RowNumFieldName}
        //         ,${SqlPlaceholders.select} ${this.select} ${SqlPlaceholders.select}
        //     from ${this.from}
        //         ${this.where ? ` where ${this.where} ${SqlPlaceholders.where}` : SqlPlaceholders.fullWhere}
        //         ${this.groupBy ? ` group by ${this.groupBy}`:''}
        // ) as a 
        // where [${RowNumFieldName}] between ${SqlPlaceholders.$startPage} and ${SqlPlaceholders.$endPage} 
        // ${hasOrder ? `order by [${RowNumFieldName}] asc` : ''}`

        if(mode){
            const startPage = (pageIndex - 1) * pageSize
            const endPage = pageIndex * pageSize

            sql = sql.replace(SqlPlaceholders.where,'')
                    .replace(SqlPlaceholders.fullWhere,'')
                    .replace(SqlPlaceholders.$startPage,startPage)
                    .replace(SqlPlaceholders.$endPage,endPage)
                    .replace(new RegExp(SqlPlaceholders.select,'mg'),'')
        }
        return sql.trim()
    }
    
    _parseOutputFields()
    {
        let fieldName = ''
        let fieldExpr = ''
        // regexps.select.compile(regexps.select)
        regexps.select.lastIndex = 0 
        const match = regexps.select.exec(this.baseSql)
        if(!match || match.length<2){
            throw Error('SQL解析错误，没有字段。')
        }
        let fields = match[1].split(',')

        this._outputFields = fields.map((name,i)=>
        {
            name = name.trim()
            const fieldMatch = name.split(/\s+as\s+|=|\s+/ig)
            if(fieldMatch.length>1){
                fieldExpr = fieldMatch[0]
                fieldName = fieldMatch[1]
            }else{
                fieldExpr = name
                let alias = name.split('.')
                if (alias.length > 1)
                    fieldName = alias[1]
                else
                    fieldName = alias[0]
            }
            fieldExpr = this.restoreSql(fieldExpr).trim()

            if(fieldName === name && fieldExpr !== name){
                throw Error(`请给第${i+1}列一个名称`)
            }

            return new Field( i, fieldName.trim(), fieldExpr,null )
        })
    }

    /**
     * 替换还原SQL
     * @param {string} sql 
     */
    restoreSql(sql)
    {
        const that = this
        sql = sql.replace(/@sub(\d+)/img, (m,n) =>
        {
            return that.subValue[n]
        })

        sql = sql.replace(/@strValue(\d+)/img, (m,n) =>
        {
            return that.strValue[n]
        })

        return sql
    }

    static getRealSql(patternSql,columns,$searchParams){
        const wheres = ($searchParams instanceof Array && $searchParams.length > 0) ? $searchParams.join(' and ') : ''
        let realSql = patternSql
                        .replace(SqlPlaceholders.fullWhere,wheres && ` where ${wheres}`)
                        .replace(SqlPlaceholders.where,wheres && ` and ${wheres}`)
        
        const reg = new RegExp(`${SqlPlaceholders.select} (.|\n|\r)+ ${SqlPlaceholders.select}`,'mg')
        if(columns instanceof Array && columns.length > 0){
            const fields = columns.map(t=>t.expr === t.ename ? t.ename : `${t.expr} ${t.ename}`).join(',')
            realSql = realSql.replace(reg,fields)
        }else{
            realSql = realSql.replace(new RegExp(SqlPlaceholders.select,'mg'),'')
        }
        return realSql
    }
}

// module.exports = SqlParser
exports.Class = SqlParser
exports.SqlPlaceholders = SqlPlaceholders
exports.PageSize = PageSize
exports.RowNumFieldName = RowNumFieldName