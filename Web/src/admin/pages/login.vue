<template>
    <div class="loginWrap">
        <div class="shade" @click.stop="inputFocus"></div>
        <div class="login">
            <div class="title">
                <label>
                    <i class="fa fa-file-text"/>web报表系统-管理员登录
                </label>
                <span class="span1"></span>
                <span class="span2"></span>
                <span class="span3"></span>
            </div>
            <div hint="默认测试账号">
                <input ref="mobile" v-model.trim="mobile" @keydown.enter="submit" readonly class="r-fresh" raw>
            </div>
            <div hint="默认测试密码">
                <input ref="password" v-model.trim="password" @keydown.enter="submit" readonly class="r-fresh" type="password" raw>
            </div>
            <div class="bottom">
                <r-button class="small" @click="submit" raw>登录</r-button>   
            </div>
        </div>
    </div>
</template>

<script>
export default {
    inject:['getters','userApi'],
    data(){
        return{
            mobile: '17701142185',
            password: '1',
            loading:false
        }
    },
    computed:{
        // title(){
        //     return this.loading ? `管理员登录中……` : `管理员登录`
        // }
    },
    mounted(){
        this.inputFocus()
    },
    beforeRouteEnter(to, from, next) {        
        next(the=>{
            the._from = from
        })
    },
    methods:{
        async submit({unlock}){
            // if(!this.mobile || !this.password) return
            if(!this.mobile){
                this.$message.error('请输入账号')
                unlock()
                return
            }
            if(!this.password){
                this.$message.error('请输入密码')
                unlock()
                return
            }

            this.loading = true
            const sign = this._sign = Math.random()
            this.userApi.login({mobile:this.mobile,password:this.password}).then((model)=>{
                if(!model) throw Error()
                this.$message.success('登录成功')
                
                if(this._from && this._from.name){
                    this.$router.push({ name: this._from.name, params:this._from.params })
                    delete this._from
                }else{
                    this.$router.push({ name: 'admin' })
                }
            }).catch((error)=>{
                this.$message.error(error.message)
            }).finally(()=>{
                if(sign !== this._sign) return
                this.loading = false
                unlock()
            })
        },
        inputFocus(){
            if(this.mobile && !this.password){
                this.$refs.password.focus()
            }else{
                this.$refs.mobile.focus()
            }
        }
    }
}
</script>

<style  lang="scss" scoped src="@/components/login/css.scss"></style>