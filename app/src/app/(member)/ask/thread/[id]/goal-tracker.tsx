'use client'

import { Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'

type Goal = {
  id: string
  text: string
  done: boolean
}

const DEFAULT_GOALS = [
  { id: '1', text: 'Resume & LinkedIn review', done: false },
  { id: '2', text: 'Define three career anchors', done: false },
  { id: '3', text: 'Conduct mock interview', done: false },
  { id: '4', text: 'Formulate 30-60-90 day plan', done: false },
]

const PRESETS = ['Portfolio review', 'Mock interview', 'Resume deep dive', '30-60-90 day plan']

export function MentorshipGoalTracker({ threadId }: { threadId: string }) {
  const [mounted, setMounted] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [newGoalText, setNewGoalText] = useState('')

  const storageKey = `bridgecircle:mentorship:goals:${threadId}`

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setMounted(true)
      try {
        const saved = localStorage.getItem(storageKey)
        setGoals(saved ? JSON.parse(saved) : DEFAULT_GOALS)
      } catch (_error) {
        setGoals(DEFAULT_GOALS)
      }
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [storageKey])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(storageKey, JSON.stringify(goals))
  }, [goals, storageKey, mounted])

  function toggleGoal(id: string) {
    setGoals((prev) => prev.map((goal) => (goal.id === id ? { ...goal, done: !goal.done } : goal)))
  }

  function addGoal(event: React.FormEvent) {
    event.preventDefault()
    const text = newGoalText.trim()
    if (!text) return
    setGoals((prev) => [...prev, { id: Date.now().toString(), text, done: false }])
    setNewGoalText('')
    toast.success('Goal added')
  }

  function deleteGoal(id: string) {
    setGoals((prev) => prev.filter((goal) => goal.id !== id))
    toast.info('Goal removed')
  }

  function insertPreset(text: string) {
    if (goals.some((goal) => goal.text.toLowerCase() === text.toLowerCase())) {
      toast.warning('Goal already exists')
      return
    }
    setGoals((prev) => [...prev, { id: Date.now().toString(), text, done: false }])
    toast.success(`Preset goal added: ${text}`)
  }

  const doneCount = goals.filter((goal) => goal.done).length
  const totalCount = goals.length
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  if (!mounted) {
    return (
      <div className="bc-loading-pulse p-5 text-sm text-muted-foreground">
        Loading goal tracker...
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-border bg-surface-panel/45 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-label text-muted-foreground">
              Progress tracker
            </p>
            <h2 className="mt-1 font-heading text-lg font-semibold text-foreground">Goals</h2>
          </div>
          <StatusBadge tone={completionRate === 100 ? 'open' : 'info'}>
            {completionRate}%
          </StatusBadge>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-card">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-medium ease-emphasized"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      <div className="space-y-4 p-5">
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active goals yet.</p>
        ) : (
          <div className="space-y-2">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="group/item flex items-start gap-3 rounded-md border border-border bg-background p-3"
              >
                <Checkbox
                  checked={goal.done}
                  onCheckedChange={() => toggleGoal(goal.id)}
                  aria-label={`Mark ${goal.text} complete`}
                  className="mt-0.5"
                />
                <span
                  className={`min-w-0 flex-1 text-sm leading-6 ${
                    goal.done ? 'text-muted-foreground line-through' : 'text-foreground'
                  }`}
                >
                  {goal.text}
                </span>
                <button
                  type="button"
                  onClick={() => deleteGoal(goal.id)}
                  className="rounded-sm p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-danger-tint hover:text-destructive group-hover/item:opacity-100 group-focus-within/item:opacity-100"
                  aria-label="Delete goal"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-dashed border-border pt-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-label text-muted-foreground">
            Quick presets
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                size="xs"
                onClick={() => insertPreset(preset)}
              >
                <Plus className="size-3" />
                {preset}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={addGoal} className="border-t border-border bg-surface-panel/35 p-5">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Add custom goal..."
            value={newGoalText}
            onChange={(event) => setNewGoalText(event.target.value)}
            className="bg-card"
          />
          <Button type="submit" variant="default" size="default" aria-label="Add goal">
            <Plus className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
