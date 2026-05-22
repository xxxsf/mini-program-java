# 发票管理助手 - 微信小程序

一款微信小程序发票管理工具，支持发票导入、查看、管理和发票抬头维护。

## 项目结构

```
invoiceTool_miniProgram/         # 微信小程序前端工程
├── app.js                       # 应用入口（登录认证、数据管理）
├── app.json                     # 应用配置（页面路由）
├── app.wxss                     # 全局样式
├── project.config.json          # 项目配置
├── sitemap.json                 # 站点地图
└── pages/
    └── invoice/
        ├── index/               # 首页（添加发票、我的发票、发票抬头）
        ├── myInvoices/          # 我的发票列表（搜索、筛选、批量操作）
        ├── upload/              # 本地文件导入
        ├── headerAdd/           # 添加/编辑发票抬头
        ├── detail/              # 发票详情
        └── login/               # 用户登录页
```

## 项目概述
- 后端：`invoiceTool_Java` 使用 Spring Boot 2.7 + Spring Data JPA，默认连接本地 MySQL，提供 `REST API` 服务。
- 前端：`invoiceTool_miniProgram` 为微信小程序代码，可在微信开发者工具中打开并联调后端接口。
- 数据：默认使用历史数据库名 `invoicetool`（为兼容旧表结构，原名 `pinche`），你也可以调整为其他库名并同步修改配置。

## 开发环境

- 微信开发者工具（最新稳定版）
- 在微信公众平台注册小程序并获取 AppID
- Java：推荐 `JDK 17`（本项目已在 17 下运行），Spring Boot 2.7 也兼容 Java 8+。
- 数据库：`MySQL 8.x`（或 5.7），监听 `3306`，使用 `utf8mb4` 字符集。

## 快速开始

1. 打开微信开发者工具
2. 选择「导入项目」，目录指向 `invoiceTool_miniProgram/`
3. 填入你的 AppID（或使用测试号）
4. 编译运行

## 功能说明

- **用户登录**：微信授权登录，获取用户头像和昵称
- **添加发票**：支持从本地文件（PDF）导入发票
- **我的发票**：查看、搜索、筛选（时间/状态/类型）、批量管理发票
- **发票抬头**：添加/编辑/删除发票抬头信息（名称、税号、地址等）
- **发票详情**：查看发票详细信息

## 数据库初始化
1) 创建数据库（如未创建）：
```
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS invoicetool CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
```

2) 导入初始表结构与数据（可选但推荐）：
```
mysql -u root -p invoicetool < pinche_xcx_data/sql/xcx.sql
```

> 说明：后端的部分查询使用了原始表名，例如 `xcx_info`、`xcx_appointment`、`xcx_msg`、`xcx_user`，导入上述 SQL 文件可一次性建立这些表。

3) 为后端创建专用账号（推荐）：
```
mysql -u root -p -e "CREATE USER 'invoicetool_app'@'localhost' IDENTIFIED BY 'your_strong_password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON invoicetool.* TO 'invoicetool_app'@'localhost'; FLUSH PRIVILEGES;"
```

## 后端启动（invoiceTool_Java）

配置文件位置：`invoiceTool_Java/src/main/resources/application.properties`

- 默认使用本地 MySQL：
```
spring.datasource.url=jdbc:mysql://localhost:3306/invoicetool?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=你的密码
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
```

- 启动命令（项目根目录下或进入 `invoiceTool_Java/`）：
```
cd invoiceTool_Java
./mvnw spring-boot:run
```

- 使用 H2 内存库的开发配置（无需 MySQL）：
```
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```
H2 控制台地址：`http://localhost:8080/h2-console`，JDBC URL：`jdbc:h2:mem:invoicetool`

启动成功后：
- 服务地址：`http://localhost:8080/`
- 已添加根路径欢迎页（静态 `index.html`），便于快速跳转到常用接口。

## 前端启动（invoiceTool_miniProgram）
1) 打开微信开发者工具，选择"导入项目"，目录指向 `invoiceTool_miniProgram/`。
2) 确认小程序的请求域名配置允许调用 `http://localhost:8080`（开发阶段可关闭校验或使用本机网络调试）。
3) 如需修改后端地址，可在前端 `utils/` 或相关配置中设置请求基础 URL。

