# ProductivOS — Frontend Design System
> For: Cursor, Gemini CLI, Kiro
> Role: Frontend Design Expert + React Specialist
> Stack: React 18 + Vite + TailwindCSS v4

---

## Design Identity

**Aesthetic Direction:** Refined Productivity — Warm Minimal
Not cold corporate. Not loud startup. Something in between —
like a well-designed notebook from a Delhi stationery shop.
Calm, focused, with moments of warmth and delight.

**One Sentence:** A productivity tool that feels like a
personal journal, not a SaaS dashboard.

**What Makes It Memorable:**
- Saffron (#F97316) used sparingly as a pulse of energy
- Warm parchment backgrounds instead of cold white
- Micro-interactions that feel responsive, not flashy
- Typography that breathes

---

## Color System

```css
:root {
  /* Core surfaces */
  --color-sidebar:       #0F172A;  /* deep navy */
  --color-sidebar-hover: #1E293B;  /* lighter navy */
  --color-surface:       #FAFAF5;  /* warm parchment */
  --color-card:          #FFFFFF;  /* pure card bg */
  --color-card-hover:    #FEFEF9;  /* subtle warm lift */

  /* Text */
  --color-text-primary:  #1C1917;  /* warm charcoal */
  --color-text-secondary:#78716C;  /* muted stone */
  --color-text-muted:    #A8A29E;  /* light stone */
  --color-text-sidebar:  #94A3B8;  /* slate */
  --color-text-inverse:  #F8FAFC;  /* near white */

  /* Accent — use sparingly */
  --color-accent:        #F97316;  /* saffron */
  --color-accent-hover:  #EA6C00;  /* deeper saffron */
  --color-accent-soft:   #FFF7ED;  /* saffron tint bg */
  --color-accent-muted:  #FED7AA;  /* saffron muted */

  /* Borders */
  --color-border:        #E7E5E4;  /* warm stone border */
  --color-border-strong: #D6D3D1;  /* stronger border */

  /* Status */
  --color-success:       #16A34A;
  --color-success-soft:  #DCFCE7;
  --color-warning:       #D97706;
  --color-warning-soft:  #FEF3C7;
  --color-danger:        #DC2626;
  --color-danger-soft:   #FEE2E2;
  --color-info:          #2563EB;
  --color-info-soft:     #DBEAFE;
  --color-purple:        #7C3AED;
  --color-purple-soft:   #EDE9FE;
}
```

---

## Typography

```css
/* Import in index.css */
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

:root {
  --font-display: 'Fraunces', Georgia, serif;  /* headings, app name */
  --font-body:    'DM Sans', system-ui, sans-serif; /* all UI text */
  --font-mono:    'DM Mono', monospace;             /* code, scores */
}
```

**Font Usage:**
- App name "ProductivOS" → `font-display`, font-semibold
- Page headings (h1) → `font-display`, italic variant for warmth
- All other text → `font-body`
- Scores, levels, counts → `font-mono`

---

## Spacing & Sizing

```
Sidebar width:     224px (w-56)
Navbar height:     56px (h-14)
Card padding:      24px (p-6)
Card gap:          16px (gap-4)
Section gap:       32px (gap-8)
Border radius:     
  Cards:           12px (rounded-xl)
  Buttons:         8px (rounded-lg)
  Badges:          999px (rounded-full)
  Input:           8px (rounded-lg)
```

---

## Component Design Tokens

### Cards
```
bg-white rounded-xl border border-[#E7E5E4] p-6
shadow: shadow-sm
hover: shadow-md translate-y-[-1px] (transition-all duration-200)
```

### Primary Button (Saffron)
```
bg-[#F97316] hover:bg-[#EA6C00] text-white
px-4 py-2 rounded-lg text-sm font-medium
transition-all duration-150
hover:shadow-md hover:shadow-orange-200
active:scale-[0.98]
```

### Ghost Button
```
border border-[#E7E5E4] hover:border-[#D6D3D1]
text-[#78716C] hover:text-[#1C1917]
px-4 py-2 rounded-lg text-sm font-medium
transition-all duration-150
hover:bg-[#FAFAF5]
```

### Danger Button
```
bg-red-50 hover:bg-red-100 text-red-600
px-3 py-1.5 rounded-lg text-sm
transition-colors duration-150
```

### Input / Textarea
```
w-full border border-[#E7E5E4] rounded-lg px-3 py-2
text-sm text-[#1C1917] placeholder:text-[#A8A29E]
bg-white
focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 
focus:border-[#F97316]
transition-all duration-150
resize-none (for textarea)
```

### Badges / Status Pills
```
Applied:   bg-blue-50   text-blue-700   border border-blue-100
Screening: bg-yellow-50 text-yellow-700 border border-yellow-100
Interview: bg-purple-50 text-purple-700 border border-purple-100
Offer:     bg-green-50  text-green-700  border border-green-100
Rejected:  bg-red-50    text-red-500    border border-red-100
Study:     bg-orange-50 text-orange-700 border border-orange-100
General:   bg-stone-50  text-stone-600  border border-stone-200

Base classes: text-xs font-medium px-2.5 py-0.5 rounded-full
```

### Priority Indicators
```
Priority 1: bg-red-500    (dot or left border)
Priority 2: bg-orange-400
Priority 3: bg-yellow-400
Priority 4: bg-blue-400
Priority 5: bg-stone-300
```

---

## Micro-interactions & Motion

**Philosophy:** Motion should feel like breathing, not performing.
Every animation should have a reason. Fast in, slower out.

### Transition Defaults
```css
/* Add to index.css */
.transition-base {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.transition-smooth {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.transition-spring {
  transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Card Hover Effect
```jsx
className="group bg-white rounded-xl border border-[#E7E5E4] p-6
           transition-all duration-200
           hover:shadow-md hover:-translate-y-0.5
           hover:border-[#D6D3D1]"
```

### Button Active Press
```jsx
className="active:scale-[0.97] active:shadow-none
           transition-all duration-150"
```

### Sidebar Nav Link Hover
```jsx
// Sliding left accent bar on active
className={`relative flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg
            text-sm transition-all duration-150
            ${isActive
              ? 'bg-[#1E293B] text-white'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/60'
            }`}
// Active indicator bar
{isActive && (
  <span className="absolute left-0 top-1/2 -translate-y-1/2 
                   w-0.5 h-5 bg-[#F97316] rounded-full" />
)}
```

### Page Entry Animation
```jsx
// Wrap page content in this div
<div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
  {/* page content */}
</div>
```

Add to index.css:
```css
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes slide-in-from-bottom-2 {
  from { transform: translateY(8px); }
  to   { transform: translateY(0); }
}
.animate-in {
  animation: fade-in 300ms ease, slide-in-from-bottom-2 300ms ease;
}
```

### Modal Entry Animation
```css
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-animate {
  animation: modal-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Score/Number Count-Up
```jsx
// For level scores, stats numbers — use this hook
function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return count
}
// Usage: <span>{useCountUp(stats.total_applied)}</span>
```

### Progress Bar Animation
```jsx
// Animated fill on mount
<div className="h-2 bg-stone-100 rounded-full overflow-hidden">
  <div
    className="h-full bg-[#F97316] rounded-full transition-all duration-700 ease-out"
    style={{ width: `${(score / 10) * 100}%` }}
  />
</div>
```

### Toast / Success Feedback
```jsx
// Inline success state (no library needed)
{saved && (
  <span className="flex items-center gap-1.5 text-sm text-green-600
                   animate-in fade-in duration-200">
    <span className="text-base">✓</span> Saved
  </span>
)}
```

### Skeleton Loading
```jsx
// Use instead of "Loading..." text
function Skeleton({ className }) {
  return (
    <div className={`bg-stone-100 rounded-lg animate-pulse ${className}`} />
  )
}
// Usage
<Skeleton className="h-4 w-3/4 mb-2" />
<Skeleton className="h-4 w-1/2" />
```

---

## Layout Patterns

### Stat Card (used in Job Tracker, Study progress)
```jsx
function StatCard({ label, value, accent = false }) {
  const count = useCountUp(value)
  return (
    <div className="bg-white rounded-xl border border-[#E7E5E4] p-5
                    hover:shadow-md hover:-translate-y-0.5
                    transition-all duration-200">
      <p className="text-xs font-medium text-[#A8A29E] uppercase 
                    tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-mono font-bold
                    ${accent ? 'text-[#F97316]' : 'text-[#1C1917]'}`}>
        {count}
      </p>
    </div>
  )
}
```

### Empty State
```jsx
function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center 
                    py-16 text-center">
      <div className="text-4xl mb-4 opacity-40">{icon}</div>
      <p className="text-sm font-medium text-[#1C1917] mb-1">{title}</p>
      <p className="text-xs text-[#A8A29E] mb-4">{subtitle}</p>
      {action}
    </div>
  )
}
// Usage
<EmptyState
  icon="📋"
  title="No tasks for today"
  subtitle="Add a task to get started"
  action={<button className="...">Add Task</button>}
