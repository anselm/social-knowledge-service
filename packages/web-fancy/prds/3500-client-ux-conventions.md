# client side concerns

## client engine choices

- svelte 5.0 for now as a test
- tailwind

## client code

- modular, dry
- small files - don't allow large files; break them up into smaller components
- some customization in configuration file (currently in client-svelte/public/config.js) loaded at runtime

## style concerns

- design: we're going for a minimalist style right now; the design intent is to let a designer style it later

- style: brand and color style configuration props that can be configured in tailwind.config.js
- style: for now the style is absolutely brutalist minimalist for now; simple, squares, low style
- style: black and white; minimalist, large fonts, simple clean layout
- style: dark mode to start; should however make sure that both light and dark mode are supported
- mobile first patterns; on mobile disallow zooming the page
- mobile pwa support, including pwa support for vite
- mobile script to generate pwa icons that can be run from bash
- mobile responsive layout
- mobile friendly 'edge to edge' layout generally; try minimize side margins for desktop and mobile
- desktop - maximum width margin: 0 auto; probably 1000px wide max; centered on display?
- desktop - mostly as a fallback; the app is mostly focused on mobile for now
