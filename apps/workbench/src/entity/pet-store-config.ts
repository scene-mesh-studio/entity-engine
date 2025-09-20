import type { IEntityView, IEntityModel } from '@scenemesh/entity-engine';

// 宠物用品商店管理系统 元数据配置
// 仅使用在现有配置中已出现过的: 字段类型/视图类型(widget 组件)

// =============== Models ===============
export const models: IEntityModel[] = [
  // 品牌
  {
    name: 'petBrand',
    title: '品牌',
    description: '宠物用品品牌',
    fields: [
      { name: 'name', title: '品牌名称', type: 'string', isRequired: true, searchable: true },
      { name: 'logo', title: '品牌Logo', type: 'binary' },
      { name: 'description', title: '品牌描述', type: 'string' },
    ],
  },
  // 分类（简单父级引用可后续拓展，这里保持扁平）
  {
    name: 'petCategory',
    title: '商品分类',
    description: '宠物用品分类',
    fields: [
      { name: 'name', title: '分类名称', type: 'string', isRequired: true, searchable: true },
      { name: 'description', title: '分类描述', type: 'string' },
    ],
  },
  // 供应商
  {
    name: 'petSupplier',
    title: '供应商',
    description: '商品供应商',
    fields: [
      { name: 'name', title: '供应商名称', type: 'string', isRequired: true, searchable: true },
      { name: 'contactEmail', title: '联系邮箱', type: 'string' },
      { name: 'address', title: '地址', type: 'string' },
    ],
  },
  // 商品
  {
    name: 'petProduct',
    title: '商品',
    description: '宠物用品商品',
    fields: [
      { name: 'name', title: '商品名称', type: 'string', isRequired: true, searchable: true },
      { name: 'sku', title: 'SKU', type: 'string', isRequired: true, searchable: true },
      {
        name: 'category',
        title: '分类',
        type: 'many_to_one',
        refModel: 'petCategory',
        isRequired: true,
      },
      { name: 'brand', title: '品牌', type: 'many_to_one', refModel: 'petBrand' },
      { name: 'supplier', title: '供应商', type: 'many_to_one', refModel: 'petSupplier' },
      { name: 'price', title: '售价', type: 'number', isRequired: true },
      { name: 'cost', title: '成本', type: 'number' },
      { name: 'stock', title: '库存', type: 'number', isRequired: true },
      {
        name: 'status',
        title: '状态',
        type: 'enum',
        typeOptions: {
          options: [
            { value: 'active', label: '上架' },
            { value: 'inactive', label: '下架' },
          ],
        },
        isRequired: true,
      },
      { name: 'coverImage', title: '主图', type: 'binary' },
      { name: 'tags', title: '标签', type: 'array' },
      { name: 'description', title: '商品描述', type: 'string' },
    ],
  },
  // 库存调整
  {
    name: 'inventoryAdjustment',
    title: '库存调整',
    description: '库存变动记录',
    fields: [
      {
        name: 'product',
        title: '商品',
        type: 'many_to_one',
        refModel: 'petProduct',
        isRequired: true,
      },
      { name: 'quantity', title: '调整数量', type: 'number', isRequired: true },
      {
        name: 'reason',
        title: '原因',
        type: 'enum',
        typeOptions: {
          options: [
            { value: 'purchase', label: '采购' },
            { value: 'sale', label: '销售' },
            { value: 'loss', label: '损耗' },
          ],
        },
        isRequired: true,
      },
      { name: 'note', title: '备注', type: 'string' },
      { name: 'createdAt', title: '创建时间', type: 'date' },
    ],
  },
  // 客户
  {
    name: 'customer',
    title: '客户',
    description: '购买客户',
    fields: [
      { name: 'name', title: '客户名称', type: 'string', isRequired: true, searchable: true },
      { name: 'email', title: '邮箱', type: 'string', searchable: true },
      { name: 'phone', title: '电话', type: 'string' },
      { name: 'avatar', title: '头像', type: 'binary' },
    ],
  },
  // 订单项
  {
    name: 'orderItem',
    title: '订单项',
    description: '订单明细',
    fields: [
      { name: 'order', title: '订单', type: 'many_to_one', refModel: 'order', isRequired: true },
      {
        name: 'product',
        title: '商品',
        type: 'many_to_one',
        refModel: 'petProduct',
        isRequired: true,
      },
      { name: 'quantity', title: '数量', type: 'number', isRequired: true },
      { name: 'unitPrice', title: '单价', type: 'number', isRequired: true },
      { name: 'subtotal', title: '小计', type: 'number', isRequired: true },
    ],
  },
  // 订单
  {
    name: 'order',
    title: '订单',
    description: '客户订单',
    fields: [
      { name: 'orderNo', title: '订单号', type: 'string', isRequired: true, searchable: true },
      {
        name: 'customer',
        title: '客户',
        type: 'many_to_one',
        refModel: 'customer',
        isRequired: true,
      },
      {
        name: 'status',
        title: '状态',
        type: 'enum',
        typeOptions: {
          options: [
            { value: 'pending', label: '待支付' },
            { value: 'paid', label: '已支付' },
            { value: 'shipped', label: '已发货' },
            { value: 'completed', label: '已完成' },
            { value: 'canceled', label: '已取消' },
          ],
        },
        isRequired: true,
      },
      { name: 'totalAmount', title: '总金额', type: 'number', isRequired: true },
      { name: 'createdAt', title: '创建时间', type: 'date' },
      { name: 'items', title: '订单项', type: 'one_to_many', refModel: 'orderItem' },
      { name: 'remark', title: '备注', type: 'string' },
    ],
  },
];

