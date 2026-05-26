---
"@lynx-example/lynx-ui-dialog": patch
"@lynx-js/lynx-ui-presence": patch
---

Fix presence edge cases for rapid visibility toggles during enter and exit transitions:

- Recover when an enter interrupts an in-progress exit.
- Keep open and close callbacks balanced across interrupted transitions.
- Remove mounted containers when dismissal occurs before entering starts.
