---
name: lynx-ui-form
description: Compose Lynx forms that collect Input, TextArea, RadioGroup, Checkbox, and Switch values and submit a single values object.
---

# lynx-ui Form SKILL

Use `Form` to centralize values from supported lynx-ui controls without manually wiring each field into a separate state object. Import from `@lynx-js/lynx-ui` in OSS applications.

## Core Capabilities

- `FormRoot` owns a `Record<string, unknown>` keyed by field names.
- `FormField` adapts `Input`, `TextArea`, `RadioGroupRoot`, `Checkbox`, and `Switch` to the form context.
- `onChanged` receives the complete values object after a registered field changes.
- `FormSubmitButton` submits the current snapshot through the root and/or button callback.
- Fields unregister their value when they unmount.

## AI Coding Guide

### Minimal Usable Example

```tsx
import {
  CheckboxIndicator,
  FormField,
  FormRoot,
  FormSubmitButton,
} from '@lynx-js/lynx-ui'

function ProfileForm() {
  return (
    <FormRoot
      initialValues={{ displayName: '', notifications: true }}
      onSubmit={values => saveProfile(values)}
    >
      <FormField as='Input' name='displayName' className='profile-form__input' />
      <FormField as='Checkbox' name='notifications' className='profile-form__check'>
        <CheckboxIndicator><text>✓</text></CheckboxIndicator>
        <text>Enable notifications</text>
      </FormField>
      <FormSubmitButton className='profile-form__submit'>
        <text>Save</text>
      </FormSubmitButton>
    </FormRoot>
  )
}
```

### Recommended Prompt Formula

> Field names and control types + initial values + change observation + validation strategy + submit behavior.

## Use Cases & Best Practices

- Give every `FormField` a unique, stable `name`; that string is the key in submitted values.
- Put defaults in `FormRoot.initialValues`. It initializes the form once; changing the prop later is not a reset API.
- Let `FormField` own the adapted control's value wiring. Do not pass the omitted value/default/change props that conflict with form ownership.
- `Form` collects values but does not provide schema validation or error rendering. Validate in business logic and render errors explicitly.
- Choose either `FormRoot.onSubmit` for form-level submission or `FormSubmitButton.onSubmit` for button-local follow-up. If both are supplied, both callbacks run.

```tsx
<FormField as='RadioGroupRoot' name='plan'>
  <Radio value='free'><text>Free</text></Radio>
  <Radio value='pro'><text>Pro</text></Radio>
</FormField>
<FormField as='TextArea' name='notes' />
<FormField as='Switch' name='autoRenew'><SwitchThumb /></FormField>
```

Reference example: `apps/examples/Form/Basic`.

## FAQ

### Why did a conditional field disappear from the submitted object?

Unmounting a `FormField` unregisters its name and removes that value. Keep the field mounted if its value must survive conditional visibility, or preserve it in application state.

### Can arbitrary custom controls be passed through `as`?

No. `FormField` supports only `Input`, `TextArea`, `RadioGroupRoot`, `Checkbox`, and `Switch`. Wire other controls to application state separately.

### How do I reset the form?

There is no imperative reset API. Remount `FormRoot` with a new key or manage the resettable values outside the component.

## Sub components

- `FormRoot`: Owns the value map and form-level callbacks.
- `FormField`: Connects a supported control under a field name.
- `FormSubmitButton`: A lynx-ui Button that submits the current values.
- `FormContext`: Context export for advanced integrations.
