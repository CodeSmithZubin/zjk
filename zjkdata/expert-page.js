// expert-page.js
'use strict';

// 页面加载完成后初始化
/**
 * 页面主入口：完成登录校验、菜单初始化、列表加载与事件绑定。
 */
document.addEventListener('DOMContentLoaded', function() {
  // 检查登录状态
  if (!checkLoginStatus()) return;

  // 权限控制
  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';
  const isMaintainer = role === 'maintainer';

  if (!isAdmin && !isMaintainer) {
    hideById('deleteBtn');
    hideById('importBtn');
    hideById('initBtn');
    hideById('backupBtn');
  }
  if (!isAdmin) {
    hideById('templateBtn');
  }

  // 移动端菜单
  initMobileMenu();

  // 初始化专家列表
  loadExpertList();

  // 绑定事件
  bindEventHandlers();
});

/**
 * 根据元素 id 隐藏节点。
 * @param {string} id 元素 id
 */
function hideById(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// 加载专家列表，支持分页
/**
 * 加载并渲染专家列表，支持分页；数据为空时尝试自动初始化。
 * @param {number} [page=1] 当前页码
 * @returns {Promise<void>}
 */
// 全局分页状态（持久化每页条数）
const PAGE = {
  page: 1,
  pageSize: parseInt(localStorage.getItem('pageSize') || '20', 10),
  total: 0,
  data: []
};

async function loadExpertList(page = 1, data = null) {
  try {
    const experts = data || await DB.getAllExperts();
    PAGE.total = experts.length;
    PAGE.page = page;
    PAGE.data = experts;
    const startIndex = (page - 1) * PAGE.pageSize;
    const paginatedExperts = experts.slice(startIndex, startIndex + PAGE.pageSize);
    renderExpertTable(paginatedExperts);
    renderPagination(PAGE.total);

    // 数据为空时自动初始化
    if (experts.length === 0) {
      showMessage('首次加载，正在初始化专家库数据...', false);
      try {
        await DB.initDB();
        showMessage('专家库数据初始化成功', false);
        const newExperts = await DB.getAllExperts();
        PAGE.total = newExperts.length;
        PAGE.page = page;
        PAGE.data = newExperts;
        const newPaginatedExperts = newExperts.slice(startIndex, startIndex + PAGE.pageSize);
        renderExpertTable(newPaginatedExperts);
        renderPagination(PAGE.total);
      } catch (initError) {
        showMessage('自动初始化失败，请手动点击"初始化"按钮', true);
        console.error('初始化失败:', initError);
      }
    }
  } catch (error) {
    showMessage('加载专家数据失败: ' + error.message, true);
  }
}

// 渲染专家表格
/**
 * 渲染专家表格内容。
 * @param {Array<object>} experts 专家数组
 */
function renderExpertTable(experts) {
  const tableBody = document.getElementById('expertTableBody');
  tableBody.innerHTML = '';

  if (!experts || experts.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="9" style="text-align: center;">暂无专家数据</td>';
    tableBody.appendChild(row);
    return;
  }

  experts.forEach(expert => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="checkbox" class="expertCheckbox" data-zjno="${expert.zjno}"></td>
      <td>${expert.zjno}</td>
      <td>${expert.zjname}</td>
      <td>${expert.zjsfno}</td>
      <td>${expert.zjphone}</td>
      <td>${expert.zjemail}</td>
      <td>${expert.zjdw}</td>
      <td>${expert.zjbz}</td>
      <td>${expert.zjsc}</td>
    `;
    tableBody.appendChild(row);
  });
}

// 渲染分页控件
/**
 * 渲染分页控件。
 * @param {number} totalItems 数据总条数
 */
function renderPagination(totalItems) {
  const container = document.getElementById('pagination');
  container.innerHTML = '';

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE.pageSize));

  // 信息区：总条数/页大小/页码
  const info = document.createElement('div');
  info.className = 'pagination-info';
  const start = totalItems ? (PAGE.page - 1) * PAGE.pageSize + 1 : 0;
  const end = Math.min(PAGE.page * PAGE.pageSize, totalItems);

  const sizeSelect = document.createElement('select');
  sizeSelect.className = 'page-size-select';
  [10, 20, 50, 100].forEach(n => {
    const opt = document.createElement('option');
    opt.value = String(n);
    opt.textContent = `每页 ${n}`;
    if (n === PAGE.pageSize) opt.selected = true;
    sizeSelect.appendChild(opt);
  });
  sizeSelect.addEventListener('change', () => {
    PAGE.pageSize = parseInt(sizeSelect.value, 10);
    localStorage.setItem('pageSize', String(PAGE.pageSize));
    loadExpertList(1, PAGE.data);
  });

  const infoText = document.createElement('span');
  infoText.textContent = `共 ${totalItems} 条 · 第 ${PAGE.page}/${totalPages} 页 · 显示 ${start}-${end}`;
  info.appendChild(infoText);
  info.appendChild(sizeSelect);

  // 控件区：首页/上一页/数字/下一页/末页 + 跳页
  const controls = document.createElement('div');
  controls.className = 'pagination-controls';

  const mkBtn = (label, action, disabled = false) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = 'page-btn';
    btn.disabled = disabled;
    btn.addEventListener('click', action);
    return btn;
  };

  const goFirst = mkBtn('首页', () => loadExpertList(1, PAGE.data), PAGE.page === 1);
  const goPrev = mkBtn('上一页', () => loadExpertList(PAGE.page - 1, PAGE.data), PAGE.page === 1);
  controls.appendChild(goFirst);
  controls.appendChild(goPrev);

  // 数字区（带省略号）
  const range = 2;
  const startPage = Math.max(1, PAGE.page - range);
  const endPage = Math.min(totalPages, PAGE.page + range);
  const addNumberBtn = p => {
    const btn = mkBtn(String(p), () => loadExpertList(p, PAGE.data));
    if (p === PAGE.page) btn.classList.add('active');
    controls.appendChild(btn);
  };
  if (startPage > 1) addNumberBtn(1);
  if (startPage > 2) controls.appendChild(document.createTextNode('…'));
  for (let p = startPage; p <= endPage; p++) addNumberBtn(p);
  if (endPage < totalPages - 1) controls.appendChild(document.createTextNode('…'));
  if (endPage < totalPages) addNumberBtn(totalPages);

  const goNext = mkBtn('下一页', () => loadExpertList(PAGE.page + 1, PAGE.data), PAGE.page >= totalPages);
  const goLast = mkBtn('末页', () => loadExpertList(totalPages, PAGE.data), PAGE.page >= totalPages);
  controls.appendChild(goNext);
  controls.appendChild(goLast);

  // 跳转页码
  const jumpWrap = document.createElement('span');
  jumpWrap.style.marginLeft = '8px';
  const jumpInput = document.createElement('input');
  jumpInput.type = 'number';
  jumpInput.min = '1';
  jumpInput.max = String(totalPages);
  jumpInput.placeholder = '跳转页';
  jumpInput.style.width = '80px';
  const jumpBtn = mkBtn('Go', () => {
    const target = parseInt(jumpInput.value || '0', 10);
    if (isNaN(target) || target < 1 || target > totalPages) return;
    loadExpertList(target, PAGE.data);
  }, false);
  jumpWrap.appendChild(jumpInput);
  jumpWrap.appendChild(jumpBtn);
  controls.appendChild(jumpWrap);

  // 键盘快捷键：左右翻页
  container.onkeydown = (e) => {
    if (e.key === 'ArrowLeft' && PAGE.page > 1) loadExpertList(PAGE.page - 1, PAGE.data);
    if (e.key === 'ArrowRight' && PAGE.page < totalPages) loadExpertList(PAGE.page + 1, PAGE.data);
  };
  container.tabIndex = 0; // 允许容器获取焦点

  // 拼装
  container.appendChild(info);
  container.appendChild(controls);
}

// 绑定事件处理程序
/**
 * 绑定页面内各类事件处理程序。
 */
function bindEventHandlers() {
  byId('searchBtn')?.addEventListener('click', handleSearch);
  byId('addBtn')?.addEventListener('click', () => openExpertModal('add'));
  byId('editBtn')?.addEventListener('click', handleEdit);
  byId('deleteBtn')?.addEventListener('click', handleDelete);
  byId('exportBtn')?.addEventListener('click', handleExport);
  byId('importBtn')?.addEventListener('click', () => byId('importFile').click());
  byId('importFile')?.addEventListener('change', handleImport);
  byId('initBtn')?.addEventListener('click', handleInit);
  byId('backupBtn')?.addEventListener('click', handleBackup);
  byId('cancelBtn')?.addEventListener('click', () => closeExpertModal());
  byId('expertForm')?.addEventListener('submit', handleFormSubmit);
  byId('selectAll')?.addEventListener('change', handleSelectAll);
}

/**
 * 简化的按 id 获取元素方法。
 * @param {string} id 元素 id
 * @returns {HTMLElement|null}
 */
function byId(id) { return document.getElementById(id); }

// 搜索处理
/**
 * 搜索处理：依据归属与关键词过滤专家。
 */
async function handleSearch() {
  const zjsc = byId('归属Select').value;
  const keyword = byId('searchInput').value.trim();

  try {
    const query = {};
    if (zjsc !== '全部专家') query.zjsc = zjsc;
    if (keyword) query.keyword = keyword;
    const experts = await DB.queryExperts(query);
    loadExpertList(1, experts);
  } catch (error) {
    showMessage('搜索失败: ' + error.message, true);
  }
}

// 打开专家模态框
/**
 * 打开专家模态框。
 * @param {'add'|'edit'} mode 模式：新增或编辑
 * @param {object|null} [expert] 编辑模式下的专家对象
 */
function openExpertModal(mode, expert = null) {
  const modal = byId('expertModal');
  const modalTitle = byId('modalTitle');
  const formMode = byId('formMode');
  const formZjno = byId('formZjno');
  byId('expertForm').reset();

  if (mode === 'add') {
    modalTitle.textContent = '新增专家';
    formMode.value = 'add';
    formZjno.value = '';
  } else if (mode === 'edit') {
    modalTitle.textContent = '编辑专家';
    formMode.value = 'edit';
    formZjno.value = expert.zjno;
    byId('formZjname').value = expert.zjname;
    byId('formZjsfno').value = expert.zjsfno;
    byId('formZjphone').value = expert.zjphone;
    byId('formZjemail').value = expert.zjemail;
    byId('formZjdw').value = expert.zjdw;
    byId('formZjbz').value = expert.zjbz;
    byId('formZjsc').value = expert.zjsc;
  }

  modal.style.display = 'flex';
}

/**
 * 关闭专家模态框。
 */
function closeExpertModal() {
  byId('expertModal').style.display = 'none';
}

// 处理编辑操作
/**
 * 处理编辑操作：要求选中唯一一条专家记录。
 */
async function handleEdit() {
  const checkedBoxes = document.querySelectorAll('.expertCheckbox:checked');
  if (checkedBoxes.length !== 1) return showMessage('请选择一个专家进行编辑', true);
  const zjno = checkedBoxes[0].dataset.zjno;
  try {
    const experts = await DB.getAllExperts();
    const expert = experts.find(e => e.zjno === zjno);
    if (expert) openExpertModal('edit', expert); else showMessage('未找到选中的专家', true);
  } catch (error) {
    showMessage('获取专家数据失败: ' + error.message, true);
  }
}

// 处理删除操作
/**
 * 处理删除操作：支持批量删除选中专家。
 */
async function handleDelete() {
  const checkedBoxes = document.querySelectorAll('.expertCheckbox:checked');
  if (checkedBoxes.length === 0) return showMessage('请选择至少一个专家进行删除', true);
  if (!confirm('确定要删除选中的专家吗？')) return;
  try {
    for (const checkbox of checkedBoxes) await DB.deleteExpert(checkbox.dataset.zjno);
    showMessage('删除成功');
    loadExpertList();
  } catch (error) {
    showMessage('删除失败: ' + error.message, true);
  }
}

// 处理导出操作
/**
 * 处理导出操作：将当前专家数据导出为 Excel。
 */
async function handleExport() {
  try {
    const experts = await DB.getAllExperts();
    DB.exportToExcel(experts, '专家库');
  } catch (error) {
    showMessage('导出失败: ' + error.message, true);
  }
}

// 导入辅助模态框与进度
const errorModal = document.createElement('div');
errorModal.className = 'form-modal';
errorModal.id = 'errorModal';
errorModal.style.display = 'none';
errorModal.innerHTML = `
  <div class="form-content" style="max-height: 80vh; overflow-y: auto;">
    <h2>导入错误详情</h2>
    <div id="errorDetails"></div>
    <div class="form-actions">
      <button type="button" class="btn btn-primary" id="closeErrorBtn">关闭</button>
      <button type="button" class="btn btn-primary" id="copyErrorsBtn">复制错误</button>
    </div>
  </div>
`;
document.body.appendChild(errorModal);

const progressModal = document.createElement('div');
progressModal.className = 'form-modal';
progressModal.id = 'progressModal';
progressModal.style.display = 'none';
progressModal.innerHTML = `
  <div class="form-content">
    <h2>正在导入...</h2>
    <div class="progress-container">
      <div class="progress-bar" id="progressBar" style="width: 0%"></div>
    </div>
    <p id="progressText">0/0 条记录</p>
  </div>
`;
document.body.appendChild(progressModal);

byId('closeErrorBtn')?.addEventListener('click', () => { errorModal.style.display = 'none'; });
byId('copyErrorsBtn')?.addEventListener('click', () => {
  const errorDetails = byId('errorDetails').innerText;
  navigator.clipboard.writeText(errorDetails).then(() => showMessage('错误详情已复制到剪贴板'));
});

byId('templateBtn')?.addEventListener('click', () => {
  const templateContent = `姓名,身份证,电话,邮箱,单位,备注,归属
张三,110101199001011234,13800138000,zhangsan@example.com,测试单位,测试备注,内部专家
李四,110101199001015678,13900139000,lisi@example.com,测试单位,测试备注,外部专家`;
  const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = '专家库导入模板.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// 导入逻辑
/**
 * 导入逻辑：支持 CSV 与 Excel 两种格式，带进度与错误详情。
 * @param {Event} event 文件选择变更事件
 */
async function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const isCSV = file.name.endsWith('.csv');
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  if (!isCSV && !isExcel) { showMessage('请上传CSV或Excel格式文件', true); event.target.value = ''; return; }
  if (!confirm('确定要导入专家数据吗？这将添加新专家，但不会覆盖现有数据。')) { event.target.value = ''; return; }

  const progressModal = byId('progressModal');
  const progressBar = byId('progressBar');
  const progressText = byId('progressText');
  progressModal.style.display = 'flex';
  progressBar.style.width = '0%';
  progressText.textContent = '准备导入...';

  try {
    let experts;
    if (isCSV) {
      const content = await readFileAsText(file);
      experts = parseCSV(content);
    } else {
      const data = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      experts = convertExcelToExperts(jsonData);
    }

    if (!experts || experts.length === 0) { showMessage('文件中没有有效数据', true); return; }

    const result = await importExperts(experts, (current, total) => {
      const percent = Math.round((current / total) * 100);
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `${current}/${experts.length} 条记录`;
    });

    progressModal.style.display = 'none';
    if (result.failCount > 0) {
      byId('errorDetails').innerHTML = `<pre>${result.errors.join('\n')}</pre>`;
      byId('errorModal').style.display = 'flex';
    }
    showMessage(`导入成功：${result.successCount}条，失败：${result.failCount}条`);
    loadExpertList();
  } catch (error) {
    progressModal.style.display = 'none';
    showMessage('导入失败: ' + error.message, true);
  }
  event.target.value = '';
}

/**
 * 读取文件为文本。
 * @param {File} file 文件对象
 * @returns {Promise<string>} 文本内容
 */
function readFileAsText(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = e => resolve(e.target.result); reader.onerror = () => reject(new Error('文件读取失败')); reader.readAsText(file); }); }
/**
 * 读取文件为二进制 ArrayBuffer。
 * @param {File} file 文件对象
 * @returns {Promise<ArrayBuffer>} 二进制内容
 */
function readFileAsArrayBuffer(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = e => resolve(e.target.result); reader.onerror = () => reject(new Error('文件读取失败')); reader.readAsArrayBuffer(file); }); }
/**
 * 将 Excel 的二维数组转换为专家对象数组。
 * @param {Array<Array<any>>} jsonData 二维数组数据（首行表头）
 * @returns {Array<object>} 专家数组
 */
function convertExcelToExperts(jsonData) {
  const experts = [];
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length < 7) continue;
    experts.push({
      zjname: row[0]?.toString().trim() || '',
      zjsfno: row[1]?.toString().trim() || '',
      zjphone: row[2]?.toString().trim() || '',
      zjemail: row[3]?.toString().trim() || '',
      zjdw: row[4]?.toString().trim() || '',
      zjbz: row[5]?.toString().trim() || '',
      zjsc: row[6]?.toString().trim() || '内部专家',
      zjzd: '否'
    });
  }
  return experts;
}

/**
 * 解析 CSV 文本为专家数组（支持带引号的字段）。
 * @param {string} content CSV 内容
 * @returns {Array<object>} 专家数组
 */
function parseCSV(content) {
  const lines = content.split('\n');
  const experts = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const columns = []; let inQuotes = false; let currentColumn = '';
    for (let char of line) {
      if (char === '"' && !inQuotes) inQuotes = true;
      else if (char === '"' && inQuotes) inQuotes = false;
      else if (char === ',' && !inQuotes) { columns.push(currentColumn.trim()); currentColumn = ''; }
      else currentColumn += char;
    }
    columns.push(currentColumn.trim());
    if (columns.length < 7) continue;
    experts.push({
      zjname: columns[0], zjsfno: columns[1], zjphone: columns[2], zjemail: columns[3], zjdw: columns[4], zjbz: columns[5], zjsc: columns[6] || '内部专家', zjzd: '否'
    });
  }
  return experts;
}

/**
 * 批量导入专家。
 * @param {Array<object>} experts 专家数组
 * @param {(current:number,total:number)=>void} onProgress 进度回调
 * @returns {Promise<{successCount:number,failCount:number,errors:Array<string>}>}
 */
async function importExperts(experts, onProgress) {
  const result = { successCount: 0, failCount: 0, errors: [] };
  const existingExperts = await DB.getAllExperts();
  let maxNo = existingExperts.reduce((max, e) => { const num = parseInt(e.zjno.replace('zj', '')); return num > max ? num : max; }, 0);
  for (let i = 0; i < experts.length; i++) {
    const expert = experts[i];
    try {
      if (!expert.zjname) throw new Error('姓名不能为空');
      if (!validateIdCard(expert.zjsfno)) throw new Error(`身份证格式错误: ${expert.zjsfno}`);
      if (!validatePhone(expert.zjphone)) throw new Error(`手机号格式错误: ${expert.zjphone}`);
      if (!validateEmail(expert.zjemail)) throw new Error(`邮箱格式错误: ${expert.zjemail}`);
      if (!expert.zjdw) throw new Error('单位不能为空');
      const exists = existingExperts.some(e => e.zjsfno === expert.zjsfno);
      if (exists) throw new Error('身份证已存在');
      maxNo++; expert.zjno = `zj${maxNo.toString().padStart(3, '0')}`;
      await DB.addExpert(expert);
      result.successCount++; existingExperts.push(expert);
    } catch (error) {
      const errorMsg = `第${i+2}行 - ${expert.zjname || '未知姓名'}: ${error.message}`;
      result.errors.push(errorMsg); result.failCount++;
    }
    if (onProgress) onProgress(i + 1, experts.length);
  }
  return result;
}

/**
 * 手动初始化专家库数据。
 */
async function handleInit() {
  if (!confirm('确定要初始化专家库吗？这将清除现有数据并恢复到初始状态。')) return;
  try { await DB.initDB(); showMessage('初始化成功'); loadExpertList(); }
  catch (error) { showMessage('初始化失败: ' + error.message, true); }
}

/**
 * 手动备份专家数据到本地文件。
 */
async function handleBackup() {
  try { await DB.backupDB(); showMessage('备份成功'); }
  catch (error) { showMessage('备份失败: ' + error.message, true); }
}

/**
 * 表单提交：新增或编辑专家。
 * @param {SubmitEvent} e 提交事件
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  const mode = byId('formMode').value;
  const expert = {
    zjname: byId('formZjname').value.trim(),
    zjsfno: byId('formZjsfno').value.trim(),
    zjphone: byId('formZjphone').value.trim(),
    zjemail: byId('formZjemail').value.trim(),
    zjdw: byId('formZjdw').value.trim(),
    zjbz: byId('formZjbz').value.trim(),
    zjsc: byId('formZjsc').value,
    zjzd: '否'
  };
  if (!expert.zjname) return showMessage('请输入姓名', true);
  if (!validateIdCard(expert.zjsfno)) return showMessage('请输入有效的身份证号码', true);
  if (!validatePhone(expert.zjphone)) return showMessage('请输入有效的手机号码', true);
  if (!validateEmail(expert.zjemail)) return showMessage('请输入有效的邮箱地址', true);
  if (!expert.zjdw) return showMessage('请输入单位', true);
  if (!expert.zjbz) return showMessage('请输入备注', true);

  try {
    if (mode === 'add') {
      const experts = await DB.getAllExperts();
      const maxNo = experts.reduce((max, e) => { const num = parseInt(e.zjno.replace('zj', '')); return num > max ? num : max; }, 0);
      expert.zjno = `zj${(maxNo + 1).toString().padStart(3, '0')}`;
      await DB.addExpert(expert);
      showMessage('新增专家成功');
    } else if (mode === 'edit') {
      expert.zjno = byId('formZjno').value;
      await DB.updateExpert(expert);
      showMessage('编辑专家成功');
    }
    closeExpertModal();
    loadExpertList();
  } catch (error) {
    showMessage('保存失败: ' + error.message, true);
  }
}

/**
 * 处理全选复选框状态变更。
 * @param {Event} e 变更事件
 */
function handleSelectAll(e) {
  const checkboxes = document.querySelectorAll('.expertCheckbox');
  checkboxes.forEach(checkbox => checkbox.checked = e.target.checked);
}