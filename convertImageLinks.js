const fs = require('fs');
const path = require('path');

// 配置项
const config = {
    // GitHub 仓库信息
    owner: 'op-sources',
    repo: 'oss',
    branch: 'main',
    // 要处理的目录就是当前目录，这样可以处理所有子目录
    markdownDir: __dirname
};

// 生成GitHub raw链接的函数
function generateGithubRawUrl(relativePath) {
    const encodedPath = encodeURIComponent(relativePath.replace(/\\/g, '/'));
    return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${encodedPath}`;
}

// 处理单个Markdown文件
function processMarkdownFile(filePath) {
    try {
        // 读取Markdown文件内容
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 获取Markdown文件相对于仓库根目录的路径
        const relativeDir = path.relative(__dirname, path.dirname(filePath));
        
        // 匹配所有图片引用格式：
        // 1. ![xxx](assets/xxx.png)
        // 2. ![xxx](./assets/xxx.png)
        // 3. ![xxx](\assets\xxx.png)
        // 4. ![xxx](.\assets\xxx.png)
        // 5. ![xxx](folder/assets/xxx.png)
        // 6. ![xxx](/folder/assets/xxx.png)
        const imagePattern = /!\[([^\]]*)\]\(([^)]+\.(png|jpe?g|gif|bmp|webp))\)/g;
        
        // 替换所有匹配的图片链接
        content = content.replace(imagePattern, (match, altText, imagePath) => {
            try {
                // 移除路径开头的点和斜杠
                let normalizedPath = imagePath.replace(/^[.\/\\]+/, '');
                // 将所有反斜杠转换为正斜杠
                normalizedPath = normalizedPath.replace(/\\/g, '/');
                
                // 构建相对于仓库根目录的完整路径
                let fullRelativePath;
                if (relativeDir) {
                    fullRelativePath = path.join(relativeDir, normalizedPath).replace(/\\/g, '/');
                } else {
                    fullRelativePath = normalizedPath;
                }
                
                // 生成GitHub URL
                const githubUrl = generateGithubRawUrl(fullRelativePath);
                return `![${altText}](${githubUrl})`;
            } catch (err) {
                console.error(`处理图片 ${imagePath} 时发生错误:`, err);
                return match; // 如果处理失败，保持原样
            }
        });
        
        // 写回文件
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ 处理完成: ${filePath}`);
    } catch (err) {
        console.error(`❌ 处理文件 ${filePath} 时发生错误:`, err);
    }
}

// 处理目录下的所有Markdown文件
function processDirectory(dirPath) {
    try {
        const files = fs.readdirSync(dirPath);
        let mdFiles = 0;
        
        files.forEach(file => {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // 如果是目录，递归处理
                processDirectory(fullPath);
            } else if (file.endsWith('.md')) {
                // 如果是Markdown文件，进行处理
                processMarkdownFile(fullPath);
                mdFiles++;
            }
        });
        
        if (mdFiles > 0) {
            console.log(`📁 目录 ${dirPath} 中处理了 ${mdFiles} 个 Markdown 文件`);
        }
    } catch (err) {
        console.error(`❌ 处理目录 ${dirPath} 时发生错误:`, err);
    }
}

// 执行转换
console.log('🚀 开始处理Markdown文件...');
processDirectory(config.markdownDir);
console.log('✨ 所有文件处理完成！');