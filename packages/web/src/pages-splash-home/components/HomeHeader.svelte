<header class="sticky top-0 z-40 bg-background border-b border-border">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <div>
        <h1 class="text-xl font-display font-bold" data-testid="text-header-brand">
          Connect
        </h1>
        <p class="text-xs text-muted-foreground" data-testid="text-header-location">
          Downtown · 0.5 mi radius
        </p>
      </div>
      
      <div class="flex items-center gap-2">
        <button title="b" class="p-2 hover-elevate aria-label" data-testid="button-notifications">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /> &nbsp;
          </svg> 
        </button>
        <button title="b" class="p-2 hover-elevate aria-label" data-testid="button-profile">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg> &nbsp;
        </button>
      </div>
    </div>
    
    <div class="flex gap-2 pb-4 overflow-x-auto">
      <span class="px-3 py-1 text-xs bg-foreground text-background cursor-pointer" data-testid="badge-filter-all">
        All
      </span>
      <span class="px-3 py-1 text-xs border border-border cursor-pointer hover-elevate" data-testid="badge-filter-today">
        Today
      </span>
      <span class="px-3 py-1 text-xs border border-border cursor-pointer hover-elevate" data-testid="badge-filter-events">
        Events
      </span>
      <span class="px-3 py-1 text-xs border border-border cursor-pointer hover-elevate" data-testid="badge-filter-places">
        Places
      </span>
      <span class="px-3 py-1 text-xs border border-border cursor-pointer hover-elevate" data-testid="badge-filter-groups">
        Groups
      </span>
    </div>
  </div>
</header>
