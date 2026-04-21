# 血压记录管理系统 (Blood Pressure Tracker)

一个面向中老年用户的血压和用药记录管理应用，支持 Web 和移动端（PWA/Capacitor）。

## 功能特性

### 血压记录
- 记录每日血压数据（收缩压、舒张压、心率）
- 支持编辑和删除历史记录
- 按日期范围筛选记录
- 自动血压分类（正常/偏高/高血压1级/2级/危象）
- 数据可视化：趋势图、对比图、心率分析

### 用药管理
- 添加、编辑、删除药物信息
- 记录每次服药时间
- 查看服药历史
- 药物启用/停用切换
- 用药依从性统计

### 数据分析
- 仪表盘统计概览
- 血压趋势分析（周/月/季/年）
- 智能健康建议
- 统计报告
- 数据导出（Excel/PDF）

### 用户体验
- 大字体、大按钮的适老化设计
- 移动端响应式布局
- PWA 支持（可安装到桌面）
- iOS/Android 原生打包（Capacitor）
- 用户注册/登录/个人设置

## 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Ant Design 6 |
| 图表 | Recharts |
| 后端 | Express 5 + Node.js |
| 数据库 | SQLite3 |
| 认证 | JWT + bcryptjs |
| 移动端 | Capacitor (iOS/Android) |
| 容器化 | Docker + Docker Compose |

## 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9

### 本地开发

```bash
# 1. 克隆项目
git clone git@code.byted.org:lark/bloodpressure.git
cd bloodpressure

# 2. 启动后端
cd backend
cp .env.example .env
npm install
npm run dev

# 3. 启动前端（新终端）
cd frontend
npm install
npm start
```

前端运行在 `http://localhost:3000`，后端 API 运行在 `http://localhost:3001`。

### Docker 部署

```bash
docker-compose up -d
```

## 项目结构

```
bloodpressure/
├── backend/                 # 后端 Express API
│   ├── src/
│   │   ├── config/         # 数据库配置
│   │   ├── middleware/     # 认证中间件
│   │   ├── routes/         # API 路由
│   │   │   ├── auth.js     # 认证（登录/注册/资料）
│   │   │   ├── records.js  # 血压记录 CRUD
│   │   │   ├── medications.js # 用药管理 CRUD
│   │   │   ├── statistics.js  # 统计接口
│   │   │   └── users.js    # 用户信息
│   │   └── index.js        # 入口文件
│   └── data/               # SQLite 数据库文件
├── frontend/                # 前端 React 应用
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/       # 登录/注册/鉴权
│   │   │   ├── charts/     # 数据图表
│   │   │   ├── common/     # 通用布局
│   │   │   ├── dashboard/  # 仪表盘
│   │   │   ├── export/     # 数据导出
│   │   │   ├── medications/# 用药管理
│   │   │   ├── profile/    # 个人设置
│   │   │   ├── pwa/        # PWA 安装提示
│   │   │   ├── records/    # 血压记录
│   │   │   └── statistics/ # 统计报告
│   │   ├── services/       # API 服务层
│   │   ├── styles/         # 样式文件
│   │   ├── types/          # TypeScript 类型
│   │   └── utils/          # 工具函数
│   ├── android/            # Android 原生工程
│   └── ios/                # iOS 原生工程
├── docs/                    # 文档
├── docker-compose.yml
└── README.md
```

## API 文档

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/profile | 获取个人信息 |
| PUT | /api/auth/profile | 更新个人信息 |

### 血压记录
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/records | 获取血压记录（支持分页、日期筛选） |
| POST | /api/records | 新增血压记录 |
| PUT | /api/records/:id | 更新血压记录 |
| DELETE | /api/records/:id | 删除血压记录 |

### 用药管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/medications | 获取药物列表 |
| POST | /api/medications | 新增药物 |
| PUT | /api/medications/:id | 更新药物信息 |
| DELETE | /api/medications/:id | 删除药物 |
| POST | /api/medications/:id/taken | 记录服药 |
| GET | /api/medications/:id/history | 获取服药历史 |
| GET | /api/medications/intakes/all | 获取所有服药记录 |

### 统计
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/statistics/bp | 血压统计概览 |

## License

MIT
