# Pinche 开发文档（本地开发）

本指南面向在本机进行开发与调试的场景，涵盖后端 `pinche_java`（Spring Boot）、小程序前端 `pinche_xcx`、以及可选的历史 PHP 站点 `pinche_xcx_data` 的使用说明。

## 项目概述
- 后端：`pinche_java` 使用 Spring Boot 2.7 + Spring Data JPA，默认连接本地 MySQL，提供 `REST API` 服务。
- 前端：`pinche_xcx` 为微信小程序代码，可在微信开发者工具中打开并联调后端接口。
- 数据：建议在 MySQL 中创建数据库 `pinche` 并导入初始表结构与数据。

## 目录结构
- `pinche_java/`：后端 Java 项目（Maven Wrapper 已配置）。
- `pinche_xcx/`：微信小程序前端工程。
- `pinche_xcx_data/`：历史 PHP 项目与 SQL（可用于导入初始数据）。

## 开发环境准备
- Java：推荐 `JDK 17`（本项目已在 17 下运行），Spring Boot 2.7 也兼容 Java 8+。
- 数据库：`MySQL 8.x`（或 5.7），监听 `3306`，使用 `utf8mb4` 字符集。
- 工具：微信开发者工具（用于运行小程序）；VS Code / IntelliJ IDEA 任选。

## 数据库初始化
1) 创建数据库（如未创建）：
```
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pinche CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
```

2) 导入初始表结构与数据（可选但推荐）：
```
mysql -u root -p pinche < pinche_xcx_data/sql/xcx.sql
```

> 说明：后端的部分查询使用了原始表名，例如 `xcx_info`、`xcx_appointment`、`xcx_msg`、`xcx_user`，导入上述 SQL 文件可一次性建立这些表。

3) 为后端创建专用账号（推荐）：
```
mysql -u root -p -e "CREATE USER 'pinche_app'@'localhost' IDENTIFIED BY 'your_strong_password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON pinche.* TO 'pinche_app'@'localhost'; FLUSH PRIVILEGES;"
```

## 后端启动（pinche_java）

配置文件位置：`pinche_java/src/main/resources/application.properties`

- 默认使用本地 MySQL：
```
spring.datasource.url=jdbc:mysql://localhost:3306/pinche?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=你的密码
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
```

- 启动命令（项目根目录下或进入 `pinche_java/`）：
```
cd pinche_java
./mvnw spring-boot:run
```

- 使用 H2 内存库的开发配置（无需 MySQL）：
```
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```
H2 控制台地址：`http://localhost:8080/h2-console`，JDBC URL：`jdbc:h2:mem:pinche`

启动成功后：
- 服务地址：`http://localhost:8080/`
- 已添加根路径欢迎页（静态 `index.html`），便于快速跳转到常用接口。

## 前端启动（pinche_xcx）
1) 打开微信开发者工具，选择“导入项目”，目录指向 `pinche_xcx/`。
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
- `GET /api/appointment/getPassenger?sk=mock_sk_xxx`：乘客信息。
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
  - 确认用户名/密码正确、数据库 `pinche` 已创建且有权限。
- 表不存在或字段不匹配：
  - 先导入 `pinche_xcx_data/sql/xcx.sql`，确保存在 `xcx_*` 系列表。
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

## 部署准备（简要）
- 数据库：导入正式数据与只读/最小权限账号。
- 配置：使用外部化配置（环境变量、配置中心或密钥管理）。
- 构建：
```
cd pinche_java
./mvnw clean package
```
- 运行：将打包后的 `jar` 部署到服务器，使用 `java -jar` 启动并配置 `--spring.profiles.active`。

---
需要进一步的接口文档（参数说明、响应模型）或自动化测试样例，我可以继续完善并同步到此文档。