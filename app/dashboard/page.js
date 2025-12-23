import { redirect } from 'next/navigation'

/**
 * Redirection automatique vers /dashboard/parties
 * Utilise redirect() côté serveur pour une redirection instantanée
 */
export default function DashboardPage() {
  redirect('/dashboard/parties')
}