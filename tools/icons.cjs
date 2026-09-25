const fs=require('node:fs');
const {chromium}=require('@playwright/test');
(async()=>{const browser=await chromium.launch();try{const page=await browser.newPage();for(const size of [192,512]){await page.setViewportSize({width:size,height:size});await page.setContent('<style>html,body{margin:0}svg{width:100vw;height:100vh}</style>'+fs.readFileSync('icon.svg','utf8'));await page.screenshot({path:'icon-'+size+'.png'});}}finally{await browser.close();}})();
