---
name: lynx-ui-input
description: Build and troubleshoot text entry with lynx-ui Input, TextArea, and KeyboardAware primitives, including controlled values, native filtering, selection, and keyboard avoidance.
---

# lynx-ui-input SKILL

`lynx-ui-input` provides headless single-line and multiline text entry for
ReactLynx, plus composable keyboard avoidance. Import its public components and
ref types from `@lynx-js/lynx-ui`.

## 1. Core Capabilities

- **Text entry**: Use `Input` for single-line fields and `TextArea` for multiline
  content. Both accept `className` and `style` without imposing a visual theme.
- **Value ownership**: Use `value` + `onInput` for controlled fields, or
  `defaultValue` for an initial uncontrolled value.
- **Native editing**: Configure keyboard type, confirmation key, character
  filtering, length limits, and read-only behavior through the wrapper props.
- **Editing callbacks**: Receive text, selection offsets, and optional input
  method editor (IME) composition state without unpacking native event objects.
- **Imperative operations**: `InputRef` and `TextAreaRef` expose asynchronous
  focus, blur, value access, and selection methods.
- **Keyboard avoidance**: Compose `KeyboardAwareRoot`,
  `KeyboardAwareResponder`, and `KeyboardAwareTrigger` to move a region or scroll
  the focused field into view.

## 2. AI Coding Guide

### Minimal Usable Example (Controlled)

```tsx
import { useState } from '@lynx-js/react'
import { Input, TextArea } from '@lynx-js/lynx-ui'

function ProfileFields() {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')

  return (
    <view>
      <Input
        value={name}
        onInput={setName}
        placeholder='Name'
        maxLength={60}
        style={{ width: '100%', height: '44px' }}
      />
      <TextArea
        value={bio}
        onInput={setBio}
        placeholder='About you'
        maxLength={600}
        maxLines={8}
        style={{ width: '100%', height: '120px' }}
      />
    </view>
  )
}
```

Give fields a usable width and a deliberate height or content-sizing policy.
Compose labels, borders, icons, clear buttons, and validation messages in
surrounding views. For themed examples, import
`@lynx-js/luna-styles/index.css` in the stylesheet, apply a theme such as
`lunaris-dark` at the page root, and use semantic LUNA tokens.

### Public API Boundary

The wrappers render `<input>` and `<textarea>`. The native `x-input-ng` and
`x-textarea-ng` implementations inform the behavior notes below, but their
complete native attribute and event surface is not the ReactLynx wrapper API.

| Wrapper API                                           | Native mapping / behavior                                   |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| `value`, `defaultValue`                               | Applied through the native `setValue` method.               |
| `onInput(value, start, end, isComposing?)`            | Unpacks `bindinput` details into positional arguments.      |
| `onFocus(value)`, `onBlur(value)`, `onConfirm(value)` | Each receives the text string.                              |
| `onSelectionChange(start, end)`                       | Unpacks `bindselection`; offsets are native text positions. |
| `maxLength`                                           | `maxlength`; wrapper default is `140`.                      |
| `inputFilter`                                         | `input-filter`; pass a regex string.                        |
| `confirmType`                                         | `confirm-type`; wrapper default is `'send'`.                |
| `showSoftInputOnFocus`                                | `show-soft-input-on-focus`; defaults to `true`.             |
| `TextArea.maxLines`, `lineSpacing`                    | `maxlines` (default `40`) and `line-spacing`.               |
| `TextArea.bounces`                                    | iOS bounce behavior; defaults to `true`.                    |

Use `readonly` (lowercase), not DOM `readOnly` or `disabled`. These wrappers do
not expose `onChange`, `autoFocus`, `rows`, `autoHeight`, raw `inputProps` /
`textareaProps`, or arbitrary native prop spreading. Native options such as
`confirm-enter` and native line-count or keyboard-height events are not exposed
either. Do not add these props to generated consumer code.

### Recommended Prompt Formula

> **Field**: [single-line Input / multiline TextArea] for [purpose].
> **Value ownership**: [controlled value + onInput / uncontrolled defaultValue].
> **Editing rules**: [keyboard type], [allowed characters], [length / line limit],
> and [validation timing].
> **Keyboard behavior**: [confirmation action], [focus or selection action], and
> [no avoidance / translated region / scrollable form].
> **Appearance**: [LUNA theme], [dimensions], [labels and surrounding controls].

**Example Prompts:**

- "Build a controlled search Input with `confirmType='search'`. Update the text
  immediately and debounce search requests while respecting IME composition."
- "Build an uncontrolled numeric Input with a six-character limit and a clear
  button using `InputRef.setValue('')`."
