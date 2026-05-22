# 小程序上线部署方案

## 推荐方案

当前项目推荐使用以下架构上线：

```text
微信小程序前端
  ↓ HTTPS
微信云托管 Java Spring Boot 后端
  ↓
腾讯云 MySQL 数据库
```

这个方案对当前代码改动最少。你已经有 Java Spring Boot 后端、MySQL JPA 实体、小程序前端接口封装和 Dockerfile。

## 一、数据库部署

### 1. 创建 MySQL

推荐使用腾讯云数据库 MySQL，也可以使用云服务器自建 MySQL。

需要创建数据库：

```sql
CREATE DATABASE invoicetool DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 表结构

当前后端配置：

```properties
spring.jpa.hibernate.ddl-auto=update
```

所以后端首次连接 MySQL 后会自动创建/更新表。

会自动生成的核心表：

```text
xcx_user
invoice
invoice_header
user_session
```

### 3. 数据库环境变量

部署 Java 后端时配置：

```text
DB_URL=jdbc:mysql://你的MySQL地址:3306/invoicetool?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
DB_USERNAME=你的数据库用户名
DB_PASSWORD=你的数据库密码
```

## 二、后端部署

### 1. 部署方式

使用微信云开发控制台里的“云托管”部署 Java 后端。

不要用“云函数”部署 Java Spring Boot。

### 2. 构建配置

项目根目录已有：

```text
Dockerfile
.dockerignore
```

云托管构建时选择项目根目录：

```text
/Users/allan/mini-program-java
```

容器端口：

```text
8080
```

### 3. 后端环境变量

云托管服务需要配置：

```text
DB_URL=jdbc:mysql://你的MySQL地址:3306/invoicetool?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
DB_USERNAME=你的数据库用户名
DB_PASSWORD=你的数据库密码
WECHAT_APPID=wxb95ae2df41575bc3
WECHAT_APPSECRET=你的微信小程序AppSecret
UPLOAD_DIR=/tmp/uploads/
```

### 4. 验证后端

部署成功后拿到云托管 HTTPS 域名，例如：

```text
https://xxxx.service.tcloudbase.com
```

浏览器或接口工具访问：

```text
https://xxxx.service.tcloudbase.com/api/user/vaild_sk
```

如果提示缺少参数或返回接口响应，说明服务可访问。

## 三、前端部署

### 1. 修改接口地址

当前文件：

```text
invoiceTool_miniProgram/utils/util.js
```

上线前把：

```js
var baseURL = 'http://localhost:8080/';
```

改成云托管 HTTPS 地址：

```js
var baseURL = 'https://你的云托管域名/';
```

必须以 `/` 结尾。

### 2. 微信开发者工具上传

打开微信开发者工具，导入项目：

```text
invoiceTool_miniProgram
```

确认 AppID：

```text
wxb95ae2df41575bc3
```

然后点击：

```text
上传
```

上传后到微信公众平台提交审核。

## 四、微信公众平台配置

进入：

```text
微信公众平台 → 开发管理 → 开发设置 → 服务器域名
```

配置以下域名，域名必须是 HTTPS：

```text
request合法域名：https://你的云托管域名
uploadFile合法域名：https://你的云托管域名
downloadFile合法域名：https://你的云托管域名
```

如果使用云托管自动分配域名，也要把它填进去。

## 五、云开发数据库说明

你当前 Java 后端使用 MySQL/JPA，不直接使用微信云开发数据库。

所以云开发数据库里的集合不是必须的。

如果走当前推荐方案，真实数据会保存到 MySQL，而不是云开发数据库。

如果你以后想完全使用云开发数据库，需要把 Java 后端逻辑迁移成云函数或改造成调用云开发 OpenAPI。

## 六、上线前检查清单

- 后端云托管部署成功。
- MySQL 可以被后端访问。
- `DB_URL`、`DB_USERNAME`、`DB_PASSWORD` 已配置。
- `WECHAT_APPID`、`WECHAT_APPSECRET` 已配置。
- 小程序 `baseURL` 已改成云托管 HTTPS 域名。
- 微信公众平台已配置合法域名。
- 登录功能可用。
- 上传 PDF 功能可用。
- 发票列表可展示真实数据。
- 发票抬头新增、编辑、删除可用。
- 没有使用 `localhost`。
- 没有在前端保存 `AppSecret`。

## 七、当前推荐执行顺序

1. 购买/创建 MySQL。
2. 创建 `invoicetool` 数据库。
3. 在微信云托管创建 Java 服务。
4. 用项目根目录 Dockerfile 部署后端。
5. 配置云托管环境变量。
6. 获取云托管 HTTPS 域名。
7. 修改小程序 `utils/util.js` 的 `baseURL`。
8. 在微信公众平台配置合法域名。
9. 微信开发者工具预览测试。
10. 上传代码并提交审核。
