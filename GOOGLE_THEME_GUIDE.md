# 🎨 Google Cloud Platform / YouTube Theme Guide

Your WorkZen HR System now features a modern **Google Material Design** theme inspired by GCP Console and YouTube!

## 🌈 Color Palette

### Primary Colors (Google Blue)
- **Primary 600** (`#1a73e8`) - Main brand color, buttons, links
- **Primary 700** (`#1967d2`) - Hover states
- **Primary 50** (`#e8f0fe`) - Light backgrounds, selected states

### Accent Colors
- **Red** (`#ea4335`) - Errors, warnings, important actions
- **Yellow** (`#fbbc04`) - Warnings, pending states
- **Green** (`#34a853`) - Success, approved states

### Neutral Colors (Google Gray)
- **Gray 50** (`#f8f9fa`) - Page background
- **Gray 100** (`#f1f3f4`) - Card backgrounds
- **Gray 700** (`#5f6368`) - Body text
- **Gray 900** (`#202124`) - Headings

## 🎯 Design Elements

### Shadows
- **shadow-google** - Subtle elevation for cards
- **shadow-google-lg** - Prominent elevation for modals/dropdowns

### Typography
- Font: Google Sans, Roboto, system-ui
- Weights: Normal (400), Medium (500), Semibold (600)

### Border Radius
- Cards: `rounded-lg` (8px)
- Buttons: `rounded-md` (6px)
- Icons: `rounded-xl` (12px)
- Avatars: `rounded-full`

## 🧩 Component Classes

### Buttons
```jsx
// Primary button (Google Blue)
<button className="btn-primary">Sign in</button>

// Secondary button (White with border)
<button className="btn-secondary">Cancel</button>

// Danger button (Google Red)
<button className="btn-danger">Delete</button>
```

### Cards
```jsx
// Standard card with hover effect
<div className="card">Content</div>

// Flat card without shadow
<div className="card-flat">Content</div>
```

### Badges
```jsx
<span className="badge badge-blue">Active</span>
<span className="badge badge-red">Urgent</span>
<span className="badge badge-green">Approved</span>
<span className="badge badge-yellow">Pending</span>
```

### Input Fields
```jsx
<input className="input-field" placeholder="Email" />
```

## 🎨 Using Theme Colors

### In Tailwind Classes
```jsx
// Background colors
bg-primary-600      // Google Blue
bg-accent-red       // Google Red
bg-accent-green     // Google Green
bg-accent-yellow    // Google Yellow

// Text colors
text-primary-600    // Google Blue text
text-gray-700       // Body text
text-gray-900       // Headings

// Border colors
border-gray-200     // Light borders
border-primary-600  // Accent borders
```

## 📱 Component Examples

### Navigation Bar
- White background with subtle shadow
- Google-style logo (WorkZen in blue/red)
- Rounded icon buttons with hover states
- Clean user profile section

### Sidebar
- White background with border
- Active state: Light blue background
- Hover state: Light gray background
- Icons with proper spacing

### Login Page
- Centered card layout
- Google-style branding
- Clean form inputs
- Primary action button

## 🚀 Quick Customization

### Change Primary Color
Edit `tailwind.config.js`:
```js
primary: {
  600: '#1a73e8', // Change this to your brand color
}
```

### Change Accent Colors
```js
accent: {
  red: '#ea4335',
  yellow: '#fbbc04',
  green: '#34a853',
}
```

## 📊 Before & After

### Before
- Generic blue theme
- Standard shadows
- Basic card designs

### After ✨
- Google Material Design
- Professional elevation system
- Modern card-based layouts
- Clean, minimalist interface
- Consistent color system

## 🎯 Best Practices

1. **Use semantic colors**: Blue for primary actions, Red for destructive actions
2. **Maintain consistency**: Use predefined component classes
3. **Proper elevation**: Cards should have subtle shadows
4. **Spacing**: Use Google's 8px grid system
5. **Typography**: Keep font weights consistent

## 🔧 Maintenance

All theme configurations are in:
- `tailwind.config.js` - Color definitions
- `src/styles/globals.css` - Component classes
- Components use Tailwind utility classes

## 📝 Notes

- Theme is fully responsive
- Works with dark mode (can be extended)
- Accessible color contrasts
- Performance optimized with Tailwind JIT

---

**Enjoy your new Google-inspired theme! 🎉**
