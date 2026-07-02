/**
 * 数据库初始化配置
 *
 * 在小程序云开发控制台中创建以下集合：
 *
 * 1. users - 用户表
 *    权限：仅创建者可读写
 *    字段：
 *    - _openid: string (自动)
 *    - createTime: date
 *    - updateTime: date
 *    - dailyQuota: object { date, used, limit, bonus }
 *    - totalParsed: number
 *
 * 2. parse_history - 解析历史表
 *    权限：仅创建者可读写
 *    字段：
 *    - _openid: string (自动)
 *    - title: string
 *    - author: string
 *    - description: string
 *    - cover: string
 *    - mediaUrl: string
 *    - type: string (video/image)
 *    - platform: string
 *    - createTime: date
 *
 * 索引建议：
 * - parse_history: _openid + createTime 降序索引
 * - users: _openid 唯一索引
 */

module.exports = {
  collections: [
    {
      name: 'users',
      desc: '用户表 - 存储用户配额信息'
    },
    {
      name: 'parse_history',
      desc: '解析历史 - 存储用户解析记录'
    }
  ]
};
