<template>
  <div id="app">
    这里是this.$store.state.count------->{{this.$store.state.count}} <br/><br/>
    这里是this.$store.getters.newCount------->{{this.$store.getters.newCount}} <br/><br/>
    这里是this.$store.state.a.count------->{{this.$store.state.a.count}} <br/><br/>
    <button @click="change">点击触发dispach--> actions</button>
    <button @click="change1">点击触发commit---> mutations</button>
  </div>
</template>

<script>
export default {
  name: 'app',
  methods: {
    change () {
      this.$store.dispatch('change')
    },
    change1 () {
      this.$store.commit('change')
    }
  },
  mounted () {
    console.log(this.$store)
  }
}
</script>