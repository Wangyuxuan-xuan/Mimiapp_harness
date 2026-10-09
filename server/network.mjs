import {Agent,EnvHttpProxyAgent,setGlobalDispatcher,fetch as undiciFetch} from 'undici';
let configured=false;
let modelDispatcher;
export function configureNetwork(){
  if(configured)return;configured=true;
  // Respect the operator's existing proxy configuration without exposing proxy credentials.
  if(process.env.HTTPS_PROXY||process.env.HTTP_PROXY||process.env.https_proxy||process.env.http_proxy){
    modelDispatcher=new EnvHttpProxyAgent({noProxy:['127.0.0.1','localhost','::1',process.env.NO_PROXY||process.env.no_proxy||''].join(',')});
    setGlobalDispatcher(modelDispatcher);
  }
  modelDispatcher??=new Agent();
}
// PI bundles another Undici version. Pass our dispatcher explicitly so SDK
// initialization cannot change the transport used by a model request.
export function modelFetch(input,init){configureNetwork();return undiciFetch(input,{...init,dispatcher:modelDispatcher});}
