import {
  LayoutDashboard,
  Scale,
  ShoppingBasket,
  ChefHat,
  Utensils,
  Dumbbell,
  ClipboardList,
} from 'lucide-react'

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Profile',   href: '/weight',    icon: Scale },  // also hosts Weight tab
  { label: 'Log',       href: '/log',       icon: ClipboardList },
  { label: 'Workout',   href: '/workout',   icon: Dumbbell },
  { label: 'Diet',      href: '/diet',      icon: Utensils },
  { label: 'Products',  href: '/products',  icon: ShoppingBasket },
  { label: 'Recipes',   href: '/recipes',   icon: ChefHat },
] as const

// All items appear in the mobile bottom bar (6 is fine — they shrink equally)
export const MOBILE_NAV_ITEMS = NAV_ITEMS

export const MEAL_SECTION_PRESETS = [
  'Breakfast',
  'Morning Snack',
  'Lunch',
  'Afternoon Snack',
  'Dinner',
  'Evening Snack',
  'Pre-Workout',
  'Post-Workout',
]
