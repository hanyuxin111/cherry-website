// 模拟数据存储
let plantingRecords = JSON.parse(localStorage.getItem('plantingRecords')) || [];
let environmentData = {
    temperature: 22.5,
    humidity: 50,
    light: 1200,
    history: {
        temperature: [],
        humidity: [],
        light: []
    }
};
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let thresholds = {
    tempMin: 15,
    tempMax: 25,
    humiMin: 40,
    humiMax: 60,
    lightMin: 500,
    lightMax: 2000
};

// DOM 元素
let temperatureGauge, humidityGauge, lightGauge;
let temperatureChart, humidityChart, lightChart;

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initPlantingRecords();
    initEnvironment();
    initTasks();
    checkMaturityReminders();
});

// 标签页功能
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有标签的active类
            tabs.forEach(t => t.classList.remove('active'));
            // 移除所有内容的active类
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 为当前点击的标签和对应的内容添加active类
            this.classList.add('active');
            const tabId = this.getAttribute('id');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// 种植记录管理功能
function initPlantingRecords() {
    loadPlantingRecords();
    setupPlantingRecordsEventListeners();
}

function loadPlantingRecords() {
    const plantingRecordsTable = document.getElementById('plantingRecordsTable').getElementsByTagName('tbody')[0];
    plantingRecordsTable.innerHTML = '';
    
    plantingRecords.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.id}</td>
            <td>${record.variety}</td>
            <td>${record.plantingArea}</td>
            <td>${record.expectedHarvestTime}</td>
            <td>${record.plantingDate}</td>
            <td>${record.plotLocation}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${record.id}">编辑</button>
                <button class="action-btn delete-btn" data-id="${record.id}">删除</button>
            </td>
        `;
        plantingRecordsTable.appendChild(row);
    });
}

function setupPlantingRecordsEventListeners() {
    const addPlantingRecordForm = document.getElementById('addPlantingRecordForm');
    const searchInputRecords = document.getElementById('searchInputRecords');
    const searchBtnRecords = document.getElementById('searchBtnRecords');
    const editModal = document.getElementById('editModal');
    const editPlantingRecordForm = document.getElementById('editPlantingRecordForm');
    const closeBtn = document.querySelector('.close');
    
    // 添加种植记录表单提交
    addPlantingRecordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const variety = document.getElementById('variety').value;
        const plantingArea = parseFloat(document.getElementById('plantingArea').value);
        const expectedHarvestTime = document.getElementById('expectedHarvestTime').value;
        const plantingDate = document.getElementById('plantingDate').value;
        const plotLocation = document.getElementById('plotLocation').value;
        
        // 生成新记录
        const newRecord = {
            id: Date.now(),
            variety,
            plantingArea,
            expectedHarvestTime,
            plantingDate,
            plotLocation
        };
        
        // 添加到记录数组
        plantingRecords.push(newRecord);
        savePlantingRecords();
        loadPlantingRecords();
        
        // 重置表单
        addPlantingRecordForm.reset();
    });
    
    // 搜索按钮点击事件
    searchBtnRecords.addEventListener('click', function() {
        performSearchRecords();
    });
    
    // 支持回车键触发搜索
    searchInputRecords.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearchRecords();
        }
    });
    
    function performSearchRecords() {
        const searchTerm = document.getElementById('searchInputRecords').value.toLowerCase();
        filterPlantingRecords(searchTerm);
    }
    
    function filterPlantingRecords(searchTerm) {
        const plantingRecordsTable = document.getElementById('plantingRecordsTable').getElementsByTagName('tbody')[0];
        plantingRecordsTable.innerHTML = '';
        
        plantingRecords.forEach(record => {
            const values = [
                record.variety.toLowerCase(),
                record.plotLocation.toLowerCase()
            ];
            
            if (values.some(value => value.includes(searchTerm))) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record.id}</td>
                    <td>${record.variety}</td>
                    <td>${record.plantingArea}</td>
                    <td>${record.expectedHarvestTime}</td>
                    <td>${record.plantingDate}</td>
                    <td>${record.plotLocation}</td>
                    <td>
                        <button class="action-btn edit-btn" data-id="${record.id}">编辑</button>
                        <button class="action-btn delete-btn" data-id="${record.id}">删除</button>
                    </td>
                `;
                plantingRecordsTable.appendChild(row);
            }
        });
    }
    
    // 关闭模态框
    closeBtn.addEventListener('click', function() {
        editModal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });
    
    // 监听编辑和删除按钮
    document.getElementById('plantingRecordsTable').addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-btn')) {
            const recordId = parseInt(e.target.getAttribute('data-id'));
            openEditPlantingModal(recordId);
        } else if (e.target.classList.contains('delete-btn')) {
            const recordId = parseInt(e.target.getAttribute('data-id'));
            deletePlantingRecord(recordId);
        }
    });
    
    // 编辑表单提交
    editPlantingRecordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const recordId = parseInt(document.getElementById('recordId').value);
        const variety = document.getElementById('editVariety').value;
        const plantingArea = parseFloat(document.getElementById('editPlantingArea').value);
        const expectedHarvestTime = document.getElementById('editExpectedHarvestTime').value;
        const plantingDate = document.getElementById('editPlantingDate').value;
        const plotLocation = document.getElementById('editPlotLocation').value;
        
        // 更新记录
        const recordIndex = plantingRecords.findIndex(record => record.id === recordId);
        if (recordIndex !== -1) {
            plantingRecords[recordIndex] = {
                ...plantingRecords[recordIndex],
                variety,
                plantingArea,
                expectedHarvestTime,
                plantingDate,
                plotLocation
            };
            
            savePlantingRecords();
            loadPlantingRecords();
            editModal.style.display = 'none';
        }
    });
}

