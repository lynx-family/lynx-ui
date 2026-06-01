# @lynx-js/skill-lynx-ui

`@lynx-js/skill-lynx-ui` 是本仓库中用于整理 lynx-ui 组件参考资料的总入口 Skill 包。

该包的目录结构可以被其他平台直接复制到实际的 skills 目录中使用。

## 发布内容

```text
packages/skill-lynx-ui
├── SKILL.md
├── evals/
│   └── evals.json
└── references
    ├── foundation.md
    ├── component-overview.md
    ├── theming-and-tokens.md
    ├── motion.md
    ├── component-composition.md
    └── components/<component>/
        ├── guide.md
        ├── api.md
        └── examples.md
```

该包同时包含手写的 lynx-ui 总体参考资料，以及按组件生成的细粒度参考资料。

组件路由元数据集中维护在 `tools/skill-lynx-ui/component-routing.json`。校验命令会要求每个包含 API 文档的组件包都必须提供路由配置，或附带原因并显式排除。
常见的跨组件组合由人工维护在 `tools/skill-lynx-ui/references/component-composition.md`。

## 维护

生成产物已加入 git ignore。需要时可在本地重新生成：

```bash
pnpm --filter @lynx-js/skill-lynx-ui generate:references
```

校验生成结果结构：

```bash
pnpm --filter @lynx-js/skill-lynx-ui check:references
```
