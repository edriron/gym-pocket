import {
  LayoutDashboard,
  Scale,
  ShoppingBasket,
  ChefHat,
  Utensils,
  Dumbbell,
} from 'lucide-react'

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Diet',      href: '/diet',      icon: Utensils },
  { label: 'Workout',  href: '/workout',   icon: Dumbbell },
  { label: 'Products', href: '/products',  icon: ShoppingBasket },
  { label: 'Recipes',  href: '/recipes',   icon: ChefHat },
  { label: 'Profile',  href: '/weight',    icon: Scale },  // also hosts Weight tab
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
