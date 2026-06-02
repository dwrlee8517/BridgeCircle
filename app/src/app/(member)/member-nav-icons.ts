import {
  GraduationCap,
  HandHelping,
  Inbox,
  type LucideIcon,
  MessageCircleQuestion,
  Shield,
  Users,
} from 'lucide-react'

const MEMBER_NAV_ICONS: Record<string, LucideIcon> = {
  '/': MessageCircleQuestion,
  '/help': HandHelping,
  '/people': Users,
  '/school': GraduationCap,
  '/inbox': Inbox,
  '/admin/invite': Shield,
}

export function getMemberNavIcon(href: string) {
  return MEMBER_NAV_ICONS[href] ?? MessageCircleQuestion
}