function openEditPlantingModal(recordId) {
    const record = plantingRecords.find(r => r.id === recordId);
    if (record) {
        document.getElementById('recordId').value = record.id;
        document.getElementById('editVariety').value = record.variety;
        document.getElementById('editPlantingArea').value = record.plantingArea;
        document.getElementById('editExpectedHarvestTime').value = record.expectedHarvestTime;
        document.getElementById('editPlantingDate').value = record.plantingDate;
        document.getElementById('editPlotLocation').value = record.plotLocation;
        
        document.getElementById('editModal').style.display = 'block';
    }
}

function deletePlantingRecord(recordId) {
    if (confirm('确定要删除这条记录吗？')) {
        plantingRecords = plantingRecords.filter(record => record.id !== recordId);
        savePlantingRecords();
        loadPlantingRecords();
    }
}

function savePlantingRecords() {
    localStorage.setItem('plantingRecords', JSON.stringify(plantingRecords));
}

// 环境数据监测功能
function initEnvironment() {
    initGauges();
    initCharts();
    loadThresholdSettings();
    setupEnvironmentEventListeners();
    startDataUpdate();
}

function initGauges() {
    // 温度仪表盘
    temperatureGauge = new JustGage({
        id: "temperatureGauge",
        value: environmentData.temperature,
        min: 0,
        max: 40,
        title: "°C",
        label: "温度",
        levelColors: ['#00FF00', '#FFFF00', '#FF0000'],
        levels: [thresholds.tempMin, thresholds.tempMax, 40],
        startAngle: 180,
        endAngle: 0,
        width: 100,
        height: 100,
        responsive: true
    });
    
    // 湿度仪表盘
    humidityGauge = new JustGage({
        id: "humidityGauge",
        value: environmentData.humidity,
        min: 0,
        max: 100,
        title: "%",
        label: "湿度",
        levelColors: ['#00FF00', '#FFFF00', '#FF0000'],
        levels: [thresholds.humiMin, thresholds.humiMax, 100],
        startAngle: 180,
        endAngle: 0,
        width: 100,
        height: 100,
        responsive: true
    });
    
    // 光照仪表盘
    lightGauge = new JustGage({
        id: "lightGauge",
        value: environmentData.light,
        min: 0,
        max: 3000,
        title: "lux",
        label: "光照",
        levelColors: ['#00FF00', '#FFFF00', '#FF0000'],
        levels: [thresholds.lightMin, thresholds.lightMax, 3000],
        startAngle: 180,
        endAngle: 0,
        width: 100,
        height: 100,
        responsive: true
    });
}

