# 微信云开发数据库导入说明

本目录用于在微信开发者工具的云开发控制台中初始化数据库集合。

## 集合与文件对应关系

请在云开发控制台的“数据库”中分别创建以下集合，然后点击“导入”选择 `import-jsonlines` 目录下对应的 `.json` 文件。

| 集合名称 | 导入文件 | 说明 |
| --- | --- | --- |
| `xcx_user` | `import-jsonlines/xcx_user.json` | 小程序用户信息 |
| `invoice` | `import-jsonlines/invoice.json` | 发票记录 |
| `invoice_header` | `import-jsonlines/invoice_header.json` | 发票抬头 |
| `user_session` | `import-jsonlines/user_session.json` | 后端登录会话 |

## 导入步骤

1. 打开微信开发者工具。
2. 点击顶部“云开发”。
3. 进入“数据库”。
4. 点击左侧“+”创建集合。
5. 集合名称按上表填写，例如 `xcx_user`。
6. 进入集合后点击“导入”。
7. 选择 `cloud-database/import-jsonlines/` 目录下对应的 `.json` 文件。
8. 导入格式选择 `JSON Lines`。
9. 逐个导入四个集合。

## 重要说明

- `import-jsonlines` 目录下的 `.json` 文件虽然后缀是 `.json`，但内容是微信云开发导入器要求的 JSON Lines 格式。
- 当前 JSON Lines 文件是初始化模板，里面只有演示数据。
- 真正用户登录后，会产生真实 `openId`、发票和抬头数据。
- 如果你只是想创建空集合，也可以创建集合后不导入数据；但导入模板可以让字段结构更直观。
- `_id` 是云数据库文档 ID，导入真实数据时必须唯一。
- `createTime`、`updateTime`、`date` 使用毫秒时间戳。

## 后续部署提醒

当前 Java 后端仍使用 MySQL/JPA。如果你要完全使用微信云开发数据库，需要继续改造后端：

- 方案一：小程序前端直接调用云数据库和云函数。
- 方案二：Java 后端部署到云服务器，继续使用 MySQL。
- 方案三：Java 后端改为调用腾讯云数据库/云开发 OpenAPI。

如果目标是快速上线，建议优先采用“Java 后端 + 云服务器 + MySQL”的部署方式；如果想全部放进微信云开发，则需要继续把登录、发票、抬头、上传逻辑迁移为云函数。
