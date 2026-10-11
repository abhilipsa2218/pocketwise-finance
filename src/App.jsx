import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CalendarDays, Check,
  ChevronDown, CircleHelp, CreditCard, Download, Gauge, HeartPulse, Home, Lightbulb,
  Menu, Plus, RotateCcw, Settings2, ShieldAlert, Sparkles, Target, TrendingDown,
  TrendingUp, Wallet, X, Zap, ShoppingBag, Coffee, TrainFront, Utensils, Smartphone,
  Play, CircleDollarSign, PiggyBank, SlidersHorizontal, CheckCircle2, Clock3
} from 'lucide-react';
import initialData from './data/initialData.json';

const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(n));
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const categoryIcons = { Essentials: ShoppingBag, Transport: TrainFront, Lifestyle: Sparkles, Bills: Smartphone, Food: Utensils, Subscriptions: Play };
const categories = ['Essentials', 'Food', 'Transport', 'Lifestyle', 'Bills', 'Subscriptions', 'Health', 'Other'];
const freshData = () => JSON.parse(JSON.stringify(initialData));

function loadData() {
  try {
    const saved = localStorage.getItem('pocketwise-v1');
    return saved ? { ...freshData(), ...JSON.parse(saved) } : freshData();
  } catch { return freshData(); }
}

function IconBadge({ icon: Icon, tone = 'mint', size = 18 }) {
  return <span className={`icon-badge ${tone}`}><Icon size={size} strokeWidth={2} /></span>;
}

function ProgressBar({ value, tone = 'mint' }) {
  return <div className="progress-track"><div className={`progress-fill ${tone}`} style={{ width: `${clamp(value, 0, 100)}%` }} /></div>;
}