function initCharts() {
    // 温度图表
    temperatureChart = new Chart(document.getElementById('temperatureChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '温度 (°C)',
                data: environmentData.history.temperature,
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 0,
                    max: 40
                }
            }
        }
    });
    
    // 湿度图表
    humidityChart = new Chart(document.getElementById('humidityChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '湿度 (%)',
                data: environmentData.history.humidity,
                borderColor: 'rgb(54, 162, 235)',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 0,
                    max: 100
                }
            }
        }
    });
    
    // 光照图表
    lightChart = new Chart(document.getElementById('lightChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '光照 (lux)',
                data: environmentData.history.light,
                borderColor: 'rgb(255, 205, 86)',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 0,
                    max: 3000
                }
            }
        }
    });
}

function loadThresholdSettings() {
    document.getElementById('tempMin').value = thresholds.tempMin;
    document.getElementById('tempMax').value = thresholds.tempMax;
    document.getElementById('humiMin').value = thresholds.humiMin;
    document.getElementById('humiMax').value = thresholds.humiMax;
    document.getElementById('lightMin').value = thresholds.lightMin;
    document.getElementById('lightMax').value = thresholds.lightMax;
}

function setupEnvironmentEventListeners() {
    // 阈值设置表单提交
    document.getElementById('thresholdForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        thresholds.tempMin = parseFloat(document.getElementById('tempMin').value);
        thresholds.tempMax = parseFloat(document.getElementById('tempMax').value);
        thresholds.humiMin = parseFloat(document.getElementById('humiMin').value);
        thresholds.humiMax = parseFloat(document.getElementById('humiMax').value);
        thresholds.lightMin = parseFloat(document.getElementById('lightMin').value);
        thresholds.lightMax = parseFloat(document.getElementById('lightMax').value);
        
        // 更新仪表盘颜色
        updateGaugeLevels();
        
        alert('阈值设置已保存');
    });
}

function startDataUpdate() {
    setInterval(updateEnvironmentData, 5000); // 每5秒更新一次数据
}

function updateEnvironmentData() {
    // 在实际项目中，这里应该从后端API获取实时数据
    // 这里使用模拟数据
    environmentData.temperature = 20 + Math.random() * 10;
    environmentData.humidity = 40 + Math.random() * 20;
    environmentData.light = 1000 + Math.random() * 1000;
    
    // 更新仪表盘
    temperatureGauge.refresh(environmentData.temperature);
    humidityGauge.refresh(environmentData.humidity);
    lightGauge.refresh(environmentData.light);
    
    // 检查阈值并提醒
    checkThresholds();
    
    // 更新历史数据和图表
    updateHistoryData();
}

function checkThresholds() {
    let alerts = [];
    
    if (environmentData.temperature < thresholds.tempMin || environmentData.temperature > thresholds.tempMax) {
        alerts.push(`温度 ${environmentData.temperature}°C 超出正常范围 (${thresholds.tempMin}°C - ${thresholds.tempMax}°C)`);
    }
    
    if (environmentData.humidity < thresholds.humiMin || environmentData.humidity > thresholds.humiMax) {
        alerts.push(`湿度 ${environmentData.humidity}% 超出正常范围 (${thresholds.humiMin}% - ${thresholds.humiMax}%)`);
    }
    
    if (environmentData.light < thresholds.lightMin || environmentData.light > thresholds.lightMax) {
        alerts.push(`光照 ${environmentData.light}lux 超出正常范围 (${thresholds.lightMin}lux - ${thresholds.lightMax}lux)`);
    }
    
    if (alerts.length > 0) {
        alert('环境数据异常:\n' + alerts.join('\n'));
        // 在实际项目中，这里可以添加邮件通知逻辑
    }
}

