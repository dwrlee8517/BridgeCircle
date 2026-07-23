import {
  GraduationCap,
  HandHelping,
  House,
  type LucideIcon,
  MessageCircle,
  Shield,
  Users,
} from 'lucide-react'

const MEMBER_NAV_ICONS: Record<string, LucideIcon> = {
  '/': House,
  '/help': HandHelping,
  '/people': Users,
  '/school': GraduationCap,
  '/messages': MessageCircle,
  '/admin/invite': Shield,
}

export function getMemberNavIcon(href: string) {
  return MEMBER_NAV_ICONS[href] ?? House
}
