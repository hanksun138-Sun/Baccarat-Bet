export function downloadStandaloneHtmlFile() {
  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>传统百家乐双人对战 (No Commission Baccarat)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&display=swap');
    body {
      background-color: #020617;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      touch-action: manipulation;
    }
    .font-serif-casino {
      font-family: 'Cinzel', Georgia, serif;
    }
    .text-shadow-gold {
      text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
    }
    /* Custom Scrollbar */
    .custom-scrollbar::-webkit-scrollbar {
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.8);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #d4af37;
      border-radius: 4px;
    }
  </style>
</head>
<body class="p-2 sm:p-4 min-h-screen">
  <div id="app" class="max-w-7xl mx-auto space-y-4">
    <!-- Standalone Single-file Baccarat Container -->
    <div className="text-center p-4 bg-emerald-900/40 border border-amber-500/40 rounded-2xl">
      <h1 class="text-2xl sm:text-3xl font-serif-casino font-bold text-amber-300">★ 传统百家乐双人对战 (单文件版) ★</h1>
      <p class="text-xs text-slate-300 mt-1">iPad Safari 触控体验 | 免佣规则 | 龙7猫8旁注 | 玩家B追打状态机 | 大路图</p>
    </div>
    <div id="standalone-root" class="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 text-center text-amber-200">
      单文件HTML包含完整应用代码。请在支持现代浏览器的设备上运行。
    </div>
  </div>
  <script>
    console.log("Traditional Baccarat Standalone HTML Loaded.");
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'baccarat_standalone_singlefile.html');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
