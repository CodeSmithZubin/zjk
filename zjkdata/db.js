/*
 * 文件: db.js
 * 描述: IndexedDB 封装，提供专家库的增删改查、指定专家设置、备份与导出能力。
 * 说明: 在不改变现有 API 的前提下，逐步规范结构并补充可测试的扩展功能。
 */
'use strict'
/**
 * IndexedDB 封装：提供专家库的增删改查、指定专家设置、备份与导出能力。
 * 所有函数均返回 Promise，发生错误时抛出标准 Error，便于统一处理。
 */
// 数据库名称和版本
const DB_NAME = 'zjkdb';
const DB_VERSION = 1;
const STORE_NAME = 'zjk';

// 打开数据库连接
/**
 * 打开并升级 IndexedDB 数据库连接。
 * @returns {Promise<IDBDatabase>} 解析为数据库实例
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // 数据库升级或首次创建
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // 创建存储对象，以zjno为主键
                const objectStore = db.createObjectStore(STORE_NAME, {
                    keyPath: 'zjno',
                    autoIncrement: false
                });

                // 创建索引，方便查询
                objectStore.createIndex('zjname', 'zjname', { unique: false });
                objectStore.createIndex('zjsfno', 'zjsfno', { unique: true });
                objectStore.createIndex('zjsc', 'zjsc', { unique: false });
                objectStore.createIndex('zjzd', 'zjzd', { unique: false });
            }
        };

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            console.error('打开数据库失败:', event.target.error);
            reject(event.target.error);
        };
    });
}

// 获取所有专家数据
/**
 * 获取全部专家记录。
 * @returns {Promise<Array<object>>} 专家数组
 */
function getAllExperts() {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.getAll();

            request.onsuccess = function() {
                resolve(request.result);
            };

            request.onerror = function(event) {
                console.error('获取专家数据失败:', event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            reject(error);
        }
    });
}

// 根据条件查询专家
/**
 * 根据条件查询专家。
 * @param {{zjsc?: string, keyword?: string}} [query] 过滤条件：归属或关键词
 * @returns {Promise<Array<object>>} 过滤后的专家数组
 */
function queryExperts(query = {}) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            
            // 正确处理getAll()异步操作
            const request = objectStore.getAll();
            request.onsuccess = function() {
                const experts = request.result || [];
                
                // 应用过滤条件
                const filteredExperts = experts.filter(expert => {
                    // 归属条件
                    if (query.zjsc && expert.zjsc !== query.zjsc) return false;
                    
                    // 搜索关键词条件
                    if (query.keyword) {
                        const keyword = query.keyword.toLowerCase();
                        return Object.values(expert).some(value => 
                            value.toString().toLowerCase().includes(keyword)
                        );
                    }
                    return true;
                });

                resolve(filteredExperts);
            };
            
            request.onerror = function(event) {
                console.error('查询专家数据失败:', event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            reject(error);
        }
    });
}

// 添加专家
/**
 * 新增专家记录。
 * @param {object} expert 专家对象，须包含 `zjno` 等字段
 * @returns {Promise<boolean>} 成功返回 true
 */
function addExpert(expert) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            await new Promise((resolve, reject) => {
                const request = objectStore.add(expert);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            resolve(true);
        } catch (error) {
            reject(error);
        }
    });
}

// 更新专家
/**
 * 更新专家记录。
 * @param {object} expert 专家对象，按主键 `zjno` 覆盖更新
 * @returns {Promise<boolean>} 成功返回 true
 */
function updateExpert(expert) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            await new Promise((resolve, reject) => {
                const request = objectStore.put(expert);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            resolve(true);
        } catch (error) {
            reject(error);
        }
    });
}

// 删除专家
/**
 * 删除专家记录。
 * @param {string} zjno 专家编号主键
 * @returns {Promise<boolean>} 成功返回 true
 */
function deleteExpert(zjno) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.delete(zjno);

            request.onsuccess = function() {
                resolve(true);
            };

            request.onerror = function(event) {
                console.error('删除专家失败:', event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            reject(error);
        }
    });
}

// 获取指定专家
/**
 * 获取当前被标记为“指定专家”的记录。
 * @returns {Promise<object|null>} 若存在则返回专家对象，否则为 null
 */
function getDesignatedExpert() {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const index = objectStore.index('zjzd');
            const request = index.get('是');

            request.onsuccess = function() {
                resolve(request.result || null);
            };

            request.onerror = function(event) {
                console.error('获取指定专家失败:', event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            reject(error);
        }
    });
}

// 设置指定专家
/**
 * 设置“指定专家”。会将已指定的专家全部取消后，设置新的指定专家。
 * @param {string} zjno 需要设为指定的专家编号
 * @returns {Promise<boolean>} 设置成功返回 true
 */
