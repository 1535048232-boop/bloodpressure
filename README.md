# 血压记录APP

面向老年人的血压记录应用程序，支持每日记录多个血压测量值以及用药情况。界面简洁易用，专为老年用户设计。

## 🚀 快速启动

### 一键启动（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd bloodpressure

# 运行启动脚本
./start.sh
```

### Docker 启动

```bash
docker-compose up -d
```

启动后访问：
- 前端应用：http://localhost:3000
- 后端API：http://localhost:3001
- 健康检查：http://localhost:3001/api/health

## 项目结构

```
bloodpressure/
├── backend/              # Node.js + Express 后端API
│   ├── src/
│   │   ├── config/       # 数据库配置
│   │   ├── routes/       # API路由
│   │   ├── middleware/   # 中间件
│   │   └── index.js      # 主服务器
│   ├── data/             # SQLite数据库
│   └── Dockerfile        # Docker配置
├── frontend/             # React + TypeScript 前端应用
│   ├── src/
│   │   ├── components/   # React组件
│   │   ├── services/     # API服务
│   │   └── types/        # 类型定义
│   ├── public/           # 静态资源
│   └── Dockerfile        # Docker配置
├── docs/                 # 项目文档
│   ├── DEPLOYMENT.md     # 部署指南
│   └── USER_GUIDE.md     # 用户手册
├── docker-compose.yml    # 容器编排
├── start.sh              # 启动脚本
└── README.md             # 项目说明
```

## 功能特性

- 📊 血压记录：收缩压、舒张压、心率记录
- 💊 用药管理：药物信息和服药时间记录
- 📈 数据统计：血压趋势图表和统计报告
- 🏥 健康建议：基于血压值的健康提示
- 📱 移动端支持：PWA和原生APP
- 💾 离线使用：支持离线数据存储
- 👴 老年人友好：大字体、简洁界面

## 技术栈

### 后端
- Node.js + Express
- SQLite数据库
- JWT认证

### 前端
- React + TypeScript
- Ant Design UI组件库
- Chart.js图表库
- PWA功能

### 移动端
- Progressive Web App (PWA)
- Capacitor原生APP打包

## 开发进度

### ✅ 项目完成度：100% 🎉

所有核心功能已开发完成并通过测试，可立即部署使用！

### ✅ Phase 1: 基础架构搭建（已完成 2026-04-20）

- [x] 项目目录结构规划
- [x] 后端API框架（Node.js + Express + SQLite）
- [x] 数据库设计（用户、血压记录、药物、用药记录表）
- [x] 前端项目（React + TypeScript + Ant Design）
- [x] 用户认证系统（注册/登录/权限控制）
- [x] 路由系统和基础页面架构
- [x] API安全措施（JWT、CORS、限流、密码加密）
- [x] Docker容器化部署配置
- [x] 完整的项目文档

### ✅ Phase 2: 核心功能开发（已完成）

- [x] 血压记录完整CRUD功能（增删改查）
- [x] 用药管理完整功能
- [x] 数据统计和图表展示（Recharts）
- [x] 老年人友好的UI优化（大字体、清晰界面）

### ✅ Phase 3: 高级功能实现（已完成）

- [x] PWA功能（离线支持、可安装）
- [x] Service Worker（缓存、离线数据）
- [x] 数据可视化图表（趋势图、统计报告）
- [x] 健康建议系统
- [x] 性能优化（缓存、懒加载）

### ✅ Phase 4: 测试和部署（已完成）

- [x] 端到端功能测试
- [x] API接口测试
- [x] 生产环境构建
- [x] Docker容器化
- [x] 部署脚本和文档

## 📖 文档

- [📚 部署指南](docs/DEPLOYMENT.md) - 详细的安装和部署说明
- [👥 用户手册](docs/USER_GUIDE.md) - 完整的使用说明
- [📋 开发计划](https://github.com/your-org/bloodpressure/issues/1) - 详细的开发计划和进度

## 🔧 本地开发

### 后端开发

```bash
cd backend
npm install
npm run dev  # 开发模式，http://localhost:3001
```

### 前端开发

```bash
cd frontend
npm install
npm start    # 开发模式，http://localhost:3000
```

## 📄 API文档

- **健康检查**: `GET /api/health`
- **用户认证**: `POST /api/auth/login`, `POST /api/auth/register`
- **血压记录**: `GET|POST|PUT|DELETE /api/records`
- **用药管理**: `GET|POST /api/medications`

详细的API文档请查看后端代码中的路由定义。

## License

MIT License