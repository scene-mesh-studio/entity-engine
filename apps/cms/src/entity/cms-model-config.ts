import type { IEntityView, IEntityModel } from '@scenemesh/entity-engine';

import { z as zod } from 'zod';

export const models: IEntityModel[] = [
  {
    name: 'mediaKeyword',
    title: '媒体关键词',
    description: '媒体关键词',
    fields: [
      {
        name: 'keyword',
        title: '关键词',
        type: 'string',
        isRequired: true,
      }
    ],
  },
  {
    name: 'mediaCategory',
    title: '媒体分类',
    description: '媒体分类',
    fields: [
      {
        name: 'name',
        title: '分类名称',
        type: 'string',
        isRequired: true,
        searchable: true,
        order: 1,
        schema: zod.string().min(3, { message: '分类名称至少3个字符,建议使用英文字母!' }),
      },
      {
        name: 'image',
        title: '分类图片',
        type: 'binary',
        isRequired: true,
        order: 1,
      },
      {
        name: 'keywords',
        title: '分类关键词',
        type: 'string',
        isRequired: true,
        searchable: true,
        order: 3,
        schema: zod.string().min(3, { message: '分类关键词至少3个字符!' }),
      },
      {
        name: 'description',
        title: '分类描述',
        type: 'string',
        isRequired: true,
        searchable: true,
        order: 2,
        schema: zod.string().min(3, { message: '分类描述至少3个字符!' }),
      }
    ],
  },
  {
    name: 'article',
    title: '文章',
    description: '文章',
    fields: [
      { name: 'title', title: '文章标题', type: 'string', isRequired: true },
      { name: 'subTitle', title: '文章副标题', type: 'string', isRequired: true },
      { name: 'author', title: '文章作者', type: 'string', isRequired: true },
      { name: 'publishDate', title: '发布日期', type: 'date', isRequired: true },
      { name: 'image', title: '文章图片', type: 'binary', isRequired: true },
      { name: 'category', title: '文章分类', type: 'many_to_one', refModel: 'mediaCategory', isRequired: true },
      { name: 'keywords', title: '文章关键词', type: 'many_to_many', refModel: 'mediaKeyword' },
      { name: 'content', title: '文章内容', type: 'string', isRequired: true },
    ],
  },
];