/>
```

### Section Header
```jsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h2 className="text-base font-semibold text-[#1C1917]">{title}</h2>
    {subtitle && (
      <p className="text-xs text-[#A8A29E] mt-0.5">{subtitle}</p>
    )}
  </div>
  {action}
</div>
```

### Modal Overlay
```jsx
// Full screen modal with backdrop blur
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
       onClick={onClose} />
  {/* Modal */}
  <div className="relative bg-white rounded-2xl shadow-2xl
                  w-full max-w-lg max-h-[90vh] overflow-y-auto
                  modal-animate">
    {/* Header */}
    <div className="flex items-center justify-between p-6 
                    border-b border-[#E7E5E4]">
      <h3 className="font-semibold text-[#1C1917]">{title}</h3>
      <button onClick={onClose}
              className="text-[#A8A29E] hover:text-[#1C1917]
                         transition-colors p-1 rounded-lg
                         hover:bg-stone-100">
        ✕
      </button>
    </div>
    {/* Body */}
    <div className="p-6">{children}</div>
  </div>
</div>
```

---

## Engaging Addictive Elements

### 1. Level Score Ring (Study Q&A)
```jsx
// SVG ring that fills based on score out of 10
function ScoreRing({ score, size = 80 }) {
  const r = 30
  const circumference = 2 * Math.PI * r
  const fill = (score / 10) * circumference
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none"
              stroke="#F5F5F4" strokeWidth="8" />
      <circle cx="40" cy="40" r={r} fill="none"
              stroke="#F97316" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${fill} ${circumference}`}
              strokeDashoffset={circumference / 4}
              style={{transition: 'stroke-dasharray 700ms ease'}} />
      <text x="40" y="44" textAnchor="middle"
            fontSize="16" fontWeight="600" fill="#1C1917"
            fontFamily="DM Mono">
        {score.toFixed(1)}
      </text>
    </svg>
  )
}
```

### 2. Streak Counter (Study Q&A)
```jsx
// Flame icon with streak count — turns brighter with higher streak
function StreakBadge({ streak }) {
  const intensity = Math.min(streak / 7, 1)
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 
                    bg-orange-50 rounded-full border border-orange-100">
      <span style={{filter: `saturate(${0.5 + intensity})`}}>🔥</span>
      <span className="text-sm font-mono font-semibold text-orange-700">
        {streak}
      </span>
      <span className="text-xs text-orange-500">day streak</span>
    </div>
  )
}
```

### 3. Activity Heatmap (Task progress)
```jsx
// GitHub-style contribution grid
function Heatmap({ data }) {
  // data: array of {date, count}
  const getColor = (count) => {
    if (!count) return 'bg-stone-100'
    if (count < 3) return 'bg-orange-200'
    if (count < 6) return 'bg-orange-400'
    return 'bg-[#F97316]'
  }
  return (
    <div className="flex gap-1 flex-wrap">
      {data.map((day, i) => (
        <div key={i} title={`${day.date}: ${day.count} tasks`}
             className={`w-3 h-3 rounded-sm ${getColor(day.count)}
                        transition-colors duration-200
                        hover:ring-2 hover:ring-[#F97316]/50
                        cursor-pointer`} />
      ))}
    </div>
  )
}
```

### 4. Kanban Card Drag Ghost Effect
```jsx
// On card mouse enter — subtle lift effect
className="group bg-white rounded-xl border border-[#E7E5E4]
           p-4 cursor-grab active:cursor-grabbing
           transition-all duration-150
           hover:shadow-lg hover:-translate-y-1
           hover:border-[#F97316]/30"
```

### 5. Answer Feedback Animation (Study Q&A)
```jsx
// After submitting answer — reveal result with animation
{feedback && (
  <div className={`rounded-xl p-4 border animate-in fade-in
                   duration-300 mt-4
                   ${isCorrect
                     ? 'bg-green-50 border-green-200'
                     : 'bg-red-50 border-red-200'
                   }`}>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xl">{isCorrect ? '✓' : '✗'}</span>
      <span className={`text-sm font-semibold
                       ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
        {isCorrect ? 'Correct!' : 'Not quite'}
      </span>
      <span className="ml-auto font-mono text-sm font-bold
                       text-[#F97316]">
        {(score * 10).toFixed(0)}%
      </span>
    </div>
    <p className="text-sm text-stone-600">{feedback}</p>
  </div>
)}
```

---

## Scrollbar Styling
```css
/* Add to index.css */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: #D6D3D1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover { background: #A8A29E; }
```

---

## Rules For Every Component

1. Every interactive element has a hover AND active state
2. Every data fetch shows a Skeleton, not "Loading..."
3. Every empty state has an icon, title, subtitle, and action
4. Modals use backdrop-blur-sm overlay
5. Numbers that represent progress animate with count-up
6. Buttons have active:scale-[0.97] press effect
7. Page entry uses animate-in fade-in slide-in-from-bottom-2
8. Never use bare gray — always use stone (warm gray)
9. Saffron (#F97316) is used for: active states, primary CTA,
   scores, accents — nothing else
10. Font sizes: page heading text-xl, section heading text-base,
    body text-sm, meta/labels text-xs

---

## What To Never Do

- No Inter or Roboto — we use DM Sans + Fraunces
- No purple gradients on white
- No generic blue primary buttons
- No flat cards with no depth or hover states
- No "Loading..." text — use Skeleton components
- No bare white backgrounds in content area — use #FAFAF5
- No multiple accent colors competing — saffron is the only accent
- No animations longer than 400ms except count-up (800ms)
- No motion on every element — use it on key moments only
