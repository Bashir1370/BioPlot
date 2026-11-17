import {useEffect,useState} from 'react';
import {supabase} from '../supabaseClient';

export function AdminOrderOwner({orderId,fa}:{orderId:string;fa:boolean}){
 const [state,setState]=useState<{name:string;error:boolean;loading:boolean}>({name:'',error:false,loading:true});
 useEffect(()=>{
  let live=true;setState({name:'',error:false,loading:true});
  void (async()=>{
   try{
    const {data,error}=await supabase.rpc('get_design_order_owner',{p_order_id:orderId});
    if(error)throw error;
    if(live)setState({name:data?.[0]?.full_name?.trim()??'',error:false,loading:false});
   }catch{if(live)setState({name:'',error:true,loading:false});}
  })();
  return()=>{live=false;};
 },[orderId]);
 return <div className="order-request-fact"><dt>{fa?'نام و نام خانوادگی ثبت‌کننده':'Requester full name'}</dt><dd dir="auto" role="status">{state.loading?(fa?'در حال دریافت…':'Loading…'):state.error?(fa?'اطلاعات ثبت‌کننده دریافت نشد.':'Could not load requester details.'):state.name||(fa?'نام در حساب ثبت نشده است.':'No name saved in this account.')}</dd></div>;
}
