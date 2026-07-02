// cloudfunctions/parseLink/index.js
// 抖音/快手/小红书 分享链接解析
const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 解析器配置
const PARSER_CONFIG = {
  douyin: {
    name: '抖音',
    // 抖音分享短链需要重定向获取真实URL
    shortDomains: ['v.douyin.com', 'dy.com'],
    // API 端点（第三方解析服务示例，实际部署需要对接真实解析接口）
    apiEndpoint: 'https://api.example.com/douyin/parse'
  },
  kuaishou: {
    name: '快手',
    shortDomains: ['v.kuaishou.com', 'kuaishouapp.com'],
    apiEndpoint: 'https://api.example.com/kuaishou/parse'
  },
  xiaohongshu: {
    name: '小红书',
    shortDomains: ['xhslink.com', 'xiaohongshu.com'],
    apiEndpoint: 'https://api.example.com/xiaohongshu/parse'
  }
};

exports.main = async (event, context) => {
  const { url } = event;
  const { OPENID } = cloud.getWXContext();

  if (!url) {
    return { success: false, message: '链接不能为空' };
  }

  // 检测平台
  const platform = detectPlatform(url);
  if (platform === 'unknown') {
    return { success: false, message: '不支持的平台，仅支持抖音/快手/小红书' };
  }

  try {
    // 解析链接
    const result = await parseByPlatform(url, platform);

    if (!result.success) {
      return { success: false, message: result.message || '解析失败' };
    }

    // 保存解析历史
    await saveHistory(OPENID, result.data, platform);

    return {
      success: true,
      data: {
        ...result.data,
        platform
      }
    };
  } catch (err) {
    console.error('解析异常:', err);
    return { success: false, message: '解析服务异常，请稍后重试' };
  }
};

/**
 * 检测平台类型
 */
function detectPlatform(url) {
  if (/douyin\.com|iesdouyin\.com|dy\.com/i.test(url)) return 'douyin';
  if (/kuaishou\.com|chenzhongtech\.com|kuaishouapp\.com/i.test(url)) return 'kuaishou';
  if (/xiaohongshu\.com|xhslink\.com|redbook\.com/i.test(url)) return 'xiaohongshu';
  return 'unknown';
}

/**
 * 按平台解析
 *
 * 注意：以下是解析逻辑框架。
 * 实际生产环境需要对接真实的第三方解析API（如天行数据、聚合数据等）。
 * 此处提供模拟返回结构，方便开发者对接。
 */
async function parseByPlatform(url, platform) {
  // ========== 方案一：对接第三方解析 API ==========
  // try {
  //   const config = PARSER_CONFIG[platform];
  //   const response = await axios.post(config.apiEndpoint, {
  //     url: url,
  //     // API密钥从云函数环境变量读取
  //     key: process.env.PARSE_API_KEY
  //   }, { timeout: 15000 });
  //
  //   return {
  //     success: true,
  //     data: {
  //       title: response.data.title,
  //       author: response.data.author,
  //       authorAvatar: response.data.author_avatar,
  //       description: response.data.description,
  //       cover: response.data.cover_url,
  //       mediaUrl: response.data.video_url || response.data.image_url,
  //       type: response.data.type || 'video'
  //     }
  //   };
  // } catch (err) { ... }

  // ========== 方案二：模拟解析（开发/演示用） ==========
  // 实际部署时替换为方案一
  return mockParse(url, platform);
}

/**
 * 模拟解析 - 开发/演示用途
 * 实际部署时替换为真实 API 调用
 */
async function mockParse(url, platform) {
  // 模拟网络延迟
  await sleep(800);

  const mockData = {
    douyin: {
      title: '这是一条抖音视频标题示例',
      author: '抖音创作者',
      authorAvatar: 'https://example.com/avatar_douyin.jpg',
      description: '视频描述文案，包含 #话题标签',
      cover: 'https://picsum.photos/seed/douyin/400/600',
      mediaUrl: 'https://example.com/video_douyin.mp4',
      type: 'video'
    },
    kuaishou: {
      title: '快手精彩视频分享',
      author: '快手达人',
      authorAvatar: 'https://example.com/avatar_kuaishou.jpg',
      description: '快手视频文案描述',
      cover: 'https://picsum.photos/seed/kuaishou/400/600',
      mediaUrl: 'https://example.com/video_kuaishou.mp4',
      type: 'video'
    },
    xiaohongshu: {
      title: '小红书种草笔记',
      author: '小红书博主',
      authorAvatar: 'https://example.com/avatar_xhs.jpg',
      description: '这是一篇种草笔记的详细文案内容，包含使用体验和推荐理由',
      cover: 'https://picsum.photos/seed/xiaohongshu/400/600',
      mediaUrl: 'https://example.com/image_xhs.jpg',
      type: 'image'
    }
  };

  const data = mockData[platform] || mockData.douyin;

  return {
    success: true,
    data: {
      ...data,
      platform
    }
  };
}

/**
 * 保存解析历史到数据库
 */
async function saveHistory(openid, data, platform) {
  try {
    await db.collection('parse_history').add({
      data: {
        _openid: openid,
        title: data.title || '',
        author: data.author || '',
        description: data.description || '',
        cover: data.cover || '',
        mediaUrl: data.mediaUrl || '',
        type: data.type || 'video',
        platform,
        createTime: db.serverDate()
      }
    });
  } catch (err) {
    console.error('保存历史失败:', err);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
