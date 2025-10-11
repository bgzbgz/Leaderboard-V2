# Fast Track Custom Fonts

This directory contains the custom fonts for the Fast Track leaderboard system.

## Font Files Currently Installed

The following font files are currently in this directory:

### Plaak 3 Trial (Headers)
- ✅ `Plaak3Trial-Regular.woff2` - Modern format (preferred)
- ✅ `Plaak3Trial-43-Bold.otf` - Bold version for emphasis

### Reforma LL (Body Text)
- ✅ `RiformaLL-Regular.otf` - Body text font

## Font Usage

Once the font files are added, you can use them in your components:

### Headers
```jsx
<h1 className="font-heading text-6xl">FAST TRACK</h1>
<h2 className="font-heading text-4xl">Section Title</h2>
```

### Body Text
```jsx
<p className="font-body text-base">Regular text content</p>
<div className="font-body text-sm">Small text</div>
```

### Available Classes
- `font-heading` - Uses 'Plaak 3 Trial' for headers and titles
- `font-body` - Uses 'Reforma LL' for body text (this is the default)

## File Format Priority

The fonts are configured to use WOFF2 format first (smaller file size, better compression) and fall back to WOFF format for older browsers.

## Font Display

All fonts use `font-display: swap` for optimal loading performance, ensuring text remains visible during font load.
