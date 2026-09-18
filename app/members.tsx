"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Download, Eye, EyeOff, Heart, Library, LoaderCircle, LockKeyhole, LogOut, Mail, PawPrint, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { browserDb, configured } from '../lib/supabase';

type Material = { id: string; section: string; label: string; title: string; description: string; body: string; image_path: string | null; modal_image_path?: string | null; file_path: string | null; imageUrl?: string; modalImageUrl?: string };
const sections = [
  { id: 'protocol', title: 'Protocolo 7 Dias', subtitle: 'Todos os conteudos, sempre a mao.' },
  { id: 'bonus', title: 'Um cuidado a mais', subtitle: 'Seus guias e materiais complementares.' },
  { id: 'checklist', title: 'Checklist diario', subtitle: 'Consulte e baixe seu material de apoio.' }
];
const db = () => browserDb();

function Brand() {
  return <a className="brand" href="/" aria-label="Protocolo Coceira"><span className="brand-icon"><PawPrint size={25}/></span><span>protocolo<strong>coceira<span>®</span></strong></span></a>;
}

function Login({ onSession }: { onSession: (session: Session) => void }) {
  const [mode, setMode] = useState<'login' | 'first'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      if (!configured) throw new Error('A area esta sendo preparada. Tente novamente mais tarde.');
      if (mode === 'first') {
        if (password !== confirm) throw new Error('As senhas precisam ser iguais.');
        const created = await fetch('/api/access/create-password', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password })
        });
        const payload = await created.json().catch(() => ({}));
        if (!created.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Nao foi possivel criar sua senha agora.');
      }
      const { data, error } = await db().auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.session) throw new Error(mode === 'first' ? 'Senha criada. Volte e entre com seu e-mail e senha.' : 'E-mail ou senha incorretos. No primeiro acesso, crie sua senha abaixo.');
      onSession(data.session);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="login-layout">
    <aside className="login-story">
      <Brand/>
      <div>
        <span className="eyebrow">CUIDAR TAMBEM E ESTAR PERTO</span>
        <h1>O carinho de sempre.<br/><em>Um cuidado a mais.</em></h1>
        <p>Seu espaco para consultar conteudos e cuidar de quem faz a sua vida mais feliz.</p>
        <div className="pet-emblem"><PawPrint strokeWidth={1}/><span>FEITO PARA QUEM AMA CUIDAR</span></div>
      </div>
      <small>Protocolo Coceira · Area de membros</small>
    </aside>
    <main className="login-main">
      <div className="mobile-brand"><Brand/></div>
      <div className="login-box">
        <span className="round-icon"><LockKeyhole size={23}/></span>
        <span className="eyebrow">SEU ESPACO DE CUIDADO</span>
        <h2>{mode === 'login' ? 'Que bom ter voce aqui.' : 'Crie sua senha.'}</h2>
        <p>{mode === 'login' ? 'Entre com o e-mail utilizado na compra.' : 'Use o e-mail da compra aprovada. Se encontrarmos seu acesso, sua senha sera criada sem envio de e-mail.'}</p>
        <form onSubmit={submit}>
          <label>E-mail da compra<div className="input-wrap"><Mail size={18}/><input required type="email" autoComplete="email" placeholder="Seu e-mail" value={email} onChange={e => setEmail(e.target.value)}/></div></label>
          <label>{mode === 'login' ? 'Senha' : 'Crie uma senha'}<div className="input-wrap"><LockKeyhole size={18}/><input required minLength={mode === 'first' ? 8 : 1} type={visible ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} placeholder="Sua senha" onChange={e => setPassword(e.target.value)}/><button type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
          {mode === 'first' && <label>Confirme sua senha<div className="input-wrap"><LockKeyhole size={18}/><input required minLength={8} type={visible ? 'text' : 'password'} autoComplete="new-password" value={confirm} placeholder="Repita sua senha" onChange={e => setConfirm(e.target.value)}/></div></label>}
          {message && <p className="form-message" role="status">{message}{message.includes('compra aprovada') && <> <a href="https://pay.cakto.com.br/exdbjgo_1117253" target="_blank" rel="noopener noreferrer">Comprar agora</a></>}</p>}
          <button className="primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18}/> : <>{mode === 'login' ? 'Entrar na minha biblioteca' : 'Criar senha e entrar'}<ArrowRight size={18}/></>}</button>
        </form>
        {mode === 'login'
          ? <div className="login-links"><button onClick={() => { setMode('first'); setPassword(''); setConfirm(''); setMessage(''); }}>Primeiro acesso? <b>Crie sua senha</b></button><button onClick={() => setMessage('Para recuperar o acesso neste lancamento, fale com o suporte informando o e-mail da compra.')}>Esqueci minha senha</button></div>
          : <button className="text-button" onClick={() => { setMode('login'); setPassword(''); setConfirm(''); setMessage(''); }}><ArrowLeft size={15}/> Voltar para entrar</button>}
        <div className="secure-note"><ShieldCheck size={16}/> Seu acesso, com seguranca e simplicidade.</div>
      </div>
    </main>
  </div>;
}

