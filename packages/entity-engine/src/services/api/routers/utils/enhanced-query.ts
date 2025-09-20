import { Prisma, type EntityObject, type PrismaClient } from '@prisma/client';

// --- 类型定义 ---
// 从数据库返回的、带有parentId的扁平节点类型
export type NodeWithParent = EntityObject & {
    parentId: string | null;
};

// 最终构建完成的、带有children数组的树节点类型
export type TreeNode = {
    children: TreeNode[];
    data: EntityObject;
    parentId: string | null;
};

// --- 辅助函数：将扁平列表构建成森林（树的数组） ---
function buildForestFromFlatNodes(flatNodes: NodeWithParent[]): TreeNode[] {
    const nodeMap = new Map<string, TreeNode>();
    const forest: TreeNode[] = [];

    // 第一次遍历：初始化Map，并为每个节点添加一个空的 children 数组
    flatNodes.forEach((node) => {
        const { parentId, ...data } = node;
        nodeMap.set(node.id, {
            data,
            parentId,
            children: [],
        });
    });

    // 第二次遍历：链接父子关系，并找出根节点
    nodeMap.forEach((node) => {
        if (node.parentId) {
            const parent = nodeMap.get(node.parentId);
            if (parent) {
                parent.children.push(node);
            }
        } else {
            // 没有 parentId 的是根节点
            forest.push(node);
        }
    });

    return forest;
}

/**
 * 高效获取并构建树或森林。
 * - 如果提供了 rootId，则获取并返回以该ID为根的单个树结构 (TreeNode | null)。
 * - 如果省略 rootId，则获取并返回所有符合 'scene/children' 规则的树所组成的森林 (TreeNode[])。
 * @param {string} [rootId] - 可选的，指定树的根节点ID。
 * @returns {Promise<TreeNode | TreeNode[] | null>} 返回单个树、树的数组、或者null。
 */
export async function getFullTree(
    prisma: PrismaClient,
    fromModelName: string,
    fromFieldName: string,
    rootId?: string
): Promise<TreeNode | TreeNode[] | null> {
    // ------------------------------------------------------------------
    // Case 1: 提供了 rootId，查询单个子树
    // ------------------------------------------------------------------
    if (rootId) {
        const flatNodesForSubtree: NodeWithParent[] = await prisma.$queryRaw`
      WITH RECURSIVE SubTreeEdges AS (
          -- 起始部分：从指定的 rootId 开始查找其直接子节点
          SELECT "toObjectId", "fromObjectId"
          FROM "EntityObjectReference"
          WHERE "fromObjectId" = ${rootId}
            AND "fromModelName" = ${fromModelName}
            AND "fromFieldName" = ${fromFieldName}
          UNION ALL
          -- 递归部分：继续查找子孙节点
          SELECT eor."toObjectId", eor."fromObjectId"
          FROM "EntityObjectReference" eor
          JOIN SubTreeEdges ste ON eor."fromObjectId" = ste."toObjectId"
          WHERE eor."fromModelName" = ${fromModelName}
            AND eor."fromFieldName" = ${fromFieldName}
      ),
      NodesInSubTree AS (
          -- 将根节点自己和所有子孙节点的ID合并
          SELECT ${rootId} AS id
          UNION ALL
          SELECT "toObjectId" FROM SubTreeEdges
      )
      -- 查询这些节点的信息及其父节点ID
      SELECT
          eo.*,
          ste."fromObjectId" as "parentId"
      FROM NodesInSubTree nist
      JOIN "EntityObject" eo ON nist.id = eo.id
      LEFT JOIN SubTreeEdges ste ON nist.id = ste."toObjectId";
    `;

        // 使用辅助函数构建森林（此时理论上森林里只有一棵树）
        const forest = buildForestFromFlatNodes(flatNodesForSubtree);

        // 返回森林中的第一棵树，如果结果为空则返回null
        return forest.length > 0 ? forest[0] : null;
    }
    // ------------------------------------------------------------------
    // Case 2: 未提供 rootId，查询整个森林
    // ------------------------------------------------------------------
    else {
        const flatNodesForForest: NodeWithParent[] = await prisma.$queryRaw`
      WITH RECURSIVE DescendantEdges AS (
          SELECT "toObjectId", "fromObjectId" FROM "EntityObjectReference"
          WHERE "fromModelName" = ${fromModelName} AND "fromFieldName" = ${fromFieldName}
          UNION ALL
          SELECT eor."toObjectId", eor."fromObjectId" FROM "EntityObjectReference" eor
          JOIN DescendantEdges de ON eor."fromObjectId" = de."toObjectId"
          WHERE eor."fromModelName" = ${fromModelName} AND eor."fromFieldName" = ${fromFieldName}
      ),
      NodesInConnectedTrees AS (
          SELECT "toObjectId" AS id FROM DescendantEdges
          UNION
          SELECT "fromObjectId" AS id FROM DescendantEdges
      )
      SELECT eo.*, de."fromObjectId" AS "parentId"
      FROM NodesInConnectedTrees nict JOIN "EntityObject" eo ON nict.id = eo.id
      LEFT JOIN (SELECT DISTINCT "toObjectId", "fromObjectId" FROM DescendantEdges) AS de ON nict.id = de."toObjectId"
      UNION ALL
      SELECT eo.*, NULL AS "parentId"
      FROM "EntityObject" eo
      WHERE eo."modelName" = ${fromModelName}
      AND NOT EXISTS (
          SELECT 1 FROM "EntityObjectReference" eor
          WHERE eor."toObjectId" = eo.id AND eor."fromModelName" = ${fromModelName} AND eor."fromFieldName" = ${fromFieldName}
      )
      AND NOT EXISTS (
          SELECT 1 FROM "EntityObjectReference" eor
          WHERE eor."fromObjectId" = eo.id AND eor."fromModelName" = ${fromModelName} AND eor."fromFieldName" = ${fromFieldName}
      );
    `;

        // 使用辅助函数构建并返回整个森林
        return buildForestFromFlatNodes(flatNodesForForest);
    }
}

