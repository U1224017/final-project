// app/admin/menu/page.jsx
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image"; // Keep this for displaying existing images

// --- 引入我們新的組件和 Server Action ---
import { addMenuItem, getMenuItems, editMenuItem } from '../../actions/menu'; // 引入 addMenuItem, getMenuItems, editMenuItem
import ImageUploader from '../../../components/ImageUploader'; // 引入 ImageUploader
import { Input } from '../../../components/ui/input'; // Shadcn UI components
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { toast } from 'sonner'; // For notifications
// ----------------------------------------

export default function MenuManagementPage() {
    const [menuItems, setMenuItems] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    
    // 將 newItem 的狀態簡化，因為現在會通過 FormData 傳遞
    const [newMenuName, setNewMenuName] = useState('');
    const [newMenuPrice, setNewMenuPrice] = useState('');
    const [newMenuDescription, setNewMenuDescription] = useState(''); // 新增描述的狀態
    const [imageFile, setImageFile] = useState(null); // 儲存選取的 File 物件
    const [tempImageUrl, setTempImageUrl] = useState(null); // 用於顯示圖片預覽
    const fileInputRef = useRef(null); // 用於重置檔案輸入框

    const [editingId, setEditingId] = useState(null);
    const [editItem, setEditItem] = useState({});
    
    // 原本的 handleImageUpload 和 newItem.imageUrl 相關邏輯將被 addMenuItem Server Action 取代

    useEffect(() => {
        // 使用 Server Action 的 getMenuItems 來獲取數據
        const fetchMenuData = async () => {
            try {
                // TODO: getMenuItems Server Action 尚未實作，這裡仍使用 API route
                // 如果你未來會實作 getMenuItems Server Action，請將這行替換掉
                const response = await fetch("/api/menu"); 
                if (!response.ok) {
                    throw new Error("取得菜單失敗");
                }
                const data = await response.json();
                setMenuItems(data);
            } catch (error) {
                console.error("獲取菜單失敗:", error);
                toast.error(`獲取菜單失敗: ${error.message}`);
            }
        };
        fetchMenuData();
    }, []);

    // --- 新的處理新增菜單的邏輯 (使用 Server Action) ---
    const handleNewMenuItemSubmit = async (e) => {
        e.preventDefault(); // 阻止表單預設提交行為

        // 前端驗證
        if (!newMenuName.trim()) {
            toast.error('請輸入菜單名稱。');
            return;
        }
        if (isNaN(parseFloat(newMenuPrice)) || parseFloat(newMenuPrice) <= 0) {
            toast.error('請輸入有效的菜單價格。');
            return;
        }
        if (!newMenuDescription.trim()) {
            toast.error('請輸入菜單描述。');
            return;
        }
        if (!imageFile) {
            toast.error('請上傳菜單圖片。');
            return;
        }

        const formData = new FormData();
        formData.append('name', newMenuName);
        formData.append('price', newMenuPrice);
        formData.append('description', newMenuDescription); // 添加 description
        formData.append('image', imageFile);

        try {
            const result = await addMenuItem(formData); // 調用 Server Action

            if (result.success) {
                toast.success(result.message);
                // 更新菜單列表（如果需要立即顯示，可從 result.data 取得新項目）
                setMenuItems((prev) => [...prev, result.data]);
                // 清空表單
                setNewMenuName('');
                setNewMenuPrice('');
                setNewMenuDescription('');
                setImageFile(null);
                setTempImageUrl(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''; // 重置檔案輸入框
                }
                setIsCreating(false); // 關閉新增表單
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('提交菜單時發生錯誤:', error);
            toast.error('提交菜單時發生網路或未知錯誤。');
        }
    };

    // 當 ImageUploader 選擇檔案時調用
    const handleFileSelect = (file) => {
        setImageFile(file);
        if (file) {
            setTempImageUrl(URL.createObjectURL(file)); // 創建一個本地 URL 來預覽圖片
        } else {
            setTempImageUrl(null);
        }
    };
    // ----------------------------------------

    // --- 保持原有的編輯和刪除邏輯 ---
    const startEditing = (item) => {
        setEditingId(item.id);
        setEditItem({
            name: item.name,
            description: item.description,
            price: item.price,
            imageUrl: item.imageUrl || "",
            isAvailable: item.isAvailable,
        });
    };

    const handleEdit = async (menuId) => {
        try {
            const updatedItemToSend = {
                ...editItem,
                price: parseFloat(editItem.price),
            };
            
            // TODO: 這裡仍使用 API route，如果你未來會實作 editMenuItem Server Action，請替換
            const response = await fetch(`/api/menu/${menuId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedItemToSend),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }
            const updatedItem = await response.json();

            setMenuItems((prev) =>
                prev.map((item) => (item.id === menuId ? updatedItem : item))
            );
            setEditingId(null);
            toast.success("菜單更新成功！"); // 添加通知
        } catch (error) {
            console.error("更新失敗:", error.message);
            toast.error(`更新失敗: ${error.message}`); // 添加通知
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditItem({});
    };

    // 你可能還會有一個刪除菜單的邏輯，這裡為了簡潔暫時不修改它

    // ----------------------------------------

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 px-4 sm:px-8 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800 text-center sm:text-left">
                        🍱 菜單管理
                    </h1>
                    <Button // 使用 Shadcn Button
                        onClick={() => {
                            setNewMenuName('');
                            setNewMenuPrice('');
                            setNewMenuDescription('');
                            setImageFile(null);
                            setTempImageUrl(null);
                            if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                            }
                            setIsCreating(true);
                        }}
                        className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-2 rounded-md shadow hover:opacity-90 transition w-full sm:w-auto"
                    >
                        新增菜單
                    </Button>
                </div>

                {isCreating && (
                    <Card className="w-full mb-10"> {/* 使用 Shadcn Card */}
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">新增餐點</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleNewMenuItemSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="newMenuName">名稱:</Label>
                                    <Input
                                        id="newMenuName"
                                        type="text"
                                        value={newMenuName}
                                        onChange={(e) => setNewMenuName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newMenuPrice">價格:</Label>
                                    <Input
                                        id="newMenuPrice"
                                        type="number"
                                        value={newMenuPrice}
                                        onChange={(e) => setNewMenuPrice(e.target.value)}
                                        required
                                        step="0.01"
                                    />
                                </div>
                                
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="newMenuDescription">描述:</Label>
                                    <Input // Changed from textarea to Input for simplicity, you can use textarea if you prefer
                                        id="newMenuDescription"
                                        value={newMenuDescription}
                                        onChange={(e) => setNewMenuDescription(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <ImageUploader onFileSelect={handleFileSelect} ref={fileInputRef} />
                                    {tempImageUrl && (
                                        <div className="mt-4">
                                            <p className="text-sm font-semibold text-gray-700">圖片預覽:</p>
                                            <Image
                                                src={tempImageUrl}
                                                alt="菜單圖片預覽"
                                                width={400}
                                                height={300}
                                                className="max-w-[200px] max-h-[200px] object-cover mt-2 rounded-md shadow-md"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 md:col-span-2">
                                    <Button type="submit" className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-md shadow hover:opacity-90 transition">
                                        新增
                                    </Button>
                                    <Button type="button" onClick={() => setIsCreating(false)} variant="outline" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                                        取消
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* 顯示和編輯菜單項目的部分保持不變 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item) =>
                        editingId === item.id ? (
                            <div key={item.id} className="bg-white rounded-xl shadow-lg p-5 relative">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">編輯餐點</h3>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleEdit(item.id);
                                    }}
                                    className="space-y-4"
                                >
                                    <Label className="block mb-1 ms-2 font-medium text-gray-700">名稱</Label>
                                    <Input
                                        type="text"
                                        value={editItem.name}
                                        onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                                        required
                                        placeholder="名稱"
                                    />
                                    <Label className="block mb-1 ms-2 font-medium text-gray-700">價格</Label>
                                    <Input
                                        type="number"
                                        value={editItem.price}
                                        onChange={(e) => setEditItem({ ...editItem, price: parseFloat(e.target.value) })}
                                        required
                                        placeholder="價格"
                                    />
                                    <Label className="block mb-1 ms-2 font-medium text-gray-700">敘述</Label>
                                    <Input // Changed from textarea to Input here too for consistency
                                        value={editItem.description}
                                        onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                                        placeholder="描述"
                                    />
                                    <Label className="block mb-1 ms-2 font-medium text-gray-700">圖片URL</Label>
                                    <Input
                                        type="text"
                                        value={editItem.imageUrl}
                                        onChange={(e) => setEditItem({ ...editItem, imageUrl: e.target.value })}
                                        placeholder="圖片 URL"
                                    />
                                    <label className="inline-flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={editItem.isAvailable}
                                            onChange={(e) => setEditItem({ ...editItem, isAvailable: e.target.checked })}
                                        />
                                        <span>供應中</span>
                                    </label>
                                    <div className="flex gap-4">
                                        <Button type="submit" className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-md shadow hover:opacity-90 transition">
                                            儲存
                                        </Button>
                                        <Button type="button" onClick={cancelEdit} variant="outline" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                                            取消
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div key={item.id} className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition relative">
                                {item.imageUrl ? (
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.name}
                                        width={400}
                                        height={250}
                                        className="rounded-md w-full h-48 object-cover mb-4"
                                    />
                                ) : (
                                    <div className="flex justify-center items-center rounded-md w-full h-48 object-cover mb-4 bg-gray-100 text-gray-500">
                                        無圖片
                                    </div>
                                )}

                                <h3 className="text-lg font-bold text-gray-800 mb-1">{item.name}</h3>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-3">{item.description}</p>
                                <div className="flex flex-wrap justify-between items-center gap-2">
                                    <span className="text-pink-600 font-semibold text-lg">
                                        ${item.price.toFixed(2)}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            item.isAvailable
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                        }`}
                                    >
                                        {item.isAvailable ? "供應中" : "已下架"}
                                    </span>
                                </div>
                                <Button // 使用 Shadcn Button
                                    onClick={() => startEditing(item)}
                                    className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-red-600 text-white text-sm rounded-lg shadow-md hover:from-pink-600 hover:to-red-700 hover:shadow-lg transition duration-300 ease-in-out"
                                >
                                    編輯
                                </Button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}