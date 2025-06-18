// app/actions/menu.js
'use server'; // 標記為 Server Action

import { prisma } from '@/lib/prisma'; // 引入 Prisma 客戶端
import { promises as fs } from 'fs'; // 引入 Node.js 的檔案系統模組
import path from 'path'; // 引入 Node.js 的路徑模組

// 如果未來有單獨上傳圖片的需求，可以填充這個函數
// 目前，圖片處理會整合到 addMenuItem 中
export const uploadMenuImage = async (body) => {
    console.warn("uploadMenuImage 函數目前未實作，圖片處理已整合到 addMenuItem。");
    return null;
};

/**
 * 管理員新增菜單項目
 * 接收 FormData 物件，處理圖片上傳並將菜單資訊存入資料庫。
 * @param {FormData} formData - 包含菜單名稱、價格和圖片檔案的 FormData 物件。
 * @returns {Promise<{ success: boolean, message: string, data?: any }>}
 */
export const addMenuItem = async (formData) => {
  const name = formData.get('name');
  const price = formData.get('price');
  const imageFile = formData.get('image'); // 獲取 File 物件

  // 1. 數據驗證
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return { success: false, message: '菜單名稱是必填項。' };
  }
  if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
    return { success: false, message: '價格必須是有效的正數。' };
  }
  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return { success: false, message: '圖片檔案是必填項。' };
  }

  try {
    // 2. 處理圖片儲存到 public 資料夾
    // 為了避免檔名衝突，給圖片生成一個唯一檔名
    const fileExtension = path.extname(imageFile.name); // 獲取原始副檔名
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${fileExtension}`;
    
    // 定義圖片上傳的目標目錄：/public/uploads
    // process.cwd() 返回 Node.js 進程的當前工作目錄（即專案根目錄）
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, uniqueFileName); // 完整檔案路徑

    // 檢查並創建上傳目錄 (如果 'public/uploads' 不存在)
    await fs.mkdir(uploadDir, { recursive: true });

    // 將圖片檔案的緩衝區寫入磁碟
    const bytes = await imageFile.arrayBuffer(); // 將 File 物件轉換為 ArrayBuffer
    const buffer = Buffer.from(bytes); // 將 ArrayBuffer 轉換為 Node.js Buffer
    await fs.writeFile(filePath, buffer);

    // 圖片的公開 URL 路徑，這是 Next.js 會提供的路徑
    const imageUrl = `/uploads/${uniqueFileName}`;

    // 3. 將菜單資訊存入資料庫
    const newMenuItem = await prisma.MenuItem.create({ // 注意：這裡應該是 MenuItem 模型
      data: {
        name: name.trim(), // 清除名稱前後空白
        price: parseFloat(price), // 確保價格是數字類型
        imageUrl, // 存儲圖片的相對路徑
      },
    });

    // 4. 返回成功訊息
    return { success: true, message: '菜單新增成功！', data: newMenuItem };

  } catch (error) {
    console.error('新增菜單失敗:', error);

    // 處理 Prisma 特定的錯誤，例如名稱重複 (P2002)
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return { success: false, message: '菜單名稱已存在，請使用不同的名稱。' };
    }
    // 其他一般錯誤
    return { success: false, message: `新增菜單時發生錯誤: ${error.message || '未知錯誤'}` };
  }
};

export const getMenuItems = async () => {
    // TODO: 這裡未來會實作取得所有菜單的邏輯 (使用 Prisma)
    return null;
};

export const editMenuItem = async (body, menuId) => {
    // TODO: 這裡未來會實作編輯菜單的邏輯 (使用 Prisma)
    return null;
};