function MaterialModal({ material, close }: { material: Material; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { el?.close(); document.body.style.overflow = old; };
  }, []);
  async function download() {
    if (!material.file_path) return;
    setBusy(true); setError('');
    const { data, error } = await db().storage.from('materials').createSignedUrl(material.file_path, 60, { download: true });
    if (error) setError('Nao foi possivel abrir o arquivo. Atualize a pagina e tente novamente.');
    else { const link = document.createElement('a'); link.href = data.signedUrl; link.rel = 'noopener'; link.target = '_blank'; link.click(); }
    setBusy(false);
  }
  const hasBody = material.body.trim().length > 0;
  return <dialog ref={dialog} className={`material-modal ${hasBody ? '' : 'image-only'}`} onCancel={close} onClick={e => { if (e.target === e.currentTarget) close(); }} aria-labelledby="material-title"><div className="modal-inner"><button className="close" aria-label="Fechar conteudo" onClick={close}><X/></button><div className={`modal-art tone-${material.section}`}>{material.modalImageUrl || material.imageUrl ? <img src={material.modalImageUrl || material.imageUrl} alt={material.title}/> : <BookOpen size={88} strokeWidth={1}/>}</div>{hasBody && <div className="modal-copy"><span className="eyebrow">{material.label}</span><h2 id="material-title">{material.title}</h2><p className="material-description">{material.description}</p><div className="material-body">{material.body}</div>{error && <p role="alert">{error}</p>}<div className="modal-actions">{material.file_path && <button className="primary" disabled={busy} onClick={download}><Download size={17}/>{busy ? 'Abrindo...' : 'Baixar material'}</button>}<button className="secondary" onClick={close}>Fechar</button></div></div>}</div></dialog>;
}

function Shelf({ title, subtitle, items, open }: { title: string; subtitle: string; items: Material[]; open: (m: Material) => void }) {
  const rail = useRef<HTMLDivElement>(null);
  return <section className="shelf"><div className="section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><div className="rail-controls"><button aria-label={`Voltar em ${title}`} onClick={() => rail.current?.scrollBy({ left: -330, behavior: 'smooth' })}><ChevronLeft size={18}/></button><button aria-label={`Avancar em ${title}`} onClick={() => rail.current?.scrollBy({ left: 330, behavior: 'smooth' })}><ChevronRight size={18}/></button></div></div><div className="card-rail" ref={rail}>{items.map(m => <button className="material-card" key={m.id} onClick={() => open(m)}><div className={`card-art tone-${m.section}`}>{m.imageUrl ? <img src={m.imageUrl} alt="" loading="lazy"/> : <BookOpen size={55} strokeWidth={1}/>}<span className="art-mark"><PawPrint size={17}/></span></div><div className="card-copy"><h3>{m.title}</h3><p>{m.description}</p><span className="card-link">Abrir conteudo <ArrowRight size={18}/></span></div></button>)}</div></section>;
}

