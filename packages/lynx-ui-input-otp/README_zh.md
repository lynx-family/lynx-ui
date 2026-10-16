# @lynx-js/lynx-ui-input-otp

一个适用于 ReactLynx 的无样式、长度可配置的一次性密码（OTP）和 PIN 输入组件。`InputOTP` 通过一个隐藏的原生输入框统一管理键盘、焦点、删除、粘贴、过滤和值状态。使用者可以通过 `InputOTPSlot` 组合可见输入区域。

## 环境要求

- **Lynx SDK**：>= 4.0

## 安装

```bash
pnpm add @lynx-js/lynx-ui
```

也可以单独安装 `@lynx-js/lynx-ui-input-otp`。

## 组件结构

```tsx
<InputOTP length={4}>
  <InputOTPSlot index={0} />
  <InputOTPSlot index={1} />
  <InputOTPSlot index={2} />
  <InputOTPSlot index={3} />
</InputOTP>
```

- `InputOTP` 管理归一化后的受控或非受控值，以及隐藏的原生输入框。
- `InputOTPSlot` 从上下文中读取对应位置的字符，以及聚焦、已填充、已完成、禁用和无效状态。

`InputOTP` 和 `InputOTPSlot` 不附带可见样式。可以使用 `className`、`style`、注入的 `ui-*` 变体和 render props 组合展示效果。

[查看示例](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/InputOTP)
