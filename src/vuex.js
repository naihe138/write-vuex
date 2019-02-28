'use strict'

let Vue = null
const myforEach = (obj, callback) => Object.keys(obj).forEach(key => callback(key, obj[key]))

class Store {
  constructor (options) {
    let state = options.state
    this.getters = {}
    this.mutations = {}
    this.actions = {}
    // vuex的核心就是借用vue的实例，因为vuex的数据更改回更新视图
    this._vm = new Vue({
      data: {
        state
      }
    })

    // 把模块之间的关系进行整理, 自己根据用户参数维护了一个对象
    // root._children => a._children => b
    this.modules = new ModulesCollections(options)
    // 无论子模块还是 孙子模块 ，所有的mutations 都是根上的
    // 安装模块
    installModules(this, state, [], this.modules.root)

    // 解构 把this绑定好
    const {commit , dispatch} = this
    // 通过结构的方式也要先调用这类，然后在下面在调用原型的对应函数
    this.commit = type => {
      commit.call(this, type)
    }
    this.dispatch = type => {
      dispatch.call(this, type)
    }
  }
  get state() { // Object.defineProperty 同理
    return this._vm.state
  }
  commit (type) {
    // 因为是数组，所以要遍历执行
    this.mutations[type].forEach(fn => fn())
  }
  dispatch (type) {
    // 因为是数组，所以要遍历执行
    this.actions[type].forEach(fn => fn())
  }
}

class ModulesCollections {
  constructor (options) { // vuex []
    // 注册模块
    this.register([], options)
  }
  register (path, rawModule) {
    // path 是空数组， rawModule 就是个对象
    let newModule = {
      _raw: rawModule, // 对象
      _children: {}, // 把子模块挂载到这里
      state: rawModule.state
    }
    if (path.length === 0) { // 第一次
      this.root = newModule
    } else {
      // [a, b] ==> [a]
      let parent = path.slice(0, -1).reduce((root, current) => {
        return root._children[current]
      }, this.root)
      parent._children[path[path.length - 1]] = newModule
    }
    if (rawModule.modules) {
      // 遍历注册子模块
      myforEach(rawModule.modules, (childName, module) => {
        this.register(path.concat(childName), module)
      })
    }
  }
}

// rootModule {_raw, _children, state }
function installModules (store, rootState, path, rootModule) {
  // rootState.a = {count：200}
  // rootState.a.b = {count: 3000}
  if (path.length > 0) {
    // 根据path找到对应的父级模块
    // 例如 [a] --> path.slice(0, -1) --> []  此时a模块的父级模块是跟模块
    // 例如 [a，b] --> path.slice(0, -1) --> [a]  此时b模块的父级模块是a模块
    let parent = path.slice(0, -1).reduce((root, current) => {
      return root[current]
    }, rootState)
    // 通过Vue.set设置数据双向绑定
    Vue.set(parent, path[path.length - 1], rootModule.state)
  }
  // 设置getter
  if (rootModule._raw.getters) {
    myforEach(rootModule._raw.getters, (getterName, getterFn) => {
      Object.defineProperty(store.getters, getterName, {
        get: () => {
          return getterFn(rootModule.state)
        }
      })
    })
  }
  // 在跟模块设置actions
  if (rootModule._raw.actions) {
    myforEach(rootModule._raw.actions, (actionName, actionsFn) => {
      // 因为同是在根模块设置，子模块也有能相同的key
      // 所有把所有的都放到一个数组里面
      // 就变成了例如 [change, change] , 第一个是跟模块的actions的change，第二个是a模块的actions的change
      let entry = store.actions[actionName] || (store.actions[actionName] = [])
      entry.push(() => {
        const commit = store.commit
        const state = rootModule.state
        actionsFn.call(store, {state, commit})
      })
    })
  }
  // 在跟模块设置mutations， 同理上actions
  if (rootModule._raw.mutations) {
    myforEach(rootModule._raw.mutations, (mutationName, mutationFn) => {
      let entry = store.mutations[mutationName] || (store.mutations[mutationName] = [])
      entry.push(() => {
        mutationFn.call(store, rootModule.state)
      })
    })
  }
  // 递归遍历子节点的设置
  myforEach(rootModule._children, (childName, module) => {
    installModules(store, rootState, path.concat(childName), module)
  })
}

const install = _Vue => {
  // 避免vuex重复安装
  if (Vue === _Vue) return
  Vue = _Vue
  Vue.mixin({
    // 通过mixins让每个组件实例化的时候都会执行下面的beforeCreate
    beforeCreate () {
      // 只有跟节点才有store配置
      if (this.$options && this.$options.store) {
        this.$store = this.$options.store
      } else if (this.$parent && this.$parent.$store) { // 子组件深度优先 父 --> 子---> 孙子
        this.$store = this.$parent.$store
      }
    }
  })
}

export default { install, Store }
