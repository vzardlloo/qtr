# qtr (Ink)

```text
   ____  __      ____
  / __ \/ /_  __/ __ \
 / / / / / / / / /_/ /
/ /_/ / / /_/ / _, _/
\___\_\/_\__,_/_/ |_|
```

一个基于 **Node.js + React + Ink** 的交互式翻译 CLI。核心目标是：**输入即翻译**、界面美观、引擎可扩展、配置可持久化。

## 安装

> 需要 Node.js >= 20。

本仓库未发布到 npm 时，你可以用本地方式体验：

```bash
cd qtr
npm i
npm run build
npm link
qtr
```

## 配置

首次运行会自动创建配置文件：

- `~/.qtr-config.json`（兼容旧文件 `~/.translator-config.json`）

你也可以手动初始化：

```bash
qtr config:init
```

也可以用交互式向导设置各引擎的 `appKey/appSecret` 等凭证：

```bash
qtr config:setup

# 向导内会展示各引擎申请地址，也可按 o 尝试打开浏览器
```

配置文件示例：

```json
{
  "currentEngine": "baidu",
  "engines": {
    "baidu": {
      "appId": "YOUR_APP_ID",
      "appSecret": "YOUR_APP_SECRET"
    },
    "youdao": {
      "appKey": "YOUR_APP_KEY",
      "appSecret": "YOUR_APP_SECRET"
    },
    "tencent": {
      "secretId": "YOUR_SECRET_ID",
      "secretKey": "YOUR_SECRET_KEY",
      "region": "ap-guangzhou"
    }
  }
}
```

### API Key 申请方式

- 百度翻译开放平台：<https://fanyi-api.baidu.com/>（创建应用后获取 `appid` 与密钥）
- 有道智云 AI 开放平台：<https://ai.youdao.com/>（创建应用后获取 `appKey` 与 `appSecret`）
- 腾讯云机器翻译（TMT）：<https://cloud.tencent.com/product/tmt>（开通服务后在控制台获取 `SecretId/SecretKey`）

## 使用

### 交互模式（推荐）

```bash
qtr
```

默认：中文 -> 英文（from=zh, to=en）。

可选参数：

```bash
qtr --engine baidu --from zh --to en
```

交互快捷键：

> 如果检测到你尚未配置任何引擎，直接运行 `qtr` 会自动进入 `config:setup` 向导。

- `Tab`：打开/关闭引擎选择面板（↑/↓ 选择，Enter 确认；也可直接输入首字母快速定位；若选择未配置引擎，会自动进入 `config:setup`）
- `Ctrl+S`：将当前引擎写入配置文件（下次默认使用）
- `Ctrl+L`：清空输入
- `Ctrl+F`：选择源语言（打开/关闭语言选择面板）
- `Ctrl+T`：选择目标语言（打开/关闭语言选择面板）
- `Esc` / `Ctrl+C`：退出

### 非交互模式（一次性翻译）

```bash
qtr translate "hello" --from en --to zh
```

### 配置命令

设置默认引擎：

```bash
qtr config:engine youdao
```

查看支持的引擎：

```bash
qtr engines
```

## 设计说明

- `src/engines/types.ts`：定义引擎抽象接口，便于后续新增更多引擎。
- `src/config/config.ts`：统一管理配置文件的读取/写入/初始化。
- `src/ui/*`：Ink 交互界面组件。

## 常见问题

1) 如果提示“engine not configured”，请检查 `~/.qtr-config.json`（或旧文件 `~/.translator-config.json`）中对应引擎的 key 是否填写。

2) 频繁输入会触发多次翻译请求？

已做了 250ms 的 debounce，并使用 `AbortController` 中断旧请求，避免结果乱序。