## API 速览（后端）
所有接口前缀为 `/api/*`，示例：
- `GET /api/info/lists?type=1&page=1`：信息列表（分页）。
- `GET /api/dynamic/getList?page=1`：动态列表（携带评论聚合）。
- `GET /api/notice/index?id=1`：公告详情（需已存在的 `id`）。
- `GET /api/msg/get?sk=mock_sk_xxx&type=1&page=1`：消息列表（需要 `sk`）。
- `GET /api/msg/getAll?sk=mock_sk_xxx`：未读消息统计。
- `POST /api/appointment/add`：添加预约（JSON 体为预约实体）。
- `GET /api/appointment/my?sk=mock_sk_xxx`：我的预约。
- `GET /api/appointment/mycount?sk=mock_sk_xxx`：我的预约计数。
- `GET /api/appointment/getPassenger?sk=mock_sk_xxx`：受票人信息。
- `GET /api/appointment/detail?id=1&sk=mock_sk_xxx`：预约详情。
- `POST /api/user/login?code=xxx`：登录（目前为模拟逻辑，生成 `mock_sk_*`）。
- `POST /api/user/vaild_sk?sk=mock_sk_xxx`：校验 `sk`（模拟）。

> 注：部分接口依赖数据库已有数据或有效的 `sk`，可先通过 `user/login` 获得模拟的 `sk`，或导入 `xcx.sql` 以准备数据。

## 本地调试建议
- 推荐使用 Postman / curl 验证接口。例如：
```
curl "http://localhost:8080/api/info/lists?type=1&page=1"
```
- 如出现 404 根路径白页，已通过添加 `static/index.html` 解决，并提供常用接口快捷链接。
- 打印 SQL：已在配置中启用 `spring.jpa.show-sql=true`，便于排查数据库问题。

## 常见问题与排查
- 无法连接 MySQL：
  - 确认 MySQL 服务已启动且端口 `3306` 可用。
  - 检查 `spring.datasource.url` 是否包含 `allowPublicKeyRetrieval=true` 与 `serverTimezone=UTC`。
  - 确认用户名/密码正确、数据库 `invoicetool` 已创建且有权限。
- 表不存在或字段不匹配：
  - 先导入 `pinche_xcx_data/sql/xcx.sql`（历史数据包），确保存在 `xcx_*` 系列表。
  - 检查实体类与 DDL 的字段类型（时间/整型/字符串）是否一致。
- H2 开发模式：
  - 使用 `-Dspring-boot.run.profiles=dev` 可快速启动，无需 MySQL；用于前后端联调和无状态测试。

## 代码规范与约定
- 时间字段统一：使用合适的类型（如 `INTEGER` 秒级时间或 `TIMESTAMP`），并在实体类中提供必要的 getter/setter。
- JPA 使用：尽量通过 Repository 层封装查询，必要时使用 `@Query(nativeQuery=true)` 访问历史表结构。
- 配置分离：
  - 本地：`application.properties` 写入本地数据库密码与连接。
  - 开发（H2）：`application-dev.properties`。
  - 生产：建议使用环境变量或外部配置，避免将敏感信息提交到版本库。

## 上架说明

1. 将 `project.config.json` 中的 `appid` 替换为正式 AppID
2. 当前数据使用本地存储，如需云端存储可对接后端 API
3. 发票 PDF 解析目前为模拟逻辑，上线需对接 OCR 服务

## 部署准备（简要）
- 数据库：导入正式数据与只读/最小权限账号。
- 配置：使用外部化配置（环境变量、配置中心或密钥管理）。
- 构建：
```
cd invoiceTool_Java
./mvnw clean package
```
- 运行：将打包后的 `jar` 部署到服务器，使用 `java -jar` 启动并配置 `--spring.profiles.active`。

---
需要进一步的接口文档（参数说明、响应模型）或自动化测试样例，我可以继续完善并同步到此文档。
