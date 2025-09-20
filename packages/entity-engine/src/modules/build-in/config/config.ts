import type { IEntityView, IEntityModel } from '../../../types';

const models: IEntityModel[] = [
    {
        name: '__default__',
        title: '默认模型',
        description: 'Default Model',
        fields: [],
    },
    {
        name: '__config__',
        title: '配置模型',
        description: 'Config Model',
        fields: [
            {
                name: 'name',
                title: '配置名称',
                description: '配置名称',
                type: 'string',
                isRequired: true,
                searchable: true,
            },
            {
                name: 'version',
                title: '配置版本',
                description: '配置版本',
                type: 'number',
                isRequired: true,
                searchable: false,
            },
            {
                name: 'content',
                title: '配置内容',
                description: '配置内容',
                type: 'string',
                isRequired: true,
                searchable: false,
            },
        ],
    },
    {
        name: 'entity-change-log',
        title: '实体变更记录',
        description: 'Entity Change Log',
        fields: [
            {
                name: 'modelName',
                title: 'Model Name',
                description: 'Model Name',
                type: 'string',
                isRequired: true,
                searchable: true,
            },
            {
                name: 'objectId',
                title: 'Object ID',
                description: 'Object ID',
                type: 'string',
                isRequired: true,
                searchable: true,
            },
            {
                name: 'changedBy',
                title: 'Changed By',
                description: 'Changed By',
                type: 'string',
                isRequired: true,
                searchable: true,
            },
            {
                name: 'changeType',
                title: 'Change Type',
                description: 'Change Type',
                type: 'string',
                isRequired: true,
                searchable: true,
            },
            {
                name: 'changeDetails',
                title: 'Change Details',
                description: 'Change Details',
                type: 'json',
                isRequired: false,
                searchable: false,
            },
        ],
    },
    {
        name: 'ee-base-user',
        title: '用户模型',
        description: 'Entity User Model',
        fields: [
            {
                name: 'userName',
                title: '用户名称',
                description: '用户名称',
                type: 'string',
                isRequired: true,
                searchable: true,
            },
            {
                name: 'email',
                title: '邮箱',
                description: '邮箱地址',
                type: 'string',
                isRequired: true,
                searchable: true,
            },
            {
                name: 'password',
                title: '登录密码',
                description: '登录密码',
                type: 'string',
                isRequired: true,
            },
            {
                name: 'avatar',
                title: '头像',
                description: '头像',
                type: 'binary',
                isRequired: false,
                searchable: false,
            },
        ],
    },
];

const views: IEntityView[] = [
    {
        name: 'entity-change-log-grid-view',
        title: '实体变更网格视图',
        description: 'Entity Change Log Grid View',
        modelName: 'entity-change-log',
        viewType: 'grid',
        items: [
            { name: 'modelName', title: 'Model Name', spanCols: 12 },
            { name: 'objectId', title: 'Object ID', spanCols: 12 },
            { name: 'changedBy', title: 'Changed By', spanCols: 12 },
            { name: 'changeType', title: 'Change Type', spanCols: 12 },
            { name: 'changeDetails', title: 'Change Details', spanCols: 12 },
        ],
    },
    {
        name: 'ee-base-user-grid-view',
        title: '用户网格视图',
        description: '用户网格视图',
        modelName: 'ee-base-user',
        viewType: 'grid',
        items: [
            { name: 'userName', title: '用户名称', spanCols: 12 },
            { name: 'email', title: '登录邮箱', spanCols: 12 },
            { name: 'avatar', title: '头像', widget: 'image', spanCols: 12 },
        ],
    },
    {
        name: 'ee-base-user-form-view',
        title: '用户网格视图',
        description: '用户网格视图',
        modelName: 'ee-base-user',
        viewType: 'form',
        items: [
            { name: 'userName', title: '用户名称', spanCols: 12 },
            { name: 'email', title: '登录邮箱', spanCols: 12 },
            { name: 'password', title: '登录密码', widget: 'password', spanCols: 12 },
            { name: 'avatar', title: '头像', widget: 'image', spanCols: 12 },
        ],
    },
];

export { views, models };
