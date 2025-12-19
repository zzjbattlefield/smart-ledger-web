import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, ChevronLeft, ArrowUpDown, GripVertical } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { getCategories, createCategory, updateCategory, deleteCategory, Category } from '@/api/category';
import { cn } from '@/utils/cn';

// Category Modal
const CategoryModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  parents,
  currentType
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Category>) => Promise<void>;
  initialData?: Partial<Category>;
  parents: Category[];
  currentType: 1 | 2;
}) => {
  const [form, setForm] = useState<Partial<Category>>(initialData || { name: '', parent_id: 0, icon: 'default', type: currentType });
  const [saving, setSaving] = useState(false);

  // Removed problematic useEffect. Component relies on 'key' prop to reset state.

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-center">{initialData?.id ? '编辑分类' : '新建分类'}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">分类名称</label>
            <Input 
              placeholder="例如：餐饮、交通" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">父级分类</label>
            <select 
              className="w-full h-12 rounded-xl bg-gray-100 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ios-blue/20"
              value={form.parent_id}
              onChange={e => setForm({...form, parent_id: Number(e.target.value)})}
            >
              <option value={0}>无 (作为一级分类)</option>
              {parents.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>取消</Button>
          <Button className="flex-1" onClick={handleSave} isLoading={saving}>保存</Button>
        </div>
      </div>
    </div>
  );
};

// 拖拽手柄组件
// const DragHandle = () => { ... } // Removed unused component

