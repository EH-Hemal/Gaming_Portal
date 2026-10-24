import { createContext,useContext,useEffect,useState,useCallback } from 'react';
export const Store=createContext();
export const useStore=()=>useContext(Store);
export async function api(path,options={}) {const response=await fetch(`/api${path}`,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...options.headers}});let body;try{body=await response.json();}catch{throw new Error('The server is unavailable. Start the PlayNova API and try again.');}if(!response.ok)throw new Error(body.error||'Unable to complete this request.');return body;}
export function useSaved(key,initial) {const [value,setValue]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem(key));return saved!==null&&typeof saved===typeof initial&&Array.isArray(saved)===Array.isArray(initial)?saved:initial;}catch{return initial;}});const save=useCallback(next=>setValue(prev=>{const value=typeof next==='function'?next(prev):next;try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Storage may be unavailable in private browsing. */}return value;}),[key]);return [value,save];}
export function StoreProvider({children}) {
  const [games,setGames]=useState([]),[categories,setCategories]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [favourites,setFavourites]=useSaved('pn-favourites',[]),[recent,setRecent]=useSaved('pn-recent',[]),[theme,setTheme]=useSaved('pn-theme','dark');
  const refresh=useCallback(async()=>{setLoading(true);setError('');try{const [g,c]=await Promise.all([api('/games'),api('/categories')]);setGames(g);setCategories(c);}catch(e){setError(e.message);}finally{setLoading(false);}},[]);
  useEffect(()=>{refresh();},[refresh]);useEffect(()=>{document.documentElement.dataset.theme=theme;},[theme]);
  const toggleFavourite=slug=>setFavourites(list=>list.includes(slug)?list.filter(s=>s!==slug):[...list,slug]);
  return <Store.Provider value={{games,categories,loading,error,refresh,favourites,toggleFavourite,recent,setRecent,theme,setTheme}}>{children}</Store.Provider>;
}
