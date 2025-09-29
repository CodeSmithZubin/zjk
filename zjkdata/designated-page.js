// designated-page.js
'use strict';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  // 检查登录状态
  if (!checkLoginStatus()) return;

  // 验证用户权限（仅管理员可见）
  const role = localStorage.getItem('role');
  if (role !== 'admin') {
    showMessage('您没有访问此页面的权限', true);
    setTimeout(() => window.location.href = 'home.html', 2000);
    return;
  }

  // 移动端菜单
  initMobileMenu();

  // 初始化专家列表
  loadExpertList();

  // 绑定事件处理程序
  bindEventHandlers();
});

// 全局分页状态（与专家页保持一致，复用本地存储的 pageSize）
const PAGE = {
  page: 1,
  pageSize: parseInt(localStorage.getItem('pageSize') || '20', 10),
  total: 0,
  data: []
};

// 加载专家列表（支持分页）
async function loadExpertList(page = 1, dataOverride) {
  try {
    const experts = await DB.getAllExperts();
    const designatedExpert = await DB.getDesignatedExpert();
    const all = Array.isArray(dataOverride) ? dataOverride : experts;

    PAGE.total = all.length;
    PAGE.data = all;
    const totalPages = Math.max(1, Math.ceil(PAGE.total / PAGE.pageSize));
    PAGE.page = Math.min(Math.max(1, page), totalPages);

    const start = (PAGE.page - 1) * PAGE.pageSize;
    const slice = all.slice(start, start + PAGE.pageSize);

    renderExpertTable(slice, designatedExpert);
    renderPagination(PAGE.total);
  } catch (error) {
    showMessage('加载专家数据失败: ' + error.message, true);
  }
}

// 渲染专家表格
function renderExpertTable(experts, designatedExpert) {
  const tableBody = document.getElementById('designatedTableBody');
  tableBody.innerHTML = '';

  if (!experts || experts.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="9" style="text-align: center;">暂无专家数据</td>';
    tableBody.appendChild(row);
    return;
  }

  experts.forEach(expert => {
    const isDesignated = designatedExpert && expert.zjno === designatedExpert.zjno;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="checkbox" class="expertCheckbox" data-zjno="${expert.zjno}" ${isDesignated ? 'checked' : ''} ${isDesignated ? 'disabled' : ''}></td>
      <td>${expert.zjno}</td>
      <td>${expert.zjname}</td>
      <td>${expert.zjsfno}</td>
      <td>${expert.zjphone}</td>
      <td>${expert.zjemail}</td>
      <td>${expert.zjdw}</td>
      <td>${expert.zjsc}</td>
      <td>${isDesignated ? '<span style="color: green;">是</span>' : '否'}</td>
    `;
    tableBody.appendChild(row);
  });

  // 单选逻辑处理
  const checkboxes = document.querySelectorAll('.expertCheckbox:not(:disabled)');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        checkboxes.forEach(cb => cb !== this && (cb.checked = false));
      }
    });
  });
}

// 渲染分页控件（与专家页风格一致）
function renderPagination(totalItems) {
  const container = document.getElementById('pagination');
  if (!container) return;
  container.innerHTML = '';

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE.pageSize));

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

  container.onkeydown = (e) => {
    if (e.key === 'ArrowLeft' && PAGE.page > 1) loadExpertList(PAGE.page - 1, PAGE.data);
    if (e.key === 'ArrowRight' && PAGE.page < totalPages) loadExpertList(PAGE.page + 1, PAGE.data);
  };
  container.tabIndex = 0;

  container.appendChild(info);
  container.appendChild(controls);
}

// 绑定事件处理程序
function bindEventHandlers() {
  const designateBtn = document.getElementById('designateBtn');
  const cancelDesignateBtn = document.getElementById('cancelDesignateBtn');

  if (designateBtn) designateBtn.addEventListener('click', handleDesignate);
  if (cancelDesignateBtn) cancelDesignateBtn.addEventListener('click', handleCancelDesignate);
}

// 处理关联指定专家
async function handleDesignate() {
  const checkedBoxes = document.querySelectorAll('.expertCheckbox:checked:not(:disabled)');
  if (checkedBoxes.length !== 1) {
    showMessage('请选择一位专家进行指定', true);
    return;
  }

  const zjno = checkedBoxes[0].dataset.zjno;
  try {
    await DB.setDesignatedExpert(zjno);
    showMessage('指定专家成功');
    loadExpertList();
  } catch (error) {
    showMessage('指定专家失败: ' + error.message, true);
  }
}

// 处理取消指定专家
async function handleCancelDesignate() {
  try {
    const designatedExpert = await DB.getDesignatedExpert();
    if (!designatedExpert) {
      showMessage('当前没有指定专家', true);
      return;
    }

    if (!confirm(`确定要取消 ${designatedExpert.zjname} 的指定专家身份吗？`)) return;

    // 将指定专家字段设为否
    designatedExpert.zjzd = '否';
    await DB.updateExpert(designatedExpert);
    showMessage('取消指定专家成功');
    loadExpertList();
  } catch (error) {
    showMessage('取消指定专家失败: ' + error.message, true);
  }
}