# Changelog

## 1.0.0 (2025-01-20)


### Features

* **a11y:** add aria labels and improve semantic markup ([1a331e9](https://github.com/Rkaede/laneway/commit/1a331e9844c03862a37d253ac7bfcccb2b2549f1))
* add copy button to assistant messages ([a26cb23](https://github.com/Rkaede/laneway/commit/a26cb23f189074f84a44f4feb84fee9f669e3b8f))
* add gemini 2.0 flash experimental model ([84f0aaa](https://github.com/Rkaede/laneway/commit/84f0aaa84c59198c59c63abece1fc9fe99ebe65d))
* add more models ([90afcc1](https://github.com/Rkaede/laneway/commit/90afcc1525f725458c2debc9578f0ca514b3e72b))
* add openai o1 model ([91075a0](https://github.com/Rkaede/laneway/commit/91075a0bc28f9cb220fb8bd347837032031d0e1d))
* add tts playback to messages ([621e733](https://github.com/Rkaede/laneway/commit/621e7335a9224ce10d16d1affb6352481d24a6f3))
* add vision support ([4630548](https://github.com/Rkaede/laneway/commit/4630548f92cf694de7528ff4927abc7aa171a422))
* added "note" sessions ([9cd44fe](https://github.com/Rkaede/laneway/commit/9cd44fe22f6c1a259b84707bbe82e175ba036f4e))
* added ability to cancel requests ([1bcd842](https://github.com/Rkaede/laneway/commit/1bcd842da4c752067de4fe272ea73127ccd4e961))
* added autocomplete to the chat input ([ab35aab](https://github.com/Rkaede/laneway/commit/ab35aab9d6ee4ea5bc26cfaa588d2249a21f739e))
* added example sessions when onboarding ([a52b610](https://github.com/Rkaede/laneway/commit/a52b6101dafc4a9d9d5d54af00b57c51e32a40a5))
* added headers for openrouter listing ([d5d0f71](https://github.com/Rkaede/laneway/commit/d5d0f712b1f489491c91db55360b3387a96308a2))
* added models page ([f767e9b](https://github.com/Rkaede/laneway/commit/f767e9bd203ebdeed7711d152762d28b87c97d2d))
* added new openai o1 models ([a3a62ff](https://github.com/Rkaede/laneway/commit/a3a62ff354573ae06ec9c5948747b4e0b8728b3e))
* added phi-4 to the model list ([fbf65a1](https://github.com/Rkaede/laneway/commit/fbf65a143cbda3cfba94b9af7aaf31747dc1bf54))
* Added speed dial ([844d809](https://github.com/Rkaede/laneway/commit/844d8098d78d539609a4348e1987e85bc61e8af6))
* added stats to assistant message responses & cleaned up stories ([e7343d0](https://github.com/Rkaede/laneway/commit/e7343d01e551efa68e5b0b576bec094531c792a8))
* enable background processing of server responses ([88865b4](https://github.com/Rkaede/laneway/commit/88865b4ce39945fa40bf2236a4c011e1c70d4d23))
* go directly to models via url query params ([8556a33](https://github.com/Rkaede/laneway/commit/8556a33d9c138e825d693067e7a2ef3e364a8c63))
* in code blocks, moved the copy button from the dropdown to the main toolbar ([d2a1b49](https://github.com/Rkaede/laneway/commit/d2a1b498b517c8983d45beeb95f6e6f164cca5b6))
* more welcome screen adjustments ([64ecd35](https://github.com/Rkaede/laneway/commit/64ecd355563237bd9b8a007540dafb02dea0f389))
* persist models to localstorage ([5145ad6](https://github.com/Rkaede/laneway/commit/5145ad6bab3ad1510b05d3c58069c22c11918a34))
* responses will now be streamed onto the screen more smoothly ([74ff708](https://github.com/Rkaede/laneway/commit/74ff7085ab595c5fad0c5e35893a450aea1323ed))
* **seo:** improve seo and accessibility ([523b761](https://github.com/Rkaede/laneway/commit/523b76121dc336eba757e6530ebac4df66c91a2c))
* sidebar items now navigate on the mouse down event ([6c090e0](https://github.com/Rkaede/laneway/commit/6c090e092d2976c32aded99f57a274c7f23d84d5))
* update speeddial defaults ([97a76a0](https://github.com/Rkaede/laneway/commit/97a76a0821ed27e7ddf9f04b1c5a11ec83271fc4))
* update welcome screen and default model ([ad186cd](https://github.com/Rkaede/laneway/commit/ad186cdcbb07d76e9c8ef364cca6ac069ec5543f))
* updated onboarding screen ([a2f082e](https://github.com/Rkaede/laneway/commit/a2f082ea0a778c7393416c8e1b9987f2e4ec2554))


### Bug Fixes

* codeblocks render gt and lt symbols that had been sanitised ([bb6c1ca](https://github.com/Rkaede/laneway/commit/bb6c1ca8f2bf1c200bc14577a88bc90e3f99f1bd))
* fixed performance regression ([07bc47a](https://github.com/Rkaede/laneway/commit/07bc47a18cc7ed014c3853fe6bdfb4db086115aa))
* fixed type error ([8504c4f](https://github.com/Rkaede/laneway/commit/8504c4f51c55bbf2dfbdfce67bffda5c413d8acd))
* handle undefined value in openrouter usage select ([fe84b85](https://github.com/Rkaede/laneway/commit/fe84b8554e0db5e36be331608596f3de1e40419f))
* input will now persist properly when creating notes ([fbc9c09](https://github.com/Rkaede/laneway/commit/fbc9c0936d40c6204f4a17772cd4301d6232e38b))
* openrouter preference input now shows the options when clicked ([e0bb025](https://github.com/Rkaede/laneway/commit/e0bb025366c36063007434986eae96379438fedb))
* resolve errors when running build and dev ([2f9d4a6](https://github.com/Rkaede/laneway/commit/2f9d4a625d770b3136aa25b961b20005282fe346))
* resolve session title auto-generation ([a4dc01a](https://github.com/Rkaede/laneway/commit/a4dc01a58596d12e8b419d917d82cf0a5d46ae97))
* resolved issue where assistants and models could not be deleted from presets ([5a85f96](https://github.com/Rkaede/laneway/commit/5a85f96428b703a099fc5afea744f18db566b08d))
* resolved issue where messages could not be sent when no image was attached ([41ba2d2](https://github.com/Rkaede/laneway/commit/41ba2d2dd233d0c257a9b96bc7147607a9344c2d))
* resolved issue where stale api keys would be used ([ee23c2f](https://github.com/Rkaede/laneway/commit/ee23c2fc9a9e7c27a816f0983a1b49c88767e182))
* resolved issue where the "delete keys" button would not work on the settings page ([637c408](https://github.com/Rkaede/laneway/commit/637c408281cd808e497180706e0ba96678056e93))
* resolved issue where user input would not clear after sending a message ([e12a0df](https://github.com/Rkaede/laneway/commit/e12a0df0a4c580865781577215cf32f3c9eecfa9))
* resolved regression where chats created from presets would not send messages to the server ([9e2ef8a](https://github.com/Rkaede/laneway/commit/9e2ef8ad0221bd38f1ecd896c6b40d397fde9217))
* resolved search not working for all items in the command menu ([24ad3c4](https://github.com/Rkaede/laneway/commit/24ad3c40328751bdfd92a02381ef9f097fcfc675))
* resolved xml tags in messages not rendering correctly ([d3a0dcb](https://github.com/Rkaede/laneway/commit/d3a0dcb9705b273779f9efec479d438c947a30ef))
* the new chat shortcut will no longer be invoked when typing in the main chat input ([5e67403](https://github.com/Rkaede/laneway/commit/5e67403f83c8d566aabcfe659f470a287f8ca066))
* updated code blocks to render unknown languages ([0a2c41c](https://github.com/Rkaede/laneway/commit/0a2c41c9bc98917ae80e1355cb709d2778fecd17))


### Performance Improvements

* implement lazy loading for heavy components ([a1bce23](https://github.com/Rkaede/laneway/commit/a1bce2376fefc506c81477ad02e68c31c6604161))
* lazy load routes ([65e856c](https://github.com/Rkaede/laneway/commit/65e856c9b5d36a6c39b906e0b31b604b5f9011cb))


### Reverts

* removed availability of completions and put it under a feature flag ([364241f](https://github.com/Rkaede/laneway/commit/364241f7c2e5c0050f27a4a6b51c7f80dcc39c52))
