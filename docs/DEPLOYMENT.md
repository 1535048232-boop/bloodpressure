# 血压记录APP - 安装部署指南

## 系统要求

- Node.js 18+ 
- npm 或 yarn
- Docker (可选，用于容器化部署)

## 本地开发环境搭建

### 1. 克隆项目

```bash
git clone <repository-url>
cd bloodpressure
```

### 2. 安装后端依赖

```bash
cd backend
npm install
```

### 3. 配置后端环境

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑 .env 文件，修改必要的配置项
# 特别是 JWT_SECRET，在生产环境中必须更改
```

### 4. 启动后端服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

后端服务将在 `http://localhost:3001` 启动。

### 5. 安装前端依赖

```bash
cd ../frontend
npm install
```

### 6. 启动前端服务

```bash
npm start
```

前端应用将在 `http://localhost:3000` 启动。

## Docker 部署

### 使用 Docker Compose 一键部署

```bash
# 在项目根目录下执行
docker-compose up -d
```

这将启动：
- 后端API服务 (端口 3001)
- 前端Web应用 (端口 3000)

### 访问应用

部署完成后，访问 `http://localhost:3000` 即可使用应用。

## 生产环境部署注意事项

### 1. 环境变量配置

在生产环境中，请确保正确设置以下环境变量：

**后端环境变量:**
```bash
NODE_ENV=production
JWT_SECRET=your-super-secure-secret-key
FRONTEND_URL=https://your-domain.com
```

**前端环境变量:**
```bash
REACT_APP_API_URL=https://your-api-domain.com/api
```

### 2. 数据库备份

SQLite数据库文件位于 `backend/data/bloodpressure.db`，请定期备份此文件。

### 3. HTTPS配置

生产环境建议使用HTTPS，可以通过反向代理（如Nginx）来实现SSL终止。

### 4. 日志管理

生产环境建议配置适当的日志管理，可以使用Docker的日志驱动或外部日志系统。

## 故障排除

### 常见问题

1. **端口冲突**: 如果端口3000或3001被占用，请修改相应的配置
2. **数据库权限**: 确保应用有权限读写数据库文件目录
3. **网络连接**: 确保前后端服务之间网络连接正常

### 查看日志

```bash
# 查看Docker容器日志
docker-compose logs backend
docker-compose logs frontend

# 查看实时日志
docker-compose logs -f
```

## 开发指南

### 后端API开发

- API文档: 访问 `http://localhost:3001/api/health` 测试API状态
- 数据库迁移: 数据库表会在首次启动时自动创建
- 测试: `npm test` (待实现)

### 前端开发

- 组件结构: `/src/components/`
- 服务层: `/src/services/`
- 类型定义: `/src/types/`
- 构建: `npm run build`

## 技术支持

如遇到问题，请查看日志文件或联系技术支持团队。