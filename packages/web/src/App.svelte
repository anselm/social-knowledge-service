<script lang="ts">
  import { Router, Route } from 'svelte-routing'
  export let url = ""
</script>

<Router {url}>
  <Layout>
    <Route path="/*wildcard" component={Splash} />
  </Layout>
</Router>