/**
 * 从扁平列表中构建层级结构，并将子关系放入父节点的 `values` 属性中 (最终增强版)
 * @param {Array<Object>} flatList - 从原生查询返回的扁平数组
 * @returns {Object | null} - 返回根节点对象，或在找不到时返回 null
 */
function buildHierarchyInValues(flatList: any[]) {
    // 1. 验证输入数据
    if (!flatList || !Array.isArray(flatList) || flatList.length === 0) {
        console.error(
            "[buildHierarchyInValues] Error: Input 'flatList' is empty or invalid. Returning null."
        );
        return null;
    }

    const nodeMap = new Map();
    let root: any = null;

    // 第一次遍历: 初始化所有节点，并将它们放入 Map
    flatList.forEach((item) => {
        if (!item || typeof item.id === 'undefined') {
            console.warn(
                '[buildHierarchyInValues] Warning: Skipping invalid item in flatList:',
                item
            );
            return;
        }
        const initialValues =
            typeof item.values === 'object' && item.values !== null ? item.values : {};
        const node = {
            id: item.id,
            modelName: item.modelName,
            values: initialValues,
            isDeleted: item.isDeleted,
        };
        nodeMap.set(node.id, node);
    });

    // 第二次遍历: 连接父子关系
    flatList.forEach((item) => {
        if (!item || typeof item.toid === 'undefined') return;

        const parentId = item.fromid;
        const childId = item.toid;
        const relationField = item.viafield;

        // 确定根节点 (只会设置一次)
        if (!parentId || parentId === null) {
            if (root === null) {
                root = nodeMap.get(childId);
                console.warn(
                    `[buildHierarchyInValues] Warning: root node found. Using '${childId}' as the root.`
                );
            } else {
                console.warn(
                    `[buildHierarchyInValues] Warning: Multiple root nodes found. Using '${root.id}' as the root. Another root found: '${childId}'.`
                );
            }
            return;
        }

        // 连接子节点到父节点
        if (relationField && nodeMap.has(parentId) && nodeMap.has(childId)) {
            const parentNode = nodeMap.get(parentId);
            const childNode = nodeMap.get(childId);

            if (!parentNode.values[relationField]) {
                parentNode.values[relationField] = [];
            }
            if (Array.isArray(parentNode.values[relationField])) {
                parentNode.values[relationField].push(childNode);
            } else {
                parentNode.values[relationField] = childNode;
            }
        } else if (relationField) {
            console.warn(
                `[buildHierarchyInValues] Warning: Could not form relationship for item. Missing parent or child in nodeMap.`,
                item
            );
        }
    });

    // 3. 最终检查
    if (root === null) {
        console.error(
            "[buildHierarchyInValues] Error: Failed to determine a root node from the provided data. Make sure at least one item has a null 'fromId'."
        );
    }

    return root;
}

/**
 * 深度查询实体，但仅在第一层应用 fieldName 过滤器。
 * 在更深的层级，所有关联都将被查询。
 * @param {string} startId - 起始实体的ID
 * @param {string[] | undefined | null} [fieldNamesToInclude] - 一个仅用于第一层的 fromFieldName 过滤数组。
 * @returns {Promise<Object | null>} - 返回构建好的层级对象
 */
export async function getDeepEntityFirstLevelFilter(
    prisma: PrismaClient,
    startId: string,
    fieldNamesToInclude?: string[]
) {
    // 1. 动态构建过滤子句
    let filterClause = Prisma.empty; // 默认不过滤
    if (fieldNamesToInclude && fieldNamesToInclude.length > 0) {
        // 如果提供了列表，则创建深度感知的过滤逻辑
        filterClause = Prisma.sql`
      AND (
        eg.depth > 0 -- 如果深度大于0 (即非第一层)，则条件为真，允许通行
        OR
        ref."fromFieldName" IN (${Prisma.join(fieldNamesToInclude)}) -- 否则 (在第一层)，检查fieldName
      )
    `;
    }

    // 2. 将动态子句注入到主查询中
    const flatList = await prisma.$queryRaw(
        Prisma.sql`
      WITH RECURSIVE EntityGraph AS (
          SELECT
              eo.id AS toId,
              NULL::VARCHAR AS fromId,
              NULL::VARCHAR AS viaField,
              0 AS depth
          FROM
              "EntityObject" AS eo
          WHERE
              eo.id = ${startId}

          UNION ALL

          SELECT
              ref."toObjectId" AS toId,
              ref."fromObjectId" AS fromId,
              ref."fromFieldName" AS viaField,
              eg.depth + 1
          FROM
              "EntityObjectReference" AS ref
          JOIN
              EntityGraph AS eg ON ref."fromObjectId" = eg.toId
          WHERE
              eg.depth < 10
              ${filterClause} -- <-- 在这里注入新的、深度感知的过滤条件
      )
      SELECT
          graph.toId,
          graph.fromId,
          graph.viaField,
          graph.depth,
          eo.id,
          eo."modelName",
          eo.values,
          eo."isDeleted"
      FROM
          EntityGraph AS graph
      JOIN
          "EntityObject" AS eo ON graph.toId = eo.id;
    `
    );

    // console.table(flatList);

    // 3. 重建层级结构 (逻辑不变)
    if (!Array.isArray(flatList) || flatList.length === 0) {
        return null;
    }

    const root = buildHierarchyInValues(flatList);
    // console.log(`getDeepEntityFirstLevelFilter: ${JSON.stringify(root, null, 2)}`);
    return root;
}
