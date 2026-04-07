import { redirect } from 'next/navigation'

export default function RecipesPage() {
  redirect('/library?tab=recipes')
}
