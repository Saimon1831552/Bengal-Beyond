const r=require('express').Router(),c=require('./destination.controller');
r.get('/',c.publicList);r.get('/:slug/tours',c.publicTours);r.get('/:slug',c.publicBySlug);module.exports=r;
