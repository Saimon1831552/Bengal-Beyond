const {pool}=require('../../config/db');
const {validateCreate}=require('./destination.validation');
function problem(statusCode,message){const e=new Error(message);e.statusCode=statusCode;return e;}
function paging(q){const page=Math.max(1,Number(q.page)||1),limit=Math.max(1,Math.min(Number(q.limit)||20,100));return {page,limit,offset:(page-1)*limit};}
async function publicList(q={}){
 const p=paging(q),w=['d.status=?'],a=['published'];
 if(q.search){w.push('(d.name LIKE ? OR d.region LIKE ? OR d.country LIKE ?)');const s='%'+String(q.search).slice(0,80)+'%';a.push(s,s,s);}
 if(q.country){w.push('d.country=?');a.push(String(q.country).slice(0,100));}
 if(q.featured==='true')w.push('d.is_featured=1');
 const where=w.join(' AND '),[[c]]=await pool.execute(`SELECT COUNT(*) total FROM destinations d WHERE ${where}`,a);
 const [items]=await pool.execute(`SELECT d.id,d.slug,d.name,d.description,d.country,d.region,d.featured_image_url,d.meta_title,d.meta_description,d.is_featured,(SELECT COUNT(*) FROM tours t WHERE t.destination_id=d.id AND t.status='published' AND t.deleted_at IS NULL) published_tour_count FROM destinations d WHERE ${where} ORDER BY d.is_featured DESC,d.name LIMIT ? OFFSET ?`,[...a,p.limit,p.offset]);
 return {items,pagination:{page:p.page,limit:p.limit,total:Number(c.total),totalPages:Math.ceil(Number(c.total)/p.limit)}};
}
async function publicBySlug(slug){
 const [r]=await pool.execute(`SELECT id,slug,name,description,country,region,featured_image_url,meta_title,meta_description,is_featured FROM destinations WHERE slug=? AND status='published'`,[slug]);
 if(!r.length)throw problem(404,'Destination not found.');return r[0];
}
async function publicTours(slug,q={}){
 const d=await publicBySlug(slug),p=paging(q);
 const [[c]]=await pool.execute(`SELECT COUNT(*) total FROM tours WHERE destination_id=? AND status='published' AND deleted_at IS NULL`,[d.id]);
 const [items]=await pool.execute(`SELECT id,slug,title,summary,destination,duration_days,base_price,currency_code,cover_image_url FROM tours WHERE destination_id=? AND status='published' AND deleted_at IS NULL ORDER BY title LIMIT ? OFFSET ?`,[d.id,p.limit,p.offset]);
 return {destination:d,items,pagination:{page:p.page,limit:p.limit,total:Number(c.total),totalPages:Math.ceil(Number(c.total)/p.limit)}};
}
async function adminList(q={}){
 const p=paging(q),w=[],a=[];
 if(q.status){w.push('status=?');a.push(q.status);}
 if(q.search){w.push('(name LIKE ? OR slug LIKE ?)');const s='%'+String(q.search).slice(0,80)+'%';a.push(s,s);}
 const where=w.length?'WHERE '+w.join(' AND '):'',[[c]]=await pool.execute(`SELECT COUNT(*) total FROM destinations ${where}`,a);
 const [items]=await pool.execute(`SELECT d.*,(SELECT COUNT(*) FROM tours t WHERE t.destination_id=d.id AND t.deleted_at IS NULL) tour_count FROM destinations d ${where} ORDER BY d.updated_at DESC LIMIT ? OFFSET ?`,[...a,p.limit,p.offset]);
 return {items,pagination:{page:p.page,limit:p.limit,total:Number(c.total),totalPages:Math.ceil(Number(c.total)/p.limit)}};
}
async function adminGet(id){const [r]=await pool.execute(`SELECT d.*,(SELECT COUNT(*) FROM tours t WHERE t.destination_id=d.id AND t.deleted_at IS NULL) tour_count FROM destinations d WHERE d.id=?`,[id]);if(!r.length)throw problem(404,'Destination not found.');return r[0];}
async function create(input,actor){
 const {errors,value}=validateCreate(input);if(errors.length)throw problem(400,errors.join('; '));
 try{const [r]=await pool.execute(`INSERT INTO destinations(slug,name,description,country,region,featured_image_url,meta_title,meta_description,status,is_featured,created_by,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,[value.slug,value.name,value.description,value.country,value.region,value.featured_image_url,value.meta_title,value.meta_description,value.status,value.is_featured?1:0,actor||null,actor||null]);return adminGet(r.insertId);}
 catch(e){if(e.code==='ER_DUP_ENTRY')throw problem(409,'Destination slug already exists.');throw e;}
}
async function update(id,input,actor){
 const old=await adminGet(id),{errors,value}=validateCreate({...old,...input});if(errors.length)throw problem(400,errors.join('; '));
 try{await pool.execute(`UPDATE destinations SET slug=?,name=?,description=?,country=?,region=?,featured_image_url=?,meta_title=?,meta_description=?,status=?,is_featured=?,updated_by=? WHERE id=?`,[value.slug,value.name,value.description,value.country,value.region,value.featured_image_url,value.meta_title,value.meta_description,value.status,value.is_featured?1:0,actor||null,id]);return adminGet(id);}
 catch(e){if(e.code==='ER_DUP_ENTRY')throw problem(409,'Destination slug already exists.');throw e;}
}
async function remove(id){const old=await adminGet(id),[[c]]=await pool.execute('SELECT COUNT(*) total FROM tours WHERE destination_id=? AND deleted_at IS NULL',[id]);if(Number(c.total))throw problem(409,'Destination is linked to tours. Reassign or archive those tours first.');await pool.execute('DELETE FROM destinations WHERE id=?',[id]);return {id:old.id,deleted:true};}
module.exports={publicList,publicBySlug,publicTours,adminList,adminGet,create,update,remove};