function App() {
  const [data, setData] = useState(loadData);
  const [page, setPage] = useState('Overview');
  const [showExpense, setShowExpense] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [toast, setToast] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ name: '', amount: '', category: 'Food' });
  const [decision, setDecision] = useState({ type: 'purchase', amount: 1200, label: 'New headphones' });
  const [simApplied, setSimApplied] = useState(false);
  const [goalContribution, setGoalContribution] = useState(200);

  useEffect(() => { localStorage.setItem('pocketwise-v1', JSON.stringify(data)); }, [data]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const activeSubs = data.subscriptions.filter(s => s.active);
  const committed = data.plannedCommitments.reduce((sum, c) => sum + c.amount, 0);
  const futureSubs = activeSubs.reduce((sum, s) => sum + s.amount, 0);
  const currentBalance = data.startingBalance - data.expenses.reduce((sum, e) => sum + e.amount, 0) - data.saved;
  const daysLeft = Math.max(1, data.daysInCycle - data.dayOfCycle + 1);
  const spendable = Math.max(0, currentBalance - committed - futureSubs);
  const dailyAllowance = spendable / daysLeft;
  const totalSpent = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetProgress = totalSpent / data.monthlyBudget * 100;
  const avgDaily = totalSpent / Math.max(1, data.dayOfCycle);
  const forecast = currentBalance - (avgDaily * daysLeft) - committed - futureSubs;
  const totalGoalTarget = data.goals.reduce((sum, g) => sum + g.target, 0);
  const totalGoalCurrent = data.goals.reduce((sum, g) => sum + g.current, 0);
  const savingsRate = data.startingBalance ? data.saved / data.startingBalance * 100 : 0;
  const risk = clamp(Math.round((budgetProgress * 0.34) + (committed / Math.max(1, currentBalance) * 30) + (forecast < 0 ? 30 : forecast < 1000 ? 15 : 0) - (activeSubs.length === 0 ? 4 : 0)), 5, 98);
  const health = clamp(Math.round(100 - risk * 0.52 + Math.min(15, savingsRate * 0.5) + (forecast > 1500 ? 8 : forecast > 0 ? 3 : -10)), 8, 98);
  const healthLabel = health >= 75 ? 'Looking healthy' : health >= 50 ? 'Needs attention' : 'At risk';
  const riskLabel = risk < 35 ? 'Low' : risk < 65 ? 'Moderate' : 'High';
  const spendByCategory = useMemo(() => categories.map(category => ({
    category, amount: data.expenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0)
  })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount), [data.expenses]);
  const maxCategory = Math.max(1, ...spendByCategory.map(c => c.amount));
  const categoryColors = ['#72c6a5', '#f4b183', '#a99be9', '#80aeea', '#f0d56d', '#e88c9a', '#78b9c8', '#c5c9cf'];
  const spendGradient = spendByCategory.length
    ? `conic-gradient(${spendByCategory.map((item, index) => {
        const start = spendByCategory.slice(0, index).reduce((sum, entry) => sum + entry.amount, 0) / Math.max(1, totalSpent) * 100;
        const end = spendByCategory.slice(0, index + 1).reduce((sum, entry) => sum + entry.amount, 0) / Math.max(1, totalSpent) * 100;
        const color = categoryColors[categories.indexOf(item.category)] || '#c5c9cf';
        return `${color} ${start}% ${end}%`;
      }).join(', ')})`
    : '#e8ece7';
  const weeklyBars = useMemo(() => [0, 1, 2, 3].map((w) => {
    const from = w * 7 + 1, to = Math.min((w + 1) * 7, 30);
    const value = data.expenses.filter(e => e.day >= from && e.day <= to).reduce((sum, e) => sum + e.amount, 0);
    return { label: ['W1', 'W2', 'W3', 'W4'][w], value, height: Math.max(5, value / 1500 * 100) };
  }), [data.expenses]);
  const sim = useMemo(() => {
    const cost = Number(decision.amount) || 0;
    let newBalance = currentBalance, newSaved = data.saved, newCommitments = committed, newSubs = futureSubs;
    if (decision.type === 'purchase' || decision.type === 'unexpected') newBalance -= cost;
    if (decision.type === 'save') { newBalance -= cost; newSaved += cost; }
    if (decision.type === 'cancel') newSubs = Math.max(0, futureSubs - cost);
    if (decision.type === 'commitment') newCommitments += cost;
    const nextSpendable = Math.max(0, newBalance - newCommitments - newSubs);
    const nextDaily = nextSpendable / daysLeft;
    const nextForecast = newBalance - avgDaily * daysLeft - newCommitments - newSubs;
    const nextRisk = clamp(Math.round((Math.max(0, (totalSpent + (decision.type === 'purchase' || decision.type === 'unexpected' ? cost : 0)) / data.monthlyBudget * 100) * .34) + (newCommitments / Math.max(1, newBalance) * 30) + (nextForecast < 0 ? 30 : nextForecast < 1000 ? 15 : 0) - (activeSubs.length === 0 ? 4 : 0)), 5, 98);
    const nextHealth = clamp(Math.round(100 - nextRisk * .52 + Math.min(15, newSaved / data.startingBalance * 50) + (nextForecast > 1500 ? 8 : nextForecast > 0 ? 3 : -10)), 8, 98);
    return { newBalance, nextSpendable, nextDaily, nextForecast, nextRisk, nextHealth, dailyDelta: nextDaily - dailyAllowance, forecastDelta: nextForecast - forecast, healthDelta: nextHealth - health };
  }, [decision, currentBalance, data.saved, committed, futureSubs, daysLeft, avgDaily, totalSpent, data.monthlyBudget, data.startingBalance, activeSubs.length, dailyAllowance, forecast, health]);

  function addExpense(e) {
    e.preventDefault();
    const amount = Number(expenseForm.amount);
    if (!expenseForm.name.trim() || !amount || amount <= 0) { setToast('Add a name and a valid amount first.'); return; }
    setData(prev => ({ ...prev, expenses: [{ id: `e${Date.now()}`, name: expenseForm.name.trim(), category: expenseForm.category, amount, day: prev.dayOfCycle }, ...prev.expenses] }));
    setExpenseForm({ name: '', amount: '', category: 'Food' });
    setShowExpense(false);
    setToast('Expense added. Your money picture is updated.');
  }

  function toggleSubscription(id) {
    setData(prev => ({ ...prev, subscriptions: prev.subscriptions.map(s => s.id === id ? { ...s, active: !s.active } : s) }));
    const sub = data.subscriptions.find(s => s.id === id);
    setToast(sub?.active ? `${sub.name} paused. Your forecast improved.` : `${sub?.name} reactivated.`);
  }

  function applyDecision() {
    const amount = Number(decision.amount) || 0;
    if (amount <= 0) { setToast('Enter an amount greater than ₹0.'); return; }
    if (decision.type === 'purchase' || decision.type === 'unexpected') {
      setData(prev => ({ ...prev, expenses: [{ id: `e${Date.now()}`, name: decision.label || (decision.type === 'unexpected' ? 'Unexpected expense' : 'Simulated purchase'), category: decision.type === 'unexpected' ? 'Other' : 'Lifestyle', amount, day: prev.dayOfCycle }, ...prev.expenses] }));
    } else if (decision.type === 'save') {
      setData(prev => ({ ...prev, saved: prev.saved + amount, goals: prev.goals.map((g, i) => i === 0 ? { ...g, current: Math.min(g.target, g.current + amount) } : g) }));
    } else if (decision.type === 'commitment') {
      setData(prev => ({ ...prev, plannedCommitments: [...prev.plannedCommitments, { id: `c${Date.now()}`, name: decision.label || 'New commitment', amount, due: 'Just added', type: 'flexible' }] }));
    } else if (decision.type === 'cancel') {
      const candidate = data.subscriptions.find(s => s.active && s.amount <= amount);
      if (candidate) toggleSubscription(candidate.id);
      else { setToast('Choose an amount matching an active subscription.'); return; }
    }
    setSimApplied(true);
    setShowSimulator(false);
    setToast('Decision applied. Your dashboard has been recalculated.');
  }

  function resetDemo() {
    setData(freshData());
    setSimApplied(false);
    setToast('Demo data reset.');
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ ...data, calculated: { currentBalance, dailyAllowance, forecast, risk, health } }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pocketwise-finance-data.json'; a.click(); URL.revokeObjectURL(url);
    setToast('Your finance snapshot is ready to export.');
  }

  const navItems = [
    { label: 'Overview', icon: Home }, { label: 'Transactions', icon: CreditCard },
    { label: 'Savings goals', icon: Target }, { label: 'Subscriptions', icon: RotateCcw },
    { label: 'Decision lab', icon: SlidersHorizontal }
  ];

  function navigate(label) {
    setPage(label); setMobileNav(false);
    if (label === 'Decision lab') setShowSimulator(true);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="brand"><span className="brand-mark"><Wallet size={21} /></span><span>Pocketwise<span className="brand-dot">.</span><small>YOUR MONEY, IN FOCUS</small></span><button className="mobile-close icon-button" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
        <div className="profile-card"><div className="avatar">A</div><div className="profile-copy"><strong>Hey, Alex 👋</strong><span>Your 30-day reset</span></div><ChevronDown size={16} className="muted-icon"/></div>
        <div className="nav-label">YOUR SPACE</div>
        <nav>{navItems.map(item => <button key={item.label} className={`nav-item ${page === item.label ? 'active' : ''}`} onClick={() => navigate(item.label)}><item.icon size={18}/><span>{item.label}</span>{item.label === 'Decision lab' && <span className="new-pill">NEW</span>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="mini-tip"><div className="tip-icon"><Lightbulb size={17}/></div><strong>Little choices add up.</strong><p>One mindful decision today can make next week feel lighter.</p><button onClick={() => setShowSimulator(true)}>Try a what-if <ArrowRight size={14}/></button></div><button className="nav-item subtle" onClick={resetDemo}><RotateCcw size={17}/><span>Reset demo data</span></button><div className="sidebar-foot"><span className="online-dot"/> Demo mode · Data stays on this device</div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)}><Menu size={21}/></button><div className="breadcrumb">My money <span>/</span> <strong>{page}</strong></div><div className="top-actions"><span className="cycle-pill"><CalendarDays size={14}/> Oct 1 – Oct 30</span><button className="icon-button notification" aria-label="Notifications" onClick={() => setToast('You’re all caught up. No urgent alerts.')}><Bell size={18}/><i/></button><div className="top-avatar">A</div></div></header>
        <div className="content">
          <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/> YOUR 30-DAY MONEY RESET</div><h1>{page === 'Overview' ? 'Make your money' : page === 'Transactions' ? 'Every rupee, accounted for.' : page === 'Savings goals' ? 'Save for what matters.' : page === 'Subscriptions' ? 'Keep the good. Cut the rest.' : 'Think it through, first.'}<br/><span>{page === 'Overview' ? 'make sense.' : page === 'Transactions' ? 'Know where it goes.' : page === 'Savings goals' ? 'One small step at a time.' : page === 'Subscriptions' ? 'Your money, your call.' : 'Your money, your rules.'}</span></h1><p className="welcome-sub">{page === 'Overview' ? 'A little clarity today can mean a lot more freedom tomorrow.' : 'Your choices connect. See the whole picture before you make a move.'}</p></div><button className="primary-button" onClick={() => setShowExpense(true)}><Plus size={17}/> Add transaction</button></section>

          {page === 'Overview' && <>
            <section className="hero-grid">
              <div className="balance-card">
                <div className="balance-top"><span className="card-kicker"><span className="white-dot"/> YOUR AVAILABLE BALANCE</span><button className="round-arrow" onClick={() => setShowSimulator(true)} aria-label="Simulate a decision"><ArrowUpRight size={18}/></button></div>
                <div className="balance-amount">{money(currentBalance)}<span className="balance-currency"> INR</span></div>
                <div className="balance-sub"><span className="balance-change"><ArrowDownRight size={14}/> {Math.round(budgetProgress)}% used</span><span>of {money(data.monthlyBudget)} monthly budget</span></div>
                <div className="hero-progress"><div style={{ width: `${clamp(budgetProgress, 0, 100)}%` }}/></div>
                <div className="balance-bottom"><div><span className="micro-label">SPENT SO FAR</span><strong>{money(totalSpent)}</strong></div><div><span className="micro-label">SET ASIDE</span><strong>{money(data.saved)}</strong></div><div><span className="micro-label">DAYS LEFT</span><strong>{daysLeft} <small>days</small></strong></div></div>
                <div className="hero-decoration decor-one"/><div className="hero-decoration decor-two"/>
              </div>
              <div className="daily-card">
                <div className="section-mini-head"><span className="soft-icon"><Gauge size={18}/></span><span className="muted-label">YOUR DAILY PACE</span><span className="live-tag"><span/> LIVE</span></div>
                <div className="daily-number">{money(dailyAllowance)}<span>/ day</span></div>
                <p className="daily-copy">Safe-to-spend after upcoming commitments and active subscriptions.</p>
                <div className="daily-divider"/>
                <div className="mini-metric"><span>Projected month-end</span><strong className={forecast < 0 ? 'negative' : ''}>{money(forecast)}</strong></div>
                <div className="mini-metric"><span>Daily average so far</span><strong>{money(avgDaily)}</strong></div>
                <button className="text-button" onClick={() => setShowSimulator(true)}>Can I afford something? <ArrowRight size={15}/></button>
              </div>
            </section>

            <section className="metric-grid">
              <MetricCard icon={TrendingDown} tone="peach" label="Spent this month" value={money(totalSpent)} detail={`${Math.round(budgetProgress)}% of your budget`} trend={budgetProgress > data.dayOfCycle / 30 * 100 ? 'Spending ahead of pace' : 'You’re on a steady pace'} />
              <MetricCard icon={PiggyBank} tone="lilac" label="Savings progress" value={`${Math.round(totalGoalCurrent / Math.max(1, totalGoalTarget) * 100)}%`} detail={`${money(totalGoalCurrent)} across ${data.goals.length} goals`} trend="Every little bit counts" />
              <MetricCard icon={ShieldAlert} tone={risk >= 65 ? 'peach' : 'mint'} label="Financial risk" value={riskLabel} detail={`${risk}/100 risk score`} trend={risk >= 65 ? 'A few choices need a rethink' : 'You have room to plan'} />
              <MetricCard icon={HeartPulse} tone="blue" label="Money health" value={`${health}/100`} detail={healthLabel} trend={health >= 70 ? 'You’re building good habits' : 'Small changes can help'} />
            </section>

            <section className="middle-grid">
              <div className="panel spending-panel"><PanelHeading title="Spending snapshot" subtitle="Where your money has gone" action="View transactions" onAction={() => setPage('Transactions')}/><div className="spending-layout"><div className="donut-wrap"><div className="donut" style={{ background: spendGradient }}><div><strong>{money(totalSpent)}</strong><span>TOTAL SPENT</span></div></div></div><div className="category-list">{spendByCategory.slice(0,5).map((c, i) => <div className="category-row" key={c.category}><span className={`legend-dot dot-${i}`}/><span className="category-name">{c.category}</span><div className="category-track"><div style={{width:`${c.amount/maxCategory*100}%`}} className={`category-fill fill-${i}`}/></div><strong>{money(c.amount)}</strong></div>)}</div></div><div className="panel-footnote"><span className="tiny-check"><Check size={12}/></span> Your spending is tracked locally, just for you.</div></div>
              <div className="panel trend-panel"><PanelHeading title="Your spending rhythm" subtitle="A week-by-week look" action="Details" onAction={() => setPage('Transactions')}/><div className="chart-legend"><span className="legend-dot dot-0"/> Spend per week <span className="chart-unit">INR</span></div><div className="bar-chart"><div className="chart-guides"><i/><i/><i/><i/></div>{weeklyBars.map((b, i) => <div className="bar-col" key={b.label}><span className="bar-value">{b.value ? (b.value >= 1000 ? `₹${(b.value/1000).toFixed(1)}k` : `₹${b.value}`) : '—'}</span><div className={`bar ${i === 1 ? 'current' : ''}`} style={{height:`${Math.min(100,b.height)}%`}}/><span className="bar-label">{b.label}</span></div>)}</div><div className="chart-insight"><span className="insight-spark"><Sparkles size={15}/></span><p><strong>{weeklyBars[1]?.value > weeklyBars[0]?.value ? 'Spending picked up in week 2.' : 'You’re keeping a steady rhythm.'}</strong> {weeklyBars[1]?.value > weeklyBars[0]?.value ? 'Try setting a soft cap for the next few days.' : 'Keep checking in before bigger purchases.'}</p></div></div>
            </section>

            <section className="bottom-grid"><div className="panel commitments-panel"><PanelHeading title="Coming up" subtitle="Commitments before month-end" action="See all" onAction={() => setPage('Subscriptions')}/><div className="commitment-list">{data.plannedCommitments.slice(0,3).map(c => <div className="commitment-row" key={c.id}><div className={`commitment-icon ${c.type}`}><CalendarDays size={17}/></div><div className="commitment-copy"><strong>{c.name}</strong><span>{c.due}</span></div><strong className="commitment-amount">{money(c.amount)}</strong></div>)}</div><div className="commitment-total"><span>Total still committed</span><strong>{money(committed + futureSubs)}</strong></div></div><div className="panel insight-panel"><div className="insight-heading"><span className="insight-orb"><Zap size={19}/></span><span className="muted-label">YOUR POCKETWISE NUDGE</span></div><h3>{forecast < 0 ? 'Let’s give future-you a little breathing room.' : dailyAllowance < 150 ? 'A tiny pause can protect your plans.' : 'You have options. Make them count.'}</h3><p>{forecast < 0 ? `Your current pace may leave you ${money(Math.abs(forecast))} short. Pause flexible spending or review upcoming subscriptions.` : `You can aim for ${money(Math.max(0,dailyAllowance))} a day after commitments. Check a decision before you say yes.`}</p><button className="secondary-button" onClick={() => setShowSimulator(true)}>Explore a decision <ArrowRight size={15}/></button><div className="insight-scribble">✳</div></div></section>
          </>}

          {page === 'Transactions' && <section className="panel page-panel"><PanelHeading title="Recent transactions" subtitle={`${data.expenses.length} transactions in this demo`} action="Export JSON" onAction={exportData}/><div className="transaction-summary"><div><span>Total spent</span><strong>{money(totalSpent)}</strong></div><div><span>Average transaction</span><strong>{money(totalSpent / Math.max(1,data.expenses.length))}</strong></div><div><span>Budget left before commitments</span><strong>{money(currentBalance)}</strong></div></div><div className="transaction-list">{data.expenses.slice().sort((a,b)=>b.day-a.day).map((e) => {const Icon=categoryIcons[e.category] || CircleDollarSign; return <div className="transaction-row" key={e.id}><IconBadge icon={Icon} tone={e.category === 'Food' ? 'peach' : e.category === 'Transport' ? 'blue' : 'mint'}/><div className="transaction-name"><strong>{e.name}</strong><span>{e.category} · Oct {e.day}</span></div><strong className="transaction-value">−{money(e.amount)}</strong></div>})}</div><button className="outline-button full-button" onClick={() => setShowExpense(true)}><Plus size={16}/> Add a transaction</button></section>}

          {page === 'Savings goals' && <section className="goals-page"><div className="goal-summary panel"><span className="soft-icon lilac"><Target size={19}/></span><div><span className="muted-label">TOTAL SAVED TOWARDS GOALS</span><h2>{money(totalGoalCurrent)} <small>of {money(totalGoalTarget)}</small></h2><ProgressBar value={totalGoalCurrent / Math.max(1,totalGoalTarget)*100} tone="lilac"/></div><div className="goal-summary-percent">{Math.round(totalGoalCurrent / Math.max(1,totalGoalTarget)*100)}%</div></div><div className="goal-cards">{data.goals.map(g => <div className="panel goal-card" key={g.id}><div className="goal-card-top"><IconBadge icon={g.id === 'g1' ? ShieldAlert : Sparkles} tone={g.color === 'mint' ? 'mint' : 'lilac'}/><span className="goal-deadline"><Clock3 size={13}/>{g.deadline}</span></div><h3>{g.name}</h3><div className="goal-amount"><strong>{money(g.current)}</strong><span>of {money(g.target)}</span></div><ProgressBar value={g.current / g.target * 100} tone={g.color}/><div className="goal-bottom"><span>{money(Math.max(0,g.target-g.current))} to go</span><span>{Math.round(g.current/g.target*100)}% there</span></div><button className="secondary-button full-button" onClick={() => {setDecision({type:'save',amount:200,label:`Add to ${g.name}`});setShowSimulator(true)}}><Plus size={15}/> Add money to goal</button></div>)}</div><div className="panel goal-tip"><Lightbulb size={20}/><div><strong>Make saving feel possible.</strong><p>Try moving a small amount first. The Decision Lab shows how saving affects your daily allowance before you commit.</p></div><button className="text-button" onClick={() => setShowSimulator(true)}>Open Decision Lab <ArrowRight size={15}/></button></div></section>}

          {page === 'Subscriptions' && <section className="panel page-panel"><PanelHeading title="Subscriptions & commitments" subtitle="Small renewals can make a big difference" action="Add expense" onAction={() => setShowExpense(true)}/><div className="subscription-total"><div><span className="muted-label">MONTHLY SUBSCRIPTION TOTAL</span><strong>{money(futureSubs)}</strong><span>{activeSubs.length} active services</span></div><div className="subscription-saved"><span>Potential monthly savings</span><strong>{money(data.subscriptions.filter(s=>!s.active).reduce((sum,s)=>sum+s.amount,0))}</strong></div></div><div className="subscription-list">{data.subscriptions.map(s => <div className={`subscription-row ${!s.active ? 'paused' : ''}`} key={s.id}><div className={`subscription-logo ${s.id}`}><Play size={17} fill="currentColor"/></div><div className="subscription-copy"><strong>{s.name}</strong><span>{s.active ? s.detail : 'Paused · No upcoming renewal'}</span></div><strong className="subscription-price">{money(s.amount)}<small>/mo</small></strong><button className={`toggle ${s.active ? 'on' : ''}`} aria-label={`${s.active ? 'Pause' : 'Activate'} ${s.name}`} onClick={() => toggleSubscription(s.id)}><span/></button></div>)}</div><div className="commitment-list commitments-detail">{data.plannedCommitments.map(c => <div className="commitment-row" key={c.id}><div className={`commitment-icon ${c.type}`}><CalendarDays size={17}/></div><div className="commitment-copy"><strong>{c.name}</strong><span>{c.due} · {c.type === 'essential' ? 'Essential' : 'Flexible'}</span></div><strong className="commitment-amount">{money(c.amount)}</strong></div>)}</div><div className="subscription-note"><CircleHelp size={16}/><span>Pausing a subscription changes your forecast; it does not cancel a real-world service.</span></div></section>}

          {page === 'Decision lab' && <section className="panel page-panel"><div className="lab-intro"><span className="soft-icon lilac"><SlidersHorizontal size={19}/></span><div><h2>Decision Lab</h2><p>Play out a money move before you make it in real life.</p></div></div><DecisionControls decision={decision} setDecision={setDecision} sim={sim} onApply={applyDecision} onReset={() => setDecision({type:'purchase',amount:1200,label:'New headphones'})}/></section>}
          <footer className="main-footer"><span>✳ Pocketwise</span><span>Built for mindful money moves · Demo experience only</span><button onClick={exportData}><Download size={13}/> Export data</button></footer>
        </div>
      </main>

      {showExpense && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowExpense(false)}><div className="modal"><div className="modal-head"><div><span className="eyebrow">QUICK UPDATE</span><h2>Add a transaction</h2><p>Keep your money picture up to date.</p></div><button className="icon-button" onClick={() => setShowExpense(false)}><X size={20}/></button></div><form onSubmit={addExpense}><label>What was it for?<input autoFocus value={expenseForm.name} onChange={e => setExpenseForm({...expenseForm,name:e.target.value})} placeholder="e.g. Lunch with friends" /></label><label>Amount in rupees<input type="number" min="1" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm,amount:e.target.value})} placeholder="350" /></label><label>Category<select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm,category:e.target.value})}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><div className="modal-note"><CircleHelp size={15}/> This updates your balance, allowance, forecast, and health score.</div><button className="primary-button full-button" type="submit"><Plus size={16}/> Add transaction</button></form></div></div>}

      {showSimulator && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowSimulator(false)}><div className="modal simulator-modal"><div className="modal-head"><div><span className="eyebrow">POCKETWISE PLAYGROUND</span><h2>What if you…</h2><p>Explore the ripple effect before you commit.</p></div><button className="icon-button" onClick={() => setShowSimulator(false)}><X size={20}/></button></div><DecisionControls decision={decision} setDecision={setDecision} sim={sim} onApply={applyDecision} onReset={() => setDecision({type:'purchase',amount:1200,label:'New headphones'})}/></div></div>}

      {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}<button onClick={() => setToast('')}><X size={14}/></button></div>}
    </div>
  );
}

