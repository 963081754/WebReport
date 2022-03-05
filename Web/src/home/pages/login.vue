<template>
    <div class="loginWrap">
        <div class="shade" @click.stop="inputFocus"></div>
        <div class="login">            
            <div class="title">
                <label>
                    <i class="fa fa-file-text"/>web报表系统-{{getters.userType.name}}登录
                </label>
                <span class="span1"></span>
                <span class="span2"></span>
                <span class="span3"></span>
            </div>
            <div :hint="accountHint" hintl140>
                <input ref="username" v-model.trim="username" @keydown.enter="submit" class="r-fresh" placeholder="账号" raw>
            </div>
            <div>
                <input ref="password" v-model.trim="password" @keydown.enter="submit" class="r-fresh" placeholder="密码" type="password" raw>
            </div>
            <div class="bottom">
                <!-- :disabled="!username || !password" -->
                <r-button class="small" @click="submit" raw>
                    <!-- <i class="fa fa-check"/> -->
                    登录
                </r-button>   
            </div>
        </div>
    </div>
</template>
<script>

export default {
    inject:['getters','userApi'],
    data(){
        return{
            username:null,
            password:'12345',
            loading:false
        }
    },
    computed:{
        accountHint(){
            const testAccounts = {
                staff:'0936E9FC，角色：销售员',
                customer:'E5AB8591',
                supplier:'A149B9DF'
            }
            const account = testAccounts[this.getters.hash]
            return account ? `账号：${account}。更多测试账号看后台隐藏报表【前台测试（账号密码）】` : undefined
        }
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
            if(!this.username){
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
            this.userApi.login({username:this.username,password:this.password}).then((model)=>{
                if(!model) throw Error()
                this.$message.success('登录成功')
                
                if(this.$router.history.current.name === 'singleDisplayerLogin'){
                    // this.$router.push({ name: 'singleDisplayer' })
                    this.$router.push({ name: 'contextmenu' })
                }else if(this._from && this._from.name){
                    this.$router.push({ name: this._from.name, params:this._from.params })                    
                }else{                    
                    this.$router.push({ name: 'home' })
                }
                delete this._from
            }).catch((error)=>{
                this.$message.error(error.message)
            }).finally(()=>{
                if(sign !== this._sign) return
                this.loading = false
                unlock()
            })
        },
        inputFocus(){
            if(this.username && !this.password){
                this.$refs.password.focus()
            }else{
                this.$refs.username.focus()
            }
        }
    }
}
</script>

<style  lang="scss" scoped src="@/components/login/css.scss"></style>