# 在线报表系统

* [demo：www.zuobaobiao.cn/admin](http://www.zuobaobiao.cn/admin)
* [文档：www.zuobaobiao.cn](http://www.zuobaobiao.cn/)
* [源码：https://github.com/963081754/WebReport](https://github.com/963081754/WebReport)

## 3个子系统+共享代码块的简单介绍（3个系统都要运行）：
1、后端（node语言；根目录）

2、前端（vue框架；根目录/web）

3、模拟的“用户/角色接口提供者”（node语言；根目录/useerApi）；实际应用 替换成自己的 用户/角色接口。

4、前后端共享代码块：根目录/customPackages 是前后端共用的JS代码。后端直接引用，前端通过以下方式引用：

npm install ../customPackages

-----------------------------------------------------
## 以下为启动、运行步骤：

### 安装后端（根目录）依赖
npm install
#### 运行
node index

### 进入用户接口提供系统的目录(/userApi),安装依赖
npm install
#### 运行
node index

### 进入前端目录(/web),安装依赖
npm install
#### 运行
npm run serve

-------------------------------------------------------
## 其它：
* 后端数据库链接 暂时只支持mssql
* “用户/角色接口提供者” 的数据库链接写死在文件：根目录/userApi/query.js；建议用自己的 接口，这里只是模拟一下。接口说明请参阅 系统后台：基本设置/查看接口详细说明
