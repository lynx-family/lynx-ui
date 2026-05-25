# Screen Recipes

Read this file when the task is bigger than a single component: a settings page, confirmation flow, list screen, filter sheet, or another screen that composes multiple Lynx UI primitives.

## Table of contents

- [Why this file exists](#why-this-file-exists)
- [Official sources to anchor against](#official-sources-to-anchor-against)
- [Freshness note](#freshness-note)
- [How to use these recipes](#how-to-use-these-recipes)
- [Recipe: settings screen](#recipe-settings-screen)
- [Recipe: feed with row actions](#recipe-feed-with-row-actions)
- [Recipe: filter sheet over a list](#recipe-filter-sheet-over-a-list)
- [Recipe: anchored help or action menu](#recipe-anchored-help-or-action-menu)
- [Recipe: keyboard-aware form flow](#recipe-keyboard-aware-form-flow)
- [When not to use this file](#when-not-to-use-this-file)

## Why this file exists

The component catalog is good for choosing primitives, but screen-level tasks also need guidance on how to compose those primitives without drifting into generic React wrappers. Use these recipes as composition patterns, then adapt them minimally.

## Official sources to anchor against

- Lynx UI index: `https://lynxjs.org/next/lynx-ui/`
- Lynx UI introduction: `https://lynxjs.org/next/lynx-ui/introduction`
- Component catalog in this skill: [`components.md`](./components.md)

## Freshness note

This file is a local composition guide, not the final authority. If the closest recipe here feels stale or incomplete, fall back to the official Lynx UI docs and the relevant component pages first.

## How to use these recipes

- Pick the closest recipe below.
- Then open the linked component sections in [`components.md`](./components.md).
- Keep the official subcomponent structure for each primitive.
- Change only names, surrounding layout, local data wiring, and app-specific wrappers.
- If the task is really just a single primitive choice, go back to [`components.md`](./components.md) instead of forcing a recipe.
- If the task needs shared visual consistency, pair the recipe with [`theming-and-tokens.md`](./theming-and-tokens.md).
- If the user needs a concrete composed screen, start from the closest recipe here and verify each primitive against `components.md` plus the generated `references/components/<component>/` files before inventing a new layout from scratch.
- If exact repo-local component APIs matter for one of the primitives, verify them in the generated `components/<component>/` references after choosing the recipe.

## Recipe: settings screen

Use when the screen is mostly toggles, radio choices, and small text inputs.

**Recommended primitives**
- `ScrollView` for vertical screen content
- `Switch` for binary settings
- `RadioGroup` for mutually exclusive options
- `Input` for short freeform values
- `Button` for primary actions
- Luna tokens for shared screen surfaces and text

**Composition shape**

```tsx
<ScrollView>
  <view className="screen-section">
    <text className="section-title">Notifications</text>
    <Switch checked={enabled} onChange={setEnabled}>
      <SwitchThumb />
    </Switch>
  </view>

  <view className="screen-section">
    <text className="section-title">Theme</text>
    <RadioGroupRoot value={theme} onValueChange={setTheme}>
      <Radio value="light"><RadioIndicator /></Radio>
      <Radio value="dark"><RadioIndicator /></Radio>
    </RadioGroupRoot>
  </view>

  <view className="screen-section">
    <Input value={signature} onInput={setSignature} />
  </view>

  <Button onClick={saveSettings}>
    {({ active }) => <view className={active ? 'ui-active' : ''}><text>Save</text></view>}
  </Button>
</ScrollView>
```

**Adaptation notes**
- Keep each interactive primitive in its documented shape.
- Use Luna tokens for the shared surface before introducing local one-off colors.
- Reach for `Form` only if the task clearly benefits from form-level collection and submission.

## Recipe: feed with row actions

Use when the screen is a scrollable feed or inbox with secondary actions hidden behind swipe.

**Recommended primitives**
- `FeedList` for refresh/load-more-oriented feeds
- `SwipeAction` for row-level secondary actions
- `Button` inside `actionArea` for explicit actions

**Composition shape**

```tsx
<FeedList
  listId="messages"
  listType="flow"
  refreshOptions={true}
  onScrollToLower={loadMore}
>
  {items.map(item => (
    <list-item key={item.id} item-key={item.id}>
      <SwipeAction
        displayArea={<MessageRow item={item} />}
        actionArea={<Button onClick={() => archive(item.id)}><text>Archive</text></Button>}
      />
    </list-item>
  ))}
</FeedList>
```

**Adaptation notes**
- Keep feed virtualization on `FeedList` instead of replacing it with plain mapped views.
- Put hidden row actions in `actionArea` rather than inventing a separate reveal system.
- If the list is not feed-oriented, start from `List` instead.

## Recipe: filter sheet over a list

Use when the user needs a sliding surface for filters or sort controls above existing content.

**Recommended primitives**
- `Sheet` for the sliding filter surface
- `Checkbox`, `RadioGroup`, or `Switch` inside the sheet
- `List` or `FeedList` for the underlying content

**Composition shape**

```tsx
<>
  <Button onClick={() => setOpen(true)}>
    <text>Filters</text>
  </Button>

  <SheetRoot show={open} onShowChange={setOpen} snapPoints={['fit', '60%']}>
    <SheetView>
      <SheetBackdrop />
      <SheetContent>
        <SheetHandle />
        <Checkbox>
          <CheckboxIndicator />
        </Checkbox>
        <RadioGroupRoot value={sort} onValueChange={setSort}>
          <Radio value="latest"><RadioIndicator /></Radio>
          <Radio value="popular"><RadioIndicator /></Radio>
        </RadioGroupRoot>
      </SheetContent>
    </SheetView>
  </SheetRoot>

  <List>{items.map(renderItem)}</List>
</>
```

**Adaptation notes**
- Use `Sheet` instead of a custom bottom drawer when the surface should slide and snap.
- Keep filter state local unless the surrounding app already owns it.
- Prefer official selection primitives inside the sheet over hand-rolled toggles.

## Recipe: anchored help or action menu

Use when the user needs floating content attached to a trigger instead of a full modal.

**Recommended primitives**
- `Popover` for anchored content
- `Button` or another documented trigger primitive

**Composition shape**

```tsx
<PopoverRoot>
  <PopoverTrigger>
    <Button onClick={() => {}}>
      <text>More</text>
    </Button>
  </PopoverTrigger>
  <PopoverAnchor>
    <PopoverPositioner>
      <PopoverContent>
        <text>Duplicate</text>
        <text>Rename</text>
      </PopoverContent>
      <PopoverArrow />
    </PopoverPositioner>
  </PopoverAnchor>
</PopoverRoot>
```

**Adaptation notes**
- Keep the trigger/anchor/positioner/content layering.
- Use `Dialog` or `Sheet` instead if the surface should own more of the screen.
- Keep placement logic in `Popover` props rather than ad hoc coordinates.

## Recipe: keyboard-aware form flow

Use when the task is a text-entry flow that must move cleanly with the soft keyboard.

**Recommended primitives**
- `KeyboardAwareRoot`, `KeyboardAwareResponder`, and `KeyboardAwareTrigger`
- `Input` or `TextArea`
- `Form` if the task also needs field collection and submission wiring

**Composition shape**

```tsx
<KeyboardAwareRoot>
  <KeyboardAwareResponder>
    <KeyboardAwareTrigger>
      <Input value={title} onInput={setTitle} />
    </KeyboardAwareTrigger>
  </KeyboardAwareResponder>
</KeyboardAwareRoot>
```

**Adaptation notes**
- Keep the keyboard-aware wrapper stack when layout movement matters.
- Do not rewrite this into a generic browser-only keyboard workaround.
- Add `FormRoot` only when the task is truly a multi-field submit flow.

## When not to use this file

If the task is really about a single primitive or a single missing prop choice, go back to [`components.md`](./components.md). If the task is mostly about install, tokens, or motion choice, use the corresponding focused reference file first.
