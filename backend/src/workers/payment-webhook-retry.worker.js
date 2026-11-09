const { retryFailed }=require('../modules/payment-webhooks/webhook.service');
const logger=require('../utils/logger');

let running=false;
async function runOnce(){
  if(running) return;
  running=true;
  try{
    const results=await retryFailed(25);
    const failed=results.filter(x=>!x.ok).length;
    if(results.length) logger.info('Payment webhook retry batch completed',{processed:results.length,failed});
  }catch(error){logger.error('Payment webhook retry worker failed',{error:error.message});}
  finally{running=false;}
}
function startPaymentWebhookRetryWorker({intervalMs=30000}={}){
  const timer=setInterval(runOnce,intervalMs);
  timer.unref?.();
  runOnce();
  return ()=>clearInterval(timer);
}
module.exports={startPaymentWebhookRetryWorker,runOnce};
