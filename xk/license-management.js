/**
 * 许可证授权管理页脚本
 * 处理许可证记录查询、删除和分页显示功能
 */

// 分页配置 - 提升至全局作用域
const PAGE_SIZE = 20; // 每页显示20条
let currentPage = 1;
let totalPages = 1;
let allLicenses = [];
let filteredLicenses = [];

document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    initPage();
    
    // 绑定事件
    bindEvents();
});

/**
 * 初始化页面
 */
function initPage() {
    // 加载许可证数据
    loadLicenses();
}

/**
 * 绑定页面所有事件
 */
function bindEvents() {
    // 查询按钮
    document.getElementById('search-btn').addEventListener('click', performSearch);
    
    // 重置查询按钮
    document.getElementById('reset-search').addEventListener('click', resetSearch);
    
    // 返回生成页按钮
    document.getElementById('back-btn').addEventListener('click', function() {
        window.location.href = 'license-made.html';
    });

    // 导出Excel按钮
    const exportBtn = document.createElement('button');
    exportBtn.id = 'export-btn';
    exportBtn.className = 'btn primary-btn';
    exportBtn.textContent = '导出Excel';
    exportBtn.style.marginLeft = '10px';
    exportBtn.addEventListener('click', exportToExcel);
    document.querySelector('.button-group').appendChild(exportBtn);
    
    // 上一页按钮
    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderLicensesTable();
        }
    });
    
    // 下一页按钮
    document.getElementById('next-page').addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            renderLicensesTable();
        }
    });
}

/**
 * 加载许可证数据
 */
function loadLicenses() {
    try {
        // 从本地存储获取许可证数据
        const licensesStr = localStorage.getItem('generatedLicenses');
        allLicenses = licensesStr ? JSON.parse(licensesStr) : [];
        
        // 按生成日期倒序排序
        allLicenses.sort((a, b) => new Date(b.generatedTime) - new Date(a.generatedTime));
        
        // 初始时，筛选列表等于全部列表
        filteredLicenses = [...allLicenses];
        
        // 计算总页数
        totalPages = Math.max(1, Math.ceil(filteredLicenses.length / PAGE_SIZE));
        
        // 渲染表格
        renderLicensesTable();
    } catch (e) {
        console.error('加载许可证数据失败:', e);
        showDialog('错误', '加载许可证数据失败: ' + e.message, [{ text: '确定', action: () => {} }]);
    }
}

/**
 * 渲染许可证表格
 */
