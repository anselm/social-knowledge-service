<script lang="ts">
  // Simple splash page
</script>

<div class="splash-container">
  <h1>Welcome to Social Appliance</h1>
  <p>This is the splash page - the web app is running!</p>
  <div class="status">
    <p>✅ Svelte 5.0 SPA is working</p>
    <p>✅ Served via services layer</p>
  </div>
</div>

<style>
  .splash-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  h1 {
    color: #333;
    margin-bottom: 1rem;
  }
  
  .status {
    margin-top: 2rem;
    padding: 1rem;
    background: #f0f8ff;
    border-radius: 8px;
    border-left: 4px solid #007acc;
  }
  
  .status p {
    margin: 0.5rem 0;
    color: #006600;
  }
</style>