import { Injectable } from '@angular/core';

export interface TranscriptSegment {
  time: string;
  seconds: number;
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  
  // Dispatcher to get the right transcript based on BVID
  getTranscript(bvid: string): string {
    // Clean the BVID just in case
    const cleanId = bvid.trim();
    
    if (cleanId === 'BV1FV411d7u7') {
      return this.getHouLangTranscript();
    }
    // Matches BV1kY5XzrE6L or generally matches the MCP topic request
    if (cleanId === 'BV1kY5XzrE6L') {
      return this.getMCPTranscript();
    }
    return this.getGenericTranscript();
  }

  // 1. "Hou Lang" (The Rear Waves)
  private getHouLangTranscript(): string {
    return `
[00:02] 那些口口声声，一代不如一代的人。
[00:05] 应该看着你们，像我一样。
[00:08] 我看着你们，满怀羡慕。
[00:15] 人类积攒了几千年的财富，所有的知识、见识、智慧和艺术，像是专门为你们准备的礼物。
[00:30] 科技繁荣，文化繁茂，城市繁华，现代文明的成果被层层打开，可以尽情地享用。
[00:50] 自由学习一门语言，学习一门手艺，欣赏一部电影，去遥远的地方旅行。
[01:10] 很多人，从小你们就在自由探索自己的兴趣。
[01:30] 很多人在童年就进入了不惑之年。
[01:45] 不惑于自己喜欢什么，不喜欢什么。
[02:00] 人与人之间的壁垒被打破，你们只凭相同的爱好，就能结交千万个值得干杯的朋友。
[02:20] 你们拥有了，我们曾经梦寐以求的权利——选择的权利。
[02:40] 你所热爱的，就是你的生活。
[02:50] 你们有幸，遇见这样的时代；但是时代更有幸，遇见这样的你们。
[03:00] 我看着你们，满怀敬意。
[03:10] 向你们的专业态度致敬。
[03:20] 你们正在把传统的变成现代的，把经典的变成流行的。
[03:30] 把学术的变成大众的，把民族的变成世界的。
[03:40] 你们把自己的热爱变成了一个和成千上万的人分享快乐的事业。
[03:50] 弱小的人，才习惯嘲讽与否定；内心强大的人，从不吝啬赞美与鼓励。
[04:00] 向你们的大气致敬。
[04:15] 小人同而不和，君子美美与共，和而不同。
[04:30] 奔涌吧，后浪！
[04:40] 我们在同一条奔涌的河流。
    `;
  }

