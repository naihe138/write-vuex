import Vue from 'vue'
import Vuex from './vuex' // 引入我们的自己编写的文件

Vue.use(Vuex) // 安装store
// 实例化store，参数数对象
export default new Vuex.Store({
  modules: {
    // 模块a
    a: {
      state: {
        count: 4000
      },
      actions: {
        change ({state}) {
          state.count += 21
        }
      },
      modules: {
        // 模块b
        b: {
          state: {
            count: 5000
          }
        }
      }
    }
  },
  state: {
    count : 1000
  },
  getters : {
    newCount (state) {
      return state.count + 100
    }
  },
  mutations: {
    change (state) {
      console.log(state.count)
      state.count += 10
    }
  },
  actions: {
    change ({commit}) {
      // 模拟异步
      setTimeout(() => {
        commit('change')
      }, 1000)
    }
  }
})