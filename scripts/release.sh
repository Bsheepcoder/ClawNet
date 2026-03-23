#!/bin/bash
# ClawNet Release Script
# 同步发布到 GitHub + npm

set -e

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# 获取当前版本
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     🚀  ClawNet Release Script           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo
echo -e "  当前版本: ${YELLOW}v${CURRENT_VERSION}${NC}"
echo

# 检查参数
if [ -z "$1" ]; then
    echo -e "  用法: ${GREEN}./scripts/release.sh <version|major|minor|patch>${NC}"
    echo
    echo "  示例:"
    echo "    ./scripts/release.sh patch   # 0.6.1 -> 0.6.2"
    echo "    ./scripts/release.sh minor   # 0.6.1 -> 0.7.0"
    echo "    ./scripts/release.sh major   # 0.6.1 -> 1.0.0"
    echo "    ./scripts/release.sh 0.7.0   # 指定版本"
    echo
    exit 1
fi

VERSION_TYPE=$1

# 确认发布
echo -e "${YELLOW}  即将执行:${NC}"
echo "    1. 检查工作区状态"
echo "    2. 更新版本号 ($VERSION_TYPE)"
echo "    3. 提交到 Git"
echo "    4. 推送到 GitHub"
echo "    5. 发布到 npm"
echo

read -p "  继续发布? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}  已取消${NC}"
    exit 1
fi

# 1. 检查工作区
echo
echo -e "${CYAN}  [1/5] 检查工作区状态...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}  ⚠️  有未提交的更改:${NC}"
    git status --short
    echo
    read -p "  是否先提交这些更改? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        read -p "  输入提交信息: " COMMIT_MSG
        git commit -m "${COMMIT_MSG:-chore: pre-release commit}"
    else
        echo -e "${RED}  请先处理未提交的更改${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}  ✓ 工作区干净${NC}"

# 2. 更新版本号
echo
echo -e "${CYAN}  [2/5] 更新版本号...${NC}"
if [[ "$VERSION_TYPE" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    # 指定版本号
    NEW_VERSION="$VERSION_TYPE"
    npm version "$NEW_VERSION" --no-git-tag-version
else
    # 使用 semver 类型
    NEW_VERSION=$(npm version "$VERSION_TYPE" --no-git-tag-version | sed 's/v//')
fi
echo -e "${GREEN}  ✓ 新版本: v${NEW_VERSION}${NC}"

# 3. Git 提交
echo
echo -e "${CYAN}  [3/5] Git 提交...${NC}"
git add -A
git commit -m "chore: Release v${NEW_VERSION}"
git tag "v${NEW_VERSION}"
echo -e "${GREEN}  ✓ 提交完成: v${NEW_VERSION}${NC}"

# 4. 推送 GitHub
echo
echo -e "${CYAN}  [4/5] 推送到 GitHub...${NC}"
git push origin main
git push origin "v${NEW_VERSION}"
echo -e "${GREEN}  ✓ 已推送到 GitHub${NC}"

# 5. 发布 npm
echo
echo -e "${CYAN}  [5/5] 发布到 npm...${NC}"
npm publish --access public
echo -e "${GREEN}  ✓ 已发布到 npm${NC}"

# 完成
echo
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          🎉  发布成功!                   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo
echo -e "  版本:    ${GREEN}v${NEW_VERSION}${NC}"
echo -e "  GitHub:  ${YELLOW}https://github.com/Bsheepcoder/ClawNet/releases/tag/v${NEW_VERSION}${NC}"
echo -e "  npm:     ${YELLOW}https://www.npmjs.com/package/@husile/clawnet-lite/v/${NEW_VERSION}${NC}"
echo
