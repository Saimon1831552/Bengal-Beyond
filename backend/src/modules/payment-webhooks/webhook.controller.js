const service=require('./webhook.service');
function asyncRoute(fn){return(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);}
exports.receive=asyncRoute(async(req,res)=>{
  const result=await service.receive(req.body||{});
  res.status(200).json({success:true,data:result});
});
exports.list=asyncRoute(async(req,res)=>{
  const data=await service.listEvents({page:req.query.page,limit:req.query.limit,status:req.query.status});
  res.json({success:true,data});
});
exports.retry=asyncRoute(async(req,res)=>{
  const data=await service.processEvent(Number(req.params.eventId));
  res.json({success:true,data});
});
