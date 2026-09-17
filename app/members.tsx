"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Download, Eye, EyeOff, Heart, Library, LoaderCircle, LockKeyhole, LogOut, Mail, PawPrint, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { browserDb, configured } from '../lib/supabase';

type Material = { id: string; section: string; label: string; title: string; description: string; body: string; image_path: string | null; file_path: string | null; imageUrl?: string };
const sections = [{ id: 'protocol', title: 'Protocolo 7 Dias', subtitle: 'Todos os conteúdos, sempre à mão.' }, { id: 'bonus', title: 'Um cuidado a mais', subtitle: 'Seus guias e materiais complementares.' }, { id: 'checklist', title: 'Checklist diário', subtitle: 'Consulte e baixe seu material de apoio.' }];
const db = () => browserDb();

function Brand() { return <a className="brand" href="/" aria-label="Protocolo Coceira"><span className="brand-icon"><PawPrint size={25}/></span><span>protocolo<strong>coceira<span>®</span></strong></span></a>; }

function Login({ onSession }: { onSession: (session: Session) => void }) {
  const [mode, setMode] = useState<'login' | 'email' | 'code' | 'password'>('login');
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirm, setConfirm] = useState(''), [code, setCode] = useState('');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [visible, setVisible] = useState(false), [cooldown, setCooldown] = useState(0);
  const verified = useRef<Session | null>(null);
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(timer); }, [cooldown]);
  async function sendCode() {
    const { error } = await db().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    if (error) throw new Error('Não foi possível enviar agora. Confira o e-mail e tente novamente em instantes.');
    setMode('code'); setCooldown(60); setMessage('Confira sua caixa de entrada e a pasta de spam.');
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setMessage(''); setBusy(true);
    try {
      if (!configured) throw new Error('A área está sendo preparada. Tente novamente mais tarde.');
      if (mode === 'email') await sendCode();
      else if (mode === 'login') {
        const { data, error } = await db().auth.signInWithPassword({ email: email.trim(), password });
        if (error || !data.session) throw new Error('E-mail ou senha incorretos. No primeiro acesso, crie sua senha abaixo.');
        onSession(data.session);
      } else if (mode === 'code') {
        const { data, error } = await db().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
        if (error || !data.session) throw new Error('Código inválido ou expirado. Confira e tente novamente.');
        verified.current = data.session; setPassword(''); setMode('password');
      } else {
        if (password !== confirm) throw new Error('As senhas precisam ser iguais.');
        const { error } = await db().auth.updateUser({ password });
        if (error) throw new Error('Não foi possível salvar. Use uma senha forte com pelo menos 8 caracteres.');
        if (verified.current) onSession(verified.current);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <div className="login-layout"><aside className="login-story"><Brand/><div><span className="eyebrow">CUIDAR TAMBÉM É ESTAR PERTO</span><h1>O carinho de sempre.<br/><em>Um cuidado a mais.</em></h1><p>Seu espaço para consultar conteúdos e cuidar de quem faz a sua vida mais feliz.</p><div className="pet-emblem"><PawPrint strokeWidth={1}/><span>FEITO PARA QUEM AMA CUIDAR</span></div></div><small>Protocolo Coceira · Área de membros</small></aside><main className="login-main"><div className="mobile-brand"><Brand/></div><div className="login-box"><span className="round-icon"><LockKeyhole size={23}/></span><span className="eyebrow">SEU ESPAÇO DE CUIDADO</span><h2>{mode === 'login' ? 'Que bom ter você aqui.' : mode === 'email' ? 'Vamos cuidar do seu acesso.' : mode === 'code' ? 'Confira seu e-mail.' : 'Escolha sua senha.'}</h2><p>{mode === 'login' ? 'Entre com o e-mail utilizado na compra.' : mode === 'email' ? 'Confirme seu e-mail para criar ou recuperar sua senha.' : mode === 'code' ? `Digite o código enviado para ${email}.` : 'Seu e-mail foi confirmado. Crie uma senha para os próximos acessos.'}</p><form onSubmit={submit}>
      {(mode === 'login' || mode === 'email') && <label>E-mail da compra<div className="input-wrap"><Mail size={18}/><input required type="email" autoComplete="email" placeholder="Seu e-mail" value={email} onChange={e => setEmail(e.target.value)}/></div></label>}
      {mode === 'code' && <label>Código de confirmação<input className="otp" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" maxLength={8} value={code} onChange={e => setCode(e.target.value)} placeholder="••••••"/></label>}
      {(mode === 'login' || mode === 'password') && <label>{mode === 'login' ? 'Senha' : 'Nova senha'}<div className="input-wrap"><LockKeyhole size={18}/><input required minLength={mode === 'password' ? 8 : 1} type={visible ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} placeholder="Sua senha" onChange={e => setPassword(e.target.value)}/><button type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>}
      {mode === 'password' && <label>Confirme sua senha<input required minLength={8} type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)}/></label>}
      {message && <p className="form-message" role="status">{message}</p>}
      <button className="primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18}/> : <>{mode === 'login' ? 'Entrar na minha biblioteca' : mode === 'email' ? 'Enviar código' : mode === 'code' ? 'Confirmar e-mail' : 'Salvar senha e entrar'}<ArrowRight size={18}/></>}</button>
    </form>{mode === 'login' ? <div className="login-links"><button onClick={() => { setMode('email'); setMessage(''); }}>Primeiro acesso? <b>Crie sua senha</b></button><button onClick={() => { setMode('email'); setMessage(''); }}>Esqueci minha senha</button></div> : <button className="text-button" onClick={() => { setMode('login'); setMessage(''); }}><ArrowLeft size={15}/> Voltar para entrar</button>}{mode === 'code' && <button className="text-button" disabled={busy || cooldown > 0} onClick={async () => { setBusy(true); try { await sendCode(); } catch { setMessage('Aguarde um pouco antes de reenviar.'); } finally { setBusy(false); } }}>{cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}</button>}<div className="secure-note"><ShieldCheck size={16}/> Seu acesso, com segurança e simplicidade.</div></div></main></div>;
}

function MaterialModal({ material, close }: { material: Material; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null); const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { const el = dialog.current; el?.showModal(); const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { el?.close(); document.body.style.overflow = old; }; }, []);
  async function download() {
    if (!material.file_path) return; setBusy(true); setError('');
    const { data, error } = await db().storage.from('materials').createSignedUrl(material.file_path, 60, { download: true });
    if (error) setError('Não foi possível abrir o arquivo. Atualize a página e tente novamente.');
    else { const link = document.createElement('a'); link.href = data.signedUrl; link.rel = 'noopener'; link.target = '_blank'; link.click(); }
    setBusy(false);
  }
  return <dialog ref={dialog} className="material-modal" onCancel={close} onClick={e => { if (e.target === e.currentTarget) close(); }} aria-labelledby="material-title"><div className="modal-inner"><button className="close" aria-label="Fechar conteúdo" onClick={close}><X/></button><div className={`modal-art tone-${material.section}`}>{material.imageUrl ? <img src={material.imageUrl} alt={material.title}/> : <BookOpen size={88} strokeWidth={1}/>}<span>{material.label}</span></div><div className="modal-copy"><span className="eyebrow">{material.label}</span><h2 id="material-title">{material.title}</h2><p className="material-description">{material.description}</p><div className="material-body">{material.body}</div>{error && <p role="alert">{error}</p>}<div className="modal-actions">{material.file_path && <button className="primary" disabled={busy} onClick={download}><Download size={17}/>{busy ? 'Abrindo…' : 'Baixar material'}</button>}<button className="secondary" onClick={close}>Fechar</button></div></div></div></dialog>;
}

