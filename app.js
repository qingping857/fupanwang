// 初始化本地存储
if (!localStorage.getItem('weeklyPlan')) {
    localStorage.setItem('weeklyPlan', JSON.stringify({}));
}
if (!localStorage.getItem('dailyTasks')) {
    localStorage.setItem('dailyTasks', JSON.stringify({}));
}
if (!localStorage.getItem('dailyReviews')) {
    localStorage.setItem('dailyReviews', JSON.stringify({}));
}
if (!localStorage.getItem('longTermPlans')) {
    localStorage.setItem('longTermPlans', JSON.stringify([]));
}

// 页面路由
const routes = {
    home: renderHome,
    weekly: renderWeekly,
    'daily-review': renderDailyReview,
    'long-term': renderLongTerm
};

// 导航事件监听
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.getAttribute('data-page');
        routes[page]();
    });
});

// 默认加载主页
renderHome();

// 渲染主页
function renderHome() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h1>主页</h1>
        <div class="dashboard">
            <div class="gauge" id="gauge1">仪表盘1</div>
            <div class="gauge" id="gauge2">仪表盘2</div>
            <div class="gauge" id="gauge3">仪表盘3</div>
            <div class="gauge" id="gauge4">仪表盘4</div>
        </div>
        <h2>每日待办事项</h2>
        <div id="daily-tasks"></div>
        <h2>长期计划每日任务</h2>
        <div id="long-term-daily-tasks"></div>
    `;

    updateDashboard();
    renderDailyTasks();
    renderLongTermDailyTasks();
}

// 渲染周计划页面
function renderWeekly() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h1>周计划</h1>
        <table id="weekly-plan">
            <tr>
                <th>时间段</th>
                <th>周一</th>
                <th>周二</th>
                <th>周三</th>
                <th>周四</th>
                <th>周五</th>
                <th>周六</th>
                <th>周日</th>
            </tr>
        </table>
        <button onclick="addTimeSlot()">添加时间段</button>
    `;

    renderWeeklyPlan();
}

// 渲染每日复盘页面
function renderDailyReview() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h1>每日复盘</h1>
        <div class="dashboard">
            <div class="gauge" id="gauge1">仪表盘1</div>
            <div class="gauge" id="gauge2">仪表盘2</div>
            <div class="gauge" id="gauge3">仪表盘3</div>
            <div class="gauge" id="gauge4">仪表盘4</div>
        </div>
        <h2>当日效率分: <span id="efficiency-score"></span></h2>
        <textarea id="review-text" placeholder="输入今日复盘内容"></textarea>
        <button onclick="saveDailyReview()">保存复盘</button>
        <button onclick="viewPastReviews()">查看往日复盘</button>
    `;

    updateDashboard();
    updateEfficiencyScore();
}

// 渲染长计划页面
function renderLongTerm() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h1>长计划</h1>
        <div id="long-term-plans"></div>
        <button onclick="addLongTermPlan()">新建长计划</button>
    `;

    renderLongTermPlans();
}

// 更新仪表盘
function updateDashboard() {
    const longTermPlans = JSON.parse(localStorage.getItem('longTermPlans'));
    const today = new Date().toISOString().split('T')[0];

    // 计算A阶段和B阶段的进度
    let aStageProgress = { dateProgress: 0, taskProgress: 0 };
    let bStageProgress = { dateProgress: 0, taskProgress: 0 };

    longTermPlans.forEach(plan => {
        const totalDays = (new Date(plan.endDate) - new Date(plan.startDate)) / (1000 * 60 * 60 * 24);
        const passedDays = (new Date(today) - new Date(plan.startDate)) / (1000 * 60 * 60 * 24);
        const dateProgress = Math.min(100, Math.max(0, (passedDays / totalDays) * 100));

        if (plan.stage === 'A') {
            aStageProgress.dateProgress = Math.max(aStageProgress.dateProgress, dateProgress);
            aStageProgress.taskProgress += plan.completed ? 1 : 0;
        } else if (plan.stage === 'B') {
            bStageProgress.dateProgress = Math.max(bStageProgress.dateProgress, dateProgress);
            bStageProgress.taskProgress += plan.completed ? 1 : 0;
        }
    });

    // 更新仪表盘显示
    document.getElementById('gauge1').textContent = `A阶段日程进度: ${aStageProgress.dateProgress.toFixed(2)}%`;
    document.getElementById('gauge2').textContent = `A阶段任务进度: ${(aStageProgress.taskProgress / longTermPlans.filter(p => p.stage === 'A').length * 100).toFixed(2)}%`;
    document.getElementById('gauge3').textContent = `B阶段日程进度: ${bStageProgress.dateProgress.toFixed(2)}%`;
    document.getElementById('gauge4').textContent = `B阶段任务进度: ${(bStageProgress.taskProgress / longTermPlans.filter(p => p.stage === 'B').length * 100).toFixed(2)}%`;
}

