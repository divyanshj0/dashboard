'use client';
import { useState } from 'react';
const TYPES = ['WaterProperty','Efficiency','EnergyEfficiency','ChemicalDosage','TreatedWaterChart','FlowRaterChart','ChemicalChart'];

export default function WidgetEditorModal({ widgets, setWidgets, onClose }) {
  const [editList, setEditList] = useState([...widgets]);

  const update = (i, key, v) => { editList[i][key] = v; setEditList([...editList]); };
  const add = () => setEditList([...editList, {
    i: `w_${Date.now()}`, type: 'Efficiency', x:0,y:0,w:3,h:2, props:{key:'',value:0,view:'daily'}
  }]);
  const remove = idx => setEditList(editList.filter((_,i)=>i!==idx));
  const save = () => { setWidgets(editList); onClose(); };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white w-3/4 max-h-[90vh] overflow-auto p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Edit Widgets</h2>
        <button onClick={add} className="px-2 py-1 bg-green-600 text-white mb-4 rounded">+ Add Widget</button>
        {editList.map((w,i) => (
          <div key={w.i} className="border p-2 mb-2 rounded flex flex-wrap gap-2">
            <button onClick={()=>remove(i)} className="text-red-600 font-bold">X</button>
            <label>Type:
              <select value={w.type} onChange={e=>update(i,'type',e.target.value)}>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </label>
            <label style={{width:'80px'}}>x:
              <input type="number" value={w.x} onChange={e=>update(i,'x',+e.target.value)}/>
            </label>
            <label style={{width:'80px'}}>y:
              <input type="number" value={w.y} onChange={e=>update(i,'y',+e.target.value)}/>
            </label>
            <label>w:
              <input type="number" value={w.w} onChange={e=>update(i,'w',+e.target.value)}/>
            </label>
            <label>h:
              <input type="number" value={w.h} onChange={e=>update(i,'h',+e.target.value)}/>
            </label>
            {['Efficiency','EnergyEfficiency'].includes(w.type) && (
              <label>key:
                <input value={w.props.key} onChange={e=>update(i,'props',{...w.props,key:e.target.value})}/>
              </label>
            )}
            {['ChemicalDosage','TreatedWaterChart','FlowRaterChart','ChemicalChart'].includes(w.type) && (
              <label>view:
                <select value={w.props.view} onChange={e=>update(i,'props',{...w.props,view:e.target.value})}>
                  <option>hourly</option><option>daily</option><option>weekly</option>
                </select>
              </label>
            )}
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
          <button onClick={save} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
}
