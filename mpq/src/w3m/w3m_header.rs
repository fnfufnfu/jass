/**
char [4]：文件ID（应为“HM3W”）
int：未知
字符串：map name
int：map flags（这些与W3I中的完全相同）文件）
0x0001：1 =在预览屏幕中隐藏小地图
0x0002：1 =修改盟友优先级
0x0004：1 =近战地图
0x0008：1 =可玩地图大小很大且从未减少到中等
0x0010：1 =蒙面区域部分可见
0x0020：1 =自定义力的固定播放器设置
0x0040：1 =使用自定义力
0x0080：1 =使用自定义技术
0x0100：1 =使用自定义技能
0x0200：1 =使用自定义升级
0x0400：1 =地图属性菜单至少打开一次地图创建
0x0800：1 =在悬崖海岸上显示水波
0x1000：1 =在滚动海岸上显示水波
int：最大数量的玩家
后跟00字节，直到填充了标题的512字节。
*/


use super::char4::Char4;
use super::map_flag::MapFlag;

#[derive(Debug)]
pub struct W3MHeader {
    pub id: Char4,
    pub placeholder: i32,
    pub map_name: String,
    ///
    pub map_flag: MapFlag,

}