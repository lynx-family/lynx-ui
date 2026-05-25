# @lynx-js/skill-lynx-ui

`@lynx-js/skill-lynx-ui` 是本仓库中用于整理 lynx-ui 组件参考资料的总入口 Skill 包。

该包的目录结构可以被其他平台直接复制到实际的 skills 目录中使用。

## 发布内容

```text
packages/skill-lynx-ui
├── SKILL.md
├── reference.md
├── examples.md
├── evals/
│   └── evals.json
└── references
    ├── foundation.md
    ├── components.md
    ├── theming-and-tokens.md
    ├── motion.md
    ├── screen-recipes.md
    ├── index.md
    └── components/<component>/
        ├── guide.md
        ├── api.md
        └── examples.md
```

该包同时包含手写的 Lynx UI 总体参考资料，以及按组件生成的细粒度参考资料。

## 维护

生成产物已加入 git ignore。需要时可在本地重新生成：

```bash
pnpm --filter @lynx-js/skill-lynx-ui generate:references
```

校验生成结果结构：

```bash
pnpm --filter @lynx-js/skill-lynx-ui check:references
```
