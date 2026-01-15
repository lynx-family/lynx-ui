# Lynx UI Primitives Button SKILL

`Primitives Button` is a member of the `lynx-ui-primitives` atomic library. It provides an unstyled, fully functional button "skeleton", focusing on handling interaction behaviors and accessibility.

## 1. Core Capabilities

Unlike `lynx-ui-button`, which is a high-level component providing complete styling and multiple variants, the goal of `Primitives Button` is to:

- **Provide core button behavior**: Encapsulates `onClick` events, `disabled` state, and the active state during press (`active` state).
- **Complete style freedom**: Comes with no background, border, color, or other styles, allowing developers to build buttons of any appearance from scratch.
- **Expose state via Render Props**: It exposes whether the button is in the "pressed" state (`active`) through the `children` Render Prop pattern, facilitating the implementation of complex press effects.

When you need an interactive element that is visually completely custom but behaviorally conforms to standard button specifications, you should use `Primitives Button`.

## 2. AI Coding Guide

### Minimal Usable Example

The core feature of `Primitives Button` is its Render Prop. You need to provide a function as `children` to receive the `active` state.

```tsx
import { Button } from '@lynx-js/lynx-ui-primitives-button'

function App() {
  const handleClick = () => {
    console.log('Button clicked!')
  }

  return (
    <Button onClick={handleClick}>
      {({ active }) => (
        <view
          style={{
            padding: '10px 20px',
            backgroundColor: active ? '#cccccc' : '#eeeeee',
            border: '1px solid #999999',
            borderRadius: 4,
          }}
        >
          <text>My Custom Button</text>
        </view>
      )}
    </Button>
  )
}
```

### Recommended Prompt Formula

> **Scenario**: I want to use `Primitives Button` to create a custom button.
> **Appearance Requirement**: This button's background color is `[normal_color]` in its normal state, and when the user presses it (`active` state), the background color changes to `[active_color]`.
> **Behavior Requirement**: In the [enabled/disabled] state, the button needs to [perform some action, e.g., "print a log"] when clicked.

**Example Prompt**:

> I want to use `Primitives Button` to create an icon button. It should be a circular button with no background color. When the user presses it, the entire button area's background should become semi-transparent gray (`rgba(0,0,0,0.1)`). When the button is clicked, it should call the `handleIconClick` function. Please provide the implementation code.

## 4. FAQ

**Q: Why doesn’t the button react to the `active` state?**

A: `Primitives Button` uses a Render Prop. Provide a function as `children` so you can receive `{ active }` and style accordingly.

```tsx
// Correct usage
<Button onClick={handleClick}>
  {({ active }) => (
    <view style={{ backgroundColor: active ? '#ccc' : '#eee' }}>
      <text>My Button</text>
    </view>
  )}
</Button>
```

**Q: How do I handle disabled styles?**

A: `disabled` prevents `onClick` from firing but doesn’t auto-style the button. Pass `disabled` into your style logic and apply the visual state manually.

```tsx
<Button disabled={true} onClick={handleClick}>
  {({ active }) => (
    <view style={{ opacity: 0.5 }}>
      <text>Disabled Button</text>
    </view>
  )}
</Button>
```

## 3. Use Cases & Best Practices

### Scenario 1: Building a unique button in a design system

When your design system requires a button with a completely new look and feel that cannot be met by overriding the styles of `lynx-ui-button`.

```tsx
// GradientButton.tsx
const GradientButton = ({ children, onClick }) => (
  <Button onClick={onClick}>
    {({ active }) => (
      <view
        style={{
          background: active
            ? 'linear-gradient(to right, #ff7e5f, #feb47b)'
            : 'linear-gradient(to right, #6a11cb, #2575fc)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 50,
          boxShadow: active ? 'none' : '0 4px 15px rgba(0,0,0,0.2)',
          transition: 'all 0.2s',
        }}
      >
        {children}
      </view>
    )}
  </Button>
)
```

**Practice**: With the `active` state, you can easily implement complex press effects, such as changing gradients, shadows, scaling, etc.

<!-- Removed Key APIs & Props Overview to align with FeedList structure -->

## 5. Sub components

`Primitives Button` is a single component and does not contain sub components.

<!-- Removed the "More Examples" section to align with FeedList structure -->
