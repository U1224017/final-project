// components/ImageUploader.jsx
'use client';

import { useState, forwardRef } from 'react'; // 引入 forwardRef
import { Input } from './ui/input';
import { Label } from './ui/label';

// 使用 forwardRef 包裝組件，以便父組件可以傳遞 ref
const ImageUploader = forwardRef(function ImageUploader({ onFileSelect }, ref) {
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setError('請選擇一個檔案。');
      setFileName('');
      onFileSelect(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('請上傳圖片檔案 (例如 PNG, JPG, JPEG, GIF 等)。');
      setFileName('');
      onFileSelect(null);
      return;
    }
    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`圖片檔案大小不能超過 ${maxSizeMB}MB。`);
      setFileName('');
      onFileSelect(null);
      return;
    }

    setFileName(file.name);
    setError(null);
    onFileSelect(file);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="image-upload">選擇圖片檔案</Label>
      <Input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        ref={ref} // 將傳入的 ref 設置給 input 元素
        className="block w-full text-sm text-gray-500
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-md file:border-0
                   file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700
                   hover:file:bg-blue-100"
      />
      {fileName && <p className="text-sm text-gray-600">已選擇檔案: {fileName}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
});

export default ImageUploader;