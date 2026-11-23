const {defineConfig}=require('@playwright/test');
const port = Number(process.env.PORT || 4189);
module.exports=defineConfig({testDir:'tests',workers:1,timeout:60000,use:{baseURL:`http://127.0.0.1:${port}`,viewport:{width:1280,height:800},hasTouch:true,trace:'off',launchOptions:process.env.CHROME95_PATH?{executablePath:process.env.CHROME95_PATH}:{}},webServer:{command:`python3 -m http.server ${port} --bind 127.0.0.1`,url:`http://127.0.0.1:${port}`,reuseExistingServer:true}});
