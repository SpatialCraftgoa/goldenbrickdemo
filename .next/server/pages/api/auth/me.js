"use strict";(()=>{var e={};e.id=661,e.ids=[661],e.modules={8432:e=>{e.exports=require("bcryptjs")},4802:e=>{e.exports=require("cookie")},9344:e=>{e.exports=require("jsonwebtoken")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5900:e=>{e.exports=require("pg")},6249:(e,r)=>{Object.defineProperty(r,"l",{enumerable:!0,get:function(){return function e(r,t){return t in r?r[t]:"then"in r&&"function"==typeof r.then?r.then(r=>e(r,t)):"function"==typeof r&&"default"===t?r:void 0}}})},4865:(e,r,t)=>{t.r(r),t.d(r,{config:()=>E,default:()=>T,routeModule:()=>A});var o={};t.r(o),t.d(o,{default:()=>d});var a=t(1802),n=t(7153),s=t(6249);let i=t(9344),{parse:c}=t(4802),u=t(1004),l=process.env.JWT_SECRET||"your-secret-key-change-in-production";async function d(e,r){if("GET"!==e.method)return r.status(405).json({message:"Method not allowed"});try{let t=c(e.headers.cookie||"")["auth-token"];if(!t)return r.status(401).json({message:"Not authenticated"});let o=i.verify(t,l),a=await u.query("SELECT id, username, role, created_at FROM users WHERE id = $1",[o.userId]);if(0===a.rows.length)return r.status(401).json({message:"User not found"});let n=a.rows[0];return r.status(200).json({user:{id:n.id,username:n.username,role:n.role,createdAt:n.created_at}})}catch(e){if("JsonWebTokenError"===e.name||"TokenExpiredError"===e.name)return r.status(401).json({message:"Invalid or expired token"});return console.error("Auth check error:",e),r.status(500).json({message:"Internal server error"})}}let T=(0,s.l)(o,"default"),E=(0,s.l)(o,"config"),A=new a.PagesAPIRouteModule({definition:{kind:n.x.PAGES_API,page:"/api/auth/me",pathname:"/api/auth/me",bundlePath:"",filename:""},userland:o})},1004:(e,r,t)=>{let{Pool:o}=t(5900),a=new o({host:process.env.DB_HOST||"3.228.40.132",database:process.env.DB_NAME||"live",user:process.env.DB_USER||"postgres",password:process.env.DB_PASSWORD||"123",port:parseInt(process.env.DB_PORT)||5432,ssl:!1,connectionTimeoutMillis:1e4,idleTimeoutMillis:3e4,max:20,retry:{max:3,delay:2e3}}),n=!1;async function s(e,r){if(!n)try{await a.query("SELECT 1"),n=!0}catch(e){throw console.error("Database not available:",e.message),Error("Database connection unavailable")}return a.query(e,r)}a.on("connect",e=>{console.log(`Connected to PostgreSQL database at ${process.env.DB_HOST||"3.228.40.132"}`),n=!0}),a.on("error",e=>{console.error("PostgreSQL connection error:",e),n=!1,"EADDRNOTAVAIL"===e.code&&(console.error("Database server is not reachable. Please check:"),console.error(`1. Network connectivity to ${process.env.DB_HOST||"3.228.40.132"}`),console.error("2. Database server is running"),console.error("3. Firewall/security group settings"),console.error("4. Consider switching to a local database for development"))}),(async function(){try{await s(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `),await s(`
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
    `);try{await s(`
        ALTER TABLE markers 
        ADD COLUMN IF NOT EXISTS created_by VARCHAR(50)
      `)}catch(e){console.log("created_by column handling:",e.message)}try{await s(`
        ALTER TABLE markers 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `)}catch(e){console.log("updated_at column handling:",e.message)}let e=t(8432),r=await e.hash("admin",10);await s(`
      INSERT INTO users (username, password, role) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (username) DO NOTHING
    `,["admin",r,"admin"]),console.log("Database tables initialized successfully")}catch(e){console.error("Database initialization error:",e),console.error("Application will continue without database functionality")}})().catch(e=>{console.error("Failed to initialize database:",e.message)}),e.exports={query:s,pool:a,isConnected:()=>n}},7153:(e,r)=>{var t;Object.defineProperty(r,"x",{enumerable:!0,get:function(){return t}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(t||(t={}))},1802:(e,r,t)=>{e.exports=t(145)}};var r=require("../../../webpack-api-runtime.js");r.C(e);var t=r(r.s=4865);module.exports=t})();