const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// 提供静态文件
app.use(express.static(path.join(__dirname)));

// 根路径返回 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`游戏服务器已启动: http://localhost:${PORT}`);
    console.log('在浏览器中打开上述地址即可开始游戏');
});
