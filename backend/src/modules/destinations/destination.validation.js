const SLUG_RE=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function validateCreate(input={}){
 const errors=[],name=typeof input.name==='string'?input.name.trim():'';
 const slug=typeof input.slug==='string'&&input.slug.trim()?input.slug.trim():name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 if(!name||name.length>160)errors.push('name is required (max 160 characters)');
 if(!slug||slug.length>180||!SLUG_RE.test(slug))errors.push('slug must use lowercase letters, numbers and hyphens');
 for(const k of ['description','country','region','featured_image_url','meta_title','meta_description'])if(input[k]!=null&&typeof input[k]!=='string')errors.push(k+' must be a string');
 if(input.country&&input.country.length>100)errors.push('country too long');
 if(input.region&&input.region.length>120)errors.push('region too long');
 if(input.featured_image_url&&(input.featured_image_url.length>1024||!/^https:\/\/\S+$/i.test(input.featured_image_url)))errors.push('featured_image_url must be HTTPS');
 if(input.status!==undefined&&!['draft','published','archived'].includes(input.status))errors.push('invalid status');
 if(input.meta_title&&input.meta_title.length>180)errors.push('meta_title too long');
 if(input.meta_description&&input.meta_description.length>320)errors.push('meta_description too long');
 return {errors,value:{name,slug,description:input.description??null,country:input.country??'Bangladesh',region:input.region??null,featured_image_url:input.featured_image_url??null,meta_title:input.meta_title??null,meta_description:input.meta_description??null,status:input.status??'draft',is_featured:input.is_featured===true}};
}
module.exports={validateCreate};
