"use strict";(self.webpackChunkauto_immutable_docs=self.webpackChunkauto_immutable_docs||[]).push([[2792],{80865:function(n,e,a){a.r(e),a.d(e,{Head:function(){return u}});var t=a(67294),m=a(75591),l=a(41520);e.default=n=>{let{className:e}=n;return t.createElement("article",{className:`set-method-api-replace-tag-page ${e}`},t.createElement("h1",null,"@@REPLACE Tag Usage"),t.createElement("p",null,t.createElement("strong",null,"Signature:"),t.createElement("pre",null,"{ '@@REPLACE': <any> }")),t.createElement("h3",null,"Example:"),t.createElement(l.Z,null,"import AutoImmutable, { Tag } from 'auto-immutable';\n\nconst protectedDatae = {\n    a: {\n        b: [\n            { x: 7, y: 8, z: 9 },\n            { x: 17, y: 18, z: 19 }\n        ]\n    },\n    j: 10\n};\n\nconst aImmutable = new AutoImmutable( protectedData );\nconst consumer = aImmutable.connect();\n\n/* rewrites aImmutable data to { a: 'Demo', j: 17 } */\nconsumer.set({\n    [ Tag.REPLACE ]: {\n        a: 'Demo',\n        j: 17\n    }\n});\n\n/* rewrites aImmutable data.a to { message: 'Testing...' } */\nconsumer.set({\n    a: {\n        [ Tag.REPLACE ]: {\n            message: 'Testing...'\n        }\n    }\n});\n\n//  rewrites aImmutable data.a.b[1] to { x: 97, y: 98, z: 99 };\n//  leaving aImmutable data.a.b = [\n//      { x: 7, y: 8, z: 9 },\n//      { x: 97, y: 98, z: 99 }\n//  ]\nconsumer.set({\n    a: {\n        b: [\n            aImmutable data.a.b[ 0 ],\n            {\n                [ Tag.REPLACE ]: {\n                    x: 97,\n                    y: 98,\n                    z: 99\n                }\n            }\n        ]\n    }\n});\n\n//  rewrites aImmutable data.a.b[1] to { x: 97, y: 98, z: 99 };\n//  leaving aImmutable data.a.b = [\n//      { x: 7, y: 8, z: 9 },\n//      { x: 97, y: 98, z: 99 }\n//  ]\n//  uses indexing (RECOMMENDED)\nconsumer.set({\n    a: {\n        b: {\n            1: {\n                [ Tag.REPLACE ]: {\n                    x: 97,\n                    y: 98,\n                    z: 99\n                }\n            }\n        }\n    }\n});"))};const u=()=>t.createElement("title",null,m.default.title,": @@REPLACE")}}]);
//# sourceMappingURL=component---src-pages-api-method-set-tags-replace-usage-tsx-155d3f07e4160f197628.js.map