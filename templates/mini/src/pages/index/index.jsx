import React, { useState } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.css';

const seeds = [
  { id: 'water', name: '好好喝水', note: '每天 8 杯，照顾好自己', icon: '💧', color: 'blue' },
  { id: 'read', name: '读一会儿书', note: '留 20 分钟给另一个世界', icon: '📖', color: 'yellow' },
  { id: 'walk', name: '出去走走', note: '让身体和心情一起呼吸', icon: '🌿', color: 'green' }
];
const storageKey = 'sprout-habits-v1';
function load() { try { return Taro.getStorageSync(storageKey) || { habits: seeds, records: {} }; } catch { return { habits: seeds, records: {} }; } }
function dayKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export default function Index() {
  const [data, setData] = useState(load);
  const [tab, setTab] = useState('today');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const now = new Date(); const today = dayKey(now);
  const done = data.records[today] || [];
  const progress = data.habits.length ? Math.round(done.filter(id => data.habits.some(h=>h.id===id)).length/data.habits.length*100) : 0;
  function save(next) { setData(next); Taro.setStorageSync(storageKey, next); }
  function toggle(id) { save({ ...data, records: { ...data.records, [today]: done.includes(id) ? done.filter(x=>x!==id) : [...done,id] } }); }
  function add() { if (!name.trim()) return; save({ ...data, habits: [...data.habits, { id: String(Date.now()), name: name.trim(), note: '一点点坚持，一点点改变', icon: '✨', color: 'purple' }] }); setName(''); setAdding(false); }
  return <View className="mini-app">
    <View className="mini-brand"><View className="brand-leaf">↗</View><Text>日常</Text><Text className="brand-en">DAY BY DAY</Text><Text className="mini-more">•••</Text></View>
    <View className="date-label">{now.getMonth()+1} 月 {now.getDate()} 日 · {['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()]}</View>
    <View className="greeting">把日子，过成喜欢的样子。</View>
    <View className="sub-greeting">小小的坚持，也在悄悄发光。</View>
    {tab === 'today' ? <>
      <View className="progress-card"><View><Text className="eyebrow">今日的小进步</Text><View className="progress-number">{done.length}<Text> / {data.habits.length}</Text></View><Text className="progress-caption">{progress===100?'今天也好好照顾自己了！':'每一步，都算数。'}</Text></View><View className="progress-circle"><Text>{progress}%</Text><Text className="circle-caption">已完成</Text></View><View className="card-sprig">✳</View></View>
      <View className="section-line"><Text>我的习惯</Text><Text className="muted-small">慢慢来，比较快</Text></View>
      <View className="habits">{data.habits.map(h=><View key={h.id} className={'habit-row '+(done.includes(h.id)?'is-done':'')}><View className={'habit-icon '+h.color}>{h.icon}</View><View className="habit-content"><Text className="habit-name">{h.name}</Text><Text className="habit-note">{h.note}</Text></View><Button aria-label={'打卡 '+h.name} className={'check-button '+(done.includes(h.id)?'checked':'')} onClick={()=>toggle(h.id)}>{done.includes(h.id)?'✓':'+'}</Button></View>)}</View>
      <Button className="add-habit" onClick={()=>setAdding(true)}>＋ 添加一个小习惯</Button>
      <View className="quote">“ 不必一下子变好，每天一点就好。 ”</View>
    </> : <View className="stats-panel"><View className="section-line">最近七天</View>{Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);const count=(data.records[dayKey(d)]||[]).length;return <View className="stat-row" key={i}><Text>{d.getMonth()+1}/{d.getDate()}</Text><View className="stat-track"><View className="stat-bar" style={{width:`${Math.min(100,count/Math.max(1,data.habits.length)*100)}%`}} /></View><Text>{count} 次</Text></View>})}<View className="quote">坚持留下的痕迹，都在这里。</View></View>}
    <View className="bottom-nav"><View className={tab==='today'?'active':''} onClick={()=>setTab('today')}><Text>▦</Text><Text>今天</Text></View><View className={tab==='stats'?'active':''} onClick={()=>setTab('stats')}><Text>▥</Text><Text>小成就</Text></View></View>
    {adding&&<View className="modal-shade"><View className="add-sheet"><View className="section-line">种下一个小习惯<Text onClick={()=>setAdding(false)}>×</Text></View><Input maxlength={24} value={name} onInput={e=>setName(e.detail.value)} placeholder="比如：每天早睡一点" focus /><Button className="confirm-habit" onClick={add}>开始坚持</Button></View></View>}
  </View>;
}
