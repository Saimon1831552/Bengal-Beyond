const r=require('express').Router(),c=require('./destination.controller');
// Mount behind staff authentication and content.manage permission.
r.get('/',c.adminList);r.get('/:id',c.adminGet);r.post('/',c.create);r.put('/:id',c.update);r.delete('/:id',c.remove);module.exports=r;