export default function Members() {
  const [session, setSession] = useState<Session | null>(null), [loading, setLoading] = useState(true), [materials, setMaterials] = useState<Material[]>([]), [error, setError] = useState(''), [access, setAccess] = useState(false), [selected, setSelected] = useState<Material | null>(null), [filter, setFilter] = useState('all'), [query, setQuery] = useState('');
  useEffect(() => {
    if (!configured) { setLoading(false); return; }
    const client = db();
    client.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = client.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') { setSession(null); setMaterials([]); setSelected(null); } });
    return () => listener.subscription.unsubscribe();
  }, []);
  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true); setError('');
    try {
      const client = db();
      const { data: user, error: authError } = await client.auth.getUser();
      if (authError || !user.user) { setSession(null); return; }
      const [purchases, contents] = await Promise.all([client.from('purchases').select('order_id').eq('status','paid').limit(1), client.from('materials').select('*').order('position')]);
      if (purchases.error || contents.error) throw new Error('Nao foi possivel carregar sua biblioteca. Tente novamente.');
      setAccess(Boolean(purchases.data.length));
      const rows = await Promise.all((contents.data as Material[]).map(async m => {
        const [card, modal] = await Promise.all([
          m.image_path ? client.storage.from('materials').createSignedUrl(m.image_path, 300) : Promise.resolve({ data: null }),
          m.modal_image_path ? client.storage.from('materials').createSignedUrl(m.modal_image_path, 300) : Promise.resolve({ data: null })
        ]);
        return { ...m, imageUrl: card.data?.signedUrl, modalImageUrl: modal.data?.signedUrl };
      }));
      setMaterials(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, [session]);
  useEffect(() => { void load(); }, [load]);
  if (loading && !session) return <div className="loading"><PawPrint/><p>Preparando seu espaco...</p></div>;
  if (!session) return <Login onSession={setSession}/>;
  const filtered = materials.filter(m => (filter === 'all' || m.section === filter) && `${m.title} ${m.label} ${m.description}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  return <div className="member-layout"><aside className="sidebar"><Brand/><span className="nav-caption">SEU ESPACO</span><nav>{[{ id:'all', title:'Minha biblioteca', icon: Library }, {id:'protocol',title:'Protocolo 7 dias',icon:BookOpen},{id:'bonus',title:'Meus bonus',icon:Sparkles},{id:'checklist',title:'Checklist diario',icon:Check}].map(n => <button key={n.id} className={filter === n.id ? 'active' : ''} onClick={() => setFilter(n.id)}><n.icon size={19}/><span>{n.title}</span></button>)}</nav><div className="sidebar-bottom"><Heart size={25}/><p>Mais cuidado.<br/>Mais momentos juntos.</p><button onClick={() => db().auth.signOut()}><LogOut size={17}/> Sair da conta</button></div></aside><main className="member-main"><div className="mobile-header"><Brand/><button aria-label="Sair da conta" onClick={() => db().auth.signOut()}><LogOut size={20}/></button></div><header className="topbar"><span><LockKeyhole size={13}/> AREA EXCLUSIVA PARA MEMBROS</span><span className="account-email">{session.user.email}</span></header><section className="welcome"><span className="eyebrow">BEM-VINDO AO SEU ESPACO</span><h1>Carinho em forma<br className="mobile-only"/> de <em>cuidado.</em></h1><p>Seus conteudos reunidos, para consultar quando precisar.</p><div className="welcome-flower"><PawPrint strokeWidth={1}/></div></section><div className="library-tools"><div className="tabs" aria-label="Filtrar conteudos">{[['all','Tudo'],['protocol','Protocolo'],['bonus','Bonus'],['checklist','Checklist']].map(([id,label]) => <button aria-pressed={filter === id} className={filter === id ? 'active' : ''} key={id} onClick={() => setFilter(id)}>{label}</button>)}</div><label className="search"><Search size={17}/><input aria-label="Buscar conteudo" placeholder="Buscar na biblioteca" value={query} onChange={e => setQuery(e.target.value)}/></label></div>{loading ? <div className="empty"><LoaderCircle className="spin"/><p>Carregando seus conteudos...</p></div> : error ? <div className="empty" role="alert"><p>{error}</p><button className="secondary" onClick={load}>Tentar novamente</button></div> : !access ? <div className="empty"><LockKeyhole/><h2>Aguardando liberacao</h2><p>Use o mesmo e-mail da compra. Se o pagamento foi aprovado agora, aguarde alguns instantes e atualize.</p><button className="secondary" onClick={load}>Verificar meu acesso</button></div> : !filtered.length ? <div className="empty"><BookOpen/><h2>{query ? 'Nenhum conteudo encontrado' : 'Sua biblioteca esta sendo preparada'}</h2><p>{query ? 'Experimente buscar por outro nome.' : 'Seu acesso esta liberado. Os materiais aparecerao aqui assim que forem publicados.'}</p></div> : sections.filter(s => filtered.some(m => m.section === s.id)).map(s => <Shelf key={s.id} title={s.title} subtitle={s.subtitle} items={filtered.filter(m => m.section === s.id)} open={setSelected}/>)}<footer><PawPrint size={17}/><span>Feito com carinho para voce e seu melhor amigo.</span><small>Protocolo Coceira</small></footer></main>{selected && <MaterialModal material={selected} close={() => setSelected(null)}/>}</div>;
}
