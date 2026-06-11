import { AskHome } from './ask-home'

/**
 * Member home — the merged home/ask surface. Home IS the ask entry moment;
 * /ask without a query renders the same component so the Ask tab, the
 * wordmark, and the edit-ask flow all land on one front door.
 */
export default function HomePage() {
  return <AskHome />
}