// 渲染每日待办事项
function renderDailyTasks() {
    const dailyTasks = document.getElementById('daily-tasks');
    const tasks = JSON.parse(localStorage.getItem('dailyTasks'));
    const today = new Date().toISOString().split('T')[0];

    if (tasks[today]) {
        dailyTasks.innerHTML = tasks[today].map(task => `
            <div class="todo-item">
                <span>${task.timeSlot}</span>
                <span>${task.task}</span>
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="updateTaskCompletion('${task.id}', this.checked)">
                <input type="number" value="${task.expectedScore}" onchange="updateExpectedScore('${task.id}', this.value)">
                <input type="number" value="${task.selfScore}" onchange="updateSelfScore('${task.id}', this.value)">
            </div>
        `).join('');
    } else {
        dailyTasks.innerHTML = '<p>今日没有待办事项</p>';
    }
}

// 渲染周计划
function renderWeeklyPlan() {
    const weeklyPlan = JSON.parse(localStorage.getItem('weeklyPlan'));
    const table = document.getElementById('weekly-plan');

    for (const timeSlot in weeklyPlan) {
        const row = table.insertRow();
        const cell = row.insertCell();
        cell.textContent = timeSlot;

        for (let i = 0; i < 7; i++) {
            const cell = row.insertCell();
            const input = document.createElement('input');
            input.type = 'text';
            input.value = weeklyPlan[timeSlot][i] || '';
            input.addEventListener('change', (e) => updateWeeklyPlan(timeSlot, i, e.target.value));
            cell.appendChild(input);
        }
    }
}

// 添加时间段
function addTimeSlot() {
    const timeSlot = prompt('请输入新的时间段');
    if (timeSlot) {
        const weeklyPlan = JSON.parse(localStorage.getItem('weeklyPlan'));
        weeklyPlan[timeSlot] = Array(7).fill('');
        localStorage.setItem('weeklyPlan', JSON.stringify(weeklyPlan));
        renderWeekly();
    }
}

// 更新周计划
function updateWeeklyPlan(timeSlot, day, value) {
    const weeklyPlan = JSON.parse(localStorage.getItem('weeklyPlan'));
    weeklyPlan[timeSlot][day] = value;
    localStorage.setItem('weeklyPlan', JSON.stringify(weeklyPlan));
    updateDailyTasks();
}

// 更新每日待办事项
function updateDailyTasks() {
    const weeklyPlan = JSON.parse(localStorage.getItem('weeklyPlan'));
    const dailyTasks = {};

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        dailyTasks[dateString] = [];

        for (const timeSlot in weeklyPlan) {
            if (weeklyPlan[timeSlot][i]) {
                dailyTasks[dateString].push({
                    id: `${dateString}-${timeSlot}`,
                    timeSlot: timeSlot,
                    task: weeklyPlan[timeSlot][i],
                    completed: false,
                    expectedScore: 0,
                    selfScore: 0
                });
            }
        }
    }

    localStorage.setItem('dailyTasks', JSON.stringify(dailyTasks));
    if (document.getElementById('daily-tasks')) {
        renderDailyTasks();
    }
}

// 更新任务完成状态
function updateTaskCompletion(taskId, completed) {
    const dailyTasks = JSON.parse(localStorage.getItem('dailyTasks'));
    const today = new Date().toISOString().split('T')[0];

    dailyTasks[today] = dailyTasks[today].map(task => {
        if (task.id === taskId) {
            task.completed = completed;
        }
        return task;
    });

    localStorage.setItem('dailyTasks', JSON.stringify(dailyTasks));
    updateEfficiencyScore();
}

// 更新预期分数
function updateExpectedScore(taskId, score) {
    const dailyTasks = JSON.parse(localStorage.getItem('dailyTasks'));
    const today = new Date().toISOString().split('T')[0];

    dailyTasks[today] = dailyTasks[today].map(task => {
        if (task.id === taskId) {
            task.expectedScore = parseInt(score);
        }
        return task;
    });

    localStorage.setItem('dailyTasks', JSON.stringify(dailyTasks));
    updateEfficiencyScore();
}

// 更新自我评分
function updateSelfScore(taskId, score) {
    const dailyTasks = JSON.parse(localStorage.getItem('dailyTasks'));
    const today = new Date().toISOString().split('T')[0];

    dailyTasks[today] = dailyTasks[today].map(task => {
        if (task.id === taskId) {
            task.selfScore = parseInt(score);
        }
        return task;
    });

    localStorage.setItem('dailyTasks', JSON.stringify(dailyTasks));
    updateEfficiencyScore();
}