- "Build a LUNA-themed profile form with Input and TextArea inside a vertical
  KeyboardAwareResponder. Keep each focused field above the keyboard."

## 3. Use Cases & Best Practices

### Value Synchronization and IME Composition

- Choose the mode at mount and keep it stable. The wrappers capture
  `value !== undefined` once; initialize controlled state to `''`, not
  `undefined`. Do not combine `value` and `defaultValue`.
- Mirror the incoming text in `onInput` immediately, including composing text.
  Debounce requests or expensive validation separately from the value update.
  Controlled input briefly sets native `readonly` while dispatching the callback
  to the background thread, then unlocks it when the callback returns; keep this
  callback short and avoid throwing from it.
- Skip destructive formatting, cursor rewrites, and submission while
  `isComposing === true`. Keep the raw editing value separate from a normalized
  submitted value when necessary.
- Do not rely on returning the same controlled value to reject a native edit:
  the value effect runs when the prop changes. Prefer `inputFilter` for simple
  character restrictions and validate complete values on blur or confirmation.
- `defaultValue` is initialization only. Reset uncontrolled fields through
  `ref.setValue('')`; reset controlled fields through their state setter.
- Do not assume programmatic `setValue` is silent or produces exactly one
  `onInput`. Android text replacement can notify text watchers, and iOS TextArea
  explicitly runs its change handler. Keep callbacks safe for repeated values.

### Filtering and Multiline Input

`type` accepts `'text'`, `'number'`, `'digit'`, `'password'`, `'tel'`, and
`'email'`. It selects native editing / keyboard behavior; validate complete
business values separately. For a simple ASCII digit field:

```tsx
<Input
  defaultValue=''
  type='number'
  inputFilter='[0-9]'
  maxLength={6}
  style={{ width: '100%', height: '44px' }}
/>
```

Android and iOS native filters inspect individual characters. Use allowlists
such as `[0-9]` or `[A-Za-z0-9]`, not a whole-value regex such as
`^\d{6}$` or a complete email pattern. For unrestricted human-language text,
avoid character filters that could discard composing text. Harmony delegates
filtering to ArkUI, so verify paste and IME behavior on the target platform.

Set `maxLength` explicitly for long-form text; the wrapper's default remains
`140` even for TextArea. `maxLines` is a native line constraint, not a CSS height
or an HTML `rows` equivalent. Android measures wrapped text when enforcing the
limit, while other platforms use different native layout paths. Test wrapping,
paste, line breaks, and font sizing when the exact limit matters.

Use `lineSpacing` for additional line spacing and `bounces` for the iOS scrolling
effect. Do not infer portable multiline password support from the inherited
`type` union: the inspected Harmony TextArea parser does not support
`'password'`. Use `Input type='password'` for password entry.

### Focus, Value Access, and Selection

All five ref methods return promises. Call them after the component mounts,
guard the ref, and handle native invocation failures. Native failures are
wrapped in `InvokeRejectError`.

```tsx
import { useRef } from '@lynx-js/react'
import { Input } from '@lynx-js/lynx-ui'
import type { InputRef } from '@lynx-js/lynx-ui'

function EditableName() {
  const inputRef = useRef<InputRef>(null)

  const selectAll = async () => {
    const input = inputRef.current
    if (!input) return

    try {
      await input.focus()
      const { value } = await input.getValue()
      await input.setSelectionRange(0, value.length)
    } catch (error) {
      console.error('Could not select the input text', error)
    }
  }

  return (
    <view>
      <Input
        ref={inputRef}
        defaultValue='Alex'
        style={{ width: '100%', height: '44px' }}
      />
      <view bindtap={selectAll}>
        <text>Select all</text>
      </view>
    </view>
  )
}
```

- `getValue()` resolves to `{ value, selectionStart, selectionEnd }` in the
  public type. The wrapper does not type the native `isComposing` result here;
  consume composition state through `onInput`.
- Selection offsets can be `-1` while unfocused. Focus before restoring a
  selection and keep `0 <= start <= end <= value.length`. Native offsets are
  not counts of visible glyphs; do not split emoji or composed characters when
  calculating a partial range.
- `setSelectionRange(position, position)` moves the caret. `setValue` accepts
  only a string; native `{ value, cursor }` parameters are not its public
  signature. Await value updates before applying a dependent selection, and
  read back the text if native filtering may have changed its length.
- Use `blur()` to explicitly release focus. `showSoftInputOnFocus={false}`
  suppresses the soft keyboard; it does not make the field read-only.

### Keyboard-Aware Forms

