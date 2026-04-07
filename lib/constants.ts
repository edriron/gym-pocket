import {
  LayoutDashboard,
  Scale,
  BookOpen,
  Utensils,
  Dumbbell,
} from 'lucide-react'

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Profile',   href: '/weight',    icon: Scale },
  { label: 'Workout',   href: '/workout',   icon: Dumbbell },
  { label: 'Nutrition', href: '/nutrition', icon: Utensils },
  { label: 'Library',   href: '/library',   icon: BookOpen },
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
