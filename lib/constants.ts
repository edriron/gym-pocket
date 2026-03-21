import {
  LayoutDashboard,
  Scale,
  ShoppingBasket,
  ChefHat,
  Utensils,
  Dumbbell,
  User,
} from 'lucide-react'

export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Weight',
    href: '/weight',
    icon: Scale,
  },
  {
    label: 'Diet',
    href: '/diet',
    icon: Utensils,
  },
  {
    label: 'Workout',
    href: '/workout',
    icon: Dumbbell,
  },
  {
    label: 'Products',
    href: '/products',
    icon: ShoppingBasket,
  },
  {
    label: 'Recipes',
    href: '/recipes',
    icon: ChefHat,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
  },
] as const

export const MOBILE_NAV_ITEMS = NAV_ITEMS.slice(0, 5)

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
