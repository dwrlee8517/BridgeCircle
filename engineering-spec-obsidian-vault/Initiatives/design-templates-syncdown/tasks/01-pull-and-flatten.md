---
id: design-templates-syncdown/01-pull-and-flatten
initiative: "[[Initiatives/design-templates-syncdown/plan|Design templates sync-down (flat screens/)]]"
status: done
depends_on: []
pr: https://github.com/dwrlee8517/BridgeCircle/pull/194
---

# 01 — Pull 39 screens, vendor the runtime, flatten the tree

> One PR. One focused session.

## Cold start

Claude Design restructured the BridgeCircle templates on 2026-08-14: the 15
per-flow folders (`templates/app-shell/`, `templates/help/`, …) were replaced by a
single flat `templates/screens/`, because Claude Design resolves `<dc-import>`
against **siblings** — a shared component and the screens using it must sit in the
same directory. The repo has only 3 of the 41 files.

**The non-obvious part, and the whole reason this task is written out:**
`DesignSync get_file` returns each file's body into the model context as JSON. If
you retype that body into a `Write` call you will produce a corrupted mirror that
looks fine — 35 KB of HTML does not survive transcription. Extract from the session
transcript instead; the script is below. This is the same method the 2026-07-12
pull used.

Two more things that will otherwise cost you time:

- `DesignSync` is **main-thread only**. Launching a subagent to do the pull fails —
  the tool is not in its set, and there is no CLI fallback. Already tried.
- Any Bash command containing `cd` into this repo prints a spurious fnm error and
  can swallow the real output. Prefix with
  `eval "$(fnm env 2>/dev/null)" 2>/dev/null;`.

Project id: `403a99dc-f481-472b-974d-aea93ee512f9`
Bundle root: `docs/experience/ui/design-system/handoff/bridgecircle/project`

## Scope

**In:**
- Pull the outstanding files into `templates/screens/` — the canonical 39-path list
  is below; 3 are already on disk, so 36 remain, plus `support.js`.
- Pull `templates/screens/support.js` — the 64 KB compiled dc-runtime. One copy.
- Delete the 15 per-flow folders (65 files), **after** verification passes.
- Repoint 5 stale references that would otherwise point at deleted folders.
- Push the 2 touched specimens + arm `_ds_needs_recompile`, so both sides agree.

**Out:**
- `templates/sync-plan/**` and `uploads/repo_copy-*.html` — new remote files, not
  in the requested scope. Leave them on the remote; do not pull or delete.
- `.thumbnail`, `_ds_manifest.json`, `_adherence.oxlintrc.json` — app-generated,
  never vendored.
- Fixing anything the verification flags in the pulled content. Report it; a
  missing token is a ledger question, not a mechanical fix.

## Files

| Path | What changes |
|---|---|
| `…/project/templates/screens/*.dc.html` | 30 new files pulled (32 total, with `Shell` and `Toast` already down) |
| `…/project/templates/screens/*.js` | 8 data/menu files + `support.js` pulled (10 total with the existing `ds-base.js`) |
| `…/project/templates/{app-shell,entry,help,home,messages,my-circle,notifications,onboarding,people,profile,profile-self,profile-slideover,school,settings,system-states}/` | deleted — 65 files |
| `…/project/preview/system-states.html` | 2 provenance refs → `templates/screens/…` |
| `…/project/preview/decision-dialogs.html` | 2 provenance refs → `templates/screens/…` |
| `design-qa.md` | 4 absolute per-flow paths → `templates/screens/…` |

Leave alone: `.design-sync/NOTES.md` line ~224 mentions
`templates/onboarding/Onboarding.dc.html` — that is dated history of a July fix,
correct as written.

## The canonical 39 paths (3 already on disk — see below)

31 `.dc.html`, each `templates/screens/<Name>.dc.html`: AnnouncementRead,
Announcements, AppShell, AskCircle, AskCompose, AskHistory, AskStatus, Avatar,
Card, Entry, GiveDirect, GiveOffer, Help, Home, Messages, MyCircle,
NewsletterArchive, NewsletterIssue, Notifications, Onboarding, People, Profile,
ProfileSelf, ProfileSlideOver, School, SchoolEvent, Screens, Settings, SignedOut,
SystemStates, Toast

8 `.js` under `templates/screens/`: `account-menu.js`, `help-data.js`,
`home-data.js`, `messages-data.js`, `notifications-data.js`, `profile-data.js`,
`school-data.js`, `settings-data.js`

