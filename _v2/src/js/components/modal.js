Vue.component('modal', {
    data: function () { return { isActive: false, } },
    props: [ 'title', 'name' ],
    methods: {
        open: function () { this.isActive = true; },
        close: function () { this.isActive = false; },
    },
    template: `
    <div class="modal" v-bind:class="{ 'is-active': isActive }" >
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">{{ title }}</p>
                <button class="delete" aria-label="close" @click="close()"></button>
            </header>
            <section class="modal-card-body">
                <slot name="body"></slot>
            </section>
            <footer class="modal-card-foot">
                <slot name="foot">
            </footer>
        </div>
    </div>`,
})
