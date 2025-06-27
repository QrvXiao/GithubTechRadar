const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();

// 中间件
app.use(cors());
app.use(express.json()); // 解析 JSON 请求体

// 连接 MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// 挂载API路由
app.use('/api', apiRoutes);

// 基础测试路由
app.get('/', (req, res) => {
  res.send('Tech Radar API Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