**Android prerequisite:** When using keyboard avoidance, the hosting Activity
must set `soft_input_mode` to `nothing`. This corresponds to
`android:windowSoftInputMode="adjustNothing"` in the Activity manifest or
`WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING` in native window
configuration. System resize or pan behavior can otherwise interfere with
keyboard avoidance. Configure this in the Android host; it is not an Input,
TextArea, or KeyboardAwareRoot prop.

```tsx
import {
  Input,
  KeyboardAwareResponder,
  KeyboardAwareRoot,
  KeyboardAwareTrigger,
  TextArea,
} from '@lynx-js/lynx-ui'

function KeyboardAwareForm() {
  return (
    <KeyboardAwareRoot>
      <KeyboardAwareResponder
        as='ScrollView'
        scrollviewId='profile-fields'
        style={{ width: '100%', height: '100%' }}
      >
        <KeyboardAwareTrigger>
          <Input
            placeholder='Name'
            style={{ width: '100%', height: '44px' }}
          />
        </KeyboardAwareTrigger>
        <KeyboardAwareTrigger>
          <TextArea
            placeholder='About you'
            maxLength={600}
            style={{ width: '100%', height: '120px' }}
          />
        </KeyboardAwareTrigger>
      </KeyboardAwareResponder>
    </KeyboardAwareRoot>
  )
}
```

- Place all three primitives under the same root. Wrap each field, or the field
  plus the controls that must remain visible, in a trigger. Avoid one large
  trigger around an entire form: its bottom edge becomes the avoidance target.
- Use one responder per root; the root stores one responder ref. The root is a
  context provider, so apply dimensions and theme classes to actual views.
- `as='View'` is the default and translates the responder. The root writes its
  `transform` and `transition`; put independent animations on a nested view.
  `forceAttach` applies to this translation path, aligning the trigger to the
  keyboard even when it would otherwise remain unobscured.
- `as='ScrollView'` creates a vertical ScrollView, adds a keyboard spacer, and
  scrolls the focused trigger into view. Give its parent a bounded height and
  supply a unique `scrollviewId` when multiple scroll views exist.
- `offset` is a signed adjustment in Lynx px: use a negative value to leave
  extra space above the keyboard. It is not a positive gap size.
- On Android, supply the host's actual `androidStatusBarPlusBottomBarHeight`
  in Lynx px. For an immersive status bar, include only the bottom navigation
  bar. Do not copy a demo device's constant into production.
- Avoidance depends on the host's global `keyboardstatuschanged` event. The
  wrappers set `ignore-focus`, but do not expose native avoidance options;
  check host keyboard configuration if nothing moves or movement is duplicated.

## 4. FAQ

**Q: Why does `onInput` code using `event.target.value` fail?**

A: The first argument is already a string. Use `onInput={setValue}` or
`onInput={(value, start, end, isComposing) => { /* ... */ }}`.

**Q: Does `isComposing === false` guarantee composition has finished everywhere?**

A: No. The inspected Android and iOS implementations inspect native composing
text, but Harmony's `UIBaseInput::SendInputEvent` reports `false` unconditionally.
The public callback also marks this argument optional. Preserve raw text and
verify composition-sensitive behavior on the deployed runtime; do not treat
this flag as a universal commit signal.

**Q: Does `confirmType='next'` move focus, or does `'send'` guarantee submission?**

A: It configures the native confirmation key. Handle submission in `onConfirm`
and explicitly focus the next field through its ref when required. Native
confirmation, newline insertion, and blur behavior vary by platform, especially
for TextArea; `confirm-enter` is not exposed by the wrapper. Use a separate
submit control when a multiline editor needs an unambiguous submit action.

**Q: Where are the clear button, error state, and `ui-focused` styles?**

A: Input and TextArea expose neither children/render props nor typed `ui-*`
variants in the current implementation. Compose controls and messages around
the field, track focus with `onFocus` / `onBlur`, and style consumer-owned views.
Do not assume the slot or state-variant APIs from InputOTP apply to these
components.

## 5. Sub Components

- **`Input`**: Single-line native editor; exposes `InputRef`.
- **`TextArea`**: Multiline native editor with line and bounce options;
  `TextAreaRef` has the same methods as `InputRef`.
- **`KeyboardAwareRoot`**: Owns keyboard height, focused trigger, and responder
  coordination without rendering a layout node.
- **`KeyboardAwareTrigger`**: Measures the region to keep visible and receives
  descendant Input/TextArea focus and blur notifications through context.
- **`KeyboardAwareResponder`**: Moves a view or manages a vertical scroll region
  in response to the focused trigger and keyboard height.
