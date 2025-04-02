const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');

const app = express();
const port = 3001;

// 配置中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// SQL Server 连接配置
const dbConfig = {
    user: 'your_username',
    password: 'your_password',
    server: 'your_server_name', // 例如：localhost
    database: 'PlantingManagement',
    options: {
        encrypt: true // 使用加密连接
    }
};

// 测试数据库连接
sql.connect(dbConfig)
    .then(() => {
        console.log('连接到 SQL Server 成功');
    })
    .catch(err => {
        console.error('连接到 SQL Server 时出错:', err);
    });

// 种植记录 API 路由

// 获取所有种植记录
app.get('/api/planting-records', async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query('SELECT * FROM PlantingRecords');
        res.json(result.recordset);
    } catch (err) {
        console.error('获取种植记录时出错:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取单个种植记录
app.get('/api/planting-records/:id', async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM PlantingRecords WHERE Id = @id');
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: '记录未找到' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('获取单个种植记录时出错:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 添加种植记录
app.post('/api/planting-records', async (req, res) => {
    try {
        const { variety, plantingArea, expectedHarvestTime, plantingDate, plotLocation } = req.body;
        const request = new sql.Request();
        const result = await request
            .input('variety', sql.NVarChar, variety)
            .input('plantingArea', sql.Decimal, plantingArea)
            .input('expectedHarvestTime', sql.Date, expectedHarvestTime)
            .input('plantingDate', sql.Date, plantingDate)
            .input('plotLocation', sql.NVarChar, plotLocation)
            .query(`
                INSERT INTO PlantingRecords (Variety, PlantingArea, ExpectedHarvestTime, PlantingDate, PlotLocation)
                VALUES (@variety, @plantingArea, @expectedHarvestTime, @plantingDate, @plotLocation)
            `);
        
        // 返回新添加的记录
        const newRecord = await request.query('SELECT * FROM PlantingRecords WHERE Id = SCOPE_IDENTITY()');
        res.json(newRecord.recordset[0]);
    } catch (err) {
        console.error('添加种植记录时出错:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新种植记录
app.put('/api/planting-records/:id', async (req, res) => {
    try {
        const { variety, plantingArea, expectedHarvestTime, plantingDate, plotLocation } = req.body;
        const request = new sql.Request();
        await request
            .input('id', sql.Int, req.params.id)
            .input('variety', sql.NVarChar, variety)
            .input('plantingArea', sql.Decimal, plantingArea)
            .input('expectedHarvestTime', sql.Date, expectedHarvestTime)
            .input('plantingDate', sql.Date, plantingDate)
            .input('plotLocation', sql.NVarChar, plotLocation)
            .query(`
                UPDATE PlantingRecords
                SET Variety = @variety, PlantingArea = @plantingArea, ExpectedHarvestTime = @expectedHarvestTime,
                    PlantingDate = @plantingDate, PlotLocation = @plotLocation
                WHERE Id = @id
            `);
        res.json({ message: '种植记录更新成功' });
    } catch (err) {
        console.error('更新种植记录时出错:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除种植记录
app.delete('/api/planting-records/:id', async (req, res) => {
    try {
        const request = new sql.Request();
        await request
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM PlantingRecords WHERE Id = @id');
        res.json({ message: '种植记录删除成功' });
    } catch (err) {
        console.error('删除种植记录时出错:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 环境数据 API 路由

// 获取环境数据阈值
app.get('/api/environment/thresholds', async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query('SELECT * FROM EnvironmentThresholds WHERE Id = 1');
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: '阈值设置未找到' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('获取环境数据阈值时出错:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新环境数据阈值
app.put('/api/environment/thresholds', async (req, res) => {
    try {
        const { tempMin, tempMax, humiMin, humiMax, lightMin, lightMax } = req.body;
        const request = new sql.Request();
        await request
            .input('tempMin', sql.Decimal, tempMin)
            .input('tempMax', sql.Decimal, tempMax)
            .input('humiMin', sql.Decimal, humiMin)
            .input('humiMax', sql.Decimal, humiMax)
            .input('lightMin', sql.Int, lightMin)
            .input('lightMax', sql.Int, lightMax)
            .query(`
                UPDATE EnvironmentThresholds
                SET TempMin = @tempMin, TempMax = @tempMax, HumiMin = @humiMin, HumiMax = @humiMax,
                    LightMin = @lightMin, LightMax = @lightMax
                WHERE Id = 1
            `);
        res.json({ message: '阈值设置已保存' });
    } catch (err) {
        console.error('更新环境数据阈值时出错:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取环境数据
app.get('/api/environment/data', async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query('SELECT TOP 1 * FROM EnvironmentData ORDER BY Timestamp DESC');
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: '没有环境数据' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('获取环境数据时出错:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 种植任务 API 路由

// 获取所有任务
app.get('/api/tasks', async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query('SELECT * FROM Tasks');
        res.json(result.recordset);
    } catch (err) {
        console.error('获取任务时出错:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 添加任务
app.post('/api/tasks', async (req, res) => {
    try {
        const { name, description, dueDate, assignee } = req.body;
        const request = new sql.Request();
        await request
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description)
            .input('dueDate', sql.Date, dueDate)
            .input('assignee', sql.NVarChar, assignee)
            .query(`
                INSERT INTO Tasks (Name, Description, DueDate, Assignee, Status)
                VALUES (@name, @description, @dueDate, @assignee, '未开始')
            `);
        res.json({ message: '任务添加成功' });
    } catch (err) {
        console.error('添加任务时出错:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新任务状态
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const request = new sql.Request();
        await request
            .input('id', sql.Int, req.params.id)
            .input('status', sql.NVarChar, status)
            .query('UPDATE Tasks SET Status = @status WHERE Id = @id');
        res.json({ message: '任务状态更新成功' });
    } catch (err) {
        console.error('更新任务状态时出错:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除任务
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const request = new sql.Request();
        await request
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Tasks WHERE Id = @id');
        res.json({ message: '任务删除成功' });
    } catch (err) {
        console.error('删除任务时出错:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 成熟提醒 API 路由

// 获取成熟提醒
app.get('/api/planting-records/maturity-reminders', async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query(`
            SELECT * FROM PlantingRecords
            WHERE DATEDIFF(day, GETDATE(), ExpectedHarvestTime) BETWEEN 0 AND 5
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('获取成熟提醒时出错:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});
