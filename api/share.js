// 分享頁：/s/<code>
// 社群平台（LINE、Facebook、Threads）抓這個頁面的 og 標籤來顯示預覽圖，
// 真人點開會立刻轉回遊戲首頁，並帶上 ?r=<code> 當作邀請碼。
const SB = 'https://gxfbwwuyzqtojbhuvwer.supabase.co';
const KEY = 'sb_publishable_Dn0OSuEiheGb5YrkA6YSKw_sO7OB3ZS'; // 公開金鑰，權限由資料庫 RLS 控制

const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async (req, res) => {
  const code = String((req.query && req.query.code) || '').toLowerCase();
  let card = null;
  if (/^[0-9a-f]{8}$/.test(code)) {
    try {
      const r = await fetch(SB + '/rest/v1/rpc/run_card', {
        method: 'POST',
        headers: { apikey: KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_code: code }),
      });
      if (r.ok) card = await r.json();
    } catch (e) { /* fall back to the generic card */ }
  }
  const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host);
  const target = origin + '/' + (card ? '?r=' + code : '');
  const image = SB + '/functions/v1/og' + (card ? '?code=' + code : '');
  const title = card
    ? `${card.name} 守護了 ${card.prot_p} 位路人、${card.prot_c} 輛車｜颱風大作戰 病樹清除隊`
    : '颱風大作戰 病樹清除隊';
  const desc = card
    ? `英雄榜第 ${card.hero_rank} 名！邀請你一起互助，把病樹清乾淨。60 秒挑戰，你能守護多少人？`
    : '邀請你一起互助，把病樹清乾淨。60 秒挑戰，你能守護多少人？';
  const html = `<!doctype html>
<html lang="zh-Hant"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="颱風大作戰 病樹清除隊">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(origin + '/s/' + code)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${esc(target)}">
</head><body>
<p><a href="${esc(target)}">前往 颱風大作戰 病樹清除隊</a></p>
<script>location.replace(${JSON.stringify(target)})</script>
</body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.status(200).send(html);
};
