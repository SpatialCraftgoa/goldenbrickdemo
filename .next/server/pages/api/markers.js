"use strict";(()=>{var e={};e.id=921,e.ids=[921],e.modules={8432:e=>{e.exports=require("bcryptjs")},4802:e=>{e.exports=require("cookie")},9344:e=>{e.exports=require("jsonwebtoken")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5900:e=>{e.exports=require("pg")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,r){return r in t?t[r]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,r)):"function"==typeof t&&"default"===r?t:void 0}}})},7142:(e,t,r)=>{r.r(t),r.d(t,{config:()=>E,default:()=>A,routeModule:()=>m});var a={};r.r(a),r.d(a,{config:()=>u,default:()=>T});var o=r(1802),s=r(7153),n=r(6249);let i=r(9344),{parse:c}=r(4802),l=r(1004),d=process.env.JWT_SECRET||"your-secret-key-change-in-production",u={api:{bodyParser:{sizeLimit:"10mb"}}};async function T(e,t){try{if("GET"===e.method){let e=(await l.query(`
        SELECT id, title, description, latitude, longitude, 
               icon_image, content_items, created_by, created_at 
        FROM markers 
        ORDER BY created_at DESC
      `)).rows.map(e=>({id:e.id,title:e.title,description:e.description,position:{lat:parseFloat(e.latitude),lng:parseFloat(e.longitude)},iconImage:e.icon_image,contentItems:e.content_items,createdBy:e.created_by,createdAt:e.created_at}));return t.status(200).json({markers:e})}if("POST"!==e.method)return t.status(405).json({message:"Method not allowed"});{let r=function(e){let t=c(e.headers.cookie||"")["auth-token"];if(!t)return null;try{return i.verify(t,d)}catch(e){return null}}(e);if(!r||"admin"!==r.role)return t.status(403).json({message:"Admin access required"});let{title:a,description:o,position:s,iconImage:n,contentItems:u}=e.body;if(!a||!o||!s||!n||!u)return t.status(400).json({message:"Missing required fields"});let T=await l.query(`
        INSERT INTO markers (title, description, latitude, longitude, icon_image, content_items, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,[a,o,s.lat,s.lng,n,JSON.stringify(u),r.username]),A={id:T.rows[0].id,title:T.rows[0].title,description:T.rows[0].description,position:{lat:parseFloat(T.rows[0].latitude),lng:parseFloat(T.rows[0].longitude)},iconImage:T.rows[0].icon_image,contentItems:T.rows[0].content_items,createdBy:T.rows[0].created_by,createdAt:T.rows[0].created_at};return t.status(201).json({message:"Marker created successfully",marker:A})}}catch(e){return console.error("Markers API error:",e),t.status(500).json({message:"Internal server error"})}}let A=(0,n.l)(a,"default"),E=(0,n.l)(a,"config"),m=new o.PagesAPIRouteModule({definition:{kind:s.x.PAGES_API,page:"/api/markers",pathname:"/api/markers",bundlePath:"",filename:""},userland:a})},1004:(e,t,r)=>{let{Pool:a}=r(5900),o=new a({host:process.env.DB_HOST||"3.228.40.132",database:process.env.DB_NAME||"live",user:process.env.DB_USER||"postgres",password:process.env.DB_PASSWORD||"123",port:parseInt(process.env.DB_PORT)||5432,ssl:!1,connectionTimeoutMillis:1e4,idleTimeoutMillis:3e4,max:20,retry:{max:3,delay:2e3}}),s=!1;async function n(e,t){if(!s)try{await o.query("SELECT 1"),s=!0}catch(e){throw console.error("Database not available:",e.message),Error("Database connection unavailable")}return o.query(e,t)}o.on("connect",e=>{console.log(`Connected to PostgreSQL database at ${process.env.DB_HOST||"3.228.40.132"}`),s=!0}),o.on("error",e=>{console.error("PostgreSQL connection error:",e),s=!1,"EADDRNOTAVAIL"===e.code&&(console.error("Database server is not reachable. Please check:"),console.error(`1. Network connectivity to ${process.env.DB_HOST||"3.228.40.132"}`),console.error("2. Database server is running"),console.error("3. Firewall/security group settings"),console.error("4. Consider switching to a local database for development"))}),(async function(){try{await n(`
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
      `)}catch(e){console.log("updated_at column handling:",e.message)}let e=r(8432),t=await e.hash("admin",10);await n(`
      INSERT INTO users (username, password, role) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (username) DO NOTHING
    `,["admin",t,"admin"]),console.log("Database tables initialized successfully")}catch(e){console.error("Database initialization error:",e),console.error("Application will continue without database functionality")}})().catch(e=>{console.error("Failed to initialize database:",e.message)}),e.exports={query:n,pool:o,isConnected:()=>s}},7153:(e,t)=>{var r;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return r}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(r||(r={}))},1802:(e,t,r)=>{e.exports=r(145)}};var t=require("../../webpack-api-runtime.js");t.C(e);var r=t(t.s=7142);module.exports=r})();