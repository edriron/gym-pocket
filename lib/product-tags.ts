import {
  Dumbbell,
  Wheat,
  Droplets,
  Apple,
  Leaf,
  Milk,
  Beef,
  Fish,
  type LucideIcon,
} from 'lucide-react'

// ── Macro tags ────────────────────────────────────────────────
// Add entries here to extend macro filter chips + zod validation.
export const MACRO_TAG_CONFIG = [
  {
    tag: 'protein',
    icon: Dumbbell,
    iconColor: 'text-blue-500 dark:text-blue-400',
    activeClasses: 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300',
  },
  {
    tag: 'carb',
    icon: Wheat,
    iconColor: 'text-amber-500 dark:text-amber-400',
    activeClasses: 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300',
  },
  {
    tag: 'fat',
    icon: Droplets,
    iconColor: 'text-orange-500 dark:text-orange-400',
    activeClasses: 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300',
  },
] satisfies TagConfig[]

// ── Type tags ─────────────────────────────────────────────────
// Add a new entry here to add a type tag everywhere (filter chips,
// product form picker, and zod validation all read from this array).
export const TYPE_TAG_CONFIG = [
  {
    tag: 'fruit',
    icon: Apple,
    iconColor: 'text-rose-500 dark:text-rose-400',
    activeClasses: 'bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300',
  },
  {
    tag: 'vegetable',
    icon: Leaf,
    iconColor: 'text-green-600 dark:text-green-400',
    activeClasses: 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300',
  },
  {
    tag: 'dairy',
    icon: Milk,
    iconColor: 'text-sky-400 dark:text-sky-300',
    activeClasses: 'bg-sky-100 dark:bg-sky-900/40 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300',
  },
  {
    tag: 'meat',
    icon: Beef,
    iconColor: 'text-red-700 dark:text-red-500',
    activeClasses: 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300',
  },
  {
    tag: 'fish',
    icon: Fish,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    activeClasses: 'bg-cyan-100 dark:bg-cyan-900/40 border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300',
  },
] satisfies TagConfig[]

// ── Derived helpers (do not edit) ─────────────────────────────
interface TagConfig {
  tag: string
  icon: LucideIcon
  iconColor: string
  activeClasses: string
}

export type MacroTag = (typeof MACRO_TAG_CONFIG)[number]['tag']
export type TypeTag  = (typeof TYPE_TAG_CONFIG)[number]['tag']

// Zod-ready tuples — always in sync with the config above
export const MACRO_TAG_VALUES = MACRO_TAG_CONFIG.map((t) => t.tag) as [MacroTag, ...MacroTag[]]
export const TYPE_TAG_VALUES  = TYPE_TAG_CONFIG.map((t) => t.tag)  as [TypeTag,  ...TypeTag[]]
