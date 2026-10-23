-- 颱風大作戰 病樹清除隊：資料庫結構（已套用在 Supabase 專案 gxfbwwuyzqtojbhuvwer，此檔僅供備份與重建）

create table public.scores (
  id          bigint generated always as identity primary key,
  code        text        not null unique,             -- 8 碼分享碼，用在 /s/<code> 與 ?r=<code>
  name        text        not null check (char_length(name) between 1 and 8),
  prot_p      int         not null check (prot_p  between 0 and 270),
  prot_c      int         not null check (prot_c  between 0 and 90),
  crush_p     int         not null check (crush_p between 0 and 150),
  crush_c     int         not null check (crush_c between 0 and 60),
  cut         int         not null default 0 check (cut between 0 and 90),
  missed      int         not null default 0 check (missed between 0 and 90),
  hero        int generated always as (prot_p + prot_c) stored,   -- 英雄榜
  crush       int generated always as (crush_p + crush_c) stored, -- 壓扁榜
  invited_by  text,                                      -- 邀請人的分享碼
  device      text        not null,                      -- 瀏覽器隨機 ID，用於限制上傳頻率，不公開
  created_at  timestamptz not null default now()
);
create index scores_hero_idx   on public.scores (hero desc, created_at);
create index scores_crush_idx  on public.scores (crush desc, created_at);
create index scores_inv_idx    on public.scores (invited_by);
create index scores_device_idx on public.scores (device, created_at desc);

alter table public.scores enable row level security;
create policy "public can read scores" on public.scores for select to anon, authenticated using (true);
revoke all on public.scores from anon, authenticated;
grant select (code, name, prot_p, prot_c, crush_p, crush_c, cut, missed, hero, crush, invited_by, created_at)
  on public.scores to anon, authenticated;   -- device 欄位不開放讀取；一般人無法直接新增、修改、刪除

-- 名字黑名單：名字含有這些字詞時，上榜名稱會改成「清除隊員」
create table public.banned_words (word text primary key);
alter table public.banned_words enable row level security;
revoke all on public.banned_words from anon, authenticated;

-- 單局成績卡（含名次、總人數、邀請人數）
create or replace function public.run_card(p_code text)
returns json language sql stable security invoker set search_path = public as $$
  select json_build_object(
    'code', v.code, 'name', v.name,
    'prot_p', v.prot_p, 'prot_c', v.prot_c, 'crush_p', v.crush_p, 'crush_c', v.crush_c,
    'cut', v.cut, 'hero', v.hero, 'crush', v.crush,
    'hero_rank', 1 + (select count(*) from public.scores s where s.hero > v.hero or (s.hero = v.hero and s.created_at < v.created_at)),
    'crush_rank', 1 + (select count(*) from public.scores s where s.crush > v.crush or (s.crush = v.crush and s.created_at < v.created_at)),
    'total', (select count(*) from public.scores),
    'invites', (select count(*) from public.scores s where s.invited_by = v.code))
  from (select code, name, prot_p, prot_c, crush_p, crush_c, cut, hero, crush, created_at
        from public.scores where code = p_code) v
$$;

-- 上傳成績：唯一的寫入入口，含合理性檢查與頻率限制
create or replace function public.submit_run(
  p_name text, p_prot_p int, p_prot_c int, p_crush_p int, p_crush_c int,
  p_cut int, p_missed int, p_device text, p_ref text default null)
returns json language plpgsql volatile security definer set search_path = public as $$
declare v_name text := btrim(coalesce(p_name, '')); v_code text; v_ref text;
begin
  v_name := left(regexp_replace(v_name, '[[:cntrl:]<>&"]', '', 'g'), 8);
  if v_name = '' or exists (select 1 from public.banned_words b where position(lower(b.word) in lower(v_name)) > 0) then
    v_name := '清除隊員';
  end if;
  if p_device is null or char_length(p_device) not between 8 and 64 then raise exception 'bad_device'; end if;
  -- 每砍一棵病樹守護 1～3 人、最多 1 輛車
  if p_cut is null or p_cut not between 0 and 90
     or p_prot_p < p_cut or p_prot_p > p_cut * 3
     or p_prot_c < 0 or p_prot_c > p_cut
     or p_crush_p not between 0 and 150 or p_crush_c not between 0 and 60
     or p_missed not between 0 and 90 then
    raise exception 'implausible_score';
  end if;
  -- 一局約 63 秒；同一瀏覽器 50 秒內只能上傳一次，每天最多 150 局
  if exists (select 1 from public.scores where device = p_device and created_at > now() - interval '50 seconds') then raise exception 'too_fast'; end if;
  if (select count(*) from public.scores where device = p_device and created_at > now() - interval '1 day') >= 150 then raise exception 'daily_limit'; end if;
  if p_ref ~ '^[0-9a-f]{8}$' and exists (select 1 from public.scores where code = p_ref) then v_ref := p_ref; end if;
  loop
    v_code := substr(md5(gen_random_uuid()::text), 1, 8);
    begin
      insert into public.scores (code, name, prot_p, prot_c, crush_p, crush_c, cut, missed, invited_by, device)
      values (v_code, v_name, p_prot_p, p_prot_c, p_crush_p, p_crush_c, p_cut, coalesce(p_missed, 0), v_ref, p_device);
      exit;
    exception when unique_violation then end;
  end loop;
  return public.run_card(v_code);
end $$;

revoke all on function public.submit_run(text,int,int,int,int,int,int,text,text) from public;
revoke all on function public.run_card(text) from public;
grant execute on function public.submit_run(text,int,int,int,int,int,int,text,text) to anon, authenticated;
grant execute on function public.run_card(text) to anon, authenticated;