  // 2. "MCP Configuration Tutorial" - Expanded to ~11 mins to match real video length
  private getMCPTranscript(): string {
    return `
[00:00] 大家好，欢迎回来。今天我们深入探讨一下 Model Context Protocol，也就是 MCP。
[00:15] 最近 Anthropic 推出的这个协议非常火，它彻底改变了我们连接 LLM 和本地数据的方式。
[00:30] 之前的视频我们简单提了一下，今天这期视频，我会手把手带大家配置一遍，全长大概 11 分钟，确保大家能跑通。
[01:00] 首先，确保你已经安装了 Claude Desktop 的最新版本。网页版目前是不支持 MCP 的，必须是客户端。
[01:25] 这是一个开源协议，核心思想就是把"数据源"标准化成一个 Server，然后 Claude 作为 Client 去调用。
[01:50] 第一步，我们需要找到配置文件。
[02:10] 在 macOS 上，按 Command+Shift+G，输入 ~/Library/Application Support/Claude。
[02:30] 在 Windows 上，大家去 AppData/Roaming/Claude 文件夹找 claude_desktop_config.json。
[02:55] 如果没有这个文件，就新建一个。注意后缀名必须是 .json。
[03:15] 我们先来看最基础的配置结构，它是一个包含 mcpServers 对象的 JSON。
[03:45] 比如说，我们要挂载本地的文件系统。我们需要用到 @modelcontextprotocol/server-filesystem 这个包。
[04:10] 这里的 command 我们一般用 npx，或者如果你装了 uv，也可以用 uvx，速度更快。
[04:40] 重点来了，args 参数里，我们需要指定允许 Claude 访问的目录路径。
[05:00] 很多同学在这里报错，因为用了相对路径。请务必使用绝对路径，比如 /Users/username/Desktop/my-project。
[05:30] 好的，我们把这个配置写进去，保存文件。
[05:50] 接下来非常关键：Claude Desktop 不会自动热重载配置文件。
[06:05] 你必须完全退出程序（Quit），然后再重新打开。
[06:30] 重启后，留意输入框右下角，是不是多了一个"插头"形状的图标？
[06:45] 如果是灰色的或者有点它没反应，说明连接失败了。这时候我们需要看日志。
[07:10] 日志文件在同级目录下的 logs 文件夹里，打开 mcp-server-filesystem.log 看看报错信息。
[07:40] 既然文件系统通了，我们再进阶一下，配置一个 SQLite 数据库。
[08:15] 同样的逻辑，我们在 mcpServers 下面加一个 keys，叫 "sqlite"。
[08:40] command 设为 "uvx"，args 是 "mcp-server-sqlite" 加上你的 db 文件路径。
[09:10] 这种方式非常强大，你可以让 Claude 直接帮你查数据库里的表结构，甚至写 SQL 语句分析数据。
[09:45] 比如说，我让它"查询 users 表里的前十条数据"，它会直接调用工具返回结果，而不是瞎编。
[10:15] 安全性方面大家要注意，MCP 给予了 AI 读取甚至修改你本地文件的权限。
[10:40] 所以在 args 配置路径的时候，尽量遵循"最小权限原则"，只给它看它需要看的文件夹。
[11:00] 总结一下，MCP 是未来的趋势，它让 AI 从一个聊天机器人变成了真正的生产力工具。
[11:20] 今天的教程就到这里，配置文件模板我会放在简介里，大家快去试试吧！
    `;
  }

  // 3. Generic Fallback
  private getGenericTranscript(): string {
    return `
[00:01] ⚠️ SYSTEM NOTICE: Placeholder Transcript Loaded.
[00:05] You are seeing this text because the specific video you loaded is not in our Demo Database.
[00:10] In a real-world scenario, the backend would use the Bilibili API to fetch the subtitle track (CC) or use Speech-to-Text to transcribe the audio.
[00:20] Since this is a client-side demo without a backend server, we cannot access the audio/subtitles of arbitrary videos due to browser security (CORS) and API limitations.
[00:35] However, the Gemini AI is fully functional!
[00:40] You can ask questions based on *this* text to test the UI features:
[00:45] 1. Try asking "Why is this a placeholder?"
[00:50] 2. Try clicking these timestamps to see the video seek.
[01:00] 3. To see the full experience, please try one of the supported Demo Videos (Hou Lang or MCP Tutorial).
[01:15] We apologize for the inconvenience and hope you understand the technical constraints of a pure frontend demo.
    `;
  }

  parseTranscript(text: string): TranscriptSegment[] {
    const lines = text.trim().split('\n');
    const segments: TranscriptSegment[] = [];
    
    // Regex to match [MM:SS] or [HH:MM:SS]
    const timeRegex = /\[(\d{1,2}:)?(\d{2}:\d{2})\]/;

    for (const line of lines) {
      const match = line.match(timeRegex);
      if (match) {
        const timeStr = match[0].replace('[', '').replace(']', '');
        const content = line.replace(match[0], '').trim();
        
        segments.push({
          time: timeStr,
          seconds: this.timeToSeconds(timeStr),
          text: content
        });
      }
    }
    return segments;
  }

  private timeToSeconds(timeStr: string): number {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else {
      return parts[0] * 60 + parts[1];
    }
  }
}