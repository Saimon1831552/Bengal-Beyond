const crypto = require('crypto');
const { pool, withTransaction } = require('../../config/db');
const sslcommerz = require('../sslcommerz/sslcommerz.service');

function problem(statusCode, message) { const e = new Error(message); e.statusCode=statusCode; return e; }
function canonical(payload) {
  return Object.keys(payload || {}).sort().reduce((out,k) => {
    const v=payload[k];
    if (v !== undefined && v !== null && typeof v !== 'object') out[k]=String(v);
    return out;
  }, {});
}
function eventIdentity(payload) {
  const normalized=canonical(payload);
  // Prefer gateway's validation ID; include payload digest to distinguish malformed/replayed variants.
  const source = normalized.val_id ? `val_id:${normalized.val_id}` :
    normalized.tran_id ? `tran_id:${normalized.tran_id}:${normalized.status || ''}` :
    JSON.stringify(normalized);
  return crypto.createHash('sha256').update(source).digest('hex');
}
async function receive(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw problem(400,'Invalid IPN payload.');
  const valId=String(payload.val_id || '').trim();
  if (!valId) throw problem(400,'SSLCommerz IPN is missing val_id.');
  if (valId.length>100) throw problem(400,'Invalid SSLCommerz validation ID.');
  const eventKey=eventIdentity(payload);
  const raw=JSON.stringify(payload);
  const [insert] = await pool.execute(
    `INSERT IGNORE INTO payment_webhook_events
      (provider,event_key,validation_id,payload_json,processing_status,attempt_count,received_at)
     VALUES ('sslcommerz',?,?,?,'received',0,UTC_TIMESTAMP())`,
    [eventKey,valId,raw]
  );
  const [rows]=await pool.execute(
    'SELECT id,processing_status,attempt_count FROM payment_webhook_events WHERE provider = ? AND event_key = ?',
    ['sslcommerz',eventKey]
  );
  const event=rows[0];
  if (!event) throw problem(500,'Could not persist webhook event.');
  if (event.processing_status==='processed') return { accepted:true, duplicate:true, event_id:event.id };
  // Synchronous first attempt keeps SSLCommerz response quick; durable row remains for worker retries.
  await processEvent(event.id);
  const [[latest]]=await pool.execute('SELECT processing_status FROM payment_webhook_events WHERE id=?',[event.id]);
  return { accepted:true, duplicate:insert.affectedRows===0, event_id:event.id, processing_status:latest.processing_status };
}
async function processEvent(eventId) {
  const claimed=await withTransaction(async conn=>{
    const [rows]=await conn.execute(
      `SELECT * FROM payment_webhook_events WHERE id=? FOR UPDATE`,[eventId]
    );
    if(!rows.length) return null;
    const ev=rows[0];
    if(ev.processing_status==='processed' || ev.processing_status==='processing') return null;
    await conn.execute(
      `UPDATE payment_webhook_events SET processing_status='processing',
        attempt_count=attempt_count+1,last_attempt_at=UTC_TIMESTAMP(),last_error=NULL WHERE id=?`,
      [eventId]
    );
    return ev.payload_json;
  });
  if(!claimed) return { skipped:true };
  try {
    const payload=typeof claimed==='string'?JSON.parse(claimed):claimed;
    const result=await sslcommerz.validateAndApply(payload);
    await pool.execute(
      `UPDATE payment_webhook_events SET processing_status='processed',processed_at=UTC_TIMESTAMP(),
        result_json=?,last_error=NULL WHERE id=?`,
      [JSON.stringify(result),eventId]
    );
    return result;
  } catch(error) {
    await pool.execute(
      `UPDATE payment_webhook_events SET processing_status='failed',last_error=? WHERE id=?`,
      [String(error.message||'Webhook processing failed').slice(0,1000),eventId]
    );
    throw error;
  }
}
async function retryFailed(limit=25) {
  const safeLimit=Math.max(1,Math.min(Number(limit)||25,100));
  const [rows]=await pool.execute(
    `SELECT id FROM payment_webhook_events
      WHERE processing_status IN ('received','failed')
        AND attempt_count < 12
        AND (next_retry_at IS NULL OR next_retry_at <= UTC_TIMESTAMP())
      ORDER BY received_at ASC LIMIT ${safeLimit}`
  );
  const results=[];
  for(const row of rows) {
    try {
      await processEvent(row.id);
      results.push({id:row.id,ok:true});
    } catch(error) { results.push({id:row.id,ok:false,error:error.message}); }
  }
  return results;
}
async function listEvents({page=1,limit=25,status}={}) {
  const p=Math.max(1,Number(page)||1), l=Math.max(1,Math.min(Number(limit)||25,100));
  const where=status? 'WHERE processing_status = ?':'';
  const params=status?[status]:[];
  const [rows]=await pool.execute(
    `SELECT id,provider,event_key,validation_id,processing_status,attempt_count,
            last_error,received_at,last_attempt_at,processed_at
       FROM payment_webhook_events ${where}
      ORDER BY received_at DESC LIMIT ? OFFSET ?`,
    [...params,l,(p-1)*l]
  );
  return rows;
}
module.exports={receive,processEvent,retryFailed,listEvents};