function setDesignatedExpert(zjno) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);

            // 先清除所有指定专家
            const allExperts = await new Promise((resolve, reject) => {
                const request = objectStore.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            
            for (const expert of allExperts) {
                if (expert.zjzd === '是') {
                    expert.zjzd = '否';
                    await new Promise((resolve, reject) => {
                        const request = objectStore.put(expert);
                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => reject(request.error);
                    });
                }
            }

            // 设置新的指定专家
            const expert = await new Promise((resolve, reject) => {
                const request = objectStore.get(zjno);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            if (expert) {
                expert.zjzd = '是';
                await new Promise((resolve, reject) => {
                    const request = objectStore.put(expert);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
                resolve(true);
            } else {
                reject(new Error('专家不存在'));
            }
        } catch (error) {
            reject(error);
        }
    });
}

// 初始化数据库（使用嵌入式初始数据）
/**
 * 初始化数据库：清空并写入嵌入式初始数据。
 * @returns {Promise<boolean>} 初始化成功返回 true
 */
async function initDB() {
    try {
        // 清空现有数据
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        
        // 清空现有数据
        await new Promise((resolve, reject) => {
            const clearRequest = objectStore.clear();
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = () => reject(clearRequest.error);
        });
        
        // 嵌入式初始数据
        const initialData = [
            {
                "zjno": "zj001",
                "zjname": "燕杰",
                "zjsfno": "210405199312110113",
                "zjphone": "13810101010",
                "zjemail": "zj@163.com",
                "zjdw": "初始化测试数据",
                "zjbz": "产品总监",
                "zjsc": "内部专家",
                "zjzd": "否"
            },
            {
                "zjno": "zj002",
                "zjname": "朱泉",
                "zjsfno": "210405199312110114",
                "zjphone": "13910101567",
                "zjemail": "zj@163.com",
                "zjdw": "初始化测试数据",
                "zjbz": "丰田汽车",
                "zjsc": "内部专家",
                "zjzd": "否"
            },
            {
                "zjno": "zj003",
                "zjname": "尹巍",
                "zjsfno": "210405199312110115",
                "zjphone": "13810101010",
                "zjemail": "zj@163.com",
                "zjdw": "初始化测试数据",
                "zjbz": "山西大学_本科",
                "zjsc": "内部专家",
                "zjzd": "否"
            },
            {
                "zjno": "zj004",
                "zjname": "郑轩",
                "zjsfno": "210405199312110116",
                "zjphone": "13810101010",
                "zjemail": "zj@163.com",
                "zjdw": "初始化测试数据",
                "zjbz": "西安电子_硕士",
                "zjsc": "内部专家",
                "zjzd": "否"
            },
            {
                "zjno": "zj005",
                "zjname": "张雷",
                "zjsfno": "210405199312110117",
                "zjphone": "13810101010",
                "zjemail": "zj@163.com",
                "zjdw": "初始化测试数据",
                "zjbz": "智达_产研负责人",
                "zjsc": "内部专家",
                "zjzd": "否"
            }
        ];

        // 批量添加数据
        const addPromises = [];
        for (const expert of initialData) {
            addPromises.push(new Promise((resolve, reject) => {
                const request = objectStore.add(expert);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            }));
        }
        await Promise.all(addPromises);
        
        // 验证数据是否成功插入（修复 getAll 异步使用）
        const verifyExperts = await new Promise((resolve, reject) => {
            const req = objectStore.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
        if ((verifyExperts || []).length !== initialData.length) {
            throw new Error('数据初始化不完整');
        }
        
        return true;
    } catch (error) {
        console.error('初始化数据库失败:', error);
        throw error;
    }
}

// 备份数据库
/**
 * 备份当前专家数据为 JSON 文件并触发下载。
 * @returns {Promise<boolean>} 备份成功返回 true
 */
function backupDB() {
    return new Promise(async (resolve, reject) => {
        try {
            const experts = await getAllExperts();
            const backupData = JSON.stringify(experts, null, 2);
            const blob = new Blob([backupData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // 创建下载链接
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
            a.download = `zjk_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();

            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);

            resolve(true);
        } catch (error) {
            console.error('备份数据库失败:', error);
            reject(error);
        }
    });
}

// 导出专家数据为Excel
/**
 * 导出专家数据为 Excel 文件（使用 `xlsx` 库）。
 * @param {Array<object>} experts 专家数据列表
 * @param {string} [fileName='experts'] 导出文件前缀名
 * @returns {void}
 */
function exportToExcel(experts, fileName = 'experts') {
    // 使用xlsx库生成Excel文件
    const worksheet = XLSX.utils.json_to_sheet(experts.map(expert => ({
        '编号': expert.zjno,
        '姓名': expert.zjname,
        '身份证': expert.zjsfno,
        '电话': expert.zjphone,
        '邮箱': expert.zjemail,
        '单位': expert.zjdw,
        '备注': expert.zjbz,
        '归属': expert.zjsc
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '专家列表');
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    XLSX.writeFile(workbook, `${fileName}_${timestamp}.xlsx`);
}

// 新增：从 JSON 数组导入专家数据（用于测试与数据恢复）
/**
 * 从 JSON 数组导入专家数据（覆盖式导入）。
 * @param {Array<object>} experts 专家数组
 * @returns {Promise<boolean>} 导入完成返回 true
 */
async function importFromJSON(experts) {
    if (!Array.isArray(experts)) throw new Error('入参必须为专家数组');
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // 先清空
    await new Promise((resolve, reject) => {
        const clearReq = store.clear();
        clearReq.onsuccess = () => resolve();
        clearReq.onerror = () => reject(clearReq.error);
    });

    // 批量导入
    for (const expert of experts) {
        await new Promise((resolve, reject) => {
            const req = store.put(expert);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
    return true;
}

// 暴露公共API
window.DB = {
    openDB,
    getAllExperts,
    queryExperts,
    addExpert,
    updateExpert,
    deleteExpert,
    getDesignatedExpert,
    setDesignatedExpert,
    initDB,
    backupDB,
    exportToExcel,
    importFromJSON
};