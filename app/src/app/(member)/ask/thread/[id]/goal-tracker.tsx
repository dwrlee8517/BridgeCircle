'use client'

import { Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type Goal = {
  id: string
  text: string
  done: boolean
}

const DEFAULT_GOALS = [
  { id: '1', text: 'Resume & LinkedIn Review', done: false },
  { id: '2', text: 'Define 3 career anchors', done: false },
  { id: '3', text: 'Conduct mock interview', done: false },
  { id: '4', text: 'Formulate 30-60-90 day plan', done: false },
]

export function MentorshipGoalTracker({ threadId }: { threadId: string }) {
  const [mounted, setMounted] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [newGoalText, setNewGoalText] = useState('')

  const storageKey = `bridgecircle:mentorship:goals:${threadId}`

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setGoals(JSON.parse(saved))
      } else {
        setGoals(DEFAULT_GOALS)
      }
    } catch (_e) {
      setGoals(DEFAULT_GOALS)
    }
  }, [storageKey])

  // Sync to localStorage
  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(storageKey, JSON.stringify(goals))
  }, [goals, storageKey, mounted])

  const toggleGoal = (id: string) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, done: !g.done } : g)))
  }

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGoalText.trim()) return
    const newGoal = {
      id: Date.now().toString(),
      text: newGoalText.trim(),
      done: false,
    }
    setGoals((prev) => [...prev, newGoal])
    setNewGoalText('')
    toast.success('Goal added')
  }

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id))
    toast.info('Goal removed')
  }

  const insertPreset = (text: string) => {
    if (goals.some((g) => g.text.toLowerCase() === text.toLowerCase())) {
      toast.warning('Goal already exists')
      return
    }
    const newGoal = {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now().toString(),
      text,
      done: false,
    }
    setGoals((prev) => [...prev, newGoal])
    toast.success(`Preset goal added: ${text}`)
  }

  const doneCount = goals.filter((g) => g.done).length
  const totalCount = goals.length
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-card border-l border-border font-mono text-[11px] p-4 text-muted-foreground animate-pulse">
        Loading goal tracker...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-card border-l border-border font-mono text-[11px] min-h-[400px]">
      <div className="p-3.5 border-b border-border bg-muted/30">
        <span className="text-[9px] font-bold text-primary uppercase tracking-wider block mb-1">
          Progress Tracker
        </span>
        <div className="flex justify-between items-baseline text-foreground">
          <span className="font-bold tracking-tight">GOALS</span>
          <span className="font-bold text-primary">{completionRate}%</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden mt-2 relative">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3">
        {goals.length === 0 ? (
          <div className="text-muted-foreground text-center py-6">
            No active goals. Add some below!
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {goals.map((g) => (
              <div
                key={g.id}
                className="flex gap-2 items-start justify-between relative group/item"
              >
                <div className="flex gap-2 items-start flex-1 min-w-0 pr-4">
                  <input
                    type="checkbox"
                    checked={g.done}
                    onChange={() => toggleGoal(g.id)}
                    className="mt-0.5 cursor-pointer accent-primary size-3 rounded border-border"
                  />
                  <span
                    className={`leading-relaxed break-words ${
                      g.done ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}
                  >
                    {g.text}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteGoal(g.id)}
                  className="text-destructive hover:text-destructive/80 opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 shrink-0"
                  aria-label="Delete goal"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 border-t border-dashed border-border/80 pt-3">
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block mb-2">
            Quick Presets
          </span>
          <div className="flex flex-col gap-1.5 items-start">
            {['Portfolio Review', 'Mock Interview', 'Resume Deep Dive', '30-60-90 Day Plan'].map(
              (preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => insertPreset(preset)}
                  className="text-primary hover:underline text-[10px] text-left flex items-center gap-1 font-medium"
                >
                  <Plus className="size-2.5" />
                  {preset}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <form onSubmit={addGoal} className="p-3 border-t border-border bg-muted/10">
        <input
          type="text"
          placeholder="Add custom goal..."
          value={newGoalText}
          onChange={(e) => setNewGoalText(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-background text-foreground border border-border rounded text-[11px] font-mono outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        />
      </form>
    </div>
  )
}
