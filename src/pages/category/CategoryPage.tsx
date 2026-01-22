import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Dialog, Input, useToast } from '../../components/ui';
import { CategoryAvatar } from '../../components/bill';
import { useCategoryStore } from '../../store';
import type { Category } from '../../types';

// 可排序的父分类项
interface SortableParentItemProps {
  category: Category;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddChild: (parent: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  children?: React.ReactNode;
}

function SortableParentItem({
  category,
  isExpanded,
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
  children,
}: SortableParentItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChildren = category.children && category.children.length > 0;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: isDragging ? 0.5 : 1 }}
      className="card"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
        </button>
        {hasChildren ? (
          <button
            onClick={onToggleExpand}
            className="p-1 -ml-1"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
            ) : (
              <ChevronRight className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}
        <CategoryAvatar name={category.name} />
        <span className="flex-1 font-medium text-light-text dark:text-dark-text">
          {category.name}
        </span>
        <button onClick={() => onAddChild(category)} className="p-2 text-cta-blue">
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(category)}
          className="p-2 text-light-text-secondary"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(category.id)} className="p-2 text-expense-red">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {isExpanded && children}
    </motion.div>
  );
}

// 可排序的子分类项
interface SortableChildItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}

function SortableChildItem({ category, onEdit, onDelete }: SortableChildItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 pl-4">
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-3.5 h-3.5 text-light-text-secondary dark:text-dark-text-secondary" />
      </button>
      <CategoryAvatar name={category.name} size="sm" />
      <span className="flex-1 text-sm text-light-text dark:text-dark-text">
        {category.name}
      </span>
      <button
        onClick={() => onEdit(category)}
        className="p-1.5 text-light-text-secondary"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => onDelete(category.id)} className="p-1.5 text-expense-red">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function CategoryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    expenseCategories,
    incomeCategories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    isLoading,
  } = useCategoryStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeTab, setActiveTab] = useState<1 | 2>(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Form state
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<number | undefined>();

  const categories = activeTab === 1 ? expenseCategories : incomeCategories;

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setName('');
    setParentId(undefined);
    setEditingCategory(null);
  };

  const handleOpenAdd = (parent?: Category) => {
    resetForm();
    if (parent) {
      setParentId(parent.id);
    }
    setShowAddDialog(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setShowAddDialog(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('请输入分类名称');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name });
        toast.success('更新成功');
      } else {
        await createCategory({
          name,
          type: activeTab,
          parent_id: parentId,
        });
        toast.success('添加成功');
      }
      setShowAddDialog(false);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteCategory(deleteId);
      toast.success('删除成功');
      setShowDeleteDialog(false);
      setDeleteId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除失败';
      toast.error(message);
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  // 处理父分类拖动结束
  const handleParentDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      try {
        await reorderCategories(newOrder.map((c) => c.id));
        toast.success('排序已更新');
      } catch {
        toast.error('排序更新失败');
      }
    }
  };

  // 切换分类展开/折叠状态
  const toggleExpand = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // 处理子分类拖动结束
  const handleChildDragEnd = async (event: DragEndEvent, parentCategory: Category) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !parentCategory.children) return;

    const children = parentCategory.children;
    const oldIndex = children.findIndex((c) => c.id === active.id);
    const newIndex = children.findIndex((c) => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(children, oldIndex, newIndex);
      try {
        await reorderCategories(newOrder.map((c) => c.id), parentCategory.id);
        toast.success('排序已更新');
      } catch {
        toast.error('排序更新失败');
      }
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 safe-area-top">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-light-text dark:text-dark-text" />
        </button>
        <h1 className="text-lg font-semibold text-light-text dark:text-dark-text">
          分类管理
        </h1>
        <button onClick={() => handleOpenAdd()} className="p-2 -mr-2">
          <Plus className="w-6 h-6 text-cta-blue" />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex mx-4 p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl mb-4">
        <button
          onClick={() => setActiveTab(1)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 1
              ? 'bg-light-card dark:bg-dark-card text-expense-red shadow-sm'
              : 'text-light-text-secondary dark:text-dark-text-secondary'
          }`}
        >
          支出分类
        </button>
        <button
          onClick={() => setActiveTab(2)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 2
              ? 'bg-light-card dark:bg-dark-card text-income-green shadow-sm'
              : 'text-light-text-secondary dark:text-dark-text-secondary'
          }`}
        >
          收入分类
        </button>
      </div>

      {/* Category List */}
      <div className="px-4">
        {categories.length === 0 ? (
          <div className="py-20 text-center text-light-text-secondary dark:text-dark-text-secondary">
            暂无分类，点击右上角添加
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleParentDragEnd}
          >
            <SortableContext
              items={categories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {categories.map((category) => (
                  <SortableParentItem
                    key={category.id}
                    category={category}
                    isExpanded={expandedCategories.has(category.id)}
                    onToggleExpand={() => toggleExpand(category.id)}
                    onAddChild={handleOpenAdd}
                    onEdit={handleOpenEdit}
                    onDelete={confirmDelete}
                  >
                    {/* Children */}
                    {category.children && category.children.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleChildDragEnd(event, category)}
                        >
                          <SortableContext
                            items={category.children.map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {category.children.map((child) => (
                                <SortableChildItem
                                  key={child.id}
                                  category={child}
                                  onEdit={handleOpenEdit}
                                  onDelete={confirmDelete}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    )}
                  </SortableParentItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          resetForm();
        }}
        title={editingCategory ? '编辑分类' : '添加分类'}
      >
        <div className="space-y-4">
          <Input
            label="分类名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入分类名称"
            maxLength={50}
          />
          {parentId && (
            <p className="text-sm text-light-text-secondary">
              将作为子分类添加
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              取消
            </Button>
            <Button fullWidth onClick={handleSave} loading={isLoading}>
              保存
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeleteId(null);
        }}
        title="确认删除"
      >
        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
          确定要删除此分类吗？如果有子分类，需要先删除子分类。
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setShowDeleteDialog(false);
              setDeleteId(null);
            }}
          >
            取消
          </Button>
          <Button variant="danger" fullWidth onClick={handleDelete} loading={isLoading}>
            删除
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
