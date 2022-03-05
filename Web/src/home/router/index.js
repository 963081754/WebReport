import Router from '@/commonRouter'
import home from '@/home/pages/home.vue'
const singleDisplayer = ()=>import('@/home/pages/singleDisplayer.vue')
const contextmenu = ()=> import('@/home/components/singleDisplayerContextmenu.vue')
const login = ()=>import('@/home/pages/login.vue')

const routes = [
  {
    path: '/:hash', // user-type-hash
    name: 'home',
    component: home,
    children: [
      {
        name:'login',
        path: 'login',
        component: login
      }
    ]
  },
  {
    path: '/:hash/:id', // user-type-hash
    name: 'singleDisplayer',
    component:singleDisplayer,
    props: (route) => ({ id: parseInt(route.params.id) }),
    children: [
      {        
        path:'',
        name:'contextmenu',
        components: { contextmenu }
      },
      {        
        path: 'login',
        name:'singleDisplayerLogin',
        components: { login }
      }
    ]
  }
]

const router = new Router({
  mode: 'history',
  routes: routes
})

export default router
