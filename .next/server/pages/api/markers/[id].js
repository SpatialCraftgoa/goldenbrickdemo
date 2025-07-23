"use strict";(()=>{var e={};e.id=263,e.ids=[263],e.modules={8432:e=>{e.exports=require("bcryptjs")},4802:e=>{e.exports=require("cookie")},9344:e=>{e.exports=require("jsonwebtoken")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5900:e=>{e.exports=require("pg")},6249:(e,r)=>{Object.defineProperty(r,"l",{enumerable:!0,get:function(){return function e(r,t){return t in r?r[t]:"then"in r&&"function"==typeof r.then?r.then(r=>e(r,t)):"function"==typeof r&&"default"===t?r:void 0}}})},2071:(e,r,t)=>{t.r(r),t.d(r,{config:()=>T,default:()=>A,routeModule:()=>m});var a={};t.r(a),t.d(a,{config:()=>d,default:()=>E});var s=t(1802),o=t(7153),n=t(6249);let i=t(9344),{parse:c}=t(4802),l=t(1004),u=process.env.JWT_SECRET||"your-secret-key-change-in-production",d={api:{bodyParser:{sizeLimit:"10mb"}}};async function E(e,r){let{id:t}=e.query;try{if(!l.isConnected())return r.status(503).json({message:"Database unavailable. Please check connection.",error:"SERVICE_UNAVAILABLE"});if("DELETE"!==e.method)return r.status(405).json({message:"Method not allowed"});{let a=function(e){let r=c(e.headers.cookie||"")["auth-token"];if(!r)return null;try{return i.verify(r,u)}catch(e){return null}}(e);if(!a||"admin"!==a.role)return r.status(403).json({message:"Admin access required"});let s=await l.query("SELECT id FROM markers WHERE id = $1",[t]);if(0===s.rows.length)return r.status(404).json({message:"Marker not found"});return await l.query("DELETE FROM markers WHERE id = $1",[t]),r.status(200).json({message:"Marker deleted successfully",deletedId:parseInt(t)})}}catch(e){if(console.error("Delete marker API error:",e),"Database connection unavailable"===e.message)return r.status(503).json({message:"Database service temporarily unavailable",error:"DATABASE_UNAVAILABLE"});return r.status(500).json({message:"Internal server error"})}}let A=(0,n.l)(a,"default"),T=(0,n.l)(a,"config"),m=new s.PagesAPIRouteModule({definition:{kind:o.x.PAGES_API,page:"/api/markers/[id]",pathname:"/api/markers/[id]",bundlePath:"",filename:""},userland:a})},1004:(e,r,t)=>{let{Pool:a}=t(5900),s=new a({host:process.env.DB_HOST||"3.228.40.132",database:process.env.DB_NAME||"live",user:process.env.DB_USER||"postgres",password:process.env.DB_PASSWORD||"123",port:parseInt(process.env.DB_PORT)||5432,ssl:!1,connectionTimeoutMillis:1e4,idleTimeoutMillis:3e4,max:20,retry:{max:3,delay:2e3}}),o=!1;async function n(e,r){if(!o)try{await s.query("SELECT 1"),o=!0}catch(e){throw console.error("Database not available:",e.message),Error("Database connection unavailable")}return s.query(e,r)}s.on("connect",e=>{console.log(`Connected to PostgreSQL database at ${process.env.DB_HOST||"3.228.40.132"}`),o=!0}),s.on("error",e=>{console.error("PostgreSQL connection error:",e),o=!1,"EADDRNOTAVAIL"===e.code&&(console.error("Database server is not reachable. Please check:"),console.error(`1. Network connectivity to ${process.env.DB_HOST||"3.228.40.132"}`),console.error("2. Database server is running"),console.error("3. Firewall/security group settings"),console.error("4. Consider switching to a local database for development"))}),(async function(){try{await n(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `),await n(`
      CREATE TABLE IF NOT EXISTS markers (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        icon_image TEXT NOT NULL,
        content_items JSONB NOT NULL,
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);try{await n(`
        ALTER TABLE markers 
        ADD COLUMN IF NOT EXISTS created_by VARCHAR(50)
      `)}catch(e){console.log("created_by column handling:",e.message)}try{await n(`
        ALTER TABLE markers 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `)}catch(e){console.log("updated_at column handling:",e.message)}let e=t(8432),r=await e.hash("admin",10);await n(`
      INSERT INTO users (username, password, role) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (username) DO NOTHING
    `,["admin",r,"admin"]),console.log("Database tables initialized successfully")}catch(e){console.error("Database initialization error:",e),console.error("Application will continue without database functionality")}})().catch(e=>{console.error("Failed to initialize database:",e.message)}),e.exports={query:n,pool:s,isConnected:()=>o}},7153:(e,r)=>{var t;Object.defineProperty(r,"x",{enumerable:!0,get:function(){return t}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(t||(t={}))},1802:(e,r,t)=>{e.exports=t(145)}};var r=require("../../../webpack-api-runtime.js");r.C(e);var t=r(r.s=2071);module.exports=t})();