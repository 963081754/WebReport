import Router from '@/commonRouter'
import admin from '@/admin/pages/admin.vue'
import login from '@/admin/pages/login.vue'

const routes = [
  {
    path: '/:hash?',
    name: 'admin',
    component: admin,
    children: [
      {
        name:'login',
        path: 'login',
        component: login
      }
    ]
    // props: true  //(route) => ({ id: route.params.id }),
  }
  // {
  //   path: '/:hash/:id',
  //   name: 'designer',
  //   component: designer,
  //   props: (route) => ({ oneself:true,  id: parseInt(route.params.id) })
  // } // 模拟用户 的问题麻烦，不搞这个
]

const router = new Router({
  routes
})

export default router
