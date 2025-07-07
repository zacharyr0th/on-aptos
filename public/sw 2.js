if (!self.define) {
  let e,
    s = {};
  const a = (a, c) => (
    (a = new URL(a + '.js', c).href),
    s[a] ||
      new Promise(s => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = a), (e.onload = s), document.head.appendChild(e));
        } else ((e = a), importScripts(a), s());
      }).then(() => {
        let e = s[a];
        if (!e) throw new Error(`Module ${a} didn’t register its module`);
        return e;
      })
  );
  self.define = (c, i) => {
    const o =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (s[o]) return;
    let n = {};
    const r = e => a(e, o),
      f = { module: { uri: o }, exports: n, require: r };
    s[o] = Promise.all(c.map(e => f[e] || r(e))).then(e => (i(...e), n));
  };
}
define(['./workbox-c05e7c83'], function (e) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: '3e0800cce7e9ff570edf8319b464c641',
        },
        {
          url: '/_next/static/AzzjmxBLfta2KeFfDOZ7j/_buildManifest.js',
          revision: '7646566f175e3536ccf07980e49bcfd1',
        },
        {
          url: '/_next/static/AzzjmxBLfta2KeFfDOZ7j/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/2267893a-3caf7040fc439805.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/2938-dd0101be441f97f8.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/3080-e2f8f7c053d559ff.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/3664-b83bfd87749394fc.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/4596-1805a61bf4413b61.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/5249.7eaba354d21b34e3.js',
          revision: '7eaba354d21b34e3',
        },
        {
          url: '/_next/static/chunks/5499-d9f6144e2ba8cc6a.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/6359-26098ea0b88cc998.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/6900-f1f324bb8cdfe2dc.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/7669-792b90b30ef8179f.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/7859-6e6875b9d96e2253.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/8076-9e30aaff737b6459.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/8220-66bed1290fbab971.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/875-bd8c2c73b71b3667.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/9110-8837b6ec3ba9783a.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-f6cec61ca848b6d1.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/api/aptos/btc/route-39266875d9a7a03e.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/api/aptos/lst/route-8edff59013f6ed20.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/api/aptos/stables/route-c99b79ea827e7029.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/api/health/route-ede7b0d41004fc42.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/api/prices/cmc/btc/route-ef9b0281fe282dd6.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/api/prices/cmc/susde/route-28426e689a48c48c.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/api/rwa/route-39dc11bb1d0f6a03.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/api/seo/api-sitemap.xml/route-b19a4d6dae913801.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/api/seo/llm-metadata/route-62749ccf0b20c518.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/api/seo/llm-readme/route-9358e1a08b552f08.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/api/seo/llms.txt/route-814750b0b030579f.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/api/trpc/%5Btrpc%5D/route-1053b9271b153238.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/bitcoin/page-afe15190545be323.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/btc/opengraph-image/route-86f2ea195628d0e0.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/btc/page-3011396eda621dab.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/defi/opengraph-image/route-03db929492f2921e.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/defi/page-893054b75316a8a7.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/layout-ab126583b88a4e55.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/lst/page-c20170847fa62370.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/manifest.webmanifest/route-e537547e8acca4ff.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/opengraph-image/route-79023c299f01af8d.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/page-14899239a6d2cc71.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/robots.txt/route-af1b7967e853464b.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/rwas/page-8ad9c94dd473477e.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/sitemap.xml/route-b63c27a0c4bc3ec4.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/stablecoins/page-4191be1185b6bda1.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/stables/page-3558876df226d1a3.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/app/twitter-image/route-e55d746e81adfbff.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/bcb818fd-efb9c470339e8029.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/framework-e312c396e27a4eca.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/main-app-0fc2bc153d360bd5.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/main-ec487982e4f089f9.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/pages/_app-742755254a0ddc41.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/pages/_error-c34adda2181eb593.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-29aeaa1992b5de3c.js',
          revision: 'AzzjmxBLfta2KeFfDOZ7j',
        },
        {
          url: '/_next/static/css/459cf66e253ff2b9.css',
          revision: '459cf66e253ff2b9',
        },
        {
          url: '/_next/static/css/d884e8781731fbed.css',
          revision: 'd884e8781731fbed',
        },
        {
          url: '/_next/static/css/edff3da31df8a831.css',
          revision: 'edff3da31df8a831',
        },
        {
          url: '/_next/static/media/569ce4b8f30dc480-s.p.woff2',
          revision: 'ef6cefb32024deac234e82f932a95cbd',
        },
        {
          url: '/_next/static/media/5b01f339abf2f1a5.p.woff2',
          revision: 'c36289c8eb40b089247060459534962c',
        },
        {
          url: '/_next/static/media/8d697b304b401681-s.woff2',
          revision: 'cc728f6c0adb04da0dfcb0fc436a8ae5',
        },
        {
          url: '/_next/static/media/ba015fad6dcf6784-s.woff2',
          revision: '8ea4f719af3312a055caf09f34c89a77',
        },
        { url: '/icons/apt.png', revision: 'c5ffb23520bb274c7c9a95448e8e8cc5' },
        {
          url: '/icons/btc/bitcoin.png',
          revision: '8f8d12b8691a706a99e7544bd33527c2',
        },
        {
          url: '/icons/btc/echo.png',
          revision: '99f7c5e96784df3793606e8867ca8585',
        },
        {
          url: '/icons/btc/okx.png',
          revision: 'f8e47a5b3872e8163e1eb45114031af3',
        },
        {
          url: '/icons/btc/stakestone.png',
          revision: '26cd4c21fd7600c4560bb21ca12929f0',
        },
        {
          url: '/icons/icon-128x128.png',
          revision: '2c894fa662a53e92c00bb36b610ff965',
        },
        {
          url: '/icons/icon-144x144.png',
          revision: '0c809fa17b4af623db372212d8c6bfad',
        },
        {
          url: '/icons/icon-152x152.png',
          revision: 'e94409f5760f3418bdefc9a16b57abd3',
        },
        {
          url: '/icons/icon-192x192.png',
          revision: '9fc296461e8d57fbcdfe8a0f7693f16a',
        },
        {
          url: '/icons/icon-384x384.png',
          revision: '7a9ebf98a16bd5bb9b36897d444ff8f6',
        },
        {
          url: '/icons/icon-512x512.png',
          revision: '011dd6430f41cb1ce6f70514f4f37336',
        },
        {
          url: '/icons/icon-72x72.png',
          revision: 'd9f61101d2531fdd64251ddc05d09790',
        },
        {
          url: '/icons/icon-96x96.png',
          revision: '2300f889d0f745963b95e4ef843684e0',
        },
        {
          url: '/icons/lst/amnis-amAPT.png',
          revision: '484e8daf2965d64b076d746025fb6da9',
        },
        {
          url: '/icons/lst/amnis-stAPT.jpeg',
          revision: '1637dc6008dd9fa372fba97e8ba2a5a7',
        },
        {
          url: '/icons/lst/amnis.jpg',
          revision: '873ba2929a0f782ee2eb6996786dd3ce',
        },
        {
          url: '/icons/lst/default.png',
          revision: '15cfc9b943413878ed6bff10636b4947',
        },
        {
          url: '/icons/lst/kofi-kAPT.png',
          revision: '79d2e90c35340bead0580816b10ba99e',
        },
        {
          url: '/icons/lst/kofi-stkAPT.png',
          revision: '0e1989767e190ea3d07cf7e7609aed32',
        },
        {
          url: '/icons/lst/kofi.png',
          revision: '60547817c80c3c302b7f6f3ef85b357c',
        },
        {
          url: '/icons/lst/sthAPT.png',
          revision: '769f0a5ac17686b46aee56f6538be1a7',
        },
        {
          url: '/icons/lst/thala-thAPT.png',
          revision: '226e7dc27fc37ba375793aab5a98818b',
        },
        {
          url: '/icons/lst/thala.png',
          revision: '9613d29e2523956ee4a7c028a897c828',
        },
        {
          url: '/icons/lst/trufin.jpg',
          revision: 'abd73cdcc0ace129a37820a5ec1ffabe',
        },
        {
          url: '/icons/protocols/agdex.webp',
          revision: 'ead67f257680744bc6f7f531a6614e44',
        },
        {
          url: '/icons/protocols/amnis.avif',
          revision: '873ba2929a0f782ee2eb6996786dd3ce',
        },
        {
          url: '/icons/protocols/anqa.webp',
          revision: 'f20af2b202d4cdc7006c7eb7f5dc8063',
        },
        {
          url: '/icons/protocols/aptin.webp',
          revision: '0fbbad2e42ec29d84f17d6224df6eb7f',
        },
        {
          url: '/icons/protocols/aries.avif',
          revision: '6daa4501cd8d81d96de5a83d2db3bf40',
        },
        {
          url: '/icons/protocols/cellana.webp',
          revision: '04bd0292f03cbb350348ac201cd61253',
        },
        {
          url: '/icons/protocols/crossmint.jpeg',
          revision: 'b73bacb0d4be75ec23cbf3045cc80a08',
        },
        {
          url: '/icons/protocols/echelon.avif',
          revision: '0a142fa111a90e0ba4e462cb916fb460',
        },
        {
          url: '/icons/protocols/echo.webp',
          revision: '39bb26a0595ba5ffc854d83d2f579808',
        },
        {
          url: '/icons/protocols/econia.jpg',
          revision: '9240272013f87504ae8848437c65d2bf',
        },
        {
          url: '/icons/protocols/eliza.jpeg',
          revision: '857a066d8d9cfd6be68e767e84e3ba94',
        },
        {
          url: '/icons/protocols/emojicoin.webp',
          revision: 'ca8f90b3fb8bacb8e5a1ac936be2aad4',
        },
        {
          url: '/icons/protocols/hyperion.webp',
          revision: '7693b993732853a1d2e1c02437cefe91',
        },
        {
          url: '/icons/protocols/ichi.jpg',
          revision: 'ef8e934d59d83904fbaf402fcaed871d',
        },
        {
          url: '/icons/protocols/joule.webp',
          revision: '1eef073c2eb8f995f70637fe4cfaa1a7',
        },
        {
          url: '/icons/protocols/kana.webp',
          revision: '3fa7025c48e2939362cff81e1540618f',
        },
        {
          url: '/icons/protocols/kofi.avif',
          revision: '60547817c80c3c302b7f6f3ef85b357c',
        },
        {
          url: '/icons/protocols/liquidswap.webp',
          revision: 'ef167ad6f431b133e97759f7539847ff',
        },
        {
          url: '/icons/protocols/merkle.webp',
          revision: 'ce6eeeedc68b805e720c0145a5153d38',
        },
        {
          url: '/icons/protocols/meso.webp',
          revision: 'd1af4d5ae783baec6df90adc6591a48a',
        },
        {
          url: '/icons/protocols/metamove.png',
          revision: '74680220b9eae3307a5d26ac1c8571b1',
        },
        {
          url: '/icons/protocols/mirage.webp',
          revision: '95b7d2a36dcde85b885fc1b2944f1475',
        },
        {
          url: '/icons/protocols/moar.webp',
          revision: '83ab3f2eac7109b98f0996c400d470e3',
        },
        {
          url: '/icons/protocols/pancake.webp',
          revision: '57b27dbc09d1a7e9aaacb641badc2929',
        },
        {
          url: '/icons/protocols/panora.webp',
          revision: '52b6cf502de26f1a69b0b61641e54e7e',
        },
        {
          url: '/icons/protocols/pump-uptos.jpg',
          revision: 'f2cd27c5f972a859bb132cb404b37ce5',
        },
        {
          url: '/icons/protocols/superposition.webp',
          revision: '9d48e6e14ef4ae0979ca63ffbdab9cbb',
        },
        {
          url: '/icons/protocols/sushi.webp',
          revision: '1e2ef2dfff41c2e13c741c9869d7a7e3',
        },
        {
          url: '/icons/protocols/tapp.jpg',
          revision: '9196ab6b97aed6a6df621f3048f7beca',
        },
        {
          url: '/icons/protocols/thala.avif',
          revision: '288413db0a4df1b0f74854771fa628ca',
        },
        {
          url: '/icons/protocols/thetis.webp',
          revision: '6a93071643cb00841a6fe59f1e9a199a',
        },
        {
          url: '/icons/protocols/tradeport.jpg',
          revision: '3da3fc3aa846dab79b285d3ac238b886',
        },
        {
          url: '/icons/protocols/trufin.webp',
          revision: '6ef0457079f86e0e316de19459188bd8',
        },
        {
          url: '/icons/protocols/usdc.avif',
          revision: 'c76b33ca42c5730ab77f3341ce9764a7',
        },
        {
          url: '/icons/protocols/usde.avif',
          revision: '39fee82eebfcf1f1feb90d332c552824',
        },
        {
          url: '/icons/protocols/usdt.avif',
          revision: 'a440d4b512f4d2b9b63d3ab8818fc9e3',
        },
        {
          url: '/icons/protocols/vibrantx.png',
          revision: '2323554e155d8658bdb02533a734f41e',
        },
        {
          url: '/icons/rwas/blackrock.png',
          revision: 'aede4e936e2cdcc61113447b23dfccab',
        },
        {
          url: '/icons/rwas/ft.jpeg',
          revision: 'c78a250779ab8fad11690177a47a0be8',
        },
        {
          url: '/icons/rwas/libre.png',
          revision: '4b659f800a5386a597d164c38678c32c',
        },
        {
          url: '/icons/rwas/ondo.jpeg',
          revision: '6b79f329e17e0742b291b482d76823df',
        },
        {
          url: '/icons/rwas/pact.png',
          revision: 'de703819e3671e35dca521167f77bcb4',
        },
        {
          url: '/icons/rwas/rwa.png',
          revision: '2f9eea55eff920cb3a01246c1c0adbf0',
        },
        {
          url: '/icons/rwas/securitize.png',
          revision: '3039bf453f381b5c243f5e4606ea09e3',
        },
        {
          url: '/icons/stables/susde.png',
          revision: '7e4383543cdccc49d571519f9361ccae',
        },
        {
          url: '/icons/stables/usdc.png',
          revision: 'c76b33ca42c5730ab77f3341ce9764a7',
        },
        {
          url: '/icons/stables/usde.png',
          revision: '39fee82eebfcf1f1feb90d332c552824',
        },
        {
          url: '/icons/stables/usdt.png',
          revision: 'a440d4b512f4d2b9b63d3ab8818fc9e3',
        },
        { url: '/llms.txt', revision: 'b135b788a79ce8d95eef750a77090d3d' },
        {
          url: '/locales/README.md',
          revision: 'a7497e79d163310b92404d026f6ae1fb',
        },
        {
          url: '/locales/ar/btc.json',
          revision: 'cf12a3f487e339cfa16963543fd23c2f',
        },
        {
          url: '/locales/ar/common.json',
          revision: '02833b6fb7f2f63f05d077dd60b7d9ff',
        },
        {
          url: '/locales/ar/defi.json',
          revision: 'af73bd2b7078ac021af8ac3d44aa0c3e',
        },
        {
          url: '/locales/ar/lst.json',
          revision: '14e2d9edb8e49ffb3b30ca4b544d9f57',
        },
        {
          url: '/locales/ar/rwas.json',
          revision: '662d11360c6a4e799e3b89b1d634df4c',
        },
        {
          url: '/locales/ar/stables.json',
          revision: '6a52093641a2321b409570160f4e61e1',
        },
        {
          url: '/locales/de/btc.json',
          revision: '49fa724eea4ec3d1af49c584fe130425',
        },
        {
          url: '/locales/de/common.json',
          revision: '19bd7ea90d6de1e3ef72a2fd294e6236',
        },
        {
          url: '/locales/de/defi.json',
          revision: '353c76cbdf18a534347923cd1dd72a7c',
        },
        {
          url: '/locales/de/lst.json',
          revision: '0a9218847dfe2552ac5697670777605c',
        },
        {
          url: '/locales/de/rwas.json',
          revision: '8c910faf43c0bb05822f44b2eaeadaee',
        },
        {
          url: '/locales/de/stables.json',
          revision: 'bfd5749fc6697a7dde107be190107152',
        },
        {
          url: '/locales/en/btc.json',
          revision: '410e5abf94c7a91c22d30cbda40a2852',
        },
        {
          url: '/locales/en/common.json',
          revision: '942a57b23868741d11ff2e72134fdfc9',
        },
        {
          url: '/locales/en/defi.json',
          revision: '35352da412e99812da9c981c8f597ec1',
        },
        {
          url: '/locales/en/lst.json',
          revision: 'e5072e5bb798ed964b3fd6f879e3eb4d',
        },
        {
          url: '/locales/en/rwas.json',
          revision: '3a1075265e7481bcddd5e6af0ba7bdb6',
        },
        {
          url: '/locales/en/stables.json',
          revision: 'c5124973132bb0b439ab1033dc4206c8',
        },
        {
          url: '/locales/es/btc.json',
          revision: 'e9245ba5bdb83abde5204225e6690751',
        },
        {
          url: '/locales/es/common.json',
          revision: 'e68ec7e3f06ce39a01a69a8f40c70343',
        },
        {
          url: '/locales/es/defi.json',
          revision: '1e34c04f57744ff35370af64dab81e96',
        },
        {
          url: '/locales/es/lst.json',
          revision: '1b19075c6c91dcc2a842bbbc29f8e113',
        },
        {
          url: '/locales/es/rwas.json',
          revision: '36ec86f5da641714e7cf91c025184820',
        },
        {
          url: '/locales/es/stables.json',
          revision: '65598320b905da86b056dda7415c0174',
        },
        {
          url: '/locales/fr/btc.json',
          revision: '9f6a9653f92a41f61ff2d24ba5ddbc04',
        },
        {
          url: '/locales/fr/common.json',
          revision: '8d333d90c7cbbcdc73baa66256e95025',
        },
        {
          url: '/locales/fr/defi.json',
          revision: '47c6c4f4ac4bbaa8967680709d39fe6f',
        },
        {
          url: '/locales/fr/lst.json',
          revision: 'ec7deef0bf53de398911a33eadbcdd40',
        },
        {
          url: '/locales/fr/rwas.json',
          revision: '05b76e08ca8426ddc2f05ac0b8e38d9c',
        },
        {
          url: '/locales/fr/stables.json',
          revision: '5c493b36a16269ef62a68398920c368b',
        },
        {
          url: '/locales/ha/btc.json',
          revision: '23d44832b649f65dd054d69fd6a639b0',
        },
        {
          url: '/locales/ha/common.json',
          revision: '255197afba0d82c5e4a3893d95cf9569',
        },
        {
          url: '/locales/ha/defi.json',
          revision: '6835b1348c561f5d7b3cca51ef5e8d8f',
        },
        {
          url: '/locales/ha/lst.json',
          revision: '7c7c2b1b0ab13999216bbf552e4c513c',
        },
        {
          url: '/locales/ha/rwas.json',
          revision: 'deedb90be58e505f01c80f9d0ff7e9d8',
        },
        {
          url: '/locales/ha/stables.json',
          revision: '044231e56573cc8398a6d465e6ae8397',
        },
        {
          url: '/locales/hi/btc.json',
          revision: '2b0b26fb3f360307fc2efd32afa31585',
        },
        {
          url: '/locales/hi/common.json',
          revision: '45ecba811b76e1b633995eaa6a2cba10',
        },
        {
          url: '/locales/hi/defi.json',
          revision: 'd79e9dca576efabfa67bae4ebc8f2c77',
        },
        {
          url: '/locales/hi/lst.json',
          revision: 'db3cee3dd984c0d2cc456ebabdf18642',
        },
        {
          url: '/locales/hi/rwas.json',
          revision: '9467347c03865eab07182c15708ef7a0',
        },
        {
          url: '/locales/hi/stables.json',
          revision: '256c641e467deb29c560c6d09515c2f2',
        },
        {
          url: '/locales/ja/btc.json',
          revision: '307ffd0de25035afe2a0393cafbc1cf5',
        },
        {
          url: '/locales/ja/common.json',
          revision: '2f12948bf905c16381ea6a22273c0212',
        },
        {
          url: '/locales/ja/defi.json',
          revision: '15971bf3826665b9037ef46aabe70aa8',
        },
        {
          url: '/locales/ja/lst.json',
          revision: 'ed0f7b91defb140341c1329d67c9c719',
        },
        {
          url: '/locales/ja/rwas.json',
          revision: '0565d3a28512fa1701225ec98daed36f',
        },
        {
          url: '/locales/ja/stables.json',
          revision: '83e0b658c55c771dac2bc6fc591017d3',
        },
        {
          url: '/locales/ko/btc.json',
          revision: '1ca419ef25e270cbb85f413f377c8777',
        },
        {
          url: '/locales/ko/common.json',
          revision: '9d0cefcc66724bbf5fc5dad8a0bfaee6',
        },
        {
          url: '/locales/ko/defi.json',
          revision: '5f582fa9728775c3c4ea29a35d023da2',
        },
        {
          url: '/locales/ko/lst.json',
          revision: '41fda76332db530a959dde9cc6efe880',
        },
        {
          url: '/locales/ko/rwas.json',
          revision: '9b6f90a0b1038b228f75757c4940e531',
        },
        {
          url: '/locales/ko/stables.json',
          revision: 'e5ae39039ef5a6e934934dbb3e0ee1ed',
        },
        {
          url: '/locales/pt/btc.json',
          revision: '73da0100a6a429c65fd7d17a4a2bc4ed',
        },
        {
          url: '/locales/pt/common.json',
          revision: 'd930b1f2b76b09b73b33b66dbfc150a2',
        },
        {
          url: '/locales/pt/defi.json',
          revision: '5ba58bb83f7d17d60c36460b5d7d085b',
        },
        {
          url: '/locales/pt/lst.json',
          revision: '4cad64af4e60be710d6cfe006d2a35d0',
        },
        {
          url: '/locales/pt/rwas.json',
          revision: '023e0a953963f8fb083cb530e952cab7',
        },
        {
          url: '/locales/pt/stables.json',
          revision: '0f18b0f68d94c6c0f0f44e71c2d1f5b4',
        },
        {
          url: '/locales/ru/btc.json',
          revision: '2a2889b6fb584e26aff6a4487757a472',
        },
        {
          url: '/locales/ru/common.json',
          revision: '5904270050a9c5c36857248b71c77a7e',
        },
        {
          url: '/locales/ru/defi.json',
          revision: '51a550567f72ac7486b04adf11ac9824',
        },
        {
          url: '/locales/ru/lst.json',
          revision: 'b79d4a5708880ed47e55b040c27cbe04',
        },
        {
          url: '/locales/ru/rwas.json',
          revision: '81ad089625b835ce007eaa9c74f22b11',
        },
        {
          url: '/locales/ru/stables.json',
          revision: '818e614476c2ba88e05a3f40583f86c8',
        },
        {
          url: '/locales/zh-CN/btc.json',
          revision: 'e9585778f7cec2dad6502706bec0c38e',
        },
        {
          url: '/locales/zh-CN/common.json',
          revision: '162f918517659093a4eff7e18e5f819e',
        },
        {
          url: '/locales/zh-CN/defi.json',
          revision: 'dacf7b77c47d302d46f9449ceb3a5bda',
        },
        {
          url: '/locales/zh-CN/lst.json',
          revision: 'cd1c92f8706d553717e0e9b6bb803a0b',
        },
        {
          url: '/locales/zh-CN/rwas.json',
          revision: '16a65858e18b4788a84a12661d092589',
        },
        {
          url: '/locales/zh-CN/stables.json',
          revision: '55c8573a33f537b217bbee784ede2b4d',
        },
        { url: '/sitemap-0.xml', revision: '480b41ae323ef4dba93fe864b01f10bc' },
        { url: '/sitemap.xml', revision: 'af1ea637b190dbf82648af43a6a53796' },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: a,
              state: c,
            }) =>
              s && 'opaqueredirect' === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: s.headers,
                  })
                : s,
          },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/fonts\.googleapis\.com\/.*/i,
      new e.CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/fonts\.gstatic\.com\/.*/i,
      new e.CacheFirst({
        cacheName: 'google-fonts-static',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'images',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:js|css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-resources',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      ({ request: e }) => 'document' === e.destination,
      new e.NetworkFirst({
        cacheName: 'pages',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ));
});