function updateHistoryData() {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString();
    
    // 更新历史数据
    environmentData.history.temperature.push(environmentData.temperature);
    environmentData.history.humidity.push(environmentData.humidity);
    environmentData.history.light.push(environmentData.light);
    
    // 限制历史数据数量，避免过多数据影响性能
    const maxHistoryPoints = 20;
    if (environmentData.history.temperature.length > maxHistoryPoints) {
        environmentData.history.temperature.shift();
        environmentData.history.humidity.shift();
        environmentData.history.light.shift();
    }
    
    // 更新图表数据
    temperatureChart.data.labels.push(timeLabel);
    temperatureChart.data.datasets[0].data.push(environmentData.temperature);
    temperatureChart.update();
    
    humidityChart.data.labels.push(timeLabel);
    humidityChart.data.datasets[0].data.push(environmentData.humidity);
    humidityChart.update();
    
    lightChart.data.labels.push(timeLabel);
    lightChart.data.datasets[0].data.push(environmentData.light);
    lightChart.update();
    
    // 限制图表显示的数据点数量
    if (temperatureChart.data.labels.length > maxHistoryPoints) {
        temperatureChart.data.labels.shift();
        temperatureChart.data.datasets[0].data.shift();
        temperatureChart.update();
    }
    
    if (humidityChart.data.labels.length > maxHistoryPoints) {
        humidityChart.data.labels.shift();
        humidityChart.data.datasets[0].data.shift();
        humidityChart.update();
    }
    
    if (lightChart.data.labels.length > maxHistoryPoints) {
        lightChart.data.labels.shift();
        lightChart.data.datasets[0].data.shift();
        lightChart.update();
    }
}

function updateGaugeLevels() {
    temperatureGauge.options.levelColors = ['#00FF00', '#FFFF00', '#FF0000'];
    temperatureGauge.options.levels = [thresholds.tempMin, thresholds.tempMax, 40];
    temperatureGauge.refresh(environmentData.temperature);
    
    humidityGauge.options.levelColors = ['#00FF00', '#FFFF00', '#FF0000'];
    humidityGauge.options.levels = [thresholds.humiMin, thresholds.humiMax, 100];
    humidityGauge.refresh(environmentData.humidity);
    
    lightGauge.options.levelColors = ['#00FF00', '#FFFF00', '#FF0000'];
    lightGauge.options.levels = [thresholds.lightMin, thresholds.lightMax, 3000];
    lightGauge.refresh(environmentData.light);
}

// 种植任务调度功能
function initTasks() {
    loadTasks();
    setupTasksEventListeners();
}