function MetricCard({icon:Icon,tone,label,value,detail,trend}) {
  return <div className="metric-card"><div className="metric-top"><IconBadge icon={Icon} tone={tone}/><span className="metric-trend"><span className="tiny-trend-dot"/> LIVE</span></div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span><div className="metric-bottom">{trend}</div></div>;
}

function PanelHeading({title,subtitle,action,onAction}) {
  return <div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{action && <button className="text-button" onClick={onAction}>{action}<ArrowRight size={14}/></button>}</div>;
}

function DecisionControls({decision,setDecision,sim,onApply,onReset}) {
  const types = [
    {id:'purchase',label:'Buy something',icon:ShoppingBag,desc:'A planned purchase'},
    {id:'save',label:'Save more',icon:PiggyBank,desc:'Move money to savings'},
    {id:'unexpected',label:'Unexpected cost',icon:Zap,desc:'Life happens'},
    {id:'commitment',label:'New commitment',icon:CalendarDays,desc:'Add a future bill'},
    {id:'cancel',label:'Pause a sub',icon:RotateCcw,desc:'Free up a renewal'}
  ];
  return <div className="decision-controls"><div className="decision-type-grid">{types.map(t=><button key={t.id} className={`decision-type ${decision.type===t.id?'selected':''}`} onClick={()=>setDecision({...decision,type:t.id,amount:t.id==='cancel'?299:t.id==='save'?200:t.id==='commitment'?500:t.id==='unexpected'?800:1200,label:t.id==='purchase'?'New headphones':t.id==='save'?'Emergency cushion':t.id==='unexpected'?'Unexpected expense':t.id==='commitment'?'New commitment':'Subscription pause'})}><span className="decision-type-icon"><t.icon size={17}/></span><strong>{t.label}</strong><small>{t.desc}</small></button>)}</div>
    <div className="decision-inputs"><label className="decision-label">Give this decision a name<input value={decision.label} onChange={e=>setDecision({...decision,label:e.target.value})} placeholder="e.g. Concert tickets"/></label><div className="amount-input-wrap"><label className="decision-label">Amount</label><div className="amount-input"><span>₹</span><input type="number" min="1" max="10000" value={decision.amount} onChange={e=>setDecision({...decision,amount:Number(e.target.value)})}/></div><input className="amount-slider" type="range" min="50" max="5000" step="50" value={clamp(Number(decision.amount)||50,50,5000)} onChange={e=>setDecision({...decision,amount:Number(e.target.value)})}/><div className="slider-labels"><span>₹50</span><span>₹5,000</span></div></div></div>
    {decision.type==='cancel' && <div className="cancel-hint">Choose an amount that matches an active subscription: {`₹${[...new Set([119,79,299].filter(n=>n<=Number(decision.amount)||n===299))].join(', ₹')}`}. Applying pauses one matching active service.</div>}
    <div className="sim-results"><div className="sim-results-head"><span className="insight-spark"><Sparkles size={15}/></span><div><strong>Here’s the ripple effect</strong><span>Estimated impact on your money picture</span></div><span className="preview-tag">PREVIEW</span></div><div className="sim-metric-grid"><SimMetric label="Balance after" value={money(sim.newBalance)} delta={money(sim.newBalance - (sim.newBalance + (decision.type==='purchase'||decision.type==='unexpected'?Number(decision.amount):decision.type==='save'?Number(decision.amount):0)))} positive={sim.newBalance>=0}/><SimMetric label="Safe daily spend" value={money(sim.nextDaily)} delta={`${sim.dailyDelta>=0?'+':''}${money(sim.dailyDelta)}/day`} positive={sim.dailyDelta>=0}/><SimMetric label="Month-end forecast" value={money(sim.nextForecast)} delta={`${sim.forecastDelta>=0?'+':''}${money(sim.forecastDelta)}`} positive={sim.nextForecast>=0}/><SimMetric label="Money health" value={`${sim.nextHealth}/100`} delta={`${sim.healthDelta>=0?'+':''}${sim.healthDelta} pts`} positive={sim.healthDelta>=0}/></div><div className="risk-preview"><div><span>Financial risk</span><strong className={sim.nextRisk>=65?'negative':''}>{sim.nextRisk}/100 · {sim.nextRisk<35?'Low':sim.nextRisk<65?'Moderate':'High'}</strong></div><ProgressBar value={sim.nextRisk} tone={sim.nextRisk>=65?'peach':sim.nextRisk>=35?'lilac':'mint'}/></div></div>
    <div className="decision-actions"><button className="outline-button" onClick={onReset}><RotateCcw size={15}/> Reset</button><button className="primary-button" onClick={onApply}><Check size={16}/> Apply this decision</button></div>
    <p className="sim-disclaimer">A planning estimate, not financial advice. Applying a decision updates this local demo only.</p>
  </div>;
}

function SimMetric({label,value,delta,positive}) {
  return <div className="sim-metric"><span>{label}</span><strong>{value}</strong><small className={positive?'positive':'negative'}>{delta}</small></div>;
}

export default App;