function Shelf({ title, subtitle, items, open }: { title: string; subtitle: string; items: Material[]; open: (m: Material) => void }) {
  const rail = useRef<HTMLDivElement>(null);
  return <section className="shelf"><div className="section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><div className="rail-controls"><button aria-label={`Voltar em ${title}`} onClick={() => rail.current?.scrollBy({ left: -330, behavior: 'smooth' })}><ChevronLeft size={18}/></button><button aria-label={`Avançar em ${title}`} onClick={() => rail.current?.scrollBy({ left: 330, behavior: 'smooth' })}><ChevronRight size={18}/></button></div></div><div className="card-rail" ref={rail}>{items.map(m => <button className="material-card" key={m.id} onClick={() => open(m)}><div className={`card-art tone-${m.section}`}>{m.imageUrl ? <img src={m.imageUrl} alt="" loading="lazy"/> : <BookOpen size={55} strokeWidth={1}/>}<span className="card-label">{m.label}</span><span className="art-mark"><PawPrint size={17}/></span></div><div className="card-copy"><h3>{m.title}</h3><p>{m.description}</p><span className="card-link">Abrir conteúdo <ArrowRight size={18}/></span></div></button>)}</div></section>;
}

export default function Members() {
  const [session, setSession] = useState<Session | null>(null), [loading, setLoading] = useState(true), [materials, setMaterials] = useState<Material[]>([]), [error, setError] = useState(''), [access, setAccess] = useState(false), [selected, setSelected] = useState<Material | null>(null), [filter, setFilter] = useState('all'), [query, setQuery] = useState('');
  useEffect(() => { if (!configured) { setLoading(false); return; } const client = db(); client.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); }); const { data: listener } = client.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') { setSession(null); setMaterials([]); setSelected(null); } }); return () => listener.subscription.unsubscribe(); }, []);
  const load = useCallback(async () => {
    if (!session) return; setLoading(true); setError('');
    try {
      const client = db(); const { data: user, error: authError } = await client.auth.getUser();
      if (authError || !user.user) { setSession(null); return; }
      const [purchases, contents] = await Promise.all([client.from('purchases').select('order_id').eq('status','paid').limit(1), client.from('materials').select('*').order('position')]);
      if (purchases.error || contents.error) throw new Error('Não foi possível carregar sua biblioteca. Tente novamente.');
      setAccess(Boolean(purchases.data.length));
      const rows = await Promise.all((contents.data as Material[]).map(async m => { if (!m.image_path) return m; const { data } = await client.storage.from('materials').createSignedUrl(m.image_path, 300); return { ...m, imageUrl: data?.signedUrl }; }));
      setMaterials(rows);
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao carregar.'); } finally { setLoading(false); }
  }, [session]);
  useEffect(() => { void load(); }, [load]);
  if (loading && !session) return <div className="loading"><PawPrint/><p>Preparando seu espaço…</p></div>;
  if (!session) return <Login onSession={setSession}/>;
  const filtered = materials.filter(m => (filter === 'all' || m.section === filter) && `${m.title} ${m.label} ${m.description}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  return <div className="member-layout"><aside className="sidebar"><Brand/><span className="nav-caption">SEU ESPAÇO</span><nav>{[{ id:'all', title:'Minha biblioteca', icon: Library }, {id:'protocol',title:'Protocolo 7 dias',icon:BookOpen},{id:'bonus',title:'Meus bônus',icon:Sparkles},{id:'checklist',title:'Checklist diário',icon:Check}].map(n => <button key={n.id} className={filter === n.id ? 'active' : ''} onClick={() => setFilter(n.id)}><n.icon size={19}/><span>{n.title}</span></button>)}</nav><div className="sidebar-bottom"><Heart size={25}/><p>Mais cuidado.<br/>Mais momentos juntos.</p><button onClick={() => db().auth.signOut()}><LogOut size={17}/> Sair da conta</button></div></aside><main className="member-main"><div className="mobile-header"><Brand/><button aria-label="Sair da conta" onClick={() => db().auth.signOut()}><LogOut size={20}/></button></div><header className="topbar"><span><LockKeyhole size={13}/> ÁREA EXCLUSIVA PARA MEMBROS</span><span className="account-email">{session.user.email}</span></header><section className="welcome"><span className="eyebrow">BEM-VINDO AO SEU ESPAÇO</span><h1>Carinho em forma<br className="mobile-only"/> de <em>cuidado.</em></h1><p>Seus conteúdos reunidos, para consultar quando precisar.</p><div className="welcome-flower"><PawPrint strokeWidth={1}/></div></section><div className="library-tools"><div className="tabs" aria-label="Filtrar conteúdos">{[['all','Tudo'],['protocol','Protocolo'],['bonus','Bônus'],['checklist','Checklist']].map(([id,label]) => <button aria-pressed={filter === id} className={filter === id ? 'active' : ''} key={id} onClick={() => setFilter(id)}>{label}</button>)}</div><label className="search"><Search size={17}/><input aria-label="Buscar conteúdo" placeholder="Buscar na biblioteca" value={query} onChange={e => setQuery(e.target.value)}/></label></div>{loading ? <div className="empty"><LoaderCircle className="spin"/><p>Carregando seus conteúdos…</p></div> : error ? <div className="empty" role="alert"><p>{error}</p><button className="secondary" onClick={load}>Tentar novamente</button></div> : !access ? <div className="empty"><LockKeyhole/><h2>Aguardando liberação</h2><p>Use o mesmo e-mail da compra. Se o pagamento foi aprovado agora, aguarde alguns instantes e atualize.</p><button className="secondary" onClick={load}>Verificar meu acesso</button></div> : !filtered.length ? <div className="empty"><BookOpen/><h2>{query ? 'Nenhum conteúdo encontrado' : 'Sua biblioteca está sendo preparada'}</h2><p>{query ? 'Experimente buscar por outro nome.' : 'Seu acesso está liberado. Os materiais aparecerão aqui assim que forem publicados.'}</p></div> : sections.filter(s => filtered.some(m => m.section === s.id)).map(s => <Shelf key={s.id} title={s.title} subtitle={s.subtitle} items={filtered.filter(m => m.section === s.id)} open={setSelected}/>)}<footer><PawPrint size={17}/><span>Feito com carinho para você e seu melhor amigo.</span><small>Protocolo Coceira</small></footer></main>{selected && <MaterialModal material={selected} close={() => setSelected(null)}/>}</div>;
}
