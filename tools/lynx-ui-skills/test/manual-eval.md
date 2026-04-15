# lynx-ui-skills Manual Eval

This eval is for checking whether `lynx-ui-skills` behaves like a good skill after installation, not just whether the files look correct.

## Goal

Measure whether the skill improves:

- triggering
- routing
- public API accuracy
- example adaptation quality
- coverage-limit honesty

## Recommended Setup

1. Pack or publish the skill payload.
2. Install it the same way downstream will consume it.
3. Run prompts in a clean workspace or fresh session so prior context does not help the model.
4. Compare behavior with and without the skill when possible.

## Prompt Set

Use the cases in `eval-cases.json`.

Categories:

- `routing`
- `api`
- `example-adaptation`
- `negative`

## Scoring Rubric

Score each prompt on these dimensions:

- `trigger`: `0` or `1`
  - `1` if the skill is used when it should be, or not used when it should not be.
- `route`: `0` or `1`
  - `1` if it selects the right component or correctly states that the component is not covered.
- `read-order`: `0` or `1`
  - `1` if it starts from the right file, usually `reference.md` for routing and `guide.md` for the selected component.
- `api-accuracy`: `0` or `1`
  - `1` if it does not invent props, types, exports, or behaviors.
- `example-discipline`: `0` or `1`
  - `1` if it uses examples only when needed and removes irrelevant demo-only details.
- `coverage-honesty`: `0` or `1`
  - `1` if it clearly states when the skill does not cover the request.

Maximum score per prompt: `6`

## Acceptance Bar

For this skill, use these thresholds:

- Routing prompts: at least `90%` correct routing.
- API prompts: `100%` no invented public APIs.
- Negative prompts: `100%` honest coverage handling.
- Example adaptation prompts: at least `80%` produce focused patterns without unnecessary demo residue.

## What To Inspect

### Routing prompts

Check whether the model:

- uses `reference.md` when the component is not explicit
- picks the most specific covered component
- chooses `List` over `ScrollView` for repeated collections
- chooses `Dialog` over `Popover` for blocking modal interactions
- chooses `FeedList` over `List` when refresh/load-more semantics are central

### API prompts

Check whether the model:

- opens `api.md` when exact prop or export details matter
- distinguishes documented public APIs from inferred behavior
- avoids guessing

### Example adaptation prompts

Check whether the model:

- starts from `guide.md`
- uses `examples.md` or raw `examples/<Component>/<Case>/index.tsx` only when helpful
- keeps the adapted answer concise and removes unrelated demo code

### Negative prompts

Check whether the model:

- explicitly says the skill does not cover the target component
- falls back cleanly instead of hallucinating a curated guide
- does not pretend uncovered components such as bottom-sheet or tabs are bundled here

## Failure Categories

When a run fails, classify it:

- bad trigger
- wrong routing
- opened too many files
- skipped API verification
- hallucinated public surface
- overused examples
- hid coverage limits

## Suggested Eval Procedure

1. Run all prompts from `eval-cases.json`.
2. Record the final answer and, if available, the files the model inspected.
3. Score each prompt with the rubric above.
4. Group failures by category.
5. Revise:
   - `SKILL.md` for workflow or answering failures
   - `reference.md` for routing failures
   - component `guide.md` or generated payload shape for content failures

## High-Value Regression Checks

Run these after every substantial change to the skill:

- `Dialog` vs `Popover`
- `List` vs `ScrollView`
- `FeedList` vs `List`
- uncovered component requests such as `Checkbox`, `Tabs`, or bottom sheet

These catch the most likely regressions in skill quality.
