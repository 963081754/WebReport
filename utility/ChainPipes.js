class ChainPipes{
    constructor(){
      this._messages = [] // [{key,data}]
      this._consumers = [] // [{key,fun}]
    }
    release(msg){    
      const man = this._consumers.find(t=>t.key === msg.key)
      if(man){
        man.fun(msg)
      }else{
        msg.clearKey = setTimeout(() => {
          const index = this._messages.indexOf(msg)
          if(index !== -1){
            this._messages.splice(index,1)
          }
        }, 1000*30)  // 30秒超时
        this._messages.push(msg)
      }
    }
    consume(key){
      return new Promise((resolve, reject)=>{
        const msg = this._messages.find(t=>t.key === key)
        if(msg){
          this._removeMessage(msg)
          resolve(msg.data)
        }else{
          const man = { 
            key,
            fun:(msg)=>{
              clearTimeout(man.clearKey)
              this._removeConsumer(man)
              this._removeMessage(msg)
              resolve(msg.data)
            }
          }
  
          man.clearKey = setTimeout(() => {
            const i = this._consumers.indexOf(man)
            if(i !== -1){
              this._consumers.splice(i,1)
            }
            reject('等待超时')
          }, 1000*30) // 30秒超时
  
          this._consumers.push(man)        
        }
      })
    }
    _removeMessage(msg){
      const i = this._messages.indexOf(msg)
      if(i !== -1){
        this._messages.splice(i,1)
      }
      if(msg.clearKey){
        clearTimeout(msg.clearKey)
      }
    }
    _removeConsumer(man){
      const i = this._consumers.indexOf(man)
      if(i !== -1){
        this._consumers.splice(i,1)
      }
      if(man.clearKey){
        clearTimeout(man.clearKey)
      }
    }
}

module.exports = ChainPipes