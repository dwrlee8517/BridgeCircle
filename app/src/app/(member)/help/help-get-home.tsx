import type { HelpAskSummary, HelpHome } from '@/lib/help/contracts'
import { HelpQuestionForm } from './help-question-form'
import { RecentAskList } from './recent-ask-list'

export function HelpGetHome({
  home,
  recentAsks,
}: {
  home: HelpHome
  recentAsks: HelpAskSummary[]
}) {
  return (
    <div className="min-h-full bg-[var(--surface-page)]">
      <section className="bg-[image:var(--wash-get)] px-4 pt-5 pb-7 sm:px-6 sm:pt-7 sm:pb-8 xl:px-8">
        <div className="mx-auto max-w-[860px]">
          <HelpQuestionForm
            membershipId={home.membershipId}
            activeAskCount={home.activeAskCount}
            activeAskLimit={home.activeAskLimit}
          />
        </div>
      </section>

      <section className="mx-auto max-w-[860px] px-4 py-6 sm:px-6 sm:py-7 xl:px-0">
        <RecentAskList
          asks={recentAsks}
          activeAskCount={home.activeAskCount}
          activeAskLimit={home.activeAskLimit}
        />
      </section>
    </div>
  )
}
