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

// 加载专家列表
async function loadExpertList() {
  try {
    const experts = await DB.getAllExperts();
    const designatedExpert = await DB.getDesignatedExpert();
    renderExpertTable(experts, designatedExpert);
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