const CategoryList = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isSorting, setIsSorting] = useState(false);
  const [currentType, setCurrentType] = useState<1 | 2>(1); // 1: Expense, 2: Income

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Partial<Category> | undefined>(undefined);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getCategories(currentType);
      // Sort parent categories
      const sortedParents = data.data.sort((a: Category, b: Category) => (a.sort_order - b.sort_order));
      // Sort children
      sortedParents.forEach((p: Category) => {
        if (p.children) {
          p.children.sort((a: Category, b: Category) => (a.sort_order - b.sort_order));
        }
      });
      setCategories(sortedParents);
      
      // Default expand all
      if (Object.keys(expanded).length === 0) {
        const expandMap: Record<number, boolean> = {};
        data.data.forEach((c: Category) => expandMap[c.id] = true);
        setExpanded(expandMap);
      }
    } catch (error) {
      console.error('Fetch categories failed', error);
    } finally {
      setLoading(false);
    }
  }, [currentType, expanded]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleExpand = (id: number) => {

    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveCategory = async (data: Partial<Category>) => {
    try {
      if (data.id) {
        await updateCategory(data.id, data);
      } else {
        await createCategory({ ...data, type: currentType });
      }
      await fetchData();
    } catch (error) {
      console.error('Save failed', error);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteCategory(deletingId);
      await fetchData();
    } catch (error: unknown) {
      console.error('Delete failed', error);
      // @ts-expect-error: Axios error response structure
      alert(error.response?.data?.message || '删除失败，请确保该分类下无子分类');
    }
  };

  const openAdd = () => {
    setEditingCat(undefined);
    setShowEditModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setShowEditModal(true);
  };

  const confirmDelete = (id: number) => {
    setDeletingId(id);
    setShowDeleteDialog(true);
  };

  // 批量更新排序到服务器
  // const saveOrder = async (cats: Category[]) => { ... } // Removed unused function

  const handleReorderParents = (newOrder: Category[]) => {
    setCategories(newOrder);
  };

  const handleReorderChildren = (parentId: number, newChildren: Category[]) => {
    setCategories(prev => prev.map(p => 
      p.id === parentId ? { ...p, children: newChildren } : p
    ));
  };

  const saveAllOrders = async () => {
    // 关闭排序模式时，批量保存
    setLoading(true);
    try {
      const promises: Promise<unknown>[] = [];
      categories.forEach((p, pIdx) => {
        if (p.sort_order !== pIdx) {
          promises.push(updateCategory(p.id, { sort_order: pIdx }));
        }
        p.children?.forEach((c, cIdx) => {
          if (c.sort_order !== cIdx) {
            promises.push(updateCategory(c.id, { sort_order: cIdx }));
          }
        });
      });
      await Promise.all(promises);
      await fetchData(); // Refresh
    } catch (error) {
      console.error('Save order failed', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSorting = () => {
    if (isSorting) {
      saveAllOrders();
    }
    setIsSorting(!isSorting);
  };

  return (
    <div className="min-h-screen bg-ios-background pt-14 pb-safe">
      <Header 
        title={isSorting ? "拖拽排序" : "分类管理"}
        leftAction={
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-ios-blue px-0 font-normal">
            <ChevronLeft size={24} />
            返回
          </Button>
        }
        rightAction={
          <div className="flex items-center space-x-1">
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={toggleSorting} 
               className={cn("px-2", isSorting ? "text-ios-blue bg-blue-50" : "text-gray-400")}
             >
              <ArrowUpDown size={20} />
            </Button>
            {!isSorting && (
              <Button variant="ghost" size="sm" onClick={openAdd} className="text-ios-blue px-0">
                <Plus size={24} />
              </Button>
            )}
          </div>
        }
      />
      
      {/* Type Toggle Tabs */}
      <div className="px-4 py-2 bg-ios-background sticky top-14 z-10">
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button 
            className={cn("flex-1 py-1.5 text-sm font-medium rounded-md transition-all", currentType === 1 ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}
            onClick={() => setCurrentType(1)}
          >
            支出
          </button>
          <button 
            className={cn("flex-1 py-1.5 text-sm font-medium rounded-md transition-all", currentType === 2 ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}
            onClick={() => setCurrentType(2)}
          >
            收入
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading && !isSorting ? (
          <div className="text-center text-gray-400 py-10">加载中...</div>
        ) : (
          <Reorder.Group axis="y" values={categories} onReorder={handleReorderParents}>
            {categories.map(parent => (
              <Reorder.Item key={parent.id} value={parent} dragListener={isSorting}>
                <div className="bg-white rounded-xl overflow-hidden shadow-sm mb-3">
                  {/* Parent Row */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-50 last:border-none">
                    <div 
                      className="flex items-center flex-1 cursor-pointer"
                      onClick={() => !isSorting && toggleExpand(parent.id)}
                    >
                      {!isSorting && (
                        parent.children && parent.children.length > 0 ? (
                          expanded[parent.id] ? <ChevronDown size={20} className="text-gray-400 mr-2" /> : <ChevronRight size={20} className="text-gray-400 mr-2" />
                        ) : (
                          <div className="w-5 mr-2" />
                        )
                      )}
                      
                      <CategoryIcon name={parent.name} size="sm" className="mr-3" />
                      <span className="font-medium text-gray-900">{parent.name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {isSorting ? (
                        <div className="text-gray-300 px-2 cursor-grab active:cursor-grabbing">
                          <GripVertical size={20} />
                        </div>
                      ) : (
                        <>
                          <button onClick={() => openEdit(parent)} className="p-2 text-gray-400 hover:text-ios-blue active:bg-gray-100 rounded-lg">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => confirmDelete(parent.id)} className="p-2 text-gray-400 hover:text-ios-red active:bg-gray-100 rounded-lg">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Children Rows */}
                  {expanded[parent.id] && parent.children && (
                    <Reorder.Group 
                      axis="y" 
                      values={parent.children} 
                      onReorder={(newChildren) => handleReorderChildren(parent.id, newChildren)}
                    >
                      {parent.children.map(child => (
                        <Reorder.Item key={child.id} value={child} dragListener={isSorting}>
                          <div className="flex items-center justify-between p-3 pl-12 bg-gray-50/50 border-t border-gray-100">
                             <div className="flex items-center">
                               <CategoryIcon name={child.name} size="sm" className="w-6 h-6 text-[10px] mr-3 opacity-80" />
                               <span className="text-sm text-gray-700">{child.name}</span>
                             </div>
                             <div className="flex items-center space-x-1">
                              {isSorting ? (
                                <div className="text-gray-300 px-2 cursor-grab active:cursor-grabbing">
                                  <GripVertical size={16} />
                                </div>
                              ) : (
                                <>
                                  <button onClick={() => openEdit(child)} className="p-2 text-gray-400 hover:text-ios-blue active:bg-gray-100 rounded-lg">
                                    <Pencil size={16} />
                                  </button>
                                  <button onClick={() => confirmDelete(child.id)} className="p-2 text-gray-400 hover:text-ios-red active:bg-gray-100 rounded-lg">
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  )}
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      <CategoryModal 
        key={editingCat?.id || 'new'}
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        onSave={handleSaveCategory}
        initialData={editingCat}
        parents={categories} 
        currentType={currentType}
      />

      <Dialog 
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="删除分类"
        description="确定要删除该分类吗？如果是父分类，请确保先清空其子分类。"
        confirmText="删除"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default CategoryList;