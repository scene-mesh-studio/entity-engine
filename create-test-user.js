const { createHash } = require('crypto');
const { v4: uuidv4 } = require('uuid');

// 创建测试用户的脚本
function createTestUser(email, password, userName = 'Test User') {
    const hashedPassword = createHash('md5')
        .update(password, 'utf8')
        .digest('hex');
    
    const userId = uuidv4().replace(/-/g, '').substring(0, 32);
    
    const userObject = {
        id: userId,
        modelName: 'ee-base-user',
        values: {
            email: email,
            password: hashedPassword,
            userName: userName
        },
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    console.log('测试用户对象:', JSON.stringify(userObject, null, 2));
    
    const sqlInsert = `
INSERT INTO "EntityObject" ("id", "modelName", "values", "isDeleted", "createdAt", "updatedAt")
VALUES (
    '${userId}',
    'ee-base-user',
    '${JSON.stringify(userObject.values)}',
    false,
    NOW(),
    NOW()
);`;
    
    console.log('\nSQL插入语句:');
    console.log(sqlInsert);
    
    return userObject;
}

console.log('=== 创建测试用户 ===');
createTestUser('demo@demo.com', 'demo', 'Demo User');
console.log('\n' + '='.repeat(50));
createTestUser('admin@admin.com', 'admin', 'Admin User');
