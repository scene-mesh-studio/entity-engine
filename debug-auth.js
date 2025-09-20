const { createHash } = require('crypto');

// 调试认证逻辑
function testPasswordHash(password) {
    const hashedPassword = createHash('md5')
        .update(password, 'utf8')
        .digest('hex');
    
    console.log('Input password:', password);
    console.log('MD5 hash:', hashedPassword);
    return hashedPassword;
}

// 测试一些常见密码
console.log('=== Password Hash Testing ===');
testPasswordHash('password');
testPasswordHash('admin');
testPasswordHash('123456');
testPasswordHash('demo');

console.log('\n=== Database Query Example ===');
console.log(`
SELECT * FROM "EntityObject" 
WHERE 
  "modelName" = 'ee-base-user' 
  AND "isDeleted" = false 
  AND "values"->>'email' IS NOT NULL;
`);
