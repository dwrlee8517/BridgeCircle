import { AskHome } from './ask-home'

/**
 * Home remains backed by the existing relationship-action feed while the
 * redesigned Home template is implemented. The new AppShell gives Home its
 * own section root at `/`; Help now owns the ask/give toggle at `/help`.
 */
export default function HomePage() {
  return <AskHome />
}