export const views: IEntityView[] = [
  {
    name: 'mediaCategoryFormView',
    title: '媒体分类',
    modelName: 'mediaCategory',
    description: '媒体分类表单',
    viewType: 'form',
    density: 'medium',
    items: [
      { name: 'name', title: '分类名称', spanCols: 12 },
      { name: 'image', title: '分类图片', widget: 'image', spanCols: 12 },
      { name: 'keywords', title: '分类关键词', spanCols: 12 },
      { name: 'description', title: '分类描述', spanCols: 12 },
    ],
  },
  {
    name: 'mediaCategoryGridView',
    title: '媒体分类',
    modelName: 'mediaCategory',
    description: '媒体分类列表',
    viewType: 'grid',
    density: 'medium',
    items: [
      { name: 'name', title: '分类名称', spanCols: 12 },
      { name: 'image', title: '分类图片', widget: 'image', spanCols: 12 },
      { name: 'keywords', title: '分类关键词', spanCols: 12 },
      { name: 'description', title: '分类描述', spanCols: 12 },
    ],
  },
  {
    name: 'articleFormView',
    title: '文章',
    modelName: 'article',
    description: '文章表单',
    viewType: 'form',
    density: 'medium',
    items: [
      { name: 'title', title: '文章标题', spanCols: 12 },
      { name: 'subTitle', title: '文章副标题', spanCols: 12 },
      { name: 'author', title: '文章作者', spanCols: 12 },
      { name: 'publishDate', title: '发布日期', spanCols: 12 },
      { name: 'image', title: '文章图片', widget: 'image', widgetOptions: {width: 250, height: 100}, spanCols: 12 },
      { name: 'category', title: '文章分类', spanCols: 12 },
      { name: 'keywords', title: '文章关键词', widget: 'reference', widgetOptions:{ titleField: 'keyword' }, spanCols: 12 },
      { name: 'content', title: '文章内容', widget: 'richeditor', spanCols: 12 },
    ],
  },
  {
    name: 'articleGridView',
    title: '文章',
    modelName: 'article',
    description: '文章列表',
    viewType: 'grid',
    density: 'medium',
    items: [
      { name: 'title', title: '文章标题', spanCols: 12 },
      { name: 'subTitle', title: '文章副标题', spanCols: 12 },
      { name: 'author', title: '文章作者', spanCols: 12 },
      { name: 'publishDate', title: '发布日期', spanCols: 12 },
      { name: 'image', title: '文章图片', widget: 'image',  spanCols: 12 },
      { name: 'category', title: '文章分类', spanCols: 12 },
    ],
  },
  {
    name: 'articleKanbanView',
    title: '文章',
    modelName: 'article',
    description: '文章看板',
    viewType: 'kanban',
    density: 'medium',
    viewOptions: {
      //分组字段: 必须是 enum 或 array 类型
      groupByField: 'category',
      //分组排序，组内排序默认按照updatedAt降序
      groupSortDir: 'desc',
      //列宽
      columnWidth: 300,
      //卡片是否可以查看
      canbeViewed: false,
    },
    items: [
      { name: 'title', title: '文章标题', spanCols: 12 },
      { name: 'subTitle', title: '文章副标题', spanCols: 12 },
      { name: 'author', title: '文章作者', spanCols: 12 },
      { name: 'publishDate', title: '发布日期', spanCols: 12 },
      { name: 'image', title: '文章图片', widget: 'image',  spanCols: 12 },
      { name: 'category', title: '文章分类', spanCols: 12 },
    ],
  },
  {
    name: 'mainShellView',
    title: '主视图',
    modelName: '__default__',
    description: '系统主视图',
    viewType: 'shell',
    viewOptions: {},
    items: [
      {
        name: 'header',
        title: 'Entity CMS',
        widget: 'logo',
        widgetOptions: {
          logoUrl: 'https://lucide.dev/logo.light.svg',
          icon: 'mdi:apple-keyboard-command',
          title: 'Entity CMS',
          logoWidth: 30,
          logoHeight: 30,
        },
        spanCols: 12,
        flex: 1,
      },
      {
        name: 'navbar',
        title: '导航栏',
        widget: 'navigator',
        widgetOptions: {
          padding: 2,
          spacing: 2,
        },
        spanCols: 12,
        flex: 1,
        fields: [
          {
            name: 'overview-root',
            title: '概览',
            fields: [
              {
                name: 'data-overview',
                title: '数据概览',
                icon: 'material-icon-theme:database',
                widget: 'action',
                widgetOptions: {
                  actionType: 'view',
                  payload: { modelName: '__default__', viewType: 'dashboard' },
                },
              },
            ],
          },
          {
            name: 'category',
            title: '分类',
            fields: [
              {
                name: 'categories',
                title: '分类管理',
                icon: 'material-icon-theme:pdm',
                fields: [
                  {
                    name: 'product-kanban',
                    title: '分类看板',
                    widget: 'action',
                    widgetOptions: {
                      actionType: 'view',
                      payload: { modelName: 'article', viewType: 'kanban' },
                    },
                  },
                  {
                    name: 'category-grid',
                    title: '分类列表',
                    widget: 'action',
                    widgetOptions: {
                      actionType: 'view',
                      payload: { modelName: 'mediaCategory', viewType: 'grid' },
                    },
                  },
                  {
                    name: 'category-new',
                    title: '新建分类',
                    widget: 'action',
                    widgetOptions: {
                      actionType: 'view',
                      payload: { modelName: 'mediaCategory', viewType: 'form', mode: 'create' },
                    },
                  },
                ],
              },
            ],
          },
          {
            name: 'article',
            title: '文章',
            spanCols: 12,
            fields: [
              {
                name: 'articles',
                title: '文章列表',
                width: 200,
                widget: 'action',
                icon: 'material-icon-theme:redux-action',
                widgetOptions: {
                  actionType: 'view',
                  payload: { modelName: 'article', viewType: 'grid' },
                },
              },
              {
                name: 'new-article',
                title: '新建文章',
                width: 200,
                widget: 'action',
                icon: 'material-icon-theme:settings',
                widgetOptions: {
                  actionType: 'view',
                      payload: { modelName: 'article', viewType: 'form', mode: 'create' },
                },
              },
            ],
          },
        ],
      },
      {
        name: 'main',
        title: '主内容区',
        widget: 'container',
        widgetOptions: {
          padding: 2,
          spacing: 2,
          sx: {
            flexGrow: 1,
            overflow: 'auto',
            height: 'calc(100vh - 128px)',
          },
        },
        spanCols: 12,
        flex: 1,
      },
    ],
  },
  {
    name: 'splashView',
    title: '启动/开屏视图',
    description: '启动/开屏视图',
    modelName: 'article',
    viewType: 'splash',
    viewOptions: {},
    items: [],
  },
  {
    name: 'dashboardView',
    title: '仪表盘视图',
    description: '仪表盘视图',
    modelName: '__default__',
    viewType: 'dashboard',
    viewOptions: {},
    items: [
      {
        name: 'dashboard',
        title: '仪表盘',
        description: '仪表盘视图',
        widget: 'banner',
        widgetOptions: {
          items: [
            {
              title: '智能实时数据处理平台',
              subtitle: '物联网 大数据 AI',
              action: 'view::product::grid',
              color: '#fff',
              image:
                'https://images.pexels.com/photos/1089438/pexels-photo-1089438.jpeg?_gl=1*phdriz*_ga*NzQzMDgyNjQzLjE3NTY4MTAxODc.*_ga_8JE65Q40S6*czE3NTY4MTAxODckbzEkZzEkdDE3NTY4MTA1NTgkajM3JGwwJGgw',
            },
            {
              title: '智能边缘计算平台',
              subtitle: '边缘计算 AI',
              color: '#fff',
              image:
                'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?_gl=1*1w6neq1*_ga*NzQzMDgyNjQzLjE3NTY4MTAxODc.*_ga_8JE65Q40S6*czE3NTY4MTAxODckbzEkZzEkdDE3NTY4MTA1OTAkajUkbDAkaDA.',
            },
            {
              title: '智能云计算平台',
              subtitle: '云计算 AI',
              color: '#fff',
              image:
                'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?_gl=1*169k9e2*_ga*NzQzMDgyNjQzLjE3NTY4MTAxODc.*_ga_8JE65Q40S6*czE3NTY4MTAxODckbzEkZzEkdDE3NTY4MTA2MjkkajQ0JGwwJGgw',
            },
          ],
        },
        spanCols: 12,
      },
      {
        name: 'chart-category',
        title: '分类数量',
        spanCols: 6,
        icon: 'material-icon-theme:chart-line',
        widget: 'statcard',
        widgetOptions: {
          value: 1242,
          growth: -0.17,
          modelName: 'mediaCategory',
          // query: { pageSize: 5, pageIndex: 1 },
        },
      },
      {
        name: 'chart-article',
        title: '文章数量',
        spanCols: 6,
        icon: 'material-icon-theme:chart-line',
        widget: 'statcard',
        widgetOptions: {
          value: 1324,
          growth: 0.25,
          icon: 'flat-color-icons:electrical-sensor',
          modelName: 'article',
          // query: {  },
        },
      },
      {
        name: 'datalist',
        title: '活跃产品列表',
        spanCols: 12,
        icon: 'material-icon-theme:chart-line',
        widget: 'datalist',
        widgetOptions: {
          modelName: 'article',
        },
      },
    ],
  },
];