// =============== Views ===============
export const views: IEntityView[] = [
  // 商品列表 (Grid)
  {
    name: 'petProductGridView',
    title: '商品列表',
    modelName: 'petProduct',
    description: '商品网格视图',
    viewType: 'grid',
    viewOptions: { mode: 'grid' },
    items: [
      { name: 'name', title: '商品名称', width: 180 },
      { name: 'sku', title: 'SKU', width: 120 },
      { name: 'category', title: '分类', width: 120 },
      { name: 'brand', title: '品牌', width: 120 },
      { name: 'price', title: '售价', width: 100 },
      { name: 'stock', title: '库存', width: 100 },
      { name: 'status', title: '状态', width: 100 },
      { name: 'coverImage', title: '主图', widget: 'image', width: 100 },
      { name: 'description', title: '描述', flex: 1 },
    ],
    hilites: [
      { when: 'stock <= 0', color: '#FFE9D5' },
      { when: 'status === "inactive"', color: '#f0f8fe' },
    ],
  },
  // 商品表单
  {
    name: 'petProductFormView',
    title: '商品',
    modelName: 'petProduct',
    description: '商品表单视图',
    viewType: 'form',
    density: 'medium',
    items: [
      { name: 'name', title: '商品名称', spanCols: 6 },
      { name: 'sku', title: 'SKU', spanCols: 6 },
      { name: 'category', title: '分类', spanCols: 6 },
      { name: 'brand', title: '品牌', spanCols: 6 },
      { name: 'supplier', title: '供应商', spanCols: 12 },
      { name: 'price', title: '售价', spanCols: 4 },
      { name: 'cost', title: '成本', spanCols: 4 },
      { name: 'stock', title: '库存', spanCols: 4 },
      { name: 'status', title: '状态', spanCols: 6 },
      { name: 'coverImage', title: '主图', widget: 'image', spanCols: 6 },
      { name: 'tags', title: '标签', spanCols: 12 },
      { name: 'description', title: '商品描述', widget: 'richeditor', spanCols: 12 },
    ],
  },
  // 订单列表
  {
    name: 'orderGridView',
    title: '订单列表',
    modelName: 'order',
    description: '订单网格视图',
    viewType: 'grid',
    items: [
      { name: 'orderNo', title: '订单号', width: 140 },
      { name: 'customer', title: '客户', width: 120 },
      { name: 'status', title: '状态', width: 100 },
      { name: 'totalAmount', title: '总金额', width: 100 },
      { name: 'createdAt', title: '创建时间', widget: 'date', width: 140 },
      { name: 'remark', title: '备注', flex: 1 },
    ],
  },
  // 订单表单
  {
    name: 'orderFormView',
    title: '订单',
    modelName: 'order',
    description: '订单编辑视图',
    viewType: 'form',
    density: 'medium',
    items: [
      { name: 'orderNo', title: '订单号', spanCols: 6 },
      { name: 'customer', title: '客户', spanCols: 6 },
      { name: 'status', title: '状态', spanCols: 6 },
      { name: 'totalAmount', title: '总金额', spanCols: 6 },
      { name: 'createdAt', title: '创建时间', widget: 'date', spanCols: 6 },
      {
        name: 'remark',
        title: '备注',
        widget: 'textfield',
        widgetOptions: { multiline: true },
        spanCols: 12,
      },
      { name: 'items', title: '订单项', widget: 'references', spanCols: 12 },
    ],
  },
  // ====== 品牌 grid & form ======
  {
    name: 'petBrandGridView',
    title: '品牌列表',
    modelName: 'petBrand',
    description: '品牌网格视图',
    viewType: 'grid',
    items: [
      { name: 'name', title: '品牌名称', width: 180 },
      { name: 'logo', title: 'Logo', widget: 'image', width: 100 },
      { name: 'description', title: '描述', flex: 1 },
    ],
  },
  {
    name: 'petBrandFormView',
    title: '品牌',
    modelName: 'petBrand',
    description: '品牌表单视图',
    viewType: 'form',
    density: 'medium',
    items: [
      { name: 'name', title: '品牌名称', spanCols: 6 },
      { name: 'logo', title: 'Logo', widget: 'image', spanCols: 6 },
      {
        name: 'description',
        title: '品牌描述',
        widget: 'textfield',
        widgetOptions: { multiline: true },
        spanCols: 12,
      },
    ],
  },
  // ====== 分类 grid & form ======
  {
    name: 'petCategoryGridView',
    title: '分类列表',
    modelName: 'petCategory',
    description: '分类网格视图',
    viewType: 'grid',
    items: [
      { name: 'name', title: '分类名称', width: 200 },
      { name: 'description', title: '分类描述', flex: 1 },
    ],
  },
  {
    name: 'petCategoryFormView',
    title: '分类',
    modelName: 'petCategory',
    description: '分类表单视图',
    viewType: 'form',
    density: 'medium',
    items: [
      { name: 'name', title: '分类名称', spanCols: 6 },
      {
        name: 'description',
        title: '分类描述',
        widget: 'textfield',
        widgetOptions: { multiline: true },
        spanCols: 12,
      },
    ],
  },
  // ====== 供应商 grid & form ======
  {
    name: 'petSupplierGridView',
    title: '供应商列表',
    modelName: 'petSupplier',
    description: '供应商网格视图',
    viewType: 'grid',
    items: [
      { name: 'name', title: '供应商名称', width: 200 },
      { name: 'contactEmail', title: '邮箱', width: 200 },
      { name: 'address', title: '地址', flex: 1 },
    ],
  },
  {
    name: 'petSupplierFormView',
    title: '供应商',
    modelName: 'petSupplier',
    description: '供应商表单视图',
    viewType: 'form',
    density: 'medium',
    items: [
      { name: 'name', title: '供应商名称', spanCols: 6 },
      { name: 'contactEmail', title: '联系邮箱', spanCols: 6 },
      {
        name: 'address',
        title: '地址',
        widget: 'textfield',
        widgetOptions: { multiline: true },
        spanCols: 12,
      },
    ],
  },
  // ====== 库存调整 grid & form ======
  {
    name: 'inventoryAdjustmentGridView',
    title: '库存调整列表',
    modelName: 'inventoryAdjustment',
    description: '库存调整网格视图',
    viewType: 'grid',
    items: [
      { name: 'product', title: '商品', width: 200 },
      { name: 'quantity', title: '数量', width: 100 },
      { name: 'reason', title: '原因', width: 120 },
      { name: 'createdAt', title: '创建时间', widget: 'datetime', width: 160 },
      { name: 'note', title: '备注', flex: 1 },
    ],
  },
  {
    name: 'inventoryAdjustmentFormView',
    title: '库存调整',
    modelName: 'inventoryAdjustment',
    description: '库存调整表单视图',
    viewType: 'form',
    density: 'medium',
    items: [
      { name: 'product', title: '商品', spanCols: 6 },
      { name: 'quantity', title: '数量', spanCols: 6 },
      { name: 'reason', title: '原因', spanCols: 6 },
      { name: 'createdAt', title: '创建时间', widget: 'datetime', spanCols: 6 },
      {
        name: 'note',
        title: '备注',
        widget: 'textfield',
        widgetOptions: { multiline: true },
        spanCols: 12,
      },
    ],
  },
  // ====== 客户 grid & form ======
  {
    name: 'customerGridView',
    title: '客户列表',
    modelName: 'customer',
    description: '客户网格视图',
    viewType: 'grid',
    items: [
      { name: 'name', title: '客户名称', width: 180 },
      { name: 'email', title: '邮箱', width: 200 },
      { name: 'phone', title: '电话', width: 160 },
      { name: 'avatar', title: '头像', widget: 'image', width: 100 },
    ],
  },
  {
    name: 'customerFormView',
    title: '客户',
    modelName: 'customer',
    description: '客户表单视图',
    viewType: 'form',
    density: 'medium',
    items: [
      { name: 'name', title: '客户名称', spanCols: 6 },
      { name: 'email', title: '邮箱', spanCols: 6 },
      { name: 'phone', title: '电话', spanCols: 6 },
      { name: 'avatar', title: '头像', widget: 'image', spanCols: 6 },
    ],
  },
  // ====== 订单项 grid & form ======
  {
    name: 'orderItemGridView',
    title: '订单项列表',
    modelName: 'orderItem',
    description: '订单项网格视图',
    viewType: 'grid',
    items: [
      { name: 'order', title: '订单', width: 140 },
      { name: 'product', title: '商品', width: 180 },
      { name: 'quantity', title: '数量', width: 80 },
      { name: 'unitPrice', title: '单价', width: 100 },
      { name: 'subtotal', title: '小计', width: 100 },
    ],
  },
  {
    name: 'orderItemFormView',
    title: '订单项',
    modelName: 'orderItem',
    description: '订单项表单视图',
    viewType: 'form',
    density: 'medium',
    items: [
      { name: 'order', title: '订单', spanCols: 6 },
      { name: 'product', title: '商品', spanCols: 6 },
      { name: 'quantity', title: '数量', spanCols: 4 },
      { name: 'unitPrice', title: '单价', spanCols: 4 },
      { name: 'subtotal', title: '小计', spanCols: 4 },
    ],
  },
  // 订单主从视图 (mastail)
  {
    name: 'orderMastailView',
    title: '订单管理',
    modelName: 'order',
    description: '订单主从视图',
    viewType: 'mastail',
    density: 'medium',
    items: [
      {
        name: 'orderList',
        title: '订单列表',
        spanCols: 3,
        widget: 'list',
        widgetOptions: {
          titleFieldName: 'orderNo',
          subtitleFieldName: 'status',
        },
      },
      {
        name: 'panel',
        title: '面板',
        spanCols: 9,
        fields: [
          {
            name: 'mainTab',
            title: '标签',
            spanCols: 12,
            widget: 'tab',
            fields: [
              {
                name: 'baseInfo',
                title: '订单信息',
                width: 200,
                widget: 'action',
                icon: 'material-icon-theme:settings',
                widgetOptions: {
                  actionType: 'view',
                  payload: { modelName: 'order', viewType: 'form', viewName: 'orderFormView' },
                },
              },
              {
                name: 'itemsTab',
                title: '订单项',
                width: 200,
                widget: 'action',
                icon: 'material-icon-theme:tree',
                widgetOptions: {
                  actionType: 'reference-view',
                  payload: { fromFieldName: 'items', toModelName: 'orderItem', viewType: 'grid' },
                },
              },
            ],
          },
        ],
      },
    ],
  },
  // 仪表盘视图 (简单统计)
  {
    name: 'petStoreDashboardView',
    title: '商店仪表盘',
    modelName: '__default__',
    description: '商店运营概览',
    viewType: 'dashboard',
    items: [
      {
        name: 'banner',
        title: '欢迎',
        widget: 'banner',
        spanCols: 8,
        widgetOptions: {
          items: [
            {
              title: '宠物用品商店',
              subtitle: '高效管理库存与订单',
              color: '#fff',
              image: 'https://images.pexels.com/photos/573186/pexels-photo-573186.jpeg',
            },
            {
              title: '营销与促销',
              subtitle: '打造爆款组合',
              color: '#fff',
              image: 'https://images.pexels.com/photos/1404819/pexels-photo-1404819.jpeg',
            },
          ],
        },
      },
      {
        name: 'statProducts',
        title: '商品数',
        widget: 'statcard',
        spanCols: 4,
        widgetOptions: { value: 0, modelName: 'petProduct', query: { pageSize: 1, pageIndex: 1 } },
      },
      {
        name: 'statOrders',
        title: '订单数',
        widget: 'statcard',
        spanCols: 4,
        widgetOptions: { value: 0, modelName: 'order', query: { pageSize: 1, pageIndex: 1 } },
      },
      {
        name: 'statCustomers',
        title: '客户数',
        widget: 'statcard',
        spanCols: 4,
        widgetOptions: { value: 0, modelName: 'customer', query: { pageSize: 1, pageIndex: 1 } },
      },
      {
        name: 'statAdjust',
        title: '库存调整',
        widget: 'statcard',
        spanCols: 4,
        widgetOptions: {
          value: 0,
          modelName: 'inventoryAdjustment',
          query: { pageSize: 1, pageIndex: 1 },
        },
      },
      {
        name: 'recentProducts',
        title: '最新商品',
        widget: 'datalist',
        spanCols: 12,
        widgetOptions: { modelName: 'petProduct' },
      },
    ],
  },
  // 商店入口 Shell 视图
  {
    name: 'petStoreShellView',
    title: '宠物商店工作台',
    modelName: '__default__',
    description: '宠物用品商店主壳层视图',
    viewType: 'shell',
    viewOptions: {},
    items: [
      {
        name: 'header',
        title: '宠物商店',
        widget: 'logo',
        widgetOptions: {
          logoUrl: 'https://lucide.dev/logo.light.svg',
          icon: 'material-icon-theme:store',
          title: '宠物用品商店',
          logoWidth: 28,
          logoHeight: 28,
        },
        spanCols: 12,
        flex: 1,
      },
      {
        name: 'navbar',
        title: '导航',
        widget: 'navigator',
        widgetOptions: { padding: 2, spacing: 2 },
        spanCols: 12,
        flex: 1,
        fields: [
          {
            name: 'overview',
            title: '概览',
            fields: [
              {
                name: 'dashboard',
                title: '仪表盘',
                widget: 'action',
                icon: 'material-icon-theme:chart-line',
                widgetOptions: {
                  actionType: 'view',
                  payload: {
                    modelName: '__default__',
                    viewType: 'dashboard',
                    viewName: 'petStoreDashboardView',
                  },
                },
              },
            ],
          },
          {
            name: 'catalog',
            title: '商品',
            fields: [
              {
                name: 'product-grid',
                title: '商品列表',
                widget: 'action',
                icon: 'material-icon-theme:redux-action',
                widgetOptions: {
                  actionType: 'view',
                  payload: {
                    modelName: 'petProduct',
                    viewType: 'grid',
                    viewName: 'petProductGridView',
                  },
                },
              },
              {
                name: 'product-new',
                title: '新建商品',
                widget: 'action',
                icon: 'material-icon-theme:settings',
                widgetOptions: {
                  actionType: 'view',
                  payload: {
                    modelName: 'petProduct',
                    viewType: 'form',
                    viewName: 'petProductFormView',
                    mode: 'create',
                  },
                },
              },
              {
                name: 'brand-grid',
                title: '品牌',
                widget: 'action',
                icon: 'material-icon-theme:folder-git',
                widgetOptions: {
                  actionType: 'view',
                  payload: { modelName: 'petBrand', viewType: 'grid' },
                },
              },
              {
                name: 'category-grid',
                title: '分类',
                widget: 'action',
                icon: 'material-icon-theme:folder-routes',
                widgetOptions: {
                  actionType: 'view',
                  payload: { modelName: 'petCategory', viewType: 'grid' },
                },
              },
            ],
          },
          {
            name: 'supplier_root',
            title: '供应商',
            fields: [
              {
                name: 'supplier-grid',
                title: '供应商列表',
                widget: 'action',
                icon: 'material-icon-theme:database',
                widgetOptions: {
                  actionType: 'view',
                  payload: { modelName: 'petSupplier', viewType: 'grid' },
                },
              },
            ],
          },
          {
            name: 'order_root',
            title: '订单',
            fields: [
              {
                name: 'order-grid',
                title: '订单列表',
                widget: 'action',
                icon: 'material-icon-theme:taskfile',
                widgetOptions: {
                  actionType: 'view',
                  payload: { modelName: 'order', viewType: 'grid', viewName: 'orderGridView' },
                },
              },
              {
                name: 'order-mastail',
                title: '订单管理',
                widget: 'action',
                icon: 'material-icon-theme:tree',
                widgetOptions: {
                  actionType: 'view',
                  payload: {
                    modelName: 'order',
                    viewType: 'mastail',
                    viewName: 'orderMastailView',
                  },
                },
              },
            ],
          },
          {
            name: 'customer_root',
            title: '客户',
            fields: [
              {
                name: 'customer-grid',
                title: '客户列表',
                widget: 'action',
                icon: 'material-icon-theme:database',
                widgetOptions: {
                  actionType: 'view',
                  payload: { modelName: 'customer', viewType: 'grid' },
                },
              },
            ],
          },
          {
            name: 'inventory_root',
            title: '库存',
            fields: [
              {
                name: 'adjust-grid',
                title: '库存调整',
                widget: 'action',
                icon: 'material-icon-theme:folder-connection',
                widgetOptions: {
                  actionType: 'view',
                  payload: { modelName: 'inventoryAdjustment', viewType: 'grid' },
                },
              },
            ],
          },
        ],
      },
      {
        name: 'main',
        title: '内容区',
        widget: 'container',
        widgetOptions: {
          padding: 2,
          spacing: 2,
          sx: { flexGrow: 1, overflow: 'auto', height: 'calc(100vh - 128px)' },
        },
        spanCols: 12,
        flex: 1,
      },
    ],
  },
];
