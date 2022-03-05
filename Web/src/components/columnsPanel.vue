<template>
    <ul class="panel" v-show="visible" @click.stop>
        <li v-for="c in columns" :key="c.ename">
            <label>
                <input type="checkbox" raw v-model="c.hide" :checked2="!c.hide"/>
                <span>{{c.cname}}</span>
            </label>
        </li>
    </ul>
</template>
<script>
export default {
    props:{
        columns:{
            type:Array,
            required:true
        },
        visible:{
            type:Boolean,
            required:true
        }
    },
    mounted(){
        const body = document.querySelector("body")
        if (body.append) {
            body.append(this.$el)
        } else {
            body.appendChild(this.$el)
        }

        const that = this
        document.addEventListener('click',()=>{
            that.$emit('update:visible',false)
        })
    }
}
</script>
<style scoped>
ul.panel{
    z-index: 100;
    position: absolute;
    /* left: 0px;
    top: 0px; */
    
    max-height: calc(100% - 30px);
    min-width: 150px;
    overflow: auto;
    
    border: 10px solid #f9f9f9;
    border-radius: 4px;
    background: #f9f9f9;
    box-shadow: -5px 5px 8px 0px #d5d5d5;
}
ul.panel li:last-child{
    border-bottom: none;
}
ul.panel li{
    height: 25px;
    line-height: 25px;    
    border-bottom: 1px dotted #d0d0d0;
}
ul.panel li:hover{
    background: #f0f0f0;
}
input[type="checkbox"]{
    margin-right: 6px;
}
ul.panel li span{
    display: inline-block;
    cursor: pointer;
    width: calc(100% - 20px);
    padding-left: 5px;
    height:100%;
    border-left: 1px solid #d0d0d0;

    text-overflow: ellipsis;
    white-space: nowrap;  
    /* overflow: hidden; */
}
</style>