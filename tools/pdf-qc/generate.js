// YKS portfolio PDF QC — generates stress-test books straight from the shipped buildPortfolio.
// Run:  node tools/pdf-qc/generate.js   then   python3 tools/pdf-qc/check.py
// Generate PDFs from the REAL shipped buildPortfolio across stress scenarios.
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..','..');
const SRC=path.join(ROOT,'js','talent-apply.js');
// use the jsPDF the site actually ships, so the QC needs no npm install and can't drift from production
const {jsPDF}=require(path.join(ROOT,'js','vendor','jspdf.umd.min.js'));
const DIR=path.join(ROOT,'assets','behance')+'/';
function jpegSize(b){let i=2;while(i<b.length){if(b[i]!==0xFF){i++;continue;}const m=b[i+1];if(m>=0xC0&&m<=0xCF&&m!==0xC4&&m!==0xC8&&m!==0xCC)return{h:b.readUInt16BE(i+5),w:b.readUInt16BE(i+7)};i+=2+b.readUInt16BE(i+2);}return{w:800,h:1000};}
function img(n,c){const b=fs.readFileSync(DIR+n);const{w,h}=jpegSize(b);return{data:'data:image/jpeg;base64,'+b.toString('base64'),w,h,cat:c||''};}
const OUT=path.join(__dirname,'out');
if(!fs.existsSync(OUT)) fs.mkdirSync(OUT,{recursive:true});
const POOL=[img('suman-06.jpg','FULL LENGTH'),img('suman-05.jpg','EDITORIAL'),img('suman-04.jpg','STUDIO'),img('suman-07.jpg','PORTRAIT'),img('ashika-05.jpg','LOOK'),img('ashika-07.jpg','MOVEMENT'),img('ashika-08.jpg','BEAUTY'),img('ashika-09.jpg','Digitals')];

const src=fs.readFileSync(SRC,'utf8');
const start=src.indexOf('function buildPortfolio(');
let i=src.indexOf('{',start),depth=0,end=-1;
for(let p=i;p<src.length;p++){ if(src[p]==='{')depth++; else if(src[p]==='}'){depth--; if(depth===0){end=p+1;break;}} }
const fnSrc=src.slice(start,end);

function run(scn){
  const values=Object.assign({category:'Model',city:'Bangalore',about:'',tagline:'',
    stat_height:"5'7\"",stat_bust:'36',stat_waist:'28',stat_hips:'32',stat_shoe:'6 US',stat_hair:'Black',stat_eyes:'Black',stat_skin:'Warm dusky'}, scn.values||{});
  const form=new Proxy({},{get:(t,k)=> (k in values?{value:values[k]}:{value:''})});
  const DISC={'Model':scn.disc||'Fashion · Editorial · Runway · Commercial','Actor':'Film · Ad · Editorial · Screen'};
  let captured=null;
  const factory=new Function('jsPDF','form','DISC','stripContact','registerFonts','deliver','window', fnSrc+'\n; return buildPortfolio;');
  const buildPortfolio=factory(jsPDF,form,DISC,(s)=>s,()=>{},(doc)=>{captured=doc;},{qrcode:null});
  buildPortfolio(jsPDF, POOL.slice(0,scn.photos==null?8:scn.photos), scn.name||'Shiba Das',
    {bg:[12,10,16],text:[244,240,232],sub:[176,168,146],accent:scn.accent||[226,74,42],font:'helvetica',template:scn.tpl});
  return captured;
}

const TPLS=['editorial','lookbook','minimal','compcard','grid','duo','swiss','luxe','classic'];
const SCN=[
  {id:'normal', values:{about:"I'm a model based in Bangalore, working across fashion and editorial. I take direction quickly and I'm precise on the marks."}},
  {id:'longname', name:'Priyadarshini Venkataraghavan Subramaniam', values:{about:"I'm a model."}},
  {id:'longbio', values:{about:"I'm a model and digital creator based in Bangalore working across fashion, editorial, runway and commercial print, and I move easily between the controlled language of a studio call and the faster looser register of content, which makes me equally castable for a lookbook, a runway line-up or a campaign that has to live on a phone, and on set I am quick to take direction, precise with hands and jawline, and comfortable holding a look for as long as the frame needs, across long days and multiple changes."}},
  {id:'nobio', values:{about:''}},
  {id:'longcity', values:{city:'Thiruvananthapuram Metropolitan Region', about:"I'm a model."}},
  {id:'longdisc', disc:'Fashion · Editorial · Runway · Commercial · Beauty · Bridal · Fitness · Film & Television', values:{about:"I'm a model."}},
  {id:'longstats', values:{stat_hair:'Dark brown with blonde highlights',stat_skin:'Medium warm dusky tone',stat_eyes:'Dark brown almost black',about:"I'm a model."}},
  {id:'onephoto', photos:1, values:{about:"I'm a model."}},
  {id:'twophotos', photos:2, values:{about:"I'm a model."}},
  {id:'longtag', values:{tagline:'Fashion & Editorial · Runway · Bangalore & Mumbai', about:"I'm a model."}}
];
let n=0;
for(const t of TPLS) for(const s of SCN){
  try{ const doc=run(Object.assign({tpl:t},s));
    fs.writeFileSync(path.join(OUT,`${t}__${s.id}.pdf`), Buffer.from(doc.output('arraybuffer'))); n++;
  }catch(e){ console.log('BUILD FAIL',t,s.id,e.message); }
}
console.log('generated',n,'PDFs');
