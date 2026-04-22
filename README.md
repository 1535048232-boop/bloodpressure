# bloodpressure

血压记录应用（纯前端静态版）。

## 功能

- 血压记录：新增、删除、历史列表
- 用药记录：新增、删除、历史列表
- 最近平均值：收缩压 / 舒张压 / 心率
- 血压状态评估（最优 / 偏高 / 高血压 I 期）
- 趋势图（最近 7 条 / 30 条）
- CSV 导出（血压记录 / 全部数据）
- 本地存储（LocalStorage）

## 本地运行

直接在浏览器打开 `/home/runner/work/bloodpressure/bloodpressure/index.html` 即可。

如需本地服务：

```bash
cd /home/runner/work/bloodpressure/bloodpressure
python3 -m http.server 8000
```

然后访问 `http://localhost:8000`。
