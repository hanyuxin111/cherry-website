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
    fetch('/api/planting-records')
        .then(response => response.json())
        .then(data => {
            const plantingRecordsTable = document.getElementById('plantingRecordsTable').getElementsByTagName('tbody')[0];
            plantingRecordsTable.innerHTML = '';
            
            data.forEach(record => {
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
        })
        .catch(error => console.error('加载种植记录时出错:', error));
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
        
        const formData = new FormData(this);
        fetch('/api/planting-records', {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(formData)),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('添加记录失败');
            return response.json();
        })
        .then(data => {
            this.reset();
            loadPlantingRecords();
            checkMaturityReminders();
        })
        .catch(error => console.error('添加记录时出错:', error));
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
        const searchTerm = document.getElementById('searchInputRecords').value;
        fetch(`/api/planting-records/search?query=${encodeURIComponent(searchTerm)}`)
            .then(response => response.json())
            .then(data => {
                const plantingRecordsTable = document.getElementById('plantingRecordsTable').getElementsByTagName('tbody')[0];
                plantingRecordsTable.innerHTML = '';
                
                data.forEach(record => {
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
            })
            .catch(error => console.error('搜索记录时出错:', error));
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
            fetch(`/api/planting-records/${recordId}`)
                .then(response => response.json())
                .then(record => {
                    document.getElementById('recordId').value = record.id;
                    document.getElementById('editVariety').value = record.variety;
                    document.getElementById('editPlantingArea').value = record.plantingArea;
                    document.getElementById('editExpectedHarvestTime').value = record.expectedHarvestTime;
                    document.getElementById('editPlantingDate').value = record.plantingDate;
                    document.getElementById('editPlotLocation').value = record.plotLocation;
                    
                    document.getElementById('editModal').style.display = 'block';
                })
                .catch(error => console.error('加载记录进行编辑时出错:', error));
        } else if (e.target.classList.contains('delete-btn')) {
            const recordId = parseInt(e.target.getAttribute('data-id'));
            if (confirm('确定要删除这条记录吗？')) {
                fetch(`/api/planting-records/${recordId}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (!response.ok) throw new Error('删除记录失败');
                    loadPlantingRecords();
                    checkMaturityReminders();
                })
                .catch(error => console.error('删除记录时出错:', error));
            }
        }
    });
    
    // 编辑表单提交
    editPlantingRecordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const recordId = parseInt(document.getElementById('recordId').value);
        const formData = new FormData(this);
        fetch(`/api/planting-records/${recordId}`, {
            method: 'PUT',
            body: JSON.stringify(Object.fromEntries(formData)),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('更新记录失败');
            return response.json();
        })
        .then(data => {
            editModal.style.display = 'none';
            loadPlantingRecords();
            checkMaturityReminders();
        })
        .catch(error => console.error('更新记录时出错:', error));
    });
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
        value: 22.5,
        min: 0,
        max: 40,
        title: "°C",
        label: "温度",
        levelColors: ['#00FF00', '#FFFF00', '#FF0000'],
        levels: [15, 25, 40],
        startAngle: 180,
        endAngle: 0,
        width: 100,
        height: 100,
        responsive: true
    });
    
    // 湿度仪表盘
    humidityGauge = new JustGage({
        id: "humidityGauge",
        value: 50,
        min: 0,
        max: 100,
        title: "%",
        label: "湿度",
        levelColors: ['#00FF00', '#FFFF00', '#FF0000'],
        levels: [40, 60, 100],
        startAngle: 180,
        endAngle: 0,
        width: 100,
        height: 100,
        responsive: true
    });
    
    // 光照仪表盘
    lightGauge = new JustGage({
        id: "lightGauge",
        value: 1200,
        min: 0,
        max: 3000,
        title: "lux",
        label: "光照",
        levelColors: ['#00FF00', '#FFFF00', '#FF0000'],
        levels: [500, 2000, 3000],
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
                data: [],
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
                data: [],
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
                data: [],
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
    fetch('/api/environment/thresholds')
        .then(response => response.json())
        .then(data => {
            document.getElementById('tempMin').value = data.tempMin;
            document.getElementById('tempMax').value = data.tempMax;
            document.getElementById('humiMin').value = data.humiMin;
            document.getElementById('humiMax').value = data.humiMax;
            document.getElementById('lightMin').value = data.lightMin;
            document.getElementById('lightMax').value = data.lightMax;
            
            updateGaugeLevels();
        })
        .catch(error => console.error('加载阈值设置时出错:', error));
}

function setupEnvironmentEventListeners() {
    // 阈值设置表单提交
    document.getElementById('thresholdForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        fetch('/api/environment/thresholds', {
            method: 'PUT',
            body: JSON.stringify(Object.fromEntries(formData)),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('保存阈值设置失败');
            return response.json();
        })
        .then(data => {
            alert('阈值设置已保存');
            updateGaugeLevels();
        })
        .catch(error => console.error('保存阈值设置时出错:', error));
    });
}

function startDataUpdate() {
    setInterval(updateEnvironmentData, 5000); // 每5秒更新一次数据
}

function updateEnvironmentData() {
    fetch('/api/environment/data')
        .then(response => response.json())
        .then(data => {
            temperatureGauge.refresh(data.temperature);
            humidityGauge.refresh(data.humidity);
            lightGauge.refresh(data.light);
            
            checkThresholds(data);
            updateHistoryData(data);
        })
        .catch(error => console.error('更新环境数据时出错:', error));
}

function checkThresholds(data) {
    fetch('/api/environment/thresholds')
        .then(response => response.json())
        .then(thresholds => {
            let alerts = [];
            
            if (data.temperature < thresholds.tempMin || data.temperature > thresholds.tempMax) {
                alerts.push(`温度 ${data.temperature}°C 超出正常范围 (${thresholds.tempMin}°C - ${thresholds.tempMax}°C)`);
            }
            
            if (data.humidity < thresholds.humiMin || data.humidity > thresholds.humiMax) {
                alerts.push(`湿度 ${data.humidity}% 超出正常范围 (${thresholds.humiMin}% - ${thresholds.humiMax}%)`);
            }
            
            if (data.light < thresholds.lightMin || data.light > thresholds.lightMax) {
                alerts.push(`光照 ${data.light}lux 超出正常范围 (${thresholds.lightMin}lux - ${thresholds.lightMax}lux)`);
            }
            
            if (alerts.length > 0) {
                alert('环境数据异常:\n' + alerts.join('\n'));
            }
        })
        .catch(error => console.error('检查阈值时出错:', error));
}

function updateHistoryData(data) {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString();
    
    // 更新图表数据
    temperatureChart.data.labels.push(timeLabel);
    temperatureChart.data.datasets[0].data.push(data.temperature);
    temperatureChart.update();
    
    humidityChart.data.labels.push(timeLabel);
    humidityChart.data.datasets[0].data.push(data.humidity);
    humidityChart.update();
    
    lightChart.data.labels.push(timeLabel);
    lightChart.data.datasets[0].data.push(data.light);
    lightChart.update();
    
    // 限制图表显示的数据点数量
    const maxHistoryPoints = 20;
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
    fetch('/api/environment/thresholds')
        .then(response => response.json())
        .then(thresholds => {
            temperatureGauge.options.levelColors = ['#00FF00', '#FFFF00', '#FF0000'];
            temperatureGauge.options.levels = [thresholds.tempMin, thresholds.tempMax, 40];
            temperatureGauge.refresh(temperatureGauge.value);
            
            humidityGauge.options.levelColors = ['#00FF00', '#FFFF00', '#FF0000'];
            humidityGauge.options.levels = [thresholds.humiMin, thresholds.humiMax, 100];
            humidityGauge.refresh(humidityGauge.value);
            
            lightGauge.options.levelColors = ['#00FF00', '#FFFF00', '#FF0000'];
            lightGauge.options.levels = [thresholds.lightMin, thresholds.lightMax, 3000];
            lightGauge.refresh(lightGauge.value);
        })
        .catch(error => console.error('更新仪表盘级别时出错:', error));
}

// 种植任务调度功能
function initTasks() {
    loadTasks();
    setupTasksEventListeners();
}

function loadTasks() {
    fetch('/api/tasks')
        .then(response => response.json())
        .then(data => {
            const tasksGrid = document.getElementById('tasksGrid');
            tasksGrid.innerHTML = '';
            
            data.forEach(task => {
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
        })
        .catch(error => console.error('加载任务时出错:', error));
}

function setupTasksEventListeners() {
    const addTaskForm = document.getElementById('addTaskForm');
    const searchInputTasks = document.getElementById('searchInputTasks');
    const searchBtnTasks = document.getElementById('searchBtnTasks');
    
    // 添加任务表单提交
    addTaskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        fetch('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(formData)),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('添加任务失败');
            return response.json();
        })
        .then(data => {
            this.reset();
            loadTasks();
        })
        .catch(error => console.error('添加任务时出错:', error));
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
        const searchTerm = document.getElementById('searchInputTasks').value;
        fetch(`/api/tasks/search?query=${encodeURIComponent(searchTerm)}`)
            .then(response => response.json())
            .then(data => {
                const tasksGrid = document.getElementById('tasksGrid');
                tasksGrid.innerHTML = '';
                
                data.forEach(task => {
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
            })
            .catch(error => console.error('搜索任务时出错:', error));
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
            if (confirm('确定要删除这个任务吗？')) {
                fetch(`/api/tasks/${taskId}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (!response.ok) throw new Error('删除任务失败');
                    loadTasks();
                })
                .catch(error => console.error('删除任务时出错:', error));
            }
        }
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function updateTaskStatus(taskId, newStatus) {
    fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('更新任务状态失败');
        loadTasks();
    })
    .catch(error => console.error('更新任务状态时出错:', error));
}

// 成熟提醒功能
function checkMaturityReminders() {
    fetch('/api/planting-records/maturity-reminders')
        .then(response => response.json())
        .then(data => {
            const maturityReminder = document.getElementById('maturityReminder');
            const maturityRecordsDiv = document.getElementById('maturityRecords');
            let hasMaturityReminder = false;
            
            maturityRecordsDiv.innerHTML = '';
            
            data.forEach(record => {
                hasMaturityReminder = true;
                
                const recordElement = document.createElement('div');
                recordElement.style.marginBottom = '8px';
                recordElement.innerHTML = `
                    <strong>品种: </strong>${record.variety}<br>
                    <strong>预计收获时间: </strong>${formatDate(record.expectedHarvestTime)}
                `;
                maturityRecordsDiv.appendChild(recordElement);
            });
            
            maturityReminder.style.display = hasMaturityReminder ? 'block' : 'none';
        })
        .catch(error => console.error('检查成熟提醒时出错:', error));
}