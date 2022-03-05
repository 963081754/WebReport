<template>
    <ul class="typeSelector">
        <li class="title">
            <label>当前</label>
            <label>前台类型</label>
        </li>
        <li v-for="item in userTypes" :class="{active:item.id == currentUserType.id}" @click.stop="$emit('updateHash',item.id)" :key="item.id">
            <label v-if="item.id == currentUserType.id">✓</label>
            <label v-else></label>
            <label>{{item.name}}</label>
        </li>
    </ul>
</template>

<script>
export default {
    inject:['getters'],
    computed:{
        userTypes(){
            return this.getters.setting ? this.getters.setting.userTypes : []
        },
        currentUserType(){
            return this.getters.currentUserType || {}
        }
    }
}
</script>

<style lang="scss" scoped>
ul.typeSelector{    
    height: auto !important;
    border: 1px solid #dcb;                
    background: #fff;
    box-shadow: 0px 1px 2px 0px #765;
    > li{
        min-width: 150px;
        height: 33px;
        line-height: 33px;

        display: flex;
        align-items: center;
        > label{
            padding: 0px 3px;
            text-align: left;
            &:nth-child(1){
                max-width: 35px;
                flex-basis: 35px;
                text-align: center;

                font-weight: bold;
                font-size: 1.3em;
                color:#f00;
            }
            &:nth-child(2){
                flex-grow: 1;
            }
        }
        &.title{
            display: none;
            background: #765;
            > label{
                color: #fff;
            }
        }
        // &:nth-child(odd):not(.active):not(.title){
        //     background: #ffedea;
        // }
        // &:hover:not(.title){
        //     background: #fc9 !important;
        // }
        &:hover:not(.title),
        &.active{
            background: #fcb !important;
        }
    }
}
</style>