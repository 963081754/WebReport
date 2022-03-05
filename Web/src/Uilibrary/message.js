class message{
    constructor(){}
    _set(callback,autoRemove,outtime,isComplex = false){
        const box = document.createElement('div')
        box.className = 'r-message'
        callback(box)
        document.body.appendChild(box)
        const size = {
            sh:document.documentElement.clientHeight,
            sw:document.documentElement.clientWidth,
            h:box.clientHeight,
            w:box.clientWidth
        }
        this._setStyle(box,{
            opacity:1,
            top:`${(size.sh - size.h)/2}px`,
            left:`${(size.sw - size.w)/2}px`
        })
        if(autoRemove){
            let timeoutKey = this._setTimeout(box,outtime)
            box.onmouseover = ()=>{
                clearTimeout(timeoutKey)
            }
            box.onmouseleave = ()=>{
                timeoutKey = this._setTimeout(box,outtime)
            }
        }else if(!isComplex){
            const close = document.createElement('i')
            close.addClass('fa fa-times close')
            close.addEventListener('click',event=>{
                event.stopPropagation()
                this._setTimeout(box,0)
            })
            box.appendChild(close)
        }
    }
    error(txt,time){
        this._set((box)=>{
            box.addClass('error')
            box.innerHTML = `<i class='fa fa-exclamation-triangle'></i><span>${txt}</span>`
        },time !== -1,time)
    }
    success(txt,time){
        this._set((box)=>{
            box.addClass('success')
            box.innerHTML = `<i class='fa fa-check-circle'></i><span>${txt}</span>`
        },time !== -1,time)
    }
    info(txt,time){
        this._set((box)=>{
            box.addClass('info')
            box.innerHTML = `<i class='fa fa-info-circle'></i><span>${txt}</span>`
        },time !== -1,time)
    }
    confirm(txt){
        return  this._complex(txt)
    }
    prompt(txt,defaultValue,required){
        return  this._complex(txt,true,defaultValue,required)
    }
    _complex(txt,isPrompt,defaultValue,valueRequired){
        return  new Promise((resolve, reject)=>{
            this._set((box)=>{
                box.addClass('confirm')
                const html = `
                    <div class='shade'></div>
                    <div>
                        <div class='title'>
                            <i class='fa fa-${isPrompt?'comment':'question-circle'}'></i><span>${txt}</span>
                        </div>
                        <template/>
                        <div class='buttons'>
                            <button class="no small" raw>取消</button>
                            <button class="ok small" raw>确定</button>
                        </div>
                    </div>`
                if(isPrompt){
                    box.innerHTML = html.replace('<template/>',`
                    <div class='value'>
                        <input class='value' value='${defaultValue}' style='width: 100%;' raw/>
                    </div>
                    <div style='color:#f00;' class='msg'></div>`)
                }else{
                    box.innerHTML = html.replace('<template/>','')
                }
                const removeEffect = ()=>{
                    this._setStyle(box,{transition:'opacity 100ms,top 400ms'})            
                    this._setTimeout(box,0)
                }
                if(isPrompt){
                    console.log(1)
                    box.querySelector('button.ok').onclick = ()=>{
                        const value = (box.querySelector('input.value').value + '').trim()
                        if(valueRequired && !value){
                            box.querySelector('div.msg').innerHTML = `不能为空！`
                            return
                        }
                        removeEffect()
                        resolve(value)
                    }
                }else{
                    box.querySelector('button.ok').onclick = ()=>{        
                        removeEffect()
                        resolve()
                    }
                }
                box.querySelector('button.no').onclick = ()=>{
                    removeEffect()
                    reject()
                }
            },false,0,true)
        })
    }
    _setStyle(box,newStyles){
        const styles = Object.assign(box._styles || {}, newStyles)
        box._styles = styles
        box.style.cssText = Object.entries(styles).map(t=>`${t[0]}:${t[1]}`).join(';')
    }
    _setTimeout(box,time = 3000){
        return setTimeout(() => {
            this._setStyle(box,{
                opacity:0,
                top:'0px',
            })
            setTimeout(() => {
                if(box.parentNode){
                    box.parentNode.removeChild(box)
                }
            }, 300)
        }, time)
    }
}

export default message