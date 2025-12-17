import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { importBills, ImportBillResponse, ImportBillError } from '@/api/bill';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, ChevronRight, Download } from 'lucide-react';
import { BillEditDialog } from './BillEditDialog';

interface BillImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BillImportDialog = ({ isOpen, onClose }: BillImportDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportBillResponse | null>(null);
  
  // For Editing Errors
  const [editError, setEditError] = useState<ImportBillError | null>(null);

  const resetState = () => {
    setFile(null);
    setResult(null);
    setEditError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setResult(null); // Clear previous result
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const { data } = await importBills(file, 'vivo'); // Hardcoded parser for now
      if (data.code === 0) {
        setResult(data.data);
        if (data.data.failed === 0) {
           // If perfect success, maybe auto close or show success?
           // Let's show success state in the dialog
        }
      } else {
        // API level error?
        console.error('Import failed', data.message);
      }
    } catch (error) {
      console.error('Import request failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = () => {
    if (!result || !editError) return;
    
    // Remove the fixed error from the list
    const newErrors = result.errors.filter(e => e.row !== editError.row);
    
    setResult({
      ...result,
      failed: result.failed - 1,
      total: result.total + 1, // Technically we successfully added one manually, so total valid count increases? Or just total imported count? Let's say total success increases.
      errors: newErrors
    });
    
    setEditError(null);
  };

  const isAllResolved = result && result.failed === 0 && (!result.errors || result.errors.length === 0);

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="导入账单">
        <div className="space-y-6">
          {/* File Selection Area */}
          {!result || (result.failed > 0 && result.errors && result.errors.length > 0) ? (
            <div className="space-y-4">
               {/* Parser Select (Mock) */}
               <div className="flex flex-col space-y-1">
                 <label className="text-sm font-medium text-gray-500">账单来源</label>
                 <select className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-ios-blue">
                   <option value="vivo">Vivo 钱包</option>
                   <option value="wx" disabled>微信支付 (Coming Soon)</option>
                   <option value="ali" disabled>支付宝 (Coming Soon)</option>
                 </select>
               </div>

               {/* File Input */}
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                   file ? 'border-ios-blue bg-blue-50/50' : 'border-gray-200 hover:border-ios-blue hover:bg-gray-50'
                 }`}
               >
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept=".xlsx" 
                   onChange={handleFileSelect}
                 />
                 
                 {file ? (
                   <div className="flex flex-col items-center text-ios-blue">
                     <FileSpreadsheet size={32} className="mb-2" />
                     <span className="font-medium text-sm text-center break-all">{file.name}</span>
                     <span className="text-xs opacity-60 mt-1">点击更换文件</span>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center text-gray-400">
                     <Upload size={32} className="mb-2" />
                     <span className="font-medium text-sm">点击上传 Excel 文件</span>
                     <span className="text-xs opacity-60 mt-1">支持 .xlsx 格式</span>
                   </div>
                 )}
               </div>

               {/* Import Button */}
               <Button 
                 onClick={handleImport} 
                 isLoading={loading}
                 disabled={!file}
                 className="w-full h-12"
               >
                 开始导入
               </Button>
            </div>
          ) : null}

          {/* Result Display */}
          {result && (
            <div className="space-y-4 animate-fadeIn">
              {/* Summary Card */}
              <div className={`rounded-xl p-4 flex items-center justify-between ${
                result.failed === 0 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
              }`}>
                <div className="flex items-center space-x-3">
                   {result.failed === 0 ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                   <div>
                     <p className="font-semibold">{result.failed === 0 ? '导入成功' : '部分导入失败'}</p>
                     <p className="text-xs opacity-80 mt-0.5">
                       共导入 {result.total + result.failed} 条，成功 {result.total} 条
                       {result.failed > 0 && <span className="font-bold ml-1">失败 {result.failed} 条</span>}
                     </p>
                   </div>
                </div>
                {result.failed === 0 && (
                   <Button variant="ghost" size="sm" onClick={handleClose} className="bg-white/50 hover:bg-white text-green-800">
                     完成
                   </Button>
                )}
              </div>

              {/* Error List */}
              {result.errors && result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500 ml-1">需手动修正 ({result.errors.length})</h4>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {result.errors.map((error, idx) => (
                      <div 
                        key={`${error.row}-${idx}`}
                        onClick={() => setEditError(error)}
                        className="bg-white border border-gray-100 rounded-lg p-3 flex items-center justify-between shadow-sm cursor-pointer hover:border-ios-blue transition-colors group"
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-500 font-bold text-xs">
                            #{error.row}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {error.message}
                            </p>
                            <div className="flex items-center text-xs text-gray-400 space-x-2 truncate">
                              {error.row_data?.['交易时间'] && <span>{error.row_data['交易时间']}</span>}
                              {error.row_data?.['交易金额'] && <span>¥{error.row_data['交易金额']}</span>}
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-ios-blue" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {isAllResolved && result.total > 0 && (
                 <div className="text-center py-4 text-gray-500">
                   <p>所有错误已处理完毕 🎉</p>
                   <Button variant="ghost" onClick={handleClose} className="mt-2 text-ios-blue">
                     关闭窗口
                   </Button>
                 </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Edit Dialog */}
      <BillEditDialog
        isOpen={!!editError}
        onClose={() => setEditError(null)}
        initialData={editError?.row_data || {}}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};
