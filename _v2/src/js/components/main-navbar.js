Vue.component('main-navbar', {
  data: function () { return { isActive: false, } },
  methods: {
    toggleMenu: function () { this.isActive = !this.isActive; }
  },
  template: `
    <div class="navbar has-shadow is-primary">
      <div class="navbar-brand">
        <a class="navbar-item" href="/_v2/">
          <i class="fas fa-volleyball-ball fa-2x"></i>
          &nbsp;&nbsp;
          <b>Let's volleyball</b>
        </a>

        <div @click="toggleMenu" class="navbar-burger" v-bind:class="{ 'is-active': isActive }">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </div>
      </div>

      <div class="navbar-menu" v-bind:class="{ 'is-active': isActive }">
        <div class="navbar-start">
          <a class="navbar-item" href="/_v2/">Primary event</a>
          <a class="navbar-item" href="/_v2/events.html">All events</a>
          <a class="navbar-item" href="/_v2/shame.html">Hall of Shame</a>
        </div>
      </div>

    </div>`,
})
