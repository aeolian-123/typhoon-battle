// 颱風大作戰 病樹清除隊 — 分享圖片（Open Graph, 1200x630 PNG）
// GET /functions/v1/og?code=xxxxxxxx  → 該局成績卡；沒有 code 或查無資料 → 通用邀請卡
import React from 'npm:react@^19'
import { ImageResponse } from 'npm:@vercel/og@^0'

const SB_URL = Deno.env.get('SUPABASE_URL') ?? 'https://gxfbwwuyzqtojbhuvwer.supabase.co'
const SB_KEY = 'sb_publishable_Dn0OSuEiheGb5YrkA6YSKw_sO7OB3ZS' // public key, read-only by RLS
const SITE = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '') // e.g. https://typhoon-battle.vercel.app — logo is read from SITE/logo.png

const C = { ink: '#1d2433', sky: '#8fd3ff', grass: '#7fd06b', walk: '#efe3cf', road: '#5b6370', red: '#d9423b', yellow: '#ffcf3a', vest: '#ff7a2f', green: '#1f8a39', paper: '#ffffff', rot: '#a8742e' }

type Card = { name: string; prot_p: number; prot_c: number; hero_rank: number; total: number } | null

async function getCard(code: string | null): Promise<Card> {
  if (!code || !/^[0-9a-f]{8}$/.test(code)) return null
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/run_card`, {
      method: 'POST',
      headers: { apikey: SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_code: code }),
    })
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}

async function loadFont(text: string): Promise<ArrayBuffer> {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@900&text=${encodeURIComponent(text)}`)).text()
  const m = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)
  if (!m) throw new Error('font not found')
  return await (await fetch(m[1])).arrayBuffer()
}

function Tree({ x, sick }: { x: number; sick: boolean }) {
  const leaf = sick ? '#a8742e' : '#46b04a'
  const leaf2 = sick ? '#e6d34f' : '#7bd36a'
  return (
    <div style={{ position: 'absolute', left: x, top: 250, width: 90, height: 150, display: 'flex' }}>
      <div style={{ position: 'absolute', left: 36, top: 80, width: 18, height: 70, background: '#7a5230', border: `4px solid ${C.ink}` }} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: 90, height: 90, background: leaf, border: `5px solid ${C.ink}` }} />
      <div style={{ position: 'absolute', left: 14, top: 14, width: 26, height: 22, background: leaf2 }} />
      {sick ? <div style={{ position: 'absolute', left: 50, top: 46, width: 20, height: 18, background: '#6e4823' }} /> : null}
    </div>
  )
}

function render(card: Card) {
  const title = '颱風大作戰'
  const sub = '病樹清除隊'
  const cta = '邀請你一起互助，把病樹清乾淨！'
  const lines = card
    ? { who: `${card.name} 守護了`, big: `${card.prot_p} 位路人・${card.prot_c} 輛車`, rank: `英雄榜第 ${card.hero_rank} 名／共 ${card.total} 位隊員` }
    : { who: '60 秒挑戰', big: '你能守護多少人？', rank: '砍掉褐根病樹，別讓颱風把它們吹倒' }
  const text = title + sub + cta + lines.who + lines.big + lines.rank + '0123456789／・'
  return { text, el: (
    <div style={{ width: 1200, height: 630, display: 'flex', position: 'relative', background: C.sky, fontFamily: 'Noto Sans TC' }}>
      <div style={{ position: 'absolute', left: 0, top: 380, width: 1200, height: 70, background: C.grass, display: 'flex' }} />
      <div style={{ position: 'absolute', left: 0, top: 450, width: 1200, height: 50, background: C.walk, display: 'flex' }} />
      <div style={{ position: 'absolute', left: 0, top: 500, width: 1200, height: 6, background: C.red, display: 'flex' }} />
      <div style={{ position: 'absolute', left: 0, top: 506, width: 1200, height: 124, background: C.road, display: 'flex' }} />
      <div style={{ position: 'absolute', left: 0, top: 562, width: 1200, height: 10, display: 'flex', gap: 40, paddingLeft: 20 }}>
        {Array.from({ length: 16 }).map((_, i) => <div key={i} style={{ width: 40, height: 8, background: '#f2ecd8' }} />)}
      </div>
      <Tree x={40} sick={false} />
      <Tree x={170} sick={true} />
      <Tree x={1070} sick={false} />
      {SITE ? <img src={SITE + '/logo.png'} width={240} height={91} style={{ position: 'absolute', right: 40, top: 30 }} /> : null}
      <div style={{ position: 'absolute', left: 60, top: 40, display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ fontSize: 76, color: C.ink, display: 'flex' }}>{title}</div>
        <div style={{ fontSize: 34, color: C.yellow, background: C.ink, padding: '6px 18px', display: 'flex' }}>{sub}</div>
      </div>
      <div style={{ position: 'absolute', left: 300, top: 160, width: 740, display: 'flex', flexDirection: 'column', background: C.paper, border: `8px solid ${C.ink}`, boxShadow: `12px 12px 0 ${C.ink}`, padding: '26px 36px', gap: 6 }}>
        <div style={{ fontSize: 38, color: C.ink, display: 'flex' }}>{lines.who}</div>
        <div style={{ fontSize: 66, color: card ? C.green : C.vest, display: 'flex', lineHeight: 1.15 }}>{lines.big}</div>
        <div style={{ fontSize: 28, color: '#56616d', display: 'flex' }}>{lines.rank}</div>
      </div>
      <div style={{ position: 'absolute', left: 300, top: 455, width: 740, display: 'flex', justifyContent: 'center', background: C.yellow, border: `6px solid ${C.ink}`, padding: '14px 20px', fontSize: 40, color: C.ink }}>{cta}</div>
    </div>
  ) }
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const card = await getCard(url.searchParams.get('code'))
  const { text, el } = render(card)
  try {
    const font = await loadFont(text)
    return new ImageResponse(el, {
      width: 1200, height: 630,
      fonts: [{ name: 'Noto Sans TC', data: font, weight: 900, style: 'normal' }],
      headers: { 'Cache-Control': 'public, max-age=600, s-maxage=600', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return new Response('og error: ' + (e as Error).message, { status: 500 })
  }
})
