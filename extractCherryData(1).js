const fs = require('fs');
const path = require('path');

// 指定包含HTML文件的目录
const directoryPath = './html_files'; // 假设HTML文件存储在这个目录下

// 用于存储所有樱桃数据
const allCherryData = [];

// 读取目录中的所有文件
fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.error('读取目录失败:', err);
        return;
    }

    // 过滤出HTML文件
    const htmlFiles = files.filter(file => path.extname(file) === '.html');

    // 并行处理所有HTML文件
    const promises = htmlFiles.map(file => {
        return new Promise((resolve, reject) => {
            fs.readFile(path.join(directoryPath, file), 'utf-8', (err, content) => {
                if (err) {
                    console.error(`读取文件 ${file} 失败:`, err);
                    reject(err);
                    return;
                }

                // 使用正则表达式筛选包含“樱桃”的数据
                const regex = /(\d{4}-\d{2})樱桃: (\d+\.\d+)/g;
                let match;

                while ((match = regex.exec(content)) !== null) {
                    const date = match[1];
                    const price = match[2];

                    console.log(`匹配到樱桃数据: 日期=${date}, 价格=${price}`); // 调试信息

                    allCherryData.push({
                        date,
                        price
                    });
                }

                resolve();
            });
        });
    });

    // 等待所有文件处理完成
    Promise.all(promises)
        .then(() => {
            // 将数据保存到JSON文件
            fs.writeFile('cherry_prices.json', JSON.stringify(allCherryData), (err) => {
                if (err) {
                    console.error('写入JSON文件失败:', err);
                } else {
                    console.log(`成功提取 ${allCherryData.length} 条樱桃数据并保存到 cherry_prices.json`);
                }
            });
        })
        .catch(err => {
            console.error('处理文件时出错:', err);
        });
});