function loadTasks() {
    const tasksGrid = document.getElementById('tasksGrid');
    tasksGrid.innerHTML = '';
    
    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${task.name}</h3>
                <span class="task-due-date">${formatDate(task.dueDate)}</span>
            </div>
            <p class="task-description">${task.description}</p>
            <p class="task-assignee">负责人: ${task.assignee}</p>
            <span class="task-status status-${task.status}">${task.status}</span>
            <div class="task-actions">
                ${task.status === '未开始' ? '<button class="action-btn start-btn">开始</button>' : ''}
                ${task.status === '进行中' ? '<button class="action-btn complete-btn">完成</button>' : ''}
                <button class="action-btn delete-btn" data-id="${task.id}">删除</button>
            </div>
        `;
        tasksGrid.appendChild(taskCard);
    });
}

function setupTasksEventListeners() {
    const addTaskForm = document.getElementById('addTaskForm');
    const searchInputTasks = document.getElementById('searchInputTasks');
    const searchBtnTasks = document.getElementById('searchBtnTasks');
    
    // 添加任务表单提交
    addTaskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const taskName = document.getElementById('taskName').value;
        const taskDescription = document.getElementById('taskDescription').value;
        const dueDate = document.getElementById('dueDate').value;
        const assignee = document.getElementById('assignee').value;
        
        // 生成新任务
        const newTask = {
            id: Date.now(),
            name: taskName,
            description: taskDescription,
            dueDate: dueDate,
            assignee: assignee,
            status: '未开始'
        };
        
        // 添加到任务数组
        tasks.push(newTask);
        saveTasks();
        loadTasks();
        
        // 重置表单
        addTaskForm.reset();
    });
    
    // 搜索按钮点击事件
    searchBtnTasks.addEventListener('click', function() {
        performSearchTasks();
    });
    
    // 支持回车键触发搜索
    searchInputTasks.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearchTasks();
        }
    });
    
    function performSearchTasks() {
        const searchTerm = document.getElementById('searchInputTasks').value.toLowerCase();
        filterTasks(searchTerm);
    }
    
    function filterTasks(searchTerm) {
        const tasksGrid = document.getElementById('tasksGrid');
        tasksGrid.innerHTML = '';
        
        tasks.forEach(task => {
            const values = [
                task.name.toLowerCase(),
                task.description.toLowerCase(),
                task.assignee.toLowerCase()
            ];
            
            if (values.some(value => value.includes(searchTerm))) {
                const taskCard = document.createElement('div');
                taskCard.className = 'task-card';
                taskCard.innerHTML = `
                    <div class="task-header">
                        <h3 class="task-title">${task.name}</h3>
                        <span class="task-due-date">${formatDate(task.dueDate)}</span>
                    </div>
                    <p class="task-description">${task.description}</p>
                    <p class="task-assignee">负责人: ${task.assignee}</p>
                    <span class="task-status status-${task.status}">${task.status}</span>
                    <div class="task-actions">
                        ${task.status === '未开始' ? '<button class="action-btn start-btn">开始</button>' : ''}
                        ${task.status === '进行中' ? '<button class="action-btn complete-btn">完成</button>' : ''}
                        <button class="action-btn delete-btn" data-id="${task.id}">删除</button>
                    </div>
                `;
                tasksGrid.appendChild(taskCard);
            }
        });
    }
    
    // 监听任务操作按钮
    document.getElementById('tasksGrid').addEventListener('click', function(e) {
        if (e.target.classList.contains('start-btn')) {
            const taskCard = e.target.closest('.task-card');
            const taskId = parseInt(taskCard.querySelector('.delete-btn').dataset.id);
            updateTaskStatus(taskId, '进行中');
        } else if (e.target.classList.contains('complete-btn')) {
            const taskCard = e.target.closest('.task-card');
            const taskId = parseInt(taskCard.querySelector('.delete-btn').dataset.id);
            updateTaskStatus(taskId, '已完成');
        } else if (e.target.classList.contains('delete-btn')) {
            const taskId = parseInt(e.target.dataset.id);
            deleteTask(taskId);
        }
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function updateTaskStatus(taskId, newStatus) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].status = newStatus;
        saveTasks();
        loadTasks();
    }
}

function deleteTask(taskId) {
    if (confirm('确定要删除这条任务吗？')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        loadTasks();
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// 成熟提醒功能
function checkMaturityReminders() {
    const maturityReminder = document.getElementById('maturityReminder');
    const maturityRecordsDiv = document.getElementById('maturityRecords');
    let hasMaturityReminder = false;
    
    // 清空之前的提醒内容
    maturityRecordsDiv.innerHTML = '';
    
    // 遍历种植记录，检查预计收获时间在5天内的记录
    plantingRecords.forEach(record => {
        const expectedHarvestTime = new Date(record.expectedHarvestTime);
        const currentTime = new Date();
        // 设置预计收获时间的时分秒为0，以便准确计算天数差异
        expectedHarvestTime.setHours(0, 0, 0, 0);
        currentTime.setHours(0, 0, 0, 0);
        const timeDifference = expectedHarvestTime - currentTime;
        const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
        
        // 如果预计收获时间在5天内（包括今天）
        if (daysDifference >= 0 && daysDifference <= 5) {
            hasMaturityReminder = true;
            
            // 创建提醒项
            const recordElement = document.createElement('div');
            recordElement.style.marginBottom = '8px';
            recordElement.innerHTML = `
                <strong>品种: </strong>${record.variety}<br>
                <strong>预计收获时间: </strong>${formatDate(record.expectedHarvestTime)}
            `;
            maturityRecordsDiv.appendChild(recordElement);
        }
    });
    
    // 如果有成熟提醒，显示提醒框
    if (hasMaturityReminder) {
        maturityReminder.style.display = 'block';
    } else {
        maturityReminder.style.display = 'none';
    }
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// 页面加载时检查成熟提醒
document.addEventListener('DOMContentLoaded', function() {
    // 其他初始化代码...
    checkMaturityReminders(); // 检查成熟提醒
});

// 添加新种植记录时，更新成熟提醒
function addPlantingRecord() {
    // 添加记录的代码...
    
    // 添加记录后重新检查成熟提醒
    checkMaturityReminders();
}

// 编辑种植记录时，更新成熟提醒
function updatePlantingRecord(recordId) {
    // 更新记录的代码...
    
    // 更新记录后重新检查成熟提醒
    checkMaturityReminders();
}

// 删除种植记录时，更新成熟提醒
function deletePlantingRecord(recordId) {
    // 删除记录的代码...
    
    // 删除记录后重新检查成熟提醒
    checkMaturityReminders();
}