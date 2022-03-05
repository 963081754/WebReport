<template>
    <i class="declare">
        <!-- <label v-if="icon === '?'">？</label> -->
        <i class="fa fa-question-circle-o" v-if="icon === '?'"></i>
        <ul class="content" :style="{marginLeft:`${(left || 0) - 43}px`,marginTop:`${(top || 0) + 5}px`}">
            <li v-for="(item,i) in items" :key="i" v-html="item"></li>
        </ul>
    </i>
</template>

<script>
export default {
    props:{
        content:{
            type:[Array,String],
            required:true
        },
        icon:{
            type:String,
            required:false,
            default:'?'
        },
        left:{
            type:Number,
            required:false
        },
        top:{
            type:Number,
            required:false
        }
    },
    computed:{
        items(){
            return typeof(this.content) === 'string' ? [this.content] : this.content
        }
    }
}
</script>

<style lang="scss" scoped>
.declare{
    position: relative;
    font-style: normal;
    // > label{
    //     font-size: 1.8em;
    //     font-weight: bold;
    //     color: #f00;
    //     text-shadow: 0px 1px 1px #0f0,1px 0px 1px #0f0;
    // }
    > i.fa{
        position: relative;
        top: 6px;
        left: -3px;
        font-size: 1.4em;
        // font-weight: bold;
        color: #f30;
        // text-shadow: 0px 1px 1px #0f0,1px 0px 1px #0f0;
    }
    > ul.content{
        display: none;
        position:fixed;
        z-index: 100000;
        pointer-events: none;
        padding: 15px 20px 15px 40px;
        border: 1px solid #876;
        background: #fff;
        box-shadow: 0px 1px 3px 0px #432;
        li{
            height: 30px;
            line-height: 30px;
            list-style-type: disc;
            list-style: decimal	outside	;
        }
    }    
    // > label:hover + ul.content,
    > i.fa:hover + ul.content{
        display: block;
    }
}
</style>