Plus `templates/screens/support.js` (the runtime, per the plan's decisions log).

**Already on disk (30 of 42), never refetch or clobber:** everything in
`templates/screens/` as of commit on branch `sync/design-token-kinds`.

**REMAINING — none. All 42 are on disk and verified as of 2026-08-14.** The last
12 (`AskCircle`, `AskCompose`, `AskStatus`, `GiveOffer`, `Help`, `Home`,
`Messages`, `Onboarding`, `People`, `Profile`, `School`, `support.js`) were pulled
in this session.

Get the live list any time instead of trusting this one:

```bash
ls -1 docs/experience/ui/design-system/handoff/bridgecircle/project/templates/screens/ | wc -l   # want 42
```

## Steps

1. `DesignSync list_files` on the project → confirm the 39 paths still exist and
   nothing has been renamed since 2026-08-14. → the listing matches the names above
2. Save the harvest script below to a temp path. → `python3 -m py_compile` clean
3. `DesignSync get_file` for ~6 paths, then run the script. Repeat until every path in the
   list below plus `support.js` is on disk. → each run prints the byte sizes it wrote; it is
   idempotent and later-wins, so re-running is safe
4. Run the verification below. → 42 files, no zero-byte, no truncated fetch,
   `node --check` clean, every `var()` resolves
5. Only now delete the 15 per-flow folders with `git rm -r`. → `git status` shows
   65 deletions
6. Repoint the 5 stale references. → `grep -rn "templates/\(app-shell\|entry\|help\|home\|messages\|my-circle\|notifications\|onboarding\|people\|profile\|profile-self\|profile-slideover\|school\|settings\|system-states\)/"` returns only the NOTES.md history line
7. Commit, open the PR, then `finalize_plan` + `write_files` to push the 2 changed
   specimens and a `_ds_needs_recompile` sentinel. → read one back with `get_file`
   to confirm it landed

## The harvest script

Writes transcript content to disk byte-exact. `SESSION` auto-selects the most
recently modified transcript; pass one as `argv[1]` to override.

```python
#!/usr/bin/env python3
import base64, glob, json, os, re, sys
DEST = "/Users/richardlee/Developer/BridgeCircle/docs/experience/ui/design-system/handoff/bridgecircle/project"
KEEP = re.compile(r"^templates/screens/.+$")
SKIP = {"templates/screens/Shell.dc.html", "templates/screens/ds-base.js",
        "templates/screens/Toast.dc.html"}
PROJ = os.path.expanduser("~/.claude/projects/-Users-richardlee-Developer-BridgeCircle")
SESSION = sys.argv[1] if len(sys.argv) > 1 else max(
    glob.glob(os.path.join(PROJ, "*.jsonl")), key=os.path.getmtime)

txt = open(SESSION, errors="replace").read()
found, i, needle = {}, 0, '"method":"get_file"'
while True:
    h = txt.find(needle, i)
    if h < 0: break
    start = txt.rfind("{", 0, h)
    j, depth, instr, esc = start, 0, False, False
    while j < len(txt):
        c = txt[j]
        if instr:
            if esc: esc = False
            elif c == "\\": esc = True
            elif c == '"': instr = False
        else:
            if c == '"': instr = True
            elif c == "{": depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0: break
        j += 1
    try:
        o = json.loads(txt[start:j+1])
        p = o.get("path", "")
        if o.get("method") == "get_file" and "content" in o and KEEP.match(p) and p not in SKIP:
            found[p] = o
    except Exception:
        pass
    i = h + 1

trunc = [p for p, o in found.items() if o.get("truncated")]
for p, o in sorted(found.items()):
    out = os.path.join(DEST, p)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    if o.get("isBase64"):
        open(out, "wb").write(base64.b64decode(o["content"]))
    else:
        open(out, "w").write(o["content"])
    print(f"  wrote {p:46} {os.path.getsize(out):>7,} b")
print(f"\n{len(found)} written from {os.path.basename(SESSION)}")
print("TRUNCATED FETCHES (refetch these):", trunc or "none")
```

## Verification

This task touches no app code, so the `app/CLAUDE.md` suite is not the gate. The
gate is fidelity:

```bash
eval "$(fnm env 2>/dev/null)" 2>/dev/null
cd docs/experience/ui/design-system/handoff/bridgecircle/project/templates/screens
ls -1 | wc -l                                    # expect 42
find . -type f -empty                            # expect no output
for f in *.js; do node --check "$f" || echo "FAIL $f"; done
head -c 20 Screens.dc.html; grep -c "</html>" *.dc.html | grep ":0" || echo "all closed"
```

Then, from the bundle root, confirm every token resolves:

```bash
python3 - <<'PY'
import re, glob
css = re.sub(r"/\*.*?\*/", "", open("colors_and_type.css").read(), flags=re.S)
declared = set(re.findall(r"(--[A-Za-z0-9_-]+)\s*:", css))
missing = {}
for f in glob.glob("templates/screens/*"):
    for m in re.finditer(r"var\(\s*(--[A-Za-z0-9_-]+)\s*(,[^)]*)?\)", open(f, errors="replace").read()):
        if m.group(1) not in declared and not m.group(2):
            missing.setdefault(m.group(1), set()).add(f.split("/")[-1])
print("unresolved:", {k: sorted(v) for k, v in missing.items()} or "none")
PY
```

- Every `.dc.html` starts `<!DOCTYPE html>` and contains `</html>`.
- No file is zero bytes; no fetch reported `truncated`.
- Report unresolved tokens; do not invent tokens to satisfy them.
- After the push, `get_file` one specimen back and diff it against local.

## Done when

- [ ] 42 files in `templates/screens/`, all byte-exact, verification clean
- [ ] The 15 per-flow folders are gone (65 deletions in the diff)
- [ ] `grep` for old per-flow paths returns only the NOTES.md history line
- [ ] The 2 changed specimens are pushed to the remote and read back
- [ ] `.design-sync/NOTES.md` carries a re-sync log entry for this pull
- [ ] PR opened and CI green
- [ ] `plan.md` status flipped to `done`, and the parked decisions in the decision
      brief are unblocked

## Handoff notes

### 2026-08-14 — pull, verification, and flatten all done; only the push remains

**Steps 1–6 are complete. Step 7 (commit, PR, push the 2 specimens) has not
started.** The deletion is staged but nothing is committed yet.

The 65 per-flow files are deleted and `templates/screens/` (42 files) is the only
tree under `templates/`. A structural diff against `list_files` shows the bundle at
parity apart from the four files this initiative scoped out on purpose
(`templates/sync-plan/**`, `uploads/repo_copy-*.html`); local-only paths are
`screenshots/**` and gitignored `.DS_Store`. As an independent fidelity check,
`Card.dc.html` — pulled in an *earlier* session, not this one — was re-fetched and
is byte-identical to the local copy (sha `8ad464a17f91f5ae`, 1,717 b), which is
some evidence the earlier sessions' 30 files are sound too, not just this
session's 12.

- **Done:** all 12 outstanding files pulled byte-exact (42 total in
  `templates/screens/`). Full verification passes — no zero-byte file, no
  `truncated` fetch, `<!DOCTYPE html>` + `</html>` on every `.dc.html`,
  `node --check` clean on all 10 `.js`, and `unresolved: none` on the token scan.
  The 5 stale references are repointed, and `.design-sync/NOTES.md` carries the
  re-sync log entry.

- **One friction worth recording:** `git rm -r` on the per-flow folders was
  **denied by the Claude Code permission classifier** on the first two attempts
  (plain and compound forms) — a harness gate, not a repo or git problem. Richard
  approved it in chat and the same command then ran clean via `git -C <dir>`. If a
  later task hits this, ask rather than routing around it with `rm` or a script;
  that defeats the gate instead of satisfying it.

- **What diverged from the plan:** the harvest script needed one addition. Results
  over roughly 50 KB are **not inlined in the transcript** — the harness spills
  them to `~/.claude/projects/<proj>/<session>/tool-results/*.txt` and leaves only
  a 2 KB preview behind. The transcript-only scan in the plan therefore silently
  misses every large screen (8 of the 12 here, including `support.js`). The script
  now scans that sidecar directory too and merges later-wins. Both sources are the
  tool's own JSON, so both are byte-exact — this widens the extraction path, it
  does not weaken it. The working copy is at
  `scratchpad/harvest.py`; fold the addition into the plan's inline copy if this
  method is used again.

- **Also worth knowing:** the plan says the post-deletion grep should return only
  the `NOTES.md` history line. It returns that line **plus 8 hits under
  `docs/_archive/database-v2-2026-07/`**. Those are archived, superseded July
  plans describing paths that were correct when written — the same category as the
  `NOTES.md` line, so they were deliberately left alone rather than growing the
  diff. Expect them in the grep; they are not misses.

- **What the next session needs to know:** resume at step 7, which now pushes
  **3** files, not 2: `preview/system-states.html`, `preview/decision-dialogs.html`
  (repointed provenance comments) and `templates/TOKEN-KINDS.md` (count fix, see
  below), plus a `_ds_needs_recompile` sentinel. That is a write to the shared org
  project, so confirm with Richard before pushing.

- **TOKEN-KINDS.md had a wrong count, now fixed.** Its prose claimed "22 unique"
  unclassifiable tokens while enumerating 21 (7 shadow + 14 color). Richard
  confirmed 21 is correct, so the local copy now says 21 and spells out the
  arithmetic: the 21 names land as 33 declarations in `colors_and_type.css` — all
  21 in `:root`, plus the 12 that `.dark` redeclares. Since this is a remote-
  authored file, the fix has to go back up or it will be clobbered on the next
  pull. One loose end left deliberately: the header still cites the checker's
  "31 of 371", which does not reconcile with the 33 declarations actually present.
  That number was not touched because `check_design_system` was not re-run this
  session — re-run it and correct the figure if it disagrees.

- **Logged to `Backlog/`:** nothing. Nothing out of scope surfaced.