// 更新效率分数
function updateEfficiencyScore() {
    const dailyTasks = JSON.parse(localStorage.getItem('dailyTasks'));
    const today = new Date().toISOString().split('T')[0];

    if (dailyTasks[today]) {
        const totalExpectedScore = dailyTasks[today].reduce((sum, task) => sum + task.expectedScore, 0);
        const totalSelfScore = dailyTasks[today].reduce((sum, task) => sum + task.selfScore, 0);
        const efficiencyScore = totalExpectedScore > 0 ? (totalSelfScore / totalExpectedScore * 100).toFixed(2) : 0;

        const efficiencyScoreElement = document.getElementById('efficiency-score');
        if (efficiencyScoreElement) {
            efficiencyScoreElement.textContent = `${efficiencyScore}%`;
        }
    }
}

// 保存每日复盘
function saveDailyReview() {
    const reviewText = document.getElementById('review-text').value;
    const today = new Date().toISOString().split('T')[0];
    const dailyReviews = JSON.parse(localStorage.getItem('dailyReviews'));

    dailyReviews[today] = reviewText;
    localStorage.setItem('dailyReviews', JSON.stringify(dailyReviews));
    alert('复盘已保存');
}

// 查看往日复盘
function viewPastReviews() {
    const dailyReviews = JSON.parse(localStorage.getItem('dailyReviews'));
    let reviewsHtml = '<h2>往日复盘</h2>';

    for (const date in dailyReviews) {
        reviewsHtml += `
            <div>
                <h3>${date}</h3>
                <p>${dailyReviews[date]}</p>
            </div>
        `;
    }

    document.getElementById('content').innerHTML = reviewsHtml + '<button onclick="renderDailyReview()">返回</button>';
}

// 渲染长期计划
function renderLongTermPlans() {
    const longTermPlans = JSON.parse(localStorage.getItem('longTermPlans'));
    const longTermPlansElement = document.getElementById('long-term-plans');

    longTermPlansElement.innerHTML = longTermPlans.map((plan, index) => `
        <div>
            <h3>计划 ${index + 1}</h3>
            <p>项目阶段: ${plan.stage}</p>
            <p>开始日期: ${plan.startDate}</p>
            <p>结束日期: ${plan.endDate}</p>
            <p>每日任务: ${plan.dailyTask}</p>
        </div>
    `).join('');
}

// 添加长期计划
function addLongTermPlan() {
    const stage = prompt('请输入项目阶段 (A 或 B)');
    if (stage !== 'A' && stage !== 'B') {
        alert('项目阶段必须是 A 或 B');
        return;
    }

    const startDate = prompt('请输入开始日期 (YYYY-MM-DD)');
    const endDate = prompt('请输入结束日期 (YYYY-MM-DD)');
    const dailyTask = prompt('请输入每日任务');

    const longTermPlans = JSON.parse(localStorage.getItem('longTermPlans'));
    longTermPlans.push({ stage, startDate, endDate, dailyTask, completed: false });
    localStorage.setItem('longTermPlans', JSON.stringify(longTermPlans));

    renderLongTermPlans();
    updateDashboard();
    if (document.getElementById('long-term-daily-tasks')) {
        renderLongTermDailyTasks();
    }
}

// 新增渲染长期计划每日任务函数
function renderLongTermDailyTasks() {
    const longTermDailyTasksElement = document.getElementById('long-term-daily-tasks');
    const longTermPlans = JSON.parse(localStorage.getItem('longTermPlans'));
    const today = new Date().toISOString().split('T')[0];

    let tasksHtml = '';
    longTermPlans.forEach((plan, index) => {
        if (today >= plan.startDate && today <= plan.endDate) {
            tasksHtml += `
                <div class="long-term-task">
                    <input type="checkbox" id="long-term-task-${index}" 
                           onchange="updateLongTermTaskCompletion(${index}, this.checked)"
                           ${plan.completed ? 'checked' : ''}>
                    <label for="long-term-task-${index}">${plan.dailyTask}</label>
                </div>
            `;
        }
    });

    longTermDailyTasksElement.innerHTML = tasksHtml || '<p>今日没有长期计划任务</p>';
}

// 新增更新长期任务完成状态函数
function updateLongTermTaskCompletion(index, completed) {
    const longTermPlans = JSON.parse(localStorage.getItem('longTermPlans'));
    longTermPlans[index].completed = completed;
    localStorage.setItem('longTermPlans', JSON.stringify(longTermPlans));
    updateDashboard();
}

// 初始化
updateDailyTasks();

// 修改初始化部分
function initialize() {
    updateDailyTasks();
    if (!localStorage.getItem('longTermPlans')) {
        localStorage.setItem('longTermPlans', JSON.stringify([]));
    }
    renderHome();
}

// 调用初始化函数
initialize();
