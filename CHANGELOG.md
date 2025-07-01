# Changelog

## [1.17.0](https://github.com/nopol10/nekocap/compare/1.16.0...1.17.0) (2025-07-01)

### Features

* add AutoLoginProvider in auto-login-context ([7757bc7](https://github.com/nopol10/nekocap/commit/7757bc77c914952c13b4454acc9e7b1be97fef2a))
* add callback and title override to LoginModal ([bc2d1d5](https://github.com/nopol10/nekocap/commit/bc2d1d5e3ae909b871d4f0bb1c41b2eec2cdd072))
* add caption editor page ([7d806a8](https://github.com/nopol10/nekocap/commit/7d806a821613b81f574430363980d21abc07245c))
* add lemino support ([c049b6f](https://github.com/nopol10/nekocap/commit/c049b6f2cfb68f3138458dc583c4862f0078a0f4))
* add nekocap video processor for in-website editor use ([d1f9e89](https://github.com/nopol10/nekocap/commit/d1f9e89f50244c3079f5521b1c72a71a7eed95ca))
* add new web editor strings ([25b1726](https://github.com/nopol10/nekocap/commit/25b1726eec59b794c7c89fdaeeb9f794709b531e))
* add react query provider ([f20602b](https://github.com/nopol10/nekocap/commit/f20602bc8920dbaaadd7c3b54433e23f6fc7e68e))
* add react query provider to next _app ([474324a](https://github.com/nopol10/nekocap/commit/474324a6eff0fa23fb1a80c75620033fe58aab49))
* add vimeo embed video player ([167304b](https://github.com/nopol10/nekocap/commit/167304b69a6cda75fa7dc571e0c4b25016feb6df))
* add youtube to html5 loader package ([c1f9248](https://github.com/nopol10/nekocap/commit/c1f92486293bbf772cf9da83ee94e55b4060ca06))
* redirect youtube paths to caption creator page ([ede8e41](https://github.com/nopol10/nekocap/commit/ede8e419ccbafb4f62b13b915213051219f04072))
* support ass captions for web editor ([697e902](https://github.com/nopol10/nekocap/commit/697e902ba0343eb2fe527afb0390ee40a37cd8a2))
* support opening login modal from Submit caption button on web ([7b394ce](https://github.com/nopol10/nekocap/commit/7b394ce1e3b5e64364a00670d4b9238369e0d694))
* updates to make the editor work in a webpage ([b431507](https://github.com/nopol10/nekocap/commit/b43150772d3f5052c4c1c790248a8c309b04ba4d))
* use youtube embed player in editor ([6c82d12](https://github.com/nopol10/nekocap/commit/6c82d1281e8e083482ca28851425e23a97854331))

### Bug Fixes

* fix dailymotion rendering not working after web editor update ([d7af700](https://github.com/nopol10/nekocap/commit/d7af700565414ea785ddde95188284e7acfe097a))
* fix double display of submission modal in the extension ([01b340b](https://github.com/nopol10/nekocap/commit/01b340b7eb0a7d54b3970aedb03cd6e28f3436d7))
* fix extension webpack errors caused by next-i18next used in non next context ([82d9d18](https://github.com/nopol10/nekocap/commit/82d9d1827907484db6d56ce1278e4b0c671dcff2))
* fix navigating from a search result page to a video page not causing the video menu to appear ([020bd33](https://github.com/nopol10/nekocap/commit/020bd33cc1d0dc78b27e36649b163ba21f206133))
* fix shift timings modal size ([956cedf](https://github.com/nopol10/nekocap/commit/956cedfc2984f55bcc341b6e0410e8d4769472c3))
* reduce possibility of page not loading the caption defined in the query param on YouTube ([9a99f96](https://github.com/nopol10/nekocap/commit/9a99f96a4f4aea96fe3b507502acfdd4fc7300cf))

## [1.16.0](https://github.com/nopol10/nekocap/compare/1.15.0...1.16.0) (2025-06-14)

### Features

* add roboto black and extrabold support ([f2710d4](https://github.com/nopol10/nekocap/commit/f2710d45e07aac1ff04805c0eaa6309480940e6a))

### Bug Fixes

* fix caption list being cleared on youtube when user is signed in ([a5ad82a](https://github.com/nopol10/nekocap/commit/a5ad82a56aecd0a80ae32bb9f70d7d4fc1736dad))

## [1.15.0](https://github.com/nopol10/nekocap/compare/1.14.0...1.15.0) (2025-06-07)

### Features

* fix twitter support and add support for twitter embeds ([905bf09](https://github.com/nopol10/nekocap/commit/905bf09c3b552300fd751f422717d81bb686332d))

### Bug Fixes

* fix caption visibility toggle not working on instagram / archive.org ([5e0d89a](https://github.com/nopol10/nekocap/commit/5e0d89a02166e3591a97acbd361d382586e90660))

## [1.14.0](https://github.com/nopol10/nekocap/compare/1.13.1...1.14.0) (2025-06-05)

### Features

* add useCanUseWorker hook ([07f7a4a](https://github.com/nopol10/nekocap/commit/07f7a4a4136c26932926c2d701e03b2d3b9fc960))
* support reel urls in instagram ([a350142](https://github.com/nopol10/nekocap/commit/a3501422f44cc2f3d47fb33cb67512da58fe7c43))
* support rendering advanced captions in extension iframe if a worker cannot be spawned in the content page ([ea23151](https://github.com/nopol10/nekocap/commit/ea231511aef435f2fd8b9be20b281a8520d3e997))
* update patch-worker's WorkerXHR to populate failure state ([8ceb484](https://github.com/nopol10/nekocap/commit/8ceb4842c890148f369c8827981e7e434dbeec8b))

### Bug Fixes

* prevent start and end times of cues in the caption editor from being set to negative values ([a25851f](https://github.com/nopol10/nekocap/commit/a25851f76d39ac3fedaec26ad57bcbcf090e6966))

## [1.13.1](https://github.com/nopol10/nekocap/compare/1.13.0...1.13.1) (2025-05-31)

### Bug Fixes

* fix editor not showing video player buttons in instagram ([044a7e8](https://github.com/nopol10/nekocap/commit/044a7e8cbda42734012555b08c753273e20e5d68))

## [1.13.0](https://github.com/nopol10/nekocap/compare/1.12.1...1.13.0) (2025-05-31)

### Features

* add instagram support (basic captions only) ([f0d38c7](https://github.com/nopol10/nekocap/commit/f0d38c7f1bdd778192061a4d70aa5f68dbd2a44b))
* add roboto slab and pixeloid fonts ([57c7dc6](https://github.com/nopol10/nekocap/commit/57c7dc69e75461adcabd638649bb32bdd8321ae5))
* add UNEXT support ([6d7ac01](https://github.com/nopol10/nekocap/commit/6d7ac0140120a60ee5e2db3b0a29cf2909a348a0))
* hide direct nekocap link in submit success modal for sites that do not support it ([ba73e1e](https://github.com/nopol10/nekocap/commit/ba73e1ec6b56e7986f0bab9c3156f961d2d50e6c))

### Bug Fixes

* fix caption renderer font size for portrait videos ([cc5dd2e](https://github.com/nopol10/nekocap/commit/cc5dd2e3ea872b9727b42647a7881dbe74dd4992))
* fix video sites list ([276980a](https://github.com/nopol10/nekocap/commit/276980a5ae943dc55bcdcb2cdf6530a2aa80a870))
* fix viewer page not maximising correctly ([e424bd3](https://github.com/nopol10/nekocap/commit/e424bd3f0a91495f9eecc03f489d46fde99a0989))

## [1.12.1](https://github.com/nopol10/nekocap/compare/1.12.0...1.12.1) (2025-05-17)

### Bug Fixes

* fix advanced renderer not being able to hide captions ([a72a106](https://github.com/nopol10/nekocap/commit/a72a1069a39dbc118a1d4b316f9fb51e095d827a))
* fix dailymotion integration ([6f11581](https://github.com/nopol10/nekocap/commit/6f115810f3013f2e80a4562af8b59a76e20b34fd))

## [1.12.0](https://github.com/nopol10/nekocap/compare/1.11.1...1.12.0) (2025-05-04)

### Features

* enable react compiler and update react-virtualized to react 19 compatible version ([15e8e45](https://github.com/nopol10/nekocap/commit/15e8e456cb0163cc302505cdc201b1d6aa13c94b))

### Bug Fixes

* fix nested a tags in data columns ([b435526](https://github.com/nopol10/nekocap/commit/b435526455ba84f372c5b8e22de0d22524402c4d))
* fix vimeo extension integration ([4877b6f](https://github.com/nopol10/nekocap/commit/4877b6fde067a71acc337f9f779c2e67b52afad6))
## [1.11.1](https://github.com/nopol10/nekocap/compare/1.11.0...1.11.1) (2025-04-29)

### Bug Fixes

* fix toolbar not appearing with new tver ui ([7a0e440](https://github.com/nopol10/nekocap/commit/7a0e440a933b8ddd60682fd316ce2efbc8c2f023))
## [1.11.0](https://github.com/nopol10/nekocap/compare/1.10.6...1.11.0) (2025-04-25)

### Features

* add dark mode editor support ([e2b4eed](https://github.com/nopol10/nekocap/commit/e2b4eed78d6599a2e5c9928db1771d9865d3e538))
* add download caption option to user dashboard ([3d2f1aa](https://github.com/nopol10/nekocap/commit/3d2f1aafb7006bfd56baec99244b004238425259))
* make app buildable with antd 5 ([725a0e9](https://github.com/nopol10/nekocap/commit/725a0e9d0c726e22605057ca1459a20375e62fe2))
* make youtube processor update title on submission ([c096aad](https://github.com/nopol10/nekocap/commit/c096aad53ba3db56f7a13682a97b10d8d39cb563))
* remove community moderation feature box in homepage as no one uses it ([dd1b43c](https://github.com/nopol10/nekocap/commit/dd1b43ccfc0bb80713342c0991798ef3881f681a))
* remove twitter alert in homepage ([4e0d65d](https://github.com/nopol10/nekocap/commit/4e0d65d397e051205c003ede108758fda44eed78))
* update csp for cloudflare features ([55be2fb](https://github.com/nopol10/nekocap/commit/55be2fba37238274803c7cd2482fff9043c1fb57))
* update font, antd tokens and homepage background ([aec79c2](https://github.com/nopol10/nekocap/commit/aec79c2b5050ef7d53a7ad963647f80c39c7ebcb))
* update next version ([e6b2e36](https://github.com/nopol10/nekocap/commit/e6b2e36151bd1347d9e7bf6c3e02aec42b7c65ae))
* update viewer page design ([7a5e822](https://github.com/nopol10/nekocap/commit/7a5e822537e5289fc746aa6713be78bb26843ff9))

### Bug Fixes

* fix dashboard link color in popup ([ed5f195](https://github.com/nopol10/nekocap/commit/ed5f195514e3d1fcc8f9819665cabed6d657d4b9))
## [1.10.6](https://github.com/nopol10/nekocap/compare/1.10.5...1.10.6) (2025-03-02)

### Features

* add fonts ([7731be9](https://github.com/nopol10/nekocap/commit/7731be9dd731709fc2a18c620e5d9ce0420482fb))
* add simplified chinese translations ([fe21f77](https://github.com/nopol10/nekocap/commit/fe21f77fb84026df7c1f540950dc6c2792bba9a8))
* use createRoot instead of ReactDOM.render for react 18 compatibility ([4029b15](https://github.com/nopol10/nekocap/commit/4029b1590f114293117d118b6b01d19931e3b9f1))
* use next/image for homepage images ([35799d8](https://github.com/nopol10/nekocap/commit/35799d8b045373f07ca0787d29ff22e3dd249a3a))

### Bug Fixes

* fix auto loading captions not sending raw captions to the page when a page changes automatically such as from a youtube playlist autoplay ([541e9ec](https://github.com/nopol10/nekocap/commit/541e9ecbcbc55f8d3d2774bf540e61003416c40a))
* fix caption editor erroring out when videoElement is not defined ([eaf6b43](https://github.com/nopol10/nekocap/commit/eaf6b437b32f6905a405e3021ca8eda5c6050d5f))
* fix mobile homepage badge sizes ([4265a11](https://github.com/nopol10/nekocap/commit/4265a1173018114b9fb3e5667d2f837c968a56ec))
## [1.10.5](https://github.com/nopol10/nekocap/compare/1.10.4...1.10.5) (2024-09-22)

### Bug Fixes

* patch lodash to remove usage of Function ([b8ecb43](https://github.com/nopol10/nekocap/commit/b8ecb431dc99c68ee1b16fbe45d913c22b7c41aa))
## [1.10.4](https://github.com/nopol10/nekocap/compare/1.10.3...1.10.4) (2024-09-01)

### Features

* add cache-control header to more file types ([15b6c64](https://github.com/nopol10/nekocap/commit/15b6c64307a04864ac3f87b323d83de6b19c7c3a))
* add font ([589314b](https://github.com/nopol10/nekocap/commit/589314b93abd777d50cbbc76b7e26d3922652077))
* add instagram link and alert message ([0ca61e5](https://github.com/nopol10/nekocap/commit/0ca61e5bd463eccc61a6d983f8e8b3b62c5a4d6a))
* add legacy worker js as cached path ([dbf7182](https://github.com/nopol10/nekocap/commit/dbf71823ca6321bed4fe303598e903d096c491ce))
* restrict img-src csp ([bb5c9ec](https://github.com/nopol10/nekocap/commit/bb5c9ecbff8f5dfd5efcb01c81b2a4ca26cc77c9))
* support rewrite to firebase on auth routes via next rewrites ([3af651a](https://github.com/nopol10/nekocap/commit/3af651aec40374d0986f53f3c803c1d5592e8267))
* update i18next dependencies ([ffadaf6](https://github.com/nopol10/nekocap/commit/ffadaf608b7c6b5a14098b0e7b8642a45a899120))
* upgrade to next 13 ([df90b0c](https://github.com/nopol10/nekocap/commit/df90b0cc66fa77b1018bf5dca0af2dc05d628a74))
* upgrade to next 14 ([94ef13f](https://github.com/nopol10/nekocap/commit/94ef13fb04434f5f3ebb9286de7b214538712f21))
* upgrade to webpack 5 ([0af8652](https://github.com/nopol10/nekocap/commit/0af8652c284e0cd5e6f2bad15f7a089029f20629))

### Bug Fixes

* allow vimeo in img csp ([3b0adcf](https://github.com/nopol10/nekocap/commit/3b0adcfedb7bf194a4dfa52b145c3ab53db1f7a2))
* allow youtube preview images in csp ([6d44140](https://github.com/nopol10/nekocap/commit/6d441406abc87590201219c5f6f0319770fa7119))
* fix ass loading issue ([6c7a441](https://github.com/nopol10/nekocap/commit/6c7a44138d696e74f2c8d9e7ac735345dc0ee096))
* fix basic captions on netflix not being positioned correctly for some videos ([e587e7a](https://github.com/nopol10/nekocap/commit/e587e7a350f637d1e6efc77cb17299bf3f3fbd7d))
* fix images in user profile exceeding sidebar width ([04fd71b](https://github.com/nopol10/nekocap/commit/04fd71b0365305d493dd913644d439de21007b2d))
* fix login issue with firebase change ([2b12987](https://github.com/nopol10/nekocap/commit/2b12987055940496ceded22bd24221bbc7ed168e))
* fix tag editor not saving tags correctly ([bf08575](https://github.com/nopol10/nekocap/commit/bf08575d368f3173b62f65ee4b2d5e40d829088a))
## [1.10.3](https://github.com/nopol10/nekocap/compare/1.10.2...1.10.3) (2024-03-03)

### Features

* update firebase auth version and webpack ([f508f4a](https://github.com/nopol10/nekocap/commit/f508f4a6ae0c13b3804cb315beda67bd03413f4a))
## [1.10.2](https://github.com/nopol10/nekocap/compare/1.10.1...1.10.2) (2024-03-02)
## [1.10.1](https://github.com/nopol10/nekocap/compare/1.10.0...1.10.1) (2024-01-17)

### Bug Fixes

* change persisted settings to use local storage instead of sync storage in an attempt to fix random settings loss ([a45998b](https://github.com/nopol10/nekocap/commit/a45998ba15fa31e7a25e290423c27a0db9739acd))
* fix getting wrong video id from youtube if query parameters are of a different order ([b36d89a](https://github.com/nopol10/nekocap/commit/b36d89ad44000a7197b7a1ff459127c3bac956c6))
## [1.10.0](https://github.com/nopol10/nekocap/compare/1.9.1...1.10.0) (2023-10-01)

### Features

* add support for tbs free ([723570f](https://github.com/nopol10/nekocap/commit/723570fc0a5958f4b939d720d58d68792b7d04fd))
* shift raw loading to post viewer page frontend load ([9401940](https://github.com/nopol10/nekocap/commit/94019401843c73d64cd47ab7e0786e7b536e4a03))
## [1.9.1](https://github.com/nopol10/nekocap/compare/1.9.0...1.9.1) (2023-05-27)

### Bug Fixes

* fix outdated dailymotion selectors ([b619b7f](https://github.com/nopol10/nekocap/commit/b619b7fedefe3a601b8ede0638935263b24bd073))
## [1.9.0](https://github.com/nopol10/nekocap/compare/1.8.1...1.9.0) (2023-05-01)

### Features

* add support for archive.org videos ([4f28e22](https://github.com/nopol10/nekocap/commit/4f28e22cec6b7e0fe014779f53d9ce53e9fa3e40))

### Bug Fixes

* fix various selector linting issues ([5a4668a](https://github.com/nopol10/nekocap/commit/5a4668af5b1dcc178666dcebe2131eda01672df7))
## [1.8.1](https://github.com/nopol10/nekocap/compare/1.8.0...1.8.1) (2023-04-03)

### Bug Fixes

* add patch for react-virtualized to fix request/cancelAnimationFrame not working in extensions in firefox ([fadf82f](https://github.com/nopol10/nekocap/commit/fadf82fb96161be84fe3a9c6c8a9983a3f8f4734))
* fix editor shortcuts not working after reduxed-chrome-storage upgrade ([e97140f](https://github.com/nopol10/nekocap/commit/e97140f3ffd7177a592738d16098b8cfd4e2b5a3))
* fix firefox extension not working by enabling store initialization in event page script ([d1f4d81](https://github.com/nopol10/nekocap/commit/d1f4d81bf38023ad87b791f18a2f13bba342da27))
* handle possibility of undefined name in globalThis constructor in isInServiceWorker ([4d55b55](https://github.com/nopol10/nekocap/commit/4d55b558b6a60d8844e5202c6bb3169003b07572))
* split large strings out of extension's subtitles-octopus-worker-legacy to pass firefox max file size check ([03cd3d1](https://github.com/nopol10/nekocap/commit/03cd3d1563ae39d632f98ae1bdf9d6002fca5f58))
* update firefox manifest to work with mv3 ([9a2f5b4](https://github.com/nopol10/nekocap/commit/9a2f5b4e75ce70ff54b0de22410d6f88553b5957))
## [1.8.0](https://github.com/nopol10/nekocap/compare/1.7.2...1.8.0) (2023-03-22)

### Features

* add advanced caption indicator to caption lists ([f2461f3](https://github.com/nopol10/nekocap/commit/f2461f3b1387e5972773f04bbc7754d0c28a13f7))
* add BooleanFilter for array filtering ([9c16095](https://github.com/nopol10/nekocap/commit/9c160951bea4236eeb636b4339a82292fd28d5af))
* add chinese and japanese fonts ([18de023](https://github.com/nopol10/nekocap/commit/18de02392120de469e82fd69549f9317b9ff0571))
* add comfortaa font ([baa469b](https://github.com/nopol10/nekocap/commit/baa469b5cdec17be3da9610f51257e09bbe53ce0))
* add error message for responseless state in loadCaption ([d5a4cc1](https://github.com/nopol10/nekocap/commit/d5a4cc14462ec3799177be81cd18b36faf7b0d55))
* add link to dashboard in extension popup ([183cdaf](https://github.com/nopol10/nekocap/commit/183cdaf14a6ea5822f3c2a3d2677940bbec66ba4))
* add Merriweather font support ([881f0bc](https://github.com/nopol10/nekocap/commit/881f0bc8596e515dbbac5e40b34ebb42f8943452))
* add post caption submission screen to submit caption modal with copy-able links ([61587af](https://github.com/nopol10/nekocap/commit/61587afc64425ac7de858f6644c129b8659dce52))
* enable zh-TW locale ([b469ea7](https://github.com/nopol10/nekocap/commit/b469ea7359208bfc6f03c828ee52a8f085677ee3))
* move "View captioner profile" beside caption list and make it show the name of the captioner instead ([d9067b1](https://github.com/nopol10/nekocap/commit/d9067b101f5f7dc262b4b3b532067d65f0f64556))

### Bug Fixes

* add cors to fontlist.json ([9fc9dc5](https://github.com/nopol10/nekocap/commit/9fc9dc559a33d1956d68c032d0885bb67517a64a))
* add null checks to tag display functions in CaptionList ([8dd9706](https://github.com/nopol10/nekocap/commit/8dd9706b562322b9fbf29bc6177b73abe98f1645))
* fix browse page not showing video thumbnails in mobile mode ([22c35ff](https://github.com/nopol10/nekocap/commit/22c35ff6d4474b4c9ccb95bacdbfd6b4d50f7978))
* fix browse page null errors ([b286e40](https://github.com/nopol10/nekocap/commit/b286e40a7792346cfcece3a6f77fec5ee6fc23ac))
* fix call to potentially uninitialized worker in subtitle octopus script ([e386e45](https://github.com/nopol10/nekocap/commit/e386e454ade82e8e6ba27136b45ba238f73f57c3))
* fix common hooks null errors ([808a5e9](https://github.com/nopol10/nekocap/commit/808a5e9b05320094aa648d0207ea38d8561a9af6))
* fix common video utils null errors ([dbaec71](https://github.com/nopol10/nekocap/commit/dbaec7180cc4dbc892bd6c204ae8b0e326402a8a))
* fix common web components null errors ([2c835ed](https://github.com/nopol10/nekocap/commit/2c835ed29705847874e9fb6a080f9161f147637e))
* fix editor null errors ([e9c1873](https://github.com/nopol10/nekocap/commit/e9c1873df1d4522bbe3cc287c5fb9b730091b1e3))
* fix eslint issues ([cac8fe9](https://github.com/nopol10/nekocap/commit/cac8fe95a8f6635316ac0326323eeb8fd1575107))
* fix extension background null errors ([24addd0](https://github.com/nopol10/nekocap/commit/24addd0fbeedfab1919cbefaf72f41d7c4d71527))
* fix extension content page container null checks ([104ef6d](https://github.com/nopol10/nekocap/commit/104ef6dd2982d5f345505e446202b48ab99419f4))
* fix extension content page general null errors ([5dcb21b](https://github.com/nopol10/nekocap/commit/5dcb21bd8ae1c5895b3bfebe39712ad5fa0d4151))
* fix extension popup context null errors ([c51d7b4](https://github.com/nopol10/nekocap/commit/c51d7b4b899444cf7c8fd6a8b899700d6cbe810b))
* fix general web null errors ([44ebefc](https://github.com/nopol10/nekocap/commit/44ebefca656107916311072003737067ced30cae))
* fix next-i18next localePath key position ([f6d534a](https://github.com/nopol10/nekocap/commit/f6d534a54998b37389486c1cfa37f1d97df8e675))
* fix null errors in common features ([959dac5](https://github.com/nopol10/nekocap/commit/959dac50c4d8fb2d266e85f391a1a3fd97caab6a))
* fix popup null errors ([4d8fb5b](https://github.com/nopol10/nekocap/commit/4d8fb5b4774e9d17fd935250aacd6f55207e7f63))
* fix renderer null errors ([e2dbb9a](https://github.com/nopol10/nekocap/commit/e2dbb9a58e668f395858376da0570dbc2cc36a86))
* fix signal action null errors ([7403d35](https://github.com/nopol10/nekocap/commit/7403d35120df5bed5707957d311b52afb9c6052a))
* fix vimeo and youtube player null checks ([60f07a3](https://github.com/nopol10/nekocap/commit/60f07a3da2f362a352d5d1cf5d59a1341fb1aaf9))
* fix web caption review null errors ([16c78d4](https://github.com/nopol10/nekocap/commit/16c78d40f0e46e5199ebaf3d3de7e9d3b8ee9f80))
* fix web font list null errors ([ee186cb](https://github.com/nopol10/nekocap/commit/ee186cbb733c57c8b0782525451c7b0c6e881286))
* fix web home null errors ([9e9e0b1](https://github.com/nopol10/nekocap/commit/9e9e0b1f0735403735ee579e07a7da4d759c768d))
* fix web profile page null errors ([c48adbd](https://github.com/nopol10/nekocap/commit/c48adbd9896ac3a541431afaca0a4755882e037e))
* fix web search null errors ([df94e18](https://github.com/nopol10/nekocap/commit/df94e1886fbffcf883cf037f0ecb1838fd092e79))
* fix web viewer null errors ([700b42c](https://github.com/nopol10/nekocap/commit/700b42cd67dd8f3765c1d318d876f861b98f7998))
* update dailymotion video time on seek end ([a8620bf](https://github.com/nopol10/nekocap/commit/a8620bf5c58600003b44ffbfff93b0f705f72a3e))
## [1.7.2](https://github.com/nopol10/nekocap/compare/1.7.1...1.7.2) (2022-12-29)

### Features

* add genseki gothic fonts ([7184df3](https://github.com/nopol10/nekocap/commit/7184df376fea1404b7be4149315dec0d2c4267c2))
* update viewer page to use ISR ([14b7a16](https://github.com/nopol10/nekocap/commit/14b7a1693b84af8a7ed8db4eb74229328906a9e4))

### Bug Fixes

* fix opening a preview in search page resulting in an error caused by early return and hooks in rc-table ([b71f33c](https://github.com/nopol10/nekocap/commit/b71f33c0d3e865ca2318fa1f3105a6d349af5c3b))
* fix subtitle octopus starting the render before all fonts are loaded ([c34219f](https://github.com/nopol10/nekocap/commit/c34219fe7c6b30aa5cc8d24be9ee50e55b061f17))
## [1.7.1](https://github.com/nopol10/nekocap/compare/1.7.0...1.7.1) (2022-12-19)

### Bug Fixes

* fix not being able to detect titles on TVer ([d5beaeb](https://github.com/nopol10/nekocap/commit/d5beaebc25230d99a40db5bdedc61bb5b44b074b))
* update type imports ([163925c](https://github.com/nopol10/nekocap/commit/163925cb4a32b21f5dff546c3e096e442268cfc3))
## [1.7.0](https://github.com/nopol10/nekocap/compare/1.6.0...1.7.0) (2022-12-18)

### Features

* patch subtitle-octopus to 4.1.0 ([64eba9c](https://github.com/nopol10/nekocap/commit/64eba9c2f6fb3abdf405a0d368434e90b070d9ff))

### Bug Fixes

* fix Twitter video detection ([9ec29eb](https://github.com/nopol10/nekocap/commit/9ec29ebb0a00d6d2c5c5a9b19ccd16fd459b6b7e))
## [1.6.0](https://github.com/nopol10/nekocap/compare/1.5.0...1.6.0) (2022-11-01)

### Features

* add anakotmai font support ([48d9d41](https://github.com/nopol10/nekocap/commit/48d9d4120a9390ee09a7da4e2c064fb9c15ec364))
* add antd and dayjs locale helpers ([03da00e](https://github.com/nopol10/nekocap/commit/03da00ea2e4bd7fda232d3196e05989c85dbb18a))
* add nekocapApi rtkquery slice ([51a82bc](https://github.com/nopol10/nekocap/commit/51a82bce21881b8da73a57729c36af9bba47fb35))
* add shortcut for seeking next and previous frames in editor ([9827670](https://github.com/nopol10/nekocap/commit/982767052f9c7f48022ed756c92a387adfe37a0d))
* add support for loading subtitles in txt file ([d615d42](https://github.com/nopol10/nekocap/commit/d615d4252c3f3febb5433b3eee1ea70c77d9c527))
* add useGetVideoFrameRate hook ([64c5cba](https://github.com/nopol10/nekocap/commit/64c5cbad6816e8564b6870bd838a5411371a6936))
* add user settings page ([31207bd](https://github.com/nopol10/nekocap/commit/31207bd15663f0e954ea06d10608a35f5b7fc3e6))
* add WSSpace component ([0663b6f](https://github.com/nopol10/nekocap/commit/0663b6fbf6b094aa15f28891be9604eb50cf95ef))
* enable Persian translations ([e0300da](https://github.com/nopol10/nekocap/commit/e0300dacb34b1164d2b447f78b7064ae6dba8a98))
* enable Portuguese (Brazil) and Japanese localizations on the website ([f4edffe](https://github.com/nopol10/nekocap/commit/f4edffecefb370ac61f06bd0d0453aa375416b2f))
* load antd and dayjs localizations ([e8d0d09](https://github.com/nopol10/nekocap/commit/e8d0d098c970a0969003257a8eb951c648a1712d))
* update firefox manifest and build settings (does not work yet due to lack of service worker support) ([b225c00](https://github.com/nopol10/nekocap/commit/b225c00cced3b9cb5214dac1e9a7318546334bb9))

### Bug Fixes

* add auto direction to body ([3a74ebe](https://github.com/nopol10/nekocap/commit/3a74ebe0222454dd6d45cdad151f2e9398c7389b))
* fix bug where caption search results would fail to render due to undefined language lists in a video ([e2297f7](https://github.com/nopol10/nekocap/commit/e2297f7264056eab9936677d047d9fcee9094f66))
* fix captions in viewer page being unviewable when their dimensions cannot be retrieved ([1e74a90](https://github.com/nopol10/nekocap/commit/1e74a90ee403722051a8127fb9759d66eafe9c84))
* fix fontlist link not leading to the localized page ([1c4009c](https://github.com/nopol10/nekocap/commit/1c4009c9ecc4444235aed52522e9b76bf16f8bf1))
* fix localization styling issues and missing localizations in browse caption page ([149ef95](https://github.com/nopol10/nekocap/commit/149ef95533a7b999411b450899b62113943a0010))
* fix navigating to dashboard from the dashboard causing displayed captions to disappear ([e17e5bb](https://github.com/nopol10/nekocap/commit/e17e5bb2a1aaa982892689593943faabacb24f08))
* fix oversized browse all captions button on the homepage on mobile ([7077e25](https://github.com/nopol10/nekocap/commit/7077e25707a34dc13f6e902b4858c73dbd6e2369))
* fix style issues caused by antd update ([676e7c0](https://github.com/nopol10/nekocap/commit/676e7c07de512299af35525a8d28071f011b8096))
* fix users getting logged out after logging in in the homepage and pressing the Dashboard button ([92a6a5b](https://github.com/nopol10/nekocap/commit/92a6a5bb17426a65c885f5bdc6a6671e3c7df80a))
* fix various visual bugs in editor on smaller screens ([85406e9](https://github.com/nopol10/nekocap/commit/85406e90907a3a7e49ff7c4d3783b935fbc8f732))
* fix wrong shortcut hotkey text being shown in the hotkey list in the editor ([5ab15ee](https://github.com/nopol10/nekocap/commit/5ab15ee4286a43de1e5d2fc5241af404fd036210))
## [1.5.0](https://github.com/nopol10/nekocap/compare/1.4.0...1.5.0) (2022-08-02)

### Features

* add browser language detector and make links in website route to correct locale ([8abd18b](https://github.com/nopol10/nekocap/commit/8abd18bca46f2d9c1b0d61933f8f22b43d94082e))
* add caption count stats to stats page ([0e73df1](https://github.com/nopol10/nekocap/commit/0e73df1b765f99220313b59787295933e5871815))
* add caption privacy enum ([6f49a7d](https://github.com/nopol10/nekocap/commit/6f49a7dd6ba96cf2d8ef9ed3f4c3992716eefba9))
* add caption privacy option in caption submission and update modals ([cfc5864](https://github.com/nopol10/nekocap/commit/cfc586428a941dce055c47e7d0f319c70bca02c0))
* add global stats page ([788e478](https://github.com/nopol10/nekocap/commit/788e478504f866571b8ca89d79ad4b17ed91168c))
* add global stats parse function call ([99d5b86](https://github.com/nopol10/nekocap/commit/99d5b86848aeb4063f8c67b6c31bce15d6de8074))
* add kofi widget to homepage ([2caeae3](https://github.com/nopol10/nekocap/commit/2caeae35639fca0da7af89827a042fed1fa12cee))
* add noembed.com to csp rule ([2be1bdd](https://github.com/nopol10/nekocap/commit/2be1bddba90a077e8704bb5ec7acbeaa0abe70e9))
* add recharts ([6cb8564](https://github.com/nopol10/nekocap/commit/6cb8564e8a61437cff37d72c7a38a9f950cd80fa))
* add sentry integration ([0e93251](https://github.com/nopol10/nekocap/commit/0e93251a42d40c64d78b241121b6cee717b5a394))
* add sentry package ([9fe2c30](https://github.com/nopol10/nekocap/commit/9fe2c3007f1600bf1d8c3cba065866e042edbe33))
* add stats slice ([fab7898](https://github.com/nopol10/nekocap/commit/fab7898edb6c77e4e5448dbc2fa9560f2e1d6c87))
* add support for bilibili.tv ([6414941](https://github.com/nopol10/nekocap/commit/6414941589395e876425683bc4b6d646c95a2da0))
* add vimeo player types ([3aa87d0](https://github.com/nopol10/nekocap/commit/3aa87d0fdec66f25b02d9bf6b5e5f06245f1c978))
* allow localization reload in dev environments ([adc9cf1](https://github.com/nopol10/nekocap/commit/adc9cf13fbfc65f6490ebe004a9f60414b0929c0))
* disable sentry in non-production builds ([852e11e](https://github.com/nopol10/nekocap/commit/852e11e4dcd4d621b31f0dd5387604d45da58b0c))
* update supported sites list ([80cba74](https://github.com/nopol10/nekocap/commit/80cba74f1314c6a4d42392d66c1075d22f059c82))
* **viewer:** add support for Vimeo captions in the viewer page ([f0fc970](https://github.com/nopol10/nekocap/commit/f0fc97084bb5f2d7621bb267054b995d1106fc46))

### Bug Fixes

* fix advanced captions lagging initially on iframe based videos ([0b65c15](https://github.com/nopol10/nekocap/commit/0b65c15fe84451d468c5a0f81d3d4688fbc7e7c5))
* fix mobile caption list's language label's color ([bd08a4e](https://github.com/nopol10/nekocap/commit/bd08a4e7eadf2f046a479ed5d8f299dbb0097beb))
* fix position of mobile kofi widget ([a598054](https://github.com/nopol10/nekocap/commit/a598054f4e8c9d6a402d84858749148304362c79))
* fix typo in homepage ([736a6bc](https://github.com/nopol10/nekocap/commit/736a6bc0c3723c67ed273baedaafc9c77296cbe1))
* prevent browse page from being stuck in an infinite loop when no captions are available ([183738e](https://github.com/nopol10/nekocap/commit/183738e78b5eb6645b39d8324f0ff0ebc2bff585))
* prevent caption review page from being visible to nonauthorized users ([9592898](https://github.com/nopol10/nekocap/commit/9592898ed23b4d3a1b838d2e264d5b495d3adc0b))
* **profile:** fix loading state not appearing when changing caption list page ([d0502c0](https://github.com/nopol10/nekocap/commit/d0502c0b4b634b19b591e0885c3b85373aa069e4))
## [1.4.0](https://github.com/nopol10/nekocap/compare/1.3.0...1.4.0) (2022-07-08)

### Features

* add Abema to supported sites list ([67627f8](https://github.com/nopol10/nekocap/commit/67627f892b3fa64092766b2725527e5645da2d3f))
* add autoload method selection in popup ([6d379e2](https://github.com/nopol10/nekocap/commit/6d379e2ebbbc4706e907c165fdfc500e894f82bc))
* add Chango font support ([8e60986](https://github.com/nopol10/nekocap/commit/8e6098679db2a3de5f367168c8a0ebff8a1f791c))
* add functionality for autoloading of captions ([c0e8ddf](https://github.com/nopol10/nekocap/commit/c0e8ddf5a6f9ae6f6ce04b5f8e20321dd309ddcb))
## [1.3.0](https://github.com/nopol10/nekocap/compare/1.2.3...1.3.0) (2022-07-01)

### Features

* add support for Abema ([99bc0d4](https://github.com/nopol10/nekocap/commit/99bc0d4e357028c8248d234580fce0439b6938da))
* **i18n:** add crowdin configuration ([8ff8078](https://github.com/nopol10/nekocap/commit/8ff807826eb69f61e95e1bec6364141630fa9dd0))
## [1.2.3](https://github.com/nopol10/nekocap/compare/1.2.2...1.2.3) (2022-06-13)

### Features

* add caveat and roboto condensed font support ([1cbdf02](https://github.com/nopol10/nekocap/commit/1cbdf027b79a95b5218fb2ad97bae1b62cbd7f20))

### Bug Fixes

* fix title not being detectable in bilibili ([6bf9637](https://github.com/nopol10/nekocap/commit/6bf96375e4d53f2b7778d500b3aac5449f53f237))
## [1.2.2](https://github.com/nopol10/nekocap/compare/1.2.1...1.2.2) (2022-06-04)

### Features

* add seto-sp font ([4ed7c46](https://github.com/nopol10/nekocap/commit/4ed7c467656d99903a060ad36e79402c6e94ac3f))

### Bug Fixes

* fix NekoCap menu not appearing in new youtube layout ([c0586fb](https://github.com/nopol10/nekocap/commit/c0586fb8a7d09b833a7b5b63ce54685ef6032d1b))
## [1.2.1](https://github.com/nopol10/nekocap/compare/1.2.0...1.2.1) (2022-05-18)

### Bug Fixes

* fix certain captions not rendering correctly due to improper timings ([ee2f2a6](https://github.com/nopol10/nekocap/commit/ee2f2a6263a9c27b86f1783e26df3647cbf7eeff))
## [1.2.0](https://github.com/nopol10/nekocap/compare/1.1.0...1.2.0) (2022-05-05)

### Features

* add caption size control to viewer page ([39743bf](https://github.com/nopol10/nekocap/commit/39743bf058578d85f21d1ca50723bd3055b87f6d))
* add hostname and port to next configuration in server.js ([04e9425](https://github.com/nopol10/nekocap/commit/04e94252d19a83c7c4f2688eebb3c2e308f36220))
* add new Korean fonts ([b316a7c](https://github.com/nopol10/nekocap/commit/b316a7cdeec47e10a999c95328381a6e6ce05646))
* add page to allow browsing to specific pages of captions ([d546935](https://github.com/nopol10/nekocap/commit/d546935ed6425c4b4e31dfdca42a2d1eec6aec7c))
* add support for nogidoga.com ([bb81c78](https://github.com/nopol10/nekocap/commit/bb81c78e6541f504526a2d4922a35526cef56e30))
* make capper page use ISR ([359b45b](https://github.com/nopol10/nekocap/commit/359b45b5806e7279489b41792731692b42be80e3))
* prevent retrieval of logged in user's captions outside of the dashboard page ([087d662](https://github.com/nopol10/nekocap/commit/087d66225f8fca5731e7682945e65e4956e51115))
* update next to 12 and babel-plugin-styled-components to 2.0.7 ([b429b49](https://github.com/nopol10/nekocap/commit/b429b49cfb3cddf6b841ae4affab4c6dc5b7c064))
* update react-youtube to fix issue with resize causing a reload of the youtube iframe ([ffaa2de](https://github.com/nopol10/nekocap/commit/ffaa2de1a3078a197eb7a4d3ddfbf8c1de455d3f))
* update supported sites list ([8cbb9ed](https://github.com/nopol10/nekocap/commit/8cbb9eda8de8eb78f7bd26918523ab080d3887e0))

### Bug Fixes

* trigger resizing of the caption container in the viewer page when the screen is resized ([5692346](https://github.com/nopol10/nekocap/commit/56923466dba7c263399f92fa672804e5c4b36308))
## [1.1.0](https://github.com/nopol10/nekocap/compare/1.0.4...1.1.0) (2022-04-15)

### Features

* add iqiyi support ([b6a6d7d](https://github.com/nopol10/nekocap/commit/b6a6d7d537aded9637ac07f4222d32a7a46161ad))
* add support for WeTV ([6c32aff](https://github.com/nopol10/nekocap/commit/6c32aff65c36408fb7de3c81daee76c9680d5ee8))
* add tiktok support ([c9e82dd](https://github.com/nopol10/nekocap/commit/c9e82dd5473059abcc8f7e6af6d7f852bd375e3e))

### Bug Fixes

* fix advanced loaded caption not being cleared when an srt caption is subsequently loaded and submitted, resulting in the advanced caption being submitted instead ([c9b63c7](https://github.com/nopol10/nekocap/commit/c9b63c7e38ef814753f44b13a72b2c3d7f0434c5))
* fix bilibili sometimes not working ([d738388](https://github.com/nopol10/nekocap/commit/d738388b3351a39c69ae4e78d6f86252293185c4))
* fix editor scrubber's time indicator getting word wrapped on the right ([a3c3c64](https://github.com/nopol10/nekocap/commit/a3c3c648a15e1d75dd47f8ccb759a9faeba1aef6))
* fix TVer integration so that it works with the new UI ([646f42d](https://github.com/nopol10/nekocap/commit/646f42dfd64d5d7859139438562d89caabe29b00))
## [1.0.4](https://github.com/nopol10/nekocap/compare/1.0.3...1.0.4) (2022-04-10)

### Features

* add display of Youtube External CC tag on captions containing the tag ([764aecb](https://github.com/nopol10/nekocap/commit/764aecb9169181b17bdefa38d09097ac0c20a775))
* add layiji mahaniyom font support ([814b26b](https://github.com/nopol10/nekocap/commit/814b26bd249dae9d9206a885f7655ff9ce41492c))
* add Unknown language and ytExCC tag constant ([b77cb40](https://github.com/nopol10/nekocap/commit/b77cb403dec59a22ca6a05a9ff7841b22911519a))
* update meta tags to support direct video embedding on twitter and sites that read opengraph tags ([ad27692](https://github.com/nopol10/nekocap/commit/ad27692767dc7731fe60bbbe83706e0877468deb))

### Bug Fixes

* fix search screen not refreshing when there are no results from a new search ([fbc1354](https://github.com/nopol10/nekocap/commit/fbc1354a0f3133a4fb2f9586f3dca95b28043412))
* fix viewer embed page having extra padding below ([dd5585d](https://github.com/nopol10/nekocap/commit/dd5585d91d35b09646a83b5fb69ae1b5a1cbd086))
## [1.0.3](https://github.com/nopol10/nekocap/compare/1.0.2...1.0.3) (2022-04-02)

### Features

* add additional languages ([89616eb](https://github.com/nopol10/nekocap/commit/89616eba55771883f2b14d62c454206ba541261f))
* add support for viewer page embeds ([d622985](https://github.com/nopol10/nekocap/commit/d6229858dec955827f2b7602776cbdf86269f0d7))
* add various thai fonts ([a1e0136](https://github.com/nopol10/nekocap/commit/a1e01360c035e1a4f06de3e54b6961c425fd3985))

### Bug Fixes

* fix bilibili processor to work with videos with multiple parts ([9ff7cf1](https://github.com/nopol10/nekocap/commit/9ff7cf1dc1ae12e60b3af12b110f4860cd9a1ba5))
* fix export to SRT not working in the webpage ([c30044d](https://github.com/nopol10/nekocap/commit/c30044d914cd435af08131fdf71d66d120e2a5aa))
* fix some youtube embeds not working in the viewer page ([8c9fd83](https://github.com/nopol10/nekocap/commit/8c9fd83947ce92ebd57c5239a7f1c8e99776e031))
## [1.0.2](https://github.com/nopol10/nekocap/compare/1.0.1...1.0.2) (2022-03-15)
## [1.0.1](https://github.com/nopol10/nekocap/compare/1.0.0...1.0.1) (2022-02-26)

### Bug Fixes

* fix user preferences not being restored ([35fdca6](https://github.com/nopol10/nekocap/commit/35fdca6e59bebb9d370e182d6fdfba1b66d9bab4))
* fix viewer page not loading font variants ([c780e90](https://github.com/nopol10/nekocap/commit/c780e902fc786ad63d6a392faf316fba110ddbf6))
## [1.0.0](https://github.com/nopol10/nekocap/compare/0.9.3...1.0.0) (2022-02-04)

### Features

* add Vietnamese extension store description ([ca49815](https://github.com/nopol10/nekocap/commit/ca49815437a65eab9dcfa78604c5c9cb5860c4ed))
* implement Manifest V3 compatibility ([#34](https://github.com/nopol10/nekocap/issues/34)) ([9d85d37](https://github.com/nopol10/nekocap/commit/9d85d37ab6d7a51868f9f7272b8bc04172ddf82a))
## [0.9.3](https://github.com/nopol10/nekocap/compare/0.9.2...0.9.3) (2022-01-21)

### Features

* add Japanese extension description ([9ea449e](https://github.com/nopol10/nekocap/commit/9ea449e4764f227cd0b6232c82a3309c583c1429))
* add nekocap.com to font-src in website ([f578e2d](https://github.com/nopol10/nekocap/commit/f578e2d27ab4a7636a61925a675fe17608219ab5))
* add Persian extension description ([c536517](https://github.com/nopol10/nekocap/commit/c53651711741799fe020d1ca3fcdce293488a496))
## [0.9.2](https://github.com/nopol10/nekocap/compare/0.9.1...0.9.2) (2022-01-10)

### Features

* separate font url from website url to support the use of cdn ([74d26db](https://github.com/nopol10/nekocap/commit/74d26db06c0d6291ef8c3bbff1400cab599917f2))
## [0.9.1](https://github.com/nopol10/nekocap/compare/0.9.0...0.9.1) (2022-01-09)

### Features

* fix replacement fonts not showing up correctly on some occasions ([6fc012c](https://github.com/nopol10/nekocap/commit/6fc012cce96651855d1b9029f434ba039949e804))

### Bug Fixes

* fix subtitle-octopus not loading font weight and style variants when availableFonts are specified ([0c0d133](https://github.com/nopol10/nekocap/commit/0c0d133af3cccc26549c0b717d9f3be9ef98778c))
## [0.9.0](https://github.com/nopol10/nekocap/compare/0.8.0...0.9.0) (2022-01-05)

### Features

* add number of available captions as the extension's badge ([2f3a2c7](https://github.com/nopol10/nekocap/commit/2f3a2c7fa1b55bd3d4f28bf02ed1606a8e0ddf17))
* Update caption (web) ([#32](https://github.com/nopol10/nekocap/issues/32)) ([35af155](https://github.com/nopol10/nekocap/commit/35af155dc28b8ada90913b8d42eeec06191f985f))

### Bug Fixes

* fix low frame rate in viewer page due to not setting pause state in subtitle-octopus ([b98d1db](https://github.com/nopol10/nekocap/commit/b98d1db514fbd3c7926c2a3353ff04fa4c040776))
* fix mobile octopus renderer's resolution in the caption viewer page ([dcb75fe](https://github.com/nopol10/nekocap/commit/dcb75fe4f603457657bdc529f96cf0909459e92e))
* limit framerate of octopus renderer to improve the web player's performance ([b503acd](https://github.com/nopol10/nekocap/commit/b503acdad36815e49146902aaa678ff230230d1c))
## [0.8.0](https://github.com/nopol10/nekocap/compare/0.7.6...0.8.0) (2021-12-16)

### Features

* add Amazon Prime Video support ([98fc7cf](https://github.com/nopol10/nekocap/commit/98fc7cfaab27779df3ae93672d74c4c530da9f93))
* add caption menu in the popup page ([090d654](https://github.com/nopol10/nekocap/commit/090d6549b348d7f8375ac5d8a019f1cc6f35b9b2))
* add support for loading captions automatically when links to supported sites contain the nekocap query parameter ([e94d009](https://github.com/nopol10/nekocap/commit/e94d009eacdbc706b766925a406c866066e4bf26))

### Bug Fixes

* **viewer:** make fullscreen button appear over the embedded video ([09c99f1](https://github.com/nopol10/nekocap/commit/09c99f10c0c60bff954e761d644d96b1ea4283f1))
## [0.7.6](https://github.com/nopol10/nekocap/compare/0.7.5...0.7.6) (2021-12-12)

### Bug Fixes

* apply automatic rtl to titles in caption lists ([300335f](https://github.com/nopol10/nekocap/commit/300335fa0b066d7a26a480dcdfd32ac241e45178))
* fix exported srts not having the correct RTL string ([5ada351](https://github.com/nopol10/nekocap/commit/5ada3511027b1e9e42056dea58aae7a71a7dcae2))
## [0.7.5](https://github.com/nopol10/nekocap/compare/0.7.4...0.7.5) (2021-12-09)

### Features

* add font list page ([#28](https://github.com/nopol10/nekocap/issues/28)) ([be49249](https://github.com/nopol10/nekocap/commit/be492495069939649b877476a59dcdf2116b41ed))
* add new fonts ([9005eb7](https://github.com/nopol10/nekocap/commit/9005eb7da171fa14f40353b7527ee9d8a1ec63ab))
* add view count to captions list ([7073e42](https://github.com/nopol10/nekocap/commit/7073e427e7b666ddaf48e2d6d104d18467a83bf6))
* View in full screen ([#30](https://github.com/nopol10/nekocap/issues/30)) ([154e9db](https://github.com/nopol10/nekocap/commit/154e9db3790d1d6d25db8ecdad5dc625e2829cc4))

### Bug Fixes

* fix rtl language display in caption viewer and editor ([61587ab](https://github.com/nopol10/nekocap/commit/61587ab0c758f6fea3c6379089d02ee2acc9bd28))
## [0.7.4](https://github.com/nopol10/nekocap/compare/0.7.3...0.7.4) (2021-11-19)

### Features

* adjust website styles for mobile ([b32af99](https://github.com/nopol10/nekocap/commit/b32af99a2ecc0b3dc6e3546bd36fdb16263c9150))
* increase verified upload limit to ~100MB ([829d3c2](https://github.com/nopol10/nekocap/commit/829d3c213935e60c444e2f480d1c0c356557a3fd))
* update subtitle-octopus to the version as of 31-10-2021 ([3008131](https://github.com/nopol10/nekocap/commit/3008131b24ceabdf3b0d2d703c2e0ce29ee6cf13))

### Bug Fixes

* fix font list not being loaded correctly in the web viewer ([d4c49aa](https://github.com/nopol10/nekocap/commit/d4c49aa4f3537edc281556cfa9b32facf00a7c9b))
* fix not being able to save locally initially and not being able to close the editor ([276bd02](https://github.com/nopol10/nekocap/commit/276bd02848213754c66a90c04bd058c293f6b143))
* fix viewer page running without subtitle octopus without webassembly ([7cf5aa4](https://github.com/nopol10/nekocap/commit/7cf5aa4ad8c913877425be8c8fcc345c91f44ed5))
## [0.7.3](https://github.com/nopol10/nekocap/compare/0.7.2...0.7.3) (2021-10-29)

### Features

* add fontsloaded listener support to subtitle octopus in the extension ([6bebdda](https://github.com/nopol10/nekocap/commit/6bebddaa7b9371bb38e7de9cc27a711a04f516c1))
* add raw loading indicator to inline menu icon ([2919058](https://github.com/nopol10/nekocap/commit/29190586ce3597c4ee3fc550bca4854373b50fea))
* show raw caption loading progress in video page menu ([ac3a020](https://github.com/nopol10/nekocap/commit/ac3a020d793b560cbabf2e40d2806ba0231f1bbf))

### Bug Fixes

* fix fonts not being loaded in chunks ([3ee86ea](https://github.com/nopol10/nekocap/commit/3ee86ea0d7f526cc9e7a050cfdcd5adcd0356339))
* make website's browse page load captions if server side pregeneration failed ([6f6d5f1](https://github.com/nopol10/nekocap/commit/6f6d5f149d2f283659fc0c571c4ad8a1ebb27888))
## [0.7.2](https://github.com/nopol10/nekocap/compare/0.7.1...0.7.2) (2021-10-27)

### Features

* add cache control header for woff2 fonts ([7d29126](https://github.com/nopol10/nekocap/commit/7d29126aea352f873e082c14a22e29befba0a43e))
* add max size message to caption loading modal ([caf02b4](https://github.com/nopol10/nekocap/commit/caf02b4df8ea7db397606ea227455c55f254a27c))
* add static font list generation to build process ([05e75d5](https://github.com/nopol10/nekocap/commit/05e75d5aecade6d89538b9d63c9f51697751318a))
* load font list from the server before rendering ass captions ([e1dfe25](https://github.com/nopol10/nekocap/commit/e1dfe257c81126b415ad519455fe203d314a06fd))
## [0.7.1](https://github.com/nopol10/nekocap/compare/0.7.0...0.7.1) (2021-10-26)
## [0.7.0](https://github.com/nopol10/nekocap/compare/0.6.2...0.7.0) (2021-10-25)

### Features

* add caption review page ([2f49d94](https://github.com/nopol10/nekocap/commit/2f49d946a7c7018b2d01e2cba09e91ae35e440ab))
* Netflix support ([#27](https://github.com/nopol10/nekocap/issues/27)) ([b163d55](https://github.com/nopol10/nekocap/commit/b163d5591a9a15bdf94598dc4149a31a76b4e272))
## [0.6.2](https://github.com/nopol10/nekocap/compare/0.6.1...0.6.2) (2021-07-08)

### Bug Fixes

* fix font loading on Firefox ([f8de0c6](https://github.com/nopol10/nekocap/commit/f8de0c6b7532d16736cbbfd257faf2811a1f25ba))
## [0.6.1](https://github.com/nopol10/nekocap/compare/0.6.0...0.6.1) (2021-07-06)

### Bug Fixes

* fix bilibili bangumi and ass loading not working for Firefox ([f65671a](https://github.com/nopol10/nekocap/commit/f65671a2baf95e8fa6970ab84248061c1fd3738d))
## [0.6.0](https://github.com/nopol10/nekocap/compare/0.5.13...0.6.0) (2021-07-06)

### Features

* add support for BiliBili Bangumi ([220a258](https://github.com/nopol10/nekocap/commit/220a2582878986c11653edfbc6764b54a244fde3))
## [0.5.13](https://github.com/nopol10/nekocap/compare/0.5.12...0.5.13) (2021-06-23)

### Features

* update auto caption retrieval method ([1680197](https://github.com/nopol10/nekocap/commit/1680197137b42aad4442b0e2c2357c0676bc7030))
## [0.5.12](https://github.com/nopol10/nekocap/compare/0.5.11...0.5.12) (2021-05-26)

### Features

* update website to use next.js ([#25](https://github.com/nopol10/nekocap/issues/25)) ([b996fef](https://github.com/nopol10/nekocap/commit/b996fefd571533b2dabc454c96c8b9c77ab58a5f))

### Bug Fixes

* fix auto caption list not being retrievable from youtube ([017d722](https://github.com/nopol10/nekocap/commit/017d722e4a2191ebeab60655a36d92c0a729b0da))
## [0.5.11](https://github.com/nopol10/nekocap/compare/0.5.10...0.5.11) (2021-04-28)

### Features

* add website link to NekoLogo ([b0e344c](https://github.com/nopol10/nekocap/commit/b0e344c11cdbe48e460e48a82f859d12bfe0370b))
## [0.5.10](https://github.com/nopol10/nekocap/compare/0.5.9...0.5.10) (2021-03-28)

### Features

* add submission cooldown message for unverified users ([b01f059](https://github.com/nopol10/nekocap/commit/b01f059ecd2997cdc3d9267b0d96d7218db4f435))
## [0.5.9](https://github.com/nopol10/nekocap/compare/0.5.8...0.5.9) (2021-03-23)

### Features

* add save confirmation modal to local save functionality ([95fe910](https://github.com/nopol10/nekocap/commit/95fe910e7037e00ed57c9ffea4fe1f119356cea3))

### Bug Fixes

* fix mobile viewer width issues ([a70f337](https://github.com/nopol10/nekocap/commit/a70f3375a344200ae5409a4ab76ee3aaf291431a))
## [0.5.8](https://github.com/nopol10/nekocap/compare/0.5.7...0.5.8) (2021-03-07)

### Features

* add localized French and Arabic extension descriptions ([067d3ff](https://github.com/nopol10/nekocap/commit/067d3ffb22e40411478020b18ef6c4b515ff0a61))
## [0.5.7](https://github.com/nopol10/nekocap/compare/0.5.6...0.5.7) (2021-02-25)

### Features

* add meta tags to website ([b9786e6](https://github.com/nopol10/nekocap/commit/b9786e6c6ab27b77da0ea0489e1da360954e640f))
* add new Japanese and Traditional Chinese fonts ([9e93a55](https://github.com/nopol10/nekocap/commit/9e93a559d330517d3d209af475ad855cbd3548e6))

### Bug Fixes

* fix caption search not being able to load infinitely ([856d2b4](https://github.com/nopol10/nekocap/commit/856d2b459ff0183c3cdf7ca12f97c2575eadb433))
## [0.5.6](https://github.com/nopol10/nekocap/compare/0.5.5...0.5.6) (2021-01-24)
## [0.5.5](https://github.com/nopol10/nekocap/compare/0.5.4...0.5.5) (2021-01-17)

### Features

* add fix overlaps function in editor ([be90df9](https://github.com/nopol10/nekocap/commit/be90df9a614795b1cf50fa002f499e1cf8746fd1))

### Bug Fixes

* fix captions in a track not being sorted correctly in some cases ([22a0375](https://github.com/nopol10/nekocap/commit/22a0375c8f9a741e157f750b68de85086d4eada3))
## [0.5.4](https://github.com/nopol10/nekocap/compare/0.5.3...0.5.4) (2021-01-17)

### Bug Fixes

* fix double login bug when a new user creates an account ([8efd610](https://github.com/nopol10/nekocap/commit/8efd610e558d1db247d1b94964bb7b55e883baac))
## [0.5.3](https://github.com/nopol10/nekocap/compare/0.5.2...0.5.3) (2021-01-16)

### Features

* add autosave toggle and autosave functionality ([#18](https://github.com/nopol10/nekocap/issues/18)) ([6915044](https://github.com/nopol10/nekocap/commit/69150444765fbf4ab2554a07a58c6d4ccb67fb3e))
* add Firefox extension button to homepage ([8558de7](https://github.com/nopol10/nekocap/commit/8558de79b39da30d58d1589a42b1e146e81eb857))

### Bug Fixes

* fix missing key in homepage tables ([fb98296](https://github.com/nopol10/nekocap/commit/fb982961e1e034c8d94e3ad359b45afa0709fef8))
* prevent redux-persist from being used in the website ([9a56111](https://github.com/nopol10/nekocap/commit/9a561110483e2b3afbe4a5a3819e5dbd2f483509))
## [0.5.2](https://github.com/nopol10/nekocap/compare/0.4.5...0.5.2) (2021-01-10)
## [0.4.5](https://github.com/nopol10/nekocap/compare/0.4.4...0.4.5) (2021-01-09)

### Bug Fixes

* fix issues with wrong input widths in the editor ([2cc3257](https://github.com/nopol10/nekocap/commit/2cc325778b6076449b06fc0f485e320a728f5930))
* fix tracks being scrollable in the editor ([9da04a5](https://github.com/nopol10/nekocap/commit/9da04a5a2763daf9ac448de185e823513bce565e))
## [0.4.4](https://github.com/nopol10/nekocap/compare/0.4.3...0.4.4) (2021-01-03)

### Features

* add captioner profile link to video page bar ([fa35d5d](https://github.com/nopol10/nekocap/commit/fa35d5daa8010ec6329e16fcfa1872e5e6f93b50))
## [0.4.3](https://github.com/nopol10/nekocap/compare/83b1f249be3a68109cd060fe534d0c0a8ba385ff...0.4.3) (2021-01-02)

### Features

* add anton, press start 2p, shadows into light, sigmar one fonts to the font list ([3829754](https://github.com/nopol10/nekocap/commit/38297540ff3d9dd27e0b43f5fbfca36af8981fe2))
* add button to hide menu and button inside extension settings to show the menu again ([#8](https://github.com/nopol10/nekocap/issues/8)) ([0d819e8](https://github.com/nopol10/nekocap/commit/0d819e8c3185908c73be98373b912025f01b4761))
* add cancel button in profile edit sidebar and Copy profile link function ([db6bc4f](https://github.com/nopol10/nekocap/commit/db6bc4fe554c0e57776da091477c632ea2c6e4c2))
* add extension reload button in popup loading page to allow manual recovery in case of server connection issues ([4e236f8](https://github.com/nopol10/nekocap/commit/4e236f8bdac159ddc87ac305e752828cbc2f5197))
* add link to github ([2b4ef73](https://github.com/nopol10/nekocap/commit/2b4ef73055932827b6e0e733b74ff7eac996809b))
* add link to github ([83b1f24](https://github.com/nopol10/nekocap/commit/83b1f249be3a68109cd060fe534d0c0a8ba385ff))
* add loading text to profile page in place of empty name ([2bb409b](https://github.com/nopol10/nekocap/commit/2bb409b48c5846f75afb27e41ae15cce25a8fb02))
* add rudimentary support for YouTube's dark mode in video page menu's UI ([5f694e4](https://github.com/nopol10/nekocap/commit/5f694e4ea035878936683c8b2c756f70b307e322))
* add translated title to video name in the website ([0caf40e](https://github.com/nopol10/nekocap/commit/0caf40e405c02d34653e6d4eea2833ca44317f4c))
* hide youtube comments and "up next" elements when the editor is open to improve performance ([c5046a1](https://github.com/nopol10/nekocap/commit/c5046a1e5bae086e27bd55b4797ffb5f921e51a1))
* replace text editor fields with a simplified element showing only the start time and part of the cue's text for improved readability and performance ([2ba8494](https://github.com/nopol10/nekocap/commit/2ba84947875007530f488b8c0700e6aae63c39cf))

### Bug Fixes

* autogenerated youtube captions sometimes not rendering correctly due to missing duration attribute in the response xml ([df40af4](https://github.com/nopol10/nekocap/commit/df40af4fdc2b07a8552c7d7d16872f57119dd06f))
* fix for video element becoming invisible after loading an ass with the editor open [#11](https://github.com/nopol10/nekocap/issues/11) ([d5eff55](https://github.com/nopol10/nekocap/commit/d5eff55d681c3838ebb82d28d24625801e9995ee))
* fix issue with being unable to close the editor after an ASS caption is loaded and a new caption is created ([216cbfe](https://github.com/nopol10/nekocap/commit/216cbfe83284b0fe5179cc5b815d16120c35a493))
* fix pluses appearing in auto caption language names ([117abb3](https://github.com/nopol10/nekocap/commit/117abb3f1df8534dc6645ce61d0ae35dd7456fe3))
* fix position of audio description image in submission modal ([f4071d7](https://github.com/nopol10/nekocap/commit/f4071d719d0e6f3e576eff5baec1ac9b1ee08392))
* fix post ASS caption loading lag in octopus-renderer ([c11416a](https://github.com/nopol10/nekocap/commit/c11416a748c5def895d4fc1356526c664d918516))
* fix previous caption being selected after adjusting caption time ([231364a](https://github.com/nopol10/nekocap/commit/231364a657222b08a4f2ecde8a9e01f3575491c8))
* fix renderer not being set to the default one when a new caption is created ([b998849](https://github.com/nopol10/nekocap/commit/b998849107c1ede9b0b47e7f30b8931ace1b2036))
* fix show/hide caption functionality being inconsistent for the default renderer ([72961ed](https://github.com/nopol10/nekocap/commit/72961edf0c01e7ff7f3aa723d8f010d2b4da4c43))
* remove trailing comma in manifest.json ([392fc42](https://github.com/nopol10/nekocap/commit/392fc4204af704fef28f16050de443a7369dbc5f))