function renderLicensesTable() {
    const tableBody = document.getElementById('licenses-table-body');
    const noLicensesEl = document.getElementById('no-licenses');
    const tableEl = document.getElementById('licenses-table');
    const paginationEl = document.getElementById('pagination');
    
    // 清空表格
    tableBody.innerHTML = '';
    
    // 检查是否有许可证数据
    if (filteredLicenses.length === 0) {
        noLicensesEl.style.display = 'block';
        tableEl.style.display = 'none';
        paginationEl.style.display = 'none';
        return;
    }
    
    // 显示表格，隐藏无数据提示
    noLicensesEl.style.display = 'none';
    tableEl.style.display = 'table';
    
    // 计算当前页数据范围
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, filteredLicenses.length);
    const currentPageLicenses = filteredLicenses.slice(startIndex, endIndex);
    
    // 生成表格行
    currentPageLicenses.forEach(license => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${license.xkid}</td>
            <td>${license.machineCode}</td>
            <td>${license.authType}</td>
            <td>${license.authUser}</td>
            <td>${license.authType === '永久授权' ? '永久' : license.expireDate || '-'}</td>
            <td>${license.authModules.join(', ')}</td>
            <td>${license.authVerificationCode}</td>
            <td>${new Date(license.generatedTime).toLocaleString()}</td>
            <td><button class="delete-license btn secondary-btn" data-xkid="${license.xkid}">删除</button></td>
        `;
        tableBody.appendChild(row);
    });
    
    // 绑定删除按钮事件
    document.querySelectorAll('.delete-license').forEach(btn => {
        btn.addEventListener('click', function() {
            const xkid = this.getAttribute('data-xkid');
            deleteLicense(xkid);
        });
    });
    
    // 更新分页控件
    updatePagination();
}

/**
 * 更新分页控件
 */
function updatePagination() {
    const paginationEl = document.getElementById('pagination');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageNumbersEl = document.getElementById('page-numbers');
    
    // 只有一页时不显示分页
    if (totalPages <= 1) {
        paginationEl.style.display = 'none';
        return;
    }
    
    paginationEl.style.display = 'flex';
    
    // 更新上一页/下一页按钮状态
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    // 清空页码
    pageNumbersEl.innerHTML = '';
    
    // 生成页码按钮
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === currentPage ? 'active' : '';
        pageBtn.addEventListener('click', function() {
            currentPage = i;
            renderLicensesTable();
        });
        
        const li = document.createElement('li');
        li.appendChild(pageBtn);
        pageNumbersEl.appendChild(li);
    }
}

/**
 * 执行许可证查询
 */
function performSearch() {
    const keyword = document.getElementById('search-keyword').value.trim().toLowerCase();
    if (!keyword) {
        // 无关键词，显示所有许可证
        filteredLicenses = [...allLicenses];
    } else {
        // 根据关键词筛选
        filteredLicenses = allLicenses.filter(license => {
            return license.xkid.toLowerCase().includes(keyword) ||
                   license.machineCode.toLowerCase().includes(keyword) ||
                   license.authUser.toLowerCase().includes(keyword) ||
                   license.authVerificationCode.toLowerCase().includes(keyword);
        });
    }
    
    // 重置到第一页
    currentPage = 1;
    totalPages = Math.max(1, Math.ceil(filteredLicenses.length / PAGE_SIZE));
    
    // 重新渲染表格
    renderLicensesTable();
}

/**
 * 重置查询
 */
function resetSearch() {
    document.getElementById('search-keyword').value = '';
    filteredLicenses = [...allLicenses];
    currentPage = 1;
    totalPages = Math.max(1, Math.ceil(filteredLicenses.length / PAGE_SIZE));
    renderLicensesTable();
}

/**
 * 导出许可证数据到Excel文件
 */
function exportToExcel() {
    if (filteredLicenses.length === 0) {
        showDialog('提示', '没有可导出的数据', [{ text: '确定', action: () => {} }]);
        return;
    }
    
    // 准备导出数据
    const exportData = filteredLicenses.map(license => ({
        '许可证ID': license.xkid,
        '机器码': license.machineCode,
        '授权类型': license.authType,
        '授权用户': license.authUser,
        '有效期': license.authType === '永久授权' ? '永久' : license.expireDate || '-',
        '授权模块': license.authModules.join(', '),
        '授权验证码': license.authVerificationCode,
        '生成时间': new Date(license.generatedTime).toLocaleString()
    }));
    
    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // 创建工作簿并添加工作表
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '许可证数据');
    
    // 导出Excel文件
    const exportDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `许可证数据_${exportDate}.xlsx`);
}

/**
 * 删除许可证
 * @param {string} xkid - 许可证ID
 */
function deleteLicense(xkid) {
    showDialog(
        '确认删除',
        '确定要删除此许可证记录吗？此操作不可恢复。',
        [
            { text: '取消', action: () => {} },
            { text: '确定', action: () => {
                // 从所有许可证中删除
                allLicenses = allLicenses.filter(license => license.xkid !== xkid);
                
                // 更新筛选列表
                filteredLicenses = filteredLicenses.filter(license => license.xkid !== xkid);
                
                // 保存回本地存储
                localStorage.setItem('generatedLicenses', JSON.stringify(allLicenses));
                
                // 重新计算总页数
                totalPages = Math.max(1, Math.ceil(filteredLicenses.length / PAGE_SIZE));
                
                // 如果当前页已无数据，返回上一页
                if (currentPage > totalPages && currentPage > 1) {
                    currentPage--;
                }
                
                // 重新渲染表格
                renderLicensesTable();
                
                showDialog('成功', '许可证记录已删除', [{ text: '确定', action: () => {} }]);
            }}
        ]
    );
}

/**
 * 显示对话框
 * @param {string} title - 标题
 * @param {string} message - 消息
 * @param {Array} buttons - 按钮配置
 */
function showDialog(title, message, buttons) {
    // 创建对话框
    const dialog = document.createElement('div');
    dialog.className = 'modal';
    
    const dialogContent = document.createElement('div');
    dialogContent.className = 'modal-content';
    
    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => dialog.remove());
    
    // 标题
    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    
    // 消息
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    
    // 按钮组
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    buttonGroup.style.justifyContent = 'flex-end';
    
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = 'btn primary-btn';
        button.textContent = btn.text;
        button.addEventListener('click', () => {
            btn.action();
            dialog.remove();
        });
        buttonGroup.appendChild(button);
    });
    
    // 组装对话框
    dialogContent.appendChild(closeBtn);
    dialogContent.appendChild(titleEl);
    dialogContent.appendChild(messageEl);
    dialogContent.appendChild(buttonGroup);
    dialog.appendChild(dialogContent);
    
    // 添加到页面
    document.body.appendChild(dialog);
}