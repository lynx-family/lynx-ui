# Sortable 90-item performance demo

<!-- cspell:ignore pftrace -->

这个示例用 90 个固定高度、包含多层文本节点的卡片复现长列表拖拽和边缘自动滚动场景。

## 采集方法

使用支持 Lynx trace 的 Android `local_test` 或 iOS Profile 包：

```bash
agent-lynx list-clients
agent-lynx trace start --client <client-id>

# 打开 SortablePerformance90，拖住列表项手柄，在底部边缘保持约 8 秒后松手。

agent-lynx trace end --client <client-id>
agent-lynx trace read-data \
  --client <client-id> \
  --stream <stream-id> \
  --output ./sortable-90.pftrace
agent-lynx trace event-summary ./sortable-90.pftrace --json
agent-lynx trace query ./sortable-90.pftrace \
  --sql-file ./Performance90/trace-evidence.sql
```

示例在 trace 中写入以下事件：

- `Sortable90::mounted`：首屏提交完成。
- `Sortable90::dragGesture`：完整拖拽区间。
- `Sortable90::dragStart`：拖拽开始，带 item 数和 render callback 调用次数。
- `Sortable90::sortCommit`：松手提交，带发生位置变化的 item 数。

重点检查主线程大于 16 ms 的任务、JS 线程大于 30 ms 的任务，以及 `ReactLynx::render`、`ReactLynx::diff`、`ReactLynx::commit` 和 `ReactLynx::patch` 的耗时。

当前 overlay 策略的预期值：初次挂载时 `renderItemCalls=90`，开始拖拽后只为当前项目追加一次渲染，因此本次拖拽提交前应为 `renderItemCallsBeforeCommit=91`。非拖拽态 overlay 数量为 0，拖拽态为 1。
