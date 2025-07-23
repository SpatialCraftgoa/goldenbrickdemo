"use strict";(()=>{var e={};e.id=908,e.ids=[908],e.modules={8432:e=>{e.exports=require("bcryptjs")},4802:e=>{e.exports=require("cookie")},9344:e=>{e.exports=require("jsonwebtoken")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5900:e=>{e.exports=require("pg")},6249:(e,r)=>{Object.defineProperty(r,"l",{enumerable:!0,get:function(){return function e(r,t){return t in r?r[t]:"then"in r&&"function"==typeof r.then?r.then(r=>e(r,t)):"function"==typeof r&&"default"===t?r:void 0}}})},615:(e,r,t)=>{t.r(r),t.d(r,{config:()=>E,default:()=>A,routeModule:()=>p});var a={};t.r(a),t.d(a,{default:()=>T});var s=t(1802),o=t(7153),n=t(6249);let i=t(8432),c=t(9344),{serialize:l}=t(4802),u=t(1004),d=process.env.JWT_SECRET||"your-secret-key-change-in-production";async function T(e,r){if("POST"!==e.method)return r.status(405).json({message:"Method not allowed"});try{let{username:t,password:a}=e.body;if(!t||!a)return r.status(400).json({message:"Username and password are required"});let s=await u.query("SELECT * FROM users WHERE username = $1",[t]);if(0===s.rows.length)return r.status(401).json({message:"Invalid credentials"});let o=s.rows[0];if(!await i.compare(a,o.password))return r.status(401).json({message:"Invalid credentials"});let n=c.sign({userId:o.id,username:o.username,role:o.role},d,{expiresIn:"24h"}),T=l("auth-token",n,{httpOnly:!0,secure:!0,sameSite:"strict",maxAge:86400,path:"/"});return r.setHeader("Set-Cookie",T),r.status(200).json({message:"Login successful",user:{id:o.id,username:o.username,role:o.role}})}catch(e){return console.error("Login error:",e),r.status(500).json({message:"Internal server error"})}}let A=(0,n.l)(a,"default"),E=(0,n.l)(a,"config"),p=new s.PagesAPIRouteModule({definition:{kind:o.x.PAGES_API,page:"/api/auth/login",pathname:"/api/auth/login",bundlePath:"",filename:""},userland:a})},1004:(e,r,t)=>{let{Pool:a}=t(5900),s=new a({host:process.env.DB_HOST||"3.228.40.132",database:process.env.DB_NAME||"live",user:process.env.DB_USER||"postgres",password:process.env.DB_PASSWORD||"123",port:parseInt(process.env.DB_PORT)||5432,ssl:!1,connectionTimeoutMillis:1e4,idleTimeoutMillis:3e4,max:20,retry:{max:3,delay:2e3}}),o=!1;async function n(e,r){if(!o)try{await s.query("SELECT 1"),o=!0}catch(e){throw console.error("Database not available:",e.message),Error("Database connection unavailable")}return s.query(e,r)}s.on("connect",e=>{console.log(`Connected to PostgreSQL database at ${process.env.DB_HOST||"3.228.40.132"}`),o=!0}),s.on("error",e=>{console.error("PostgreSQL connection error:",e),o=!1,"EADDRNOTAVAIL"===e.code&&(console.error("Database server is not reachable. Please check:"),console.error(`1. Network connectivity to ${process.env.DB_HOST||"3.228.40.132"}`),console.error("2. Database server is running"),console.error("3. Firewall/security group settings"),console.error("4. Consider switching to a local database for development"))}),(async function(){try{await n(`
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
    `,["admin",r,"admin"]),console.log("Database tables initialized successfully")}catch(e){console.error("Database initialization error:",e),console.error("Application will continue without database functionality")}})().catch(e=>{console.error("Failed to initialize database:",e.message)}),e.exports={query:n,pool:s,isConnected:()=>o}},7153:(e,r)=>{var t;Object.defineProperty(r,"x",{enumerable:!0,get:function(){return t}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(t||(t={}))},1802:(e,r,t)=>{e.exports=t(145)}};var r=require("../../../webpack-api-runtime.js");r.C(e);var t=r(r.s=615);module.exports=t})();