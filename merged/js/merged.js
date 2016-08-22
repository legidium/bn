/**
 * Modules
 *
 * Copyright (c) 2013 Filatov Dmitry (dfilatov@yandex-team.ru)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * @version 0.1.2
 */

(function(global) {

var undef,

    DECL_STATES = {
        NOT_RESOLVED : 'NOT_RESOLVED',
        IN_RESOLVING : 'IN_RESOLVING',
        RESOLVED     : 'RESOLVED'
    },

    /**
     * Creates a new instance of modular system
     * @returns {Object}
     */
    create = function() {
        var curOptions = {
                trackCircularDependencies : true,
                allowMultipleDeclarations : true
            },

            modulesStorage = {},
            waitForNextTick = false,
            pendingRequires = [],

            /**
             * Defines module
             * @param {String} name
             * @param {String[]} [deps]
             * @param {Function} declFn
             */
            define = function(name, deps, declFn) {
                if(!declFn) {
                    declFn = deps;
                    deps = [];
                }

                var module = modulesStorage[name];
                if(!module) {
                    module = modulesStorage[name] = {
                        name : name,
                        decl : undef
                    };
                }

                module.decl = {
                    name       : name,
                    prev       : module.decl,
                    fn         : declFn,
                    state      : DECL_STATES.NOT_RESOLVED,
                    deps       : deps,
                    dependents : [],
                    exports    : undef
                };
            },

            /**
             * Requires modules
             * @param {String|String[]} modules
             * @param {Function} cb
             * @param {Function} [errorCb]
             */
            require = function(modules, cb, errorCb) {
                if(typeof modules === 'string') {
                    modules = [modules];
                }

                if(!waitForNextTick) {
                    waitForNextTick = true;
                    nextTick(onNextTick);
                }

                pendingRequires.push({
                    deps : modules,
                    cb   : function(exports, error) {
                        error?
                            (errorCb || onError)(error) :
                            cb.apply(global, exports);
                    }
                });
            },

            /**
             * Returns state of module
             * @param {String} name
             * @returns {String} state, possible values are NOT_DEFINED, NOT_RESOLVED, IN_RESOLVING, RESOLVED
             */
            getState = function(name) {
                var module = modulesStorage[name];
                return module?
                    DECL_STATES[module.decl.state] :
                    'NOT_DEFINED';
            },

            /**
             * Returns whether the module is defined
             * @param {String} name
             * @returns {Boolean}
             */
            isDefined = function(name) {
                return !!modulesStorage[name];
            },

            /**
             * Sets options
             * @param {Object} options
             */
            setOptions = function(options) {
                for(var name in options) {
                    if(options.hasOwnProperty(name)) {
                        curOptions[name] = options[name];
                    }
                }
            },

            getStat = function() {
                var res = {},
                    module;

                for(var name in modulesStorage) {
                    if(modulesStorage.hasOwnProperty(name)) {
                        module = modulesStorage[name];
                        (res[module.decl.state] || (res[module.decl.state] = [])).push(name);
                    }
                }

                return res;
            },

            onNextTick = function() {
                waitForNextTick = false;
                applyRequires();
            },

            applyRequires = function() {
                var requiresToProcess = pendingRequires,
                    i = 0, require;

                pendingRequires = [];

                while(require = requiresToProcess[i++]) {
                    requireDeps(null, require.deps, [], require.cb);
                }
            },

            requireDeps = function(fromDecl, deps, path, cb) {
                var unresolvedDepsCnt = deps.length;
                if(!unresolvedDepsCnt) {
                    cb([]);
                }

                var decls = [],
                    onDeclResolved = function(_, error) {
                        if(error) {
                            cb(null, error);
                            return;
                        }

                        if(!--unresolvedDepsCnt) {
                            var exports = [],
                                i = 0, decl;
                            while(decl = decls[i++]) {
                                exports.push(decl.exports);
                            }
                            cb(exports);
                        }
                    },
                    i = 0, len = unresolvedDepsCnt,
                    dep, decl;

                while(i < len) {
                    dep = deps[i++];
                    if(typeof dep === 'string') {
                        if(!modulesStorage[dep]) {
                            cb(null, buildModuleNotFoundError(dep, fromDecl));
                            return;
                        }

                        decl = modulesStorage[dep].decl;
                    }
                    else {
                        decl = dep;
                    }

                    decls.push(decl);

                    startDeclResolving(decl, path, onDeclResolved);
                }
            },

            startDeclResolving = function(decl, path, cb) {
                if(decl.state === DECL_STATES.RESOLVED) {
                    cb(decl.exports);
                    return;
                }
                else if(decl.state === DECL_STATES.IN_RESOLVING) {
                    curOptions.trackCircularDependencies && isDependenceCircular(decl, path)?
                        cb(null, buildCircularDependenceError(decl, path)) :
                        decl.dependents.push(cb);
                    return;
                }

                decl.dependents.push(cb);

                if(decl.prev && !curOptions.allowMultipleDeclarations) {
                    provideError(decl, buildMultipleDeclarationError(decl));
                    return;
                }

                curOptions.trackCircularDependencies && (path = path.slice()).push(decl);

                var isProvided = false,
                    deps = decl.prev? decl.deps.concat([decl.prev]) : decl.deps;

                decl.state = DECL_STATES.IN_RESOLVING;
                requireDeps(
                    decl,
                    deps,
                    path,
                    function(depDeclsExports, error) {
                        if(error) {
                            provideError(decl, error);
                            return;
                        }

                        depDeclsExports.unshift(function(exports, error) {
                            if(isProvided) {
                                cb(null, buildDeclAreadyProvidedError(decl));
                                return;
                            }

                            isProvided = true;
                            error?
                                provideError(decl, error) :
                                provideDecl(decl, exports);
                        });

                        decl.fn.apply(
                            {
                                name   : decl.name,
                                deps   : decl.deps,
                                global : global
                            },
                            depDeclsExports);
                    });
            },

            provideDecl = function(decl, exports) {
                decl.exports = exports;
                decl.state = DECL_STATES.RESOLVED;

                var i = 0, dependent;
                while(dependent = decl.dependents[i++]) {
                    dependent(exports);
                }

                decl.dependents = undef;
            },

            provideError = function(decl, error) {
                decl.state = DECL_STATES.NOT_RESOLVED;

                var i = 0, dependent;
                while(dependent = decl.dependents[i++]) {
                    dependent(null, error);
                }

                decl.dependents = [];
            };

        return {
            create     : create,
            define     : define,
            require    : require,
            getState   : getState,
            isDefined  : isDefined,
            setOptions : setOptions,
            getStat    : getStat
        };
    },

    onError = function(e) {
        nextTick(function() {
            throw e;
        });
    },

    buildModuleNotFoundError = function(name, decl) {
        return Error(decl?
            'Module "' + decl.name + '": can\'t resolve dependence "' + name + '"' :
            'Required module "' + name + '" can\'t be resolved');
    },

    buildCircularDependenceError = function(decl, path) {
        var strPath = [],
            i = 0, pathDecl;
        while(pathDecl = path[i++]) {
            strPath.push(pathDecl.name);
        }
        strPath.push(decl.name);

        return Error('Circular dependence has been detected: "' + strPath.join(' -> ') + '"');
    },

    buildDeclAreadyProvidedError = function(decl) {
        return Error('Declaration of module "' + decl.name + '" has already been provided');
    },

    buildMultipleDeclarationError = function(decl) {
        return Error('Multiple declarations of module "' + decl.name + '" have been detected');
    },

    isDependenceCircular = function(decl, path) {
        var i = 0, pathDecl;
        while(pathDecl = path[i++]) {
            if(decl === pathDecl) {
                return true;
            }
        }
        return false;
    },

    nextTick = (function() {
        var fns = [],
            enqueueFn = function(fn) {
                return fns.push(fn) === 1;
            },
            callFns = function() {
                var fnsToCall = fns, i = 0, len = fns.length;
                fns = [];
                while(i < len) {
                    fnsToCall[i++]();
                }
            };

        if(typeof process === 'object' && process.nextTick) { // nodejs
            return function(fn) {
                enqueueFn(fn) && process.nextTick(callFns);
            };
        }

        if(global.setImmediate) { // ie10
            return function(fn) {
                enqueueFn(fn) && global.setImmediate(callFns);
            };
        }

        if(global.postMessage && !global.opera) { // modern browsers
            var isPostMessageAsync = true;
            if(global.attachEvent) {
                var checkAsync = function() {
                        isPostMessageAsync = false;
                    };
                global.attachEvent('onmessage', checkAsync);
                global.postMessage('__checkAsync', '*');
                global.detachEvent('onmessage', checkAsync);
            }

            if(isPostMessageAsync) {
                var msg = '__modules' + (+new Date()),
                    onMessage = function(e) {
                        if(e.data === msg) {
                            e.stopPropagation && e.stopPropagation();
                            callFns();
                        }
                    };

                global.addEventListener?
                    global.addEventListener('message', onMessage, true) :
                    global.attachEvent('onmessage', onMessage);

                return function(fn) {
                    enqueueFn(fn) && global.postMessage(msg, '*');
                };
            }
        }

        var doc = global.document;
        if('onreadystatechange' in doc.createElement('script')) { // ie6-ie8
            var head = doc.getElementsByTagName('head')[0],
                createScript = function() {
                    var script = doc.createElement('script');
                    script.onreadystatechange = function() {
                        script.parentNode.removeChild(script);
                        script = script.onreadystatechange = null;
                        callFns();
                    };
                    head.appendChild(script);
                };

            return function(fn) {
                enqueueFn(fn) && createScript();
            };
        }

        return function(fn) { // old browsers
            enqueueFn(fn) && setTimeout(callFns, 0);
        };
    })();

if(typeof exports === 'object') {
    module.exports = create();
}
else {
    global.modules = create();
}

})(typeof window !== 'undefined' ? window : global);
if(typeof module !== 'undefined') {modules = module.exports;}
(function(g) {
  var __bem_xjst = function(exports) {
     var $$mode = "", $$block = "", $$elem = "", $$elemMods = null, $$mods = null;

var __$ref = {};

function apply(ctx) {
    ctx = ctx || this;
    $$mods = ctx["mods"];
    $$elemMods = ctx["elemMods"];
    $$elem = ctx["elem"];
    $$block = ctx["block"];
    $$mode = ctx["_mode"];
    try {
        return applyc(ctx, __$ref);
    } catch (e) {
        e.xjstContext = ctx;
        throw e;
    }
}

exports.apply = apply;

function applyc(__$ctx, __$ref) {
    var __$t = $$mode;
    if (__$t === "content") {
        var __$mr = __$m1[$$block];
        if (__$mr) {
            __$mr = __$mr(__$wrapThis(__$ctx), __$ref);
            if (__$mr !== __$ref) return __$mr;
        }
        return __$ctx.ctx.content;
    } else if (__$t === "js") {
        var __$mr = __$m2[$$block];
        if (__$mr) {
            __$mr = __$mr(__$wrapThis(__$ctx), __$ref);
            if (__$mr !== __$ref) return __$mr;
        }
        return undefined;
    } else if (__$t === "attrs") {
        var __$r = __$g0(__$ctx, __$ref);
        if (__$r !== __$ref) return __$r;
    } else if (__$t === "tag") {
        var __$r = __$g1(__$ctx, __$ref);
        if (__$r !== __$ref) return __$r;
    } else if (__$t === "mix") {
        var __$t = $$block;
        if (__$t === "link") {
            if (!$$elem) {
                return [ {
                    elem: "control"
                } ];
            }
        } else if (__$t === "button") {
            if (!$$elem) {
                return {
                    elem: "control"
                };
            }
        } else if (__$t === "search_map_popup") {
            if (!$$elem) {
                return [ {
                    block: "popup",
                    mods: {
                        theme: "islands",
                        target: "position",
                        autoclosable: true
                    }
                } ];
            }
        } else if (__$t === "textarea") {
            if (!$$elem) {
                return {
                    elem: "control"
                };
            }
        } else if (__$t === "menu") {
            if (!$$elem) {
                return [ {
                    elem: "control"
                } ];
            }
        }
        return undefined;
    } else if (__$t === "default") {
        var __$t = $$block;
        if (__$t === "link") {
            if (!$$elem && (__$ctx.__$a0 & 8) === 0) {
                var __$r = __$b51(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        } else if (__$t === "input") {
            if (!$$elem && (__$ctx.__$a0 & 524288) === 0) {
                var __$r = __$b52(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        } else if (__$t === "menu") {
            if (!$$elem && (__$ctx.__$a0 & 268435456) === 0) {
                var __$r = __$b53(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        } else if (__$t === "menu-item") {
            if (!$$elem && __$ctx._menuMods && (__$ctx.__$a0 & 134217728) === 0) {
                var __$r = __$b54(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        }
        var __$r = __$b55(__$ctx, __$ref);
        if (__$r !== __$ref) return __$r;
    } else if (__$t === "bem") {
        if ($$block === "ua" && !$$elem) {
            return false;
        }
        return undefined;
    } else if (__$t === "cls") {
        return undefined;
    } else if (__$t === "") {
        if (__$ctx.ctx && __$ctx.ctx._vow && (__$ctx.__$a1 & 2) === 0) {
            var __$r = __$b59(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        if (__$ctx.isSimple(__$ctx.ctx)) {
            var __$r = __$b60(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        if (!__$ctx.ctx) {
            var __$r = __$b61(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        if (__$ctx.isArray(__$ctx.ctx)) {
            var __$r = __$b62(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        var __$r = __$b63(__$ctx, __$ref);
        if (__$r !== __$ref) return __$r;
    }
}

[ function(exports, context) {
    var undef, BEM_ = {}, toString = Object.prototype.toString, slice = Array.prototype.slice, isArray = Array.isArray || function(obj) {
        return toString.call(obj) === "[object Array]";
    }, SHORT_TAGS = {
        area: 1,
        base: 1,
        br: 1,
        col: 1,
        command: 1,
        embed: 1,
        hr: 1,
        img: 1,
        input: 1,
        keygen: 1,
        link: 1,
        meta: 1,
        param: 1,
        source: 1,
        wbr: 1
    };
    (function(BEM, undefined) {
        var MOD_DELIM = "_", ELEM_DELIM = "__", NAME_PATTERN = "[a-zA-Z0-9-]+";
        function buildModPostfix(modName, modVal) {
            var res = MOD_DELIM + modName;
            if (modVal !== true) res += MOD_DELIM + modVal;
            return res;
        }
        function buildBlockClass(name, modName, modVal) {
            var res = name;
            if (modVal) res += buildModPostfix(modName, modVal);
            return res;
        }
        function buildElemClass(block, name, modName, modVal) {
            var res = buildBlockClass(block) + ELEM_DELIM + name;
            if (modVal) res += buildModPostfix(modName, modVal);
            return res;
        }
        BEM.INTERNAL = {
            NAME_PATTERN: NAME_PATTERN,
            MOD_DELIM: MOD_DELIM,
            ELEM_DELIM: ELEM_DELIM,
            buildModPostfix: buildModPostfix,
            buildClass: function(block, elem, modName, modVal) {
                var typeOfModName = typeof modName;
                if (typeOfModName === "string" || typeOfModName === "boolean") {
                    var typeOfModVal = typeof modVal;
                    if (typeOfModVal !== "string" && typeOfModVal !== "boolean") {
                        modVal = modName;
                        modName = elem;
                        elem = undef;
                    }
                } else if (typeOfModName !== "undefined") {
                    modName = undef;
                } else if (elem && typeof elem !== "string") {
                    elem = undef;
                }
                if (!(elem || modName)) {
                    return block;
                }
                return elem ? buildElemClass(block, elem, modName, modVal) : buildBlockClass(block, modName, modVal);
            },
            buildModsClasses: function(block, elem, mods) {
                var res = "";
                if (mods) {
                    var modName;
                    for (modName in mods) {
                        if (!mods.hasOwnProperty(modName)) continue;
                        var modVal = mods[modName];
                        if (!modVal && modVal !== 0) continue;
                        typeof modVal !== "boolean" && (modVal += "");
                        res += " " + (elem ? buildElemClass(block, elem, modName, modVal) : buildBlockClass(block, modName, modVal));
                    }
                }
                return res;
            },
            buildClasses: function(block, elem, mods) {
                var res = "";
                res += elem ? buildElemClass(block, elem) : buildBlockClass(block);
                res += this.buildModsClasses(block, elem, mods);
                return res;
            }
        };
    })(BEM_);
    var ts = {
        '"': "&quot;",
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;"
    }, f = function(t) {
        return ts[t] || t;
    };
    var buildEscape = function(r) {
        r = new RegExp(r, "g");
        return function(s) {
            return ("" + s).replace(r, f);
        };
    };
    context.BEMContext = BEMContext;
    function BEMContext(context, apply_) {
        this.ctx = typeof context === "undefined" ? "" : context;
        this.apply = apply_;
        this._str = "";
        var _this = this;
        this._buf = {
            push: function() {
                var chunks = slice.call(arguments).join("");
                _this._str += chunks;
            },
            join: function() {
                return this._str;
            }
        };
        this._ = this;
        this._start = true;
        this._mode = "";
        this._listLength = 0;
        this._notNewList = false;
        this.position = 0;
        this.block = undef;
        this.elem = undef;
        this.mods = undef;
        this.elemMods = undef;
    }
    BEMContext.prototype.isArray = isArray;
    BEMContext.prototype.isSimple = function isSimple(obj) {
        if (!obj || obj === true) return true;
        var t = typeof obj;
        return t === "string" || t === "number";
    };
    BEMContext.prototype.isShortTag = function isShortTag(t) {
        return SHORT_TAGS.hasOwnProperty(t);
    };
    BEMContext.prototype.extend = function extend(o1, o2) {
        if (!o1 || !o2) return o1 || o2;
        var res = {}, n;
        for (n in o1) o1.hasOwnProperty(n) && (res[n] = o1[n]);
        for (n in o2) o2.hasOwnProperty(n) && (res[n] = o2[n]);
        return res;
    };
    var cnt = 0, id = +new Date(), expando = "__" + id, get = function() {
        return "uniq" + id + ++cnt;
    };
    BEMContext.prototype.identify = function(obj, onlyGet) {
        if (!obj) return get();
        if (onlyGet || obj[expando]) {
            return obj[expando];
        } else {
            return obj[expando] = get();
        }
    };
    BEMContext.prototype.xmlEscape = buildEscape("[&<>]");
    BEMContext.prototype.attrEscape = buildEscape('["&<>]');
    BEMContext.prototype.BEM = BEM_;
    BEMContext.prototype.isFirst = function isFirst() {
        return this.position === 1;
    };
    BEMContext.prototype.isLast = function isLast() {
        return this.position === this._listLength;
    };
    BEMContext.prototype.generateId = function generateId() {
        return this.identify(this.ctx);
    };
    var oldApply = exports.apply;
    exports.apply = BEMContext.apply = function BEMContext_apply(context) {
        var ctx = new BEMContext(context || this, oldApply);
        ctx.apply();
        return ctx._str;
    };
    BEMContext.prototype.reapply = BEMContext.apply;
} ].forEach(function(fn) {
    fn(exports, this);
}, {
    recordExtensions: function(ctx) {
        ctx["__$a0"] = 0;
        ctx["_input"] = undefined;
        ctx["_firstItem"] = undefined;
        ctx["_checkedItems"] = undefined;
        ctx["_menuMods"] = undefined;
        ctx["__$a1"] = 0;
        ctx["_str"] = undefined;
        ctx["_mode"] = undefined;
        ctx["block"] = undefined;
        ctx["elem"] = undefined;
        ctx["_notNewList"] = undefined;
        ctx["position"] = undefined;
        ctx["_listLength"] = undefined;
        ctx["ctx"] = undefined;
        ctx["_currBlock"] = undefined;
        ctx["mods"] = undefined;
        ctx["elemMods"] = undefined;
    },
    resetApplyNext: function(ctx) {
        ctx["__$a0"] = 0;
        ctx["__$a1"] = 0;
    }
});

var __$m1 = {
    dropdown: function(__$ctx, __$ref) {
        var __$t = $$elem;
        if (__$t === "switcher") {
            var __$t = $$mods;
            if (__$t) {
                var __$t = $$mods["switcher"];
                if (__$t === "link") {
                    var __$r = __$b64(__$ctx, __$ref);
                    if (__$r !== __$ref) return __$r;
                } else if (__$t === "button") {
                    var __$r = __$b65(__$ctx, __$ref);
                    if (__$r !== __$ref) return __$r;
                }
            }
        }
        if (!$$elem) {
            var __$r = __$b66(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    button: function(__$ctx, __$ref) {
        var __$t = !$$elem;
        if (__$t) {
            if (typeof __$ctx.ctx.content !== "undefined") {
                return __$ctx.ctx.content;
            }
            var __$r = __$b68(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    "new-buildings-list-item": function(__$ctx, __$ref) {
        var __$t = $$elem;
        if (__$t === "image-wrapper") {
            if ((__$ctx.__$a0 & 16) === 0) {
                return {
                    tag: "a",
                    attrs: {
                        href: function __$lb__$22() {
                            var __$r__$23;
                            var __$l0__$24 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 16;
                            __$r__$23 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l0__$24;
                            return __$r__$23;
                        }().link || ""
                    },
                    content: {
                        tag: "img",
                        elem: "image",
                        attrs: {
                            src: function __$lb__$22() {
                                var __$r__$25;
                                var __$l1__$26 = __$ctx.__$a0;
                                __$ctx.__$a0 = __$ctx.__$a0 | 16;
                                __$r__$25 = applyc(__$ctx, __$ref);
                                __$ctx.__$a0 = __$l1__$26;
                                return __$r__$25;
                            }().image,
                            alt: ""
                        }
                    }
                };
            }
        } else if (__$t === "developer-logo") {
            if ((__$ctx.__$a0 & 32) === 0) {
                var __$r = __$b70(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        } else if (__$t === "name") {
            if ((__$ctx.__$a0 & 64) === 0) {
                var __$r = __$b71(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        }
        if (!$$elem && (__$ctx.__$a0 & 128) === 0) {
            var __$r = __$b72(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    embed: function(__$ctx, __$ref) {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["small"] === true) {
                return {
                    tag: "a",
                    elem: "link",
                    attrs: {
                        href: __$ctx.ctx.content.link
                    },
                    content: [ {
                        block: "icon",
                        mix: {
                            block: $$block,
                            elem: "image"
                        },
                        url: "/desktop.blocks/embed/camera.png"
                    }, {
                        tag: "span",
                        elem: "text",
                        content: __$ctx.ctx.content.text
                    } ]
                };
            }
            if ((__$ctx.__$a0 & 256) === 0) {
                var __$r = __$b74(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        }
        return __$ref;
    },
    search_results_item: function(__$ctx, __$ref) {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["embed"] === true) {
                var __$r = __$b75(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
            if ((__$ctx.__$a0 & 512) === 0) {
                var __$r = __$b76(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        }
        return __$ref;
    },
    address_list_item: function(__$ctx, __$ref) {
        if (!$$elem) {
            return [ {
                elem: "text",
                tag: "span",
                content: __$ctx.ctx.text
            }, {
                elem: "del",
                tag: "span",
                content: {
                    block: "icon",
                    mods: {
                        action: "remove"
                    }
                }
            } ];
        }
        return __$ref;
    },
    pagination: function(__$ctx, __$ref) {
        if (!$$elem) {
            return [ {
                elem: "line",
                mix: {
                    block: "clearfix"
                },
                content: [ {
                    elem: "col",
                    content: {
                        block: "text",
                        mods: {
                            font: "m",
                            height: "l"
                        },
                        content: "Страницы"
                    }
                }, {
                    elem: "col",
                    content: [ {
                        block: "control-group",
                        mix: {
                            block: "pagination",
                            elem: "pages"
                        },
                        content: [ {
                            js: {
                                page: 1
                            },
                            block: "button",
                            mods: {
                                theme: "islands",
                                size: "l",
                                type: "link"
                            },
                            attrs: {
                                href: "/"
                            },
                            text: "Первая"
                        }, {
                            js: {
                                page: 2
                            },
                            block: "button",
                            mods: {
                                theme: "islands",
                                size: "l",
                                type: "link"
                            },
                            attrs: {
                                href: "/"
                            },
                            text: "2"
                        }, {
                            js: {
                                page: 3
                            },
                            block: "button",
                            mods: {
                                theme: "islands",
                                size: "l",
                                type: "link"
                            },
                            attrs: {
                                href: "/"
                            },
                            text: "3"
                        }, {
                            js: {
                                page: 4
                            },
                            block: "button",
                            mods: {
                                theme: "islands",
                                size: "l",
                                type: "link",
                                checked: true
                            },
                            attrs: {
                                href: "/"
                            },
                            text: "4"
                        }, {
                            js: {
                                page: 5
                            },
                            block: "button",
                            mods: {
                                theme: "islands",
                                size: "l",
                                type: "link"
                            },
                            attrs: {
                                href: "/"
                            },
                            text: "5"
                        }, {
                            js: {
                                page: 6
                            },
                            block: "button",
                            mods: {
                                theme: "islands",
                                size: "l",
                                type: "link"
                            },
                            attrs: {
                                href: "/"
                            },
                            text: "6"
                        }, {
                            js: {
                                page: 7
                            },
                            block: "button",
                            mods: {
                                theme: "islands",
                                size: "l",
                                type: "link"
                            },
                            attrs: {
                                href: "/"
                            },
                            text: "Следующая"
                        } ]
                    }, {
                        block: "text",
                        mix: {
                            block: "pagination",
                            elem: "status"
                        },
                        mods: {
                            font: "s",
                            height: "l"
                        },
                        content: "Показано 50 из 1231"
                    } ]
                } ]
            } ];
        }
        return __$ref;
    },
    search_map_results: function(__$ctx, __$ref) {
        var __$t = $$elem;
        if (__$t === "pagination_wrapper") {
            return {
                block: "pagination"
            };
        } else if (__$t === "item_comment") {
            if ((__$ctx.__$a0 & 1024) === 0) {
                return function __$lb__$220() {
                    var __$r__$221;
                    var __$l0__$222 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 1024;
                    __$r__$221 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$222;
                    return __$r__$221;
                }().comment;
            }
        } else if (__$t === "item_details") {
            if ((__$ctx.__$a0 & 2048) === 0) {
                var __$r = __$b81(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        } else if (__$t === "item_title") {
            if ((__$ctx.__$a0 & 4096) === 0) {
                return [ {
                    elem: "text",
                    elemMods: {
                        object: true
                    },
                    content: function __$lb__$233() {
                        var __$r__$234;
                        var __$l0__$235 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 4096;
                        __$r__$234 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l0__$235;
                        return __$r__$234;
                    }().object_text + " (" + function __$lb__$233() {
                        var __$r__$236;
                        var __$l1__$237 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 4096;
                        __$r__$236 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l1__$237;
                        return __$r__$236;
                    }().s_text + ")"
                }, {
                    elem: "text",
                    elemMods: {
                        price: true
                    },
                    content: " &mdash; " + function __$lb__$233() {
                        var __$r__$238;
                        var __$l2__$239 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 4096;
                        __$r__$238 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l2__$239;
                        return __$r__$238;
                    }().price_text
                }, {
                    elem: "text",
                    elemMods: {
                        seller: true
                    },
                    content: " " + [ function __$lb__$233() {
                        var __$r__$240;
                        var __$l3__$241 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 4096;
                        __$r__$240 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l3__$241;
                        return __$r__$240;
                    }().seller_text, function __$lb__$233() {
                        var __$r__$242;
                        var __$l4__$243 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 4096;
                        __$r__$242 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l4__$243;
                        return __$r__$242;
                    }().seller_help ].join(", ")
                } ];
            }
        } else if (__$t === "table_row_inner") {
            if ((__$ctx.__$a0 & 8192) === 0) {
                return [ {
                    elem: "table_cell",
                    mods: {
                        image: true
                    },
                    content: function __$lb__$244() {
                        var __$r__$245;
                        var __$l0__$246 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 8192;
                        __$r__$245 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l0__$246;
                        return __$r__$245;
                    }().image || {
                        elem: "image_holder"
                    }
                }, {
                    elem: "table_cell",
                    content: [ {
                        elem: "item_title",
                        content: function __$lb__$244() {
                            var __$r__$247;
                            var __$l1__$248 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 8192;
                            __$r__$247 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l1__$248;
                            return __$r__$247;
                        }()
                    }, {
                        elem: "item_details",
                        content: function __$lb__$244() {
                            var __$r__$249;
                            var __$l2__$250 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 8192;
                            __$r__$249 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l2__$250;
                            return __$r__$249;
                        }()
                    }, {
                        elem: "item_comment",
                        content: function __$lb__$244() {
                            var __$r__$251;
                            var __$l3__$252 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 8192;
                            __$r__$251 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l3__$252;
                            return __$r__$251;
                        }()
                    } ]
                } ];
            }
        } else if (__$t === "table_row") {
            if ((__$ctx.__$a0 & 16384) === 0) {
                return [ {
                    elem: "table_row_inner",
                    content: function __$lb__$253() {
                        var __$r__$254;
                        var __$l0__$255 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 16384;
                        __$r__$254 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l0__$255;
                        return __$r__$254;
                    }()
                } ];
            }
        }
        if (!$$elem) {
            var __$r = __$b85(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    search_map_popup: function(__$ctx, __$ref) {
        if ($$elem === "body") {
            return [ {
                block: "search_map_results",
                items: __$ctx.ctx.items || []
            } ];
        }
        if (!$$elem) {
            return [ {
                elem: "header",
                content: [ {
                    elem: "close"
                }, {
                    elem: "title",
                    content: "Шпаленрная 51"
                }, {
                    elem: "title_help",
                    content: "Бизнесцентр Таврический"
                } ]
            }, {
                elem: "divider"
            }, {
                elem: "body",
                items: __$ctx.ctx.items || []
            } ];
        }
        return __$ref;
    },
    "account-my-subs-list-item": function(__$ctx, __$ref) {
        if (!$$elem && (__$ctx.__$a0 & 32768) === 0) {
            return [ {
                attrs: function __$lb__$257() {
                    var __$r__$258;
                    var __$l0__$259 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 32768;
                    __$r__$258 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$259;
                    return __$r__$258;
                }().attrs,
                elem: "row",
                content: {
                    elem: "row-inner",
                    content: [ {
                        elem: "cell",
                        mods: {
                            title: true
                        },
                        content: [ {
                            elem: "title",
                            content: function __$lb__$257() {
                                var __$r__$260;
                                var __$l1__$261 = __$ctx.__$a0;
                                __$ctx.__$a0 = __$ctx.__$a0 | 32768;
                                __$r__$260 = applyc(__$ctx, __$ref);
                                __$ctx.__$a0 = __$l1__$261;
                                return __$r__$260;
                            }().title || "&nbsp;"
                        }, {
                            elem: "description",
                            content: function __$lb__$257() {
                                var __$r__$262;
                                var __$l2__$263 = __$ctx.__$a0;
                                __$ctx.__$a0 = __$ctx.__$a0 | 32768;
                                __$r__$262 = applyc(__$ctx, __$ref);
                                __$ctx.__$a0 = __$l2__$263;
                                return __$r__$262;
                            }().description || "&nbsp;"
                        } ]
                    }, {
                        elem: "cell",
                        mods: {
                            date: true
                        },
                        content: [ {
                            elem: "date",
                            content: function __$lb__$257() {
                                var __$r__$264;
                                var __$l3__$265 = __$ctx.__$a0;
                                __$ctx.__$a0 = __$ctx.__$a0 | 32768;
                                __$r__$264 = applyc(__$ctx, __$ref);
                                __$ctx.__$a0 = __$l3__$265;
                                return __$r__$264;
                            }().date_text || "&nbsp;"
                        }, {
                            block: "link",
                            mix: {
                                block: "account-my-subs-list-item",
                                elem: "button-remove"
                            },
                            content: [ {
                                block: "icon",
                                attrs: {
                                    style: "width: 15px; height: 15px;"
                                },
                                mods: {
                                    action: "remove"
                                }
                            } ]
                        } ]
                    } ]
                }
            } ];
        }
        return __$ref;
    },
    "account-my-lists-list-item": function(__$ctx, __$ref) {
        if (!$$elem && (__$ctx.__$a0 & 65536) === 0) {
            var __$r = __$b89(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    voprosique: function(__$ctx, __$ref) {
        if (!$$elem) {
            var __$r = __$b90(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    "account-dashboard-list-item": function(__$ctx, __$ref) {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["heading"] === true) {
                var __$r = __$b91(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
            if ((__$ctx.__$a0 & 131072) === 0) {
                var __$r = __$b92(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        }
        return __$ref;
    },
    "account-favorites-list-item": function(__$ctx, __$ref) {
        if (!$$elem && (__$ctx.__$a0 & 262144) === 0) {
            var __$r = __$b93(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    checkbox: function(__$ctx, __$ref) {
        if (!$$elem) {
            var __$r = __$b94(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    user_comments_in_search: function(__$ctx, __$ref) {
        if (!$$elem) {
            var __$r = __$b95(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    user_lists_in_search: function(__$ctx, __$ref) {
        if (!$$elem) {
            var __$r = __$b96(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    textarea: function(__$ctx, __$ref) {
        if (!$$elem) {
            return __$ctx.ctx.val;
        }
        return __$ref;
    },
    input: function(__$ctx, __$ref) {
        if (!$$elem) {
            return {
                elem: "box",
                content: {
                    elem: "control"
                }
            };
        }
        return __$ref;
    },
    "objects-list-item-note": function(__$ctx, __$ref) {
        if (!$$elem) {
            var __$r = __$b99(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    menu: function(__$ctx, __$ref) {
        var __$t = $$elem;
        if (__$t === "group") {
            if ($$mods && typeof __$ctx.ctx.title !== "undefined" && $$mods["mode"] === "groupcheck" && (__$ctx.__$a0 & 4194304) === 0) {
                var __$r = __$b100(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
            if (typeof __$ctx.ctx.title !== "undefined" && (__$ctx.__$a0 & 16777216) === 0) {
                return [ {
                    elem: "group-title",
                    content: __$ctx.ctx.title
                }, function __$lb__$365() {
                    var __$r__$366;
                    var __$l0__$367 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 16777216;
                    __$r__$366 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$367;
                    return __$r__$366;
                }() ];
            }
        }
        return __$ref;
    },
    "objects-list-item-lists": function(__$ctx, __$ref) {
        if (!$$elem) {
            var __$r = __$b102(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    popup: function(__$ctx, __$ref) {
        if (!$$elem && $$mods && $$mods["closable"] === true && (__$ctx.__$a0 & 536870912) === 0) {
            var __$r = __$b103(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    ua: function(__$ctx, __$ref) {
        if (!$$elem) {
            return [ "(function(e,c){", 'e[c]=e[c].replace(/(ua_js_)no/g,"$1yes");', '})(document.documentElement,"className");' ];
        }
        return __$ref;
    },
    "objects-list-item-tools": function(__$ctx, __$ref) {
        if (!$$elem) {
            var __$r = __$b105(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    "objects-list-item": function(__$ctx, __$ref) {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["heading"] === true) {
                var __$r = __$b106(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
            if ((__$ctx.__$a1 & 1) === 0) {
                var __$r = __$b107(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        }
        return __$ref;
    }
};

var __$m2 = {
    link: function(__$ctx, __$ref) {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["disabled"] === true && (__$ctx.__$a0 & 4) === 0) {
                var __$r = __$ctx.extend(function __$lb__$12() {
                    var __$r__$13;
                    var __$l0__$14 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 4;
                    __$r__$13 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$14;
                    return __$r__$13;
                }(), {
                    url: __$ctx.ctx.url
                });
                if (__$r !== __$ref) return __$r;
            }
            return true;
        }
        return __$ref;
    },
    dropdown: function(__$ctx, __$ref) {
        if (!$$elem) {
            return true;
        }
        return __$ref;
    },
    button: function(__$ctx, __$ref) {
        var __$t = !$$elem;
        if (__$t) {
            var __$t = $$mods;
            if (__$t) {
                if ($$mods && $$mods["type"] === "link" && $$mods["disabled"] === true && (__$ctx.__$a0 & 1) === 0) {
                    var __$r = __$ctx.extend(function __$lb__$4() {
                        var __$r__$5;
                        var __$l0__$6 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 1;
                        __$r__$5 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l0__$6;
                        return __$r__$5;
                    }(), {
                        url: __$ctx.ctx.url
                    });
                    if (__$r !== __$ref) return __$r;
                }
                if ($$mods["focused"] === true && (__$ctx.__$a0 & 1048576) === 0) {
                    var __$r = __$ctx.extend(function __$lb__$347() {
                        var __$r__$348;
                        var __$l0__$349 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 1048576;
                        __$r__$348 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l0__$349;
                        return __$r__$348;
                    }(), {
                        live: false
                    });
                    if (__$r !== __$ref) return __$r;
                }
            }
            return true;
        }
        return __$ref;
    },
    "new-buildings-list-item": function(__$ctx, __$ref) {
        if (!$$elem) {
            return true;
        }
        return __$ref;
    },
    embed: function(__$ctx, __$ref) {
        if (!$$elem) {
            return true;
        }
        return __$ref;
    },
    search_results_item: function(__$ctx, __$ref) {
        if (!$$elem && $$mods && $$mods["embed"] === true) {
            return false;
        }
        return __$ref;
    },
    address_list_item: function(__$ctx, __$ref) {
        if (!$$elem) {
            return true;
        }
        return __$ref;
    },
    pagination: function(__$ctx, __$ref) {
        if (!$$elem) {
            return true;
        }
        return __$ref;
    },
    search_map_results: function(__$ctx, __$ref) {
        if (!$$elem) {
            return true;
        }
        return __$ref;
    },
    search_map_popup: function(__$ctx, __$ref) {
        if (!$$elem) {
            return true;
        }
        return __$ref;
    },
    "account-dashboard-list-item": function(__$ctx, __$ref) {
        if (!$$elem) {
            return {
                url: __$ctx.ctx.link
            };
        }
        return __$ref;
    },
    "account-favorites-list-item": function(__$ctx, __$ref) {
        if (!$$elem) {
            return {
                url: __$ctx.ctx.link
            };
        }
        return __$ref;
    },
    checkbox: function(__$ctx, __$ref) {
        if (!$$elem) {
            return true;
        }
        return __$ref;
    },
    user_comments_in_search: function(__$ctx, __$ref) {
        if (!$$elem) {
            var __$r = __$b124(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    user_lists_in_search: function(__$ctx, __$ref) {
        if (!$$elem) {
            var __$r = __$b125(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    textarea: function(__$ctx, __$ref) {
        if (!$$elem) {
            return true;
        }
        return __$ref;
    },
    input: function(__$ctx, __$ref) {
        if (!$$elem) {
            return true;
        }
        return __$ref;
    },
    "objects-list-item-note": function(__$ctx, __$ref) {
        if (!$$elem) {
            return true;
        }
        return __$ref;
    },
    menu: function(__$ctx, __$ref) {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["focused"] === true && (__$ctx.__$a0 & 67108864) === 0) {
                var __$r = __$ctx.extend(function __$lb__$371() {
                    var __$r__$372;
                    var __$l0__$373 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 67108864;
                    __$r__$372 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$373;
                    return __$r__$372;
                }(), {
                    live: false
                });
                if (__$r !== __$ref) return __$r;
            }
            return true;
        }
        return __$ref;
    },
    "menu-item": function(__$ctx, __$ref) {
        if (!$$elem) {
            return {
                val: __$ctx.ctx.val
            };
        }
        return __$ref;
    },
    "objects-list-item-lists": function(__$ctx, __$ref) {
        if (!$$elem) {
            return true;
        }
        return __$ref;
    },
    popup: function(__$ctx, __$ref) {
        if (!$$elem) {
            var __$r = __$b133(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        return __$ref;
    },
    "objects-list-item-tools": function(__$ctx, __$ref) {
        if (!$$elem) {
            return true;
        }
        return __$ref;
    },
    "objects-list-item": function(__$ctx, __$ref) {
        if (!$$elem) {
            return {
                url: __$ctx.ctx.link
            };
        }
        return __$ref;
    }
};

function __$b3(__$ctx, __$ref) {
    var ctx__$15 = __$ctx.ctx, attrs__$16 = {}, tabIndex__$17;
    if (!$$mods.disabled) {
        if (ctx__$15.url) {
            attrs__$16.href = ctx__$15.url;
            tabIndex__$17 = ctx__$15.tabIndex;
        } else {
            tabIndex__$17 = ctx__$15.tabIndex || 0;
        }
    }
    typeof tabIndex__$17 === "undefined" || (attrs__$16.tabindex = tabIndex__$17);
    ctx__$15.title && (attrs__$16.title = ctx__$15.title);
    ctx__$15.target && (attrs__$16.target = ctx__$15.target);
    return attrs__$16;
}

function __$b4(__$ctx, __$ref) {
    var ctx__$7 = __$ctx.ctx, attrs__$8 = {};
    ctx__$7.target && (attrs__$8.target = ctx__$7.target);
    $$mods.disabled ? attrs__$8["aria-disabled"] = true : attrs__$8.href = ctx__$7.url;
    return __$ctx.extend(function __$lb__$9() {
        var __$r__$10;
        var __$l0__$11 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 2;
        __$r__$10 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l0__$11;
        return __$r__$10;
    }(), attrs__$8);
}

function __$b5(__$ctx, __$ref) {
    var ctx__$352 = __$ctx.ctx, attrs__$353 = {
        type: $$mods.type || "button",
        name: ctx__$352.name,
        value: ctx__$352.val
    };
    $$mods.disabled && (attrs__$353.disabled = "disabled");
    return __$ctx.extend(function __$lb__$354() {
        var __$r__$355;
        var __$l0__$356 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 2097152;
        __$r__$355 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l0__$356;
        return __$r__$355;
    }(), attrs__$353);
}

function __$b6(__$ctx, __$ref) {
    var ctx__$357 = __$ctx.ctx;
    return {
        role: "button",
        tabindex: ctx__$357.tabIndex,
        id: ctx__$357.id,
        title: ctx__$357.title
    };
}

function __$b9(__$ctx, __$ref) {
    var attrs__$319 = {
        type: "checkbox",
        autocomplete: "off"
    }, ctx__$320 = __$ctx.ctx;
    attrs__$319.name = ctx__$320.name;
    attrs__$319.value = ctx__$320.val;
    ctx__$320.checked && (attrs__$319.checked = "checked");
    ctx__$320.disabled && (attrs__$319.disabled = "disabled");
    return attrs__$319;
}

function __$b10(__$ctx, __$ref) {
    var ctx__$332 = __$ctx.ctx, attrs__$333 = {
        id: ctx__$332.id,
        name: ctx__$332.name,
        tabindex: ctx__$332.tabIndex,
        placeholder: ctx__$332.placeholder
    };
    ctx__$332.autocomplete === false && (attrs__$333.autocomplete = "off");
    $$mods.disabled && (attrs__$333.disabled = "disabled");
    return attrs__$333;
}

function __$b11(__$ctx, __$ref) {
    var input__$334 = __$ctx._input, attrs__$335 = {
        id: input__$334.id,
        name: input__$334.name,
        value: input__$334.val,
        maxlength: input__$334.maxLength,
        tabindex: input__$334.tabIndex,
        placeholder: input__$334.placeholder
    };
    input__$334.autocomplete === false && (attrs__$335.autocomplete = "off");
    $$mods.disabled && (attrs__$335.disabled = "disabled");
    return attrs__$335;
}

function __$b17(__$ctx, __$ref) {
    var attrs__$378 = {
        role: "menu"
    };
    $$mods.disabled || (attrs__$378.tabindex = 0);
    return attrs__$378;
}

function __$b19(__$ctx, __$ref) {
    var attrs__$407 = {
        "aria-hidden": "true"
    }, url__$408 = __$ctx.ctx.url;
    if (url__$408) attrs__$407.style = "background-image:url(" + url__$408 + ")";
    return attrs__$407;
}

function __$b51(__$ctx, __$ref) {
    var ctx__$18 = __$ctx.ctx;
    typeof ctx__$18.url === "object" && (ctx__$18.url = __$ctx.reapply(ctx__$18.url));
    var __$r__$20;
    var __$l0__$21 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 8;
    __$r__$20 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l0__$21;
    return;
}

function __$b52(__$ctx, __$ref) {
    var __$r__$337;
    var __$l0__$338 = __$ctx._input;
    __$ctx._input = __$ctx.ctx;
    var __$r__$340;
    var __$l1__$341 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 524288;
    __$r__$340 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l1__$341;
    __$r__$337 = __$r__$340;
    __$ctx._input = __$l0__$338;
    return;
}

function __$b53(__$ctx, __$ref) {
    var ctx__$379 = __$ctx.ctx, mods__$380 = $$mods, firstItem__$381, checkedItems__$382 = [];
    if (ctx__$379.content) {
        var isValDef__$383 = typeof ctx__$379.val !== "undefined", containsVal__$384 = function(val) {
            return isValDef__$383 && (mods__$380.mode === "check" ? ctx__$379.val.indexOf(val) > -1 : ctx__$379.val === val);
        }, iterateItems__$385 = function(content) {
            var i__$386 = 0, itemOrGroup__$387;
            while (itemOrGroup__$387 = content[i__$386++]) {
                if (itemOrGroup__$387.block === "menu-item") {
                    firstItem__$381 || (firstItem__$381 = itemOrGroup__$387);
                    if (containsVal__$384(itemOrGroup__$387.val)) {
                        (itemOrGroup__$387.mods = itemOrGroup__$387.mods || {}).checked = true;
                        checkedItems__$382.push(itemOrGroup__$387);
                    }
                } else if (itemOrGroup__$387.content) {
                    iterateItems__$385(itemOrGroup__$387.content);
                }
            }
        };
        if (!__$ctx.isArray(ctx__$379.content)) throw Error("menu: content must be an array of the menu items");
        iterateItems__$385(ctx__$379.content);
    }
    var __$r__$389;
    var __$l0__$390 = __$ctx._firstItem;
    __$ctx._firstItem = firstItem__$381;
    var __$l1__$391 = __$ctx._checkedItems;
    __$ctx._checkedItems = checkedItems__$382;
    var __$l2__$392 = __$ctx._menuMods;
    __$ctx._menuMods = {
        theme: mods__$380.theme,
        disabled: mods__$380.disabled
    };
    var __$r__$394;
    var __$l3__$395 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 268435456;
    __$r__$394 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l3__$395;
    __$r__$389 = __$r__$394;
    __$ctx._firstItem = __$l0__$390;
    __$ctx._checkedItems = __$l1__$391;
    __$ctx._menuMods = __$l2__$392;
    return;
}

function __$b54(__$ctx, __$ref) {
    var mods__$374 = $$mods;
    mods__$374.theme = mods__$374.theme || __$ctx._menuMods.theme;
    mods__$374.disabled = mods__$374.disabled || __$ctx._menuMods.disabled;
    var __$r__$376;
    var __$l0__$377 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 134217728;
    __$r__$376 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l0__$377;
    return;
}

function __$b55(__$ctx, __$ref) {
    var BEM_INTERNAL__$443 = __$ctx.BEM.INTERNAL, ctx__$444 = __$ctx.ctx, isBEM__$445, tag__$446, res__$447;
    var __$r__$449;
    var __$l0__$450 = __$ctx._str;
    __$ctx._str = "";
    var vBlock__$451 = $$block;
    var __$r__$453;
    var __$l1__$454 = $$mode;
    $$mode = "tag";
    __$r__$453 = applyc(__$ctx, __$ref);
    $$mode = __$l1__$454;
    tag__$446 = __$r__$453;
    typeof tag__$446 !== "undefined" || (tag__$446 = ctx__$444.tag);
    typeof tag__$446 !== "undefined" || (tag__$446 = "div");
    if (tag__$446) {
        var jsParams__$455, js__$456;
        if (vBlock__$451 && ctx__$444.js !== false) {
            var __$r__$457;
            var __$l2__$458 = $$mode;
            $$mode = "js";
            __$r__$457 = applyc(__$ctx, __$ref);
            $$mode = __$l2__$458;
            js__$456 = __$r__$457;
            js__$456 = js__$456 ? __$ctx.extend(ctx__$444.js, js__$456 === true ? {} : js__$456) : ctx__$444.js === true ? {} : ctx__$444.js;
            js__$456 && ((jsParams__$455 = {})[BEM_INTERNAL__$443.buildClass(vBlock__$451, ctx__$444.elem)] = js__$456);
        }
        __$ctx._str += "<" + tag__$446;
        var __$r__$459;
        var __$l3__$460 = $$mode;
        $$mode = "bem";
        __$r__$459 = applyc(__$ctx, __$ref);
        $$mode = __$l3__$460;
        isBEM__$445 = __$r__$459;
        typeof isBEM__$445 !== "undefined" || (isBEM__$445 = typeof ctx__$444.bem !== "undefined" ? ctx__$444.bem : ctx__$444.block || ctx__$444.elem);
        var __$r__$462;
        var __$l4__$463 = $$mode;
        $$mode = "cls";
        __$r__$462 = applyc(__$ctx, __$ref);
        $$mode = __$l4__$463;
        var cls__$461 = __$r__$462;
        cls__$461 || (cls__$461 = ctx__$444.cls);
        var addJSInitClass__$464 = ctx__$444.block && jsParams__$455 && !ctx__$444.elem;
        if (isBEM__$445 || cls__$461) {
            __$ctx._str += ' class="';
            if (isBEM__$445) {
                __$ctx._str += BEM_INTERNAL__$443.buildClasses(vBlock__$451, ctx__$444.elem, ctx__$444.elemMods || ctx__$444.mods);
                var __$r__$466;
                var __$l5__$467 = $$mode;
                $$mode = "mix";
                __$r__$466 = applyc(__$ctx, __$ref);
                $$mode = __$l5__$467;
                var mix__$465 = __$r__$466;
                ctx__$444.mix && (mix__$465 = mix__$465 ? [].concat(mix__$465, ctx__$444.mix) : ctx__$444.mix);
                if (mix__$465) {
                    var visited__$468 = {}, visitedKey__$469 = function(block, elem) {
                        return (block || "") + "__" + (elem || "");
                    };
                    visited__$468[visitedKey__$469(vBlock__$451, $$elem)] = true;
                    __$ctx.isArray(mix__$465) || (mix__$465 = [ mix__$465 ]);
                    for (var i__$470 = 0; i__$470 < mix__$465.length; i__$470++) {
                        var mixItem__$471 = mix__$465[i__$470], hasItem__$472 = mixItem__$471.block && (vBlock__$451 !== ctx__$444.block || mixItem__$471.block !== vBlock__$451) || mixItem__$471.elem, mixBlock__$473 = mixItem__$471.block || mixItem__$471._block || $$block, mixElem__$474 = mixItem__$471.elem || mixItem__$471._elem || $$elem;
                        hasItem__$472 && (__$ctx._str += " ");
                        __$ctx._str += BEM_INTERNAL__$443[hasItem__$472 ? "buildClasses" : "buildModsClasses"](mixBlock__$473, mixItem__$471.elem || mixItem__$471._elem || (mixItem__$471.block ? undefined : $$elem), mixItem__$471.elemMods || mixItem__$471.mods);
                        if (mixItem__$471.js) {
                            (jsParams__$455 || (jsParams__$455 = {}))[BEM_INTERNAL__$443.buildClass(mixBlock__$473, mixItem__$471.elem)] = mixItem__$471.js === true ? {} : mixItem__$471.js;
                            addJSInitClass__$464 || (addJSInitClass__$464 = mixBlock__$473 && !mixItem__$471.elem);
                        }
                        if (hasItem__$472 && !visited__$468[visitedKey__$469(mixBlock__$473, mixElem__$474)]) {
                            visited__$468[visitedKey__$469(mixBlock__$473, mixElem__$474)] = true;
                            var __$r__$476;
                            var __$l6__$477 = $$mode;
                            $$mode = "mix";
                            var __$l7__$478 = $$block;
                            $$block = mixBlock__$473;
                            var __$l8__$479 = $$elem;
                            $$elem = mixElem__$474;
                            __$r__$476 = applyc(__$ctx, __$ref);
                            $$mode = __$l6__$477;
                            $$block = __$l7__$478;
                            $$elem = __$l8__$479;
                            var nestedMix__$475 = __$r__$476;
                            if (nestedMix__$475) {
                                for (var j__$480 = 0; j__$480 < nestedMix__$475.length; j__$480++) {
                                    var nestedItem__$481 = nestedMix__$475[j__$480];
                                    if (!nestedItem__$481.block && !nestedItem__$481.elem || !visited__$468[visitedKey__$469(nestedItem__$481.block, nestedItem__$481.elem)]) {
                                        nestedItem__$481._block = mixBlock__$473;
                                        nestedItem__$481._elem = mixElem__$474;
                                        mix__$465.splice(i__$470 + 1, 0, nestedItem__$481);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            cls__$461 && (__$ctx._str += isBEM__$445 ? " " + cls__$461 : cls__$461);
            __$ctx._str += addJSInitClass__$464 ? ' i-bem"' : '"';
        }
        if (isBEM__$445 && jsParams__$455) {
            __$ctx._str += ' data-bem="' + __$ctx.attrEscape(JSON.stringify(jsParams__$455)) + '"';
        }
        var __$r__$483;
        var __$l9__$484 = $$mode;
        $$mode = "attrs";
        __$r__$483 = applyc(__$ctx, __$ref);
        $$mode = __$l9__$484;
        var attrs__$482 = __$r__$483;
        attrs__$482 = __$ctx.extend(attrs__$482, ctx__$444.attrs);
        if (attrs__$482) {
            var name__$485, attr__$486;
            for (name__$485 in attrs__$482) {
                attr__$486 = attrs__$482[name__$485];
                if (typeof attr__$486 === "undefined") continue;
                __$ctx._str += " " + name__$485 + '="' + __$ctx.attrEscape(__$ctx.isSimple(attr__$486) ? attr__$486 : __$ctx.reapply(attr__$486)) + '"';
            }
        }
    }
    if (__$ctx.isShortTag(tag__$446)) {
        __$ctx._str += "/>";
    } else {
        tag__$446 && (__$ctx._str += ">");
        var __$r__$488;
        var __$l10__$489 = $$mode;
        $$mode = "content";
        __$r__$488 = applyc(__$ctx, __$ref);
        $$mode = __$l10__$489;
        var content__$487 = __$r__$488;
        if (content__$487 || content__$487 === 0) {
            isBEM__$445 = vBlock__$451 || $$elem;
            var __$r__$490;
            var __$l11__$491 = $$mode;
            $$mode = "";
            var __$l12__$492 = __$ctx._notNewList;
            __$ctx._notNewList = false;
            var __$l13__$493 = __$ctx.position;
            __$ctx.position = isBEM__$445 ? 1 : __$ctx.position;
            var __$l14__$494 = __$ctx._listLength;
            __$ctx._listLength = isBEM__$445 ? 1 : __$ctx._listLength;
            var __$l15__$495 = __$ctx.ctx;
            __$ctx.ctx = content__$487;
            __$r__$490 = applyc(__$ctx, __$ref);
            $$mode = __$l11__$491;
            __$ctx._notNewList = __$l12__$492;
            __$ctx.position = __$l13__$493;
            __$ctx._listLength = __$l14__$494;
            __$ctx.ctx = __$l15__$495;
        }
        tag__$446 && (__$ctx._str += "</" + tag__$446 + ">");
    }
    res__$447 = __$ctx._str;
    __$r__$449 = undefined;
    __$ctx._str = __$l0__$450;
    __$ctx._buf.push(res__$447);
    return;
}

function __$b59(__$ctx, __$ref) {
    var __$r__$497;
    var __$l0__$498 = $$mode;
    $$mode = "";
    var __$l1__$499 = __$ctx.ctx;
    __$ctx.ctx = __$ctx.ctx._value;
    var __$r__$501;
    var __$l2__$502 = __$ctx.__$a1;
    __$ctx.__$a1 = __$ctx.__$a1 | 2;
    __$r__$501 = applyc(__$ctx, __$ref);
    __$ctx.__$a1 = __$l2__$502;
    __$r__$497 = __$r__$501;
    $$mode = __$l0__$498;
    __$ctx.ctx = __$l1__$499;
    return;
}

function __$b60(__$ctx, __$ref) {
    __$ctx._listLength--;
    var ctx__$503 = __$ctx.ctx;
    if (ctx__$503 && ctx__$503 !== true || ctx__$503 === 0) {
        __$ctx._str += ctx__$503 + "";
    }
    return;
}

function __$b61(__$ctx, __$ref) {
    __$ctx._listLength--;
    return;
}

function __$b62(__$ctx, __$ref) {
    var ctx__$504 = __$ctx.ctx, len__$505 = ctx__$504.length, i__$506 = 0, prevPos__$507 = __$ctx.position, prevNotNewList__$508 = __$ctx._notNewList;
    if (prevNotNewList__$508) {
        __$ctx._listLength += len__$505 - 1;
    } else {
        __$ctx.position = 0;
        __$ctx._listLength = len__$505;
    }
    __$ctx._notNewList = true;
    while (i__$506 < len__$505) (function __$lb__$509() {
        var __$r__$510;
        var __$l0__$511 = __$ctx.ctx;
        __$ctx.ctx = ctx__$504[i__$506++];
        __$r__$510 = applyc(__$ctx, __$ref);
        __$ctx.ctx = __$l0__$511;
        return __$r__$510;
    })();
    prevNotNewList__$508 || (__$ctx.position = prevPos__$507);
    return;
}

function __$b63(__$ctx, __$ref) {
    __$ctx.ctx || (__$ctx.ctx = {});
    var vBlock__$512 = __$ctx.ctx.block, vElem__$513 = __$ctx.ctx.elem, block__$514 = __$ctx._currBlock || $$block;
    var __$r__$516;
    var __$l0__$517 = $$mode;
    $$mode = "default";
    var __$l1__$518 = $$block;
    $$block = vBlock__$512 || (vElem__$513 ? block__$514 : undefined);
    var __$l2__$519 = __$ctx._currBlock;
    __$ctx._currBlock = vBlock__$512 || vElem__$513 ? undefined : block__$514;
    var __$l3__$520 = $$elem;
    $$elem = vElem__$513;
    var __$l4__$521 = $$mods;
    $$mods = vBlock__$512 ? __$ctx.ctx.mods || (__$ctx.ctx.mods = {}) : $$mods;
    var __$l5__$522 = $$elemMods;
    $$elemMods = __$ctx.ctx.elemMods || {};
    $$block || $$elem ? __$ctx.position = (__$ctx.position || 0) + 1 : __$ctx._listLength--;
    applyc(__$ctx, __$ref);
    __$r__$516 = undefined;
    $$mode = __$l0__$517;
    $$block = __$l1__$518;
    __$ctx._currBlock = __$l2__$519;
    $$elem = __$l3__$520;
    $$mods = __$l4__$521;
    $$elemMods = __$l5__$522;
    return;
}

function __$b64(__$ctx, __$ref) {
    var content__$0 = __$ctx.ctx.content;
    if (Array.isArray(content__$0)) return content__$0;
    var res__$1 = __$ctx.isSimple(content__$0) ? {
        block: "link",
        mods: {
            pseudo: true
        },
        content: content__$0
    } : content__$0;
    if (res__$1.block === "link") {
        var resMods__$2 = res__$1.mods || (res__$1.mods = {}), dropdownMods__$3 = $$mods;
        resMods__$2.theme || (resMods__$2.theme = dropdownMods__$3.theme);
        resMods__$2.disabled = dropdownMods__$3.disabled;
    }
    return res__$1;
}

function __$b65(__$ctx, __$ref) {
    var content__$323 = __$ctx.ctx.content;
    if (Array.isArray(content__$323)) return content__$323;
    var res__$324 = __$ctx.isSimple(content__$323) ? {
        block: "button",
        text: content__$323
    } : content__$323;
    if (res__$324.block === "button") {
        var resMods__$325 = res__$324.mods || (res__$324.mods = {}), dropdownMods__$326 = $$mods;
        resMods__$325.size || (resMods__$325.size = dropdownMods__$326.size);
        resMods__$325.theme || (resMods__$325.theme = dropdownMods__$326.theme);
        resMods__$325.disabled = dropdownMods__$326.disabled;
    }
    return res__$324;
}

function __$b66(__$ctx, __$ref) {
    var popup__$327 = __$ctx.ctx.popup;
    if (__$ctx.isSimple(popup__$327) || popup__$327.block !== "popup") {
        popup__$327 = {
            block: "popup",
            content: popup__$327
        };
    }
    var popupMods__$328 = popup__$327.mods || (popup__$327.mods = {});
    popupMods__$328.theme || (popupMods__$328.theme = $$mods.theme);
    popupMods__$328.hasOwnProperty("autoclosable") || (popupMods__$328.autoclosable = true);
    popupMods__$328.target = "anchor";
    return [ {
        elem: "switcher",
        content: __$ctx.ctx.switcher
    }, popup__$327 ];
}

function __$b68(__$ctx, __$ref) {
    var ctx__$350 = __$ctx.ctx, content__$351 = [ ctx__$350.icon ];
    "text" in ctx__$350 && content__$351.push({
        elem: "text",
        content: ctx__$350.text
    });
    return content__$351;
}

function __$b70(__$ctx, __$ref) {
    var __$r__$29;
    var __$l0__$30 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 32;
    __$r__$29 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l0__$30;
    var imageUrl__$27 = __$r__$29;
    return imageUrl__$27 ? {
        tag: "img",
        elem: "developer-logo-image",
        attrs: {
            src: imageUrl__$27,
            alt: ""
        }
    } : "";
}

function __$b71(__$ctx, __$ref) {
    if (__$ctx.ctx.url) {
        return [ {
            block: "link",
            mix: {
                block: "new-buildings-list-item",
                elem: "name-link"
            },
            content: function __$lb__$31() {
                var __$r__$32;
                var __$l0__$33 = __$ctx.__$a0;
                __$ctx.__$a0 = __$ctx.__$a0 | 64;
                __$r__$32 = applyc(__$ctx, __$ref);
                __$ctx.__$a0 = __$l0__$33;
                return __$r__$32;
            }(),
            url: __$ctx.ctx.url
        } ];
    } else {
        var __$r__$34;
        var __$l1__$35 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 64;
        __$r__$34 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l1__$35;
        return __$r__$34;
    }
    return;
}

function __$b72(__$ctx, __$ref) {
    var name__$36 = function __$lb__$37() {
        var __$r__$38;
        var __$l18__$39 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 128;
        __$r__$38 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l18__$39;
        return __$r__$38;
    }().name || "";
    var addressText__$40 = function __$lb__$37() {
        var __$r__$41;
        var __$l17__$42 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 128;
        __$r__$41 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l17__$42;
        return __$r__$41;
    }().address_text || "";
    var addressHelp__$43 = function __$lb__$37() {
        var __$r__$44;
        var __$l16__$45 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 128;
        __$r__$44 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l16__$45;
        return __$r__$44;
    }().address_help || "";
    var developerName__$46 = function __$lb__$37() {
        var __$r__$47;
        var __$l15__$48 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 128;
        __$r__$47 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l15__$48;
        return __$r__$47;
    }().developer_name || "";
    var attrs__$49 = {};
    attrs__$49.name = name__$36.length > 24 ? {
        title: name__$36
    } : {};
    attrs__$49.addressText = addressText__$40.length > 50 ? {
        title: addressText__$40
    } : {};
    attrs__$49.addressHelp = addressHelp__$43.length > 50 ? {
        title: addressHelp__$43
    } : {};
    attrs__$49.developerName = developerName__$46.length > 15 ? {
        title: developerName__$46
    } : {};
    var hasImage__$50 = function __$lb__$37() {
        var __$r__$51;
        var __$l13__$52 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 128;
        __$r__$51 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l13__$52;
        return __$r__$51;
    }().image && function __$lb__$37() {
        var __$r__$53;
        var __$l14__$54 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 128;
        __$r__$53 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l14__$54;
        return __$r__$53;
    }().image.length;
    var classText__$55 = function __$lb__$37() {
        var __$r__$56;
        var __$l12__$57 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 128;
        __$r__$56 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l12__$57;
        return __$r__$56;
    }().class_text || "";
    var classParamsText__$58 = function __$lb__$37() {
        var __$r__$59;
        var __$l11__$60 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 128;
        __$r__$59 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l11__$60;
        return __$r__$59;
    }().class_params_text || "";
    var classHtml__$61 = [ classText__$55 ? "<b>" + classText__$55 + "</b>" : "", classParamsText__$58 ].join("&nbsp;&nbsp;");
    var classPlain__$62 = [ classText__$55, classParamsText__$58 ].join(". ");
    attrs__$49.class = classPlain__$62.length > 75 ? {
        title: classPlain__$62
    } : undefined;
    var buildingsText__$63 = function __$lb__$37() {
        var __$r__$64;
        var __$l10__$65 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 128;
        __$r__$64 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l10__$65;
        return __$r__$64;
    }().buildings_text || "";
    attrs__$49.buildings = buildingsText__$63.length > 75 ? {
        title: buildingsText__$63
    } : {};
    var appartmentsText__$66 = function __$lb__$37() {
        var __$r__$67;
        var __$l9__$68 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 128;
        __$r__$67 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l9__$68;
        return __$r__$67;
    }().appartments_text || "";
    attrs__$49.appartments = appartmentsText__$66.length > 75 ? {
        title: appartmentsText__$66
    } : {};
    var totalItemsText__$69 = function __$lb__$37() {
        var __$r__$70;
        var __$l8__$71 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 128;
        __$r__$70 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l8__$71;
        return __$r__$70;
    }().total_items_text || "";
    attrs__$49.totalItems = totalItemsText__$69.length > 50 ? {
        title: totalItemsText__$69
    } : {};
    var priceRange__$72 = [];
    var priceMin__$73 = function __$lb__$37() {
        var __$r__$74;
        var __$l7__$75 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 128;
        __$r__$74 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l7__$75;
        return __$r__$74;
    }().price_min || "";
    var priceMax__$76 = function __$lb__$37() {
        var __$r__$77;
        var __$l6__$78 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 128;
        __$r__$77 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l6__$78;
        return __$r__$77;
    }().price_max || "";
    var currency__$79 = function __$lb__$37() {
        var __$r__$80;
        var __$l4__$81 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 128;
        __$r__$80 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l4__$81;
        return __$r__$80;
    }().currency ? ' <span class="currency">' + function __$lb__$37() {
        var __$r__$82;
        var __$l5__$83 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 128;
        __$r__$82 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l5__$83;
        return __$r__$82;
    }().currency + "</span>" : "";
    if (priceMin__$73) {
        priceRange__$72.push(priceMin__$73 + currency__$79);
        if (priceMax__$76) {
            priceRange__$72.push(priceMax__$76 + currency__$79);
        }
    }
    return [ {
        elem: "layout",
        content: [ {
            elem: "header",
            mix: {
                block: "clearfix"
            },
            content: [ {
                elem: "title",
                mix: {
                    block: "pull_left"
                },
                content: [ {
                    elem: "name",
                    attrs: attrs__$49.name,
                    content: [ {
                        tag: "a",
                        block: "link",
                        mix: {
                            block: "new-buildings-list-item",
                            elem: "name-link"
                        },
                        content: name__$36 || "&nbsp;",
                        attrs: {
                            href: function __$lb__$37() {
                                var __$r__$84;
                                var __$l0__$85 = __$ctx.__$a0;
                                __$ctx.__$a0 = __$ctx.__$a0 | 128;
                                __$r__$84 = applyc(__$ctx, __$ref);
                                __$ctx.__$a0 = __$l0__$85;
                                return __$r__$84;
                            }().link || ""
                        }
                    } ]
                }, {
                    elem: "address",
                    attrs: attrs__$49.addressText,
                    content: addressText__$40 || "&nbsp;"
                }, {
                    elem: "address-details",
                    mix: {
                        block: "help"
                    },
                    attrs: attrs__$49.addressHelp,
                    content: addressHelp__$43 || "&nbsp;"
                } ]
            }, {
                elem: "developer",
                mix: {
                    block: "pull_right"
                },
                content: [ {
                    elem: "developer-name",
                    attrs: attrs__$49.developerName,
                    content: developerName__$46 || "&nbsp;"
                }, {
                    elem: "developer-logo",
                    content: function __$lb__$37() {
                        var __$r__$86;
                        var __$l1__$87 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 128;
                        __$r__$86 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l1__$87;
                        return __$r__$86;
                    }().developer_logo
                } ]
            } ]
        }, {
            elem: "body",
            content: [ {
                elem: "image-wrapper",
                elemMods: {
                    blank: !hasImage__$50
                },
                content: function __$lb__$37() {
                    var __$r__$88;
                    var __$l2__$89 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 128;
                    __$r__$88 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l2__$89;
                    return __$r__$88;
                }()
            }, {
                elem: "class",
                attrs: attrs__$49.class,
                content: {
                    tag: "span",
                    block: "text",
                    content: classHtml__$61
                }
            } ]
        }, {
            elem: "footer",
            content: [ {
                elem: "buildings",
                attrs: attrs__$49.buildings,
                content: buildingsText__$63 || "&nbsp;"
            }, {
                elem: "appartments",
                attrs: attrs__$49.appartments,
                content: appartmentsText__$66 || "&nbsp;"
            }, {
                elem: "total-items-text",
                attrs: attrs__$49.totalItems,
                content: totalItemsText__$69 || "&nbsp;"
            }, {
                elem: "price-range-text",
                content: {
                    tag: "a",
                    block: "link",
                    mix: {
                        block: "new-buildings-list-item",
                        elem: "link"
                    },
                    attrs: {
                        href: function __$lb__$37() {
                            var __$r__$90;
                            var __$l3__$91 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 128;
                            __$r__$90 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l3__$91;
                            return __$r__$90;
                        }().link || ""
                    },
                    content: priceRange__$72.join(" — ") || "&nbsp;"
                }
            } ]
        } ]
    } ];
}

function __$b74(__$ctx, __$ref) {
    var content__$92 = [];
    var image__$93 = function __$lb__$94() {
        var __$r__$95;
        var __$l0__$96 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 256;
        __$r__$95 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l0__$96;
        return __$r__$95;
    }().image || false;
    image__$93 && content__$92.push({
        tag: "img",
        attrs: {
            src: "/img/search/bn-lg.png",
            alt: ""
        }
    });
    return content__$92;
}

function __$b75(__$ctx, __$ref) {
    var data__$97 = __$ctx.ctx.content;
    return {
        block: "embed",
        mods: data__$97.mods || {},
        js: data__$97.js || {},
        content: data__$97
    };
}

function __$b76(__$ctx, __$ref) {
    var __$r__$100;
    var __$l57__$101 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 512;
    __$r__$100 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l57__$101;
    var that__$98 = __$r__$100;
    var addr_text_len__$102 = 27;
    var addr_help_len__$103 = 27;
    var seller_text_len__$104 = 9;
    var item_in_list__$105 = !!(function __$lb__$99() {
        var __$r__$106;
        var __$l55__$107 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 512;
        __$r__$106 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l55__$107;
        return __$r__$106;
    }().hasOwnProperty("in_lists") && function __$lb__$99() {
        var __$r__$108;
        var __$l56__$109 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 512;
        __$r__$108 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l56__$109;
        return __$r__$108;
    }().in_lists.length);
    return [ {
        attrs: function __$lb__$99() {
            var __$r__$110;
            var __$l0__$111 = __$ctx.__$a0;
            __$ctx.__$a0 = __$ctx.__$a0 | 512;
            __$r__$110 = applyc(__$ctx, __$ref);
            __$ctx.__$a0 = __$l0__$111;
            return __$r__$110;
        }().attrs,
        mods: function __$lb__$99() {
            var __$r__$112;
            var __$l1__$113 = __$ctx.__$a0;
            __$ctx.__$a0 = __$ctx.__$a0 | 512;
            __$r__$112 = applyc(__$ctx, __$ref);
            __$ctx.__$a0 = __$l1__$113;
            return __$r__$112;
        }().mods,
        elem: "table_row",
        tag: "span",
        content: {
            elem: "table_row_inner",
            tag: "span",
            content: [ {
                elem: "table_cell",
                tag: "span",
                mods: {
                    image: true
                },
                content: function __$lb__$99() {
                    var __$r__$114;
                    var __$l2__$115 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 512;
                    __$r__$114 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l2__$115;
                    return __$r__$114;
                }().image ? {
                    elem: "image_holder",
                    tag: "span",
                    content: {
                        tag: "img",
                        attrs: {
                            src: function __$lb__$99() {
                                var __$r__$116;
                                var __$l3__$117 = __$ctx.__$a0;
                                __$ctx.__$a0 = __$ctx.__$a0 | 512;
                                __$r__$116 = applyc(__$ctx, __$ref);
                                __$ctx.__$a0 = __$l3__$117;
                                return __$r__$116;
                            }().image,
                            alt: ""
                        }
                    }
                } : {
                    elem: "image_holder",
                    tag: "span"
                }
            }, {
                elem: "table_cell",
                tag: "span",
                mods: {
                    address: true
                },
                content: [ {
                    elem: "text",
                    tag: "span",
                    attrs: {
                        title: function __$lb__$99() {
                            var __$r__$118;
                            var __$l4__$119 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 512;
                            __$r__$118 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l4__$119;
                            return __$r__$118;
                        }().address_text && function __$lb__$99() {
                            var __$r__$120;
                            var __$l5__$121 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 512;
                            __$r__$120 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l5__$121;
                            return __$r__$120;
                        }().address_text.length > addr_text_len__$102 ? function __$lb__$99() {
                            var __$r__$122;
                            var __$l6__$123 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 512;
                            __$r__$122 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l6__$123;
                            return __$r__$122;
                        }().address_text : ""
                    },
                    content: function __$lb__$99() {
                        var __$r__$124;
                        var __$l7__$125 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$124 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l7__$125;
                        return __$r__$124;
                    }().address_text && function __$lb__$99() {
                        var __$r__$126;
                        var __$l8__$127 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$126 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l8__$127;
                        return __$r__$126;
                    }().address_text.length > addr_text_len__$102 ? function __$lb__$99() {
                        var __$r__$128;
                        var __$l9__$129 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$128 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l9__$129;
                        return __$r__$128;
                    }().address_text.substr(0, addr_text_len__$102) + "..." : function __$lb__$99() {
                        var __$r__$130;
                        var __$l10__$131 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$130 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l10__$131;
                        return __$r__$130;
                    }().address_text
                }, {
                    block: "help",
                    tag: "span",
                    attrs: {
                        title: function __$lb__$99() {
                            var __$r__$132;
                            var __$l11__$133 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 512;
                            __$r__$132 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l11__$133;
                            return __$r__$132;
                        }().address_help && function __$lb__$99() {
                            var __$r__$134;
                            var __$l12__$135 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 512;
                            __$r__$134 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l12__$135;
                            return __$r__$134;
                        }().address_help.length > addr_help_len__$103 ? function __$lb__$99() {
                            var __$r__$136;
                            var __$l13__$137 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 512;
                            __$r__$136 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l13__$137;
                            return __$r__$136;
                        }().address_help : ""
                    },
                    content: function __$lb__$99() {
                        var __$r__$138;
                        var __$l14__$139 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$138 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l14__$139;
                        return __$r__$138;
                    }().address_help && function __$lb__$99() {
                        var __$r__$140;
                        var __$l15__$141 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$140 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l15__$141;
                        return __$r__$140;
                    }().address_help.length > addr_help_len__$103 ? function __$lb__$99() {
                        var __$r__$142;
                        var __$l16__$143 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$142 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l16__$143;
                        return __$r__$142;
                    }().address_help.substr(0, addr_help_len__$103) + "..." : function __$lb__$99() {
                        var __$r__$144;
                        var __$l17__$145 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$144 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l17__$145;
                        return __$r__$144;
                    }().address_help || "&nbsp;"
                } ]
            }, {
                elem: "table_cell",
                tag: "span",
                mods: {
                    object: true
                },
                content: [ {
                    elem: "text",
                    tag: "span",
                    content: function __$lb__$99() {
                        var __$r__$146;
                        var __$l18__$147 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$146 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l18__$147;
                        return __$r__$146;
                    }().object_text
                }, {
                    block: "help",
                    tag: "span",
                    content: function __$lb__$99() {
                        var __$r__$148;
                        var __$l19__$149 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$148 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l19__$149;
                        return __$r__$148;
                    }().object_help || "&nbsp;"
                } ]
            }, {
                elem: "table_cell",
                tag: "span",
                mods: {
                    s: true
                },
                content: [ {
                    elem: "text",
                    tag: "span",
                    content: function __$lb__$99() {
                        var __$r__$150;
                        var __$l20__$151 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$150 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l20__$151;
                        return __$r__$150;
                    }().s_text
                }, {
                    block: "help",
                    tag: "span",
                    content: function __$lb__$99() {
                        var __$r__$152;
                        var __$l21__$153 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$152 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l21__$153;
                        return __$r__$152;
                    }().s_help || "&nbsp;"
                } ]
            }, {
                elem: "table_cell",
                tag: "span",
                mods: {
                    floor: true
                },
                content: [ {
                    elem: "text",
                    tag: "span",
                    content: function __$lb__$99() {
                        var __$r__$154;
                        var __$l22__$155 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$154 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l22__$155;
                        return __$r__$154;
                    }().floor_text
                }, {
                    block: "help",
                    tag: "span",
                    content: function __$lb__$99() {
                        var __$r__$156;
                        var __$l23__$157 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$156 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l23__$157;
                        return __$r__$156;
                    }().floor_help || "&nbsp;"
                } ]
            }, {
                elem: "table_cell",
                tag: "span",
                mods: {
                    san: true
                },
                content: [ {
                    elem: "text",
                    tag: "span",
                    content: function __$lb__$99() {
                        var __$r__$158;
                        var __$l24__$159 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$158 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l24__$159;
                        return __$r__$158;
                    }().san_text
                }, {
                    block: "help",
                    tag: "span",
                    content: function __$lb__$99() {
                        var __$r__$160;
                        var __$l25__$161 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$160 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l25__$161;
                        return __$r__$160;
                    }().san_help || "&nbsp;"
                } ]
            }, {
                elem: "table_cell",
                tag: "span",
                mods: {
                    home: true
                },
                content: [ {
                    elem: "text",
                    tag: "span",
                    content: [ function __$lb__$99() {
                        var __$r__$162;
                        var __$l26__$163 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$162 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l26__$163;
                        return __$r__$162;
                    }().home_text, function __$lb__$99() {
                        var __$r__$164;
                        var __$l27__$165 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$164 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l27__$165;
                        return __$r__$164;
                    }().home_voprosique ].map(function(text) {
                        if (text == "?") {
                            return {
                                block: "voprosique",
                                text: that__$98.hasOwnProperty("home_voprosique_text") ? that__$98.home_voprosique_text : ""
                            };
                        }
                        return {
                            tag: "span",
                            content: text
                        };
                    })
                }, {
                    block: "help",
                    tag: "span",
                    content: function __$lb__$99() {
                        var __$r__$166;
                        var __$l28__$167 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$166 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l28__$167;
                        return __$r__$166;
                    }().home_help || "&nbsp;"
                } ]
            }, {
                elem: "table_cell",
                tag: "span",
                mods: {
                    price: true
                },
                content: [ {
                    elem: "text",
                    tag: "span",
                    content: function __$lb__$99() {
                        var __$r__$168;
                        var __$l29__$169 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$168 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l29__$169;
                        return __$r__$168;
                    }().price_text
                }, {
                    block: "help",
                    tag: "span",
                    content: function __$lb__$99() {
                        var __$r__$170;
                        var __$l30__$171 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$170 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l30__$171;
                        return __$r__$170;
                    }().price_help || "&nbsp;"
                } ]
            }, {
                elem: "table_cell",
                tag: "span",
                mods: {
                    seller: true
                },
                content: [ {
                    elem: "text",
                    tag: "span",
                    attrs: {
                        title: function __$lb__$99() {
                            var __$r__$172;
                            var __$l31__$173 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 512;
                            __$r__$172 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l31__$173;
                            return __$r__$172;
                        }().seller_text && function __$lb__$99() {
                            var __$r__$174;
                            var __$l32__$175 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 512;
                            __$r__$174 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l32__$175;
                            return __$r__$174;
                        }().seller_text.length > seller_text_len__$104 ? function __$lb__$99() {
                            var __$r__$176;
                            var __$l33__$177 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 512;
                            __$r__$176 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l33__$177;
                            return __$r__$176;
                        }().seller_text : ""
                    },
                    content: function __$lb__$99() {
                        var __$r__$178;
                        var __$l34__$179 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$178 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l34__$179;
                        return __$r__$178;
                    }().seller_text && function __$lb__$99() {
                        var __$r__$180;
                        var __$l35__$181 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$180 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l35__$181;
                        return __$r__$180;
                    }().seller_text.length > seller_text_len__$104 ? function __$lb__$99() {
                        var __$r__$182;
                        var __$l36__$183 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$182 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l36__$183;
                        return __$r__$182;
                    }().seller_text.substr(0, seller_text_len__$104) + "..." : function __$lb__$99() {
                        var __$r__$184;
                        var __$l37__$185 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$184 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l37__$185;
                        return __$r__$184;
                    }().seller_text
                }, {
                    block: "help",
                    tag: "span",
                    content: function __$lb__$99() {
                        var __$r__$186;
                        var __$l38__$187 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$186 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l38__$187;
                        return __$r__$186;
                    }().seller_help || "&nbsp;"
                } ]
            }, {
                elem: "table_cell",
                tag: "span",
                mods: {
                    phone: true
                },
                content: (function __$lb__$99() {
                    var __$r__$188;
                    var __$l39__$189 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 512;
                    __$r__$188 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l39__$189;
                    return __$r__$188;
                }().phones || []).map(function(phone) {
                    return {
                        elem: "text",
                        tag: "span",
                        content: phone
                    };
                })
            }, {
                elem: "table_cell",
                tag: "span",
                mods: {
                    comment: true
                },
                content: [ {
                    elem: "text",
                    tag: "span",
                    content: function __$lb__$99() {
                        var __$r__$190;
                        var __$l40__$191 = __$ctx.__$a0;
                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                        __$r__$190 = applyc(__$ctx, __$ref);
                        __$ctx.__$a0 = __$l40__$191;
                        return __$r__$190;
                    }().comment
                } ]
            }, {
                elem: "table_cell",
                tag: "span",
                mods: {
                    tools: true
                },
                content: [ {
                    elem: "tools_item",
                    tag: "span",
                    mods: {
                        first: true,
                        accept: !!function __$lb__$99() {
                            var __$r__$192;
                            var __$l41__$193 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 512;
                            __$r__$192 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l41__$193;
                            return __$r__$192;
                        }().is_favorite
                    },
                    content: {
                        block: "icon",
                        mods: {
                            action: !!function __$lb__$99() {
                                var __$r__$194;
                                var __$l42__$195 = __$ctx.__$a0;
                                __$ctx.__$a0 = __$ctx.__$a0 | 512;
                                __$r__$194 = applyc(__$ctx, __$ref);
                                __$ctx.__$a0 = __$l42__$195;
                                return __$r__$194;
                            }().is_favorite ? "star" : "star-o"
                        }
                    }
                }, {
                    elem: "tools_item",
                    tag: "span",
                    mods: {
                        second: true,
                        accept: item_in_list__$105
                    },
                    content: [ {
                        block: "dropdown",
                        tag: "span",
                        mods: {
                            switcher: "button",
                            theme: "islands",
                            switcher_only_icon: true
                        },
                        switcher: {
                            block: "button",
                            content: {
                                block: "icon",
                                mods: {
                                    action: item_in_list__$105 ? "plus-blue" : "plus"
                                }
                            }
                        },
                        popup: {
                            mods: {
                                closable: true
                            },
                            block: "popup",
                            content: {
                                block: "user_lists_in_search",
                                item_id: function __$lb__$99() {
                                    var __$r__$196;
                                    var __$l43__$197 = __$ctx.__$a0;
                                    __$ctx.__$a0 = __$ctx.__$a0 | 512;
                                    __$r__$196 = applyc(__$ctx, __$ref);
                                    __$ctx.__$a0 = __$l43__$197;
                                    return __$r__$196;
                                }().id,
                                in_lists: function __$lb__$99() {
                                    var __$r__$198;
                                    var __$l44__$199 = __$ctx.__$a0;
                                    __$ctx.__$a0 = __$ctx.__$a0 | 512;
                                    __$r__$198 = applyc(__$ctx, __$ref);
                                    __$ctx.__$a0 = __$l44__$199;
                                    return __$r__$198;
                                }().hasOwnProperty("in_lists") ? function __$lb__$99() {
                                    var __$r__$200;
                                    var __$l45__$201 = __$ctx.__$a0;
                                    __$ctx.__$a0 = __$ctx.__$a0 | 512;
                                    __$r__$200 = applyc(__$ctx, __$ref);
                                    __$ctx.__$a0 = __$l45__$201;
                                    return __$r__$200;
                                }().in_lists : [],
                                lists: function __$lb__$99() {
                                    var __$r__$202;
                                    var __$l46__$203 = __$ctx.__$a0;
                                    __$ctx.__$a0 = __$ctx.__$a0 | 512;
                                    __$r__$202 = applyc(__$ctx, __$ref);
                                    __$ctx.__$a0 = __$l46__$203;
                                    return __$r__$202;
                                }().hasOwnProperty("lists") ? function __$lb__$99() {
                                    var __$r__$204;
                                    var __$l47__$205 = __$ctx.__$a0;
                                    __$ctx.__$a0 = __$ctx.__$a0 | 512;
                                    __$r__$204 = applyc(__$ctx, __$ref);
                                    __$ctx.__$a0 = __$l47__$205;
                                    return __$r__$204;
                                }().lists : [],
                                user_auth: function __$lb__$99() {
                                    var __$r__$206;
                                    var __$l48__$207 = __$ctx.__$a0;
                                    __$ctx.__$a0 = __$ctx.__$a0 | 512;
                                    __$r__$206 = applyc(__$ctx, __$ref);
                                    __$ctx.__$a0 = __$l48__$207;
                                    return __$r__$206;
                                }().user_auth
                            }
                        }
                    } ]
                }, {
                    elem: "tools_item",
                    tag: "span",
                    mods: {
                        third: true,
                        accept: !!function __$lb__$99() {
                            var __$r__$208;
                            var __$l49__$209 = __$ctx.__$a0;
                            __$ctx.__$a0 = __$ctx.__$a0 | 512;
                            __$r__$208 = applyc(__$ctx, __$ref);
                            __$ctx.__$a0 = __$l49__$209;
                            return __$r__$208;
                        }().user_comment
                    },
                    content: [ {
                        block: "dropdown",
                        tag: "span",
                        mods: {
                            switcher: "button",
                            theme: "islands",
                            switcher_only_icon: true
                        },
                        switcher: {
                            block: "button",
                            content: {
                                block: "icon",
                                mods: {
                                    action: !!function __$lb__$99() {
                                        var __$r__$210;
                                        var __$l50__$211 = __$ctx.__$a0;
                                        __$ctx.__$a0 = __$ctx.__$a0 | 512;
                                        __$r__$210 = applyc(__$ctx, __$ref);
                                        __$ctx.__$a0 = __$l50__$211;
                                        return __$r__$210;
                                    }().user_comment ? "comments-blue" : "comments"
                                }
                            }
                        },
                        popup: {
                            mods: {
                                closable: !function __$lb__$99() {
                                    var __$r__$212;
                                    var __$l51__$213 = __$ctx.__$a0;
                                    __$ctx.__$a0 = __$ctx.__$a0 | 512;
                                    __$r__$212 = applyc(__$ctx, __$ref);
                                    __$ctx.__$a0 = __$l51__$213;
                                    return __$r__$212;
                                }().user_auth
                            },
                            block: "popup",
                            content: {
                                block: "user_comments_in_search",
                                item_id: function __$lb__$99() {
                                    var __$r__$214;
                                    var __$l52__$215 = __$ctx.__$a0;
                                    __$ctx.__$a0 = __$ctx.__$a0 | 512;
                                    __$r__$214 = applyc(__$ctx, __$ref);
                                    __$ctx.__$a0 = __$l52__$215;
                                    return __$r__$214;
                                }().id,
                                user_auth: function __$lb__$99() {
                                    var __$r__$216;
                                    var __$l53__$217 = __$ctx.__$a0;
                                    __$ctx.__$a0 = __$ctx.__$a0 | 512;
                                    __$r__$216 = applyc(__$ctx, __$ref);
                                    __$ctx.__$a0 = __$l53__$217;
                                    return __$r__$216;
                                }().user_auth,
                                user_comment: function __$lb__$99() {
                                    var __$r__$218;
                                    var __$l54__$219 = __$ctx.__$a0;
                                    __$ctx.__$a0 = __$ctx.__$a0 | 512;
                                    __$r__$218 = applyc(__$ctx, __$ref);
                                    __$ctx.__$a0 = __$l54__$219;
                                    return __$r__$218;
                                }().user_comment
                            }
                        }
                    } ]
                } ]
            } ]
        }
    } ];
}

function __$b81(__$ctx, __$ref) {
    var content__$223 = [];
    content__$223.push("Площадь: " + function __$lb__$224() {
        var __$r__$225;
        var __$l3__$226 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 2048;
        __$r__$225 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l3__$226;
        return __$r__$225;
    }().s_text);
    content__$223.push("этаж: " + function __$lb__$224() {
        var __$r__$227;
        var __$l2__$228 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 2048;
        __$r__$227 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l2__$228;
        return __$r__$227;
    }().floor_text);
    content__$223.push("санузел: " + function __$lb__$224() {
        var __$r__$229;
        var __$l1__$230 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 2048;
        __$r__$229 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l1__$230;
        return __$r__$229;
    }().san_text);
    content__$223.push("дом &mdash; " + function __$lb__$224() {
        var __$r__$231;
        var __$l0__$232 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 2048;
        __$r__$231 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l0__$232;
        return __$r__$231;
    }().home_text);
    return content__$223.join(", ");
}

function __$b85(__$ctx, __$ref) {
    var content__$256 = [];
    if (__$ctx.ctx.items) {
        content__$256 = __$ctx.ctx.items.map(function(item) {
            return {
                elem: "table_row",
                elemMods: {
                    visible: true
                },
                js: {
                    address: item.address_text
                },
                content: item
            };
        });
        content__$256.push({
            elem: "pagination_wrapper"
        });
    }
    return content__$256;
}

function __$b89(__$ctx, __$ref) {
    var js__$266 = function __$lb__$267() {
        var __$r__$268;
        var __$l4__$269 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 65536;
        __$r__$268 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l4__$269;
        return __$r__$268;
    }().js || {};
    var id__$270 = js__$266.id || 0;
    return [ {
        tag: "a",
        js: {
            id: id__$270
        },
        elem: "content",
        attrs: {
            href: function __$lb__$267() {
                var __$r__$271;
                var __$l0__$272 = __$ctx.__$a0;
                __$ctx.__$a0 = __$ctx.__$a0 | 65536;
                __$r__$271 = applyc(__$ctx, __$ref);
                __$ctx.__$a0 = __$l0__$272;
                return __$r__$271;
            }().link || "#"
        },
        content: [ {
            elem: "title",
            content: function __$lb__$267() {
                var __$r__$273;
                var __$l1__$274 = __$ctx.__$a0;
                __$ctx.__$a0 = __$ctx.__$a0 | 65536;
                __$r__$273 = applyc(__$ctx, __$ref);
                __$ctx.__$a0 = __$l1__$274;
                return __$r__$273;
            }().title
        }, {
            elem: "info",
            content: function __$lb__$267() {
                var __$r__$275;
                var __$l2__$276 = __$ctx.__$a0;
                __$ctx.__$a0 = __$ctx.__$a0 | 65536;
                __$r__$275 = applyc(__$ctx, __$ref);
                __$ctx.__$a0 = __$l2__$276;
                return __$r__$275;
            }().info_text || "&nbsp;"
        }, {
            elem: "status",
            content: function __$lb__$267() {
                var __$r__$277;
                var __$l3__$278 = __$ctx.__$a0;
                __$ctx.__$a0 = __$ctx.__$a0 | 65536;
                __$r__$277 = applyc(__$ctx, __$ref);
                __$ctx.__$a0 = __$l3__$278;
                return __$r__$277;
            }().status_text || "&nbsp;"
        } ]
    } ];
}

function __$b90(__$ctx, __$ref) {
    var cont__$279;
    if (!__$ctx.ctx.text) {
        cont__$279 = [ {
            block: "plain_text",
            tag: "span",
            mods: {
                bold: true,
                size: "11"
            },
            content: "Сталинские дома"
        }, {
            block: "plain_text",
            mods: {
                size: "11"
            },
            content: [ {
                tag: "p",
                content: "Этажность: 3-7"
            }, {
                tag: "p",
                content: "Текст про сталинские дома<br>Текст про сталинские дома на новой строке"
            } ]
        } ];
    } else {
        cont__$279 = {
            block: "plain_text",
            mods: {
                size: "11"
            },
            content: __$ctx.ctx.text
        };
    }
    return {
        block: "dropdown",
        tag: "span",
        mods: {
            switcher: "pseudo-icon",
            theme: "islands"
        },
        switcher: {
            block: "link",
            mods: {
                theme: "islands",
                pseudo: true,
                voprosique: true
            },
            content: "?"
        },
        popup: {
            block: "popup",
            mods: {
                closable: true
            },
            content: {
                elem: "content",
                content: cont__$279
            }
        }
    };
}

function __$b91(__$ctx, __$ref) {
    var c__$280, cell__$281;
    var content__$282 = [];
    var data__$283 = __$ctx.ctx.content;
    var columns__$284 = [ "checkbox", "image", "address", "object", "s", "floor", "san", "home", "price", "seller", "phone", "comment", "tools" ];
    columns__$284.map(function(column) {
        c__$280 = "";
        switch (column) {
          case "checkbox":
            c__$280 = {
                block: "checkbox",
                mods: {
                    theme: "islands",
                    size: "m",
                    "check-all": true
                },
                name: "ids"
            };
            break;

          case "address":
            c__$280 = data__$283.address_help;
            break;

          case "object":
            c__$280 = data__$283.object_help;
            break;

          case "s":
            c__$280 = data__$283.s_help;
            break;

          case "floor":
            c__$280 = data__$283.floor_help;
            break;

          case "san":
            c__$280 = data__$283.san_help;
            break;

          case "san":
            c__$280 = data__$283.san_help;
            break;

          case "home":
            c__$280 = data__$283.home_help;
            break;

          case "price":
            c__$280 = data__$283.price_help;
            break;

          case "seller":
            c__$280 = data__$283.seller_help;
            break;
        }
        cell__$281 = {
            elem: "cell",
            elemMods: {},
            content: c__$280 || "&nbsp;"
        };
        cell__$281.elemMods[column] = true;
        content__$282.push(cell__$281);
    });
    return content__$282;
}

function __$b92(__$ctx, __$ref) {
    var c__$285, cell__$286;
    var main__$287 = [];
    var js__$288 = __$ctx.ctx.js || {};
    var mods__$289 = __$ctx.ctx.mods || {};
    var __$r__$292;
    var __$l0__$293 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 131072;
    __$r__$292 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l0__$293;
    var data__$290 = __$r__$292;
    var id__$294 = data__$290.id || "";
    var type__$295 = data__$290.type || "";
    var isHeading__$296 = mods__$289.heading || false;
    var columns__$297 = [ "checkbox", "image", "address", "object", "s", "floor", "san", "home", "price", "seller", "phone", "comment", "tools" ];
    var maxLen__$298 = {
        addressStatusText: 35,
        addressTitle: 27,
        addressText: 27,
        addressHelp: 50,
        priceText: 9,
        sellerText: 12
    };
    var textElem__$299 = function(elem, text, maxLength, mods, tag) {
        return {
            tag: tag || undefined,
            elem: elem || "text",
            elemMods: mods || undefined,
            attrs: text && text.length > maxLength ? {
                title: text
            } : undefined,
            content: text && text.length > maxLength ? text.substr(0, maxLength) + "..." : text
        };
    };
    columns__$297.map(function(column) {
        c__$285 = "";
        switch (column) {
          case "checkbox":
            c__$285 = {
                block: "checkbox",
                mods: {
                    theme: "islands",
                    size: "m",
                    "check-item": true
                },
                name: "ids[]",
                val: js__$288.id
            };
            break;

          case "image":
            c__$285 = {
                elem: "image-holder",
                content: data__$290.image ? {
                    elem: "image",
                    tag: "img",
                    attrs: {
                        src: data__$290.image,
                        alt: ""
                    }
                } : "&nbsp;"
            };
            break;

          case "address":
            var isError__$300 = mods__$289.unpublished || mods__$289.expires;
            c__$285 = [ {
                elem: "top-text",
                content: textElem__$299("status-text", data__$290.status_text, maxLen__$298.addressStatusText, {
                    error: isError__$300
                }) || "&nbsp;"
            }, {
                elem: "main-text",
                content: [ textElem__$299("text", data__$290.address_text, maxLen__$298.addressText), textElem__$299("text-help", data__$290.address_help, maxLen__$298.addressHelp) ]
            } ];
            break;

          case "object":
            c__$285 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ {
                    elem: "text",
                    content: data__$290.object_text || "&nbsp;"
                }, {
                    elem: "text-help",
                    content: data__$290.object_help
                } ]
            } ];
            break;

          case "s":
            c__$285 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ {
                    elem: "text",
                    content: data__$290.s_text || "&nbsp;"
                }, {
                    elem: "text-help",
                    content: data__$290.s_help
                } ]
            } ];
            break;

          case "floor":
            c__$285 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ {
                    elem: "text",
                    content: data__$290.floor_text || "&nbsp;"
                }, {
                    elem: "text-help",
                    content: data__$290.floor_help
                } ]
            } ];
            break;

          case "san":
            c__$285 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ {
                    elem: "text",
                    content: data__$290.san_text || "&nbsp;"
                }, {
                    elem: "text-help",
                    content: data__$290.san_help
                } ]
            } ];
            break;

          case "home":
            var text__$301 = data__$290.home_voprosique == "?" && data__$290.home_voprosique_text ? [ data__$290.home_text, {
                block: "voprosique",
                text: data__$290.home_voprosique_text
            } ] : data__$290.home_text || "&nbsp;";
            c__$285 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ {
                    elem: "text",
                    content: text__$301
                }, {
                    elem: "text-help",
                    content: data__$290.home_help
                } ]
            } ];
            break;

          case "price":
            c__$285 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ textElem__$299("text", data__$290.price_text, maxLen__$298.priceText) || "&nbsp;", {
                    elem: "text-help",
                    content: data__$290.price_help
                } ]
            } ];
            break;

          case "seller":
            c__$285 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ textElem__$299("text", data__$290.seller_text, maxLen__$298.sellerText) || "&nbsp;", {
                    elem: "text-help",
                    content: data__$290.seller_help
                } ]
            } ];
            break;

          case "phone":
            var phones__$302 = (data__$290.phones || []).map(function(phone) {
                return {
                    elem: "text",
                    content: phone
                };
            });
            c__$285 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: phones__$302
            } ];
            break;

          case "comment":
            c__$285 = {
                elem: "main-text",
                content: {
                    elem: "comment",
                    content: data__$290.comment || "&nbsp;"
                }
            };
            break;

          case "tools":
            console.log(js__$288);
            c__$285 = {
                block: "objects-list-item-tools",
                js: {
                    itemId: js__$288.id || "",
                    itemType: js__$288.type || ""
                },
                flags: {
                    lists: !data__$290.isZK,
                    note: !data__$290.isZK
                },
                data: data__$290
            };
            break;
        }
        cell__$286 = {
            elem: "cell",
            tag: "span",
            elemMods: {},
            content: c__$285
        };
        cell__$286.elemMods[column] = true;
        main__$287.push(cell__$286);
    });
    return {
        elem: "row",
        content: {
            elem: "row-inner",
            content: main__$287
        }
    };
}

function __$b93(__$ctx, __$ref) {
    var js__$303 = __$ctx.ctx.js || {};
    var mods__$304 = __$ctx.ctx.mods || {};
    var link__$305 = __$ctx.ctx.link || "";
    var __$r__$308;
    var __$l0__$309 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 262144;
    __$r__$308 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l0__$309;
    var data__$306 = __$r__$308;
    var columns__$310 = [ "image", "address", "price", "seller", "comment", "tools" ];
    var main__$311 = [];
    var hasLink__$312 = !($$mods.unpublished || $$mods.expires) && link__$305;
    var maxLen__$313 = {
        addressStatusText: 50,
        addressTitle: 50,
        addressText: 50,
        addressHelp: 50
    };
    var cutText__$314 = function(text, maxLength) {
        return text && text.length > maxLength ? text.substr(0, maxLength) + "..." : text;
    };
    var textElem__$315 = function(elem, text, maxLength, mods, tag) {
        return {
            tag: tag || undefined,
            elem: elem || "text",
            elemMods: mods || undefined,
            attrs: text && text.length > maxLength ? {
                title: text
            } : undefined,
            content: text && text.length > maxLength ? text.substr(0, maxLength) + "..." : text
        };
    };
    columns__$310.map(function(column) {
        var cell__$316 = {
            elem: "cell",
            tag: "span",
            elemMods: {}
        };
        cell__$316.elemMods[column] = true;
        switch (column) {
          case "image":
            var image__$317 = data__$306.image ? {
                elem: "image",
                tag: "img",
                attrs: {
                    src: data__$306.image,
                    alt: ""
                }
            } : "&nbsp;";
            if (hasLink__$312) {
                image__$317 = {
                    elem: "image-link",
                    tag: "a",
                    attrs: {
                        href: link__$305
                    },
                    content: image__$317
                };
            }
            cell__$316.content = {
                elem: "image-holder",
                content: image__$317
            };
            break;

          case "address":
            var title__$318;
            if (hasLink__$312) {
                title__$318 = {
                    elem: "title",
                    content: {
                        elem: "title-link",
                        mix: {
                            block: "link"
                        },
                        tag: "a",
                        attrs: {
                            href: link__$305
                        },
                        content: cutText__$314(data__$306.address_title, maxLen__$313.addressTitle) || "&nbsp;"
                    }
                };
            } else {
                title__$318 = textElem__$315("title", data__$306.address_title, maxLen__$313.addressTitle) || "&nbsp;";
            }
            cell__$316.content = [ {
                elem: "top-text",
                content: [ textElem__$315("status-text", data__$306.status_text, maxLen__$313.addressStatusText) || "&nbsp;", mods__$304.unpublished ? {
                    elem: "error-text",
                    content: "объявление снято с публикации"
                } : "", mods__$304.expires ? {
                    elem: "error-text",
                    content: "срок публикации истек"
                } : "" ]
            }, {
                elem: "main-text",
                content: [ title__$318, textElem__$315("text", data__$306.address_text, maxLen__$313.addressText), textElem__$315("text-help", data__$306.address_help, maxLen__$313.addressHelp) ]
            } ];
            break;

          case "price":
            cell__$316.content = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ {
                    elem: "title",
                    content: data__$306.price_text || "&nbsp;"
                }, {
                    elem: "text-help",
                    content: data__$306.price_help || ""
                } ]
            } ];
            break;

          case "seller":
            cell__$316.content = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ {
                    elem: "title",
                    content: data__$306.seller_text || "&nbsp;"
                }, (data__$306.phones || []).map(function(phone) {
                    return {
                        elem: "text",
                        content: phone
                    };
                }) ]
            } ];
            break;

          case "comment":
            cell__$316.content = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ {
                    elem: "comment",
                    content: data__$306.comment || "&nbsp;"
                } ]
            } ];
            break;

          case "tools":
            cell__$316.content = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                block: "objects-list-item-tools",
                js: {
                    itemId: js__$303.id || "",
                    itemType: js__$303.type || ""
                },
                flags: {
                    lists: !data__$306.isZK,
                    note: !data__$306.isZK
                },
                data: data__$306
            } ];
            break;
        }
        main__$311.push(cell__$316);
    });
    return {
        elem: "row",
        content: {
            elem: "row-inner",
            content: main__$311
        }
    };
}

function __$b94(__$ctx, __$ref) {
    var ctx__$321 = __$ctx.ctx, mods__$322 = $$mods;
    return [ {
        elem: "box",
        content: {
            elem: "control",
            checked: mods__$322.checked,
            disabled: mods__$322.disabled,
            name: ctx__$321.name,
            val: ctx__$321.val
        }
    }, ctx__$321.text ];
}

function __$b95(__$ctx, __$ref) {
    if (!__$ctx.ctx.user_auth) {
        return [ {
            block: "help",
            attrs: {
                style: "padding: 10px;"
            },
            content: "Чтобы добавлять заметки к объектам, войдите на БН"
        }, {
            tag: "div",
            attrs: {
                style: "padding: 10px;"
            },
            content: [ {
                block: "button",
                attrs: {
                    href: "/",
                    style: "margin-right: 10px;"
                },
                mods: {
                    theme: "islands",
                    size: "m",
                    action: "primary"
                },
                content: [ {
                    elem: "text",
                    tag: "span",
                    content: "Войти"
                } ]
            }, {
                block: "button",
                attrs: {
                    href: "/"
                },
                mods: {
                    theme: "islands",
                    size: "m"
                },
                content: [ {
                    elem: "text",
                    tag: "span",
                    content: "Зарегистрироваться"
                } ]
            } ]
        }, {
            tag: "div",
            attrs: {
                style: "padding: 10px; background: #f2f2f2;"
            },
            content: [ {
                block: "help",
                content: "Вы сможете добавлять заметки к любым объектам. Заметки видны только вам."
            } ]
        } ];
    }
    return [ {
        elem: "form",
        tag: "form",
        attrs: {
            action: "",
            method: "post"
        },
        content: [ {
            elem: "row",
            attrs: {
                style: "margin-bottom: 5px;"
            },
            content: {
                block: "textarea",
                attrs: {
                    rows: 5
                },
                mods: {
                    theme: "islands",
                    size: "m",
                    width: "available"
                },
                placeholder: "Добавьте заметку",
                val: __$ctx.ctx.user_comment
            }
        }, {
            elem: "row",
            content: [ {
                block: "button",
                mods: {
                    theme: "islands",
                    size: "m",
                    type: "submit"
                },
                text: "Отправить"
            }, {
                block: "button",
                mix: {
                    block: "user_comments_in_search",
                    elem: "cancel"
                },
                attrs: {
                    style: "margin-left: 10px;",
                    type: "button"
                },
                mods: {
                    theme: "islands",
                    link: true
                },
                text: "отмена"
            } ]
        } ]
    }, {
        tag: "div",
        attrs: {
            style: "padding: 10px; background: #f2f2f2;"
        },
        content: [ {
            block: "help",
            content: "Заметки видны только вам"
        } ]
    } ];
}

function __$b96(__$ctx, __$ref) {
    if (!__$ctx.ctx.user_auth) {
        return [ {
            block: "help",
            attrs: {
                style: "padding: 10px;"
            },
            content: "Чтобы добавлять объекты в списки,<br>войдите на БН"
        }, {
            tag: "div",
            attrs: {
                style: "padding: 10px;"
            },
            content: [ {
                block: "button",
                attrs: {
                    href: "/",
                    style: "margin-right: 10px;"
                },
                mods: {
                    theme: "islands",
                    size: "m",
                    action: "primary"
                },
                content: [ {
                    elem: "text",
                    tag: "span",
                    content: "Войти"
                } ]
            }, {
                block: "button",
                attrs: {
                    href: "/"
                },
                mods: {
                    theme: "islands",
                    size: "m"
                },
                content: [ {
                    elem: "text",
                    tag: "span",
                    content: "Зарегистрироваться"
                } ]
            } ]
        }, {
            tag: "div",
            attrs: {
                style: "padding: 10px; background: #f2f2f2;"
            },
            content: [ {
                block: "help",
                content: "Вы сможете создавать собственные списки объектов. Распечатывать, скачивать и отправлять их по почте."
            } ]
        } ];
    }
    var val__$330 = __$ctx.ctx.hasOwnProperty("in_lists") ? __$ctx.ctx.in_lists : [];
    return [ {
        block: "help",
        attrs: {
            style: "padding: 10px;"
        },
        content: "Добавить в список"
    }, {
        elem: "lists_list",
        content: {
            block: "menu",
            mods: {
                theme: "islands",
                size: "m",
                mode: "check"
            },
            val: val__$330,
            content: (__$ctx.ctx.lists ? __$ctx.ctx.lists : []).map(function(item) {
                return {
                    block: "menu-item",
                    js: {
                        val: item.id,
                        count: item.count
                    },
                    val: item.id,
                    content: [ {
                        tag: "span",
                        block: "plain_text",
                        mods: {
                            size: "11"
                        },
                        content: item.name + "&nbsp;"
                    }, {
                        tag: "span",
                        block: "help",
                        content: item.count
                    } ]
                };
            })
        }
    }, {
        elem: "add_form",
        tag: "form",
        attrs: {
            action: "",
            method: "post"
        },
        content: [ {
            block: "control-group",
            content: [ {
                block: "input",
                attrs: {
                    style: "width: 130px;"
                },
                mods: {
                    theme: "islands",
                    size: "l"
                },
                placeholder: "Новый список"
            }, {
                block: "button",
                mods: {
                    theme: "islands",
                    size: "m",
                    type: "submit"
                },
                text: "Добавить"
            } ]
        } ]
    } ];
}

function __$b99(__$ctx, __$ref) {
    var auth__$342 = __$ctx.ctx.auth || false;
    if (!auth__$342) {
        var loginUrl__$343 = __$ctx.ctx.loginUrl || "";
        var registerUrl__$344 = __$ctx.ctx.registerUrl || "";
        return [ {
            block: "help",
            attrs: {
                style: "padding: 10px;"
            },
            content: "Чтобы добавлять объекты в списки,<br>войдите на БН"
        }, {
            tag: "div",
            attrs: {
                style: "padding: 10px;"
            },
            content: [ {
                block: "button",
                attrs: {
                    style: "margin-right: 10px;"
                },
                mods: {
                    theme: "islands",
                    size: "m",
                    action: "primary",
                    type: "link"
                },
                url: loginUrl__$343,
                content: [ {
                    elem: "text",
                    tag: "span",
                    content: "Войти"
                } ]
            }, {
                block: "button",
                mods: {
                    theme: "islands",
                    size: "m",
                    type: "link"
                },
                url: registerUrl__$344,
                content: [ {
                    elem: "text",
                    tag: "span",
                    content: "Зарегистрироваться"
                } ]
            } ]
        }, {
            tag: "div",
            attrs: {
                style: "padding: 10px; background: #f2f2f2;"
            },
            content: [ {
                block: "help",
                content: "Вы сможете создавать собственные списки объектов. Распечатывать, скачивать и отправлять их по почте."
            } ]
        } ];
    }
    var data__$345 = __$ctx.ctx.data || {};
    var userNote__$346 = data__$345.user_note || "";
    return [ {
        elem: "form",
        tag: "form",
        attrs: {
            action: "",
            method: "post"
        },
        content: [ {
            elem: "row",
            attrs: {
                style: "margin-bottom: 5px;"
            },
            content: {
                block: "textarea",
                mix: {
                    block: $$block,
                    elem: "text"
                },
                attrs: {
                    rows: 5
                },
                mods: {
                    theme: "islands",
                    size: "m",
                    width: "available"
                },
                placeholder: "Добавьте заметку",
                val: userNote__$346
            }
        }, {
            elem: "row",
            content: [ {
                block: "button",
                mix: {
                    block: $$block,
                    elem: "submit"
                },
                mods: {
                    theme: "islands",
                    size: "m",
                    type: "submit"
                },
                text: "Отправить"
            }, {
                block: "button",
                mix: {
                    block: $$block,
                    elem: "cancel"
                },
                attrs: {
                    style: "margin-left: 10px;",
                    type: "button"
                },
                mods: {
                    theme: "islands",
                    link: true
                },
                text: "Отмена"
            } ]
        } ]
    }, {
        tag: "div",
        attrs: {
            style: "padding: 10px; background: #f2f2f2;"
        },
        content: [ {
            block: "help",
            content: "Заметки видны только вам"
        } ]
    } ];
}

function __$b100(__$ctx, __$ref) {
    var items__$358 = function __$lb__$359() {
        var __$r__$360;
        var __$l0__$361 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 4194304;
        __$r__$360 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l0__$361;
        return __$r__$360;
    }().slice(1);
    return [ {
        block: "menu-item",
        mods: {
            group_title: true
        },
        content: __$ctx.ctx.title
    }, items__$358 ];
}

function __$b102(__$ctx, __$ref) {
    var auth__$396 = __$ctx.ctx.auth || false;
    if (!auth__$396) {
        var loginUrl__$397 = __$ctx.ctx.loginUrl || "";
        var registerUrl__$398 = __$ctx.ctx.registerUrl || "";
        return [ {
            block: "help",
            attrs: {
                style: "padding: 10px;"
            },
            content: "Чтобы добавлять объекты в списки,<br>войдите на БН"
        }, {
            tag: "div",
            attrs: {
                style: "padding: 10px;"
            },
            content: [ {
                block: "button",
                attrs: {
                    style: "margin-right: 10px;"
                },
                mods: {
                    theme: "islands",
                    size: "m",
                    action: "primary",
                    type: "link"
                },
                url: loginUrl__$397,
                content: [ {
                    elem: "text",
                    tag: "span",
                    content: "Войти"
                } ]
            }, {
                block: "button",
                mods: {
                    theme: "islands",
                    size: "m",
                    type: "link"
                },
                url: registerUrl__$398,
                content: [ {
                    elem: "text",
                    tag: "span",
                    content: "Зарегистрироваться"
                } ]
            } ]
        }, {
            tag: "div",
            attrs: {
                style: "padding: 10px; background: #f2f2f2;"
            },
            content: [ {
                block: "help",
                content: "Вы сможете создавать собственные списки объектов. Распечатывать, скачивать и отправлять их по почте."
            } ]
        } ];
    }
    var that__$399 = __$wrapThis(__$ctx);
    var val__$400 = __$ctx.ctx.inLists || [];
    return [ {
        block: "help",
        attrs: {
            style: "padding: 10px;"
        },
        content: "Добавить в список"
    }, {
        elem: "list",
        content: {
            block: "menu",
            mods: {
                theme: "islands",
                size: "m",
                mode: "check"
            },
            val: val__$400,
            content: (__$ctx.ctx.lists || []).map(function(item) {
                return {
                    block: "menu-item",
                    js: {
                        val: item.id,
                        count: item.count
                    },
                    val: item.id,
                    content: [ {
                        tag: "span",
                        block: "plain_text",
                        mods: {
                            size: "11"
                        },
                        content: item.name + "&nbsp;"
                    }, {
                        tag: "span",
                        block: "help",
                        content: item.count
                    } ]
                };
            })
        }
    }, {
        elem: "add-form",
        tag: "form",
        attrs: {
            action: "",
            method: "post"
        },
        content: [ {
            block: "control-group",
            content: [ {
                block: "input",
                attrs: {
                    style: "width: 130px;"
                },
                mods: {
                    theme: "islands",
                    size: "l"
                },
                placeholder: "Новый список"
            }, {
                block: "button",
                mods: {
                    theme: "islands",
                    size: "m",
                    type: "submit"
                },
                text: "Добавить"
            } ]
        } ]
    } ];
}

function __$b103(__$ctx, __$ref) {
    var content__$401;
    var close_button__$402 = {
        elem: "close_button",
        content: {
            block: "icon",
            mods: {
                action: "remove"
            }
        }
    };
    content__$401 = [];
    content__$401.push(function __$lb__$403() {
        var __$r__$404;
        var __$l0__$405 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 536870912;
        __$r__$404 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l0__$405;
        return __$r__$404;
    }());
    content__$401.push(close_button__$402);
    return content__$401;
}

function __$b105(__$ctx, __$ref) {
    var content__$409 = [];
    var data__$410 = __$ctx.ctx.data || {};
    var inLists__$411 = data__$410.in_lists || [];
    var userNote__$412 = data__$410.user_note || "";
    var isFavorite__$413 = !!data__$410.is_favorite;
    var isInList__$414 = !!inLists__$411.length || data__$410.is_in_lists;
    var isUserNote__$415 = !!userNote__$412.length || !!data__$410.is_user_note;
    var flags__$416 = __$ctx.ctx.flags || {};
    var showFavorite__$417 = typeof flags__$416.favorite != "undefined" ? flags__$416.favorite : true;
    var showLists__$418 = typeof flags__$416.lists != "undefined" ? flags__$416.lists : true;
    var showNote__$419 = typeof flags__$416.note != "undefined" ? flags__$416.note : true;
    if (showFavorite__$417) {
        content__$409.push({
            elem: "item",
            tag: "span",
            elemMods: {
                favorite: true,
                accept: isFavorite__$413
            },
            content: {
                block: "link",
                mods: {
                    pseudo: true,
                    theme: "islands"
                },
                content: {
                    block: "icon",
                    mix: {
                        block: $$block,
                        elem: "icon"
                    },
                    mods: {
                        action: isFavorite__$413 ? "star" : "star-o"
                    }
                }
            }
        });
    }
    if (showLists__$418) {
        content__$409.push({
            elem: "item",
            tag: "span",
            elemMods: {
                lists: true,
                accept: isInList__$414
            },
            content: {
                block: "link",
                mods: {
                    pseudo: true,
                    theme: "islands"
                },
                content: {
                    block: "icon",
                    mix: {
                        block: $$block,
                        elem: "icon"
                    },
                    mods: {
                        action: isInList__$414 ? "list" : "plus"
                    }
                }
            }
        });
    }
    if (showNote__$419) {
        content__$409.push({
            elem: "item",
            tag: "span",
            elemMods: {
                note: true,
                accept: isUserNote__$415
            },
            content: {
                block: "link",
                mods: {
                    pseudo: true,
                    theme: "islands"
                },
                content: {
                    block: "icon",
                    mix: {
                        block: $$block,
                        elem: "icon"
                    },
                    mods: {
                        action: isUserNote__$415 ? "comments-blue" : "comments"
                    }
                }
            }
        });
    }
    return content__$409;
}

function __$b106(__$ctx, __$ref) {
    var c__$420, cell__$421;
    var content__$422 = [];
    var data__$423 = __$ctx.ctx.content;
    var columns__$424 = [ "checkbox", "image", "address", "object", "s", "floor", "san", "home", "price", "seller", "phone", "comment", "tools" ];
    columns__$424.map(function(column) {
        c__$420 = "";
        switch (column) {
          case "checkbox":
            c__$420 = {
                block: "checkbox",
                mods: {
                    theme: "islands",
                    size: "m",
                    "check-all": true
                },
                name: "ids"
            };
            break;

          case "address":
            c__$420 = data__$423.address_help;
            break;

          case "object":
            c__$420 = data__$423.object_help;
            break;

          case "s":
            c__$420 = data__$423.s_help;
            break;

          case "floor":
            c__$420 = data__$423.floor_help;
            break;

          case "san":
            c__$420 = data__$423.san_help;
            break;

          case "san":
            c__$420 = data__$423.san_help;
            break;

          case "home":
            c__$420 = data__$423.home_help;
            break;

          case "price":
            c__$420 = data__$423.price_help;
            break;

          case "seller":
            c__$420 = data__$423.seller_help;
            break;
        }
        cell__$421 = {
            elem: "cell",
            elemMods: {},
            content: c__$420 || "&nbsp;"
        };
        cell__$421.elemMods[column] = true;
        content__$422.push(cell__$421);
    });
    return content__$422;
}

function __$b107(__$ctx, __$ref) {
    var c__$425, cell__$426;
    var main__$427 = [];
    var js__$428 = __$ctx.ctx.js || {};
    var mods__$429 = __$ctx.ctx.mods || {};
    var __$r__$432;
    var __$l0__$433 = __$ctx.__$a1;
    __$ctx.__$a1 = __$ctx.__$a1 | 1;
    __$r__$432 = applyc(__$ctx, __$ref);
    __$ctx.__$a1 = __$l0__$433;
    var data__$430 = __$r__$432;
    var id__$434 = data__$430.id || "";
    var type__$435 = data__$430.type || "";
    var isHeading__$436 = mods__$429.heading || false;
    var columns__$437 = [ "checkbox", "image", "address", "object", "s", "floor", "san", "home", "price", "seller", "phone", "comment", "tools" ];
    var maxLen__$438 = {
        addressStatusText: 35,
        addressTitle: 27,
        addressText: 27,
        addressHelp: 50,
        priceText: 9,
        sellerText: 12
    };
    var textElem__$439 = function(elem, text, maxLength, mods, tag) {
        return {
            tag: tag || undefined,
            elem: elem || "text",
            elemMods: mods || undefined,
            attrs: text && text.length > maxLength ? {
                title: text
            } : undefined,
            content: text && text.length > maxLength ? text.substr(0, maxLength) + "..." : text
        };
    };
    columns__$437.map(function(column) {
        c__$425 = "";
        switch (column) {
          case "checkbox":
            c__$425 = {
                block: "checkbox",
                mods: {
                    theme: "islands",
                    size: "m",
                    "check-item": true
                },
                name: "ids[]",
                val: js__$428.id
            };
            break;

          case "image":
            c__$425 = {
                elem: "image-holder",
                content: data__$430.image ? {
                    elem: "image",
                    tag: "img",
                    attrs: {
                        src: data__$430.image,
                        alt: ""
                    }
                } : "&nbsp;"
            };
            break;

          case "address":
            var isError__$440 = mods__$429.unpublished || mods__$429.expires;
            c__$425 = [ {
                elem: "top-text",
                content: textElem__$439("status-text", data__$430.status_text, maxLen__$438.addressStatusText, {
                    error: isError__$440
                }) || "&nbsp;"
            }, {
                elem: "main-text",
                content: [ textElem__$439("text", data__$430.address_text, maxLen__$438.addressText), textElem__$439("text-help", data__$430.address_help, maxLen__$438.addressHelp) ]
            } ];
            break;

          case "object":
            c__$425 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ {
                    elem: "text",
                    content: data__$430.object_text || "&nbsp;"
                }, {
                    elem: "text-help",
                    content: data__$430.object_help
                } ]
            } ];
            break;

          case "s":
            c__$425 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ {
                    elem: "text",
                    content: data__$430.s_text || "&nbsp;"
                }, {
                    elem: "text-help",
                    content: data__$430.s_help
                } ]
            } ];
            break;

          case "floor":
            c__$425 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ {
                    elem: "text",
                    content: data__$430.floor_text || "&nbsp;"
                }, {
                    elem: "text-help",
                    content: data__$430.floor_help
                } ]
            } ];
            break;

          case "san":
            c__$425 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ {
                    elem: "text",
                    content: data__$430.san_text || "&nbsp;"
                }, {
                    elem: "text-help",
                    content: data__$430.san_help
                } ]
            } ];
            break;

          case "home":
            var text__$441 = data__$430.home_voprosique == "?" && data__$430.home_voprosique_text ? [ data__$430.home_text, {
                block: "voprosique",
                text: data__$430.home_voprosique_text
            } ] : data__$430.home_text || "&nbsp;";
            c__$425 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ {
                    elem: "text",
                    content: text__$441
                }, {
                    elem: "text-help",
                    content: data__$430.home_help
                } ]
            } ];
            break;

          case "price":
            c__$425 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ textElem__$439("text", data__$430.price_text, maxLen__$438.priceText) || "&nbsp;", {
                    elem: "text-help",
                    content: data__$430.price_help
                } ]
            } ];
            break;

          case "seller":
            c__$425 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: [ textElem__$439("text", data__$430.seller_text, maxLen__$438.sellerText) || "&nbsp;", {
                    elem: "text-help",
                    content: data__$430.seller_help
                } ]
            } ];
            break;

          case "phone":
            var phones__$442 = (data__$430.phones || []).map(function(phone) {
                return {
                    elem: "text",
                    content: phone
                };
            });
            c__$425 = [ {
                elem: "top-text",
                content: "&nbsp;"
            }, {
                elem: "main-text",
                content: phones__$442
            } ];
            break;

          case "comment":
            c__$425 = {
                elem: "main-text",
                content: {
                    elem: "comment",
                    content: data__$430.comment || "&nbsp;"
                }
            };
            break;

          case "tools":
            c__$425 = {
                block: "objects-list-item-tools",
                js: {
                    itemId: js__$428.id || "",
                    itemType: js__$428.type || ""
                },
                flags: {
                    lists: !data__$430.isZK,
                    note: !data__$430.isZK
                },
                data: data__$430
            };
            break;
        }
        cell__$426 = {
            elem: "cell",
            tag: "span",
            elemMods: {},
            content: c__$425
        };
        cell__$426.elemMods[column] = true;
        main__$427.push(cell__$426);
    });
    return {
        elem: "row",
        content: {
            elem: "row-inner",
            content: main__$427
        }
    };
}

function __$b124(__$ctx, __$ref) {
    var item_id__$329 = __$ctx.ctx.item_id || 0;
    return {
        item_id: item_id__$329
    };
}

function __$b125(__$ctx, __$ref) {
    var item_id__$331 = __$ctx.ctx.item_id || 0;
    return {
        item_id: item_id__$331
    };
}

function __$b133(__$ctx, __$ref) {
    var ctx__$406 = __$ctx.ctx;
    return {
        mainOffset: ctx__$406.mainOffset,
        secondaryOffset: ctx__$406.secondaryOffset,
        viewportOffset: ctx__$406.viewportOffset,
        directions: ctx__$406.directions,
        zIndexGroupLevel: ctx__$406.zIndexGroupLevel
    };
}

function __$g0(__$ctx, __$ref) {
    var __$t = $$block;
    if (__$t === "link") {
        if (!$$elem) {
            var __$r = __$b3(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "button") {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["type"] === "link" && (__$ctx.__$a0 & 2) === 0) {
                var __$r = __$b4(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
            if ((!$$mods.type || $$mods.type === "submit") && (__$ctx.__$a0 & 2097152) === 0) {
                var __$r = __$b5(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
            var __$r = __$b6(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "address_list_item") {
        if (!$$elem) {
            return {
                role: "menuitem"
            };
        }
    } else if (__$t === "account-dashboard-list-item") {
        if (!$$elem && !($$mods.unpublished || $$mods.expires || $$mods.heading) && __$ctx.ctx.link) {
            return {
                href: __$ctx.ctx.link
            };
        }
    } else if (__$t === "checkbox") {
        if ($$elem === "control") {
            var __$r = __$b9(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "textarea") {
        if (!$$elem) {
            var __$r = __$b10(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "input") {
        if ($$elem === "control") {
            var __$r = __$b11(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "menu") {
        var __$t = $$elem;
        if (__$t === "group-title") {
            return {
                role: "presentation"
            };
        } else if (__$t === "group") {
            if ($$mods && typeof __$ctx.ctx.title !== "undefined" && $$mods["mode"] === "groupcheck" && (__$ctx.__$a0 & 8388608) === 0) {
                var __$r = __$ctx.extend(function __$lb__$362() {
                    var __$r__$363;
                    var __$l0__$364 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 8388608;
                    __$r__$363 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$364;
                    return __$r__$363;
                }(), {
                    "aria-label": __$ctx.ctx.title
                });
                if (__$r !== __$ref) return __$r;
            }
            return {
                role: "group"
            };
            if (typeof __$ctx.ctx.title !== "undefined" && (__$ctx.__$a0 & 33554432) === 0) {
                var __$r = __$ctx.extend(function __$lb__$368() {
                    var __$r__$369;
                    var __$l0__$370 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 33554432;
                    __$r__$369 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$370;
                    return __$r__$369;
                }(), {
                    "aria-label": __$ctx.ctx.title
                });
                if (__$r !== __$ref) return __$r;
            }
            return {
                role: "group"
            };
        }
        if (!$$elem) {
            var __$r = __$b17(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "menu-item") {
        if (!$$elem) {
            return {
                role: "menuitem"
            };
        }
    } else if (__$t === "icon") {
        if (!$$elem) {
            var __$r = __$b19(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "objects-list-item") {
        if (!$$elem && !($$mods.unpublished || $$mods.expires || $$mods.heading) && __$ctx.ctx.link) {
            return {
                href: __$ctx.ctx.link
            };
        }
    }
    return undefined;
    return __$ref;
}

function __$g1(__$ctx, __$ref) {
    var __$t = $$block;
    if (__$t === "link") {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["pseudo"] === true && !__$ctx.ctx.url) {
                return "span";
            }
            return "a";
        }
    } else if (__$t === "dropdown") {
        if ($$elem === "switcher") {
            return false;
        }
    } else if (__$t === "button") {
        if (!$$elem && $$mods && $$mods["type"] === "link") {
            return "a";
        }
        if ($$elem === "text") {
            return "span";
        }
        if (!$$elem) {
            return __$ctx.ctx.tag || "button";
        }
    } else if (__$t === "search_results_item") {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["embed"] === true) {
                return "div";
            }
            return "a";
        }
    } else if (__$t === "voprosique") {
        if (!$$elem) {
            return "span";
        }
    } else if (__$t === "account-dashboard-list-item") {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["heading"] === true) {
                return "div";
            }
            return "a";
        }
    } else if (__$t === "checkbox") {
        var __$t = $$elem;
        if (__$t === "control") {
            return "input";
        } else if (__$t === "box") {
            return "span";
        }
        if (!$$elem) {
            return "label";
        }
    } else if (__$t === "textarea") {
        if (!$$elem) {
            return "textarea";
        }
    } else if (__$t === "input") {
        var __$t = $$elem;
        if (__$t === "control") {
            return "input";
        } else if (__$t === "box") {
            return "span";
        }
        if (!$$elem) {
            return "span";
        }
    } else if (__$t === "ua") {
        if (!$$elem) {
            return "script";
        }
    } else if (__$t === "icon") {
        if (!$$elem) {
            return "i";
        }
    } else if (__$t === "objects-list-item") {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["heading"] === true) {
                return "div";
            }
            return "a";
        }
    }
    return undefined;
    return __$ref;
}

function __$wrapThis(ctx) {
    ctx._mode = $$mode;
    ctx.block = $$block;
    ctx.elem = $$elem;
    ctx.elemMods = $$elemMods;
    ctx.mods = $$mods;
    return ctx;
}

;
     return exports;
  }
  var defineAsGlobal = true;
  if(typeof exports === "object") {
    exports["BEMHTML"] = __bem_xjst({});
    defineAsGlobal = false;
  }
  if(typeof modules === "object") {
    modules.define("BEMHTML",
      function(provide) {
        provide(__bem_xjst({})) });
    defineAsGlobal = false;
  }
  defineAsGlobal && (g["BEMHTML"] = __bem_xjst({}));
})(this);
/* begin: ../../libs/bem-core/common.blocks/i-bem/i-bem.vanilla.js */
/**
 * @module i-bem
 */

modules.define(
    'i-bem',
    [
        'i-bem__internal',
        'inherit',
        'identify',
        'next-tick',
        'objects',
        'functions',
        'events'
    ],
    function(
        provide,
        INTERNAL,
        inherit,
        identify,
        nextTick,
        objects,
        functions,
        events) {

var undef,

    MOD_DELIM = INTERNAL.MOD_DELIM,
    ELEM_DELIM = INTERNAL.ELEM_DELIM,

    /**
     * Storage for block init functions
     * @private
     * @type Array
     */
    initFns = [],

    /**
     * Storage for block declarations (hash by block name)
     * @private
     * @type Object
     */
    blocks = {};

/**
 * Builds the name of the handler method for setting a modifier
 * @param {String} prefix
 * @param {String} modName Modifier name
 * @param {String} modVal Modifier value
 * @param {String} [elemName] Element name
 * @returns {String}
 */
function buildModFnName(prefix, modName, modVal, elemName) {
    return '__' + prefix +
        (elemName? '__elem_' + elemName : '') +
       '__mod' +
       (modName? '_' + modName : '') +
       (modVal? '_' + modVal : '');
}

/**
 * Transforms a hash of modifier handlers to methods
 * @param {String} prefix
 * @param {Object} modFns
 * @param {Object} props
 * @param {String} [elemName]
 */
function modFnsToProps(prefix, modFns, props, elemName) {
    if(functions.isFunction(modFns)) {
        props[buildModFnName(prefix, '*', '*', elemName)] = modFns;
    } else {
        var modName, modVal, modFn;
        for(modName in modFns) {
            if(modFns.hasOwnProperty(modName)) {
                modFn = modFns[modName];
                if(functions.isFunction(modFn)) {
                    props[buildModFnName(prefix, modName, '*', elemName)] = modFn;
                } else {
                    for(modVal in modFn) {
                        if(modFn.hasOwnProperty(modVal)) {
                            props[buildModFnName(prefix, modName, modVal, elemName)] = modFn[modVal];
                        }
                    }
                }
            }
        }
    }
}

function buildCheckMod(modName, modVal) {
    return modVal?
        Array.isArray(modVal)?
            function(block) {
                var i = 0, len = modVal.length;
                while(i < len)
                    if(block.hasMod(modName, modVal[i++]))
                        return true;
                return false;
            } :
            function(block) {
                return block.hasMod(modName, modVal);
            } :
        function(block) {
            return block.hasMod(modName);
        };
}

function convertModHandlersToMethods(props) {
    if(props.beforeSetMod) {
        modFnsToProps('before', props.beforeSetMod, props);
        delete props.beforeSetMod;
    }

    if(props.onSetMod) {
        modFnsToProps('after', props.onSetMod, props);
        delete props.onSetMod;
    }

    var elemName;
    if(props.beforeElemSetMod) {
        for(elemName in props.beforeElemSetMod) {
            if(props.beforeElemSetMod.hasOwnProperty(elemName)) {
                modFnsToProps('before', props.beforeElemSetMod[elemName], props, elemName);
            }
        }
        delete props.beforeElemSetMod;
    }

    if(props.onElemSetMod) {
        for(elemName in props.onElemSetMod) {
            if(props.onElemSetMod.hasOwnProperty(elemName)) {
                modFnsToProps('after', props.onElemSetMod[elemName], props, elemName);
            }
        }
        delete props.onElemSetMod;
    }
}

/**
 * @class BEM
 * @description Base block for creating BEM blocks
 * @augments events:Emitter
 * @exports
 */
var BEM = inherit(events.Emitter, /** @lends BEM.prototype */ {
    /**
     * @constructor
     * @private
     * @param {Object} mods Block modifiers
     * @param {Object} params Block parameters
     * @param {Boolean} [initImmediately=true]
     */
    __constructor : function(mods, params, initImmediately) {
        /**
         * Cache of block modifiers
         * @member {Object}
         * @private
         */
        this._modCache = mods || {};

        /**
         * Current modifiers in the stack
         * @member {Object}
         * @private
         */
        this._processingMods = {};

        /**
         * Block parameters, taking into account the defaults
         * @member {Object}
         * @readonly
         */
        this.params = objects.extend(this.getDefaultParams(), params);

        initImmediately !== false?
            this._init() :
            initFns.push(this._init, this);
    },

    /**
     * Initializes the block
     * @private
     */
    _init : function() {
        return this.setMod('js', 'inited');
    },

    /**
     * Adds an event handler
     * @param {String|Object} e Event type
     * @param {Object} [data] Additional data that the handler gets as e.data
     * @param {Function} fn Handler
     * @param {Object} [ctx] Handler context
     * @returns {BEM} this
     */
    on : function(e, data, fn, ctx) {
        if(typeof e === 'object' && (functions.isFunction(data) || functions.isFunction(fn))) { // mod change event
            e = this.__self._buildModEventName(e);
        }

        return this.__base.apply(this, arguments);
    },

    /**
     * Removes event handler or handlers
     * @param {String|Object} [e] Event type
     * @param {Function} [fn] Handler
     * @param {Object} [ctx] Handler context
     * @returns {BEM} this
     */
    un : function(e, fn, ctx) {
        if(typeof e === 'object' && functions.isFunction(fn)) { // mod change event
            e = this.__self._buildModEventName(e);
        }

        return this.__base.apply(this, arguments);
    },

    /**
     * Executes the block's event handlers and live event handlers
     * @protected
     * @param {String} e Event name
     * @param {Object} [data] Additional information
     * @returns {BEM} this
     */
    emit : function(e, data) {
        var isModJsEvent = false;
        if(typeof e === 'object' && !(e instanceof events.Event)) {
            isModJsEvent = e.modName === 'js';
            e = this.__self._buildModEventName(e);
        }

        if(isModJsEvent || this.hasMod('js', 'inited')) {
            this.__base(e = this._buildEvent(e), data);
            this._ctxEmit(e, data);
        }

        return this;
    },

    _ctxEmit : function(e, data) {
        this.__self.emit(e, data);
    },

    /**
     * Builds event
     * @private
     * @param {String|events:Event} e
     * @returns {events:Event}
     */
    _buildEvent : function(e) {
        typeof e === 'string'?
            e = new events.Event(e, this) :
            e.target || (e.target = this);

        return e;
    },

    /**
     * Checks whether a block or nested element has a modifier
     * @param {Object} [elem] Nested element
     * @param {String} modName Modifier name
     * @param {String|Boolean} [modVal] Modifier value. If defined and not of type String or Boolean, it is casted to String
     * @returns {Boolean}
     */
    hasMod : function(elem, modName, modVal) {
        var len = arguments.length,
            invert = false;

        if(len === 1) {
            modVal = '';
            modName = elem;
            elem = undef;
            invert = true;
        } else if(len === 2) {
            if(typeof elem === 'string') {
                modVal = modName;
                modName = elem;
                elem = undef;
            } else {
                modVal = '';
                invert = true;
            }
        }

        var typeModVal = typeof modVal;
        typeModVal === 'string' ||
            typeModVal === 'boolean' ||
            typeModVal === 'undefined' || (modVal = modVal.toString());

        var res = this.getMod(elem, modName) === modVal;
        return invert? !res : res;
    },

    /**
     * Returns the value of the modifier of the block/nested element
     * @param {Object} [elem] Nested element
     * @param {String} modName Modifier name
     * @returns {String} Modifier value
     */
    getMod : function(elem, modName) {
        var type = typeof elem;
        if(type === 'string' || type === 'undefined') { // elem either omitted or undefined
            modName = elem || modName;
            var modCache = this._modCache;
            return modName in modCache?
                modCache[modName] || '' :
                modCache[modName] = this._extractModVal(modName);
        }

        return this._getElemMod(modName, elem);
    },

    /**
     * Returns the value of the modifier of the nested element
     * @private
     * @param {String} modName Modifier name
     * @param {Object} elem Nested element
     * @param {Object} [elemName] Nested element name
     * @returns {String} Modifier value
     */
    _getElemMod : function(modName, elem, elemName) {
        return this._extractModVal(modName, elem, elemName);
    },

    /**
     * Returns values of modifiers of the block/nested element
     * @param {Object} [elem] Nested element
     * @param {String} [...modNames] Modifier names
     * @returns {Object} Hash of modifier values
     */
    getMods : function(elem) {
        var hasElem = elem && typeof elem !== 'string',
            modNames = [].slice.call(arguments, hasElem? 1 : 0),
            res = this._extractMods(modNames, hasElem? elem : undef);

        if(!hasElem) { // caching
            modNames.length?
                modNames.forEach(function(name) {
                    this._modCache[name] = res[name];
                }, this) :
                this._modCache = res;
        }

        return res;
    },

    /**
     * Sets the modifier for a block/nested element
     * @param {Object} [elem] Nested element
     * @param {String} modName Modifier name
     * @param {String|Boolean} [modVal=true] Modifier value. If not of type String or Boolean, it is casted to String
     * @returns {BEM} this
     */
    setMod : function(elem, modName, modVal) {
        if(typeof modVal === 'undefined') {
            if(typeof elem === 'string') { // if no elem
                modVal = typeof modName === 'undefined'?
                    true :  // e.g. setMod('focused')
                    modName; // e.g. setMod('js', 'inited')
                modName = elem;
                elem = undef;
            } else { // if elem
                modVal = true; // e.g. setMod(elem, 'focused')
            }
        }

        if(!elem || elem[0]) {
            if(modVal === false) {
                modVal = '';
            } else if(typeof modVal !== 'boolean') {
                modVal = modVal.toString();
            }

            var modId = (elem && elem[0]? identify(elem[0]) : '') + '_' + modName;

            if(this._processingMods[modId])
                return this;

            var elemName,
                curModVal = elem?
                    this._getElemMod(modName, elem, elemName = this.__self._extractElemNameFrom(elem)) :
                    this.getMod(modName);

            if(curModVal === modVal)
                return this;

            this._processingMods[modId] = true;

            var needSetMod = true,
                modFnParams = [modName, modVal, curModVal];

            elem && modFnParams.unshift(elem);

            var modVars = [['*', '*'], [modName, '*'], [modName, modVal]],
                prefixes = ['before', 'after'],
                i = 0, prefix, j, modVar;

            while(prefix = prefixes[i++]) {
                j = 0;
                while(modVar = modVars[j++]) {
                    if(this._callModFn(prefix, elemName, modVar[0], modVar[1], modFnParams) === false) {
                        needSetMod = false;
                        break;
                    }
                }

                if(!needSetMod) break;

                if(prefix === 'before') {
                    elem || (this._modCache[modName] = modVal); // cache only block mods
                    this._onSetMod(modName, modVal, curModVal, elem, elemName);
                }
            }

            this._processingMods[modId] = null;
            needSetMod && this._emitModChangeEvents(modName, modVal, curModVal, elem, elemName);
        }

        return this;
    },

    /**
     * Function after successfully changing the modifier of the block/nested element
     * @protected
     * @param {String} modName Modifier name
     * @param {String} modVal Modifier value
     * @param {String} oldModVal Old modifier value
     * @param {Object} [elem] Nested element
     * @param {String} [elemName] Element name
     */
    _onSetMod : function(modName, modVal, oldModVal, elem, elemName) {},

    _emitModChangeEvents : function(modName, modVal, oldModVal, elem, elemName) {
        var eventData = { modName : modName, modVal : modVal, oldModVal : oldModVal };
        elem && (eventData.elem = elem);
        this
            .emit({ modName : modName, modVal : '*', elem : elemName }, eventData)
            .emit({ modName : modName, modVal : modVal, elem : elemName }, eventData);
    },

    /**
     * Sets a modifier for a block/nested element, depending on conditions.
     * If the condition parameter is passed: when true, modVal1 is set; when false, modVal2 is set.
     * If the condition parameter is not passed: modVal1 is set if modVal2 was set, or vice versa.
     * @param {Object} [elem] Nested element
     * @param {String} modName Modifier name
     * @param {String} modVal1 First modifier value
     * @param {String} [modVal2] Second modifier value
     * @param {Boolean} [condition] Condition
     * @returns {BEM} this
     */
    toggleMod : function(elem, modName, modVal1, modVal2, condition) {
        if(typeof elem === 'string') { // if this is a block
            condition = modVal2;
            modVal2 = modVal1;
            modVal1 = modName;
            modName = elem;
            elem = undef;
        }

        if(typeof modVal1 === 'undefined') { // boolean mod
            modVal1 = true;
        }

        if(typeof modVal2 === 'undefined') {
            modVal2 = '';
        } else if(typeof modVal2 === 'boolean') {
            condition = modVal2;
            modVal2 = '';
        }

        var modVal = this.getMod(elem, modName);
        (modVal === modVal1 || modVal === modVal2) &&
            this.setMod(
                elem,
                modName,
                typeof condition === 'boolean'?
                    (condition? modVal1 : modVal2) :
                    this.hasMod(elem, modName, modVal1)? modVal2 : modVal1);

        return this;
    },

    /**
     * Removes a modifier from a block/nested element
     * @protected
     * @param {Object} [elem] Nested element
     * @param {String} modName Modifier name
     * @returns {BEM} this
     */
    delMod : function(elem, modName) {
        if(!modName) {
            modName = elem;
            elem = undef;
        }

        return this.setMod(elem, modName, '');
    },

    /**
     * Executes handlers for setting modifiers
     * @private
     * @param {String} prefix
     * @param {String} elemName Element name
     * @param {String} modName Modifier name
     * @param {String} modVal Modifier value
     * @param {Array} modFnParams Handler parameters
     */
    _callModFn : function(prefix, elemName, modName, modVal, modFnParams) {
        var modFnName = buildModFnName(prefix, modName, modVal, elemName);
        return this[modFnName]?
           this[modFnName].apply(this, modFnParams) :
           undef;
    },

    /**
     * Retrieves the value of the modifier
     * @private
     * @param {String} modName Modifier name
     * @param {Object} [elem] Element
     * @returns {String} Modifier value
     */
    _extractModVal : function(modName, elem) {
        return '';
    },

    /**
     * Retrieves name/value for a list of modifiers
     * @private
     * @param {Array} modNames Names of modifiers
     * @param {Object} [elem] Element
     * @returns {Object} Hash of modifier values by name
     */
    _extractMods : function(modNames, elem) {
        return {};
    },

    /**
     * Returns a block's default parameters
     * @protected
     * @returns {Object}
     */
    getDefaultParams : function() {
        return {};
    },

    /**
     * Deletes a block
     * @private
     */
    _destruct : function() {
        this.delMod('js');
    },

    /**
     * Executes given callback on next turn eventloop in block's context
     * @protected
     * @param {Function} fn callback
     * @returns {BEM} this
     */
    nextTick : function(fn) {
        var _this = this;
        nextTick(function() {
            _this.hasMod('js', 'inited') && fn.call(_this);
        });
        return this;
    }
}, /** @lends BEM */{

    _name : 'i-bem',

    /**
     * Storage for block declarations (hash by block name)
     * @type Object
     */
    blocks : blocks,

    /**
     * Declares blocks and creates a block class
     * @param {String|Object} decl Block name (simple syntax) or description
     * @param {String} decl.block|decl.name Block name
     * @param {String} [decl.baseBlock] Name of the parent block
     * @param {Array} [decl.baseMix] Mixed block names
     * @param {String} [decl.modName] Modifier name
     * @param {String|Array} [decl.modVal] Modifier value
     * @param {Object} [props] Methods
     * @param {Object} [staticProps] Static methods
     * @returns {Function}
     */
    decl : function(decl, props, staticProps) {
        // string as block
        typeof decl === 'string' && (decl = { block : decl });
        // inherit from itself
        if(arguments.length <= 2 &&
                typeof decl === 'object' &&
                (!decl || (typeof decl.block !== 'string' && typeof decl.modName !== 'string'))) {
            staticProps = props;
            props = decl;
            decl = {};
        }
        typeof decl.block === 'undefined' && (decl.block = this.getName());

        var baseBlock;
        if(typeof decl.baseBlock === 'undefined') {
            baseBlock = blocks[decl.block] || this;
        } else if(typeof decl.baseBlock === 'string') {
            baseBlock = blocks[decl.baseBlock];
            if(!baseBlock)
                throw('baseBlock "' + decl.baseBlock + '" for "' + decl.block + '" is undefined');
        } else {
            baseBlock = decl.baseBlock;
        }

        convertModHandlersToMethods(props || (props = {}));

        if(decl.modName) {
            var checkMod = buildCheckMod(decl.modName, decl.modVal);
            objects.each(props, function(prop, name) {
                functions.isFunction(prop) &&
                    (props[name] = function() {
                        var method;
                        if(checkMod(this)) {
                            method = prop;
                        } else {
                            var baseMethod = baseBlock.prototype[name];
                            baseMethod && baseMethod !== prop &&
                                (method = this.__base);
                        }
                        return method?
                            method.apply(this, arguments) :
                            undef;
                    });
            });
        }

        if(staticProps && typeof staticProps.live === 'boolean') {
            var live = staticProps.live;
            staticProps.live = function() {
                return live;
            };
        }

        var block, baseBlocks = baseBlock;
        if(decl.baseMix) {
            baseBlocks = [baseBlocks];
            decl.baseMix.forEach(function(mixedBlock) {
                if(!blocks[mixedBlock]) {
                    throw('mix block "' + mixedBlock + '" for "' + decl.block + '" is undefined');
                }
                baseBlocks.push(blocks[mixedBlock]);
            });
        }

        if(decl.block === baseBlock.getName()) {
            // makes a new "live" if the old one was already executed
            (block = inherit.self(baseBlocks, props, staticProps))._processLive(true);
        } else {
            (block = blocks[decl.block] = inherit(baseBlocks, props, staticProps))._name = decl.block;
            delete block._liveInitable;
        }

        return block;
    },

    declMix : function(block, props, staticProps) {
        convertModHandlersToMethods(props || (props = {}));
        return blocks[block] = inherit(props, staticProps);
    },

    /**
     * Processes a block's live properties
     * @private
     * @param {Boolean} [heedLive=false] Whether to take into account that the block already processed its live properties
     * @returns {Boolean} Whether the block is a live block
     */
    _processLive : function(heedLive) {
        return false;
    },

    /**
     * Factory method for creating an instance of the block named
     * @param {String|Object} block Block name or description
     * @param {Object} [params] Block parameters
     * @returns {BEM}
     */
    create : function(block, params) {
        typeof block === 'string' && (block = { block : block });

        return new blocks[block.block](block.mods, params);
    },

    /**
     * Returns the name of the current block
     * @returns {String}
     */
    getName : function() {
        return this._name;
    },

    /**
     * Adds an event handler
     * @param {String|Object} e Event type
     * @param {Object} [data] Additional data that the handler gets as e.data
     * @param {Function} fn Handler
     * @param {Object} [ctx] Handler context
     * @returns {Function} this
     */
    on : function(e, data, fn, ctx) {
        if(typeof e === 'object' && (functions.isFunction(data) || functions.isFunction(fn))) { // mod change event
            e = this._buildModEventName(e);
        }

        return this.__base.apply(this, arguments);
    },

    /**
     * Removes event handler or handlers
     * @param {String|Object} [e] Event type
     * @param {Function} [fn] Handler
     * @param {Object} [ctx] Handler context
     * @returns {Function} this
     */
    un : function(e, fn, ctx) {
        if(typeof e === 'object' && functions.isFunction(fn)) { // mod change event
            e = this._buildModEventName(e);
        }

        return this.__base.apply(this, arguments);
    },

    _buildModEventName : function(modEvent) {
        var res = MOD_DELIM + modEvent.modName + MOD_DELIM + (modEvent.modVal === false? '' : modEvent.modVal);
        modEvent.elem && (res = ELEM_DELIM + modEvent.elem + res);
        return res;
    },

    /**
     * Retrieves the name of an element nested in a block
     * @private
     * @param {Object} elem Nested element
     * @returns {String|undefined}
     */
    _extractElemNameFrom : function(elem) {},

    /**
     * Executes the block init functions
     * @private
     */
    _runInitFns : function() {
        if(initFns.length) {
            var fns = initFns,
                fn, i = 0;

            initFns = [];
            while(fn = fns[i]) {
                fn.call(fns[i + 1]);
                i += 2;
            }
        }
    }
});

provide(BEM);

});

/* end: ../../libs/bem-core/common.blocks/i-bem/i-bem.vanilla.js */
/* begin: ../../libs/bem-core/common.blocks/i-bem/__internal/i-bem__internal.vanilla.js */
/**
 * @module i-bem__internal
 */

modules.define('i-bem__internal', function(provide) {

var undef,
    /**
     * Separator for modifiers and their values
     * @const
     * @type String
     */
    MOD_DELIM = '_',

    /**
     * Separator between names of a block and a nested element
     * @const
     * @type String
     */
    ELEM_DELIM = '__',

    /**
     * Pattern for acceptable element and modifier names
     * @const
     * @type String
     */
    NAME_PATTERN = '[a-zA-Z0-9-]+';

function isSimple(obj) {
    var typeOf = typeof obj;
    return typeOf === 'string' || typeOf === 'number' || typeOf === 'boolean';
}

function buildModPostfix(modName, modVal) {
    var res = '';
    /* jshint eqnull: true */
    if(modVal != null && modVal !== false) {
        res += MOD_DELIM + modName;
        modVal !== true && (res += MOD_DELIM + modVal);
    }
    return res;
}

function buildBlockClass(name, modName, modVal) {
    return name + buildModPostfix(modName, modVal);
}

function buildElemClass(block, name, modName, modVal) {
    return buildBlockClass(block, undef, undef) +
        ELEM_DELIM + name +
        buildModPostfix(modName, modVal);
}

provide(/** @exports */{
    NAME_PATTERN : NAME_PATTERN,

    MOD_DELIM : MOD_DELIM,
    ELEM_DELIM : ELEM_DELIM,

    buildModPostfix : buildModPostfix,

    /**
     * Builds the class of a block or element with a modifier
     * @param {String} block Block name
     * @param {String} [elem] Element name
     * @param {String} [modName] Modifier name
     * @param {String|Number} [modVal] Modifier value
     * @returns {String} Class
     */
    buildClass : function(block, elem, modName, modVal) {
        if(isSimple(modName)) {
            if(!isSimple(modVal)) {
                modVal = modName;
                modName = elem;
                elem = undef;
            }
        } else if(typeof modName !== 'undefined') {
            modName = undef;
        } else if(elem && typeof elem !== 'string') {
            elem = undef;
        }

        if(!(elem || modName)) { // optimization for simple case
            return block;
        }

        return elem?
            buildElemClass(block, elem, modName, modVal) :
            buildBlockClass(block, modName, modVal);
    },

    /**
     * Builds full classes for a buffer or element with modifiers
     * @param {String} block Block name
     * @param {String} [elem] Element name
     * @param {Object} [mods] Modifiers
     * @returns {String} Class
     */
    buildClasses : function(block, elem, mods) {
        if(elem && typeof elem !== 'string') {
            mods = elem;
            elem = undef;
        }

        var res = elem?
            buildElemClass(block, elem, undef, undef) :
            buildBlockClass(block, undef, undef);

        if(mods) {
            for(var modName in mods) {
                if(mods.hasOwnProperty(modName) && mods[modName]) {
                    res += ' ' + (elem?
                        buildElemClass(block, elem, modName, mods[modName]) :
                        buildBlockClass(block, modName, mods[modName]));
                }
            }
        }

        return res;
    }
});

});

/* end: ../../libs/bem-core/common.blocks/i-bem/__internal/i-bem__internal.vanilla.js */
/* begin: ../../libs/bem-core/common.blocks/inherit/inherit.vanilla.js */
/**
 * @module inherit
 * @version 2.2.1
 * @author Filatov Dmitry <dfilatov@yandex-team.ru>
 * @description This module provides some syntax sugar for "class" declarations, constructors, mixins, "super" calls and static members.
 */

(function(global) {

var hasIntrospection = (function(){'_';}).toString().indexOf('_') > -1,
    emptyBase = function() {},
    hasOwnProperty = Object.prototype.hasOwnProperty,
    objCreate = Object.create || function(ptp) {
        var inheritance = function() {};
        inheritance.prototype = ptp;
        return new inheritance();
    },
    objKeys = Object.keys || function(obj) {
        var res = [];
        for(var i in obj) {
            hasOwnProperty.call(obj, i) && res.push(i);
        }
        return res;
    },
    extend = function(o1, o2) {
        for(var i in o2) {
            hasOwnProperty.call(o2, i) && (o1[i] = o2[i]);
        }

        return o1;
    },
    toStr = Object.prototype.toString,
    isArray = Array.isArray || function(obj) {
        return toStr.call(obj) === '[object Array]';
    },
    isFunction = function(obj) {
        return toStr.call(obj) === '[object Function]';
    },
    noOp = function() {},
    needCheckProps = true,
    testPropObj = { toString : '' };

for(var i in testPropObj) { // fucking ie hasn't toString, valueOf in for
    testPropObj.hasOwnProperty(i) && (needCheckProps = false);
}

var specProps = needCheckProps? ['toString', 'valueOf'] : null;

function getPropList(obj) {
    var res = objKeys(obj);
    if(needCheckProps) {
        var specProp, i = 0;
        while(specProp = specProps[i++]) {
            obj.hasOwnProperty(specProp) && res.push(specProp);
        }
    }

    return res;
}

function override(base, res, add) {
    var addList = getPropList(add),
        j = 0, len = addList.length,
        name, prop;
    while(j < len) {
        if((name = addList[j++]) === '__self') {
            continue;
        }
        prop = add[name];
        if(isFunction(prop) &&
                (!hasIntrospection || prop.toString().indexOf('.__base') > -1)) {
            res[name] = (function(name, prop) {
                var baseMethod = base[name]?
                        base[name] :
                        name === '__constructor'? // case of inheritance from plane function
                            res.__self.__parent :
                            noOp;
                return function() {
                    var baseSaved = this.__base;
                    this.__base = baseMethod;
                    var res = prop.apply(this, arguments);
                    this.__base = baseSaved;
                    return res;
                };
            })(name, prop);
        } else {
            res[name] = prop;
        }
    }
}

function applyMixins(mixins, res) {
    var i = 1, mixin;
    while(mixin = mixins[i++]) {
        res?
            isFunction(mixin)?
                inherit.self(res, mixin.prototype, mixin) :
                inherit.self(res, mixin) :
            res = isFunction(mixin)?
                inherit(mixins[0], mixin.prototype, mixin) :
                inherit(mixins[0], mixin);
    }
    return res || mixins[0];
}

/**
* Creates class
* @exports
* @param {Function|Array} [baseClass|baseClassAndMixins] class (or class and mixins) to inherit from
* @param {Object} prototypeFields
* @param {Object} [staticFields]
* @returns {Function} class
*/
function inherit() {
    var args = arguments,
        withMixins = isArray(args[0]),
        hasBase = withMixins || isFunction(args[0]),
        base = hasBase? withMixins? applyMixins(args[0]) : args[0] : emptyBase,
        props = args[hasBase? 1 : 0] || {},
        staticProps = args[hasBase? 2 : 1],
        res = props.__constructor || (hasBase && base.prototype.__constructor)?
            function() {
                return this.__constructor.apply(this, arguments);
            } :
            hasBase?
                function() {
                    return base.apply(this, arguments);
                } :
                function() {};

    if(!hasBase) {
        res.prototype = props;
        res.prototype.__self = res.prototype.constructor = res;
        return extend(res, staticProps);
    }

    extend(res, base);

    res.__parent = base;

    var basePtp = base.prototype,
        resPtp = res.prototype = objCreate(basePtp);

    resPtp.__self = resPtp.constructor = res;

    props && override(basePtp, resPtp, props);
    staticProps && override(base, res, staticProps);

    return res;
}

inherit.self = function() {
    var args = arguments,
        withMixins = isArray(args[0]),
        base = withMixins? applyMixins(args[0], args[0][0]) : args[0],
        props = args[1],
        staticProps = args[2],
        basePtp = base.prototype;

    props && override(basePtp, basePtp, props);
    staticProps && override(base, base, staticProps);

    return base;
};

var defineAsGlobal = true;
if(typeof exports === 'object') {
    module.exports = inherit;
    defineAsGlobal = false;
}

if(typeof modules === 'object') {
    modules.define('inherit', function(provide) {
        provide(inherit);
    });
    defineAsGlobal = false;
}

if(typeof define === 'function') {
    define(function(require, exports, module) {
        module.exports = inherit;
    });
    defineAsGlobal = false;
}

defineAsGlobal && (global.inherit = inherit);

})(this);

/* end: ../../libs/bem-core/common.blocks/inherit/inherit.vanilla.js */
/* begin: ../../libs/bem-core/common.blocks/identify/identify.vanilla.js */
/**
 * @module identify
 */

modules.define('identify', function(provide) {

var counter = 0,
    expando = '__' + (+new Date),
    get = function() {
        return 'uniq' + (++counter);
    };

provide(
    /**
     * Makes unique ID
     * @exports
     * @param {Object} obj Object that needs to be identified
     * @param {Boolean} [onlyGet=false] Return a unique value only if it had already been assigned before
     * @returns {String} ID
     */
    function(obj, onlyGet) {
        if(!obj) return get();

        var key = 'uniqueID' in obj? 'uniqueID' : expando; // Use when possible native uniqueID for elements in IE

        return onlyGet || key in obj?
            obj[key] :
            obj[key] = get();
    }
);

});

/* end: ../../libs/bem-core/common.blocks/identify/identify.vanilla.js */
/* begin: ../../libs/bem-core/common.blocks/next-tick/next-tick.vanilla.js */
/**
 * @module next-tick
 */

modules.define('next-tick', function(provide) {

/**
 * Executes given function on next tick.
 * @exports
 * @type Function
 * @param {Function} fn
 */

var global = this.global,
    fns = [],
    enqueueFn = function(fn) {
        return fns.push(fn) === 1;
    },
    callFns = function() {
        var fnsToCall = fns, i = 0, len = fns.length;
        fns = [];
        while(i < len) {
            fnsToCall[i++]();
        }
    };

    /* global process */
    if(typeof process === 'object' && process.nextTick) { // nodejs
        return provide(function(fn) {
            enqueueFn(fn) && process.nextTick(callFns);
        });
    }

    if(global.setImmediate) { // ie10
        return provide(function(fn) {
            enqueueFn(fn) && global.setImmediate(callFns);
        });
    }

    if(global.postMessage) { // modern browsers
        var isPostMessageAsync = true;
        if(global.attachEvent) {
            var checkAsync = function() {
                    isPostMessageAsync = false;
                };
            global.attachEvent('onmessage', checkAsync);
            global.postMessage('__checkAsync', '*');
            global.detachEvent('onmessage', checkAsync);
        }

        if(isPostMessageAsync) {
            var msg = '__nextTick' + (+new Date),
                onMessage = function(e) {
                    if(e.data === msg) {
                        e.stopPropagation && e.stopPropagation();
                        callFns();
                    }
                };

            global.addEventListener?
                global.addEventListener('message', onMessage, true) :
                global.attachEvent('onmessage', onMessage);

            return provide(function(fn) {
                enqueueFn(fn) && global.postMessage(msg, '*');
            });
        }
    }

    var doc = global.document;
    if('onreadystatechange' in doc.createElement('script')) { // ie6-ie8
        var head = doc.getElementsByTagName('head')[0],
            createScript = function() {
                var script = doc.createElement('script');
                script.onreadystatechange = function() {
                    script.parentNode.removeChild(script);
                    script = script.onreadystatechange = null;
                    callFns();
                };
                head.appendChild(script);
            };

        return provide(function(fn) {
            enqueueFn(fn) && createScript();
        });
    }

    provide(function(fn) { // old browsers
        enqueueFn(fn) && global.setTimeout(callFns, 0);
    });
});

/* end: ../../libs/bem-core/common.blocks/next-tick/next-tick.vanilla.js */
/* begin: ../../libs/bem-core/common.blocks/objects/objects.vanilla.js */
/**
 * @module objects
 * @description A set of helpers to work with JavaScript objects
 */

modules.define('objects', function(provide) {

var hasOwnProp = Object.prototype.hasOwnProperty;

provide(/** @exports */{
    /**
     * Extends a given target by
     * @param {Object} target object to extend
     * @param {Object} source
     * @returns {Object}
     */
    extend : function(target, source) {
        (typeof target !== 'object' || target === null) && (target = {});

        for(var i = 1, len = arguments.length; i < len; i++) {
            var obj = arguments[i];
            if(obj) {
                for(var key in obj) {
                    hasOwnProp.call(obj, key) && (target[key] = obj[key]);
                }
            }
        }

        return target;
    },

    /**
     * Check whether a given object is empty (contains no enumerable properties)
     * @param {Object} obj
     * @returns {Boolean}
     */
    isEmpty : function(obj) {
        for(var key in obj) {
            if(hasOwnProp.call(obj, key)) {
                return false;
            }
        }

        return true;
    },

    /**
     * Generic iterator function over object
     * @param {Object} obj object to iterate
     * @param {Function} fn callback
     * @param {Object} [ctx] callbacks's context
     */
    each : function(obj, fn, ctx) {
        for(var key in obj) {
            if(hasOwnProp.call(obj, key)) {
                ctx? fn.call(ctx, obj[key], key) : fn(obj[key], key);
            }
        }
    }
});

});

/* end: ../../libs/bem-core/common.blocks/objects/objects.vanilla.js */
/* begin: ../../libs/bem-core/common.blocks/functions/functions.vanilla.js */
/**
 * @module functions
 * @description A set of helpers to work with JavaScript functions
 */

modules.define('functions', function(provide) {

var toStr = Object.prototype.toString;

provide(/** @exports */{
    /**
     * Checks whether a given object is function
     * @param {*} obj
     * @returns {Boolean}
     */
    isFunction : function(obj) {
        return toStr.call(obj) === '[object Function]';
    },

    /**
     * Empty function
     */
    noop : function() {}
});

});

/* end: ../../libs/bem-core/common.blocks/functions/functions.vanilla.js */
/* begin: ../../libs/bem-core/common.blocks/events/events.vanilla.js */
/**
 * @module events
 */

modules.define(
    'events',
    ['identify', 'inherit', 'functions'],
    function(provide, identify, inherit, functions) {

var undef,
    storageExpando = '__' + (+new Date) + 'storage',
    getFnId = function(fn, ctx) {
        return identify(fn) + (ctx? identify(ctx) : '');
    },

    /**
     * @class Event
     * @exports events:Event
     */
    Event = inherit(/** @lends Event.prototype */{
        /**
         * @constructor
         * @param {String} type
         * @param {Object} target
         */
        __constructor : function(type, target) {
            /**
             * Type
             * @member {String} Event
             */
            this.type = type;

            /**
             * Target
             * @member {String} Event
             */
            this.target = target;

            /**
             * Result
             * @member {*}
             */
            this.result = undef;

            /**
             * Data
             * @member {*}
             */
            this.data = undef;

            this._isDefaultPrevented = false;
            this._isPropagationStopped = false;
        },

        /**
         * Prevents default action
         */
        preventDefault : function() {
            this._isDefaultPrevented = true;
        },

        /**
         * Returns whether is default action prevented
         * @returns {Boolean}
         */
        isDefaultPrevented : function() {
            return this._isDefaultPrevented;
        },

        /**
         * Stops propagation
         */
        stopPropagation : function() {
            this._isPropagationStopped = true;
        },

        /**
         * Returns whether is propagation stopped
         * @returns {Boolean}
         */
        isPropagationStopped : function() {
            return this._isPropagationStopped;
        }
    }),

    /**
     * @lends Emitter
     * @lends Emitter.prototype
     */
    EmitterProps = {
        /**
         * Adds an event handler
         * @param {String} e Event type
         * @param {Object} [data] Additional data that the handler gets as e.data
         * @param {Function} fn Handler
         * @param {Object} [ctx] Handler context
         * @returns {Emitter} this
         */
        on : function(e, data, fn, ctx, _special) {
            if(typeof e === 'string') {
                if(functions.isFunction(data)) {
                    ctx = fn;
                    fn = data;
                    data = undef;
                }

                var id = getFnId(fn, ctx),
                    storage = this[storageExpando] || (this[storageExpando] = {}),
                    eventTypes = e.split(' '), eventType,
                    i = 0, list, item,
                    eventStorage;

                while(eventType = eventTypes[i++]) {
                    eventStorage = storage[eventType] || (storage[eventType] = { ids : {}, list : {} });
                    if(!(id in eventStorage.ids)) {
                        list = eventStorage.list;
                        item = { fn : fn, data : data, ctx : ctx, special : _special };
                        if(list.last) {
                            list.last.next = item;
                            item.prev = list.last;
                        } else {
                            list.first = item;
                        }
                        eventStorage.ids[id] = list.last = item;
                    }
                }
            } else {
                for(var key in e) {
                    e.hasOwnProperty(key) && this.on(key, e[key], data, _special);
                }
            }

            return this;
        },

        /**
         * Adds a one time handler for the event.
         * Handler is executed only the next time the event is fired, after which it is removed.
         * @param {String} e Event type
         * @param {Object} [data] Additional data that the handler gets as e.data
         * @param {Function} fn Handler
         * @param {Object} [ctx] Handler context
         * @returns {Emitter} this
         */
        once : function(e, data, fn, ctx) {
            return this.on(e, data, fn, ctx, { once : true });
        },

        /**
         * Removes event handler or handlers
         * @param {String} [e] Event type
         * @param {Function} [fn] Handler
         * @param {Object} [ctx] Handler context
         * @returns {Emitter} this
         */
        un : function(e, fn, ctx) {
            if(typeof e === 'string' || typeof e === 'undefined') {
                var storage = this[storageExpando];
                if(storage) {
                    if(e) { // if event type was passed
                        var eventTypes = e.split(' '),
                            i = 0, eventStorage;
                        while(e = eventTypes[i++]) {
                            if(eventStorage = storage[e]) {
                                if(fn) {  // if specific handler was passed
                                    var id = getFnId(fn, ctx),
                                        ids = eventStorage.ids;
                                    if(id in ids) {
                                        var list = eventStorage.list,
                                            item = ids[id],
                                            prev = item.prev,
                                            next = item.next;

                                        if(prev) {
                                            prev.next = next;
                                        } else if(item === list.first) {
                                            list.first = next;
                                        }

                                        if(next) {
                                            next.prev = prev;
                                        } else if(item === list.last) {
                                            list.last = prev;
                                        }

                                        delete ids[id];
                                    }
                                } else {
                                    delete this[storageExpando][e];
                                }
                            }
                        }
                    } else {
                        delete this[storageExpando];
                    }
                }
            } else {
                for(var key in e) {
                    e.hasOwnProperty(key) && this.un(key, e[key], fn);
                }
            }

            return this;
        },

        /**
         * Fires event handlers
         * @param {String|events:Event} e Event
         * @param {Object} [data] Additional data
         * @returns {Emitter} this
         */
        emit : function(e, data) {
            var storage = this[storageExpando],
                eventInstantiated = false;

            if(storage) {
                var eventTypes = [typeof e === 'string'? e : e.type, '*'],
                    i = 0, eventType, eventStorage;
                while(eventType = eventTypes[i++]) {
                    if(eventStorage = storage[eventType]) {
                        var item = eventStorage.list.first,
                            lastItem = eventStorage.list.last,
                            res;
                        while(item) {
                            if(!eventInstantiated) { // instantiate Event only on demand
                                eventInstantiated = true;
                                typeof e === 'string' && (e = new Event(e));
                                e.target || (e.target = this);
                            }

                            e.data = item.data;
                            res = item.fn.apply(item.ctx || this, arguments);
                            if(typeof res !== 'undefined') {
                                e.result = res;
                                if(res === false) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                            }

                            item.special && item.special.once &&
                                this.un(e.type, item.fn, item.ctx);

                            if(item === lastItem) {
                                break;
                            }

                            item = item.next;
                        }
                    }
                }
            }

            return this;
        }
    },
    /**
     * @class Emitter
     * @exports events:Emitter
     */
    Emitter = inherit(
        EmitterProps,
        EmitterProps);

provide({
    Emitter : Emitter,
    Event : Event
});

});

/* end: ../../libs/bem-core/common.blocks/events/events.vanilla.js */
/* begin: ../../libs/bem-core/common.blocks/functions/__throttle/functions__throttle.vanilla.js */
/**
 * @module functions__throttle
 */

modules.define('functions__throttle', function(provide) {

var global = this.global;

provide(
    /**
     * Throttle given function
     * @exports
     * @param {Function} fn function to throttle
     * @param {Number} timeout throttle interval
     * @param {Boolean} [invokeAsap=true] invoke before first interval
     * @param {Object} [ctx] context of function invocation
     * @returns {Function} throttled function
     */
    function(fn, timeout, invokeAsap, ctx) {
        var typeofInvokeAsap = typeof invokeAsap;
        if(typeofInvokeAsap === 'undefined') {
            invokeAsap = true;
        } else if(arguments.length === 3 && typeofInvokeAsap !== 'boolean') {
            ctx = invokeAsap;
            invokeAsap = true;
        }

        var timer, args, needInvoke,
            wrapper = function() {
                if(needInvoke) {
                    fn.apply(ctx, args);
                    needInvoke = false;
                    timer = global.setTimeout(wrapper, timeout);
                } else {
                    timer = null;
                }
            };

        return function() {
            args = arguments;
            ctx || (ctx = this);
            needInvoke = true;

            if(!timer) {
                invokeAsap?
                    wrapper() :
                    timer = global.setTimeout(wrapper, timeout);
            }
        };
    });

});

/* end: ../../libs/bem-core/common.blocks/functions/__throttle/functions__throttle.vanilla.js */
/* begin: ../../libs/bem-core/common.blocks/querystring/querystring.vanilla.js */
/**
 * @module querystring
 * @description A set of helpers to work with query strings
 */

modules.define('querystring', ['querystring__uri'], function(provide, uri) {

var hasOwnProperty = Object.prototype.hasOwnProperty;

function addParam(res, name, val) {
    /* jshint eqnull: true */
    res.push(encodeURIComponent(name) + '=' + (val == null? '' : encodeURIComponent(val)));
}

provide(/** @exports */{
    /**
     * Parse a query string to an object
     * @param {String} str
     * @returns {Object}
     */
    parse : function(str) {
        if(!str) {
            return {};
        }

        return str.split('&').reduce(
            function(res, pair) {
                if(!pair) {
                    return res;
                }

                var eq = pair.indexOf('='),
                    name, val;

                if(eq >= 0) {
                    name = pair.substr(0, eq);
                    val = pair.substr(eq + 1);
                } else {
                    name = pair;
                    val = '';
                }

                name = uri.decodeURIComponent(name);
                val = uri.decodeURIComponent(val);

                hasOwnProperty.call(res, name)?
                    Array.isArray(res[name])?
                        res[name].push(val) :
                        res[name] = [res[name], val] :
                    res[name] = val;

                return res;
            },
            {});
    },

    /**
     * Serialize an object to a query string
     * @param {Object} obj
     * @returns {String}
     */
    stringify : function(obj) {
        return Object.keys(obj)
            .reduce(
                function(res, name) {
                    var val = obj[name];
                    Array.isArray(val)?
                        val.forEach(function(val) {
                            addParam(res, name, val);
                        }) :
                        addParam(res, name, val);
                    return res;
                },
                [])
            .join('&');
    }
});

});

/* end: ../../libs/bem-core/common.blocks/querystring/querystring.vanilla.js */
/* begin: ../../libs/bem-core/common.blocks/querystring/__uri/querystring__uri.vanilla.js */
/**
 * @module querystring__uri
 * @description A set of helpers to work with URI
 */

modules.define('querystring__uri',  function(provide) {

// Equivalency table for cp1251 and utf8.
var map = { '%D0' : '%D0%A0', '%C0' : '%D0%90', '%C1' : '%D0%91', '%C2' : '%D0%92', '%C3' : '%D0%93', '%C4' : '%D0%94', '%C5' : '%D0%95', '%A8' : '%D0%81', '%C6' : '%D0%96', '%C7' : '%D0%97', '%C8' : '%D0%98', '%C9' : '%D0%99', '%CA' : '%D0%9A', '%CB' : '%D0%9B', '%CC' : '%D0%9C', '%CD' : '%D0%9D', '%CE' : '%D0%9E', '%CF' : '%D0%9F', '%D1' : '%D0%A1', '%D2' : '%D0%A2', '%D3' : '%D0%A3', '%D4' : '%D0%A4', '%D5' : '%D0%A5', '%D6' : '%D0%A6', '%D7' : '%D0%A7', '%D8' : '%D0%A8', '%D9' : '%D0%A9', '%DA' : '%D0%AA', '%DB' : '%D0%AB', '%DC' : '%D0%AC', '%DD' : '%D0%AD', '%DE' : '%D0%AE', '%DF' : '%D0%AF', '%E0' : '%D0%B0', '%E1' : '%D0%B1', '%E2' : '%D0%B2', '%E3' : '%D0%B3', '%E4' : '%D0%B4', '%E5' : '%D0%B5', '%B8' : '%D1%91', '%E6' : '%D0%B6', '%E7' : '%D0%B7', '%E8' : '%D0%B8', '%E9' : '%D0%B9', '%EA' : '%D0%BA', '%EB' : '%D0%BB', '%EC' : '%D0%BC', '%ED' : '%D0%BD', '%EE' : '%D0%BE', '%EF' : '%D0%BF', '%F0' : '%D1%80', '%F1' : '%D1%81', '%F2' : '%D1%82', '%F3' : '%D1%83', '%F4' : '%D1%84', '%F5' : '%D1%85', '%F6' : '%D1%86', '%F7' : '%D1%87', '%F8' : '%D1%88', '%F9' : '%D1%89', '%FA' : '%D1%8A', '%FB' : '%D1%8B', '%FC' : '%D1%8C', '%FD' : '%D1%8D', '%FE' : '%D1%8E', '%FF' : '%D1%8F' };

function convert(str) {
    // Symbol code in cp1251 (hex) : symbol code in utf8)
    return str.replace(
        /%.{2}/g,
        function($0) {
            return map[$0] || $0;
        });
}

function decode(fn,  str) {
    var decoded = '';

    // Try/catch block for getting the encoding of the source string.
    // Error is thrown if a non-UTF8 string is input.
    // If the string was not decoded, it is returned without changes.
    try {
        decoded = fn(str);
    } catch (e1) {
        try {
            decoded = fn(convert(str));
        } catch (e2) {
            decoded = str;
        }
    }

    return decoded;
}

provide(/** @exports */{
    /**
     * Decodes URI string
     * @param {String} str
     * @returns {String}
     */
    decodeURI : function(str) {
        return decode(decodeURI,  str);
    },

    /**
     * Decodes URI component string
     * @param {String} str
     * @returns {String}
     */
    decodeURIComponent : function(str) {
        return decode(decodeURIComponent,  str);
    }
});

});

/* end: ../../libs/bem-core/common.blocks/querystring/__uri/querystring__uri.vanilla.js */
/* begin: ../../libs/bem-core/common.blocks/tick/tick.vanilla.js */
/**
 * @module tick
 * @description Helpers for polling anything
 */

modules.define('tick', ['inherit', 'events'], function(provide, inherit, events) {

var TICK_INTERVAL = 50,
    global = this.global,

    /**
     * @class Tick
     * @augments events:Emitter
     */
    Tick = inherit(events.Emitter, /** @lends Tick.prototype */{
        /**
         * @constructor
         */
        __constructor : function() {
            this._timer = null;
            this._isStarted = false;
        },

        /**
         * Starts polling
         */
        start : function() {
            if(!this._isStarted) {
                this._isStarted = true;
                this._scheduleTick();
            }
        },

        /**
         * Stops polling
         */
        stop : function() {
            if(this._isStarted) {
                this._isStarted = false;
                global.clearTimeout(this._timer);
            }
        },

        _scheduleTick : function() {
            var _this = this;
            this._timer = global.setTimeout(
                function() {
                    _this._onTick();
                },
                TICK_INTERVAL);
        },

        _onTick : function() {
            this.emit('tick');

            this._isStarted && this._scheduleTick();
        }
    });

provide(
    /**
     * @exports
     * @type Tick
     */
    new Tick());

});

/* end: ../../libs/bem-core/common.blocks/tick/tick.vanilla.js */
/* begin: ../../libs/bem-core/common.blocks/strings/__escape/strings__escape.vanilla.js */
/**
 * @module strings__escape
 * @description A set of string escaping functions
 */

modules.define('strings__escape', function(provide) {

var symbols = {
        '"' : '&quot;',
        '\'' : '&apos;',
        '&' : '&amp;',
        '<' : '&lt;',
        '>' : '&gt;'
    },
    mapSymbol = function(s) {
        return symbols[s] || s;
    },
    buildEscape = function(regexp) {
        regexp = new RegExp(regexp, 'g');
        return function(str) {
            return ('' + str).replace(regexp, mapSymbol);
        };
    };

provide(/** @exports */{
    /**
     * Escape string to use in XML
     * @type Function
     * @param {String} str
     * @returns {String}
     */
    xml : buildEscape('[&<>]'),

    /**
     * Escape string to use in HTML
     * @type Function
     * @param {String} str
     * @returns {String}
     */
    html : buildEscape('[&<>]'),

    /**
     * Escape string to use in attributes
     * @type Function
     * @param {String} str
     * @returns {String}
     */
    attr : buildEscape('["\'&<>]')
});

});

/* end: ../../libs/bem-core/common.blocks/strings/__escape/strings__escape.vanilla.js */
/* begin: ../../libs/bem-core/common.blocks/i-bem/__dom/i-bem__dom.js */
/**
 * @module i-bem__dom
 */

modules.define(
    'i-bem__dom',
    ['i-bem', 'i-bem__internal', 'identify', 'objects', 'functions', 'jquery', 'dom'],
    function(provide, BEM, INTERNAL, identify, objects, functions, $, dom) {

var undef,
    win = $(window),
    doc = $(document),

    /**
     * Storage for DOM elements by unique key
     * @type Object
     */
    uniqIdToDomElems = {},

    /**
     * Storage for blocks by unique key
     * @type Object
     */
    uniqIdToBlock = {},

    /**
     * Storage for DOM element's parent nodes
     * @type Object
     */
    domNodesToParents = {},

    /**
     * Storage for block parameters
     * @type Object
     */
    domElemToParams = {},

    /**
     * Storage for liveCtx event handlers
     * @type Object
     */
    liveEventCtxStorage = {},

    /**
     * Storage for liveClass event handlers
     * @type Object
     */
    liveClassEventStorage = {},

    blocks = BEM.blocks,

    BEM_CLASS = 'i-bem',
    BEM_SELECTOR = '.' + BEM_CLASS,
    BEM_PARAMS_ATTR = 'data-bem',

    NAME_PATTERN = INTERNAL.NAME_PATTERN,

    MOD_DELIM = INTERNAL.MOD_DELIM,
    ELEM_DELIM = INTERNAL.ELEM_DELIM,

    EXTRACT_MODS_RE = RegExp(
        '[^' + MOD_DELIM + ']' + MOD_DELIM + '(' + NAME_PATTERN + ')' +
        '(?:' + MOD_DELIM + '(' + NAME_PATTERN + '))?$'),

    buildModPostfix = INTERNAL.buildModPostfix,
    buildClass = INTERNAL.buildClass,

    reverse = Array.prototype.reverse;

/**
 * Initializes blocks on a DOM element
 * @param {jQuery} domElem DOM element
 * @param {String} uniqInitId ID of the "initialization wave"
 */
function initBlocks(domElem, uniqInitId) {
    var domNode = domElem[0],
        params = getParams(domNode),
        blockName;

    for(blockName in params)
        initBlock(
            blockName,
            domElem,
            processParams(params[blockName], blockName, uniqInitId));
}

/**
 * Initializes a specific block on a DOM element, or returns the existing block if it was already created
 * @param {String} blockName Block name
 * @param {jQuery} domElem DOM element
 * @param {Object} [params] Initialization parameters
 * @param {Boolean} [forceLive=false] Force live initialization
 * @param {Function} [callback] Handler to call after complete initialization
 */
function initBlock(blockName, domElem, params, forceLive, callback) {
    var domNode = domElem[0];

    params || (params = processParams(getBlockParams(domNode, blockName), blockName));

    var uniqId = params.uniqId,
        block = uniqIdToBlock[uniqId];

    if(block) {
        if(block.domElem.index(domNode) < 0) {
            block.domElem = block.domElem.add(domElem);
            objects.extend(block.params, params);
        }

        return block;
    }

    uniqIdToDomElems[uniqId] = uniqIdToDomElems[uniqId]?
        uniqIdToDomElems[uniqId].add(domElem) :
        domElem;

    var parentDomNode = domNode.parentNode;
    if(!parentDomNode || parentDomNode.nodeType === 11) { // jquery doesn't unique disconnected node
        $.unique(uniqIdToDomElems[uniqId]);
    }

    var blockClass = blocks[blockName] || DOM.decl(blockName, {}, { live : true }, true);
    if(!(blockClass._liveInitable = !!blockClass._processLive()) || forceLive || params.live === false) {
        forceLive && domElem.addClass(BEM_CLASS); // add css class for preventing memory leaks in further destructing

        block = new blockClass(uniqIdToDomElems[uniqId], params, !!forceLive);

        delete uniqIdToDomElems[uniqId];
        callback && callback.apply(block, Array.prototype.slice.call(arguments, 4));
        return block;
    }
}

/**
 * Processes and adds necessary block parameters
 * @param {Object} params Initialization parameters
 * @param {String} blockName Block name
 * @param {String} [uniqInitId] ID of the "initialization wave"
 */
function processParams(params, blockName, uniqInitId) {
    params.uniqId ||
        (params.uniqId = (params.id?
            blockName + '-id-' + params.id :
            identify()) + (uniqInitId || identify()));

    return params;
}

/**
 * Helper for searching for a DOM element using a selector inside the context, including the context itself
 * @param {jQuery} ctx Context
 * @param {String} selector CSS selector
 * @param {Boolean} [excludeSelf=false] Exclude context from search
 * @returns {jQuery}
 */
function findDomElem(ctx, selector, excludeSelf) {
    var res = ctx.find(selector);
    return excludeSelf?
       res :
       res.add(ctx.filter(selector));
}

/**
 * Returns parameters of a block's DOM element
 * @param {HTMLElement} domNode DOM node
 * @returns {Object}
 */
function getParams(domNode, blockName) {
    var uniqId = identify(domNode);
    return domElemToParams[uniqId] ||
        (domElemToParams[uniqId] = extractParams(domNode));
}

/**
 * Returns parameters of a block extracted from DOM node
 * @param {HTMLElement} domNode DOM node
 * @param {String} blockName
 * @returns {Object}
 */

function getBlockParams(domNode, blockName) {
    var params = getParams(domNode);
    return params[blockName] || (params[blockName] = {});
}

/**
 * Retrieves block parameters from a DOM element
 * @param {HTMLElement} domNode DOM node
 * @returns {Object}
 */
function extractParams(domNode) {
    var attrVal = domNode.getAttribute(BEM_PARAMS_ATTR);
    return attrVal? JSON.parse(attrVal) : {};
}

/**
 * Uncouple DOM node from the block. If this is the last node, then destroys the block.
 * @param {BEMDOM} block block
 * @param {HTMLElement} domNode DOM node
 */
function removeDomNodeFromBlock(block, domNode) {
    block.domElem.length === 1?
        block._destruct() :
        block.domElem = block.domElem.not(domNode);
}

/**
 * Fills DOM node's parent nodes to the storage
 * @param {jQuery} domElem
 */
function storeDomNodeParents(domElem) {
    domElem.each(function() {
        domNodesToParents[identify(this)] = this.parentNode;
    });
}

/**
 * Returns jQuery collection for provided HTML
 * @param {jQuery|String} html
 * @returns {jQuery}
 */
function getJqueryCollection(html) {
    return $(typeof html === 'string'? $.parseHTML(html, null, true) : html);
}

var DOM;

$(function() {

/**
 * @class BEMDOM
 * @description Base block for creating BEM blocks that have DOM representation
 * @exports
 */

DOM = BEM.decl('i-bem__dom',/** @lends BEMDOM.prototype */{
    /**
     * @constructor
     * @private
     * @param {jQuery} domElem DOM element that the block is created on
     * @param {Object} params Block parameters
     * @param {Boolean} [initImmediately=true]
     */
    __constructor : function(domElem, params, initImmediately) {
        /**
         * DOM elements of block
         * @member {jQuery}
         * @readonly
         */
        this.domElem = domElem;

        /**
         * Cache for names of events on DOM elements
         * @member {Object}
         * @private
         */
        this._eventNameCache = {};

        /**
         * Cache for elements
         * @member {Object}
         * @private
         */
        this._elemCache = {};

        /**
         * @member {String} Unique block ID
         * @private
         */
        this._uniqId = params.uniqId;

        uniqIdToBlock[this._uniqId] = this;

        /**
         * @member {Boolean} Flag for whether it's necessary to unbind from the document and window when destroying the block
         * @private
         */
        this._needSpecialUnbind = false;

        this.__base(null, params, initImmediately);
    },

    /**
     * Finds blocks inside the current block or its elements (including context)
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEMDOM[]}
     */
    findBlocksInside : function(elem, block) {
        return this._findBlocks('find', elem, block);
    },

    /**
     * Finds the first block inside the current block or its elements (including context)
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEMDOM}
     */
    findBlockInside : function(elem, block) {
        return this._findBlocks('find', elem, block, true);
    },

    /**
     * Finds blocks outside the current block or its elements (including context)
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEMDOM[]}
     */
    findBlocksOutside : function(elem, block) {
        return this._findBlocks('parents', elem, block);
    },

    /**
     * Finds the first block outside the current block or its elements (including context)
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEMDOM}
     */
    findBlockOutside : function(elem, block) {
        return this._findBlocks('closest', elem, block)[0] || null;
    },

    /**
     * Finds blocks on DOM elements of the current block or its elements
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEMDOM[]}
     */
    findBlocksOn : function(elem, block) {
        return this._findBlocks('', elem, block);
    },

    /**
     * Finds the first block on DOM elements of the current block or its elements
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEMDOM}
     */
    findBlockOn : function(elem, block) {
        return this._findBlocks('', elem, block, true);
    },

    _findBlocks : function(select, elem, block, onlyFirst) {
        if(!block) {
            block = elem;
            elem = undef;
        }

        var ctxElem = elem?
                (typeof elem === 'string'? this.findElem(elem) : elem) :
                this.domElem,
            isSimpleBlock = typeof block === 'string',
            blockName = isSimpleBlock? block : (block.block || block.blockName),
            selector = '.' +
                (isSimpleBlock?
                    buildClass(blockName) :
                    buildClass(blockName, block.modName, block.modVal)) +
                (onlyFirst? ':first' : ''),
            domElems = ctxElem.filter(selector);

        select && (domElems = domElems.add(ctxElem[select](selector)));

        if(onlyFirst) {
            return domElems[0]? initBlock(blockName, domElems.eq(0), undef, true)._init() : null;
        }

        var res = [],
            uniqIds = {};

        domElems.each(function(i, domElem) {
            var block = initBlock(blockName, $(domElem), undef, true)._init();
            if(!uniqIds[block._uniqId]) {
                uniqIds[block._uniqId] = true;
                res.push(block);
            }
        });

        return res;
    },

    /**
     * Adds an event handler for any DOM element
     * @protected
     * @param {jQuery} domElem DOM element where the event will be listened for
     * @param {String|Object} event Event name or event object
     * @param {Object} [data] Additional event data
     * @param {Function} fn Handler function, which will be executed in the block's context
     * @returns {BEMDOM} this
     */
    bindToDomElem : function(domElem, event, data, fn) {
        if(functions.isFunction(data)) {
            fn = data;
            data = undef;
        }

        fn?
            domElem.bind(
                this._buildEventName(event),
                data,
                $.proxy(fn, this)) :
            objects.each(event, function(fn, event) {
                this.bindToDomElem(domElem, event, data, fn);
            }, this);

        return this;
    },

    /**
     * Adds an event handler to the document
     * @protected
     * @param {String|Object} event Event name or event object
     * @param {Object} [data] Additional event data
     * @param {Function} fn Handler function, which will be executed in the block's context
     * @returns {BEMDOM} this
     */
    bindToDoc : function(event, data, fn) {
        this._needSpecialUnbind = true;
        return this.bindToDomElem(doc, event, data, fn);
    },

    /**
     * Adds an event handler to the window
     * @protected
     * @param {String|Object} event Event name or event object
     * @param {Object} [data] Additional event data
     * @param {Function} fn Handler function, which will be executed in the block's context
     * @returns {BEMDOM} this
     */
    bindToWin : function(event, data, fn) {
        this._needSpecialUnbind = true;
        return this.bindToDomElem(win, event, data, fn);
    },

    /**
     * Adds an event handler to the block's main DOM elements or its nested elements
     * @protected
     * @param {jQuery|String} [elem] Element
     * @param {String|Object} event Event name or event object
     * @param {Object} [data] Additional event data
     * @param {Function} fn Handler function, which will be executed in the block's context
     * @returns {BEMDOM} this
     */
    bindTo : function(elem, event, data, fn) {
        var len = arguments.length;
        if(len === 3) {
            if(functions.isFunction(data)) {
                fn = data;
                if(typeof event === 'object') {
                    data = event;
                    event = elem;
                    elem = this.domElem;
                }
            }
        } else if(len === 2) {
            if(functions.isFunction(event)) {
                fn = event;
                event = elem;
                elem = this.domElem;
            } else if(!(typeof elem === 'string' || elem instanceof $)) {
                data = event;
                event = elem;
                elem = this.domElem;
            }
        } else if(len === 1) {
            event = elem;
            elem = this.domElem;
        }

        typeof elem === 'string' && (elem = this.elem(elem));

        return this.bindToDomElem(elem, event, data, fn);
    },

    /**
     * Removes event handlers from any DOM element
     * @protected
     * @param {jQuery} domElem DOM element where the event was being listened for
     * @param {String|Object} event Event name or event object
     * @param {Function} [fn] Handler function
     * @returns {BEMDOM} this
     */
    unbindFromDomElem : function(domElem, event, fn) {
        if(typeof event === 'string') {
            event = this._buildEventName(event);
            fn?
                domElem.unbind(event, fn) :
                domElem.unbind(event);
        } else {
            objects.each(event, function(fn, event) {
                this.unbindFromDomElem(domElem, event, fn);
            }, this);
        }

        return this;
    },

    /**
     * Removes event handler from document
     * @protected
     * @param {String|Object} event Event name or event object
     * @param {Function} [fn] Handler function
     * @returns {BEMDOM} this
     */
    unbindFromDoc : function(event, fn) {
        return this.unbindFromDomElem(doc, event, fn);
    },

    /**
     * Removes event handler from window
     * @protected
     * @param {String|Object} event Event name or event object
     * @param {Function} [fn] Handler function
     * @returns {BEMDOM} this
     */
    unbindFromWin : function(event, fn) {
        return this.unbindFromDomElem(win, event, fn);
    },

    /**
     * Removes event handlers from the block's main DOM elements or its nested elements
     * @protected
     * @param {jQuery|String} [elem] Nested element
     * @param {String|Object} event Event name or event object
     * @param {Function} [fn] Handler function
     * @returns {BEMDOM} this
     */
    unbindFrom : function(elem, event, fn) {
        var argLen = arguments.length;
        if(argLen === 1) {
            event = elem;
            elem = this.domElem;
        } else if(argLen === 2 && functions.isFunction(event)) {
            fn = event;
            event = elem;
            elem = this.domElem;
        } else if(typeof elem === 'string') {
            elem = this.elem(elem);
        }

        return this.unbindFromDomElem(elem, event, fn);
    },

    /**
     * Builds a full name for an event
     * @private
     * @param {String} event Event name
     * @returns {String}
     */
    _buildEventName : function(event) {
        return event.indexOf(' ') > 1?
            event.split(' ').map(function(e) {
                return this._buildOneEventName(e);
            }, this).join(' ') :
            this._buildOneEventName(event);
    },

    /**
     * Builds a full name for a single event
     * @private
     * @param {String} event Event name
     * @returns {String}
     */
    _buildOneEventName : function(event) {
        var eventNameCache = this._eventNameCache;

        if(event in eventNameCache) return eventNameCache[event];

        var uniq = '.' + this._uniqId;

        if(event.indexOf('.') < 0) return eventNameCache[event] = event + uniq;

        var lego = '.bem_' + this.__self._name;

        return eventNameCache[event] = event.split('.').map(function(e, i) {
            return i === 0? e + lego : lego + '_' + e;
        }).join('') + uniq;
    },

    _ctxEmit : function(e, data) {
        this.__base.apply(this, arguments);

        var _this = this,
            storage = liveEventCtxStorage[_this.__self._buildCtxEventName(e.type)],
            ctxIds = {};

        storage && _this.domElem.each(function(_, ctx) {
            var counter = storage.counter;
            while(ctx && counter) {
                var ctxId = identify(ctx, true);
                if(ctxId) {
                    if(ctxIds[ctxId]) break;
                    var storageCtx = storage.ctxs[ctxId];
                    if(storageCtx) {
                        objects.each(storageCtx, function(handler) {
                            handler.fn.call(
                                handler.ctx || _this,
                                e,
                                data);
                        });
                        counter--;
                    }
                    ctxIds[ctxId] = true;
                }
                ctx = ctx.parentNode || domNodesToParents[ctxId];
            }
        });
    },

    /**
     * Sets a modifier for a block/nested element
     * @param {jQuery} [elem] Nested element
     * @param {String} modName Modifier name
     * @param {String} modVal Modifier value
     * @returns {BEMDOM} this
     */
    setMod : function(elem, modName, modVal) {
        if(elem && typeof modVal !== 'undefined' && elem.length > 1) {
            var _this = this;
            elem.each(function() {
                var item = $(this);
                item.__bemElemName = elem.__bemElemName;
                _this.setMod(item, modName, modVal);
            });
            return _this;
        }
        return this.__base(elem, modName, modVal);
    },

    /**
     * Retrieves modifier value from the DOM node's CSS class
     * @private
     * @param {String} modName Modifier name
     * @param {jQuery} [elem] Nested element
     * @param {String} [elemName] Name of the nested element
     * @returns {String} Modifier value
     */
    _extractModVal : function(modName, elem, elemName) {
        var domNode = (elem || this.domElem)[0],
            matches;

        domNode &&
            (matches = domNode.className
                .match(this.__self._buildModValRE(modName, elemName || elem)));

        return matches? matches[2] || true : '';
    },

    /**
     * Retrieves a name/value list of modifiers
     * @private
     * @param {Array} [modNames] Names of modifiers
     * @param {Object} [elem] Element
     * @returns {Object} Hash of modifier values by names
     */
    _extractMods : function(modNames, elem) {
        var res = {},
            extractAll = !modNames.length,
            countMatched = 0;

        ((elem || this.domElem)[0].className
            .match(this.__self._buildModValRE(
                '(' + (extractAll? NAME_PATTERN : modNames.join('|')) + ')',
                elem,
                'g')) || []).forEach(function(className) {
                    var matches = className.match(EXTRACT_MODS_RE);
                    res[matches[1]] = matches[2] || true;
                    ++countMatched;
                });

        // empty modifier values are not reflected in classes; they must be filled with empty values
        countMatched < modNames.length && modNames.forEach(function(modName) {
            modName in res || (res[modName] = '');
        });

        return res;
    },

    /**
     * Sets a modifier's CSS class for a block's DOM element or nested element
     * @private
     * @param {String} modName Modifier name
     * @param {String} modVal Modifier value
     * @param {String} oldModVal Old modifier value
     * @param {jQuery} [elem] Element
     * @param {String} [elemName] Element name
     */
    _onSetMod : function(modName, modVal, oldModVal, elem, elemName) {
        if(modName !== 'js' || modVal !== '') {
            var _self = this.__self,
                classPrefix = _self._buildModClassPrefix(modName, elemName),
                classRE = _self._buildModValRE(modName, elemName),
                needDel = modVal === '' || modVal === false;

            (elem || this.domElem).each(function() {
                var className = this.className,
                    modClassName = classPrefix;

                modVal !== true && (modClassName += MOD_DELIM + modVal);

                (oldModVal === true?
                    classRE.test(className) :
                    className.indexOf(classPrefix + MOD_DELIM) > -1)?
                        this.className = className.replace(
                            classRE,
                            (needDel? '' : '$1' + modClassName)) :
                        needDel || $(this).addClass(modClassName);
            });

            elemName && this
                .dropElemCache(elemName, modName, oldModVal)
                .dropElemCache(elemName, modName, modVal);
        }

        this.__base.apply(this, arguments);
    },

    /**
     * Finds elements nested in a block
     * @param {jQuery} [ctx=this.domElem] Element where search is being performed
     * @param {String} names Nested element name (or names separated by spaces)
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @param {Boolean} [strictMode=false]
     * @returns {jQuery} DOM elements
     */
    findElem : function(ctx, names, modName, modVal, strictMode) {
        if(typeof ctx === 'string') {
            strictMode = modVal;
            modVal = modName;
            modName = names;
            names = ctx;
            ctx = this.domElem;
        }

        if(typeof modName === 'boolean') {
            strictMode = modName;
            modName = undef;
        }

        var _self = this.__self,
            selector = '.' +
                names.split(' ').map(function(name) {
                    return _self.buildClass(name, modName, modVal);
                }).join(',.'),
            res = findDomElem(ctx, selector);

        return strictMode? this._filterFindElemResults(res) : res;
    },

    /**
     * Filters results of findElem helper execution in strict mode
     * @param {jQuery} res DOM elements
     * @returns {jQuery} DOM elements
     */
    _filterFindElemResults : function(res) {
        var blockSelector = this.buildSelector(),
            domElem = this.domElem;
        return res.filter(function() {
            return domElem.index($(this).closest(blockSelector)) > -1;
        });
    },

    /**
     * Finds elements nested in a block
     * @private
     * @param {String} name Nested element name
     * @param {String} [modName] Modifier name
     * @param {String|Boolean} [modVal] Modifier value
     * @returns {jQuery} DOM elements
     */
    _elem : function(name, modName, modVal) {
        var key = name + buildModPostfix(modName, modVal),
            res;

        if(!(res = this._elemCache[key])) {
            res = this._elemCache[key] = this.findElem(name, modName, modVal);
            res.__bemElemName = name;
        }

        return res;
    },

    /**
     * Lazy search for elements nested in a block (caches results)
     * @param {String} names Nested element name (or names separated by spaces)
     * @param {String} [modName] Modifier name
     * @param {String|Boolean} [modVal=true] Modifier value
     * @returns {jQuery} DOM elements
     */
    elem : function(names, modName, modVal) {
        if(arguments.length === 2) {
            modVal = true;
        }

        if(modName && typeof modName !== 'string') {
            modName.__bemElemName = names;
            return modName;
        }

        if(names.indexOf(' ') < 0) {
            return this._elem(names, modName, modVal);
        }

        var res = $([]);
        names.split(' ').forEach(function(name) {
            res = res.add(this._elem(name, modName, modVal));
        }, this);
        return res;
    },

    /**
     * Finds elements outside the context
     * @param {jQuery} ctx context
     * @param {String} elemName Element name
     * @returns {jQuery} DOM elements
     */
    closestElem : function(ctx, elemName) {
        return ctx.closest(this.buildSelector(elemName));
    },

    /**
     * Clearing the cache for elements
     * @protected
     * @param {String} [names] Nested element name (or names separated by spaces)
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @returns {BEMDOM} this
     */
    dropElemCache : function(names, modName, modVal) {
        if(names) {
            var modPostfix = buildModPostfix(modName, modVal);
            names.indexOf(' ') < 0?
                delete this._elemCache[names + modPostfix] :
                names.split(' ').forEach(function(name) {
                    delete this._elemCache[name + modPostfix];
                }, this);
        } else {
            this._elemCache = {};
        }

        return this;
    },

    /**
     * Retrieves parameters of a block element
     * @param {String|jQuery} elem Element
     * @returns {Object} Parameters
     */
    elemParams : function(elem) {
        var elemName;
        if(typeof elem === 'string') {
            elemName = elem;
            elem = this.elem(elem);
        } else {
            elemName = this.__self._extractElemNameFrom(elem);
        }

        return extractParams(elem[0])[this.__self.buildClass(elemName)] || {};
    },

    /**
     * Elemify given element
     * @param {jQuery} elem Element
     * @param {String} elemName Name
     * @returns {jQuery}
     */
    elemify : function(elem, elemName) {
        (elem = $(elem)).__bemElemName = elemName;
        return elem;
    },

    /**
     * Checks whether a DOM element is in a block
     * @protected
     * @param {jQuery} [ctx=this.domElem] Element where check is being performed
     * @param {jQuery} domElem DOM element
     * @returns {Boolean}
     */
    containsDomElem : function(ctx, domElem) {
        if(arguments.length === 1) {
            domElem = ctx;
            ctx = this.domElem;
        }

        return dom.contains(ctx, domElem);
    },

    /**
     * Builds a CSS selector corresponding to a block/element and modifier
     * @param {String} [elem] Element name
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @returns {String}
     */
    buildSelector : function(elem, modName, modVal) {
        return this.__self.buildSelector(elem, modName, modVal);
    },

    /**
     * Destructs a block
     * @private
     */
    _destruct : function() {
        var _this = this,
            _self = _this.__self;

        _this._needSpecialUnbind && _self.doc.add(_self.win).unbind('.' + _this._uniqId);

        _this.__base();

        delete uniqIdToBlock[_this.un()._uniqId];
    }

}, /** @lends BEMDOM */{

    /**
     * Scope
     * @type jQuery
     */
    scope : $('body'),

    /**
     * Document shortcut
     * @type jQuery
     */
    doc : doc,

    /**
     * Window shortcut
     * @type jQuery
     */
    win : win,

    /**
     * Processes a block's live properties
     * @private
     * @param {Boolean} [heedLive=false] Whether to take into account that the block already processed its live properties
     * @returns {Boolean} Whether the block is a live block
     */
    _processLive : function(heedLive) {
        var res = this._liveInitable;

        if('live' in this) {
            var noLive = typeof res === 'undefined';

            if(noLive ^ heedLive) { // should be opposite to each other
                res = this.live() !== false;

                var blockName = this.getName(),
                    origLive = this.live;

                this.live = function() {
                    return this.getName() === blockName?
                        res :
                        origLive.apply(this, arguments);
                };
            }
        }

        return res;
    },

    /**
     * Initializes blocks on a fragment of the DOM tree
     * @param {jQuery|String} [ctx=scope] Root DOM node
     * @returns {jQuery} ctx Initialization context
     */
    init : function(ctx) {
        if(typeof ctx === 'string') {
            ctx = $(ctx);
        } else if(!ctx) ctx = DOM.scope;

        var uniqInitId = identify();
        findDomElem(ctx, BEM_SELECTOR).each(function() {
            initBlocks($(this), uniqInitId);
        });

        this._runInitFns();

        return ctx;
    },

    /**
     * Destroys blocks on a fragment of the DOM tree
     * @param {jQuery} ctx Root DOM node
     * @param {Boolean} [excludeSelf=false] Exclude the main domElem
     */
    destruct : function(ctx, excludeSelf) {
        var _ctx;
        if(excludeSelf) {
            storeDomNodeParents(_ctx = ctx.children());
            ctx.empty();
        } else {
            storeDomNodeParents(_ctx = ctx);
            ctx.remove();
        }

        reverse.call(findDomElem(_ctx, BEM_SELECTOR)).each(function(_, domNode) {
            var params = getParams(domNode);
            objects.each(params, function(blockParams) {
                if(blockParams.uniqId) {
                    var block = uniqIdToBlock[blockParams.uniqId];
                    block?
                        removeDomNodeFromBlock(block, domNode) :
                        delete uniqIdToDomElems[blockParams.uniqId];
                }
            });
            delete domElemToParams[identify(domNode)];
        });

        // flush parent nodes storage that has been filled above
        domNodesToParents = {};
    },

    /**
     * Replaces a fragment of the DOM tree inside the context, destroying old blocks and intializing new ones
     * @param {jQuery} ctx Root DOM node
     * @param {jQuery|String} content New content
     * @returns {jQuery} Updated root DOM node
     */
    update : function(ctx, content) {
        this.destruct(ctx, true);
        return this.init(ctx.html(content));
    },

    /**
     * Changes a fragment of the DOM tree including the context and initializes blocks.
     * @param {jQuery} ctx Root DOM node
     * @param {jQuery|String} content Content to be added
     * @returns {jQuery} New content
     */
    replace : function(ctx, content) {
        var prev = ctx.prev(),
            parent = ctx.parent();

        content = getJqueryCollection(content);

        this.destruct(ctx);

        return this.init(prev.length?
            content.insertAfter(prev) :
            content.prependTo(parent));
    },

    /**
     * Adds a fragment of the DOM tree at the end of the context and initializes blocks
     * @param {jQuery} ctx Root DOM node
     * @param {jQuery|String} content Content to be added
     * @returns {jQuery} New content
     */
    append : function(ctx, content) {
        return this.init(getJqueryCollection(content).appendTo(ctx));
    },

    /**
     * Adds a fragment of the DOM tree at the beginning of the context and initializes blocks
     * @param {jQuery} ctx Root DOM node
     * @param {jQuery|String} content Content to be added
     * @returns {jQuery} New content
     */
    prepend : function(ctx, content) {
        return this.init(getJqueryCollection(content).prependTo(ctx));
    },

    /**
     * Adds a fragment of the DOM tree before the context and initializes blocks
     * @param {jQuery} ctx Contextual DOM node
     * @param {jQuery|String} content Content to be added
     * @returns {jQuery} New content
     */
    before : function(ctx, content) {
        return this.init(getJqueryCollection(content).insertBefore(ctx));
    },

    /**
     * Adds a fragment of the DOM tree after the context and initializes blocks
     * @param {jQuery} ctx Contextual DOM node
     * @param {jQuery|String} content Content to be added
     * @returns {jQuery} New content
     */
    after : function(ctx, content) {
        return this.init(getJqueryCollection(content).insertAfter(ctx));
    },

    /**
     * Builds a full name for a live event
     * @private
     * @param {String} e Event name
     * @returns {String}
     */
    _buildCtxEventName : function(e) {
        return this._name + ':' + e;
    },

    _liveClassBind : function(className, e, callback, invokeOnInit) {
        if(e.indexOf(' ') > -1) {
            e.split(' ').forEach(function(e) {
                this._liveClassBind(className, e, callback, invokeOnInit);
            }, this);
        } else {
            var storage = liveClassEventStorage[e],
                uniqId = identify(callback);

            if(!storage) {
                storage = liveClassEventStorage[e] = {};
                DOM.scope.bind(e, $.proxy(this._liveClassTrigger, this));
            }

            storage = storage[className] || (storage[className] = { uniqIds : {}, fns : [] });

            if(!(uniqId in storage.uniqIds)) {
                storage.fns.push({ uniqId : uniqId, fn : this._buildLiveEventFn(callback, invokeOnInit) });
                storage.uniqIds[uniqId] = storage.fns.length - 1;
            }
        }

        return this;
    },

    _liveClassUnbind : function(className, e, callback) {
        var storage = liveClassEventStorage[e];
        if(storage) {
            if(callback) {
                if(storage = storage[className]) {
                    var uniqId = identify(callback);
                    if(uniqId in storage.uniqIds) {
                        var i = storage.uniqIds[uniqId],
                            len = storage.fns.length - 1;
                        storage.fns.splice(i, 1);
                        while(i < len) storage.uniqIds[storage.fns[i++].uniqId] = i - 1;
                        delete storage.uniqIds[uniqId];
                    }
                }
            } else {
                delete storage[className];
            }
        }

        return this;
    },

    _liveClassTrigger : function(e) {
        var storage = liveClassEventStorage[e.type];
        if(storage) {
            var node = e.target, classNames = [];
            for(var className in storage) {
                classNames.push(className);
            }
            do {
                var nodeClassName = ' ' + node.className + ' ', i = 0;
                while(className = classNames[i++]) {
                    if(nodeClassName.indexOf(' ' + className + ' ') > -1) {
                        var j = 0, fns = storage[className].fns, fn, stopPropagationAndPreventDefault = false;
                        while(fn = fns[j++])
                            if(fn.fn.call($(node), e) === false) stopPropagationAndPreventDefault = true;

                        stopPropagationAndPreventDefault && e.preventDefault();
                        if(stopPropagationAndPreventDefault || e.isPropagationStopped()) return;

                        classNames.splice(--i, 1);
                    }
                }
            } while(classNames.length && (node = node.parentNode));
        }
    },

    _buildLiveEventFn : function(callback, invokeOnInit) {
        var _this = this;
        return function(e) {
            e.currentTarget = this;
            var args = [
                    _this._name,
                    $(this).closest(_this.buildSelector()),
                    undef,
                    true
                ],
                block = initBlock.apply(null, invokeOnInit? args.concat([callback, e]) : args);

            if(block && !invokeOnInit && callback)
                return callback.apply(block, arguments);
        };
    },

    /**
     * Helper for live initialization for an event on DOM elements of a block or its elements
     * @protected
     * @param {String} [elemName] Element name or names (separated by spaces)
     * @param {String} event Event name
     * @param {Function} [callback] Handler to call after successful initialization
     */
    liveInitOnEvent : function(elemName, event, callback) {
        return this.liveBindTo(elemName, event, callback, true);
    },

    /**
     * Helper for subscribing to live events on DOM elements of a block or its elements
     * @protected
     * @param {String|Object} [to] Description (object with modName, modVal, elem) or name of the element or elements (space-separated)
     * @param {String} event Event name
     * @param {Function} [callback] Handler
     */
    liveBindTo : function(to, event, callback, invokeOnInit) {
        if(!event || functions.isFunction(event)) {
            callback = event;
            event = to;
            to = undef;
        }

        if(!to || typeof to === 'string') {
            to = { elem : to };
        }

        if(to.elem && to.elem.indexOf(' ') > 0) {
            to.elem.split(' ').forEach(function(elem) {
                this._liveClassBind(
                    this.buildClass(elem, to.modName, to.modVal),
                    event,
                    callback,
                    invokeOnInit);
            }, this);
            return this;
        }

        return this._liveClassBind(
            this.buildClass(to.elem, to.modName, to.modVal),
            event,
            callback,
            invokeOnInit);
    },

    /**
     * Helper for unsubscribing from live events on DOM elements of a block or its elements
     * @protected
     * @param {String} [elem] Name of the element or elements (space-separated)
     * @param {String} event Event name
     * @param {Function} [callback] Handler
     */
    liveUnbindFrom : function(elem, event, callback) {

        if(!event || functions.isFunction(event)) {
            callback = event;
            event = elem;
            elem = undef;
        }

        if(elem && elem.indexOf(' ') > 1) {
            elem.split(' ').forEach(function(elem) {
                this._liveClassUnbind(
                    this.buildClass(elem),
                    event,
                    callback);
            }, this);
            return this;
        }

        return this._liveClassUnbind(
            this.buildClass(elem),
            event,
            callback);
    },

    /**
     * Helper for live initialization when a different block is initialized
     * @private
     * @param {String} event Event name
     * @param {String} blockName Name of the block that should trigger a reaction when initialized
     * @param {Function} callback Handler to be called after successful initialization in the new block's context
     * @param {String} findFnName Name of the method for searching
     */
    _liveInitOnBlockEvent : function(event, blockName, callback, findFnName) {
        var name = this._name;
        blocks[blockName].on(event, function(e) {
            var args = arguments,
                blocks = e.target[findFnName](name);

            callback && blocks.forEach(function(block) {
                callback.apply(block, args);
            });
        });
        return this;
    },

    /**
     * Helper for live initialization for a different block's event on the current block's DOM element
     * @protected
     * @param {String} event Event name
     * @param {String} blockName Name of the block that should trigger a reaction when initialized
     * @param {Function} callback Handler to be called after successful initialization in the new block's context
     */
    liveInitOnBlockEvent : function(event, blockName, callback) {
        return this._liveInitOnBlockEvent(event, blockName, callback, 'findBlocksOn');
    },

    /**
     * Helper for live initialization for a different block's event inside the current block
     * @protected
     * @param {String} event Event name
     * @param {String} blockName Name of the block that should trigger a reaction when initialized
     * @param {Function} [callback] Handler to be called after successful initialization in the new block's context
     */
    liveInitOnBlockInsideEvent : function(event, blockName, callback) {
        return this._liveInitOnBlockEvent(event, blockName, callback, 'findBlocksOutside');
    },

    /**
     * Adds a live event handler to a block, based on a specified element where the event will be listened for
     * @param {jQuery} [ctx] The element in which the event will be listened for
     * @param {String} e Event name
     * @param {Object} [data] Additional information that the handler gets as e.data
     * @param {Function} fn Handler
     * @param {Object} [fnCtx] Handler's context
     */
    on : function(ctx, e, data, fn, fnCtx) {
        return typeof ctx === 'object' && ctx.jquery?
            this._liveCtxBind(ctx, e, data, fn, fnCtx) :
            this.__base(ctx, e, data, fn);
    },

    /**
     * Removes the live event handler from a block, based on a specified element where the event was being listened for
     * @param {jQuery} [ctx] The element in which the event was being listened for
     * @param {String} e Event name
     * @param {Function} [fn] Handler
     * @param {Object} [fnCtx] Handler context
     */
    un : function(ctx, e, fn, fnCtx) {
        return typeof ctx === 'object' && ctx.jquery?
            this._liveCtxUnbind(ctx, e, fn, fnCtx) :
            this.__base(ctx, e, fn);
    },

    /**
     * Adds a live event handler to a block, based on a specified element where the event will be listened for
     * @private
     * @param {jQuery} ctx The element in which the event will be listened for
     * @param {String} e  Event name
     * @param {Object} [data] Additional information that the handler gets as e.data
     * @param {Function} fn Handler
     * @param {Object} [fnCtx] Handler context
     * @returns {BEMDOM} this
     */
    _liveCtxBind : function(ctx, e, data, fn, fnCtx) {
        if(typeof e === 'object') {
            if(functions.isFunction(data) || functions.isFunction(fn)) { // mod change event
                e = this._buildModEventName(e);
            } else {
                objects.each(e, function(fn, e) {
                    this._liveCtxBind(ctx, e, fn, data);
                }, this);
                return this;
            }
        }

        if(functions.isFunction(data)) {
            fnCtx = fn;
            fn = data;
            data = undef;
        }

        if(e.indexOf(' ') > -1) {
            e.split(' ').forEach(function(e) {
                this._liveCtxBind(ctx, e, data, fn, fnCtx);
            }, this);
        } else {
            var ctxE = this._buildCtxEventName(e),
                storage = liveEventCtxStorage[ctxE] ||
                    (liveEventCtxStorage[ctxE] = { counter : 0, ctxs : {} });

            ctx.each(function() {
                var ctxId = identify(this),
                    ctxStorage = storage.ctxs[ctxId];
                if(!ctxStorage) {
                    ctxStorage = storage.ctxs[ctxId] = {};
                    ++storage.counter;
                }
                ctxStorage[identify(fn) + (fnCtx? identify(fnCtx) : '')] = {
                    fn : fn,
                    data : data,
                    ctx : fnCtx
                };
            });
        }

        return this;
    },

    /**
     * Removes a live event handler from a block, based on a specified element where the event was being listened for
     * @private
     * @param {jQuery} ctx The element in which the event was being listened for
     * @param {String|Object} e Event name
     * @param {Function} [fn] Handler
     * @param {Object} [fnCtx] Handler context
     */
    _liveCtxUnbind : function(ctx, e, fn, fnCtx) {
        if(typeof e === 'object' && functions.isFunction(fn)) { // mod change event
            e = this._buildModEventName(e);
        }

        var storage = liveEventCtxStorage[e = this._buildCtxEventName(e)];

        if(storage) {
            ctx.each(function() {
                var ctxId = identify(this, true),
                    ctxStorage;
                if(ctxId && (ctxStorage = storage.ctxs[ctxId])) {
                    fn && delete ctxStorage[identify(fn) + (fnCtx? identify(fnCtx) : '')];
                    if(!fn || objects.isEmpty(ctxStorage)) {
                        storage.counter--;
                        delete storage.ctxs[ctxId];
                    }
                }
            });
            storage.counter || delete liveEventCtxStorage[e];
        }

        return this;
    },

    /**
     * Retrieves the name of an element nested in a block
     * @private
     * @param {jQuery} elem Nested element
     * @returns {String|undef}
     */
    _extractElemNameFrom : function(elem) {
        if(elem.__bemElemName) return elem.__bemElemName;

        var matches = elem[0].className.match(this._buildElemNameRE());
        return matches? matches[1] : undef;
    },

    /**
     * Builds a prefix for the CSS class of a DOM element or nested element of the block, based on modifier name
     * @private
     * @param {String} modName Modifier name
     * @param {jQuery|String} [elem] Element
     * @returns {String}
     */
    _buildModClassPrefix : function(modName, elem) {
        return this._name +
               (elem?
                   ELEM_DELIM + (typeof elem === 'string'? elem : this._extractElemNameFrom(elem)) :
                   '') +
               MOD_DELIM + modName;
    },

    /**
     * Builds a regular expression for extracting modifier values from a DOM element or nested element of a block
     * @private
     * @param {String} modName Modifier name
     * @param {jQuery|String} [elem] Element
     * @param {String} [quantifiers] Regular expression quantifiers
     * @returns {RegExp}
     */
    _buildModValRE : function(modName, elem, quantifiers) {
        return new RegExp(
            '(\\s|^)' +
            this._buildModClassPrefix(modName, elem) +
            '(?:' + MOD_DELIM + '(' + NAME_PATTERN + '))?(?=\\s|$)',
            quantifiers);
    },

    /**
     * Builds a regular expression for extracting names of elements nested in a block
     * @private
     * @returns {RegExp}
     */
    _buildElemNameRE : function() {
        return new RegExp(this._name + ELEM_DELIM + '(' + NAME_PATTERN + ')(?:\\s|$)');
    },

    /**
     * Builds a CSS class corresponding to the block/element and modifier
     * @param {String} [elem] Element name
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @returns {String}
     */
    buildClass : function(elem, modName, modVal) {
        return buildClass(this._name, elem, modName, modVal);
    },

    /**
     * Builds a CSS selector corresponding to the block/element and modifier
     * @param {String} [elem] Element name
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @returns {String}
     */
    buildSelector : function(elem, modName, modVal) {
        return '.' + this.buildClass(elem, modName, modVal);
    }
});

/**
 * Returns a block on a DOM element and initializes it if necessary
 * @param {String} blockName Block name
 * @param {Object} params Block parameters
 * @returns {BEMDOM}
 */
$.fn.bem = function(blockName, params) {
    return initBlock(blockName, this, params, true)._init();
};

provide(DOM);

});

});

(function() {

var origDefine = modules.define;

modules.define = function(name, deps, decl) {
    origDefine.apply(modules, arguments);

    name !== 'i-bem__dom_init' && arguments.length > 2 && ~deps.indexOf('i-bem__dom') &&
        modules.define('i-bem__dom_init', [name], function(provide, _, prev) {
            provide(prev);
        });
};

})();

/* end: ../../libs/bem-core/common.blocks/i-bem/__dom/i-bem__dom.js */
/* begin: ../../libs/bem-core/common.blocks/jquery/jquery.js */
/**
 * @module jquery
 * @description Provide jQuery (load if it does not exist).
 */

modules.define(
    'jquery',
    ['loader_type_js', 'jquery__config'],
    function(provide, loader, cfg) {

/* global jQuery */

function doProvide(preserveGlobal) {
    /**
     * @exports
     * @type Function
     */
    provide(preserveGlobal? jQuery : jQuery.noConflict(true));
}

typeof jQuery !== 'undefined'?
    doProvide(true) :
    loader(cfg.url, doProvide);
});

/* end: ../../libs/bem-core/common.blocks/jquery/jquery.js */
/* begin: ../../libs/bem-core/common.blocks/jquery/__config/jquery__config.js */
/**
 * @module jquery__config
 * @description Configuration for jQuery
 */

modules.define('jquery__config', function(provide) {

provide(/** @exports */{
    /**
     * URL for loading jQuery if it does not exist
     */
    url : '//yastatic.net/jquery/2.1.3/jquery.min.js'
});

});

/* end: ../../libs/bem-core/common.blocks/jquery/__config/jquery__config.js */
/* begin: ../../libs/bem-core/desktop.blocks/jquery/__config/jquery__config.js */
/**
 * @module jquery__config
 * @description Configuration for jQuery
 */

modules.define(
    'jquery__config',
    ['ua', 'objects'],
    function(provide, ua, objects, base) {

provide(
    ua.msie && parseInt(ua.version, 10) < 9?
        objects.extend(
            base,
            {
                url : '//yastatic.net/jquery/1.11.2/jquery.min.js'
            }) :
        base);

});

/* end: ../../libs/bem-core/desktop.blocks/jquery/__config/jquery__config.js */
/* begin: ../../libs/bem-core/desktop.blocks/ua/ua.js */
/**
 * @module ua
 * @description Detect some user agent features (works like jQuery.browser in jQuery 1.8)
 * @see http://code.jquery.com/jquery-migrate-1.1.1.js
 */

modules.define('ua', function(provide) {

var ua = navigator.userAgent.toLowerCase(),
    match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
        /(webkit)[ \/]([\w.]+)/.exec(ua) ||
        /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
        /(msie) ([\w.]+)/.exec(ua) ||
        ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
        [],
    matched = {
        browser : match[1] || '',
        version : match[2] || '0'
    },
    browser = {};

if(matched.browser) {
    browser[matched.browser] = true;
    browser.version = matched.version;
}

if(browser.chrome) {
    browser.webkit = true;
} else if(browser.webkit) {
    browser.safari = true;
}

/**
 * @exports
 * @type Object
 */
provide(browser);

});

/* end: ../../libs/bem-core/desktop.blocks/ua/ua.js */
/* begin: ../../libs/bem-core/common.blocks/dom/dom.js */
/**
 * @module dom
 * @description some DOM utils
 */

modules.define('dom', ['jquery'], function(provide, $) {

provide(/** @exports */{
    /**
     * Checks whether a DOM elem is in a context
     * @param {jQuery} ctx DOM elem where check is being performed
     * @param {jQuery} domElem DOM elem to check
     * @returns {Boolean}
     */
    contains : function(ctx, domElem) {
        var res = false;

        domElem.each(function() {
            var domNode = this;
            do {
                if(~ctx.index(domNode)) return !(res = true);
            } while(domNode = domNode.parentNode);

            return res;
        });

        return res;
    },

    /**
     * Returns current focused DOM elem in document
     * @returns {jQuery}
     */
    getFocused : function() {
        // "Error: Unspecified error." in iframe in IE9
        try { return $(document.activeElement); } catch(e) {}
    },

    /**
     * Checks whether a DOM element contains focus
     * @param {jQuery} domElem
     * @returns {Boolean}
     */
    containsFocus : function(domElem) {
        return this.contains(domElem, this.getFocused());
    },

    /**
    * Checks whether a browser currently can set focus on DOM elem
    * @param {jQuery} domElem
    * @returns {Boolean}
    */
    isFocusable : function(domElem) {
        var domNode = domElem[0];

        if(!domNode) return false;
        if(domNode.hasAttribute('tabindex')) return true;

        switch(domNode.tagName.toLowerCase()) {
            case 'iframe':
                return true;

            case 'input':
            case 'button':
            case 'textarea':
            case 'select':
                return !domNode.disabled;

            case 'a':
                return !!domNode.href;
        }

        return false;
    },

    /**
    * Checks whether a domElem is intended to edit text
    * @param {jQuery} domElem
    * @returns {Boolean}
    */
    isEditable : function(domElem) {
        var domNode = domElem[0];

        if(!domNode) return false;

        switch(domNode.tagName.toLowerCase()) {
            case 'input':
                var type = domNode.type;
                return (type === 'text' || type === 'password') && !domNode.disabled && !domNode.readOnly;

            case 'textarea':
                return !domNode.disabled && !domNode.readOnly;

            default:
                return domNode.contentEditable === 'true';
        }
    }
});

});

/* end: ../../libs/bem-core/common.blocks/dom/dom.js */
/* begin: ../../libs/bem-core/common.blocks/i-bem/__dom/_init/i-bem__dom_init.js */
/**
 * @module i-bem__dom_init
 */

modules.define('i-bem__dom_init', ['i-bem__dom'], function(provide, BEMDOM) {

provide(
    /**
     * Initializes blocks on a fragment of the DOM tree
     * @exports
     * @param {jQuery} [ctx=scope] Root DOM node
     * @returns {jQuery} ctx Initialization context
     */
    function(ctx) {
        return BEMDOM.init(ctx);
    });
});

/* end: ../../libs/bem-core/common.blocks/i-bem/__dom/_init/i-bem__dom_init.js */
/* begin: ../../libs/bem-components/common.blocks/button/button.js */
/**
 * @module button
 */

modules.define(
    'button',
    ['i-bem__dom', 'control', 'jquery', 'dom', 'functions', 'keyboard__codes'],
    function(provide, BEMDOM, Control, $, dom, functions, keyCodes) {

/**
 * @exports
 * @class button
 * @augments control
 * @bem
 */
provide(BEMDOM.decl({ block : this.name, baseBlock : Control }, /** @lends button.prototype */{
    beforeSetMod : {
        'pressed' : {
            'true' : function() {
                return !this.hasMod('disabled') || this.hasMod('togglable');
            }
        },

        'focused' : {
            '' : function() {
                return !this._isPointerPressInProgress;
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);
                this._isPointerPressInProgress = false;
                this._focusedByPointer = false;
            }
        },

        'disabled' : {
            'true' : function() {
                this.__base.apply(this, arguments);
                this.hasMod('togglable') || this.delMod('pressed');
            }
        },

        'focused' : {
            'true' : function() {
                this.__base.apply(this, arguments);
                this._focusedByPointer || this.setMod('focused-hard');
            },

            '' : function() {
                this.__base.apply(this, arguments);
                this.delMod('focused-hard');
            }
        }
    },

    /**
     * Returns text of the button
     * @returns {String}
     */
    getText : function() {
        return this.elem('text').text();
    },

    /**
     * Sets text to the button
     * @param {String} text
     * @returns {button} this
     */
    setText : function(text) {
        this.elem('text').text(text || '');
        return this;
    },

    _onFocus : function() {
        if(this._isPointerPressInProgress) return;

        this.__base.apply(this, arguments);
        this.bindTo('control', 'keydown', this._onKeyDown);
    },

    _onBlur : function() {
        this
            .unbindFrom('control', 'keydown', this._onKeyDown)
            .__base.apply(this, arguments);
    },

    _onPointerPress : function() {
        if(!this.hasMod('disabled')) {
            this._isPointerPressInProgress = true;
            this
                .bindToDoc('pointerrelease', this._onPointerRelease)
                .setMod('pressed');
        }
    },

    _onPointerRelease : function(e) {
        this._isPointerPressInProgress = false;
        this.unbindFromDoc('pointerrelease', this._onPointerRelease);

        if(dom.contains(this.elem('control'), $(e.target))) {
            this._focusedByPointer = true;
            this._focus();
            this._focusedByPointer = false;
            this
                ._updateChecked()
                .emit('click');
        } else {
            this._blur();
        }

        this.delMod('pressed');
    },

    _onKeyDown : function(e) {
        if(this.hasMod('disabled')) return;

        var keyCode = e.keyCode;
        if(keyCode === keyCodes.SPACE || keyCode === keyCodes.ENTER) {
            this
                .unbindFrom('control', 'keydown', this._onKeyDown)
                .bindTo('control', 'keyup', this._onKeyUp)
                ._updateChecked()
                .setMod('pressed');
        }
    },

    _onKeyUp : function(e) {
        this
            .unbindFrom('control', 'keyup', this._onKeyUp)
            .bindTo('control', 'keydown', this._onKeyDown)
            .delMod('pressed');

        e.keyCode === keyCodes.SPACE && this._doAction();

        this.emit('click');
    },

    _updateChecked : function() {
        this.hasMod('togglable') &&
            (this.hasMod('togglable', 'check')?
                this.toggleMod('checked') :
                this.setMod('checked'));

        return this;
    },

    _doAction : functions.noop
}, /** @lends button */{
    live : function() {
        this.liveBindTo('control', 'pointerpress', this.prototype._onPointerPress);
        return this.__base.apply(this, arguments);
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/button/button.js */
/* begin: ../../libs/bem-core/common.blocks/jquery/__event/_type/jquery__event_type_pointerclick.js */
/**
 * FastClick to jQuery module wrapper.
 * @see https://github.com/ftlabs/fastclick
 */
modules.define('jquery', function(provide, $) {

/**
 * FastClick: polyfill to remove click delays on browsers with touch UIs.
 *
 * @version 0.6.11
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */

/**
 * @class FastClick
 */

/**
 * Instantiate fast-clicking listeners on the specificed layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 */
function FastClick(layer) {
    'use strict';
    var oldOnClick, self = this;


    /**
     * Whether a click is currently being tracked.
     *
     * @type boolean
     */
    this.trackingClick = false;


    /**
     * Timestamp for when when click tracking started.
     *
     * @type number
     */
    this.trackingClickStart = 0;


    /**
     * The element being tracked for a click.
     *
     * @type EventTarget
     */
    this.targetElement = null;


    /**
     * X-coordinate of touch start event.
     *
     * @type number
     */
    this.touchStartX = 0;


    /**
     * Y-coordinate of touch start event.
     *
     * @type number
     */
    this.touchStartY = 0;


    /**
     * ID of the last touch, retrieved from Touch.identifier.
     *
     * @type number
     */
    this.lastTouchIdentifier = 0;


    /**
     * Touchmove boundary, beyond which a click will be cancelled.
     *
     * @type number
     */
    this.touchBoundary = 10;


    /**
     * The FastClick layer.
     *
     * @type Element
     */
    this.layer = layer;

    if (!layer || !layer.nodeType) {
        throw new TypeError('Layer must be a document node');
    }

    /** @type function() */
    this.onClick = function() { return FastClick.prototype.onClick.apply(self, arguments); };

    /** @type function() */
    this.onMouse = function() { return FastClick.prototype.onMouse.apply(self, arguments); };

    /** @type function() */
    this.onTouchStart = function() { return FastClick.prototype.onTouchStart.apply(self, arguments); };

    /** @type function() */
    this.onTouchMove = function() { return FastClick.prototype.onTouchMove.apply(self, arguments); };

    /** @type function() */
    this.onTouchEnd = function() { return FastClick.prototype.onTouchEnd.apply(self, arguments); };

    /** @type function() */
    this.onTouchCancel = function() { return FastClick.prototype.onTouchCancel.apply(self, arguments); };

    if (FastClick.notNeeded(layer)) {
        return;
    }

    // Set up event handlers as required
    if (this.deviceIsAndroid) {
        layer.addEventListener('mouseover', this.onMouse, true);
        layer.addEventListener('mousedown', this.onMouse, true);
        layer.addEventListener('mouseup', this.onMouse, true);
    }

    layer.addEventListener('click', this.onClick, true);
    layer.addEventListener('touchstart', this.onTouchStart, false);
    layer.addEventListener('touchmove', this.onTouchMove, false);
    layer.addEventListener('touchend', this.onTouchEnd, false);
    layer.addEventListener('touchcancel', this.onTouchCancel, false);

    // Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
    // which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
    // layer when they are cancelled.
    if (!Event.prototype.stopImmediatePropagation) {
        layer.removeEventListener = function(type, callback, capture) {
            var rmv = Node.prototype.removeEventListener;
            if (type === 'click') {
                rmv.call(layer, type, callback.hijacked || callback, capture);
            } else {
                rmv.call(layer, type, callback, capture);
            }
        };

        layer.addEventListener = function(type, callback, capture) {
            var adv = Node.prototype.addEventListener;
            if (type === 'click') {
                adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
                    if (!event.propagationStopped) {
                        callback(event);
                    }
                }), capture);
            } else {
                adv.call(layer, type, callback, capture);
            }
        };
    }

    // If a handler is already declared in the element's onclick attribute, it will be fired before
    // FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
    // adding it as listener.
    if (typeof layer.onclick === 'function') {

        // Android browser on at least 3.2 requires a new reference to the function in layer.onclick
        // - the old one won't work if passed to addEventListener directly.
        oldOnClick = layer.onclick;
        layer.addEventListener('click', function(event) {
            oldOnClick(event);
        }, false);
        layer.onclick = null;
    }
}


/**
 * Android requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;


/**
 * iOS requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS4 = FastClick.prototype.deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


/**
 * iOS 6.0(+?) requires the target element to be manually derived
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOSWithBadTarget = FastClick.prototype.deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);


/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
FastClick.prototype.needsClick = function(target) {
    'use strict';
    switch (target.nodeName.toLowerCase()) {

    // Don't send a synthetic click to disabled inputs (issue #62)
    case 'button':
    case 'select':
    case 'textarea':
        if (target.disabled) {
            return true;
        }

        break;
    case 'input':

        // File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
        if ((this.deviceIsIOS && target.type === 'file') || target.disabled) {
            return true;
        }

        break;
    case 'label':
    case 'video':
        return true;
    }

    return (/\bneedsclick\b/).test(target.className);
};


/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
FastClick.prototype.needsFocus = function(target) {
    'use strict';
    switch (target.nodeName.toLowerCase()) {
    case 'textarea':
        return true;
    case 'select':
        return !this.deviceIsAndroid;
    case 'input':
        switch (target.type) {
        case 'button':
        case 'checkbox':
        case 'file':
        case 'image':
        case 'radio':
        case 'submit':
            return false;
        }

        // No point in attempting to focus disabled inputs
        return !target.disabled && !target.readOnly;
    default:
        return (/\bneedsfocus\b/).test(target.className);
    }
};


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
FastClick.prototype.sendClick = function(targetElement, event) {
    'use strict';
    var clickEvent, touch;

    // On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
    if (document.activeElement && document.activeElement !== targetElement) {
        document.activeElement.blur();
    }

    touch = event.changedTouches[0];

    // Synthesise a click event, with an extra attribute so it can be tracked
    clickEvent = document.createEvent('MouseEvents');
    clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
    clickEvent.forwardedTouchEvent = true;
    targetElement.dispatchEvent(clickEvent);
};

FastClick.prototype.determineEventType = function(targetElement) {
    'use strict';

    //Issue #159: Android Chrome Select Box does not open with a synthetic click event
    if (this.deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
        return 'mousedown';
    }

    return 'click';
};


/**
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.focus = function(targetElement) {
    'use strict';
    var length;

    // Issue #160: on iOS 7, some input elements (e.g. date datetime) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
    if (this.deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time') {
        length = targetElement.value.length;
        targetElement.setSelectionRange(length, length);
    } else {
        targetElement.focus();
    }
};


/**
 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
 *
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.updateScrollParent = function(targetElement) {
    'use strict';
    var scrollParent, parentElement;

    scrollParent = targetElement.fastClickScrollParent;

    // Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
    // target element was moved to another parent.
    if (!scrollParent || !scrollParent.contains(targetElement)) {
        parentElement = targetElement;
        do {
            if (parentElement.scrollHeight > parentElement.offsetHeight) {
                scrollParent = parentElement;
                targetElement.fastClickScrollParent = parentElement;
                break;
            }

            parentElement = parentElement.parentElement;
        } while (parentElement);
    }

    // Always update the scroll top tracker if possible.
    if (scrollParent) {
        scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
    }
};


/**
 * @param {EventTarget} targetElement
 * @returns {Element|EventTarget}
 */
FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
    'use strict';

    // On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
    if (eventTarget.nodeType === Node.TEXT_NODE) {
        return eventTarget.parentNode;
    }

    return eventTarget;
};


/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchStart = function(event) {
    'use strict';
    var targetElement, touch, selection;

    // Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
    if (event.targetTouches.length > 1) {
        return true;
    }

    targetElement = this.getTargetElementFromEventTarget(event.target);
    touch = event.targetTouches[0];

    if (this.deviceIsIOS) {

        // Only trusted events will deselect text on iOS (issue #49)
        selection = window.getSelection();
        if (selection.rangeCount && !selection.isCollapsed) {
            return true;
        }

        if (!this.deviceIsIOS4) {

            // Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
            // when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
            // with the same identifier as the touch event that previously triggered the click that triggered the alert.
            // Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
            // immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
            if (touch.identifier === this.lastTouchIdentifier) {
                event.preventDefault();
                return false;
            }

            this.lastTouchIdentifier = touch.identifier;

            // If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
            // 1) the user does a fling scroll on the scrollable layer
            // 2) the user stops the fling scroll with another tap
            // then the event.target of the last 'touchend' event will be the element that was under the user's finger
            // when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
            // is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
            this.updateScrollParent(targetElement);
        }
    }

    this.trackingClick = true;
    this.trackingClickStart = event.timeStamp;
    this.targetElement = targetElement;

    this.touchStartX = touch.pageX;
    this.touchStartY = touch.pageY;

    // Prevent phantom clicks on fast double-tap (issue #36)
    if ((event.timeStamp - this.lastClickTime) < 200) {
        event.preventDefault();
    }

    return true;
};


/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.touchHasMoved = function(event) {
    'use strict';
    var touch = event.changedTouches[0], boundary = this.touchBoundary;

    if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
        return true;
    }

    return false;
};


/**
 * Update the last position.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchMove = function(event) {
    'use strict';
    if (!this.trackingClick) {
        return true;
    }

    // If the touch has moved, cancel the click tracking
    if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
        this.trackingClick = false;
        this.targetElement = null;
    }

    return true;
};


/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
FastClick.prototype.findControl = function(labelElement) {
    'use strict';

    // Fast path for newer browsers supporting the HTML5 control attribute
    if (labelElement.control !== undefined) {
        return labelElement.control;
    }

    // All browsers under test that support touch events also support the HTML5 htmlFor attribute
    if (labelElement.htmlFor) {
        return document.getElementById(labelElement.htmlFor);
    }

    // If no for attribute exists, attempt to retrieve the first labellable descendant element
    // the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
    return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchEnd = function(event) {
    'use strict';
    var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

    if (!this.trackingClick) {
        return true;
    }

    // Prevent phantom clicks on fast double-tap (issue #36)
    if ((event.timeStamp - this.lastClickTime) < 200) {
        this.cancelNextClick = true;
        return true;
    }

    // Reset to prevent wrong click cancel on input (issue #156).
    this.cancelNextClick = false;

    this.lastClickTime = event.timeStamp;

    trackingClickStart = this.trackingClickStart;
    this.trackingClick = false;
    this.trackingClickStart = 0;

    // On some iOS devices, the targetElement supplied with the event is invalid if the layer
    // is performing a transition or scroll, and has to be re-detected manually. Note that
    // for this to function correctly, it must be called *after* the event target is checked!
    // See issue #57; also filed as rdar://13048589 .
    if (this.deviceIsIOSWithBadTarget) {
        touch = event.changedTouches[0];

        // In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
        targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
        targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
    }

    targetTagName = targetElement.tagName.toLowerCase();
    if (targetTagName === 'label') {
        forElement = this.findControl(targetElement);
        if (forElement) {
            this.focus(targetElement);
            if (this.deviceIsAndroid) {
                return false;
            }

            targetElement = forElement;
        }
    } else if (this.needsFocus(targetElement)) {

        // Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
        // Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
        if ((event.timeStamp - trackingClickStart) > 100 || (this.deviceIsIOS && window.top !== window && targetTagName === 'input')) {
            this.targetElement = null;
            return false;
        }

        this.focus(targetElement);

        // Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
        if (!this.deviceIsIOS4 || targetTagName !== 'select') {
            this.targetElement = null;
            event.preventDefault();
        }

        return false;
    }

    if (this.deviceIsIOS && !this.deviceIsIOS4) {

        // Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
        // and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
        scrollParent = targetElement.fastClickScrollParent;
        if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
            return true;
        }
    }

    // Prevent the actual click from going though - unless the target node is marked as requiring
    // real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
    if (!this.needsClick(targetElement)) {
        event.preventDefault();
        this.sendClick(targetElement, event);
    }

    return false;
};


/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
FastClick.prototype.onTouchCancel = function() {
    'use strict';
    this.trackingClick = false;
    this.targetElement = null;
};


/**
 * Determine mouse events which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onMouse = function(event) {
    'use strict';

    // If a target element was never set (because a touch event was never fired) allow the event
    if (!this.targetElement) {
        return true;
    }

    if (event.forwardedTouchEvent) {
        return true;
    }

    // Programmatically generated events targeting a specific element should be permitted
    if (!event.cancelable) {
        return true;
    }

    // Derive and check the target element to see whether the mouse event needs to be permitted;
    // unless explicitly enabled, prevent non-touch click events from triggering actions,
    // to prevent ghost/doubleclicks.
    if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

        // Prevent any user-added listeners declared on FastClick element from being fired.
        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
        } else {

            // Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
            event.propagationStopped = true;
        }

        // Cancel the event
        event.stopPropagation();
        event.preventDefault();

        return false;
    }

    // If the mouse event is permitted, return true for the action to go through.
    return true;
};


/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onClick = function(event) {
    'use strict';
    var permitted;

    // It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
    if (this.trackingClick) {
        this.targetElement = null;
        this.trackingClick = false;
        return true;
    }

    // Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
    if (event.target.type === 'submit' && event.detail === 0) {
        return true;
    }

    permitted = this.onMouse(event);

    // Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
    if (!permitted) {
        this.targetElement = null;
    }

    // If clicks are permitted, return true for the action to go through.
    return permitted;
};


/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function() {
    'use strict';
    var layer = this.layer;

    if (this.deviceIsAndroid) {
        layer.removeEventListener('mouseover', this.onMouse, true);
        layer.removeEventListener('mousedown', this.onMouse, true);
        layer.removeEventListener('mouseup', this.onMouse, true);
    }

    layer.removeEventListener('click', this.onClick, true);
    layer.removeEventListener('touchstart', this.onTouchStart, false);
    layer.removeEventListener('touchmove', this.onTouchMove, false);
    layer.removeEventListener('touchend', this.onTouchEnd, false);
    layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};


/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.notNeeded = function(layer) {
    'use strict';
    var metaViewport;

    // Devices that don't support touch don't need FastClick
    if (typeof window.ontouchstart === 'undefined') {
        return true;
    }

    if ((/Chrome\/[0-9]+/).test(navigator.userAgent)) {

        // Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
        if (FastClick.prototype.deviceIsAndroid) {
            metaViewport = document.querySelector('meta[name=viewport]');
            if (metaViewport && metaViewport.content.indexOf('user-scalable=no') !== -1) {
                return true;
            }

        // Chrome desktop doesn't need FastClick (issue #15)
        } else {
            return true;
        }
    }

    // IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
    if (layer.style.msTouchAction === 'none') {
        return true;
    }

    return false;
};


/**
 * Factory method for creating a FastClick object
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.attach = function(layer) {
    'use strict';
    return new FastClick(layer);
};

var event = $.event.special.pointerclick = {
        setup : function() {
            $(this).on('click', event.handler);
        },

        teardown : function() {
            $(this).off('click', event.handler);
        },

        handler : function(e) {
            if(!e.button) {
                e.type = 'pointerclick';
                $.event.dispatch.apply(this, arguments);
                e.type = 'click';
            }
        }
    };

$(function() {
    FastClick.attach(document.body);
    provide($);
});

});

/* end: ../../libs/bem-core/common.blocks/jquery/__event/_type/jquery__event_type_pointerclick.js */
/* begin: ../../libs/bem-core/common.blocks/jquery/__event/_type/jquery__event_type_pointernative.js */
/*!
 * Basic pointer events polyfill
 */
;(function(global, factory) {

if(typeof modules === 'object' && modules.isDefined('jquery')) {
    modules.define('jquery', function(provide, $) {
        factory(this.global, $);
        provide($);
    });
} else if(typeof jQuery === 'function') {
    factory(global, jQuery);
}

}(this, function(window, $) {

// include "jquery-pointerevents.js"
/*!
 * Most of source code is taken from PointerEvents Polyfill
 * written by Polymer Team (https://github.com/Polymer/PointerEvents)
 * and licensed under the BSD License.
 */

var doc = document,
    USE_NATIVE_MAP = window.Map && window.Map.prototype.forEach,
    HAS_BITMAP_TYPE = window.MSPointerEvent && typeof window.MSPointerEvent.MSPOINTER_TYPE_MOUSE === 'number',
    POINTERS_FN = function() { return this.size },
    jqEvent = $.event;

// NOTE: Remove jQuery special fixes for pointerevents – we fix them ourself
delete jqEvent.special.pointerenter;
delete jqEvent.special.pointerleave;

/*!
 * Returns a snapshot of inEvent, with writable properties.
 *
 * @param {Event} event An event that contains properties to copy.
 * @returns {Object} An object containing shallow copies of `inEvent`'s
 *    properties.
 */
function cloneEvent(event) {
    var eventCopy = $.extend(new $.Event(), event);
    if(event.preventDefault) {
        eventCopy.preventDefault = function() {
            event.preventDefault();
        };
    }
    return eventCopy;
}

/*!
 * Dispatches the event to the target, taking event's bubbling into account.
 */
function dispatchEvent(event, target) {
    return event.bubbles?
        jqEvent.trigger(event, null, target) :
        jqEvent.dispatch.call(target, event);
}

var MOUSE_PROPS = {
        bubbles : false,
        cancelable : false,
        view : null,
        detail : null,
        screenX : 0,
        screenY : 0,
        clientX : 0,
        clientY : 0,
        ctrlKey : false,
        altKey : false,
        shiftKey : false,
        metaKey : false,
        button : 0,
        relatedTarget : null,
        pageX : 0,
        pageY : 0
    },
    mouseProps = Object.keys(MOUSE_PROPS),
    mousePropsLen = mouseProps.length,
    mouseDefaults = mouseProps.map(function(prop) { return MOUSE_PROPS[prop] });

/*!
 * Pointer event constructor
 *
 * @param {String} type
 * @param {Object} [params]
 * @returns {Event}
 * @constructor
 */
function PointerEvent(type, params) {
    params || (params = {});

    var e = $.Event(type);

    // define inherited MouseEvent properties
    for(var i = 0, p; i < mousePropsLen; i++) {
        p = mouseProps[i];
        e[p] = params[p] || mouseDefaults[i];
    }

    e.buttons = params.buttons || 0;

    // add x/y properties aliased to clientX/Y
    e.x = e.clientX;
    e.y = e.clientY;

    // Spec requires that pointers without pressure specified use 0.5 for down
    // state and 0 for up state.
    var pressure = 0;
    if(params.pressure) {
        pressure = params.pressure;
    } else {
        pressure = e.buttons? 0.5 : 0;
    }

    // define the properties of the PointerEvent interface
    e.pointerId = params.pointerId || 0;
    e.width = params.width || 0;
    e.height = params.height || 0;
    e.pressure = pressure;
    e.tiltX = params.tiltX || 0;
    e.tiltY = params.tiltY || 0;
    e.pointerType = params.pointerType || '';
    e.hwTimestamp = params.hwTimestamp || 0;
    e.isPrimary = params.isPrimary || false;

    // add some common jQuery properties
    e.which = typeof params.which === 'undefined'? 1 : params.which;

    return e;
}

/*!
 * Implements a map of pointer states
 * @returns {PointerMap}
 * @constructor
 */
function PointerMap() {
    if(USE_NATIVE_MAP) {
        var m = new Map();
        m.pointers = POINTERS_FN;
        return m;
    }

    this.keys = [];
    this.values = [];
}

PointerMap.prototype = {
    set : function(id, event) {
        var i = this.keys.indexOf(id);
        if(i > -1) {
            this.values[i] = event;
        } else {
            this.keys.push(id);
            this.values.push(event);
        }
    },

    has : function(id) {
        return this.keys.indexOf(id) > -1;
    },

    'delete' : function(id) {
        var i = this.keys.indexOf(id);
        if(i > -1) {
            this.keys.splice(i, 1);
            this.values.splice(i, 1);
        }
    },

    get : function(id) {
        var i = this.keys.indexOf(id);
        return this.values[i];
    },

    clear : function() {
        this.keys.length = 0;
        this.values.length = 0;
    },

    forEach : function(callback, ctx) {
        var keys = this.keys;
        this.values.forEach(function(v, i) {
            callback.call(ctx, v, keys[i], this);
        }, this);
    },

    pointers : function() {
        return this.keys.length;
    }
};

var pointermap = new PointerMap();

var dispatcher = {
    eventMap : {},
    eventSourceList : [],

    /*!
     * Add a new event source that will generate pointer events
     */
    registerSource : function(name, source) {
        var newEvents = source.events;
        if(newEvents) {
            newEvents.forEach(function(e) {
                source[e] && (this.eventMap[e] = function() { source[e].apply(source, arguments) });
            }, this);
            this.eventSourceList.push(source);
        }
    },

    register : function(element) {
        var len = this.eventSourceList.length;
        for(var i = 0, es; (i < len) && (es = this.eventSourceList[i]); i++) {
            // call eventsource register
            es.register.call(es, element);
        }
    },

    unregister : function(element) {
        var l = this.eventSourceList.length;
        for(var i = 0, es; (i < l) && (es = this.eventSourceList[i]); i++) {
            // call eventsource register
            es.unregister.call(es, element);
        }
    },

    down : function(event) {
        event.bubbles = true;
        this.fireEvent('pointerdown', event);
    },

    move : function(event) {
        event.bubbles = true;
        this.fireEvent('pointermove', event);
    },

    up : function(event) {
        event.bubbles = true;
        this.fireEvent('pointerup', event);
    },

    enter : function(event) {
        event.bubbles = false;
        this.fireEvent('pointerenter', event);
    },

    leave : function(event) {
        event.bubbles = false;
        this.fireEvent('pointerleave', event);
    },

    over : function(event) {
        event.bubbles = true;
        this.fireEvent('pointerover', event);
    },

    out : function(event) {
        event.bubbles = true;
        this.fireEvent('pointerout', event);
    },

    cancel : function(event) {
        event.bubbles = true;
        this.fireEvent('pointercancel', event);
    },

    leaveOut : function(event) {
        this.out(event);
        this.enterLeave(event, this.leave);
    },

    enterOver : function(event) {
        this.over(event);
        this.enterLeave(event, this.enter);
    },

    enterLeave : function(event, fn) {
        var target = event.target,
            relatedTarget = event.relatedTarget;

        if(!this.contains(target, relatedTarget)) {
            while(target && target !== relatedTarget) {
                event.target = target;
                fn.call(this, event);

                target = target.parentNode;
            }
        }
    },

    contains : function(target, relatedTarget) {
        return target === relatedTarget || $.contains(target, relatedTarget);
    },

    // LISTENER LOGIC
    eventHandler : function(e) {
        // This is used to prevent multiple dispatch of pointerevents from
        // platform events. This can happen when two elements in different scopes
        // are set up to create pointer events, which is relevant to Shadow DOM.
        if(e._handledByPE) {
            return;
        }

        var type = e.type, fn;
        (fn = this.eventMap && this.eventMap[type]) && fn(e);

        e._handledByPE = true;
    },

    /*!
     * Sets up event listeners
     */
    listen : function(target, events) {
        events.forEach(function(e) {
            this.addEvent(target, e);
        }, this);
    },

    /*!
     * Removes event listeners
     */
    unlisten : function(target, events) {
        events.forEach(function(e) {
            this.removeEvent(target, e);
        }, this);
    },

    addEvent : function(target, eventName) {
        $(target).on(eventName, boundHandler);
    },

    removeEvent : function(target, eventName) {
        $(target).off(eventName, boundHandler);
    },

    getTarget : function(event) {
        return event._target;
    },

    /*!
     * Creates a new Event of type `type`, based on the information in `event`
     */
    makeEvent : function(type, event) {
        var e = new PointerEvent(type, event);
        if(event.preventDefault) {
            e.preventDefault = event.preventDefault;
        }

        e._target = e._target || event.target;

        return e;
    },

    /*!
     * Dispatches the event to its target
     */
    dispatchEvent : function(event) {
        var target = this.getTarget(event);
        if(target) {
            if(!event.target) {
                event.target = target;
            }

            return dispatchEvent(event, target);
        }
    },

    /*!
     * Makes and dispatch an event in one call
     */
    fireEvent : function(type, event) {
        var e = this.makeEvent(type, event);
        return this.dispatchEvent(e);
    }
};

function boundHandler() {
    dispatcher.eventHandler.apply(dispatcher, arguments);
}

var CLICK_COUNT_TIMEOUT = 200,
    // Radius around touchend that swallows mouse events
    MOUSE_DEDUP_DIST = 25,
    MOUSE_POINTER_ID = 1,
    // This should be long enough to ignore compat mouse events made by touch
    TOUCH_DEDUP_TIMEOUT = 2500,
    // A distance for which touchmove should fire pointercancel event
    TOUCHMOVE_HYSTERESIS = 20;

// handler block for native mouse events
var mouseEvents = {
    POINTER_TYPE : 'mouse',
    events : [
        'mousedown',
        'mousemove',
        'mouseup',
        'mouseover',
        'mouseout'
    ],

    register : function(target) {
        dispatcher.listen(target, this.events);
    },

    unregister : function(target) {
        dispatcher.unlisten(target, this.events);
    },

    lastTouches : [],

    // collide with the global mouse listener
    isEventSimulatedFromTouch : function(event) {
        var lts = this.lastTouches,
            x = event.clientX,
            y = event.clientY;

        for(var i = 0, l = lts.length, t; i < l && (t = lts[i]); i++) {
            // simulated mouse events will be swallowed near a primary touchend
            var dx = Math.abs(x - t.x), dy = Math.abs(y - t.y);
            if(dx <= MOUSE_DEDUP_DIST && dy <= MOUSE_DEDUP_DIST) {
                return true;
            }
        }
    },

    prepareEvent : function(event) {
        var e = cloneEvent(event);
        e.pointerId = MOUSE_POINTER_ID;
        e.isPrimary = true;
        e.pointerType = this.POINTER_TYPE;
        return e;
    },

    mousedown : function(event) {
        if(!this.isEventSimulatedFromTouch(event)) {
            if(pointermap.has(MOUSE_POINTER_ID)) {
                // http://crbug/149091
                this.cancel(event);
            }

            pointermap.set(MOUSE_POINTER_ID, event);

            var e = this.prepareEvent(event);
            dispatcher.down(e);
        }
    },

    mousemove : function(event) {
        if(!this.isEventSimulatedFromTouch(event)) {
            var e = this.prepareEvent(event);
            dispatcher.move(e);
        }
    },

    mouseup : function(event) {
        if(!this.isEventSimulatedFromTouch(event)) {
            var p = pointermap.get(MOUSE_POINTER_ID);
            if(p && p.button === event.button) {
                var e = this.prepareEvent(event);
                dispatcher.up(e);
                this.cleanupMouse();
            }
        }
    },

    mouseover : function(event) {
        if(!this.isEventSimulatedFromTouch(event)) {
            var e = this.prepareEvent(event);
            dispatcher.enterOver(e);
        }
    },

    mouseout : function(event) {
        if(!this.isEventSimulatedFromTouch(event)) {
            var e = this.prepareEvent(event);
            dispatcher.leaveOut(e);
        }
    },

    cancel : function(inEvent) {
        var e = this.prepareEvent(inEvent);
        dispatcher.cancel(e);
        this.cleanupMouse();
    },

    cleanupMouse : function() {
        pointermap['delete'](MOUSE_POINTER_ID);
    }
};

var touchEvents = {
    events : [
        'touchstart',
        'touchmove',
        'touchend',
        'touchcancel'
    ],

    register : function(target) {
        dispatcher.listen(target, this.events);
    },

    unregister : function(target) {
        dispatcher.unlisten(target, this.events);
    },

    POINTER_TYPE : 'touch',
    clickCount : 0,
    resetId : null,
    firstTouch : null,

    isPrimaryTouch : function(touch) {
        return this.firstTouch === touch.identifier;
    },

    /*!
     * Sets primary touch if there no pointers, or the only pointer is the mouse
     */
    setPrimaryTouch : function(touch) {
        if(pointermap.pointers() === 0 ||
                (pointermap.pointers() === 1 && pointermap.has(MOUSE_POINTER_ID))) {
            this.firstTouch = touch.identifier;
            this.firstXY = { X : touch.clientX, Y : touch.clientY };
            this.scrolling = null;

            this.cancelResetClickCount();
        }
    },

    removePrimaryPointer : function(pointer) {
        if(pointer.isPrimary) {
            this.firstTouch = null;
            // TODO(@narqo): It seems that, flushing `firstXY` flag explicitly in `touchmove` handler is enough.
            // Original code from polymer doing `this.firstXY = null` on every `removePrimaryPointer` call, but looks
            // like it is harmful in some of our usecases.
            this.resetClickCount();
        }
    },

    resetClickCount : function() {
        var _this = this;
        this.resetId = setTimeout(function() {
            _this.clickCount = 0;
            _this.resetId = null;
        }, CLICK_COUNT_TIMEOUT);
    },

    cancelResetClickCount : function() {
        this.resetId && clearTimeout(this.resetId);
    },

    typeToButtons : function(type) {
        return type === 'touchstart' || type === 'touchmove'? 1 : 0;
    },

    findTarget : function(event) {
        // Currently we don't interested in shadow dom handling
        return doc.elementFromPoint(event.clientX, event.clientY);
    },

    touchToPointer : function(touch) {
        var cte = this.currentTouchEvent,
            e = cloneEvent(touch);

        // Spec specifies that pointerId 1 is reserved for Mouse.
        // Touch identifiers can start at 0.
        // Add 2 to the touch identifier for compatibility.
        e.pointerId = touch.identifier + 2;
        e.target = this.findTarget(e);
        e.bubbles = true;
        e.cancelable = true;
        e.detail = this.clickCount;
        e.button = 0;
        e.buttons = this.typeToButtons(cte.type);
        e.width = touch.webkitRadiusX || touch.radiusX || 0;
        e.height = touch.webkitRadiusY || touch.radiusY || 0;
        e.pressure = touch.mozPressure || touch.webkitForce || touch.force || 0.5;
        e.isPrimary = this.isPrimaryTouch(touch);
        e.pointerType = this.POINTER_TYPE;

        // forward touch preventDefaults
        var _this = this;
        e.preventDefault = function() {
            _this.scrolling = false;
            _this.firstXY = null;
            cte.preventDefault();
        };

        return e;
    },

    processTouches : function(event, fn) {
        var tl = event.originalEvent.changedTouches;
        this.currentTouchEvent = event;
        for(var i = 0, t; i < tl.length; i++) {
            t = tl[i];
            fn.call(this, this.touchToPointer(t));
        }
    },

    shouldScroll : function(touchEvent) {
        // return "true" for things to be much easier
        return true;
    },

    findTouch : function(touches, pointerId) {
        for(var i = 0, l = touches.length, t; i < l && (t = touches[i]); i++) {
            if(t.identifier === pointerId) {
                return true;
            }
        }
    },

    /*!
     * In some instances, a touchstart can happen without a touchend.
     * This leaves the pointermap in a broken state.
     * Therefore, on every touchstart, we remove the touches
     * that did not fire a touchend event.
     *
     * To keep state globally consistent, we fire a pointercancel
     * for this "abandoned" touch
     */
    vacuumTouches : function(touchEvent) {
        var touches = touchEvent.touches;
        // pointermap.pointers() should be less than length of touches here, as the touchstart has not
        // been processed yet.
        if(pointermap.pointers() >= touches.length) {
            var d = [];

            pointermap.forEach(function(pointer, pointerId) {
                // Never remove pointerId == 1, which is mouse.
                // Touch identifiers are 2 smaller than their pointerId, which is the
                // index in pointermap.
                if(pointerId === MOUSE_POINTER_ID || this.findTouch(touches, pointerId - 2)) return;
                d.push(pointer.outEvent);
            }, this);

            d.forEach(this.cancelOut, this);
        }
    },

    /*!
     * Prevents synth mouse events from creating pointer events
     */
    dedupSynthMouse : function(touchEvent) {
        var lts = mouseEvents.lastTouches,
            t = touchEvent.changedTouches[0];

        // only the primary finger will synth mouse events
        if(this.isPrimaryTouch(t)) {
            // remember x/y of last touch
            var lt = { x : t.clientX, y : t.clientY };
            lts.push(lt);

            setTimeout(function() {
                var i = lts.indexOf(lt);
                i > -1 && lts.splice(i, 1);
            }, TOUCH_DEDUP_TIMEOUT);
        }
    },

    touchstart : function(event) {
        var touchEvent = event.originalEvent;

        this.vacuumTouches(touchEvent);
        this.setPrimaryTouch(touchEvent.changedTouches[0]);
        this.dedupSynthMouse(touchEvent);

        if(!this.scrolling) {
            this.clickCount++;
            this.processTouches(event, this.overDown);
        }
    },

    touchmove : function(event) {
        var touchEvent = event.originalEvent;
        if(!this.scrolling) {
            if(this.scrolling === null && this.shouldScroll(touchEvent)) {
                this.scrolling = true;
            } else {
                event.preventDefault();
                this.processTouches(event, this.moveOverOut);
            }
        } else if(this.firstXY) {
            var firstXY = this.firstXY,
                touch = touchEvent.changedTouches[0],
                dx = touch.clientX - firstXY.X,
                dy = touch.clientY - firstXY.Y,
                dd = Math.sqrt(dx * dx + dy * dy);
            if(dd >= TOUCHMOVE_HYSTERESIS) {
                this.touchcancel(event);
                this.scrolling = true;
                this.firstXY = null;
            }
        }
    },

    touchend : function(event) {
        var touchEvent = event.originalEvent;
        this.dedupSynthMouse(touchEvent);
        this.processTouches(event, this.upOut);
    },

    touchcancel : function(event) {
        this.processTouches(event, this.cancelOut);
    },

    overDown : function(pEvent) {
        var target = pEvent.target;
        pointermap.set(pEvent.pointerId, {
            target : target,
            outTarget : target,
            outEvent : pEvent
        });
        dispatcher.over(pEvent);
        dispatcher.enter(pEvent);
        dispatcher.down(pEvent);
    },

    moveOverOut : function(pEvent) {
        var pointer = pointermap.get(pEvent.pointerId);

        // a finger drifted off the screen, ignore it
        if(!pointer) {
            return;
        }

        dispatcher.move(pEvent);

        var outEvent = pointer.outEvent,
            outTarget = pointer.outTarget;

        if(outEvent && outTarget !== pEvent.target) {
            pEvent.relatedTarget = outTarget;
            outEvent.relatedTarget = pEvent.target;
            // recover from retargeting by shadow
            outEvent.target = outTarget;

            if(pEvent.target) {
                dispatcher.leaveOut(outEvent);
                dispatcher.enterOver(pEvent);
            } else {
                // clean up case when finger leaves the screen
                pEvent.target = outTarget;
                pEvent.relatedTarget = null;
                this.cancelOut(pEvent);
            }
        }

        pointer.outEvent = pEvent;
        pointer.outTarget = pEvent.target;
    },

    upOut : function(pEvent) {
        dispatcher.up(pEvent);
        dispatcher.out(pEvent);
        dispatcher.leave(pEvent);

        this.cleanUpPointer(pEvent);
    },

    cancelOut : function(pEvent) {
        dispatcher.cancel(pEvent);
        dispatcher.out(pEvent);
        dispatcher.leave(pEvent);
        this.cleanUpPointer(pEvent);
    },

    cleanUpPointer : function(pEvent) {
        pointermap['delete'](pEvent.pointerId);
        this.removePrimaryPointer(pEvent);
    }
};

var msEvents = {
    events : [
        'MSPointerDown',
        'MSPointerMove',
        'MSPointerUp',
        'MSPointerOut',
        'MSPointerOver',
        'MSPointerCancel'
    ],

    register : function(target) {
        dispatcher.listen(target, this.events);
    },

    unregister : function(target) {
        dispatcher.unlisten(target, this.events);
    },

    POINTER_TYPES : [
        '',
        'unavailable',
        'touch',
        'pen',
        'mouse'
    ],

    prepareEvent : function(event) {
        var e = cloneEvent(event);
        HAS_BITMAP_TYPE && (e.pointerType = this.POINTER_TYPES[event.pointerType]);
        return e;
    },

    MSPointerDown : function(event) {
        pointermap.set(event.pointerId, event);
        var e = this.prepareEvent(event);
        dispatcher.down(e);
    },

    MSPointerMove : function(event) {
        var e = this.prepareEvent(event);
        dispatcher.move(e);
    },

    MSPointerUp : function(event) {
        var e = this.prepareEvent(event);
        dispatcher.up(e);
        this.cleanup(event.pointerId);
    },

    MSPointerOut : function(event) {
        var e = this.prepareEvent(event);
        dispatcher.leaveOut(e);
    },

    MSPointerOver : function(event) {
        var e = this.prepareEvent(event);
        dispatcher.enterOver(e);
    },

    MSPointerCancel : function(event) {
        var e = this.prepareEvent(event);
        dispatcher.cancel(e);
        this.cleanup(event.pointerId);
    },

    cleanup : function(id) {
        pointermap['delete'](id);
    }
};

var navigator = window.navigator;
if(navigator.msPointerEnabled) {
    dispatcher.registerSource('ms', msEvents);
} else {
    dispatcher.registerSource('mouse', mouseEvents);
    if(typeof window.ontouchstart !== 'undefined') {
        dispatcher.registerSource('touch', touchEvents);
    }
}

dispatcher.register(doc);

}));

/* end: ../../libs/bem-core/common.blocks/jquery/__event/_type/jquery__event_type_pointernative.js */
/* begin: ../../libs/bem-core/common.blocks/keyboard/__codes/keyboard__codes.js */
/**
 * @module keyboard__codes
 */
modules.define('keyboard__codes', function(provide) {

provide(/** @exports */{
    BACKSPACE : 8,
    TAB : 9,
    ENTER : 13,
    CAPS_LOCK : 20,
    ESC : 27,
    SPACE : 32,
    PAGE_UP : 33,
    PAGE_DOWN : 34,
    END : 35,
    HOME : 36,
    LEFT : 37,
    UP : 38,
    RIGHT : 39,
    DOWN : 40,
    INSERT : 41,
    DELETE : 42
});

});

/* end: ../../libs/bem-core/common.blocks/keyboard/__codes/keyboard__codes.js */
/* begin: ../../libs/bem-components/common.blocks/control/control.js */
/**
 * @module control
 */

modules.define(
    'control',
    ['i-bem__dom', 'dom', 'next-tick'],
    function(provide, BEMDOM, dom, nextTick) {

/**
 * @exports
 * @class control
 * @abstract
 * @bem
 */
provide(BEMDOM.decl(this.name, /** @lends control.prototype */{
    beforeSetMod : {
        'focused' : {
            'true' : function() {
                return !this.hasMod('disabled');
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this._focused = dom.containsFocus(this.elem('control'));
                this._focused?
                    // if control is already in focus, we need to force _onFocus
                    this._onFocus() :
                    // if block already has focused mod, we need to focus control
                    this.hasMod('focused') && this._focus();

                this._tabIndex = this.elem('control').attr('tabindex');
                if(this.hasMod('disabled') && this._tabIndex !== 'undefined')
                    this.elem('control').removeAttr('tabindex');
            }
        },

        'focused' : {
            'true' : function() {
                this._focused || this._focus();
            },

            '' : function() {
                this._focused && this._blur();
            }
        },

        'disabled' : {
            '*' : function(modName, modVal) {
                this.elem('control').prop(modName, !!modVal);
            },

            'true' : function() {
                this.delMod('focused');
                typeof this._tabIndex !== 'undefined' &&
                    this.elem('control').removeAttr('tabindex');
            },

            '' : function() {
                typeof this._tabIndex !== 'undefined' &&
                    this.elem('control').attr('tabindex', this._tabIndex);
            }
        }
    },

    /**
     * Returns name of control
     * @returns {String}
     */
    getName : function() {
        return this.elem('control').attr('name') || '';
    },

    /**
     * Returns control value
     * @returns {String}
     */
    getVal : function() {
        return this.elem('control').val();
    },

    _onFocus : function() {
        this._focused = true;
        this.setMod('focused');
    },

    _onBlur : function() {
        this._focused = false;
        this.delMod('focused');
    },

    _focus : function() {
        dom.isFocusable(this.elem('control'))?
            this.elem('control').focus() :
            this._onFocus(); // issues/1456
    },

    _blur : function() {
        dom.isFocusable(this.elem('control'))?
            this.elem('control').blur() :
            this._onBlur();
    }
}, /** @lends control */{
    live : function() {
        this
            .liveBindTo('control', 'focusin', function() {
                this._focused || this._onFocus(); // to prevent double call of _onFocus in case of init by focus
            })
            .liveBindTo('control', 'focusout', this.prototype._onBlur);

        var focused = dom.getFocused();
        if(focused.hasClass(this.buildClass('control'))) {
            var _this = this; // TODO: https://github.com/bem/bem-core/issues/425
            nextTick(function() {
                if(focused[0] === dom.getFocused()[0]) {
                    var block = focused.closest(_this.buildSelector());
                    block && block.bem(_this.getName());
                }
            });
        }
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/control/control.js */
/* begin: ../../libs/bem-components/desktop.blocks/control/control.js */
/** @module control */

modules.define(
    'control',
    function(provide, Control) {

provide(Control.decl({
    beforeSetMod : {
        'hovered' : {
            'true' : function() {
                return !this.hasMod('disabled');
            }
        }
    },

    onSetMod : {
        'disabled' : {
            'true' : function() {
                this.__base.apply(this, arguments);
                this.delMod('hovered');
            }
        },

        'hovered' : {
            'true' : function() {
                this.bindTo('mouseleave', this._onMouseLeave);
            },

            '' : function() {
                this.unbindFrom('mouseleave', this._onMouseLeave);
            }
        }
    },

    _onMouseOver : function() {
        this.setMod('hovered');
    },

    _onMouseLeave : function() {
        this.delMod('hovered');
    }
}, {
    live : function() {
        return this
            .liveBindTo('mouseover', this.prototype._onMouseOver)
            .__base.apply(this, arguments);
    }
}));

});

/* end: ../../libs/bem-components/desktop.blocks/control/control.js */
/* begin: ../../libs/bem-components/common.blocks/dropdown/dropdown.js */
/**
 * @module dropdown
 */

modules.define(
    'dropdown',
    ['i-bem__dom', 'popup'],
    function(provide, BEMDOM) {

/**
 * @exports
 * @class dropdown
 * @bem
 *
 * @bemmod opened Represents opened state
 */
provide(BEMDOM.decl(this.name, /** @lends dropdown.prototype */{
    beforeSetMod : {
        'opened' : {
            'true' : function() {
                if(this.hasMod('disabled')) return false;
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this._switcher = null;
                this._popup = null;
            }
        },

        'opened' : function(_, modVal) {
            this.getPopup().setMod('visible', modVal);
        },

        'disabled' : {
            '*' : function(modName, modVal) {
                this.getSwitcher().setMod(modName, modVal);
            },

            'true' : function() {
                this.getPopup().delMod('visible');
            }
        }
    },

    /**
     * Returns popup
     * @returns {popup}
     */
    getPopup : function() {
        return this._popup ||
            (this._popup = this.findBlockInside('popup')
                .setAnchor(this.getSwitcher())
                .on({ modName : 'visible', modVal : '*' }, this._onPopupVisibilityChange, this));
    },

    /**
     * Returns switcher
     * @returns {i-bem__dom}
     */
    getSwitcher : function() {
        return this._switcher ||
            (this._switcher = this.findBlockInside(this.getMod('switcher')));
    },

    _onPopupVisibilityChange : function(_, data) {
        this.setMod('opened', data.modVal);
    }
}, /** @lends dropdown */{
    live : true,

    /**
     * On BEM click event handler
     * @param {events:Event} e
     * @protected
     */
    onSwitcherClick : function(e) {
        this._switcher || (this._switcher = e.target);
        this.toggleMod('opened');
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/dropdown/dropdown.js */
/* begin: ../../libs/bem-components/common.blocks/popup/popup.js */
/**
 * @module popup
 */

modules.define(
    'popup',
    ['i-bem__dom'],
    function(provide, BEMDOM) {

var ZINDEX_FACTOR = 1000,
    visiblePopupsZIndexes = {},
    undef;

/**
 * @exports
 * @class popup
 * @bem
 *
 * @param {Number} [zIndexGroupLevel=0] z-index group level
 *
 * @bemmod visible Represents visible state
 */
provide(BEMDOM.decl(this.name, /** @lends popup.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this._parentPopup = undef;
                this._zIndex = null;
                this._zIndexGroupLevel = null;
                this._isAttachedToScope = false;
            },

            '' : function() {
                this.delMod('visible');
            }
        },

        'visible' : {
            'true' : function() {
                if(!this._isAttachedToScope) {
                    BEMDOM.scope.append(this.domElem);
                    this._isAttachedToScope = true;
                }

                this
                    ._captureZIndex()
                    ._bindToParentPopup()
                    .bindTo('pointerpress pointerclick', this._setPreventHideByClick);
            },

            '' : function() {
                this
                    ._releaseZIndex()
                    ._unbindFromParentPopup()
                    .unbindFrom('pointerpress pointerclick', this._setPreventHideByClick);
            }
        }
    },

    /**
     * Sets content
     * @param {String|jQuery} content
     * @returns {popup} this
     */
    setContent : function(content) {
        BEMDOM.update(this.domElem, content);
        return this;
    },

    _calcZIndexGroupLevel : function() {
        var res = this.params.zIndexGroupLevel,
            parentPopup = this._getParentPopup();

        parentPopup && (res += parentPopup._zIndexGroupLevel);

        return res;
    },

    _setPreventHideByClick : function() {
        var curPopup = this;
        do {
            curPopup._preventHideByClick = true;
        } while(curPopup = curPopup._getParentPopup());
    },

    _bindToParentPopup : function() {
        var parentPopup = this._getParentPopup();
        parentPopup && parentPopup.on({ modName : 'visible', modVal : '' }, this._onParentPopupHide, this);

        return this;
    },

    _unbindFromParentPopup : function() {
        this._parentPopup && this._parentPopup.un({ modName : 'visible', modVal : '' }, this._onParentPopupHide, this);
        this._parentPopup = undef;

        return this;
    },

    _onParentPopupHide : function() {
        this.delMod('visible');
    },

    _getParentPopup : function() {
        return this._parentPopup;
    },

    _captureZIndex : function() {
        var level = this._zIndexGroupLevel === null?
                this._zIndexGroupLevel = this._calcZIndexGroupLevel() :
                this._zIndexGroupLevel,
            zIndexes = visiblePopupsZIndexes[level] || (visiblePopupsZIndexes[level] = [(level + 1) * ZINDEX_FACTOR]),
            prevZIndex = this._zIndex;

        this._zIndex = zIndexes[zIndexes.push(zIndexes[zIndexes.length - 1] + 1) - 1];
        this._zIndex !== prevZIndex && this.domElem.css('z-index', this._zIndex);

        return this;
    },

    _releaseZIndex : function() {
        var zIndexes = visiblePopupsZIndexes[this._zIndexGroupLevel];
        zIndexes.splice(zIndexes.indexOf(this._zIndex), 1);

        return this;
    },

    _recaptureZIndex : function() {
        this._releaseZIndex();
        this._zIndexGroupLevel = null;

        return this._captureZIndex();
    },

    getDefaultParams : function() {
        return {
            zIndexGroupLevel : 0
        };
    }
}, /** @lends popup */{
    live : true
}));

});

/* end: ../../libs/bem-components/common.blocks/popup/popup.js */
/* begin: ../../libs/bem-components/common.blocks/popup/_autoclosable/popup_autoclosable.js */
/**
 * @module popup
 */

modules.define(
    'popup',
    ['jquery', 'i-bem__dom', 'ua', 'dom', 'keyboard__codes'],
    function(provide, $, BEMDOM, ua, dom, keyCodes, Popup) {

var KEYDOWN_EVENT = ua.opera && ua.version < 12.10? 'keypress' : 'keydown',
    visiblePopupsStack = [];

/**
 * @exports
 * @class popup
 * @bem
 */
provide(Popup.decl({ modName : 'autoclosable', modVal : true }, /** @lends popup.prototype */{
    onSetMod : {
        'visible' : {
            'true' : function() {
                visiblePopupsStack.unshift(this);
                this
                    // NOTE: nextTick because of event bubbling to document
                    .nextTick(function() {
                        this.bindToDoc('pointerclick', this._onDocPointerClick);
                    })
                    .__base.apply(this, arguments);
            },

            '' : function() {
                visiblePopupsStack.splice(visiblePopupsStack.indexOf(this), 1);
                this
                    .unbindFromDoc('pointerclick', this._onDocPointerClick)
                    .__base.apply(this, arguments);
            }
        }
    },

    _onDocPointerClick : function(e) {
        if(this.hasMod('target', 'anchor') && dom.contains(this._anchor, $(e.target)))
            return;

        this._preventHideByClick?
           this._preventHideByClick = null :
           this.delMod('visible');
    }
}, /** @lends popup */{
    live : function() {
        BEMDOM.doc.on(KEYDOWN_EVENT, onDocKeyPress);
    }
}));

function onDocKeyPress(e) {
    e.keyCode === keyCodes.ESC &&
        // omit ESC in inputs, selects and etc.
        visiblePopupsStack.length &&
        !dom.isEditable($(e.target)) &&
            visiblePopupsStack[0].delMod('visible');
}

});

/* end: ../../libs/bem-components/common.blocks/popup/_autoclosable/popup_autoclosable.js */
/* begin: ../../libs/bem-components/common.blocks/popup/_target/popup_target.js */
/**
 * @module popup
 */

modules.define(
    'popup',
    ['i-bem__dom', 'objects'],
    function(provide, BEMDOM, objects, Popup) {

var VIEWPORT_ACCURACY_FACTOR = 0.99,
    DEFAULT_DIRECTIONS = [
        'bottom-left', 'bottom-center', 'bottom-right',
        'top-left', 'top-center', 'top-right',
        'right-top', 'right-center', 'right-bottom',
        'left-top', 'left-center', 'left-bottom'
    ],

    win = BEMDOM.win,
    undef;

/**
 * @exports
 * @class popup
 * @bem
 *
 * @param {Number} [mainOffset=0] offset along the main direction
 * @param {Number} [secondaryOffset=0] offset along the secondary direction
 * @param {Number} [viewportOffset=0] offset from the viewport (window)
 * @param {Array[String]} [directions] allowed directions
 */
provide(Popup.decl({ modName : 'target' }, /** @lends popup.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);

                this._lastDrawingCss = {
                    left : undef,
                    top : undef,
                    zIndex : undef,
                    display : undef
                };
            }
        },

        'visible' : {
            'true' : function() {
                this.__base.apply(this, arguments);
                this
                    .bindToWin('scroll resize', this._onWinScrollAndResize)
                    .redraw();
            },

            '' : function() {
                this.__base.apply(this, arguments);
                this.unbindFromWin('scroll resize', this._onWinScrollAndResize);
            }
        }
    },

    /**
     * @override
     */
    setContent : function() {
        return this.__base.apply(this, arguments).redraw();
    },

    /**
     * Redraws popup
     * @returns {popup} this
     */
    redraw : function() {
        if(!this.hasMod('visible')) return this;

        var bestDrawingParams = this._calcBestDrawingParams();

        this.setMod('direction', bestDrawingParams.direction);

        var lastDrawingCss = this._lastDrawingCss,
            needUpdateCss = false;

        objects.each(
            this._calcDrawingCss(bestDrawingParams),
            function(val, name) {
                if(lastDrawingCss[name] !== val) {
                    lastDrawingCss[name] = val;
                    needUpdateCss = true;
                }
            });

        needUpdateCss && this.domElem.css(lastDrawingCss);

        return this;
    },

    _calcDrawingCss : function(drawingParams) {
        return {
            left : drawingParams.left,
            top : drawingParams.top
        };
    },

    /**
     * Returns possible directions to draw with max available width and height.
     * @returns {Array}
     */
    calcPossibleDrawingParams : function() {
        var target = this._calcTargetDimensions(),
            viewport = this._calcViewportDimensions(),
            params = this.params,
            mainOffset = params.mainOffset,
            secondaryOffset = params.secondaryOffset,
            viewportOffset = params.viewportOffset;

        return this.params.directions.map(function(direction) {
            var subRes = {
                    direction : direction,
                    width : 0,
                    height : 0,
                    left : 0,
                    top : 0
                };

            if(this._checkMainDirection(direction, 'bottom')) {
                subRes.top = target.top + target.height + mainOffset;
                subRes.height = viewport.bottom - subRes.top - viewportOffset;
            } else if(this._checkMainDirection(direction, 'top')) {
                subRes.height = target.top - viewport.top - mainOffset - viewportOffset;
                subRes.top = target.top - subRes.height - mainOffset;
            } else {
                if(this._checkSecondaryDirection(direction, 'center')) {
                    subRes.height = viewport.bottom - viewport.top - 2 * viewportOffset;
                    subRes.top = target.top + target.height / 2 - subRes.height / 2;
                } else if(this._checkSecondaryDirection(direction, 'bottom')) {
                    subRes.height = target.top + target.height - viewport.top - secondaryOffset - viewportOffset;
                    subRes.top = target.top + target.height - subRes.height - secondaryOffset;
                } else if(this._checkSecondaryDirection(direction, 'top')) {
                    subRes.top = target.top + secondaryOffset;
                    subRes.height = viewport.bottom - subRes.top - viewportOffset;
                }

                if(this._checkMainDirection(direction, 'left')) {
                    subRes.width = target.left - viewport.left - mainOffset - viewportOffset;
                    subRes.left = target.left - subRes.width - mainOffset;
                } else {
                    subRes.left = target.left + target.width + mainOffset;
                    subRes.width = viewport.right - subRes.left - viewportOffset;
                }
            }

            if(this._checkSecondaryDirection(direction, 'right')) {
                subRes.width = target.left + target.width - viewport.left - secondaryOffset - viewportOffset;
                subRes.left = target.left + target.width - subRes.width - secondaryOffset;
            } else if(this._checkSecondaryDirection(direction, 'left')) {
                subRes.left = target.left + secondaryOffset;
                subRes.width = viewport.right - subRes.left - viewportOffset;
            } else if(this._checkSecondaryDirection(direction, 'center')) {
                if(this._checkMainDirection(direction, 'top', 'bottom')) {
                    subRes.width = viewport.right - viewport.left - 2 * viewportOffset;
                    subRes.left = target.left + target.width / 2 - subRes.width / 2;
                }
            }

            return subRes;
        }, this);
    },

    _calcBestDrawingParams : function() {
        var popup = this._calcPopupDimensions(),
            target = this._calcTargetDimensions(),
            viewport = this._calcViewportDimensions(),
            directions = this.params.directions,
            i = 0,
            direction,
            pos,
            viewportFactor,
            bestDirection,
            bestPos,
            bestViewportFactor;

        while(direction = directions[i++]) {
            pos = this._calcPos(direction, target, popup);
            viewportFactor = this._calcViewportFactor(pos, viewport, popup);
            if(i === 1 ||
                    viewportFactor > bestViewportFactor ||
                    (!bestViewportFactor && this.hasMod('direction', direction))) {
                bestDirection = direction;
                bestViewportFactor = viewportFactor;
                bestPos = pos;
            }
            if(bestViewportFactor > VIEWPORT_ACCURACY_FACTOR) break;
        }

        return {
            direction : bestDirection,
            left : bestPos.left,
            top : bestPos.top
        };
    },

    _calcPopupDimensions : function() {
        var popupWidth = this.domElem.outerWidth(),
            popupHeight = this.domElem.outerHeight();

        return {
            width : popupWidth,
            height : popupHeight,
            area : popupWidth * popupHeight
        };
    },

    /**
     * @abstract
     * @protected
     * @returns {Object}
     */
    _calcTargetDimensions : function() {},

    _calcViewportDimensions : function() {
        var winTop = win.scrollTop(),
            winLeft = win.scrollLeft(),
            winWidth = win.width(),
            winHeight = win.height();

        return {
            top : winTop,
            left : winLeft,
            bottom : winTop + winHeight,
            right : winLeft + winWidth
        };
    },

    _calcPos : function(direction, target, popup) {
        var res = {},
            mainOffset = this.params.mainOffset,
            secondaryOffset = this.params.secondaryOffset;

        if(this._checkMainDirection(direction, 'bottom')) {
            res.top = target.top + target.height + mainOffset;
        } else if(this._checkMainDirection(direction, 'top')) {
            res.top = target.top - popup.height - mainOffset;
        } else if(this._checkMainDirection(direction, 'left')) {
            res.left = target.left - popup.width - mainOffset;
        } else if(this._checkMainDirection(direction, 'right')) {
            res.left = target.left + target.width + mainOffset;
        }

        if(this._checkSecondaryDirection(direction, 'right')) {
            res.left = target.left + target.width - popup.width - secondaryOffset;
        } else if(this._checkSecondaryDirection(direction, 'left')) {
            res.left = target.left + secondaryOffset;
        } else if(this._checkSecondaryDirection(direction, 'bottom')) {
            res.top = target.top + target.height - popup.height - secondaryOffset;
        } else if(this._checkSecondaryDirection(direction, 'top')) {
            res.top = target.top + secondaryOffset;
        } else if(this._checkSecondaryDirection(direction, 'center')) {
            if(this._checkMainDirection(direction, 'top', 'bottom')) {
                res.left = target.left + target.width / 2 - popup.width / 2;
            } else if(this._checkMainDirection(direction, 'left', 'right')) {
                res.top = target.top + target.height / 2 - popup.height / 2;
            }
        }

        return res;
    },

    _calcViewportFactor : function(pos, viewport, popup) {
        var viewportOffset = this.params.viewportOffset,
            intersectionLeft = Math.max(pos.left, viewport.left + viewportOffset),
            intersectionRight = Math.min(pos.left + popup.width, viewport.right - viewportOffset),
            intersectionTop = Math.max(pos.top, viewport.top + viewportOffset),
            intersectionBottom = Math.min(pos.top + popup.height, viewport.bottom - viewportOffset);

        return intersectionLeft < intersectionRight && intersectionTop < intersectionBottom? // has intersection
            (intersectionRight - intersectionLeft) *
                (intersectionBottom - intersectionTop) /
                popup.area :
            0;
    },

    _checkMainDirection : function(direction, mainDirection1, mainDirection2) {
        return !direction.indexOf(mainDirection1) || (mainDirection2 && !direction.indexOf(mainDirection2));
    },

    _checkSecondaryDirection : function(direction, secondaryDirection) {
        return ~direction.indexOf('-' + secondaryDirection);
    },

    _onWinScrollAndResize : function() {
        this.redraw();
    },

    getDefaultParams : function() {
        return objects.extend(
            this.__base.apply(this, arguments),
            {
                mainOffset : 0,
                secondaryOffset : 0,
                viewportOffset : 0,
                directions : DEFAULT_DIRECTIONS
            });
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/popup/_target/popup_target.js */
/* begin: ../../libs/bem-components/common.blocks/link/link.js */
/**
 * @module link
 */

modules.define(
    'link',
    ['i-bem__dom', 'control', 'events'],
    function(provide, BEMDOM, Control, events) {

/**
 * @exports
 * @class link
 * @augments control
 * @bem
 */
provide(BEMDOM.decl({ block : this.name, baseBlock : Control }, /** @lends link.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this._url = this.params.url || this.domElem.attr('href');

                this.hasMod('disabled') && this.domElem.removeAttr('href');
            }
        },

        'disabled' : {
            'true' : function() {
                this.__base.apply(this, arguments);
                this.domElem.removeAttr('href');
            },

            '' : function() {
                this.__base.apply(this, arguments);
                this.domElem.attr('href', this._url);
            }
        }
    },

    /**
     * Returns url
     * @returns {String}
     */
    getUrl : function() {
        return this._url;
    },

    /**
     * Sets url
     * @param {String} url
     * @returns {link} this
     */
    setUrl : function(url) {
        this._url = url;
        this.hasMod('disabled') || this.domElem.attr('href', url);
        return this;
    },

    _onPointerClick : function(e) {
        if(this.hasMod('disabled')) {
            e.preventDefault();
        } else {
            var event = new events.Event('click');
            this.emit(event);
            event.isDefaultPrevented() && e.preventDefault();
        }
    }
}, /** @lends link */{
    live : function() {
        this.liveBindTo('control', 'pointerclick', this.prototype._onPointerClick);
        return this.__base.apply(this, arguments);
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/link/link.js */
/* begin: ../../libs/bem-components/common.blocks/link/_pseudo/link_pseudo.js */
/**
 * @module link
 */

modules.define('link', ['keyboard__codes'], function(provide, keyCodes, Link) {

/**
 * @exports
 * @class link
 * @bem
 */
provide(Link.decl({ modName : 'pseudo', modVal : true }, /** @lends link.prototype */{
    onSetMod : {
        'focused' : {
            'true' : function() {
                this.__base.apply(this, arguments);

                this.bindTo('control', 'keydown', this._onKeyDown);
            },
            '' : function() {
                this.__base.apply(this, arguments);

                this.unbindFrom('control', 'keydown', this._onKeyDown);
            }
        }
    },

    _onPointerClick : function(e) {
        e.preventDefault();

        this.__base.apply(this, arguments);
    },

    _onKeyDown : function(e) {
        e.keyCode === keyCodes.ENTER && this._onPointerClick(e);
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/link/_pseudo/link_pseudo.js */
/* begin: ../../libs/bem-components/common.blocks/dropdown/_switcher/dropdown_switcher_button.js */
/**
 * @module dropdown
 */

modules.define('dropdown', ['button'], function(provide, _, Dropdown) {

/**
 * @exports
 * @class dropdown
 * @bem
 */
provide(Dropdown.decl({ modName : 'switcher', modVal : 'button' }, /** @lends dropdown.prototype */{
    onSetMod : {
        'opened' : function(_, modVal) {
            this.__base.apply(this, arguments);
            var switcher = this.getSwitcher();
            switcher.hasMod('togglable', 'check') && switcher.setMod('checked', modVal);
        }
    }
}, /** @lends dropdown */{
    live : function() {
        this.liveInitOnBlockInsideEvent('click', 'button', this.onSwitcherClick);
        return this.__base.apply(this, arguments);
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/dropdown/_switcher/dropdown_switcher_button.js */
/* begin: ../../libs/bem-components/common.blocks/menu/menu.js */
/**
 * @module menu
 */

modules.define(
    'menu',
    ['i-bem__dom', 'control', 'keyboard__codes', 'menu-item'],
    function(provide, BEMDOM, Control, keyCodes) {

/** @const Number */
var TIMEOUT_KEYBOARD_SEARCH = 1500;

/**
 * @exports
 * @class menu
 * @augments control
 * @bem
 */
provide(BEMDOM.decl({ block : this.name, baseBlock : Control }, /** @lends menu.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);
                this._hoveredItem = null;
                this._items = null;

                this._lastTyping = {
                    char : '',
                    text : '',
                    index : 0,
                    time : 0
                };
            }
        },

        'disabled' : function(modName, modVal) {
            this.getItems().forEach(function(menuItem){
                menuItem.setMod(modName, modVal);
            });
        }
    },

    /**
     * Returns items
     * @returns {menu-item[]}
     */
    getItems : function() {
        return this._items || (this._items = this.findBlocksInside('menu-item'));
    },

    /**
     * Sets content
     * @param {String|jQuery} content
     * @returns {menu} this
     */
    setContent : function(content) {
        BEMDOM.update(this.domElem, content);
        this._hoveredItem = null;
        this._items = null;
        return this;
    },

    /**
     * Search menu item by keyboard event
     * @param {jQuery.Event} e
     * @returns {menu-item}
     */
    searchItemByKeyboardEvent : function(e) {
        var currentTime = +new Date(),
            charCode = e.charCode,
            char = String.fromCharCode(charCode).toLowerCase(),
            lastTyping = this._lastTyping,
            index = lastTyping.index,
            isSameChar = char === lastTyping.char && lastTyping.text.length === 1,
            items = this.getItems();

        if(charCode <= keyCodes.SPACE || e.ctrlKey || e.altKey || e.metaKey) {
            lastTyping.time = currentTime;
            return null;
        }

        if(currentTime - lastTyping.time > TIMEOUT_KEYBOARD_SEARCH || isSameChar) {
            lastTyping.text = char;
        } else {
            lastTyping.text += char;
        }

        lastTyping.char = char;
        lastTyping.time = currentTime;

        // If key is pressed again, then continue to search to next menu item
        if(isSameChar && items[index].getText().search(lastTyping.char) === 0) {
            index = index >= items.length - 1? 0 : index + 1;
        }

        // 2 passes: from index to items.length and from 0 to index.
        var i = index, len = items.length;
        while(i < len) {
            if(this._doesItemMatchText(items[i], lastTyping.text)) {
                lastTyping.index = i;
                return items[i];
            }

            i++;

            if(i === items.length) {
                i = 0;
                len = index;
            }
        }

        return null;
    },

    /** @override **/
    _onFocus : function() {
        this.__base.apply(this, arguments);
        this
            .bindToDoc('keydown', this._onKeyDown) // NOTE: should be called after __base
            .bindToDoc('keypress', this._onKeyPress);
    },

    /** @override **/
    _onBlur : function() {
        this
            .unbindFromDoc('keydown', this._onKeyDown)
            .unbindFromDoc('keypress', this._onKeyPress)
            .__base.apply(this, arguments);
        this._hoveredItem && this._hoveredItem.delMod('hovered');
    },

    /**
     * @param {Object} item
     * @private
     */
    _onItemHover : function(item) {
        if(item.hasMod('hovered')) {
            this._hoveredItem && this._hoveredItem.delMod('hovered');
            this._scrollToItem(this._hoveredItem = item);
        } else if(this._hoveredItem === item) {
            this._hoveredItem = null;
        }
    },

    /**
     * @param {Object} item
     * @private
     */
    _scrollToItem : function(item) {
        var domElemOffsetTop = this.domElem.offset().top,
            itemDomElemOffsetTop = item.domElem.offset().top,
            relativeScroll;

        if((relativeScroll = itemDomElemOffsetTop - domElemOffsetTop) < 0 ||
            (relativeScroll =
                itemDomElemOffsetTop +
                item.domElem.outerHeight() -
                domElemOffsetTop -
                this.domElem.outerHeight()) > 0) {
            this.domElem.scrollTop(this.domElem.scrollTop() + relativeScroll);
        }
    },

    /**
     * @param {Object} item
     * @param {Object} data
     * @private
     */
    _onItemClick : function(item, data) {
        this.emit('item-click', { item : item, source : data.source });
    },

    /**
     * @param {jQuery.Event} e
     * @private
     */
    _onKeyDown : function(e) {
        var keyCode = e.keyCode,
            isArrow = keyCode === keyCodes.UP || keyCode === keyCodes.DOWN;

        if(isArrow && !e.shiftKey) {
            e.preventDefault();

            var dir = keyCode - 39, // using the features of key codes for "up"/"down" ;-)
                items = this.getItems(),
                len = items.length,
                hoveredIdx = items.indexOf(this._hoveredItem),
                nextIdx = hoveredIdx,
                i = 0;

            do {
                nextIdx += dir;
                nextIdx = nextIdx < 0? len - 1 : nextIdx >= len? 0 : nextIdx;
                if(++i === len) return; // if we have no next item to hover
            } while(items[nextIdx].hasMod('disabled'));

            this._lastTyping.index = nextIdx;

            items[nextIdx].setMod('hovered');
        }
    },

    /**
     * @param {jQuery.Event} e
     * @private
     */
    _onKeyPress : function(e) {
        var item = this.searchItemByKeyboardEvent(e);
        item && item.setMod('hovered');
    },

    /**
     * @param {Object} item
     * @param {String} text
     * @private
     */
    _doesItemMatchText : function(item, text) {
        return !item.hasMod('disabled') &&
            item.getText().toLowerCase().search(text) === 0;
    }
}, /** @lends menu */{
    live : function() {
        this
            .liveInitOnBlockInsideEvent({ modName : 'hovered', modVal : '*' }, 'menu-item', function(e) {
                this._onItemHover(e.target);
            })
            .liveInitOnBlockInsideEvent('click', 'menu-item', function(e, data) {
                this._onItemClick(e.target, data);
            });

        return this.__base.apply(this, arguments);
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/menu/menu.js */
/* begin: ../../libs/bem-components/common.blocks/menu-item/menu-item.js */
/**
 * @module menu-item
 */

modules.define('menu-item', ['i-bem__dom'], function(provide, BEMDOM) {

/**
 * @exports
 * @class menu-item
 * @bem
 *
 * @param val Value of item
 */
provide(BEMDOM.decl(this.name, /** @lends menu-item.prototype */{
    beforeSetMod : {
        'hovered' : {
            'true' : function() {
                return !this.hasMod('disabled');
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this.bindTo('pointerleave', this._onPointerLeave);
            }
        },

        'disabled' : {
            'true' : function() {
                this.__base.apply(this, arguments);
                this.delMod('hovered');
            }
        }
    },

    /**
     * Checks whether given value is equal to current value
     * @param {String|Number} val
     * @returns {Boolean}
     */
    isValEq : function(val) {
        // NOTE: String(true) == String(1) -> false
        return String(this.params.val) === String(val);
    },

    /**
     * Returns item value
     * @returns {*}
     */
    getVal : function() {
        return this.params.val;
    },

    /**
     * Returns item text
     * @returns {String}
     */
    getText : function() {
        return this.params.text || this.domElem.text();
    },

    _onPointerOver : function() {
        this.setMod('hovered');
    },

    _onPointerLeave : function() {
        this.delMod('hovered');
    },

    _onPointerClick : function() {
        this.hasMod('disabled') || this.emit('click', { source : 'pointer' });
    }
}, /** @lends menu-item */{
    live : function() {
        var ptp = this.prototype;
        this
            .liveBindTo('pointerover', ptp._onPointerOver)
            .liveBindTo('pointerclick', ptp._onPointerClick);
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/menu-item/menu-item.js */
/* begin: ../../desktop.blocks/objects-list/objects-list.js */
modules.define(
    'objects-list',
    ['BEMHTML', 'i-bem__dom', 'jquery', ],
    function(provide, BEMHTML, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('objects-list:inited');
                    
                    this._params = { userAuth : false };
                    this._data   = { heading: false, items: [] };
                    
                    this._items  = this.findElem('items');
                }
            }
        },

        setParams: function(params) {
            this._params = params || {};
        },

        append: function(items) {
            var that = this;

            (items || []).map(function(item) {
                var isHeading = item.mods && item.mods.heading;
                if (isHeading && that._params.heading) { return; }
                if (isHeading && !that._params.heading) { that._params.heading = true; }

                that._data.items.push(item);
                that.appendItem(item);
            });

            this._updateEvents();
        },

        update: function(items) {
            var that = this;

            this.clear(false);

            (items || []).map(function(item) {
                var isHeading = item.mods && item.mods.heading;
                if (isHeading && that._params.heading) { return; }
                if (isHeading && !that._params.heading) { that._params.heading = true; }

                that._data.items.push(item);
                that.appendItem(item);
            });

            this._updateEvents();
        },

        appendItem: function(item) {
            item = item || {};

            BEMDOM.append(this.elem('items'), BEMHTML.apply({
                block: 'objects-list-item',
                js:   item.js   || undefined,
                mods: item.mods || undefined,
                link: item.link || undefined,
                content: item
            }));
        },

        clear: function(all) {
            all = all || false;
            items = this.getItems(all);

            for (var i = items.length - 1; i >= 0; i--) {
                $(items[i].domElem).remove();
            };
        },

        getItems: function(all) {
            all = all ? true : false;

            var rows = all
                ? this.elem('items').find('.objects-list-item')
                : this.elem('items').find('.objects-list-item').not('.objects-list-item_heading');
            
            var items = [];
            rows.each(function(i) { items.push($(this).bem('objects-list-item')); });

            return items;
        },

        _updateEvents: function() {
            if (!this._checkAll && this._list) {
                this._checkAll = this.findBlockInside(this._list, 'checkbox', 'check-all', true);
                this._checkAll && this._checkAll.on({ modName: 'checked', modVal: '*' }, function(e) { this._onListCheckAllChange(e); }, this);
            }
        },
    }
));

});
/* end: ../../desktop.blocks/objects-list/objects-list.js */
/* begin: ../../libs/bem-components/common.blocks/checkbox/checkbox.js */
/**
 * @module checkbox
 */

modules.define('checkbox', ['i-bem__dom', 'control'], function(provide, BEMDOM, Control) {

/**
 * @exports
 * @class checkbox
 * @augments control
 * @bem
 */
provide(BEMDOM.decl({ block : this.name, baseBlock : Control }, /** @lends checkbox.prototype */{
    onSetMod : {
        'checked' : function(modName, modVal) {
            this.elem('control').prop(modName, modVal);
        }
    },

    _onChange : function() {
        this.setMod('checked', this.elem('control').prop('checked'));
    }
}, /** @lends checkbox */{
    live : function() {
        this.liveBindTo('control', 'change', this.prototype._onChange);
        return this.__base.apply(this, arguments);
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/checkbox/checkbox.js */
/* begin: ../../desktop.blocks/checkbox/checkbox.js */
/**
 * @module checkbox
 */

modules.define('checkbox', ['i-bem__dom', 'control'], function(provide, BEMDOM, Control) {

/**
 * @exports
 * @class checkbox
 * @augments control
 * @bem
 */
provide(BEMDOM.decl({ block : this.name, baseBlock : Control }, /** @lends checkbox.prototype */{
    onSetMod : {
        'checked' : function(modName, modVal) {
            this.elem('control').prop(modName, modVal);
            this.emit('change');
        }
    },

    _onChange : function() {
        this.setMod('checked', this.elem('control').prop('checked'));
        this.emit('change');
    }
}, /** @lends checkbox */{
    live : function() {
        this.liveBindTo('control', 'change', this.prototype._onChange);
        return this.__base.apply(this, arguments);
    }
}));

});

/* end: ../../desktop.blocks/checkbox/checkbox.js */
/* begin: ../../desktop.blocks/objects-list-item/objects-list-item.js */
modules.define(
    'objects-list-item',
    ['i-bem__dom', 'jquery', 'popup'],
    function(provide, BEMDOM, $) {

        provide(BEMDOM.decl(this.name, {
            onSetMod: {
                'js' : {
                    'inited' : function(){
                        this.in_lists = this.params.in_lists || [];
                        this._tools = this.findBlockInside('objects-list-item-tools');

                        this.bindTo(this.findElem('tools-item', 'first', true), 'click', this._toggleFavorite, this);
                        this.bindTo(this.findElem('tools-item', 'second', true), 'click', this._toggleLists, this);
                        this.bindTo(this.findElem('tools-item', 'third', true), 'click', this._toggleListseComments, this);

                        this.bindTo($(this.domElem).find('.voprosique'), 'click', function(e){ 
                            e.preventDefault();
                        });

                    }
                }
            },
            
            setInLists: function(id){
                if(this.in_lists.indexOf(id) == -1){
                    this.in_lists.push(id);
                }

                var elem = this._tools.findElem('tools-item', 'second', true);

                $(elem).addClass('objects-list-item-tools__tools-item_accept');
                $(this._tools.findBlockInside(elem, 'icon').domElem).removeClass('icon_action_plus').addClass('icon_action_plus-blue');
            },

            setInComments: function(){
                $(this._tools.findElem('tools-item', 'third', true)).addClass('objects-list-item-tools__tools-item_accept"');
                $(this._tools.findBlockInside(this.findElem('tools-item', 'third', true), 'icon').domElem).removeClass('icon_action_comments').addClass('icon_action_comments-blue');
            },

            _toggleLists : function(e){
                // e.stopPropagation();
            },

            _toggleComments : function(e){
                // e.stopPropagation();
            },

            _toggleFavorite: function(e){
                e.stopPropagation();
                var target = $(e.currentTarget);

                if (target.hasClass('objects-list-item__tools-item_accept')) {
                    $(e.currentTarget).removeClass('objects-list-item__tools-item_accept');
                    $(e.currentTarget)
                        .find('.icon')
                        .removeClass('icon_action_star')
                        .addClass('icon_action_star-o');
                } else {
                    $(e.currentTarget).addClass('objects-list-item__tools-item_accept');
                    $(e.currentTarget)
                        .find('.icon')
                        .addClass('icon_action_star')
                        .removeClass('icon_action_star-o');
                }
            }
        }

    ));

});

/* end: ../../desktop.blocks/objects-list-item/objects-list-item.js */
/* begin: ../../desktop.blocks/objects-list-item-tools/objects-list-item-tools.js */
modules.define(
    'objects-list-item-tools',
    ['BEMHTML', 'i-bem__dom', 'jquery', 'querystring', 'objects-list-item-lists', 'objects-list-item-note'],
    function(provide, BEMHTML, BEMDOM, $, Querystring, Lists, Note) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js': {
            'inited': function(){
                console.log('objects-list-item-tools:inited');

                this._params = {
                    userAuth:       false,
                    favoriteGetUrl: '/desktop.blocks/objects-list-item-tools/favorite.get.json',
                    favoritePutUrl: '/desktop.blocks/objects-list-item-tools/favorite.put.json',

                    loginUrl: '',
                    registerUrl: '',
                };

                this._data       = {};
                this._itemId     = this.params.itemId || '';
                this._itemType   = this.params.itemType || '';

                this._favorite   = this.elem('item', 'favorite');
                this._lists      = this.elem('item', 'lists');
                this._note       = this.elem('item', 'note');
                this._popupLists = null;
                this._popupNote  = null;

                this.emit('params');

                Lists.on(this.domElem, 'params', this._onParams, this);
                Note.on(this.domElem, 'params', this._onParams, this);
            }
        }
    },
    onElemSetMod: {
        'item': {
            'accept': {
                'true': function(elem, modName, modVal, curVal) {
                    if (this.hasMod(elem, 'favorite')) { this._onFavoriteSetMod(elem, modName, modVal, curVal); return; }
                    if (this.hasMod(elem, 'lists')) { this._onListsSetMod(elem, modName, modVal, curVal); return; }
                    if (this.hasMod(elem, 'note')) { this._onNoteSetMod(elem, modName, modVal, curVal); return; }
                },
                '': function(elem, modName, modVal, curVal) {
                    if (this.hasMod(elem, 'favorite')) { this._onFavoriteSetMod(elem, modName, modVal, curVal); return; }
                    if (this.hasMod(elem, 'lists')) { this._onListsSetMod(elem, modName, modVal, curVal); return; }
                    if (this.hasMod(elem, 'note')) { this._onNoteSetMod(elem, modName, modVal, curVal); return; }
                }
            }
        }
    },

    setParams: function(params) {
        this._params = params || {};
    },

    setData: function(data) {
        this._data = data || {};
    },

    _onFavoriteSetMod: function(elem, modName, modVal, curVal) {
        if (modName == 'accept') {
            elem.find('.icon').bem('icon').setMod('action', modVal ? 'star' : 'star-o');
        }
    },

    _onListsSetMod: function(elem, modName, modVal, curVal) {
        if (modName == 'accept') {
            elem.find('.icon').bem('icon').setMod('action', modVal ? 'list' : 'plus');
        }
    },

    _onNoteSetMod: function(elem, modName, modVal, curVal) {
        if (modName == 'accept') {
            elem.find('.icon').bem('icon').setMod('action', modVal ? 'comments-blue' : 'comments');
        }
    },

    _onClickFavorite: function(e) {
        e.preventDefault();

        var that = this;
        var item = e.currentTarget;

        var query = Querystring.stringify({
            'item_id':     this._itemId   || '',
            'item_type':   this._itemType || '',
            'is_favorite': (!this.hasMod(item, 'accept') | 0)
        });

        var url = this._params.favoritePutUrl + '?' + query;

        that.emit('ajax_start');

        this._xhr = $.ajax({method: 'GET', url: url, dataType: 'json', cache: false })
            .done(function(data) {
                !!data.result && that.toggleMod(item, 'accept');
                that.emit('ajax_end');
            })
            .fail(function(error) {
                console.log(error);
                that.emit('ajax_end');
            });
    },

    _onClickLists: function(e) {
        e.preventDefault();

        if (!this._popupLists) {
            this._popupLists = this._getPopupLists(e.currentTarget);

            if (this._popupLists) {
                var list = this._popupLists.findBlockInside('objects-list-item-lists');
                list && list
                    .on('add', this._onListsAdd, this)
                    .on('put', this._onListsPut, this);

                this._popupLists.setMod('visible');
            }

        } else {
            this._popupLists.setMod('visible');
        }
    },

    _onClickNote: function(e) {
        e.preventDefault();

        if (!this._popupNote) {
            this._popupNote = this._getPopupNote(e.currentTarget);

            if (this._popupNote) {
                var note = this._popupNote.findBlockInside('objects-list-item-note');
                note && note.on('put', this._onNotePut, this);

                this._popupNote.setMod('visible');
            }

        } else {
            this._popupNote.setMod('visible');
        }
    },

    _getPopupLists: function(item) {
        var userAuth = this._params.userAuth || false;

        BEMDOM.append(item, BEMHTML.apply({
            block: 'popup',
            mods: { theme : 'islands', target : 'anchor', autoclosable: true, closable: true },
            content: {
                block: 'objects-list-item-lists',
                js: {
                    itemId: this._itemId,
                    itemType: this._itemType
                },
                auth: userAuth,
                loginUrl: this._params.loginUrl,
                registerUrl: this._params.registerUrl
            }
        }));

        return this.findBlockInside(item, 'popup').setAnchor(item);
    },

    _getPopupNote: function(item) {
        var userAuth = this._params.userAuth || false;

        BEMDOM.append(item, BEMHTML.apply({
            block: 'popup',
            mods: { theme : 'islands', target : 'anchor', autoclosable: true, closable: userAuth },
            content: {
                block: 'objects-list-item-note',
                js: {
                    itemId: this._itemId,
                    itemType: this._itemType
                },
                auth: userAuth,
                loginUrl: this._params.loginUrl,
                registerUrl: this._params.registerUrl
            }
        }));

        return this.findBlockInside(item, 'popup').setAnchor(item);
    },

    _onParams: function(e) {
        e.target.setParams(this._params);
    },

    _onListsAdd: function(e, data) {
        this.setMod(this._lists, 'accept');
    },

    _onListsPut: function(e, data) {
        this.setMod(this._lists, 'accept');
    },

    _onNotePut: function(e, data) {
        this.setMod(this._note, 'accept');
    }

}, {
    'live': function() {
        this.liveBindTo('item', 'click', function(e) {
            var mods = this.getMods(e.currentTarget);

            if (mods.favorite) { this._onClickFavorite(e); return; }
            if (mods.lists) { this._onClickLists(e); return; }
            if (mods.note) { this._onClickNote(e); return; }
        });
    }
}

));

});

/* end: ../../desktop.blocks/objects-list-item-tools/objects-list-item-tools.js */
/* begin: ../../desktop.blocks/popup/_closable/popup_closable.js */
/**
 * @module popup
 */

modules.define(
    'popup',
    ['jquery', 'i-bem__dom', 'ua', 'dom', 'keyboard__codes'],
    function(provide, $, BEMDOM, ua, dom, keyCodes, Popup) {

/**
 * @exports
 * @class popup
 * @bem
 */
provide(Popup.decl({ modName : 'closable', modVal : true }, /** @lends popup.prototype */{
    onSetMod : {
        'visible' : {
            'true' : function() {
                // visiblePopupsStack.unshift(this);
                this
                    .nextTick(function() {

                        this.bindTo(this.elem('close_button'), 'click',  this._onCloseButtonClick, this);
                    })

                    .__base.apply(this, arguments);
            },
        }
    },

    _onCloseButtonClick : function(e) {
        this.delMod('visible');
    }





}, /** @lends popup */{
    live : function() {
        // BEMDOM.doc.on(KEYDOWN_EVENT, onDocKeyPress);
    }
}));


});

/* end: ../../desktop.blocks/popup/_closable/popup_closable.js */
/* begin: ../../desktop.blocks/objects-list-item-lists/objects-list-item-lists.js */
modules.define(
    'objects-list-item-lists',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js': {
            'inited': function(){
                console.log('objects-list-item-lists:inited');

                this._params = {
                    userAuth:    false,   
                    listsGetUrl: '/desktop.blocks/objects-list-item-lists/get.json',
                    listsPutUrl: '/desktop.blocks/objects-list-item-tools/put.json',
                    listsDelUrl: '/desktop.blocks/objects-list-item-tools/del.json',
                    listsAddUrl: '/desktop.blocks/objects-list-item-tools/add.json'
                };

                this._data       = {};
                this._itemId     = this.params.itemId || '';
                this._itemType   = this.params.itemType || '';

                this._popup      = this.findBlockOutside('popup');
                this._form       = this.findElem('add-form');
                this._input      = this._popup.findBlockInside('input');
                this._menu       = this._popup.findBlockInside('menu');

                this.emit('params');

                this.on('data_loaded', this._onDataLoaded, this);
                this.bindToDomElem(this._form, 'submit', this._onSubmitAddForm, this);

                if (this._params.userAuth) {
                    this._loadData()
                }
            }
        }
    },

    setParams: function(params) {
        this._params = params || {};
    },

    setData: function(data) {
        this._data = data || {};
    },

    update: function(data) {
        if (this._menu) {
            var val = data.in_lists || [];
            
            BEMDOM.replace(this._menu.domElem, BEMHTML.apply({
                block: 'menu',
                mods: { theme: 'islands', size: 'm', mode: 'check' },
                val: val,
                content: (data.lists || []).map(function(item) {
                    return {
                        block: 'menu-item',
                        js: { val: item.id, count: item.count },
                        val : item.id,
                        content: [
                            { tag: 'span', block: 'plain_text', mods: { size: '11'}, content: item.name + '&nbsp;' },
                            { tag: 'span', block: 'help', content: item.count }
                        ]
                    }
                })
            }));

            this._menu = this._popup.findBlockInside('menu');
            this._popup && this._popup.setMod('visible').redraw();

            this._setHandlers();
        }
    },

    _loadData: function() {
        var that = this;
        var url = this._params.listsGetUrl + this._getUrlParams();

        that.emit('ajax_start');

        this._xhr = $.ajax({
            method: 'GET',
            url: url,
            dataType: 'json',
            cache: false
        })
        .done(function(data) {
            that._data = data;
            that.emit('data_loaded');
            that.emit('ajax_end');
        })
        .fail(function(error) {
            console.log(error);
            that.emit('ajax_end');
        });
    },

    _onDataLoaded: function() {
        this.update(this._data);
    },

    _setHandlers: function() {
        var that = this;
        this._menu.findBlocksInside('menu-item').map(function(item) {
            item.un('click', that._onItemClick, that);
            item.on('click', that._onItemClick, that);

            if(item.hasMod('checked')){
                item.setMod('disabled');
            }
        });
    },

    _onSubmitAddForm: function(e) {
        e.preventDefault();

        if (!this._input) { return; }

        var that = this;
        var val = this._input.getVal();

        if (val == '') {
            $(this._input.elem('control')).focus();
            return;
        }

        var url = this._params.listsAddUrl;
        var data = { name: val, item_id: this._itemId, item_type: this._itemType };

        $.get(url, data, function(data) {
            that._input.setVal('');

            val = data.name || '';

            BEMDOM.append(that._menu.domElem, BEMHTML.apply({
                block : 'menu-item',
                mods : { theme : 'islands', size : 'm', checked: true, disabled: true },
                js: { count: 1 },
                content : [
                    {
                        tag: 'span',
                        block: 'plain_text',
                        mods: { size: '11'},
                        content: val + '&nbsp;'
                    },
                    {
                        tag: 'span',
                        block: 'help',
                        content: 1
                    }
                ]
            }));

            var d = $(that.elem('list'));
            d.scrollTop(d.prop("scrollHeight"));

            that.emit('add', data);
        });
    },

    _onItemClick: function(e){
        var that = this;
        var item = $(e.target.domElem).bem('menu-item');

        item.setMod('checked', true);
        item.setMod('disabled');

        var url = this._params.listsPutUrl;
        var data = { item_id: this._itemId, item_type: this._itemType, list_id: item.params.val };

        $.get(url, data, function(data) {
            var count = parseInt(item.params.count);
            var newval = count += 1;
            $(item.domElem).find('.help').html(newval);
            $(item.domElem).addClass('menu-item_checked');

            that.emit('put', data);

        });
    },
    _getUrlParams: function() {
        return '?' + ['item_id=' + (this._itemId || ''), 'item_type=' + (this._itemType || '')].join('&');
    }
}));


});
/* end: ../../desktop.blocks/objects-list-item-lists/objects-list-item-lists.js */
/* begin: ../../desktop.blocks/objects-list-item-note/objects-list-item-note.js */
modules.define(
    'objects-list-item-note',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js': {
            'inited': function(){
                console.log('objects-list-item-note:inited');

                this._params = {
                    userAuth:    false,   
                    userNoteGetUrl: '/desktop.blocks/objects-list-item-note/get.json',
                    userNotePutUrl: '/desktop.blocks/objects-list-item-note/put.json'
                };

                this._data       = {};
                this._itemId     = this.params.itemId || '';
                this._itemType   = this.params.itemType || '';

                this._popup    = this.findBlockOutside('popup');
                this._form     = this.findElem('form');
                this._cancel   = this.findBlockInside(this.findElem('cancel'), 'button'); 
                this._textarea = this.findBlockInside('textarea');

                this.emit('params');

                var that = this;
                this._cancel && this._cancel.on('click', function(e) {
                    e.preventDefault();
                    that._popup.delMod('visible');
                });

                if (this._form) {
                    this.bindToDomElem(this._form, 'submit', function(e) {
                        e.preventDefault();
                        var val = $(that._textarea.domElem).val();
                        
                        if (val == '') { $(that._textarea.domElem).focus(); return ; }
                        
                        var url = that._params.userNotePutUrl;
                        var data = { item_id: this._itemId, item_type: this._itemType, note: val };

                        $.get(url, data, function(data) {
                            that._popup.delMod('visible');
                            that.emit('put', data);
                        });
                    });
                }

                this.on('data_loaded', this._onDataLoaded, this);

                if (this._params.userAuth) {
                    this._loadData()
                }
            }
        }
    },

    setParams: function(params) {
        this._params = params || {};
    },

    setData: function(data) {
        this._data = data || {};
    },

    update: function(data) {
        this.elem('text').text(data.user_note || '');
        this._popup && this._popup.setMod('visible').redraw();
    },

    _loadData: function() {
        var that = this;
        var url = this._params.userNoteGetUrl + this._getUrlParams();

        that.emit('ajax_start');

        this._xhr = $.ajax({
            method: 'GET',
            url: url,
            dataType: 'json',
            cache: false
        })
        .done(function(data) {
            that._data = data;
            that.emit('data_loaded');
            that.emit('ajax_end');
        })
        .fail(function(error) {
            console.log(error);
            that.emit('ajax_end');
        });
    },

    _onDataLoaded: function() {
        this.update(this._data);
    },

    _getUrlParams: function() {
        return '?' + ['item_id=' + (this._itemId || ''), 'item_type=' + (this._itemType || '')].join('&');
    }

}));


});
/* end: ../../desktop.blocks/objects-list-item-note/objects-list-item-note.js */
/* begin: ../../libs/bem-components/common.blocks/input/input.js */
/**
 * @module input
 */

modules.define('input', ['i-bem__dom', 'control'], function(provide, BEMDOM, Control) {

/**
 * @exports
 * @class input
 * @augments control
 * @bem
 */
provide(BEMDOM.decl({ block : this.name, baseBlock : Control }, /** @lends input.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);
                this._val = this.elem('control').val();
            }
        }
    },

    /**
     * Returns control value
     * @returns {String}
     * @override
     */
    getVal : function() {
        return this._val;
    },

    /**
     * Sets control value
     * @param {String} val value
     * @param {Object} [data] additional data
     * @returns {input} this
     */
    setVal : function(val, data) {
        val = String(val);

        if(this._val !== val) {
            this._val = val;

            var control = this.elem('control');
            control.val() !== val && control.val(val);

            this.emit('change', data);
        }

        return this;
    }
}, /** @lends input */{
    live : function() {
        this.__base.apply(this, arguments);
        return false;
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/input/input.js */
/* begin: ../../libs/bem-components/desktop.blocks/input/input.js */
/**
 * @module input
 */

modules.define('input', ['tick', 'idle'], function(provide, tick, idle, Input) {

var instances = [],
    boundToTick,
    bindToTick = function() {
        boundToTick = true;
        tick
            .on('tick', update)
            .start();
        idle
            .on({
                idle : function() {
                    tick.un('tick', update);
                },
                wakeup : function() {
                    tick.on('tick', update);
                }
            })
            .start();
    },
    update = function() {
        var instance, i = 0;
        while(instance = instances[i++]) {
            instance.setVal(instance.elem('control').val());
        }
    };

/**
 * @exports
 * @class input
 * @bem
 */
provide(Input.decl(/** @lends input.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);

                boundToTick || bindToTick();

                // сохраняем индекс в массиве инстансов чтобы потом быстро из него удалять
                this._instanceIndex = instances.push(this) - 1;
            },

            '' : function() {
                this.__base.apply(this, arguments);

                // удаляем из общего массива instances
                instances.splice(this._instanceIndex, 1);
                // понижаем _instanceIndex всем тем кто был добавлен в instances после нас
                var i = this._instanceIndex, instance;
                while(instance = instances[i++]) --instance._instanceIndex;
            }
        }
    },

    /**
     * Нормализация установки фокуса для IE
     * @private
     * @override
     */
    _focus : function() {
        var input = this.elem('control')[0];
        if(input.createTextRange && !input.selectionStart) {
            var range = input.createTextRange();
            range.move('character', input.value.length);
            range.select();
        } else {
            input.focus();
        }
    }
}));

});

/* end: ../../libs/bem-components/desktop.blocks/input/input.js */
/* begin: ../../libs/bem-core/common.blocks/idle/idle.js */
/**
 * @module idle
 */

modules.define('idle', ['inherit', 'events', 'jquery'], function(provide, inherit, events, $) {

var IDLE_TIMEOUT = 3000,
    USER_EVENTS = 'mousemove keydown click',
    /**
     * @class Idle
     * @augments events:Emitter
     */
    Idle = inherit(events.Emitter, /** @lends Idle.prototype */{
        /**
         * @constructor
         */
        __constructor : function() {
            this._timer = null;
            this._isStarted = false;
            this._isIdle = false;
        },

        /**
         * Starts monitoring of idle state
         */
        start : function() {
            if(!this._isStarted) {
                this._isStarted = true;
                this._startTimer();
                $(document).on(USER_EVENTS, $.proxy(this._onUserAction, this));
            }
        },

        /**
         * Stops monitoring of idle state
         */
        stop : function() {
            if(this._isStarted) {
                this._isStarted = false;
                this._stopTimer();
                $(document).off(USER_EVENTS, this._onUserAction);
            }
        },

        /**
         * Returns whether state is idle
         * @returns {Boolean}
         */
        isIdle : function() {
            return this._isIdle;
        },

        _onUserAction : function() {
            if(this._isIdle) {
                this._isIdle = false;
                this.emit('wakeup');
            }

            this._stopTimer();
            this._startTimer();
        },

        _startTimer : function() {
            var _this = this;
            this._timer = setTimeout(
                function() {
                    _this._onTimeout();
                },
                IDLE_TIMEOUT);
        },

        _stopTimer : function() {
            this._timer && clearTimeout(this._timer);
        },

        _onTimeout : function() {
            this._isIdle = true;
            this.emit('idle');
        }
    });

provide(
    /**
     * @exports
     * @type Idle
     */
    new Idle());

});

/* end: ../../libs/bem-core/common.blocks/idle/idle.js */
/* begin: ../../libs/bem-components/common.blocks/textarea/textarea.js */
/**
 * @module textarea
 */

modules.define('textarea', ['i-bem__dom', 'input'], function(provide, BEMDOM, Input) {

/**
 * @exports
 * @class textarea
 * @augments input
 * @bem
 */
provide(BEMDOM.decl({ block : this.name, baseBlock : Input }));

});

/* end: ../../libs/bem-components/common.blocks/textarea/textarea.js */
/* begin: ../../desktop.blocks/user_lists_in_search/user_lists_in_search.js */
modules.define(
    'user_lists_in_search',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){
				console.log('user_lists_in_search:inited');

				this._data = [];

				this._paramsBlockName = this.params.paramsBlockName ? this.params.paramsBlockName : 'search_results';
				this._itemBlockName = this.params.itemBlockName ? this.params.itemBlockName : 'search_results_item';
				this._toolsBlockName = this.params.toolsBlockName ? this.params.toolsBlockName : 'tools';

				this._popup = this.findBlockOutside('popup');

				this._form = this.findElem('add_form');
				this._input = this._popup.findBlockInside('input');
				this._menu = this._popup.findBlockInside('menu');

				this._tools = this.findBlockOutside(this._toolsBlockName);
				this._search_results = this.findBlockOutside(this._paramsBlockName);
				this._search_results_item = this.findBlockOutside(this._itemBlockName);

				this.bindToDomElem(this._form, 'submit', this._onSubmitAddForm, this);

				var that = this;
				
				setTimeout(function(){
					that._setHandlers();
				}, 100);
				
			}
		}
	},

	_onSubmitAddForm : function(e){
		e.preventDefault();
		var that = this;
		var val = this._input.getVal();

		if(val == ''){
			$(this._input.elem('control')).focus();
			
		} else {
			var url = this._search_results ? this._search_results.params.new_list_url : '';

			if (this._tools){
				url = this._tools ? this._tools.params.new_list_url : '';
			}
			
			if(url){
				// поменять на post и поменять адрес
				$.get(url, {name: val, item_id: this.params.item_id}, function(data){
					
					//console.log(that.params.item_id);

					that._input.setVal('');


					BEMDOM.append(that._menu.domElem, 
						BEMHTML.apply({
				            block : 'menu-item',
				            mods : { theme : 'islands', size : 'm', checked: true, disabled: true},
				            js: { val: data.id, count: data.count },
				            val: data.id,
				            content : [
				            	{
				            		tag: 'span',
				            		block: 'plain_text',
				            		mods: { size: '11' },
				            		content: val + '&nbsp;'
				            	},
				            	{
				            		tag: 'span',
				            		block: 'help',
				            		content: data.count
				            	}
				            ]
				        }));

					var d = $(that.elem('lists_list'));
					d.scrollTop(d.prop("scrollHeight"));

					if(that._search_results){
						if (typeof that._search_results.pushToLists == 'function' && typeof that._search_results.updateLists == 'function') {
							that._search_results.pushToLists(data);
							that._search_results.updateLists();
						}

					}
					
					if(that._tools){
						$(that._tools.domElem).find('.icon.icon_action_plus').removeClass('icon_action_plus').addClass('icon_action_plus-blue');
					}


				});
			}
		}
	},

	_setHandlers: function(){
		var that = this;
		this.findBlockOutside('popup').findBlocksInside('menu-item').map(function(item){
			item.un('click', that._onItemClick, that);
			item.on('click', that._onItemClick, that);

			if(item.hasMod('checked')){
				item.setMod('disabled');
			}
		});
	},

	_onItemClick: function(e){
		var that = this;
		var item = $(e.target.domElem).bem('menu-item');
		var url = this._search_results ? this._search_results.params.add_to_list_url : '';

		if(this._tools){
			url = this._tools ? this._tools.params.add_to_list_url : '';
		}

		if(url){
			// поменять на post и поменять адрес
			$.get(url, {item_id: this.params.item_id, list_id: item.params.val}, function(data){
				var count = parseInt(item.params.count);
				var newval = count += 1;

				item.setMod('checked', true);
				item.setMod('disabled');

				$(item.domElem).find('.help').html(newval);
				$(item.domElem).addClass('menu-item_checked');

				if (that._search_results_item && typeof that._search_results_item.setInLists == 'function'){
					that._search_results_item.setInLists(item.params.val);
				}

				if(that._tools){
					$(that._tools.domElem).find('.icon.icon_action_plus').removeClass('icon_action_plus').addClass('icon_action_plus-blue');
				}

			});
		}
	}


}


));


});
/* end: ../../desktop.blocks/user_lists_in_search/user_lists_in_search.js */
/* begin: ../../desktop.blocks/user_comments_in_search/user_comments_in_search.js */
modules.define(
    'user_comments_in_search',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){
				this._paramsBlockName = this.params.paramsBlockName ? this.params.paramsBlockName : 'search_results';
				this._itemBlockName = this.params._itemBlockName ? this.params._itemBlockName : 'search_results_item';

				this._popup = this.findBlockOutside('popup');
				this._form = this.findElem('form');
				this._cancel = this.findBlockInside(this.findElem('cancel'), 'button'); 
				this._textarea = this.findBlockInside('textarea');

				this._search_results = this.findBlockOutside(this._paramsBlockName);
				this._search_results_item = this.findBlockOutside(this._itemBlockName);

				var that = this;

				if(this._cancel){
					this._cancel.on('click', function(e){
						e.preventDefault();
						that._popup.delMod('visible');
					});
				}
				
				if(this._form){
					this.bindToDomElem(this._form, 'submit', function(e){
						e.preventDefault();
						var val = $(that._textarea.domElem).val();
						
						if(val == ''){
							$(that._textarea.domElem).focus();
						} else {

							var url = that._search_results.params.comment_url;

							if(url){
								// поменять на post и поменять адрес
								$.get(url, {comment: val, item_id: that.params.item_id}, function(data){
									that._popup.delMod('visible');

									// Проверка наличия у объекта метода setInComments
									if (that._search_results_item && typeof that._search_results_item.setInComments == 'function') {
										that._search_results_item.setInComments();
									}
								});
							}
						}
					});
				}

				

			}
		}
	},

	setParams: function(paramsBlockName, itemBlockName) {
		this._paramsBlockName = paramsBlockName;
		this._itemBlockName = itemBlockName;
	}


}




));



});
/* end: ../../desktop.blocks/user_comments_in_search/user_comments_in_search.js */
/* begin: ../../desktop.blocks/pagination/pagination.js */
modules.define(
    'pagination',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {




provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){
				this._group  = this.findBlockInside('control-group');
				this._btns   = this.findBlocksInside('button');
				this._status = this.elem('status');

				this._inited       = false;
				this._current_page = 1;
				this._total_pages  = 1;
				this._total_items  = 0;	
				this._items_per_page  = 0;	
				this._current_page_items_count  = 0;	
     			
     			this._setEvent();
     			this.setStatus();
			}
		}
	},


	_setEvent: function(){
		var that = this;

		that.findBlocksInside('button').map(function(btn){
			btn.bindTo('click', function(e){
				e.preventDefault();
				var btn = $(e.currentTarget).bem('button');
				that._current_page = btn.params.page || 1;
				that.setContent();
				that.emit('change', [that._current_page]);
			});
		});

	},

	getCurrentPage: function(){
		return this._current_page;
	},

	getButtons: function(){
		return this._btns || this.findBlocksInside('button');
	},

	_clear: function(){
		this.findBlocksInside('button').map(function(btn){
			$(btn.domElem).remove();
		});
	},

	setContent: function() {
		this._clear();

		var from = 1;
		var to = 5;

		if(this._current_page > 1 && this._current_page < 4){
			from = 2;
			to = 6;
		}

		if(this._current_page >= 4){
			from = this._current_page - 2;
			to = this._current_page + 2;
		}

		if(to > this._total_pages){
			to = this._total_pages;
		}

		if(this._current_page != 1){
			this.addItem(1, 'Первая');
		}
		
		for (var i = from; i <= to; i++) {
			this.addItem(i, i, this._current_page == i);
		};

		if(this._current_page != this._total_pages){
			this.addItem(this._current_page + 1, 'Следующая');
		}

		this._setEvent();
		this.setStatus();
		
	},

	update: function(data) {
		data = data || {};

		if (!this._inited) {
			this.setParams(
				data.total_pages,
				data.current_page,
				data.total_items,
				data.items_per_page,
				data.items ? data.items.length : 0
			);

			this._inited = true;
		}
	},

	setParams: function(total_pages, current_page, total_items, items_per_page, current_page_items_count){
		this._total_pages = total_pages;
		this._current_page = current_page;
		this._total_items = total_items;
		this._items_per_page = items_per_page;
		this._current_page_items_count = current_page_items_count || 0;

		this.setContent();
	}, 

	setStatus: function(){
		var showing = this._items_per_page * (this._current_page - 1) + this._current_page_items_count;
		var txt = !isNaN(showing) ? 'Показано ' + showing + ' из ' + this._total_items : '';

		$(this._status).html(txt);
	},

	addItem: function(page_num, text, toggle) {
		toggle = toggle || false;

		BEMDOM.append(
            this._group.domElem,
            BEMHTML.apply({
            	js: {page: page_num},
	            block : 'button',
	            tag: 'a',
	            mix: { block: 'pagination', elem: 'button' },
	            mods : { theme : 'islands', size : 'l', type: 'link', checked: toggle },
	            attrs: {href: '/'},
	            content: [
	            	{
	            		elem: 'text',
	            		content: text
	            	}
	            ]
	        })
        );
	}

}));

});
/* end: ../../desktop.blocks/pagination/pagination.js */
/* begin: ../../desktop.blocks/account-my-ads-filter/account-my-ads-filter.js */
modules.define(
    'account-my-ads-filter',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js': {
            'inited': function() {
                console.log('account-my-ads-filter:inited');

                this._parent = null;
                this._status = this.findBlockOn(this.elem('status'), 'checkbox-group');
                this._action = this.findBlockOn(this.elem('action'), 'radio-group');
                this._target = this.findBlockOn(this.elem('target'), 'radio-group');
                this._flatTypes = this.findBlockOn(this.elem('flat-types'), 'checkbox-group');

                this._search = this.findBlockOn(this.elem('search-input'), 'input');
                this._searchSubmit = this.findBlockOn(this.elem('search-submit'), 'button');

                this.bindTo('submit', this._onFormSubmit);
                this._status && this._status.on('change', this._onStatusChange, this);
                this._action && this._action.on('change', this._onActionChange, this);
                this._target && this._target.on('change', this._onTargetChange, this);
                this._flatTypes && this._flatTypes.on('change', this._onFlatTypesChange, this);

                this._search && this.bindToDomElem(this._search.domElem, 'keypress', this._onSearchKeypress);
                this._searchSubmit && this.bindToDomElem(this._searchSubmit.domElem, 'click', this._onSearchSubmitEvents);

                this.update();
            }
        }
    },

    update: function() {
        this._updateFilters();
    },

    getData: function() {
        var data = [];

        (this._getFormData() || []).map(function(item) {
            item.value && data.push(item);
        });

        return data;
    },

    setData: function(data) {
        // TODO Реализовать возможность установки состояния фильтра
    },

    getParent: function() {
        return this._parent;
    },

    setParent: function(parent) {
        this._parent = parent;
    },

    _getFormData: function() {
        return $(this.domElem).serializeArray();
    },

    _submit: function() {
        $(this.domElem).submit();
    },

    _onFormSubmit: function(e) {
        e.preventDefault();
        this.emit('submit');
    },

    _onStatusChange: function() {
        console.log('status changed');
        this.update();
        this._submit();
    },

    _onActionChange: function() {
        console.log('action changed');
        this.update();
        this._submit();
    },

    _onTargetChange: function() {
        console.log('target changed');
        this.update();
        this._submit();
    },

    _onFlatTypesChange: function() {
        console.log('flatTypes changed');
        this.update();
        this._submit();
    },

    _onSearchKeypress: function(e) {
        if (e.type == 'keypress' && e.keyCode  == 13) {
            console.log('search submit: ');
            e.preventDefault();
            this._submit();
        }
    },

    _onSearchSubmitEvents: function(e) {
        console.log('search submit');
        e.preventDefault();
        this._submit();
    },

    _updateFilters: function() {
       
    }
}

));

});
/* end: ../../desktop.blocks/account-my-ads-filter/account-my-ads-filter.js */
/* begin: ../../libs/bem-components/common.blocks/checkbox-group/checkbox-group.js */
/**
 * @module checkbox-group
 */

modules.define(
    'checkbox-group',
    ['i-bem__dom', 'jquery', 'dom', 'checkbox'],
    function(provide, BEMDOM, $, dom) {

var undef;
/**
 * @exports
 * @class checkbox-group
 * @bem
 */
provide(BEMDOM.decl(this.name, /** @lends checkbox-group.prototype */{
    beforeSetMod : {
        'focused' : {
            'true' : function() {
                return !this.hasMod('disabled');
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this._inSetVal = false;
                this._val = this._extractVal();
                this._checkboxes = undef;
            }
        },

        'disabled' : function(modName, modVal) {
            this.getCheckboxes().forEach(function(option) {
                option.setMod(modName, modVal);
            });
        },

        'focused' : {
            'true' : function() {
                if(dom.containsFocus(this.domElem)) return;

                var checkboxes = this.getCheckboxes(),
                    i = 0, checkbox;

                while(checkbox = checkboxes[i++]) {
                    if(checkbox.setMod('focused').hasMod('focused')) // we need to be sure that checkbox has got focus
                        return;
                }
            },

            '' : function() {
                var focusedCheckbox = this.findBlockInside({
                        block : 'checkbox',
                        modName : 'focused',
                        modVal : true
                    });

                focusedCheckbox && focusedCheckbox.delMod('focused');
            }
        }
    },

    /**
     * Returns control value
     * @returns {String}
     */
    getVal : function() {
        return this._val;
    },

    /**
     * Sets control value
     * @param {Array[String]} val value
     * @param {Object} [data] additional data
     * @returns {checkbox-group} this
     */
    setVal : function(val, data) {
        val = val.map(String);

        var checkboxes = this.getCheckboxes(),
            wasChanged = false,
            notFoundValsCnt = val.length,
            checkboxesCheckedModVals = checkboxes.map(function(checkbox) {
                var isChecked = checkbox.hasMod('checked'),
                    hasEqVal = !!~val.indexOf(checkbox.getVal());

                if(hasEqVal) {
                    --notFoundValsCnt;
                    isChecked || (wasChanged = true);
                } else {
                    isChecked && (wasChanged = true);
                }

                return hasEqVal;
            });

        if(wasChanged && !notFoundValsCnt) {
            this._inSetVal = true;
            checkboxes.forEach(function(checkbox, i) {
                checkbox.setMod('checked', checkboxesCheckedModVals[i]);
            });
            this._inSetVal = false;
            this._val = val;
            this.emit('change', data);
        }

        return this;
    },

    /**
     * Returns name of control
     * @returns {String}
     */
    getName : function() {
        return this.getCheckboxes()[0].getName();
    },

    /**
     * Returns checkboxes
     * @returns {Array[checkbox]}
     */
    getCheckboxes : function() {
        return this._checkboxes || (this._checkboxes = this.findBlocksInside('checkbox'));
    },

    _extractVal : function() {
        return this.getCheckboxes()
            .filter(function(checkbox) {
                return checkbox.hasMod('checked');
            })
            .map(function(checkbox) {
                return checkbox.getVal();
            });
    },

    _onCheckboxCheck : function() {
        if(!this._inSetVal) {
            this._val = this._extractVal();
            this.emit('change');
        }
    },

    _onCheckboxFocus : function(e) {
        this.setMod('focused', e.target.getMod('focused'));
    }
}, /** @lends checkbox-group */{
    live : function() {
        var ptp = this.prototype;
        this
            .liveInitOnBlockInsideEvent(
                { modName : 'checked', modVal : '*' },
                'checkbox',
                ptp._onCheckboxCheck)
            .liveInitOnBlockInsideEvent(
                { modName : 'focused', modVal : '*' },
                'checkbox',
                ptp._onCheckboxFocus);
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/checkbox-group/checkbox-group.js */
/* begin: ../../libs/bem-components/common.blocks/radio-group/radio-group.js */
/**
 * @module radio-group
 */

modules.define(
    'radio-group',
    ['i-bem__dom', 'jquery', 'dom', 'radio'],
    function(provide, BEMDOM, $, dom) {

var undef;
/**
 * @exports
 * @class radio-group
 * @bem
 */
provide(BEMDOM.decl(this.name, /** @lends radio-group.prototype */{
    beforeSetMod : {
        'focused' : {
            'true' : function() {
                return !this.hasMod('disabled');
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this._checkedRadio = this.findBlockInside({
                    block : 'radio',
                    modName : 'checked',
                    modVal : true
                });

                this._inSetVal = false;
                this._val = this._checkedRadio? this._checkedRadio.getVal() : undef;
                this._radios = undef;
            }
        },

        'disabled' : function(modName, modVal) {
            this.getRadios().forEach(function(option) {
                option.setMod(modName, modVal);
            });
        },

        'focused' : {
            'true' : function() {
                if(dom.containsFocus(this.domElem)) return;

                var radios = this.getRadios(),
                    i = 0, radio;

                while(radio = radios[i++]) {
                    if(radio.setMod('focused').hasMod('focused')) { // we need to be sure that radio has got focus
                        return;
                    }
                }
            },

            '' : function() {
                var focusedRadio = this.findBlockInside({
                        block : 'radio',
                        modName : 'focused',
                        modVal : true
                    });

                focusedRadio && focusedRadio.delMod('focused');
            }
        }
    },

    /**
     * Returns control value
     * @returns {String}
     */
    getVal : function() {
        return this._val;
    },

    /**
     * Sets control value
     * @param {String} val value
     * @param {Object} [data] additional data
     * @returns {radio-group} this
     */
    setVal : function(val, data) {
        var isValUndef = val === undef;

        isValUndef || (val = String(val));

        if(this._val !== val) {
            if(isValUndef) {
                this._val = undef;
                this._checkedRadio.delMod('checked');
                this.emit('change', data);
            } else {
                var radio = this._getRadioByVal(val);
                if(radio) {
                    this._inSetVal = true;

                    this._val !== undef && this._getRadioByVal(this._val).delMod('checked');
                    this._val = radio.getVal();
                    radio.setMod('checked');

                    this._inSetVal = false;
                    this.emit('change', data);
                }
            }
        }

        return this;
    },

    /**
     * Returns name of control
     * @returns {String}
     */
    getName : function() {
        return this.getRadios()[0].getName();
    },

    /**
     * Returns options
     * @returns {radio[]}
     */
    getRadios : function() {
        return this._radios || (this._radios = this.findBlocksInside('radio'));
    },

    _getRadioByVal : function(val) {
        var radios = this.getRadios(),
            i = 0, option;

        while(option = radios[i++]) {
            if(option.getVal() === val) {
                return option;
            }
        }
    },

    _onRadioCheck : function(e) {
        var radioVal = (this._checkedRadio = e.target).getVal();
        if(!this._inSetVal) {
            if(this._val === radioVal) {
                // on block init value set in constructor, we need remove old checked and emit "change" event
                this.getRadios().forEach(function(radio) {
                    radio.getVal() !== radioVal && radio.delMod('checked');
                });
                this.emit('change');
            } else {
                this.setVal(radioVal);
            }
        }
    },

    _onRadioFocus : function(e) {
        this.setMod('focused', e.target.getMod('focused'));
    }
}, /** @lends radio-group */{
    live : function() {
        var ptp = this.prototype;
        this
            .liveInitOnBlockInsideEvent(
                { modName : 'checked', modVal : true },
                'radio',
                ptp._onRadioCheck)
            .liveInitOnBlockInsideEvent(
                { modName : 'focused', modVal : '*' },
                'radio',
                ptp._onRadioFocus);
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/radio-group/radio-group.js */
/* begin: ../../libs/bem-components/common.blocks/radio/radio.js */
/**
 * @module radio
 */

modules.define(
    'radio',
    ['i-bem__dom', 'control'],
    function(provide, BEMDOM, Control) {

/**
 * @exports
 * @class radio
 * @augments control
 * @bem
 */
provide(BEMDOM.decl({ block : this.name, baseBlock : Control }, /** @lends radio.prototype */{
    onSetMod : {
        'checked' : function(modName, modVal) {
            this.elem('control').prop(modName, modVal);
        }
    },

    _onChange : function() {
        this.hasMod('disabled') || this.setMod('checked');
    }
}, /** @lends radio */{
    live : function() {
        this.liveBindTo('change', this.prototype._onChange);
        return this.__base.apply(this, arguments);
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/radio/radio.js */
/* begin: ../../libs/bem-components/common.blocks/menu/_mode/menu_mode.js */
/**
 * @module menu
 */

modules.define('menu', ['keyboard__codes'], function(provide, keyCodes, Menu) {

/**
 * @exports
 * @class menu
 * @bem
 */
provide(Menu.decl({ modName : 'mode' }, /** @lends menu.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);
                this._val = null;
                this._isValValid = false;
            }
        }
    },

    _onKeyDown : function(e) {
        if(e.keyCode === keyCodes.ENTER || e.keyCode === keyCodes.SPACE) {
            this
                .unbindFromDoc('keydown', this._onKeyDown)
                .bindToDoc('keyup', this._onKeyUp);

            e.keyCode === keyCodes.SPACE && e.preventDefault();
            this._onItemClick(this._hoveredItem, { source : 'keyboard' });
        }
        this.__base.apply(this, arguments);
    },

    _onKeyUp : function() {
        this.unbindFromDoc('keyup', this._onKeyUp);
        // it could be unfocused while is key being pressed
        this.hasMod('focused') && this.bindToDoc('keydown', this._onKeyDown);
    },

    /**
     * Returns menu value
     * @returns {*}
     */
    getVal : function() {
        if(!this._isValValid) {
            this._val = this._getVal();
            this._isValValid = true;
        }
        return this._val;
    },

    /**
     * @abstract
     * @protected
     * @returns {*}
     */
    _getVal : function() {
        throw Error('_getVal is not implemented');
    },

    /**
     * Sets menu value
     * @param {*} val
     * @returns {menu} this
     */
    setVal : function(val) {
        if(this._setVal(val)) {
            this._val = val;
            this._isValValid = true;
            this.emit('change');
        }
        return this;
    },

    /**
     * @abstract
     * @protected
     * @param {*} val
     * @returns {Boolean} returns true if value was changed
     */
    _setVal : function() {
        throw Error('_setVal is not implemented');
    },

    _updateItemsCheckedMod : function(modVals) {
        var items = this.getItems();
        modVals.forEach(function(modVal, i) {
            items[i].setMod('checked', modVal);
        });
    },

    /**
     * Sets content
     * @override
     */
    setContent : function() {
        var res = this.__base.apply(this, arguments);
        this._isValValid = false;
        this.emit('change'); // NOTE: potentially unwanted event could be emitted
        return res;
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/menu/_mode/menu_mode.js */
/* begin: ../../desktop.blocks/account-my-ads-controller/account-my-ads-controller.js */
modules.define(
    'account-my-ads-controller',
    ['i-bem__dom', 'jquery', 'objects-list-item-tools'],
    function(provide, BEMDOM, $, ItemTools) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('account-my-ads-controller:inited');

                    this._params   = {
                        userAuth: false,

                        accountMyAds: {
                             dataUrl:       '/desktop.blocks/account-my-ads-content/data.json',
                        },

                        // List item tools url
                        favoriteGetUrl:    '/desktop.blocks/objects-list-item-tools/favorite.get.json',
                        favoritePutUrl:    '/desktop.blocks/objects-list-item-tools/favorite.put.json',
                        listsGetUrl:       '/desktop.blocks/objects-list-item-lists/get.json',
                        listsPutUrl:       '/desktop.blocks/objects-list-item-lists/put.json',
                        listsDelUrl:       '/desktop.blocks/objects-list-item-lists/del.json',
                        listsAddUrl:       '/desktop.blocks/objects-list-item-lists/add.json',
                        userNoteGetUrl:    '/desktop.blocks/objects-list-item-note/get.json',
                        userNotePutUrl:    '/desktop.blocks/objects-list-item-note/put.json',

                        loginUrl: 'login',
                        registerUrl: 'register'
                    };

                    this._params = $.extend(this._params, this.params);

                    this._data     = {};
                    this._page     = 1;
                    this._prevPage = 1;

                    this._main    = this.findBlockOn('account-my-ads-content');
                    this._list    = this.findBlockInside('objects-list');
                    this._filter  = this.findBlockInside('account-my-ads-filter');
                    this._pager   = this.findBlockInside('pagination');
                    this._spin    = this.findBlockInside('spin');

                    this._list && this._list.setParams(this._params);

                    this._setEvents();
                    this.loadData();
                }
            }
        },

        loadData: function() {
            var that = this;
            var params = this._getUrlParams();
            var url = this._getUrl() + (params ? '?' + params : '');

            this._abortRequest();
            this.emit('ajax_start');

            this._xhr = $.ajax({
                method: 'GET',
                url: url,
                dataType: 'json',
                cache: false
            })
            .done(function(data) {
                that._data = data;
                that.emit('data_loaded');
                that.emit('ajax_end');
            })
            .fail(function(error) {
                that.emit('data_load_error', { error: error });
                that.emit('ajax_end');
            });
        },

        _abortRequest: function() {
             this._xhr && this._xhr.abort();
        },

        _getUrl: function() {
            var urls = this._params.accountMyAds;
            return urls && (urls.dataUrl || '');
        },

        _getUrlParams: function() {
            var params = this._filter ? this._filter.getData() : [];

            if (this._sort) {
                params.push({ name: 'sort', value: this._sort.getVal() });
            }

            if (this._page > 1) {
                params.push({ name: 'page', value: this._page });
            }

            return $.param(params);
        },

        _setUrlQueryString: function(){
            window.history.pushState(null, null, window.location.pathname + '?' + this._getUrlParams());
        },

        _setEvents: function() {
            var that = this;

            ItemTools.on(this.domElem, 'params', function(e) {
                e.target.setParams(that._params);
            }, this);

            this.on('data_loaded', this._onDataLoaded, this);
            this.on('data_load_error', this._onDataLoadError, this);
            this._filter && this._filter.on('submit', this._onFilterSubmit, this);
            this._pager.on('change', this._onPageChange, this);

            this.on('ajax_start', function() {
                that._list && that._list.setMod('loading');
                that._spin && that._spin.setMod('visible');
            });

            this.on('ajax_start', function() {
                that._spin && that._spin.delMod('visible');
                that._list && that._list.delMod('loading');
            });
        },

        _onDataLoaded: function() {
            var data = this._data;

            data.user_auth = !!data.user_auth; // TODO нужно доработать проверку входа пользователя
            data.current_page = this._page;
            data.items = data.items || [];
            
            // Количество строк без учета заголовка
            data.items_count = 0;
            data.items.map(function(item) { if (!item.mods || !item.mods.heading) data.items_count++; });

            this._setUrlQueryString();
            this._params.userAuth = data.user_auth;

            if (this._list) {
                this._list.setParams(this._params);
                this._list.update(data.items, data.lists || [], data.user_auth);
            }

            this._pager && this._pager.setParams(data.total_pages, data.current_page, data.total_items, data.items_per_page, data.items_count);
        },

        _onDataLoadError: function(e, data) {
            this._page = this._prevPage;
            console.log(data.error);
        },

        _onFilterSubmit: function() {
            this.loadData();
        },

        _onPageChange: function(e, data) {
            data = data || [];

            this._prevPage = this._page;
            this._page = data.length ? data[0] : 1;
            this.loadData();
        }
    }
));


});
/* end: ../../desktop.blocks/account-my-ads-controller/account-my-ads-controller.js */
/* begin: ../../desktop.blocks/account-favorites/account-favorites.js */
modules.define(
    'account-favorites',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js': {
                'inited': function(){
                    console.log('account-favorites:intited');
                    this._totalItems = 0;
                }
            }
        },

        update: function(data) {
            this._totalItems = (data.total_items || 0 ) + 0;
            this.elem('title-note').text(this._totalItems + ' объектов');
        }
    }
));

})
/* end: ../../desktop.blocks/account-favorites/account-favorites.js */
/* begin: ../../desktop.blocks/account-favorites-list/account-favorites-list.js */
modules.define(
	'account-favorites-list',
	['BEMHTML', 'i-bem__dom', 'jquery', 'account-favorites-list-item'],
	function(provide, BEMHTML, BEMDOM, $, Items) {

provide(BEMDOM.decl(this.name, {
	onSetMod: {
		'js': {
			'inited': function(){
                console.log('account-favorites-list:intited');

                this._params = {};
                this._items  = [];

                this.emit('params');

                Items.on(this.domElem, 'params', this._onParams, this);
                Items.on(this.domElem, 'data',  this._onData, this);
			}
		}
	},

	setParams: function(params) {
        this._params = params || {};
    },

    setData: function(data) {
    	
    },

    update: function(items) {
    	console.log('Update: account-favorites-list');
    },

    append: function(items) {
    	var that = this;

    	items = items || [];
    	this._items.concat(items);

    	items.map(function(item) {
    		that.appendItem(item);
    	});
    },

    appendItem: function(item) {
    	item = item || {};

		BEMDOM.append(this.domElem, BEMHTML.apply({
        	block: 'account-favorites-list-item',
			js:   item.js   || undefined,
        	mods: item.mods || undefined,
        	link: item.link || undefined,
        	content: item
        }));
    },

	clear: function(all){
		all = all || false;
		items = this._getItems(all);

		for (var i = items.length - 1; i >= 0; i--) {
            $(items[i].domElem).remove();
        };
	},
	
	_getItems: function(all){
		all = all || false;
		if (!all) {
			return this.findBlocksInside({ block: 'account-favorites-list-item'});
		}
		return this.findBlocksInside('account-favorites-list-item');
	},

	_onParams: function(e) {
        e.target.setParams(this._params);
    },

	_onData: function(e) {
		var item = e.target;
		var id = item.params && item.params.id;
		var data;

		if (id) {
			for (var i = 0, l = this._items.length; i < l; i++) {
				if (this._items[i].js && this._items[i].js.id == id) {
					data = this._items[i];
					break;
				}
			}

        	data && e.target.setData(data);
		}

    }

}


));





});
/* end: ../../desktop.blocks/account-favorites-list/account-favorites-list.js */
/* begin: ../../desktop.blocks/account-favorites-list-item/account-favorites-list-item.js */
modules.define(
    'account-favorites-list-item',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

        provide(BEMDOM.decl(this.name, {
            onSetMod: {
                'js' : {
                    'inited' : function(){
                        console.log('account-favorites-list-item:inted');
                    }
                }
            },

            setParams: function(params) {
            
            },

            setData: function(data) {

            }        

    }));

});

/* end: ../../desktop.blocks/account-favorites-list-item/account-favorites-list-item.js */
/* begin: ../../desktop.blocks/account-favorites-list-pager/account-favorites-list-pager.js */
modules.define('account-favorites-list-pager', ['i-bem__dom', 'jquery', 'BEMHTML', 'account-favorites-list-item'], function(provide, BEMDOM, $, BEMHTML, Item) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        js: {
            inited: function() {
				var that = this;
				
				this.button = $('#load-more-favs-button').bem('button');
				
				this.on('ajax_start', function(){
					that.button.setMod('disabled');
				});

				this.on('ajax_end', function(){
					that.button.delMod('disabled');
				});
            }
        }
    },

    _sendRequest: function() {
		this.emit('ajax_start');
		
        $.ajax({
            type: 'GET',
            dataType: 'json',
            cache: false,
            url: this.params.url,
            data: '',
            success: this._onSuccess.bind(this),
            error: function(err){
                console.log(err);
            }
        });
    },

    _onSuccess: function(data) {
		this.emit('ajax_end');
        this._data = data;
		this.emit('data_loaded');
    },
	
	getData: function(){
		return this._data;
	}
}));

});
/* end: ../../desktop.blocks/account-favorites-list-pager/account-favorites-list-pager.js */
/* begin: ../../desktop.blocks/pager/pager.js */
modules.define(
    'pager',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){
				this._currentPage  = 1;
				this._totalPages   = 1;
				this._currentItems = 0;
				this._totalItems   = 0;	
				
				this._next   = this.elem('next');
				this._status = this.elem('status');

     			var that = this;

				this.bindTo(this._next, 'click', function(e) {
					e.preventDefault();
					that.emit('change', { page: this._currentPage + 1 });
				});
			}
		}
	},

	getCurrentPage: function() {
		return this._currentPage;
	},

	update: function(data) {
		this._currentPage  = (data.current_page || 1) + 0;
		this._totalPages   = (data.total_pages  || 1) + 0;
		this._totalItems   = (data.total_items  || 0) + 0;

		if (data.items_count) {
			this._currentItems = this._currentItems + data.items_count;	
		} else {
			this._currentItems = this._currentItems + (data.items ? data.items.length : 0);		
		}


		var status = 'Показано ' + this._currentItems + ' из ' + this._totalItems;
		this._status && this._status.text(status);
	}

}));


});
/* end: ../../desktop.blocks/pager/pager.js */
/* begin: ../../desktop.blocks/account-favorites-controller/account-favorites-controller.js */
modules.define(
    'account-favorites-controller',
    ['BEMHTML', 'i-bem__dom', 'jquery', 'account-favorites-list', 'objects-list-item-tools'],
    function(provide, BEMHTML, BEMDOM, $, List, Tools) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('account-favorites-controller:intited');

                    this._params = {
                        userAuth:       false,

                        dataUrl:        '/desktop.blocks/account-favorites/data.json',

                        favoriteGetUrl: '/desktop.blocks/objects-list-item-tools/favorite.get.json',
                        favoritePutUrl: '/desktop.blocks/objects-list-item-tools/favorite.put.json',
                        
                        listsGetUrl:    '/desktop.blocks/objects-list-item-lists/get.json',
                        listsPutUrl:    '/desktop.blocks/objects-list-item-lists/put.json',
                        listsDelUrl:    '/desktop.blocks/objects-list-item-lists/del.json',
                        listsAddUrl:    '/desktop.blocks/objects-list-item-lists/add.json',

                        userNoteGetUrl: '/desktop.blocks/objects-list-item-note/get.json',
                        userNotePutUrl: '/desktop.blocks/objects-list-item-note/put.json'
                    };

                    this._params = $.extend(this._params, this.params);

                    this._data     = {};
                    this._page     = 1;
                    this._prevPage = 1;
                    this._main     = this.findBlockOn('account-favorites');
                    this._menu     = this.findBlockOutside('account-menu');
                    this._list     = this.findBlockInside('account-favorites-list');
                    this._pager    = this.findBlockInside('pager');
                    this._spin     = this.findBlockInside('spin');
                    this._toolbar  = this._main && this._main.elem('toolbar');

                    List.on(this.domElem, 'params', this._onParams, this);
                    Tools.on(this.domElem, 'params', this._onParams, this);

                    this.on('ajax_start', function() { this.setMod('loading'); });
                    this.on('ajax_end', function() { this.delMod('loading'); });
                    this.on('data_loaded', this._onDataLoaded, this);
                    this.on('data_load_error', this._onDataLoadError, this);

                    this._pager && this._pager.on('change', this._onPageChange, this);

                    this.loadData();
                }
            },
            'loading': {
                true: function() {
                    this._list && this._list.setMod('loading');
                    this._pager && this.setMod('loading');
                    this._spin && this._spin.setMod('visible');
                },
                '': function() {
                    this._list && this._list.delMod('loading');
                    this._pager && this.delMod('loading');
                    this._spin && this._spin.delMod('visible');
                }
            }
        },

        getData: function() {
            return this._data;
        },

        loadData: function() {
            this._abortRequest();

            var that = this;
            var query = this._getUrlParams();
            var url = (this._params.dataUrl || '') + (query ? '?' + query : '');

            this.emit('ajax_start');

            this._xhr = $.ajax({
                method: 'GET',
                url: url,
                dataType: 'json',
                cache: false
            })
            .done(function(data) {
                that._data = data;
                that.emit('data_loaded');
                that.emit('ajax_end');
            })
            .fail(function(error) {
                that.emit('data_load_error', { error: error });
                that.emit('ajax_end');
            });
        },

        _setUrlQueryString: function() {
            var query = this._getUrlParams();
            window.history.pushState(null, null, window.location.pathname +  (query ? '?' + query : ''));
        },

        _onDataLoaded: function() {
            var data = this._data;

            this._setUrlQueryString();
            
            // Sanitize data
            var userAuth = data.user_auth;
            switch (typeof userAuth) {
                case 'string': userAuth = userAuth == 'true' ? true : false; break;
                case 'boolean': userAuth = Boolean(userAuth); break;
                default: userAuth = false;
            }

            data.user_auth = userAuth;
            data.current_page = this._page;
            data.lists = data.lists || [];
            data.items = data.items || [];

            // Количество строк без учета заголовка
            data.items_count = 0;
            data.items.map(function(item) { if (!item.mods || !item.mods.heading) data.items_count++; });

            // Update user auth
            this._params.userAuth = data.user_auth;

            // Update list
            if (this._list) {
                this._list.setParams(this._params);
                this._list.append(data.items);
            }

            this._main && this._main.update(data);
            this._pager && this._pager.update(data);
        },

        _onDataLoadError: function(e, data) {
            this._page = this._prevPage;
            console.log(data.error);
        },

        _onPageChange: function(e, data) {
            data = data || {};
            this._prevPage = this._page;
            this._page = data.page || 1;

            this.loadData();
        },

        _abortRequest: function() {
             this._xhr && this._xhr.abort();
        },

        _getUrlParams: function() {
            // TODO Save prev value if ajax error
            return (this._page > 1 ? 'page=' + this._page : '');
        },

        _onParams: function(e) {
            e.target.setParams(this._params);
        }

    }
));


});
/* end: ../../desktop.blocks/account-favorites-controller/account-favorites-controller.js */
/* begin: ../../desktop.blocks/account-dashboard-list/account-dashboard-list.js */
modules.define(
    'account-dashboard-list',
    ['BEMHTML', 'i-bem__dom', 'jquery', 'checkbox'],
    function(provide, BEMHTML, BEMDOM, $, Checkbox) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js': {
                'inited': function() {
                    console.log('account-dashboard-list:inited');

                    this._params = {};
                    this._data   = { heading: false, items: [] };

                    this._title        = this.elem('title');
                    this._titleText    = this.elem('title-text');
                    this._titleNote    = this.elem('title-note');
                    this._titleEdit    = this.findBlockInside('account-dashboard-list-title-edit');
                    this._commentEdit  = this.findBlockInside('account-dashboard-list-comment-edit');
                    this._toolbar      = this.findBlockInside('account-dashboard-list-toolbar');
                    this._list         = this.elem('list');
                    
                    this._checkAll = this.findBlockInside(this._list, 'checkbox', 'check-all', true);
                    this._checkAll && this._checkAll.on('change', this._onListCheckAllChange(e), this);

                    this.emit('params');
                }
            },
            'new': {
                'true': function() {
                    this.setMod(this._title, 'hidden');
                    this._titleEdit && this._titleEdit.setMod('visible');
                    this._commentEdit && this._commentEdit.setMod('visible');
                },
                '': function() {
                    this.delMod(this._title, 'hidden');
                    this._titleEdit && this._titleEdit.delMod('visible');
                    this._commentEdit && this._commentEdit.delMod('visible');
                }
            },
            'title-edit': {
                'true': function() {
                    this.setMod(this._title, 'hidden');
                    this._titleEdit && this._titleEdit.isEmpty() && this._titleEdit.setText(this._titleText.text());
                    this._titleEdit && this._titleEdit.setMod('visible');
                },
                '': function() {
                    this.delMod(this._title, 'hidden');
                    this._titleEdit && this._titleEdit.delMod('visible');
                }
            }
        },

        setParams: function(params) {
            this._params = params || {};
        },

        setData: function(data) {
            this._data = data || {};
        },

        update: function(items) {
            console.log('Update: account-dashboard-list');
        },

        append: function(items) {
            var that = this;

            (items || []).map(function(item) {
                var isHeading = item.mods && item.mods.heading;

                if (isHeading && that._params.heading) { return; }
                if (isHeading && !that._params.heading) { that._params.heading = true; }

                that._data.items.push(item);
                that.appendItem(item);
            });

            this._updateEvents();
        },

        appendItem: function(item) {
            item = item || {};

            BEMDOM.append(this._list, BEMHTML.apply({
                block: 'account-dashboard-list-item',
                js:   item.js   || undefined,
                mods: item.mods || undefined,
                link: item.link || undefined,
                content: item
            }));
        },

        clear: function(all) {
            all = all || false;
            items = this._getItems(all);

            for (var i = items.length - 1; i >= 0; i--) {
                $(items[i].domElem).remove();
            };
        },

        getItems: function(all) {
            if (all) {
                return this.findBlocksInside('account-dashboard-list-item');
            }
            return this.findBlocksInside({ block: 'account-dashboard-list-item'});
        },

        _updateEvents: function() {
            if (!this._checkAll && this._list) {
                this._checkAll = this.findBlockInside(this._list, 'checkbox', 'check-all', true);
                this._checkAll && this._checkAll.on({ modName: 'checked', modVal: '*' }, function(e) { this._onListCheckAllChange(e); }, this);
            }
        },

        _onListCheckAllChange: function(e) {
            if (this._list) {
                var checked = e.target.getMod('checked');
                var checkboxes = this.findBlocksInside(this._list, { block: 'checkbox', modName: 'check-item', modVal: true });

                checkboxes.forEach(function(item) { 
                    item.setMod('checked', checked);
                });
            }
        },

        _onToolButtonClicked: function(e) {
            var target = $(e.currentTarget);
            var mods = this.getMods(target);

            if (mods.first == true) {
                this._toggleFavorite(e);
                return;
            }

            if (mods.second == true) {
                this._toggleLists(e);
                return;
            }

            if (mods.third == true) {
                this._toggleComments(e);
                return;
            }
        },
        
    }, {
        live: function() {
            this.liveBindTo('tools-item', 'click', function(e) { this._onToolButtonClicked(e); });
        }
    }
));

});
/* end: ../../desktop.blocks/account-dashboard-list/account-dashboard-list.js */
/* begin: ../../desktop.blocks/account-dashboard-list-tools/account-dashboard-list-tools.js */
modules.define(
    'account-dashboard-list-tools',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js': {
            'inited': function() {
                console.log('account-dashboard-list-tools:inited');
            }
        }
    }

}, {
    live: function() {
        this.liveBindTo('button', 'click', function(e) {
            var action = this.getMod(e.currentTarget, 'action');
            this.emit('action', action);
        });
    }
}

))

});

/* end: ../../desktop.blocks/account-dashboard-list-tools/account-dashboard-list-tools.js */
/* begin: ../../desktop.blocks/account-dashboard-list-title-edit/account-dashboard-list-title-edit.js */
modules.define(
    'account-dashboard-list-title-edit',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js': {
                'inited': function() {
                    console.log('account-dashboard-list-title-edit:inited');

                    this._empty = true;
                    this._input = this.findBlockInside('input');

                    this.bindTo(this.elem('button'), 'click', function(e) {
                        this.emit('save', this._input && this._input.getVal());
                    });
                }
            },
            'saved': {
                'true': function() {

                },
                '': function() {

                }
            },
            'modified': {
                'true': function() {

                },
                '': function() {

                }
            }
        },

        getText: function() {
            return this._input && this._input.getVal();
        },

        setText: function(text) {
            this._input && this._input.setVal(text);
            //this._empty = false;
        },

        isEmpty: function() {
            return this._empty;
        },

        setEmpty: function(empty) {
            this._empty = empty;
            this._empty && this.setText('');
        }
    }

))

});

/* end: ../../desktop.blocks/account-dashboard-list-title-edit/account-dashboard-list-title-edit.js */
/* begin: ../../desktop.blocks/account-dashboard-list-comment-edit/account-dashboard-list-comment-edit.js */
modules.define(
    'account-dashboard-list-comment-edit',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js': {
                'inited': function() {
                    console.log('account-dashboard-list-comment-edit:inited');

                    this._toggle = this.elem('button', 'action', 'toggle');
                    this._save   = this.elem('button', 'action', 'save');
                    this._button = this._save && this.findBlockOn(this._save, 'button');
                    this._input  = this.findBlockInside('textarea');
                    this._icon   = this.findBlockInside(this._toggle, 'icon');

                    this._comment = this._input ? this._input.getVal() : '';

                    var that = this;

                    this._toggle && this.bindTo(this._toggle, 'click', this._onToggleClicked, this);
                    this._save && this.bindTo(this._save, 'click', this._onSaveClicked, this);
                    this._input && this._input.bindTo('keyup input', function(e) { that._onInputChanged(e); });

                    this._button && this._button.setMod('hidden');
                    this._updateState();
                }
            },
            'disabled': {
                'true': function() {
                    this._toggle && this.setMod(this._toggle, 'disabled');
                    this._save && this._save.bem('button').setMod('disabled');
                },
                '': function() {
                    this._toggle && this.delMod(this._toggle);
                    this._save && this._save.bem('button').delMod('disabled');
                }
            },
            'saved': {
                'true': function() {
                    this.delMod('modified');
                    this._button && this._button.setMod('saved').findElem('text').text('Сохранено');
                    this._button && this._button.delMod('hidden');
                },
                '': function() {
                    this._button && this._button.delMod('saved');
                }
            },
            'modified': {
                'true': function() {
                    this.delMod('saved');
                    this._button && this._button.delMod('saved').findElem('text').text('Сохранить');
                    this._button && this._button.delMod('hidden');
                },
                '': function() {
                    this._button && this._button.setMod('hidden');
                }
            }
        },

        getComment: function() {
            return this._input && this._input.getVal();
        },

        setComment: function(text) {
            this._comment = text;
            this._input && this._input.setVal(text);
            this._updateState();
        },

        update: function(text) {
            this.setComment(text);
        },

        _updateState: function() {
            var hasComment = this._comment && this._comment.length;
            this._icon && this._icon.setMod('action', hasComment ? 'comments-blue' : 'comments');
        },

        _onToggleClicked: function(e) {
            !this.hasMod('disabled') && this.toggleMod('visible');
        },

        _onSaveClicked: function(e) {
            !this.hasMod('disabled') && this._input && this.emit('save', this._input.getVal());
        },

        _onInputChanged: function(e) {
            var val = $(e.currentTarget).val();
            if (val != this._comment) {
                this.setMod('modified');
            } else {
                this.delMod('modified');
            }
        }
    }

))

});

/* end: ../../desktop.blocks/account-dashboard-list-comment-edit/account-dashboard-list-comment-edit.js */
/* begin: ../../desktop.blocks/account-dashboard-list-item/account-dashboard-list-item.js */
modules.define(
    'account-dashboard-list-item',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
            
    }));

});

/* end: ../../desktop.blocks/account-dashboard-list-item/account-dashboard-list-item.js */
/* begin: ../../desktop.blocks/account-dashboard-title-edit/account-dashboard-title-edit.js */
modules.define(
    'account-dashboard-title-edit',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js': {
                'inited': function() {
                    console.log('account-dashboard-title-edit:inited');

                    this._empty = true;
                    this._input = this.findBlockInside('input');

                    this.bindTo(this.elem('button'), 'click', function(e) {
                        this.emit('save', this._input && this._input.getVal());
                    });
                }
            }
        },

        getText: function() {
            return this._input && this._input.getVal();
        },

        setText: function(text) {
            this._input && this._input.setVal(text);
            //this._empty = false;
        },

        isEmpty: function() {
            return this._empty;
        },

        setEmpty: function(empty) {
            this._empty = empty;
            this._empty && this.setText('');
        }
    }

))

});

/* end: ../../desktop.blocks/account-dashboard-title-edit/account-dashboard-title-edit.js */
/* begin: ../../desktop.blocks/account-dashboard-list-controller/account-dashboard-list-controller.js */
modules.define(
    'account-dashboard-list-controller',
    ['BEMHTML', 'i-bem__dom', 'jquery', 'objects-list-item-tools'],
    function(provide, BEMHTML, BEMDOM, $, ItemTools) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('account-dashboard-list-controller:inited');
                    
                    this._params = {
                        userAuth:       false,
                        accountDashboardList: {
                            dataUrl:       '/desktop.blocks/account-dashboard-list/data.json',
                            copyUrl:       '/desktop.blocks/account-dashboard-list/copy.json',
                            deleteUrl:     '/desktop.blocks/account-dashboard-list/del.json',
                            titlePutUrl:   '/desktop.blocks/account-dashboard-list/title.put.json',
                            commentGetUrl: '/desktop.blocks/account-dashboard-list/comment.get.json',
                            commentPutUrl: '/desktop.blocks/account-dashboard-list/comment.put.json',
                        },

                        // List item tools url
                        favoriteGetUrl:    '/desktop.blocks/objects-list-item-tools/favorite.get.json',
                        favoritePutUrl:    '/desktop.blocks/objects-list-item-tools/favorite.put.json',
                        listsGetUrl:       '/desktop.blocks/objects-list-item-lists/get.json',
                        listsPutUrl:       '/desktop.blocks/objects-list-item-lists/put.json',
                        listsDelUrl:       '/desktop.blocks/objects-list-item-lists/del.json',
                        listsAddUrl:       '/desktop.blocks/objects-list-item-lists/add.json',
                        userNoteGetUrl:    '/desktop.blocks/objects-list-item-note/get.json',
                        userNotePutUrl:    '/desktop.blocks/objects-list-item-note/put.json'
                    };

                    this._params = $.extend(this._params, this.params);

                    this._data     = {};
                    this._page     = 1;
                    this._prevPage = 1;
                    this._id       = this.params.id || 0;
                    this._isNew    = this.params.is_new ? true : false;
                    this._heading  = false;

                    this._dashboard    = this.findBlockOutside('account-dashboard');
                    this._main         = this.findBlockOn('account-dashboard-list');
                    this._pager        = this.findBlockInside('pager');
                    this._spin         = this.findBlockInside('spin');
                    this._tools        = this.findBlockInside('account-dashboard-list-tools');
                    this._titleEdit    = this.findBlockInside('account-dashboard-list-title-edit');
                    this._comment      = this.findBlockInside('account-dashboard-list-comment-edit');

                    this._main && this._main.setParams(this._params);

                    this._setEvents();
                    
                    this._isNew && this._main && this._main.setMod('new');
                    !this._isNew && this.loadData();
                }
            },
            'loading': {
                true: function() {
                    this._main && this._main.setMod('loading');
                    this._pager && this.setMod('loading');
                    this._spin && this._spin.setMod('visible');
                },
                '': function() {
                    this._main && this._main.delMod('loading');
                    this._pager && this.delMod('loading');
                    this._spin && this._spin.delMod('visible');
                }
            }
        },

        setState: function() {
            if (this._isNew) {
                this._tools && this._tools.domElem.hide();

                this._dashboard.setMod(this._title, 'hidden');
                this._titleEdit.setMod('edit');
                this._titleEdit.delMod('hidden');
            }
        },

        getData: function() {
            return this._data;
        },

        loadData: function() {
            var that = this;

            var params = [{ name: 'item_id', value: this._id }];
            var url = this._getUrl() + this._getUrlParams(params);

            this._abortRequest();
            this.emit('ajax_start');

            this._xhr = $.ajax({
                method: 'GET',
                url: url,
                dataType: 'json',
                cache: false
            })
            .done(function(data) {
                that._data = data;
                that.emit('data_loaded');
                that.emit('ajax_end');
            })
            .fail(function(error) {
                that.emit('data_load_error', { error: error });
                that.emit('ajax_end');
            });
        },

        _getUrl: function(type) {
            var url = '';
            var params = this._params.accountDashboardList || {};
            type = type || 'data';

            switch (type) {
                case 'data':        url = params.dataUrl; break;
                case 'delete':      url = params.deleteUrl; break;
                case 'copy':        url = params.copyUrl; break;
                case 'comment:get': url = params.commentGetUrl; break;
                case 'comment:put': url = params.commentPutUrl; break;
                case 'title:put':   url = params.titlePutUrl; break;
            }

            return url;
        },

        _abortRequest: function() {
             this._xhr && this._xhr.abort();
        },

        _getUrlParams: function(params) {
            var query;
            params = params || [];
            this._page > 1 && params.push({ name: 'page', value: this._page });
            query = $.param(params);

            return query ? '?' + query : '';
        },

        _setUrlQueryString: function(){
            window.history.pushState(null, null, window.location.pathname + this._getUrlParams());
        },

        _setEvents: function() {
            this.on('ajax_start', function() { this.setMod('loading'); }, this);
            this.on('ajax_end', function() { this.delMod('loading'); }, this);
            this.on('data_loaded', this._onDataLoaded, this);
            this.on('data_load_error', this._onDataLoadError, this);

            ItemTools.on(this.domElem, 'params', function(e) { e.target.setParams(this._params); }, this);

            this._pager && this._pager.on('change', this._onPageChange, this);
            this._comment && this._comment.on('save', this._onCommentSave, this);
            this._titleEdit && this._titleEdit.on('save', this._onTitleEditSave, this);
            this._tools && this._tools.on('action', this._onToolsAction, this);
        },

        _updateParams: function(data) {
            data = data || {};
            this._params.userAuth = data.user_auth;
        },

        _onDataLoaded: function() {
            var data = this._data;

            this._setUrlQueryString();
            
            // Sanitize input data
            data.user_auth = !!data.user_auth; // TODO нужно доработать проверку входа пользователя
            data.current_page = this._page;

            data.items = data.items || [];
            
            // Количество строк без учета заголовка
            data.items_count = 0;
            data.items.map(function(item) { if (!item.mods || !item.mods.heading) data.items_count++; });

            this._updateParams(data);

            if (this._main) {
                this._main.setParams(this._params);
                this._main.append(data.items);
            }

            this._pager && this._pager.update(data);
        },

        _onDataLoadError: function(e, data) {
            this._page = this._prevPage;
            console.log(data.error);
        },

        _onCommentSave: function(e, data) {
            var that = this;

            var params = [
                { name: 'item_id', value: this._id },
                { name: 'comment', value: data }
            ];

            var url = this._getUrl('comment:put') + this._getUrlParams(params);

            this._comment.setMod('disabled');
            this.emit('ajax_start');

            this._xhr = $.ajax({
                method: 'GET',
                url: url,
                dataType: 'json',
                cache: false
            })
            .done(function(data) {
                if (data.result == 'success') {
                    that._comment.update(data.data || '');
                    that._comment.setMod('saved');
                }

                that.emit('comment:saved');
                that.emit('ajax_end');
                that._comment.delMod('disabled');
            })
            .fail(function(error) {
                console.log(error);
                that.emit('ajax_end');
                that._comment.delMod('disabled');
            });
        },

        _onTitleEditSave: function(e, data) {
            var that = this;
            
            var params = [
                { name: 'item_id', value: this._id },
                { name: 'title', value: data }
            ];

            var url = this._getUrl('title:put') + this._getUrlParams(params);

            this._titleEdit.setMod('disabled');
            this.emit('ajax_start');

            this._xhr = $.ajax({
                method: 'GET',
                url: url,
                dataType: 'json',
                cache: false
            })
            .done(function(data) {
                if (data.result == 'success') {
                    that._main.elem('title-text').text(data.data);
                    that._main.delMod('title-edit');
                    that._titleEdit && that._titleEdit.setEmpty(true);
                }

                that.emit('title:saved');
                that.emit('ajax_end');
                that._titleEdit.delMod('disabled');
            })
            .fail(function(error) {
                console.log(error);
                that.emit('ajax_end');
                that._titleEdit.delMod('disabled');
            });
        },

        _onToolsAction: function(e, action) {
            switch (action) {
                case 'edit':
                    this._main && this._main.toggleMod('title-edit');
                    break;
            }
        },

        _onTitleEditAction: function() {
            var action = this._titleEdit.getAction();

            if (action == 'save' && this._title && this._titleText) {
                var that = this;
                var url = this._titleUrl + '?' + 'title=' + this._titleEdit.getText();

                this._abortRequest();
                this.emit('ajax_start');

                this._xhr = $.ajax({
                    method: 'GET',
                    url: url,
                    dataType: 'json',
                    cache: false
                })
                .done(function(data) {
                    var text = (data && data.result) || '';

                    if (text) {
                        that._titleText.text(text);
                        that.emit('title_updated');

                        that._titleEdit.delMod('edit');
                        that._titleEdit.setMod('hidden');
                        that._dashboard.delMod(that._title, 'hidden');
                    }

                    that.emit('ajax_end');
                })
                .fail(function(error) {
                    console.log(error);
                    that.emit('ajax_end');
                });
                
            }
        },

        _onPageChange: function(e, data) {
            data = data || {};
            this._prevPage = this._page;
            this._page = data.page || 1;

            this.loadData();
        }
    }
));


});
/* end: ../../desktop.blocks/account-dashboard-list-controller/account-dashboard-list-controller.js */
/* begin: ../../desktop.blocks/account-my-lists-content/account-my-lists-content.js */
modules.define(
    'account-my-lists-content',
    ['i-bem__dom', 'jquery', 'popup'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js': {
                'inited' : function(){
                    var button = this.findElem('button-new-list');
                    var popup = this.findBlockOn('popup-new-list', 'popup')
                        .setAnchor(button);

                    this.bindTo(button, 'click', function() {
                        popup.setMod('visible', true);
                    });
                }
            }
        }
    }
));

});


/* end: ../../desktop.blocks/account-my-lists-content/account-my-lists-content.js */
/* begin: ../../desktop.blocks/account-my-lists-filter/account-my-lists-filter.js */
modules.define(
    'account-my-lists-filter',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js': {
            'inited': function() {
                console.log('account-my-lists-filter:inited');

                this._parent = null;
                this._submitted = false;
                this._action = this.findBlockOn(this.elem('action'), 'radio-group');
                this._target = this.findBlockOn(this.elem('target'), 'radio-group');
                this._search = this.findBlockOn(this.elem('search-input'), 'input');
                this._searchSubmit = this.findBlockOn(this.elem('search-submit'), 'button');

                this.bindTo('submit', this._onFormSubmit);
                this._action && this._action.on('change', this._onActionChange, this);
                this._target && this._target.on('change', this._onTargetChange, this);

                this._search && this.bindToDomElem(this._search.domElem, 'keypress', this._onSearchKeypress);
                this._searchSubmit && this.bindToDomElem(this._searchSubmit.domElem, 'click', this._onSearchSubmitEvents);

                this.update();
            }
        }
    },

    update: function() {
        this._updateFilters();
    },

    getData: function() {
        var data = [];

        (this._getFormData() || []).map(function(item) {
            item.value && data.push(item);
        });

        return data;
    },

    setData: function(data) {
        // TODO Реализовать возможность установки состояния фильтра
    },

    getParent: function() {
        return this._parent;
    },

    setParent: function(parent) {
        this._parent = parent;
    },

    _getFormData: function() {
        return $(this.domElem).serializeArray();
    },

    _submit: function() {
        $(this.domElem).submit();
    },

    _onFormSubmit: function(e) {
        e.preventDefault();
        this.emit('submit');
    },

    _onActionChange: function() {
        console.log('action changed');
        this.update();
        this._submit();
    },

    _onTargetChange: function() {
        this.update();
        this._submit();
    },

    _onSearchKeypress: function(e) {
        if (e.type == 'keypress' && e.keyCode  == 13) {
            e.preventDefault();
            this._submit();
        }
    },

    _onSearchSubmitEvents: function(e) {
        e.preventDefault();
        this._submit();
    },

    _updateFilters: function() {
        var action = this._action && this._action.getVal();
        var target = this._target && this._target.getVal();

        action == 'any'
            ? this._disableTarget()
            : this._enableTarget();
    },

    _enableTarget: function() {
        this._target && this._target.delMod('disabled');
    },

    _disableTarget: function() {
        this._target && this._target.setMod('disabled');
    }
}

));

});
/* end: ../../desktop.blocks/account-my-lists-filter/account-my-lists-filter.js */
/* begin: ../../desktop.blocks/account-my-lists-list/account-my-lists-list.js */
modules.define(
    'account-my-lists-list',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('account-my-lists-list:inited');
                    this._items = this.findElem('items');
                }
            }
        },

        update: function(items) {
            var bemjson, html;
            var that = this;

            items = items || [];

            this._clear(true);

            if (this._items) {
                (items).map(function(item) {
                    BEMDOM.append(that._items, BEMHTML.apply({
                        block: 'account-my-lists-list-item',
                        mods: item.mods || undefined,
                        content: item
                    }));
                })
            }
        },

        getItems: function() {
            return this.findBlocksInside('account-my-lists-list-item');
        },

        _clear: function(all) {
            var items = this.getItems(all || false);

            for (var i = items.length - 1; i >= 0; i--) {
                $(items[i].domElem).remove();
            };
        }
    }
));

});
/* end: ../../desktop.blocks/account-my-lists-list/account-my-lists-list.js */
/* begin: ../../libs/bem-components/common.blocks/select/select.js */
/**
 * @module select
 */

modules.define(
    'select',
    ['i-bem__dom', 'popup', 'menu', 'button', 'jquery', 'dom', 'keyboard__codes', 'strings__escape'],
    function(provide, BEMDOM, Popup, Menu, Button, $, dom, keyCodes, escape) {

/**
 * @exports
 * @class select
 * @bem
 *
 * @bemmod opened Represents opened state
 */
provide(BEMDOM.decl(this.name, /** @lends select.prototype */{
    beforeSetMod : {
        'opened' : {
            'true' : function() {
                return !this.hasMod('disabled');
            }
        },

        'focused' : {
            '' : function() {
                return !this._isPointerPressInProgress;
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this._button = this.findBlockInside('button')
                    .on('click', this._onButtonClick, this);

                this._popup = this.findBlockInside('popup')
                    .setAnchor(this._button)
                    .on({ modName : 'visible', modVal : '' }, this._onPopupHide, this);

                this._menu = this._popup.findBlockInside('menu')
                    .on({
                        'change' : this._onMenuChange,
                        'item-click' : this._onMenuItemClick
                    }, this);

                this._isPointerPressInProgress = false;

                this.hasMod('focused') && this._focus();

                this._updateMenuWidth();
            }
        },

        'focused' : {
            'true' : function() {
                this._focus();
            },

            '' : function() {
                this._blur();
            }
        },

        'opened' : {
            '*' : function(_, modVal) {
                this._menu.setMod('focused', modVal);
            },

            'true' : function() {
                this._updateMenuHeight();
                this._popup.setMod('visible');
                this
                    .bindToDoc('pointerpress', this._onDocPointerPress)
                    .setMod('focused')
                    ._hoverCheckedOrFirstItem();
            },

            '' : function() {
                this
                    .unbindFromDoc('pointerpress', this._onDocPointerPress)
                    ._popup.delMod('visible');
            }
        },

        'disabled' : {
            '*' : function(modName, modVal) {
                this._button.setMod(modName, modVal);
                this._menu.setMod(modName, modVal);
                this.elem('control').prop('disabled', modVal);
            },

            'true' : function() {
                this._popup.delMod('visible');
            }
        }
    },

    /**
     * Get value
     * @returns {*}
     */
    getVal : function() {
        return this._menu.getVal();
    },

    /**
     * Set value
     * @param {*} val
     * @returns {select} this
     */
    setVal : function(val) {
        this._menu.setVal(val);
        return this;
    },

    /**
     * Get name
     * @returns {String}
     */
    getName : function() {
        return this.params.name;
    },

    getDefaultParams : function() {
        return {
            optionsMaxHeight : Number.POSITIVE_INFINITY
        };
    },

    _focus : function() {
        this
            .bindTo('button', {
                keydown : this._onKeyDown,
                keypress : this._onKeyPress
            })
            ._button.setMod('focused');
    },

    _blur : function() {
        this
            .unbindFrom('button', {
                keydown : this._onKeyDown,
                keypress : this._onKeyPress
            })
            .delMod('opened')
            ._button
                .delMod('focused');
    },

    _updateMenuWidth : function() {
        this._menu.domElem.css('min-width', this._button.domElem.outerWidth());

        this._popup.redraw();
    },

    _updateMenuHeight : function() {
        var drawingParams = this._popup.calcPossibleDrawingParams(),
            menuDomElem = this._menu.domElem,
            menuWidth = menuDomElem.outerWidth(),
            bestHeight = 0;

        drawingParams.forEach(function(params) {
            params.width >= menuWidth && params.height > bestHeight && (bestHeight = params.height);
        });

        bestHeight && menuDomElem.css('max-height', Math.min(this.params.optionsMaxHeight, bestHeight));
    },

    _getCheckedItems : function() {
        return this._menu.getItems().filter(function(item) {
            return item.hasMod('checked');
        });
    },

    _hoverCheckedOrFirstItem : function() { // NOTE: may be it should be moved to menu
        (this._getCheckedItems()[0] || this._menu.getItems()[0])
            .setMod('hovered');
    },

    _onKeyDown : function(e) {
        if(this.hasMod('opened')) {
            if(e.keyCode === keyCodes.ESC) {
                // NOTE: stop propagation to prevent from being listened by global handlers
                e.stopPropagation();
                this.delMod('opened');
            }
        } else if((e.keyCode === keyCodes.UP || e.keyCode === keyCodes.DOWN) && !e.shiftKey) {
            e.preventDefault();
            this.setMod('opened');
        }
    },

    _onKeyPress : function(e) {
        // press a key: closed select - set value, opened select - set hover on menu-item.
        if(!this.hasMod('opened')) {
            var item = this._menu.searchItemByKeyboardEvent(e);
            item && this._setSingleVal(item.getVal());
        }
    },

    _setSingleVal : function(value) {
        this.setVal(value);
    },

    _onMenuChange : function() {
        this._updateControl();
        this._updateButton();
        this._updateMenuWidth();

        this.emit('change');
    },

    _onMenuItemClick : function() {},

    _updateControl : function() {},

    _updateButton : function() {},

    _onButtonClick : function() {
        this.toggleMod('opened');
    },

    _onButtonFocusChange : function(e, data) {
        this.setMod('focused', data.modVal);
    },

    _onPopupHide : function() {
        this.delMod('opened');
    },

    _onDocPointerPress : function(e) {
        if(this._isEventInPopup(e)) {
            e.pointerType === 'mouse' && e.preventDefault(); // prevents button blur in most desktop browsers
            this._isPointerPressInProgress = true;
            this.bindToDoc(
                'pointerrelease',
                { focusedHardMod : this._button.getMod('focused-hard') },
                this._onDocPointerRelease);
        }
    },

    _onDocPointerRelease : function(e) {
        this._isPointerPressInProgress = false;
        this
            .unbindFromDoc('pointerrelease', this._onDocPointerRelease)
            ._button
                .toggleMod('focused', true, '', this._isEventInPopup(e))
                .setMod('focused-hard', e.data.focusedHardMod);
    },

    _isEventInPopup : function(e) {
        return dom.contains(this._popup.domElem, $(e.target));
    }
}, /** @lends select */{
    live : function() {
        this.liveInitOnBlockInsideEvent(
            { modName : 'focused', modVal : '*' },
            'button',
            this.prototype._onButtonFocusChange);
    },

    _createControlHTML : function(name, val) {
        // Using string concatenation to not depend on template engines
        return '<input ' +
            'type="hidden" ' +
            'name="' + name + '" ' +
            'class="' + this.buildClass('control') + '" ' +
            'value="' + escape.attr(val) + '"/>';
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/select/select.js */
/* begin: ../../desktop.blocks/account-my-lists-controller/account-my-lists-controller.js */
modules.define(
    'account-my-lists-controller',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('account-my-ads-controller:inited');

                    this._params = {
                        userAuth:       false,

                        accountMyLists: {
                            dataUrl:   '/desktop.blocks/account-dashboard-list/data.json',
                            createUrl: '/desktop.blocks/account-dashboard-list/create.json'
                        }
                    };

                    this._params = $.extend(this._params, this.params);

                    this._page = 1;
                    this._data = {};

                    this._main    = this.findBlockOn('account-my-lists-content');
                    this._list    = this.findBlockInside('account-my-lists-list');
                    this._filter  = this.findBlockInside('account-my-lists-filter');
                    this._toolbar = this.findBlockInside('account-my-lists-list-toolbar');
                    this._pager   = this.findBlockInside('pagination');
                    this._spin    = this._main && this._main.findBlockInside('spin');
                    this._sort    = this._toolbar && this._toolbar.elem('sort').bem('select');

                    this.on('data_loaded', this._onDataLoaded, this);
                    this._filter && this._filter.on('submit', this._onFilterSubmit, this);
                    this._pager && this._pager.on('change', this._onPageChange, this);
                    this._sort && this._sort.on('change', this._onSortChange, this);

                    var that = this;

                    this.on('ajax_start', function() {
                        that._list && that._list.setMod('loading');
                        that._spin && that._spin.setMod('visible');
                    });

                    this.on('ajax_start', function() {
                        // Задержка для демонстрации работы спиннера
                        setTimeout(function() { that._spin && that._spin.delMod('visible'); }, 200); 
                        //that._spin && that._spin.delMod('visible');

                        that._list && that._list.delMod('loading');
                    });

                    this.loadData();
                }
            }
        },

        loadData: function() {
            var that = this;
            var params = this._getUrlParams();
            var url = this._getUrl() + (params ? '?' + params : '');

            this._abortRequest();
            this.emit('ajax_start');

            this._xhr = $.ajax({
                method: 'GET',
                url: url,
                dataType: 'json',
                cache: false
            })
            .done(function(data) {
                that._data = data;
                that.emit('data_loaded');
                that.emit('ajax_end');
            })
            .fail(function(error) {
                console.log(error);
                that.emit('ajax_end');
            });

        },

        _abortRequest: function() {
             this._xhr && this._xhr.abort();
        },

        _getUrl: function() {
            return this._params.accountMyLists.dataUrl || '';
        },

        _getUrlParams: function() {
            var params = this._filter ? this._filter.getData() : [];

            if (this._sort) {
                params.push({ name: 'sort', value: this._sort.getVal() });
            }

            if (this._page > 2) {
                params.push({ name: 'page', value: this._page });
            }

            return $.param(params);
        },

        _setUrlQueryString: function(){
            window.history.pushState(null, null, window.location.pathname + '?' + this._getUrlParams());
        },

        _onDataLoaded: function() {
            var data = this._data;

            data.user_auth = !!data.user_auth; // TODO нужно доработать проверку входа пользователя
            data.current_page = this._page;
            data.items = data.items || [];
            data.items_count = data.items.length;

            this._setUrlQueryString();

            this._list && this._list.update(data.items);
            this._pager && this._pager.setParams(data.total_pages, data.current_page, data.total_items, data.items_per_page, data.items_count);
        },

        _onFilterSubmit: function() {
            this.loadData();
        },

        _onSortChange: function() {
            console.log('sort');
            this.loadData();
        },

        _onPageChange: function() {
            this._page = this._pager && this._pager.getCurrentPage();
            this.loadData();
        }
    }
));


});
/* end: ../../desktop.blocks/account-my-lists-controller/account-my-lists-controller.js */
/* begin: ../../desktop.blocks/maskedinput/maskedinput.js */
modules.define(
	'maskedinput',
	['i-bem__dom', 'jquery', 'loader_type_js'],
	function(provide, BEMDOM, $, loader) {
		provide(BEMDOM.decl(this.name, {
			onSetMod: {
				js: {
					inited: function () {
						var input = $('.maskedinput .input__control');

						window.$ = $;
						window.jQuery = $;
						/* ..\..\desktop.blocks\jquery\jquery.inputmask.bundle.min.js begin */
/*!
* jquery.inputmask.bundle
* http://github.com/RobinHerbots/jquery.inputmask
* Copyright (c) 2010 - 2015 Robin Herbots
* Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
* Version: 3.1.64-166
*/
!function(a){function b(b){this.el=void 0,this.opts=a.extend(!0,{},this.defaults,b),this.noMasksCache=b&&void 0!==b.definitions,this.userOptions=b||{},e(this.opts.alias,b,this.opts)}function c(a){var b=document.createElement("input"),c="on"+a,d=c in b;return d||(b.setAttribute(c,"return;"),d="function"==typeof b[c]),b=null,d}function d(a){var b="text"===a||"tel"===a||"password"===a;if(!b){var c=document.createElement("input");c.setAttribute("type",a),b="text"===c.type,c=null}return b}function e(b,c,d){var f=d.aliases[b];return f?(f.alias&&e(f.alias,void 0,d),a.extend(!0,d,f),a.extend(!0,d,c),!0):(void 0===d.mask&&(d.mask=b),!1)}function f(b,c,d){function f(a){var b=g.data("inputmask-"+a.toLowerCase());void 0!==b&&(b="boolean"==typeof b?b:b.toString(),"mask"===a&&0===b.indexOf("[")?(d[a]=b.replace(/[\s[\]]/g,"").split(","),d[a][0]=d[a][0].replace("'",""),d[a][d[a].length-1]=d[a][d[a].length-1].replace("'","")):d[a]=b)}var g=a(b),h=g.data("inputmask");if(h&&""!==h)try{h=h.replace(new RegExp("'","g"),'"');var i=a.parseJSON("{"+h+"}");a.extend(!0,d,i)}catch(j){}for(var k in c)f(k);if(d.alias){e(d.alias,d,c);for(k in c)f(k)}return a.extend(!0,c,d),c}function g(c,d){function e(b){function d(a,b,c,d){this.matches=[],this.isGroup=a||!1,this.isOptional=b||!1,this.isQuantifier=c||!1,this.isAlternator=d||!1,this.quantifier={min:1,max:1}}function e(b,d,e){var f=c.definitions[d];e=void 0!==e?e:b.matches.length;var g=b.matches[e-1];if(f&&!r){f.placeholder=a.isFunction(f.placeholder)?f.placeholder.call(this,c):f.placeholder;for(var h=f.prevalidator,i=h?h.length:0,j=1;j<f.cardinality;j++){var k=i>=j?h[j-1]:[],l=k.validator,m=k.cardinality;b.matches.splice(e++,0,{fn:l?"string"==typeof l?new RegExp(l):new function(){this.test=l}:new RegExp("."),cardinality:m?m:1,optionality:b.isOptional,newBlockMarker:void 0===g||g.def!==(f.definitionSymbol||d),casing:f.casing,def:f.definitionSymbol||d,placeholder:f.placeholder,mask:d}),g=b.matches[e-1]}b.matches.splice(e++,0,{fn:f.validator?"string"==typeof f.validator?new RegExp(f.validator):new function(){this.test=f.validator}:new RegExp("."),cardinality:f.cardinality,optionality:b.isOptional,newBlockMarker:void 0===g||g.def!==(f.definitionSymbol||d),casing:f.casing,def:f.definitionSymbol||d,placeholder:f.placeholder,mask:d})}else b.matches.splice(e++,0,{fn:null,cardinality:0,optionality:b.isOptional,newBlockMarker:void 0===g||g.def!==d,casing:null,def:d,placeholder:void 0,mask:d}),r=!1}function f(a,b){a.isGroup&&(a.isGroup=!1,e(a,c.groupmarker.start,0),b!==!0&&e(a,c.groupmarker.end))}function g(a,b,c,d){b.matches.length>0&&(void 0===d||d)&&(c=b.matches[b.matches.length-1],f(c)),e(b,a)}function h(){if(t.length>0){if(m=t[t.length-1],g(k,m,o,!m.isAlternator),m.isAlternator){n=t.pop();for(var a=0;a<n.matches.length;a++)n.matches[a].isGroup=!1;t.length>0?(m=t[t.length-1],m.matches.push(n)):s.matches.push(n)}}else g(k,s,o)}function i(a){function b(a){return a===c.optionalmarker.start?a=c.optionalmarker.end:a===c.optionalmarker.end?a=c.optionalmarker.start:a===c.groupmarker.start?a=c.groupmarker.end:a===c.groupmarker.end&&(a=c.groupmarker.start),a}a.matches=a.matches.reverse();for(var d in a.matches){var e=parseInt(d);if(a.matches[d].isQuantifier&&a.matches[e+1]&&a.matches[e+1].isGroup){var f=a.matches[d];a.matches.splice(d,1),a.matches.splice(e+1,0,f)}void 0!==a.matches[d].matches?a.matches[d]=i(a.matches[d]):a.matches[d]=b(a.matches[d])}return a}for(var j,k,l,m,n,o,p,q=/(?:[?*+]|\{[0-9\+\*]+(?:,[0-9\+\*]*)?\})\??|[^.?*+^${[]()|\\]+|./g,r=!1,s=new d,t=[],u=[];j=q.exec(b);)if(k=j[0],r)h();else switch(k.charAt(0)){case c.escapeChar:r=!0;break;case c.optionalmarker.end:case c.groupmarker.end:if(l=t.pop(),void 0!==l)if(t.length>0){if(m=t[t.length-1],m.matches.push(l),m.isAlternator){n=t.pop();for(var v=0;v<n.matches.length;v++)n.matches[v].isGroup=!1;t.length>0?(m=t[t.length-1],m.matches.push(n)):s.matches.push(n)}}else s.matches.push(l);else h();break;case c.optionalmarker.start:t.push(new d(!1,!0));break;case c.groupmarker.start:t.push(new d(!0));break;case c.quantifiermarker.start:var w=new d(!1,!1,!0);k=k.replace(/[{}]/g,"");var x=k.split(","),y=isNaN(x[0])?x[0]:parseInt(x[0]),z=1===x.length?y:isNaN(x[1])?x[1]:parseInt(x[1]);if(("*"===z||"+"===z)&&(y="*"===z?0:1),w.quantifier={min:y,max:z},t.length>0){var A=t[t.length-1].matches;j=A.pop(),j.isGroup||(p=new d(!0),p.matches.push(j),j=p),A.push(j),A.push(w)}else j=s.matches.pop(),j.isGroup||(p=new d(!0),p.matches.push(j),j=p),s.matches.push(j),s.matches.push(w);break;case c.alternatormarker:t.length>0?(m=t[t.length-1],o=m.matches.pop()):o=s.matches.pop(),o.isAlternator?t.push(o):(n=new d(!1,!1,!1,!0),n.matches.push(o),t.push(n));break;default:h()}for(;t.length>0;)l=t.pop(),f(l,!0),s.matches.push(l);return s.matches.length>0&&(o=s.matches[s.matches.length-1],f(o),u.push(s)),c.numericInput&&i(u[0]),u}function f(f,g){if(void 0===f||""===f)return void 0;if(1===f.length&&c.greedy===!1&&0!==c.repeat&&(c.placeholder=""),c.repeat>0||"*"===c.repeat||"+"===c.repeat){var h="*"===c.repeat?0:"+"===c.repeat?1:c.repeat;f=c.groupmarker.start+f+c.groupmarker.end+c.quantifiermarker.start+h+","+c.repeat+c.quantifiermarker.end}var i;return void 0===b.prototype.masksCache[f]||d===!0?(i={mask:f,maskToken:e(f),validPositions:{},_buffer:void 0,buffer:void 0,tests:{},metadata:g},d!==!0&&(b.prototype.masksCache[c.numericInput?f.split("").reverse().join(""):f]=i)):i=a.extend(!0,{},b.prototype.masksCache[f]),i}function g(a){return a=a.toString()}var h;if(a.isFunction(c.mask)&&(c.mask=c.mask.call(this,c)),a.isArray(c.mask)){if(c.mask.length>1){c.keepStatic=void 0===c.keepStatic?!0:c.keepStatic;var i="(";return a.each(c.numericInput?c.mask.reverse():c.mask,function(b,c){i.length>1&&(i+=")|("),i+=g(void 0===c.mask||a.isFunction(c.mask)?c:c.mask)}),i+=")",f(i,c.mask)}c.mask=c.mask.pop()}return c.mask&&(h=void 0===c.mask.mask||a.isFunction(c.mask.mask)?f(g(c.mask),c.mask):f(g(c.mask.mask),c.mask)),h}function h(e,f,g){function h(a,b,c){b=b||0;var d,e,f,g=[],h=0;do{if(a===!0&&i().validPositions[h]){var j=i().validPositions[h];e=j.match,d=j.locator.slice(),g.push(c===!0?j.input:H(h,e))}else f=r(h,d,h-1),e=f.match,d=f.locator.slice(),g.push(H(h,e));h++}while((void 0===da||da>h-1)&&null!==e.fn||null===e.fn&&""!==e.def||b>=h);return g.pop(),g}function i(){return f}function n(a){var b=i();b.buffer=void 0,b.tests={},a!==!0&&(b._buffer=void 0,b.validPositions={},b.p=0)}function o(a,b){var c=i(),d=-1,e=c.validPositions;void 0===a&&(a=-1);var f=d,g=d;for(var h in e){var j=parseInt(h);e[j]&&(b||null!==e[j].match.fn)&&(a>=j&&(f=j),j>=a&&(g=j))}return d=-1!==f&&a-f>1||a>g?f:g}function p(b,c,d){if(g.insertMode&&void 0!==i().validPositions[b]&&void 0===d){var e,f=a.extend(!0,{},i().validPositions),h=o();for(e=b;h>=e;e++)delete i().validPositions[e];i().validPositions[b]=c;var j,k=!0,l=i().validPositions;for(e=j=b;h>=e;e++){var m=f[e];if(void 0!==m)for(var n=j,p=-1;n<C()&&(null==m.match.fn&&l[e]&&(l[e].match.optionalQuantifier===!0||l[e].match.optionality===!0)||null!=m.match.fn);){if(null===m.match.fn||!g.keepStatic&&l[e]&&(void 0!==l[e+1]&&u(e+1,l[e].locator.slice(),e).length>1||void 0!==l[e].alternation)?n++:n=D(j),t(n,m.match.def)){k=A(n,m.input,!0,!0)!==!1,j=n;break}if(k=null==m.match.fn,p===n)break;p=n}if(!k)break}if(!k)return i().validPositions=a.extend(!0,{},f),!1}else i().validPositions[b]=c;return!0}function q(a,b,c,d){var e,f=a;for(i().p=a,e=f;b>e;e++)void 0!==i().validPositions[e]&&(c===!0||g.canClearPosition(i(),e,o(),d,g)!==!1)&&delete i().validPositions[e];for(n(!0),e=f+1;e<=o();){for(;void 0!==i().validPositions[f];)f++;var h=i().validPositions[f];f>e&&(e=f+1);var j=i().validPositions[e];void 0!==j&&B(e)&&void 0===h?(t(f,j.match.def)&&A(f,j.input,!0)!==!1&&(delete i().validPositions[e],e++),f++):e++}var k=o(),l=C();for(d!==!0&&c!==!0&&void 0!==i().validPositions[k]&&i().validPositions[k].input===g.radixPoint&&delete i().validPositions[k],e=k+1;l>=e;e++)i().validPositions[e]&&delete i().validPositions[e];n(!0)}function r(a,b,c){var d=i().validPositions[a];if(void 0===d)for(var e=u(a,b,c),f=o(),h=i().validPositions[f]||u(0)[0],j=void 0!==h.alternation?h.locator[h.alternation].toString().split(","):[],k=0;k<e.length&&(d=e[k],!(d.match&&(g.greedy&&d.match.optionalQuantifier!==!0||(d.match.optionality===!1||d.match.newBlockMarker===!1)&&d.match.optionalQuantifier!==!0)&&(void 0===h.alternation||h.alternation!==d.alternation||void 0!==d.locator[h.alternation]&&z(d.locator[h.alternation].toString().split(","),j))));k++);return d}function s(a){return i().validPositions[a]?i().validPositions[a].match:u(a)[0].match}function t(a,b){for(var c=!1,d=u(a),e=0;e<d.length;e++)if(d[e].match&&d[e].match.def===b){c=!0;break}return c}function u(b,c,d,e){function f(c,d,e,j){function l(e,j,o){if(k>1e4)return alert("jquery.inputmask: There is probably an error in your mask definition or in the code. Create an issue on github with an example of the mask you are using. "+i().mask),!0;if(k===b&&void 0===e.matches)return m.push({match:e,locator:j.reverse()}),!0;if(void 0!==e.matches){if(e.isGroup&&o!==e){if(e=l(c.matches[a.inArray(e,c.matches)+1],j))return!0}else if(e.isOptional){var p=e;if(e=f(e,d,j,o)){if(g=m[m.length-1].match,h=0===a.inArray(g,p.matches),!h)return!0;n=!0,k=b}}else if(e.isAlternator){var q,r=e,s=[],t=m.slice(),u=j.length,v=d.length>0?d.shift():-1;if(-1===v||"string"==typeof v){var w=k,x=d.slice(),y=[];"string"==typeof v&&(y=v.split(","));for(var z=0;z<r.matches.length;z++){if(m=[],e=l(r.matches[z],[z].concat(j),o)||e,e!==!0&&void 0!==e&&y[y.length-1]<r.matches.length){var A=c.matches.indexOf(e)+1;c.matches.length>A&&(e=l(c.matches[A],[A].concat(j.slice(1,j.length)),o),e&&(y.push(A.toString()),a.each(m,function(a,b){b.alternation=j.length-1})))}q=m.slice(),k=w,m=[];for(var B=0;B<x.length;B++)d[B]=x[B];for(var C=0;C<q.length;C++){var D=q[C];D.alternation=D.alternation||u;for(var E=0;E<s.length;E++){var F=s[E];if(D.match.mask===F.match.mask&&("string"!=typeof v||-1!==a.inArray(D.locator[D.alternation].toString(),y))){q.splice(C,1),C--,F.locator[D.alternation]=F.locator[D.alternation]+","+D.locator[D.alternation],F.alternation=D.alternation;break}}}s=s.concat(q)}"string"==typeof v&&(s=a.map(s,function(b,c){if(isFinite(c)){var d,e=b.alternation,f=b.locator[e].toString().split(",");b.locator[e]=void 0,b.alternation=void 0;for(var g=0;g<f.length;g++)d=-1!==a.inArray(f[g],y),d&&(void 0!==b.locator[e]?(b.locator[e]+=",",b.locator[e]+=f[g]):b.locator[e]=parseInt(f[g]),b.alternation=e);if(void 0!==b.locator[e])return b}})),m=t.concat(s),k=b,n=m.length>0}else e=r.matches[v]?l(r.matches[v],[v].concat(j),o):!1;if(e)return!0}else if(e.isQuantifier&&o!==c.matches[a.inArray(e,c.matches)-1])for(var G=e,H=d.length>0?d.shift():0;H<(isNaN(G.quantifier.max)?H+1:G.quantifier.max)&&b>=k;H++){var I=c.matches[a.inArray(G,c.matches)-1];if(e=l(I,[H].concat(j),I)){if(g=m[m.length-1].match,g.optionalQuantifier=H>G.quantifier.min-1,h=0===a.inArray(g,I.matches)){if(H>G.quantifier.min-1){n=!0,k=b;break}return!0}return!0}}else if(e=f(e,d,j,o))return!0}else k++}for(var o=d.length>0?d.shift():0;o<c.matches.length;o++)if(c.matches[o].isQuantifier!==!0){var p=l(c.matches[o],[o].concat(e),j);if(p&&k===b)return p;if(k>b)break}}var g,h,j=i().maskToken,k=c?d:0,l=c||[0],m=[],n=!1;if(e===!0&&i().tests[b])return i().tests[b];if(void 0===c){for(var o,p=b-1;void 0===(o=i().validPositions[p])&&p>-1&&(!i().tests[p]||void 0===(o=i().tests[p][0]));)p--;void 0!==o&&p>-1&&(k=p,l=o.locator.slice())}for(var q=l.shift();q<j.length;q++){var r=f(j[q],l,[q]);if(r&&k===b||k>b)break}return(0===m.length||n)&&m.push({match:{fn:null,cardinality:0,optionality:!0,casing:null,def:""},locator:[]}),i().tests[b]=a.extend(!0,[],m),i().tests[b]}function v(){return void 0===i()._buffer&&(i()._buffer=h(!1,1)),i()._buffer}function w(){return void 0===i().buffer&&(i().buffer=h(!0,o(),!0)),i().buffer}function x(a,b,c){var d;if(c=c||w().slice(),a===!0)n(),a=0,b=c.length;else for(d=a;b>d;d++)delete i().validPositions[d],delete i().tests[d];for(d=a;b>d;d++)n(!0),c[d]!==g.skipOptionalPartCharacter&&A(d,c[d],!0,!0)}function y(a,b){switch(b.casing){case"upper":a=a.toUpperCase();break;case"lower":a=a.toLowerCase()}return a}function z(b,c){for(var d=g.greedy?c:c.slice(0,1),e=!1,f=0;f<b.length;f++)if(-1!==a.inArray(b[f],d)){e=!0;break}return e}function A(b,c,d,e){function f(b,c,d,e){var f=!1;return a.each(u(b),function(h,j){for(var k=j.match,l=c?1:0,m="",r=k.cardinality;r>l;r--)m+=F(b-(r-1));if(c&&(m+=c),f=null!=k.fn?k.fn.test(m,i(),b,d,g):c!==k.def&&c!==g.skipOptionalPartCharacter||""===k.def?!1:{c:k.def,pos:b},f!==!1){var s=void 0!==f.c?f.c:c;s=s===g.skipOptionalPartCharacter&&null===k.fn?k.def:s;var t=b,u=w();if(void 0!==f.remove&&(a.isArray(f.remove)||(f.remove=[f.remove]),a.each(f.remove.sort(function(a,b){return b-a}),function(a,b){q(b,b+1,!0)})),void 0!==f.insert&&(a.isArray(f.insert)||(f.insert=[f.insert]),a.each(f.insert.sort(function(a,b){return a-b}),function(a,b){A(b.pos,b.c,!0)})),f.refreshFromBuffer){var v=f.refreshFromBuffer;if(d=!0,x(v===!0?v:v.start,v.end,u),void 0===f.pos&&void 0===f.c)return f.pos=o(),!1;if(t=void 0!==f.pos?f.pos:b,t!==b)return f=a.extend(f,A(t,s,!0)),!1}else if(f!==!0&&void 0!==f.pos&&f.pos!==b&&(t=f.pos,x(b,t),t!==b))return f=a.extend(f,A(t,s,!0)),!1;return f!==!0&&void 0===f.pos&&void 0===f.c?!1:(h>0&&n(!0),p(t,a.extend({},j,{input:y(s,k)}),e)||(f=!1),!1)}}),f}function h(b,c,d,e){for(var f,h,j,k,l,m,p=a.extend(!0,{},i().validPositions),q=o();q>=0&&(k=i().validPositions[q],!k||void 0===k.alternation||(f=q,h=i().validPositions[f].alternation,r(f).locator[k.alternation]===k.locator[k.alternation]));q--);if(void 0!==h){f=parseInt(f);for(var s in i().validPositions)if(s=parseInt(s),k=i().validPositions[s],s>=f&&void 0!==k.alternation){var t=i().validPositions[f].locator[h].toString().split(","),u=k.locator[h]||t[0];u.length>0&&(u=u.split(",")[0]);for(var v=0;v<t.length;v++)if(u<t[v]){for(var w,x,y=s;y>=0;y--)if(w=i().validPositions[y],void 0!==w){x=w.locator[h],w.locator[h]=parseInt(t[v]);break}if(u!==w.locator[h]){var z=[],B=0;for(l=s+1;l<o()+1;l++)m=i().validPositions[l],m&&(null!=m.match.fn?z.push(m.input):b>l&&B++),delete i().validPositions[l],delete i().tests[l];for(n(!0),g.keepStatic=!g.keepStatic,j=!0;z.length>0;){var C=z.shift();if(C!==g.skipOptionalPartCharacter&&!(j=A(o()+1,C,!1,!0)))break}if(w.alternation=h,w.locator[h]=x,j){var D=o(b)+1,E=0;for(l=s+1;l<o()+1;l++)m=i().validPositions[l],m&&null==m.match.fn&&b>l&&E++;b+=E-B,j=A(b>D?D:b,c,d,e)}if(g.keepStatic=!g.keepStatic,j)return j;n(),i().validPositions=a.extend(!0,{},p)}}break}}return!1}function j(b,c){for(var d=i().validPositions[c],e=d.locator,f=e.length,g=b;c>g;g++)if(!B(g)){var h=u(g),j=h[0],k=-1;a.each(h,function(a,b){for(var c=0;f>c;c++)b.locator[c]&&z(b.locator[c].toString().split(","),e[c].toString().split(","))&&c>k&&(k=c,j=b)}),p(g,a.extend({},j,{input:j.match.def}),!0)}}d=d===!0;for(var k=w(),l=b-1;l>-1&&!i().validPositions[l];l--);for(l++;b>l;l++)void 0===i().validPositions[l]&&((!B(l)||k[l]!==H(l))&&u(l).length>1||k[l]===g.radixPoint||"0"===k[l]&&a.inArray(g.radixPoint,k)<l)&&f(l,k[l],!0);var m=b,s=!1,t=a.extend(!0,{},i().validPositions);if(m<C()&&(w(),s=f(m,c,d,e),(!d||e)&&s===!1)){var v=i().validPositions[m];if(!v||null!==v.match.fn||v.match.def!==c&&c!==g.skipOptionalPartCharacter){if((g.insertMode||void 0===i().validPositions[D(m)])&&!B(m))for(var E=m+1,G=D(m);G>=E;E++)if(s=f(E,c,d,e),s!==!1){j(m,E),m=E;break}}else s={caret:D(m)}}if(s===!1&&g.keepStatic&&N(k)&&(s=h(b,c,d,e)),s===!0&&(s={pos:m}),a.isFunction(g.postValidation)&&s!==!1&&!d){n(!0);var I=g.postValidation(w(),g);if(I){if(I.refreshFromBuffer){var J=I.refreshFromBuffer;x(J===!0?J:J.start,J.end,I.buffer),n(!0),s=I}}else n(!0),i().validPositions=a.extend(!0,{},t),s=!1}return s}function B(a){var b=s(a);if(null!=b.fn)return b.fn;if(!g.keepStatic&&void 0===i().validPositions[a]){for(var c=u(a),d=!0,e=0;e<c.length;e++)if(""!==c[e].match.def&&(void 0===c[e].alternation||c[e].locator[c[e].alternation].length>1)){d=!1;break}return d}return!1}function C(){var a;da=ca.prop("maxLength"),-1===da&&(da=void 0);var b,c=o(),d=i().validPositions[c],e=void 0!==d?d.locator.slice():void 0;for(b=c+1;void 0===d||null!==d.match.fn||null===d.match.fn&&""!==d.match.def;b++)d=r(b,e,b-1),e=d.locator.slice();var f=s(b-1);return a=""!==f.def?b:b-1,void 0===da||da>a?a:da}function D(a,b){var c=C();if(a>=c)return c;for(var d=a;++d<c&&(b===!0&&(s(d).newBlockMarker!==!0||!B(d))||b!==!0&&!B(d)&&(g.nojumps!==!0||g.nojumpsThreshold>d)););return d}function E(a,b){var c=a;if(0>=c)return 0;for(;--c>0&&(b===!0&&s(c).newBlockMarker!==!0||b!==!0&&!B(c)););return c}function F(a){return void 0===i().validPositions[a]?H(a):i().validPositions[a].input}function G(b,c,d,e,f){if(e&&a.isFunction(g.onBeforeWrite)){var h=g.onBeforeWrite.call(b,e,c,d,g);if(h){if(h.refreshFromBuffer){var i=h.refreshFromBuffer;x(i===!0?i:i.start,i.end,h.buffer||c),n(!0),c=w()}d=void 0!==h.caret?h.caret:d}}b.inputmask._valueSet(c.join("")),void 0===d||void 0!==e&&"blur"===e.type||K(b,d),f===!0&&(ha=!0,a(b).trigger("input"))}function H(a,b){if(b=b||s(a),void 0!==b.placeholder)return b.placeholder;if(null===b.fn){if(!g.keepStatic&&void 0===i().validPositions[a]){for(var c,d=u(a),e=!1,f=0;f<d.length;f++){if(c&&""!==d[f].match.def&&d[f].match.def!==c.match.def&&(void 0===d[f].alternation||d[f].alternation===c.alternation)){e=!0;break}d[f].match.optionality!==!0&&d[f].match.optionalQuantifier!==!0&&(c=d[f])}if(e)return g.placeholder.charAt(a%g.placeholder.length)}return b.def}return g.placeholder.charAt(a%g.placeholder.length)}function I(c,d,e,f){function h(){var a=!1,b=v().slice(l,D(l)).join("").indexOf(k);if(-1!==b&&!B(l)){a=!0;for(var c=v().slice(l,l+b),d=0;d<c.length;d++)if(" "!==c[d]){a=!1;break}}return a}var j=void 0!==f?f.slice():c.inputmask._valueGet().split(""),k="",l=0;if(n(),i().p=D(-1),d&&c.inputmask._valueSet(""),!e)if(g.autoUnmask!==!0){var m=v().slice(0,D(-1)).join(""),p=j.join("").match(new RegExp("^"+b.escapeRegex(m),"g"));p&&p.length>0&&(j.splice(0,p.length*m.length),l=D(l))}else l=D(l);a.each(j,function(b,d){var f=a.Event("keypress");f.which=d.charCodeAt(0),k+=d;var j=o(void 0,!0),m=i().validPositions[j],n=r(j+1,m?m.locator.slice():void 0,j);if(!h()||e||g.autoUnmask){var p=e?b:null==n.match.fn&&n.match.optionality&&j+1<i().p?j+1:i().p;T.call(c,f,!0,!1,e,p),l=p+1,k=""}else T.call(c,f,!0,!1,!0,j+1)}),d&&G(c,w(),a(c).is(":focus")?D(o(0)):void 0,a.Event("checkval"))}function J(b){if(b[0].inputmask&&!b.hasClass("hasDatepicker")){var c=[],d=i().validPositions;for(var e in d)d[e].match&&null!=d[e].match.fn&&c.push(d[e].input);var f=0===c.length?null:(fa?c.reverse():c).join("");if(null!==f){var h=(fa?w().slice().reverse():w()).join("");a.isFunction(g.onUnMask)&&(f=g.onUnMask.call(b,h,f,g)||f)}return f}return b[0].inputmask._valueGet()}function K(b,c,d){function e(a){if(fa&&"number"==typeof a&&(!g.greedy||""!==g.placeholder)){var b=w().join("").length;a=b-a}return a}var f,h=b.jquery&&b.length>0?b[0]:b;if("number"!=typeof c)return h.setSelectionRange?(c=h.selectionStart,d=h.selectionEnd):window.getSelection?(f=window.getSelection().getRangeAt(0),(f.commonAncestorContainer.parentNode===h||f.commonAncestorContainer===h)&&(c=f.startOffset,d=f.endOffset)):document.selection&&document.selection.createRange&&(f=document.selection.createRange(),c=0-f.duplicate().moveStart("character",-1e5),d=c+f.text.length),{begin:e(c),end:e(d)};if(c=e(c),d=e(d),d="number"==typeof d?d:c,a(h).is(":visible")){var i=a(h).css("font-size").replace("px","")*d;if(h.scrollLeft=i>h.scrollWidth?i:0,k||g.insertMode!==!1||c!==d||d++,h.setSelectionRange)h.selectionStart=c,h.selectionEnd=d;else if(window.getSelection){if(f=document.createRange(),void 0===h.firstChild){var j=document.createTextNode("");h.appendChild(j)}f.setStart(h.firstChild,c<h.inputmask._valueGet().length?c:h.inputmask._valueGet().length),f.setEnd(h.firstChild,d<h.inputmask._valueGet().length?d:h.inputmask._valueGet().length),f.collapse(!0);var l=window.getSelection();l.removeAllRanges(),l.addRange(f)}else h.createTextRange&&(f=h.createTextRange(),f.collapse(!0),f.moveEnd("character",d),f.moveStart("character",c),f.select())}}function L(b){var c,d,e=w(),f=e.length,g=o(),h={},j=i().validPositions[g],k=void 0!==j?j.locator.slice():void 0;for(c=g+1;c<e.length;c++)d=r(c,k,c-1),k=d.locator.slice(),h[c]=a.extend(!0,{},d);var l=j&&void 0!==j.alternation?j.locator[j.alternation]:void 0;for(c=f-1;c>g&&(d=h[c],(d.match.optionality||d.match.optionalQuantifier||l&&(l!==h[c].locator[j.alternation]&&null!=d.match.fn||null===d.match.fn&&d.locator[j.alternation]&&z(d.locator[j.alternation].toString().split(","),l.toString().split(","))&&""!==u(c)[0].def))&&e[c]===H(c,d.match));c--)f--;return b?{l:f,def:h[f]?h[f].match:void 0}:f}function M(a){for(var b=L(),c=a.length-1;c>b&&!B(c);c--);return a.splice(b,c+1-b),a}function N(b){if(a.isFunction(g.isComplete))return g.isComplete.call(ca,b,g);if("*"===g.repeat)return void 0;var c=!1,d=L(!0),e=E(d.l);if(void 0===d.def||d.def.newBlockMarker||d.def.optionality||d.def.optionalQuantifier){c=!0;for(var f=0;e>=f;f++){var h=r(f).match;if(null!==h.fn&&void 0===i().validPositions[f]&&h.optionality!==!0&&h.optionalQuantifier!==!0||null===h.fn&&b[f]!==H(f,h)){c=!1;break}}}return c}function O(a,b){return fa?a-b>1||a-b===1&&g.insertMode:b-a>1||b-a===1&&g.insertMode}function P(c){var d=a._data(c).events,e=!1;a.each(d,function(c,d){a.each(d,function(c,d){if("inputmask"===d.namespace){var f=d.handler;d.handler=function(c){if(void 0===this.inputmask){var d=a(this).data("_inputmask_opts");d?new b(d).mask(this):a(this).unbind(".inputmask")}else{if("setvalue"===c.type||!(this.disabled||this.readOnly&&!("keydown"===c.type&&c.ctrlKey&&67===c.keyCode||g.tabThrough===!1&&c.keyCode===b.keyCode.TAB))){switch(c.type){case"input":if(ha===!0||e===!0)return ha=!1,c.preventDefault();break;case"keydown":ga=!1,e=!1;break;case"keypress":if(ga===!0)return c.preventDefault();ga=!0;break;case"compositionstart":e=!0;break;case"compositionupdate":ha=!0;break;case"compositionend":e=!1}return f.apply(this,arguments)}c.preventDefault()}}}})})}function Q(b){function c(b){if(void 0===a.valHooks[b]||a.valHooks[b].inputmaskpatch!==!0){var c=a.valHooks[b]&&a.valHooks[b].get?a.valHooks[b].get:function(a){return a.value},d=a.valHooks[b]&&a.valHooks[b].set?a.valHooks[b].set:function(a,b){return a.value=b,a};a.valHooks[b]={get:function(a){if(a.inputmask){if(a.inputmask.opts.autoUnmask)return a.inputmask.unmaskedvalue();var b=c(a),d=a.inputmask.maskset,e=d._buffer;return e=e?e.join(""):"",b!==e?b:""}return c(a)},set:function(b,c){var e,f=a(b);return e=d(b,c),b.inputmask&&f.triggerHandler("setvalue.inputmask"),e},inputmaskpatch:!0}}}function d(){return this.inputmask?this.inputmask.opts.autoUnmask?this.inputmask.unmaskedvalue():g.call(this)!==v().join("")?g.call(this):"":g.call(this)}function e(b){h.call(this,b),this.inputmask&&a(this).triggerHandler("setvalue.inputmask")}function f(b){a(b).bind("mouseenter.inputmask",function(b){var c=a(this),d=this,e=d.inputmask._valueGet();""!==e&&e!==w().join("")&&c.triggerHandler("setvalue.inputmask")});
//!! the bound handlers are executed in the order they where bound
var c=a._data(b).events,d=c.mouseover;if(d){for(var e=d[d.length-1],f=d.length-1;f>0;f--)d[f]=d[f-1];d[0]=e}}var g,h;b.inputmask.__valueGet||(Object.getOwnPropertyDescriptor&&void 0===b.value?(g=function(){return this.textContent},h=function(a){this.textContent=a},Object.defineProperty(b,"value",{get:d,set:e})):document.__lookupGetter__&&b.__lookupGetter__("value")?(g=b.__lookupGetter__("value"),h=b.__lookupSetter__("value"),b.__defineGetter__("value",d),b.__defineSetter__("value",e)):(g=function(){return b.value},h=function(a){b.value=a},c(b.type),f(b)),b.inputmask.__valueGet=g,b.inputmask._valueGet=function(a){return fa&&a!==!0?g.call(this.el).split("").reverse().join(""):g.call(this.el)},b.inputmask.__valueSet=h,b.inputmask._valueSet=function(a){h.call(this.el,fa?a.split("").reverse().join(""):a)})}function R(c,d,e,f){function h(){if(g.keepStatic){n(!0);var b,d=[],e=a.extend(!0,{},i().validPositions);for(b=o();b>=0;b--){var f=i().validPositions[b];if(f&&(null!=f.match.fn&&d.push(f.input),delete i().validPositions[b],void 0!==f.alternation&&f.locator[f.alternation]===r(b).locator[f.alternation]))break}if(b>-1)for(;d.length>0;){i().p=D(o());var h=a.Event("keypress");h.which=d.pop().charCodeAt(0),T.call(c,h,!0,!1,!1,i().p)}else i().validPositions=a.extend(!0,{},e)}}if((g.numericInput||fa)&&(d===b.keyCode.BACKSPACE?d=b.keyCode.DELETE:d===b.keyCode.DELETE&&(d=b.keyCode.BACKSPACE),fa)){var j=e.end;e.end=e.begin,e.begin=j}d===b.keyCode.BACKSPACE&&(e.end-e.begin<1||g.insertMode===!1)?(e.begin=E(e.begin),void 0===i().validPositions[e.begin]||i().validPositions[e.begin].input!==g.groupSeparator&&i().validPositions[e.begin].input!==g.radixPoint||e.begin--):d===b.keyCode.DELETE&&e.begin===e.end&&(e.end=B(e.end)?e.end+1:D(e.end)+1,void 0===i().validPositions[e.begin]||i().validPositions[e.begin].input!==g.groupSeparator&&i().validPositions[e.begin].input!==g.radixPoint||e.end++),q(e.begin,e.end,!1,f),f!==!0&&h();var k=o(e.begin);k<e.begin?(-1===k&&n(),i().p=D(k)):f!==!0&&(i().p=e.begin)}function S(d){var e=this,f=a(e),h=d.keyCode,k=K(e);h===b.keyCode.BACKSPACE||h===b.keyCode.DELETE||j&&127===h||d.ctrlKey&&88===h&&!c("cut")?(d.preventDefault(),88===h&&($=w().join("")),R(e,h,k),G(e,w(),i().p,d,$!==w().join("")),e.inputmask._valueGet()===v().join("")?f.trigger("cleared"):N(w())===!0&&f.trigger("complete"),g.showTooltip&&f.prop("title",i().mask)):h===b.keyCode.END||h===b.keyCode.PAGE_DOWN?setTimeout(function(){var a=D(o());g.insertMode||a!==C()||d.shiftKey||a--,K(e,d.shiftKey?k.begin:a,a)},0):h===b.keyCode.HOME&&!d.shiftKey||h===b.keyCode.PAGE_UP?K(e,0,d.shiftKey?k.begin:0):(g.undoOnEscape&&h===b.keyCode.ESCAPE||90===h&&d.ctrlKey)&&d.altKey!==!0?(I(e,!0,!1,$.split("")),f.click()):h!==b.keyCode.INSERT||d.shiftKey||d.ctrlKey?g.tabThrough===!0&&h===b.keyCode.TAB?(d.shiftKey===!0?(null===s(k.begin).fn&&(k.begin=D(k.begin)),k.end=E(k.begin,!0),k.begin=E(k.end,!0)):(k.begin=D(k.begin,!0),k.end=D(k.begin,!0),k.end<C()&&k.end--),k.begin<C()&&(d.preventDefault(),K(e,k.begin,k.end))):g.insertMode!==!1||d.shiftKey||(h===b.keyCode.RIGHT?setTimeout(function(){var a=K(e);K(e,a.begin)},0):h===b.keyCode.LEFT&&setTimeout(function(){var a=K(e);K(e,fa?a.begin+1:a.begin-1)},0)):(g.insertMode=!g.insertMode,K(e,g.insertMode||k.begin!==C()?k.begin:k.begin-1)),g.onKeyDown.call(this,d,w(),K(e).begin,g),ia=-1!==a.inArray(h,g.ignorables)}function T(c,d,e,f,h){var j=this,k=a(j),l=c.which||c.charCode||c.keyCode;if(!(d===!0||c.ctrlKey&&c.altKey)&&(c.ctrlKey||c.metaKey||ia))return l===b.keyCode.ENTER&&$!==w().join("")&&setTimeout(function(){k.change(),$=w().join("")},0),!0;if(l){46===l&&c.shiftKey===!1&&","===g.radixPoint&&(l=44);var m,o=d?{begin:h,end:h}:K(j),q=String.fromCharCode(l),r=O(o.begin,o.end);r&&(i().undoPositions=a.extend(!0,{},i().validPositions),R(j,b.keyCode.DELETE,o,!0),o.begin=i().p,g.insertMode||(g.insertMode=!g.insertMode,p(o.begin,f),g.insertMode=!g.insertMode),r=!g.multi),i().writeOutBuffer=!0;var s=fa&&!r?o.end:o.begin,t=A(s,q,f);if(t!==!1){if(t!==!0&&(s=void 0!==t.pos?t.pos:s,q=void 0!==t.c?t.c:q),n(!0),void 0!==t.caret)m=t.caret;else{var v=i().validPositions;m=!g.keepStatic&&(void 0!==v[s+1]&&u(s+1,v[s].locator.slice(),s).length>1||void 0!==v[s].alternation)?s+1:D(s)}i().p=m}if(e!==!1){var y=this;if(setTimeout(function(){g.onKeyValidation.call(y,t,g)},0),i().writeOutBuffer&&t!==!1){var z=w();G(j,z,d?void 0:g.numericInput?E(m):m,c,d!==!0),d!==!0&&setTimeout(function(){N(z)===!0&&k.trigger("complete")},0)}else r&&(i().buffer=void 0,i().validPositions=i().undoPositions)}else r&&(i().buffer=void 0,i().validPositions=i().undoPositions);if(g.showTooltip&&k.prop("title",i().mask),d&&a.isFunction(g.onBeforeWrite)){var B=g.onBeforeWrite.call(this,c,w(),m,g);if(B&&B.refreshFromBuffer){var C=B.refreshFromBuffer;x(C===!0?C:C.start,C.end,B.buffer),n(!0),B.caret&&(i().p=B.caret)}}if(c.preventDefault(),d)return t}}function U(b){var c=this,d=a(c),e=c.inputmask._valueGet(!0),f=K(c);if("propertychange"===b.type&&c.inputmask._valueGet().length<=C())return!0;if("paste"===b.type){var h=e.substr(0,f.begin),i=e.substr(f.end,e.length);h===v().slice(0,f.begin).join("")&&(h=""),i===v().slice(f.end).join("")&&(i=""),window.clipboardData&&window.clipboardData.getData?e=h+window.clipboardData.getData("Text")+i:b.originalEvent&&b.originalEvent.clipboardData&&b.originalEvent.clipboardData.getData&&(e=h+b.originalEvent.clipboardData.getData("text/plain")+i)}var j=e;if(a.isFunction(g.onBeforePaste)){if(j=g.onBeforePaste.call(c,e,g),j===!1)return b.preventDefault(),!1;j||(j=e)}return I(c,!1,!1,fa?j.split("").reverse():j.split("")),G(c,w(),void 0,b,!0),d.click(),N(w())===!0&&d.trigger("complete"),!1}function V(b){var c=this;I(c,!0,!1),N(w())===!0&&a(c).trigger("complete"),b.preventDefault()}function W(a){var b=this;$=w().join(""),(""===aa||0!==a.originalEvent.data.indexOf(aa))&&(_=K(b))}function X(b){var c=this,d=K(c);0===b.originalEvent.data.indexOf(aa)&&(n(),d=_);var e=b.originalEvent.data;K(c,d.begin,d.end);for(var f=0;f<e.length;f++){var h=a.Event("keypress");h.which=e.charCodeAt(f),ga=!1,ia=!1,T.call(c,h)}setTimeout(function(){var a=i().p;G(c,w(),g.numericInput?E(a):a)},0),aa=b.originalEvent.data}function Y(a){}function Z(c){ca=a(c),g.showTooltip&&ca.prop("title",i().mask),("rtl"===c.dir||g.rightAlign)&&ca.css("text-align","right"),("rtl"===c.dir||g.numericInput)&&(c.dir="ltr",ca.removeAttr("dir"),c.inputmask.isRTL=!0,fa=!0),ca.unbind(".inputmask"),(ca.is(":input")&&d(ca.attr("type"))||c.isContentEditable)&&(ca.closest("form").bind("submit",function(){$!==w().join("")&&ca.change(),g.clearMaskOnLostFocus&&-1===o()&&ca[0].inputmask._valueGet&&ca[0].inputmask._valueGet()===v().join("")&&ca[0].inputmask._valueSet(""),g.removeMaskOnSubmit&&ca.inputmask("remove")}).bind("reset",function(){setTimeout(function(){ca.triggerHandler("setvalue.inputmask")},0)}),ca.bind("mouseenter.inputmask",function(){var b=a(this),c=this;ja=!0,!b.is(":focus")&&g.showMaskOnHover&&c.inputmask._valueGet()!==w().join("")&&G(c,w())}).bind("blur.inputmask",function(b){var c=a(this),d=this;if(d.inputmask){var e=d.inputmask._valueGet(),f=w().slice();$!==f.join("")&&setTimeout(function(){c.change(),$=f.join("")},0),""!==e&&(g.clearMaskOnLostFocus&&(-1===o()&&e===v().join("")?f=[]:M(f)),N(f)===!1&&(setTimeout(function(){c.trigger("incomplete")},0),g.clearIncomplete&&(n(),f=g.clearMaskOnLostFocus?[]:v().slice())),G(d,f,void 0,b))}}).bind("focus.inputmask",function(a){var b=this,c=b.inputmask._valueGet();g.showMaskOnFocus&&(!g.showMaskOnHover||g.showMaskOnHover&&""===c)?b.inputmask._valueGet()!==w().join("")&&G(b,w(),D(o())):ja===!1&&K(b,D(o())),g.positionCaretOnTab===!0&&setTimeout(function(){K(b,D(o()))},0),$=w().join("")}).bind("mouseleave.inputmask",function(){var b=a(this),c=this;if(ja=!1,g.clearMaskOnLostFocus){var d=w().slice(),e=c.inputmask._valueGet();b.is(":focus")||e===b.attr("placeholder")||""===e||(-1===o()&&e===v().join("")?d=[]:M(d),G(c,d))}}).bind("click.inputmask",function(){function b(b){if(g.radixFocus&&""!==g.radixPoint){var c=i().validPositions;if(void 0===c[b]||c[b].input===H(b)){if(b<D(-1))return!0;var d=a.inArray(g.radixPoint,w());if(-1!==d){for(var e in c)if(e>d&&c[e].input!==H(e))return!1;return!0}}}return!1}var c=this;if(a(c).is(":focus")){var d=K(c);if(d.begin===d.end)if(b(d.begin))K(c,a.inArray(g.radixPoint,w()));else{var e=d.begin,f=D(o(e));f>e?K(c,B(e)||B(e-1)?e:D(e)):K(c,g.numericInput?0:f)}}}).bind("dblclick.inputmask",function(){var a=this;setTimeout(function(){K(a,0,D(o()))},0)}).bind(m+".inputmask dragdrop.inputmask drop.inputmask",U).bind("cut.inputmask",function(c){ha=!0;var d=this,e=a(d),f=K(d);if(fa){var h=window.clipboardData||c.originalEvent.clipboardData,j=h.getData("text").split("").reverse().join("");h.setData("text",j)}R(d,b.keyCode.DELETE,f),G(d,w(),i().p,c,$!==w().join("")),d.inputmask._valueGet()===v().join("")&&e.trigger("cleared"),g.showTooltip&&e.prop("title",i().mask)}).bind("complete.inputmask",g.oncomplete).bind("incomplete.inputmask",g.onincomplete).bind("cleared.inputmask",g.oncleared),ca.bind("keydown.inputmask",S).bind("keypress.inputmask",T),l||ca.bind("compositionstart.inputmask",W).bind("compositionupdate.inputmask",X).bind("compositionend.inputmask",Y),"paste"===m&&ca.bind("input.inputmask",V)),ca.bind("setvalue.inputmask",function(){var b=this,c=b.inputmask._valueGet();b.inputmask._valueSet(a.isFunction(g.onBeforeMask)?g.onBeforeMask.call(b,c,g)||c:c),I(b,!0,!1),$=w().join(""),(g.clearMaskOnLostFocus||g.clearIncomplete)&&b.inputmask._valueGet()===v().join("")&&b.inputmask._valueSet("")}),Q(c);var e=a.isFunction(g.onBeforeMask)?g.onBeforeMask.call(c,c.inputmask._valueGet(),g)||c.inputmask._valueGet():c.inputmask._valueGet();I(c,!0,!1,e.split(""));var f=w().slice();$=f.join("");var h;try{h=document.activeElement}catch(j){}N(f)===!1&&g.clearIncomplete&&n(),g.clearMaskOnLostFocus&&(f.join("")===v().join("")?f=[]:M(f)),G(c,f),h===c&&K(c,D(o())),P(c)}var $,_,aa,ba,ca,da,ea,fa=!1,ga=!1,ha=!1,ia=!1,ja=!0;if(void 0!==e)switch(e.action){case"isComplete":return ba=e.el,ca=a(ba),f=ba.inputmask.maskset,g=ba.inputmask.opts,N(e.buffer);case"unmaskedvalue":return ba=e.el,void 0===ba?(ca=a({}),ba=ca[0],ba.inputmask=new b,ba.inputmask.opts=g,ba.inputmask.el=ba,ba.inputmask.maskset=f,ba.inputmask.isRTL=g.numericInput,g.numericInput&&(fa=!0),ea=(a.isFunction(g.onBeforeMask)?g.onBeforeMask.call(ca,e.value,g)||e.value:e.value).split(""),I(ca,!1,!1,fa?ea.reverse():ea),a.isFunction(g.onBeforeWrite)&&g.onBeforeWrite.call(this,void 0,w(),0,g)):ca=a(ba),f=ba.inputmask.maskset,g=ba.inputmask.opts,fa=ba.inputmask.isRTL,J(ca);case"mask":$=w().join(""),Z(e.el);break;case"format":return ca=a({}),ca[0].inputmask=new b,ca[0].inputmask.opts=g,ca[0].inputmask.el=ca[0],ca[0].inputmask.maskset=f,ca[0].inputmask.isRTL=g.numericInput,g.numericInput&&(fa=!0),ea=(a.isFunction(g.onBeforeMask)?g.onBeforeMask.call(ca,e.value,g)||e.value:e.value).split(""),I(ca,!1,!1,fa?ea.reverse():ea),a.isFunction(g.onBeforeWrite)&&g.onBeforeWrite.call(this,void 0,w(),0,g),e.metadata?{value:fa?w().slice().reverse().join(""):w().join(""),metadata:ca.inputmask("getmetadata")}:fa?w().slice().reverse().join(""):w().join("");case"isValid":ca=a({}),ca[0].inputmask=new b,ca[0].inputmask.opts=g,ca[0].inputmask.el=ca[0],ca[0].inputmask.maskset=f,ca[0].inputmask.isRTL=g.numericInput,g.numericInput&&(fa=!0),ea=e.value.split(""),I(ca,!1,!0,fa?ea.reverse():ea);for(var ka=w(),la=L(),ma=ka.length-1;ma>la&&!B(ma);ma--);return ka.splice(la,ma+1-la),N(ka)&&e.value===ka.join("");case"getemptymask":return ba=e.el,ca=a(ba),f=ba.inputmask.maskset,g=ba.inputmask.opts,v();case"remove":ba=e.el,ca=a(ba),f=ba.inputmask.maskset,g=ba.inputmask.opts,ba.inputmask._valueSet(J(ca)),ca.unbind(".inputmask");var na;Object.getOwnPropertyDescriptor&&(na=Object.getOwnPropertyDescriptor(ba,"value")),na&&na.get?ba.inputmask.__valueGet&&Object.defineProperty(ba,"value",{get:ba.inputmask.__valueGet,set:ba.inputmask.__valueSet}):document.__lookupGetter__&&ba.__lookupGetter__("value")&&ba.inputmask.__valueGet&&(ba.__defineGetter__("value",ba.inputmask.__valueGet),ba.__defineSetter__("value",ba.inputmask.__valueSet)),ba.inputmask=void 0;break;case"getmetadata":if(ba=e.el,ca=a(ba),f=ba.inputmask.maskset,g=ba.inputmask.opts,a.isArray(f.metadata)){for(var oa,pa=o(),qa=pa;qa>=0;qa--)if(i().validPositions[qa]&&void 0!==i().validPositions[qa].alternation){oa=i().validPositions[qa].alternation;break}return void 0!==oa?f.metadata[i().validPositions[pa].locator[oa]]:f.metadata[0]}return f.metadata}}b.prototype={defaults:{placeholder:"_",optionalmarker:{start:"[",end:"]"},quantifiermarker:{start:"{",end:"}"},groupmarker:{start:"(",end:")"},alternatormarker:"|",escapeChar:"\\",mask:void 0,oncomplete:a.noop,onincomplete:a.noop,oncleared:a.noop,repeat:0,greedy:!0,autoUnmask:!1,removeMaskOnSubmit:!1,clearMaskOnLostFocus:!0,insertMode:!0,clearIncomplete:!1,aliases:{},alias:void 0,onKeyDown:a.noop,onBeforeMask:void 0,onBeforePaste:void 0,onBeforeWrite:void 0,onUnMask:void 0,showMaskOnFocus:!0,showMaskOnHover:!0,onKeyValidation:a.noop,skipOptionalPartCharacter:" ",showTooltip:!1,numericInput:!1,rightAlign:!1,undoOnEscape:!0,radixPoint:"",groupSeparator:"",radixFocus:!1,nojumps:!1,nojumpsThreshold:0,keepStatic:void 0,positionCaretOnTab:!1,tabThrough:!1,supportsInputType:[],definitions:{9:{validator:"[0-9]",cardinality:1,definitionSymbol:"*"},a:{validator:"[A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",cardinality:1,definitionSymbol:"*"},"*":{validator:"[0-9A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",cardinality:1}},ignorables:[8,9,13,19,27,33,34,35,36,37,38,39,40,45,46,93,112,113,114,115,116,117,118,119,120,121,122,123],isComplete:void 0,canClearPosition:a.noop,postValidation:void 0},masksCache:{},mask:function(c){var d=c.jquery&&c.length>0?c[0]:c,e=a.extend(!0,{},this.opts);f(c,e,a.extend(!0,{},this.userOptions));var i=g(e,this.noMasksCache);return void 0!==i&&(d.inputmask=d.inputmask||new b,d.inputmask.opts=e,d.inputmask.noMasksCache=this.noMasksCache,d.inputmask.el=d,d.inputmask.maskset=i,d.inputmask.isRTL=!1,a(d).data("_inputmask_opts",e),h({action:"mask",el:d},i,d.inputmask.opts)),c},unmaskedvalue:function(){return this.el?h({action:"unmaskedvalue",el:this.el}):void 0},remove:function(){return this.el?(h({action:"remove",el:this.el}),this.el.inputmask=void 0,this.el):void 0},getemptymask:function(){return this.el?h({action:"getemptymask",el:this.el}):void 0},hasMaskedValue:function(){return!this.opts.autoUnmask},isComplete:function(){return this.el?h({action:"isComplete",buffer:this.el.inputmask._valueGet().split(""),el:this.el}):void 0},getmetadata:function(){return this.el?h({action:"getmetadata",el:this.el}):void 0}},b.extendDefaults=function(c){a.extend(b.prototype.defaults,c)},b.extendDefinitions=function(c){a.extend(b.prototype.defaults.definitions,c)},b.extendAliases=function(c){a.extend(b.prototype.defaults.aliases,c)},b.format=function(c,d,f){var i=a.extend(!0,{},b.prototype.defaults,d);return e(i.alias,d,i),h({action:"format",value:c,metadata:f},g(i,d&&void 0!==d.definitions),i)},b.unmask=function(c,d){var f=a.extend(!0,{},b.prototype.defaults,d);return e(f.alias,d,f),h({action:"unmaskedvalue",value:c},g(f,d&&void 0!==d.definitions),f)},b.isValid=function(c,d){var f=a.extend(!0,{},b.prototype.defaults,d);return e(f.alias,d,f),h({action:"isValid",value:c},g(f,d&&void 0!==d.definitions),f)},b.escapeRegex=function(a){var b=["/",".","*","+","?","|","(",")","[","]","{","}","\\","$","^"];return a.replace(new RegExp("(\\"+b.join("|\\")+")","gim"),"\\$1")},b.keyCode={ALT:18,BACKSPACE:8,CAPS_LOCK:20,COMMA:188,COMMAND:91,COMMAND_LEFT:91,COMMAND_RIGHT:93,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,INSERT:45,LEFT:37,MENU:93,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SHIFT:16,SPACE:32,TAB:9,UP:38,WINDOWS:91};var i=navigator.userAgent,j=null!==i.match(new RegExp("iphone","i")),k=null!==i.match(new RegExp("android.*chrome.*","i")),l=null!==i.match(new RegExp("android.*firefox.*","i")),m=c("paste")?"paste":c("input")?"input":"propertychange";return window.Inputmask=b,b}(jQuery),function(a){return void 0===a.fn.inputmask&&(a.fn.inputmask=function(b,c){var d,e;if(c=c||{},"string"==typeof b)switch(b){case"mask":return d=new Inputmask(c),this.each(function(){d.mask(this)});case"unmaskedvalue":return e=this.jquery&&this.length>0?this[0]:this,e.inputmask?e.inputmask.unmaskedvalue():a(e).val();case"remove":return this.each(function(){this.inputmask&&this.inputmask.remove()});case"getemptymask":return e=this.jquery&&this.length>0?this[0]:this,e.inputmask?e.inputmask.getemptymask():"";case"hasMaskedValue":return e=this.jquery&&this.length>0?this[0]:this,e.inputmask?e.inputmask.hasMaskedValue():!1;case"isComplete":return e=this.jquery&&this.length>0?this[0]:this,e.inputmask?e.inputmask.isComplete():!0;case"getmetadata":return e=this.jquery&&this.length>0?this[0]:this,e.inputmask?e.inputmask.getmetadata():void 0;case"setvalue":e=this.jquery&&this.length>0?this[0]:this,a(e).val(c),void 0===e.Inputmask&&a(e).triggerHandler("setvalue.inputmask");break;default:return c.alias=b,d=new Inputmask(c),this.each(function(){d.mask(this)})}else{if("object"==typeof b)return d=new Inputmask(b),this.each(function(){d.mask(this)});if(void 0===b)return this.each(function(){d=new Inputmask(c),d.mask(this)})}}),a.fn.inputmask}(jQuery),function(a){return Inputmask.extendDefinitions({h:{validator:"[01][0-9]|2[0-3]",cardinality:2,prevalidator:[{validator:"[0-2]",cardinality:1}]},s:{validator:"[0-5][0-9]",cardinality:2,prevalidator:[{validator:"[0-5]",cardinality:1}]},d:{validator:"0[1-9]|[12][0-9]|3[01]",cardinality:2,prevalidator:[{validator:"[0-3]",cardinality:1}]},m:{validator:"0[1-9]|1[012]",cardinality:2,prevalidator:[{validator:"[01]",cardinality:1}]},y:{validator:"(19|20)\\d{2}",cardinality:4,prevalidator:[{validator:"[12]",cardinality:1},{validator:"(19|20)",cardinality:2},{validator:"(19|20)\\d",cardinality:3}]}}),Inputmask.extendAliases({"dd/mm/yyyy":{mask:"1/2/y",placeholder:"dd/mm/yyyy",regex:{val1pre:new RegExp("[0-3]"),val1:new RegExp("0[1-9]|[12][0-9]|3[01]"),val2pre:function(a){var b=Inputmask.escapeRegex.call(this,a);return new RegExp("((0[1-9]|[12][0-9]|3[01])"+b+"[01])")},val2:function(a){var b=Inputmask.escapeRegex.call(this,a);return new RegExp("((0[1-9]|[12][0-9])"+b+"(0[1-9]|1[012]))|(30"+b+"(0[13-9]|1[012]))|(31"+b+"(0[13578]|1[02]))")}},leapday:"29/02/",separator:"/",yearrange:{minyear:1900,maxyear:2099},isInYearRange:function(a,b,c){if(isNaN(a))return!1;var d=parseInt(a.concat(b.toString().slice(a.length))),e=parseInt(a.concat(c.toString().slice(a.length)));return(isNaN(d)?!1:d>=b&&c>=d)||(isNaN(e)?!1:e>=b&&c>=e)},determinebaseyear:function(a,b,c){var d=(new Date).getFullYear();if(a>d)return a;if(d>b){for(var e=b.toString().slice(0,2),f=b.toString().slice(2,4);e+c>b;)e--;var g=e+f;return a>g?a:g}return d},onKeyDown:function(b,c,d,e){var f=a(this);if(b.ctrlKey&&b.keyCode===Inputmask.keyCode.RIGHT){var g=new Date;f.val(g.getDate().toString()+(g.getMonth()+1).toString()+g.getFullYear().toString()),f.triggerHandler("setvalue.inputmask")}},getFrontValue:function(a,b,c){for(var d=0,e=0,f=0;f<a.length&&"2"!==a.charAt(f);f++){var g=c.definitions[a.charAt(f)];g?(d+=e,e=g.cardinality):e++}return b.join("").substr(d,e)},definitions:{1:{validator:function(a,b,c,d,e){var f=e.regex.val1.test(a);return d||f||a.charAt(1)!==e.separator&&-1==="-./".indexOf(a.charAt(1))||!(f=e.regex.val1.test("0"+a.charAt(0)))?f:(b.buffer[c-1]="0",{refreshFromBuffer:{start:c-1,end:c},pos:c,c:a.charAt(0)})},cardinality:2,prevalidator:[{validator:function(a,b,c,d,e){var f=a;isNaN(b.buffer[c+1])||(f+=b.buffer[c+1]);var g=1===f.length?e.regex.val1pre.test(f):e.regex.val1.test(f);if(!d&&!g){if(g=e.regex.val1.test(a+"0"))return b.buffer[c]=a,b.buffer[++c]="0",{pos:c,c:"0"};if(g=e.regex.val1.test("0"+a))return b.buffer[c]="0",c++,{pos:c}}return g},cardinality:1}]},2:{validator:function(a,b,c,d,e){var f=e.getFrontValue(b.mask,b.buffer,e);-1!==f.indexOf(e.placeholder[0])&&(f="01"+e.separator);var g=e.regex.val2(e.separator).test(f+a);if(!d&&!g&&(a.charAt(1)===e.separator||-1!=="-./".indexOf(a.charAt(1)))&&(g=e.regex.val2(e.separator).test(f+"0"+a.charAt(0))))return b.buffer[c-1]="0",{refreshFromBuffer:{start:c-1,end:c},pos:c,c:a.charAt(0)};if(e.mask.indexOf("2")===e.mask.length-1&&g){var h=b.buffer.join("").substr(4,4)+a;if(h!==e.leapday)return!0;var i=parseInt(b.buffer.join("").substr(0,4),10);return i%4===0?i%100===0?i%400===0?!0:!1:!0:!1}return g},cardinality:2,prevalidator:[{validator:function(a,b,c,d,e){isNaN(b.buffer[c+1])||(a+=b.buffer[c+1]);var f=e.getFrontValue(b.mask,b.buffer,e);-1!==f.indexOf(e.placeholder[0])&&(f="01"+e.separator);var g=1===a.length?e.regex.val2pre(e.separator).test(f+a):e.regex.val2(e.separator).test(f+a);return d||g||!(g=e.regex.val2(e.separator).test(f+"0"+a))?g:(b.buffer[c]="0",c++,{pos:c})},cardinality:1}]},y:{validator:function(a,b,c,d,e){if(e.isInYearRange(a,e.yearrange.minyear,e.yearrange.maxyear)){var f=b.buffer.join("").substr(0,6);if(f!==e.leapday)return!0;var g=parseInt(a,10);return g%4===0?g%100===0?g%400===0?!0:!1:!0:!1}return!1},cardinality:4,prevalidator:[{validator:function(a,b,c,d,e){var f=e.isInYearRange(a,e.yearrange.minyear,e.yearrange.maxyear);if(!d&&!f){var g=e.determinebaseyear(e.yearrange.minyear,e.yearrange.maxyear,a+"0").toString().slice(0,1);if(f=e.isInYearRange(g+a,e.yearrange.minyear,e.yearrange.maxyear))return b.buffer[c++]=g.charAt(0),{pos:c};if(g=e.determinebaseyear(e.yearrange.minyear,e.yearrange.maxyear,a+"0").toString().slice(0,2),f=e.isInYearRange(g+a,e.yearrange.minyear,e.yearrange.maxyear))return b.buffer[c++]=g.charAt(0),b.buffer[c++]=g.charAt(1),{pos:c}}return f},cardinality:1},{validator:function(a,b,c,d,e){var f=e.isInYearRange(a,e.yearrange.minyear,e.yearrange.maxyear);if(!d&&!f){var g=e.determinebaseyear(e.yearrange.minyear,e.yearrange.maxyear,a).toString().slice(0,2);if(f=e.isInYearRange(a[0]+g[1]+a[1],e.yearrange.minyear,e.yearrange.maxyear))return b.buffer[c++]=g.charAt(1),{pos:c};if(g=e.determinebaseyear(e.yearrange.minyear,e.yearrange.maxyear,a).toString().slice(0,2),e.isInYearRange(g+a,e.yearrange.minyear,e.yearrange.maxyear)){var h=b.buffer.join("").substr(0,6);if(h!==e.leapday)f=!0;else{var i=parseInt(a,10);f=i%4===0?i%100===0?i%400===0?!0:!1:!0:!1}}else f=!1;if(f)return b.buffer[c-1]=g.charAt(0),b.buffer[c++]=g.charAt(1),b.buffer[c++]=a.charAt(0),{refreshFromBuffer:{start:c-3,end:c},pos:c}}return f},cardinality:2},{validator:function(a,b,c,d,e){return e.isInYearRange(a,e.yearrange.minyear,e.yearrange.maxyear)},cardinality:3}]}},insertMode:!1,autoUnmask:!1},"mm/dd/yyyy":{placeholder:"mm/dd/yyyy",alias:"dd/mm/yyyy",regex:{val2pre:function(a){var b=Inputmask.escapeRegex.call(this,a);return new RegExp("((0[13-9]|1[012])"+b+"[0-3])|(02"+b+"[0-2])")},val2:function(a){var b=Inputmask.escapeRegex.call(this,a);return new RegExp("((0[1-9]|1[012])"+b+"(0[1-9]|[12][0-9]))|((0[13-9]|1[012])"+b+"30)|((0[13578]|1[02])"+b+"31)")},val1pre:new RegExp("[01]"),val1:new RegExp("0[1-9]|1[012]")},leapday:"02/29/",onKeyDown:function(b,c,d,e){var f=a(this);if(b.ctrlKey&&b.keyCode===Inputmask.keyCode.RIGHT){var g=new Date;f.val((g.getMonth()+1).toString()+g.getDate().toString()+g.getFullYear().toString()),f.triggerHandler("setvalue.inputmask")}}},"yyyy/mm/dd":{mask:"y/1/2",placeholder:"yyyy/mm/dd",alias:"mm/dd/yyyy",leapday:"/02/29",onKeyDown:function(b,c,d,e){var f=a(this);if(b.ctrlKey&&b.keyCode===Inputmask.keyCode.RIGHT){var g=new Date;f.val(g.getFullYear().toString()+(g.getMonth()+1).toString()+g.getDate().toString()),f.triggerHandler("setvalue.inputmask")}}},"dd.mm.yyyy":{mask:"1.2.y",placeholder:"dd.mm.yyyy",leapday:"29.02.",separator:".",alias:"dd/mm/yyyy"},"dd-mm-yyyy":{mask:"1-2-y",placeholder:"dd-mm-yyyy",leapday:"29-02-",separator:"-",alias:"dd/mm/yyyy"},"mm.dd.yyyy":{mask:"1.2.y",placeholder:"mm.dd.yyyy",leapday:"02.29.",separator:".",alias:"mm/dd/yyyy"},"mm-dd-yyyy":{mask:"1-2-y",placeholder:"mm-dd-yyyy",leapday:"02-29-",separator:"-",alias:"mm/dd/yyyy"},"yyyy.mm.dd":{mask:"y.1.2",placeholder:"yyyy.mm.dd",leapday:".02.29",separator:".",alias:"yyyy/mm/dd"},"yyyy-mm-dd":{mask:"y-1-2",placeholder:"yyyy-mm-dd",leapday:"-02-29",separator:"-",alias:"yyyy/mm/dd"},datetime:{mask:"1/2/y h:s",placeholder:"dd/mm/yyyy hh:mm",alias:"dd/mm/yyyy",regex:{hrspre:new RegExp("[012]"),hrs24:new RegExp("2[0-4]|1[3-9]"),hrs:new RegExp("[01][0-9]|2[0-4]"),ampm:new RegExp("^[a|p|A|P][m|M]"),mspre:new RegExp("[0-5]"),ms:new RegExp("[0-5][0-9]")},timeseparator:":",hourFormat:"24",definitions:{h:{validator:function(a,b,c,d,e){if("24"===e.hourFormat&&24===parseInt(a,10))return b.buffer[c-1]="0",b.buffer[c]="0",{refreshFromBuffer:{start:c-1,end:c},c:"0"};var f=e.regex.hrs.test(a);if(!d&&!f&&(a.charAt(1)===e.timeseparator||-1!=="-.:".indexOf(a.charAt(1)))&&(f=e.regex.hrs.test("0"+a.charAt(0))))return b.buffer[c-1]="0",b.buffer[c]=a.charAt(0),c++,{refreshFromBuffer:{start:c-2,end:c},pos:c,c:e.timeseparator};if(f&&"24"!==e.hourFormat&&e.regex.hrs24.test(a)){var g=parseInt(a,10);return 24===g?(b.buffer[c+5]="a",b.buffer[c+6]="m"):(b.buffer[c+5]="p",b.buffer[c+6]="m"),g-=12,10>g?(b.buffer[c]=g.toString(),b.buffer[c-1]="0"):(b.buffer[c]=g.toString().charAt(1),b.buffer[c-1]=g.toString().charAt(0)),{refreshFromBuffer:{start:c-1,end:c+6},c:b.buffer[c]}}return f},cardinality:2,prevalidator:[{validator:function(a,b,c,d,e){var f=e.regex.hrspre.test(a);return d||f||!(f=e.regex.hrs.test("0"+a))?f:(b.buffer[c]="0",c++,{pos:c})},cardinality:1}]},s:{validator:"[0-5][0-9]",cardinality:2,prevalidator:[{validator:function(a,b,c,d,e){var f=e.regex.mspre.test(a);return d||f||!(f=e.regex.ms.test("0"+a))?f:(b.buffer[c]="0",c++,{pos:c})},cardinality:1}]},t:{validator:function(a,b,c,d,e){return e.regex.ampm.test(a+"m")},casing:"lower",cardinality:1}},insertMode:!1,autoUnmask:!1},datetime12:{mask:"1/2/y h:s t\\m",placeholder:"dd/mm/yyyy hh:mm xm",alias:"datetime",hourFormat:"12"},"hh:mm t":{mask:"h:s t\\m",placeholder:"hh:mm xm",alias:"datetime",hourFormat:"12"},"h:s t":{mask:"h:s t\\m",placeholder:"hh:mm xm",alias:"datetime",hourFormat:"12"},"hh:mm:ss":{mask:"h:s:s",placeholder:"hh:mm:ss",alias:"datetime",autoUnmask:!1},"hh:mm":{mask:"h:s",placeholder:"hh:mm",alias:"datetime",autoUnmask:!1},date:{alias:"dd/mm/yyyy"},"mm/yyyy":{mask:"1/y",placeholder:"mm/yyyy",leapday:"donotuse",separator:"/",alias:"mm/dd/yyyy"},shamsi:{regex:{val2pre:function(a){var b=Inputmask.escapeRegex.call(this,a);return new RegExp("((0[1-9]|1[012])"+b+"[0-3])")},val2:function(a){var b=Inputmask.escapeRegex.call(this,a);return new RegExp("((0[1-9]|1[012])"+b+"(0[1-9]|[12][0-9]))|((0[1-9]|1[012])"+b+"30)|((0[1-6])"+b+"31)")},val1pre:new RegExp("[01]"),val1:new RegExp("0[1-9]|1[012]")},yearrange:{minyear:1300,maxyear:1499},mask:"y/1/2",leapday:"/12/30",placeholder:"yyyy/mm/dd",alias:"mm/dd/yyyy",clearIncomplete:!0}}),Inputmask}(jQuery),function(a){return Inputmask.extendDefinitions({A:{validator:"[A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",cardinality:1,casing:"upper"},"&":{validator:"[0-9A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",cardinality:1,casing:"upper"},"#":{validator:"[0-9A-Fa-f]",cardinality:1,casing:"upper"}}),Inputmask.extendAliases({url:{mask:"ir",placeholder:"",separator:"",defaultPrefix:"http://",regex:{urlpre1:new RegExp("[fh]"),urlpre2:new RegExp("(ft|ht)"),urlpre3:new RegExp("(ftp|htt)"),urlpre4:new RegExp("(ftp:|http|ftps)"),urlpre5:new RegExp("(ftp:/|ftps:|http:|https)"),urlpre6:new RegExp("(ftp://|ftps:/|http:/|https:)"),urlpre7:new RegExp("(ftp://|ftps://|http://|https:/)"),urlpre8:new RegExp("(ftp://|ftps://|http://|https://)")},definitions:{i:{validator:function(a,b,c,d,e){return!0},cardinality:8,prevalidator:function(){for(var a=[],b=8,c=0;b>c;c++)a[c]=function(){var a=c;return{validator:function(b,c,d,e,f){if(f.regex["urlpre"+(a+1)]){var g,h=b;a+1-b.length>0&&(h=c.buffer.join("").substring(0,a+1-b.length)+""+h);var i=f.regex["urlpre"+(a+1)].test(h);if(!e&&!i){for(d-=a,g=0;g<f.defaultPrefix.length;g++)c.buffer[d]=f.defaultPrefix[g],d++;for(g=0;g<h.length-1;g++)c.buffer[d]=h[g],d++;return{pos:d}}return i}return!1},cardinality:a}}();return a}()},r:{validator:".",cardinality:50}},insertMode:!1,autoUnmask:!1},ip:{mask:"i[i[i]].i[i[i]].i[i[i]].i[i[i]]",definitions:{i:{validator:function(a,b,c,d,e){return c-1>-1&&"."!==b.buffer[c-1]?(a=b.buffer[c-1]+a,a=c-2>-1&&"."!==b.buffer[c-2]?b.buffer[c-2]+a:"0"+a):a="00"+a,new RegExp("25[0-5]|2[0-4][0-9]|[01][0-9][0-9]").test(a)},cardinality:1}}},email:{mask:"*{1,64}[.*{1,64}][.*{1,64}][.*{1,64}]@*{1,64}[.*{2,64}][.*{2,6}][.*{1,2}]",greedy:!1,onBeforePaste:function(a,b){return a=a.toLowerCase(),a.replace("mailto:","")},definitions:{"*":{validator:"[0-9A-Za-z!#$%&'*+/=?^_`{|}~-]",cardinality:1,casing:"lower"}}},mac:{mask:"##:##:##:##:##:##"}}),Inputmask}(jQuery),function(a){return Inputmask.extendAliases({numeric:{mask:function(a){function b(b){for(var c="",d=0;d<b.length;d++)c+=a.definitions[b[d]]?"\\"+b[d]:b[d];return c}if(0!==a.repeat&&isNaN(a.integerDigits)&&(a.integerDigits=a.repeat),a.repeat=0,a.groupSeparator===a.radixPoint&&("."===a.radixPoint?a.groupSeparator=",":","===a.radixPoint?a.groupSeparator=".":a.groupSeparator="")," "===a.groupSeparator&&(a.skipOptionalPartCharacter=void 0),a.autoGroup=a.autoGroup&&""!==a.groupSeparator,a.autoGroup&&("string"==typeof a.groupSize&&isFinite(a.groupSize)&&(a.groupSize=parseInt(a.groupSize)),isFinite(a.integerDigits))){var c=Math.floor(a.integerDigits/a.groupSize),d=a.integerDigits%a.groupSize;a.integerDigits=parseInt(a.integerDigits)+(0===d?c-1:c),a.integerDigits<1&&(a.integerDigits="*")}a.placeholder.length>1&&(a.placeholder=a.placeholder.charAt(0)),a.radixFocus=a.radixFocus&&""!==a.placeholder&&a.integerOptional===!0,a.definitions[";"]=a.definitions["~"],a.definitions[";"].definitionSymbol="~",a.numericInput===!0&&(a.radixFocus=!1,a.digitsOptional=!1,isNaN(a.digits)&&(a.digits=2),a.decimalProtect=!1);var e=b(a.prefix);return e+="[+]",e+=a.integerOptional===!0?"~{1,"+a.integerDigits+"}":"~{"+a.integerDigits+"}",void 0!==a.digits&&(isNaN(a.digits)||parseInt(a.digits)>0)&&(e+=a.digitsOptional?"["+(a.decimalProtect?":":a.radixPoint)+";{"+a.digits+"}]":(a.decimalProtect?":":a.radixPoint)+";{"+a.digits+"}"),""!==a.negationSymbol.back&&(e+="[-]"),e+=b(a.suffix),a.greedy=!1,e},placeholder:"",greedy:!1,digits:"*",digitsOptional:!0,radixPoint:".",radixFocus:!0,groupSize:3,groupSeparator:"",autoGroup:!1,allowPlus:!0,allowMinus:!0,negationSymbol:{front:"-",back:""},integerDigits:"+",integerOptional:!0,prefix:"",suffix:"",rightAlign:!0,decimalProtect:!0,min:void 0,max:void 0,step:1,insertMode:!0,autoUnmask:!1,unmaskAsNumber:!1,postFormat:function(b,c,d,e){e.numericInput===!0&&(b=b.reverse(),isFinite(c)&&(c=b.join("").length-c-1));var f,g,h=!1;b.length>=e.suffix.length&&b.join("").indexOf(e.suffix)===b.length-e.suffix.length&&(b.length=b.length-e.suffix.length,h=!0),c=c>=b.length?b.length-1:c<e.prefix.length?e.prefix.length:c;var i=!1,j=b[c];if(""===e.groupSeparator||e.numericInput!==!0&&-1!==a.inArray(e.radixPoint,b)&&c>a.inArray(e.radixPoint,b)||new RegExp("["+Inputmask.escapeRegex(e.negationSymbol.front)+"+]").test(j)){if(h)for(f=0,g=e.suffix.length;g>f;f++)b.push(e.suffix.charAt(f));return{pos:c}}var k=b.slice();j===e.groupSeparator&&(k.splice(c--,1),j=k[c]),d?j!==e.radixPoint&&(k[c]="?"):k.splice(c,0,"?");var l=k.join(""),m=l;if(l.length>0&&e.autoGroup||d&&-1!==l.indexOf(e.groupSeparator)){var n=Inputmask.escapeRegex(e.groupSeparator);i=0===l.indexOf(e.groupSeparator),l=l.replace(new RegExp(n,"g"),"");var o=l.split(e.radixPoint);if(l=""===e.radixPoint?l:o[0],l!==e.prefix+"?0"&&l.length>=e.groupSize+e.prefix.length)for(var p=new RegExp("([-+]?[\\d?]+)([\\d?]{"+e.groupSize+"})");p.test(l);)l=l.replace(p,"$1"+e.groupSeparator+"$2"),l=l.replace(e.groupSeparator+e.groupSeparator,e.groupSeparator);""!==e.radixPoint&&o.length>1&&(l+=e.radixPoint+o[1])}for(i=m!==l,b.length=l.length,
f=0,g=l.length;g>f;f++)b[f]=l.charAt(f);var q=a.inArray("?",b);if(-1===q&&j===e.radixPoint&&(q=a.inArray(e.radixPoint,b)),d?b[q]=j:b.splice(q,1),!i&&h)for(f=0,g=e.suffix.length;g>f;f++)b.push(e.suffix.charAt(f));return{pos:e.numericInput&&isFinite(c)?b.join("").length-q-1:q,refreshFromBuffer:i,buffer:e.numericInput===!0?b.reverse():b}},onBeforeWrite:function(b,c,d,e){if(b&&("blur"===b.type||"checkval"===b.type)){var f=c.join(""),g=f.replace(e.prefix,"");if(g=g.replace(e.suffix,""),g=g.replace(new RegExp(Inputmask.escapeRegex(e.groupSeparator),"g"),""),","===e.radixPoint&&(g=g.replace(Inputmask.escapeRegex(e.radixPoint),".")),isFinite(g)&&isFinite(e.min)&&parseFloat(g)<parseFloat(e.min))return a.extend(!0,{refreshFromBuffer:!0,buffer:(e.prefix+e.min).split("")},e.postFormat((e.prefix+e.min).split(""),0,!0,e));if(e.numericInput!==!0){var h=""!==e.radixPoint?c.join("").split(e.radixPoint):[c.join("")],i=h[0].match(e.regex.integerPart(e)),j=2===h.length?h[1].match(e.regex.integerNPart(e)):void 0;if(i){i[0]!==e.negationSymbol.front+"0"&&i[0]!==e.negationSymbol.front&&"+"!==i[0]||void 0!==j&&!j[0].match(/^0+$/)||c.splice(i.index,1);var k=a.inArray(e.radixPoint,c);if(-1!==k){if(isFinite(e.digits)&&!e.digitsOptional){for(var l=1;l<=e.digits;l++)(void 0===c[k+l]||c[k+l]===e.placeholder.charAt(0))&&(c[k+l]="0");return{refreshFromBuffer:f!==c.join(""),buffer:c}}if(k===c.length-e.suffix.length-1)return c.splice(k,1),{refreshFromBuffer:!0,buffer:c}}}}}if(e.autoGroup){var m=e.postFormat(c,d-1,!0,e);return m.caret=d<=e.prefix.length?m.pos:m.pos+1,m}},regex:{integerPart:function(a){return new RegExp("["+Inputmask.escapeRegex(a.negationSymbol.front)+"+]?\\d+")},integerNPart:function(a){return new RegExp("[\\d"+Inputmask.escapeRegex(a.groupSeparator)+"]+")}},signHandler:function(a,b,c,d,e){if(!d&&e.allowMinus&&"-"===a||e.allowPlus&&"+"===a){var f=b.buffer.join("").match(e.regex.integerPart(e));if(f&&f[0].length>0)return b.buffer[f.index]===("-"===a?"+":e.negationSymbol.front)?"-"===a?""!==e.negationSymbol.back?{pos:f.index,c:e.negationSymbol.front,remove:f.index,caret:c,insert:{pos:b.buffer.length-e.suffix.length-1,c:e.negationSymbol.back}}:{pos:f.index,c:e.negationSymbol.front,remove:f.index,caret:c}:""!==e.negationSymbol.back?{pos:f.index,c:"+",remove:[f.index,b.buffer.length-e.suffix.length-1],caret:c}:{pos:f.index,c:"+",remove:f.index,caret:c}:b.buffer[f.index]===("-"===a?e.negationSymbol.front:"+")?"-"===a&&""!==e.negationSymbol.back?{remove:[f.index,b.buffer.length-e.suffix.length-1],caret:c-1}:{remove:f.index,caret:c-1}:"-"===a?""!==e.negationSymbol.back?{pos:f.index,c:e.negationSymbol.front,caret:c+1,insert:{pos:b.buffer.length-e.suffix.length,c:e.negationSymbol.back}}:{pos:f.index,c:e.negationSymbol.front,caret:c+1}:{pos:f.index,c:a,caret:c+1}}return!1},radixHandler:function(b,c,d,e,f){if(!e&&(-1!==a.inArray(b,[",","."])&&(b=f.radixPoint),b===f.radixPoint&&void 0!==f.digits&&(isNaN(f.digits)||parseInt(f.digits)>0))){var g=a.inArray(f.radixPoint,c.buffer),h=c.buffer.join("").match(f.regex.integerPart(f));if(-1!==g&&c.validPositions[g])return c.validPositions[g-1]?{caret:g+1}:{pos:h.index,c:h[0],caret:g+1};if(!h||"0"===h[0]&&h.index+1!==d)return c.buffer[h?h.index:d]="0",{pos:(h?h.index:d)+1,c:f.radixPoint}}return!1},leadingZeroHandler:function(b,c,d,e,f){if(f.numericInput===!0){if("0"===c.buffer[c.buffer.length-f.prefix.length-1])return{pos:d,remove:c.buffer.length-f.prefix.length-1}}else{var g=c.buffer.join("").match(f.regex.integerNPart(f)),h=a.inArray(f.radixPoint,c.buffer);if(g&&!e&&(-1===h||h>=d))if(0===g[0].indexOf("0")){d<f.prefix.length&&(d=g.index);var i=a.inArray(f.radixPoint,c._buffer),j=c._buffer&&c.buffer.slice(h).join("")===c._buffer.slice(i).join("")||0===parseInt(c.buffer.slice(h+1).join("")),k=c._buffer&&c.buffer.slice(g.index,h).join("")===c._buffer.slice(f.prefix.length,i).join("")||"0"===c.buffer.slice(g.index,h).join("");if(-1===h||j&&k)return c.buffer.splice(g.index,1),d=d>g.index?d-1:g.index,{pos:d,remove:g.index};if(g.index+1===d||"0"===b)return c.buffer.splice(g.index,1),d=g.index,{pos:d,remove:g.index}}else if("0"===b&&d<=g.index&&g[0]!==f.groupSeparator)return!1}return!0},postValidation:function(b,c){var d=!0,e=b.join(""),f=e.replace(c.prefix,"");return f=f.replace(c.suffix,""),f=f.replace(new RegExp(Inputmask.escapeRegex(c.groupSeparator),"g"),""),","===c.radixPoint&&(f=f.replace(Inputmask.escapeRegex(c.radixPoint),".")),f=f.replace(new RegExp("^"+Inputmask.escapeRegex(c.negationSymbol.front)),"-"),f=f.replace(new RegExp(Inputmask.escapeRegex(c.negationSymbol.back)+"$"),""),f=f===c.negationSymbol.front?f+"0":f,isFinite(f)&&(isFinite(c.max)&&(d=parseFloat(f)<=parseFloat(c.max)),d&&isFinite(c.min)&&(0>=f||f.toString().length>=c.min.toString().length)&&(d=parseFloat(f)>=parseFloat(c.min),d||(d=a.extend(!0,{refreshFromBuffer:!0,buffer:(c.prefix+c.min).split("")},c.postFormat((c.prefix+c.min).split(""),0,!0,c)),d.refreshFromBuffer=!0))),d},definitions:{"~":{validator:function(b,c,d,e,f){var g=f.signHandler(b,c,d,e,f);if(!g&&(g=f.radixHandler(b,c,d,e,f),!g&&(g=e?new RegExp("[0-9"+Inputmask.escapeRegex(f.groupSeparator)+"]").test(b):new RegExp("[0-9]").test(b),g===!0&&(g=f.leadingZeroHandler(b,c,d,e,f),g===!0)))){var h=a.inArray(f.radixPoint,c.buffer);g=-1!==h&&f.digitsOptional===!1&&d>h&&!e?{pos:d,remove:d}:{pos:d}}return g},cardinality:1,prevalidator:null},"+":{validator:function(a,b,c,d,e){var f=e.signHandler(a,b,c,d,e);return!f&&(d&&e.allowMinus&&a===e.negationSymbol.front||e.allowMinus&&"-"===a||e.allowPlus&&"+"===a)&&(f="-"===a?""!==e.negationSymbol.back?{pos:c,c:"-"===a?e.negationSymbol.front:"+",caret:c+1,insert:{pos:b.buffer.length,c:e.negationSymbol.back}}:{pos:c,c:"-"===a?e.negationSymbol.front:"+",caret:c+1}:!0),f},cardinality:1,prevalidator:null,placeholder:""},"-":{validator:function(a,b,c,d,e){var f=e.signHandler(a,b,c,d,e);return!f&&d&&e.allowMinus&&a===e.negationSymbol.back&&(f=!0),f},cardinality:1,prevalidator:null,placeholder:""},":":{validator:function(a,b,c,d,e){var f=e.signHandler(a,b,c,d,e);if(!f){var g="["+Inputmask.escapeRegex(e.radixPoint)+",\\.]";f=new RegExp(g).test(a),f&&b.validPositions[c]&&b.validPositions[c].match.placeholder===e.radixPoint&&(f={caret:c+1})}return f?{c:e.radixPoint}:f},cardinality:1,prevalidator:null,placeholder:function(a){return a.radixPoint}}},onUnMask:function(a,b,c){var d=a.replace(c.prefix,"");return d=d.replace(c.suffix,""),d=d.replace(new RegExp(Inputmask.escapeRegex(c.groupSeparator),"g"),""),c.unmaskAsNumber?(d=d.replace(Inputmask.escapeRegex.call(this,c.radixPoint),"."),Number(d)):d},isComplete:function(a,b){var c=a.join(""),d=a.slice();if(b.postFormat(d,0,!0,b),d.join("")!==c)return!1;var e=c.replace(b.prefix,"");return e=e.replace(b.suffix,""),e=e.replace(new RegExp(Inputmask.escapeRegex(b.groupSeparator),"g"),""),","===b.radixPoint&&(e=e.replace(Inputmask.escapeRegex(b.radixPoint),".")),isFinite(e)},onBeforeMask:function(a,b){if(""!==b.radixPoint&&isFinite(a))a=a.toString().replace(".",b.radixPoint);else{var c=a.match(/,/g),d=a.match(/\./g);d&&c?d.length>c.length?(a=a.replace(/\./g,""),a=a.replace(",",b.radixPoint)):c.length>d.length?(a=a.replace(/,/g,""),a=a.replace(".",b.radixPoint)):a=a.indexOf(".")<a.indexOf(",")?a.replace(/\./g,""):a=a.replace(/,/g,""):a=a.replace(new RegExp(Inputmask.escapeRegex(b.groupSeparator),"g"),"")}if(0===b.digits&&(-1!==a.indexOf(".")?a=a.substring(0,a.indexOf(".")):-1!==a.indexOf(",")&&(a=a.substring(0,a.indexOf(",")))),""!==b.radixPoint&&isFinite(b.digits)&&-1!==a.indexOf(b.radixPoint)){var e=a.split(b.radixPoint),f=e[1].match(new RegExp("\\d*"))[0];if(parseInt(b.digits)<f.toString().length){var g=Math.pow(10,parseInt(b.digits));a=a.replace(Inputmask.escapeRegex(b.radixPoint),"."),a=Math.round(parseFloat(a)*g)/g,a=a.toString().replace(".",b.radixPoint)}}return a.toString()},canClearPosition:function(b,c,d,e,f){var g=b.validPositions[c].input,h=g!==f.radixPoint||null!==b.validPositions[c].match.fn&&f.decimalProtect===!1||isFinite(g)||c===d||g===f.groupSeparator||g===f.negationSymbol.front||g===f.negationSymbol.back;if(h&&isFinite(g)){var i,j=a.inArray(f.radixPoint,b.buffer),k=!1;if(void 0===b.validPositions[j]&&(b.validPositions[j]={input:f.radixPoint},k=!0),!e&&b.buffer){i=b.buffer.join("").substr(0,c).match(f.regex.integerNPart(f));var l=c+1,m=null==i||0===parseInt(i[0].replace(new RegExp(Inputmask.escapeRegex(f.groupSeparator),"g"),""));if(m)for(;b.validPositions[l]&&(b.validPositions[l].input===f.groupSeparator||"0"===b.validPositions[l].input);)delete b.validPositions[l],l++}var n=[];for(var o in b.validPositions)void 0!==b.validPositions[o].input&&n.push(b.validPositions[o].input);if(k&&delete b.validPositions[j],j>0&&(i=n.join("").match(f.regex.integerNPart(f)),i&&j>=c))if(0===i[0].indexOf("0"))h=i.index!==c||"0"===f.placeholder;else{var p=parseInt(i[0].replace(new RegExp(Inputmask.escapeRegex(f.groupSeparator),"g"),""));10>p&&b.validPositions[c]&&"0"!==f.placeholder&&(b.validPositions[c].input="0",b.p=f.prefix.length+1,h=!1)}}return h},onKeyDown:function(b,c,d,e){var f=a(this);if(b.ctrlKey)switch(b.keyCode){case Inputmask.keyCode.UP:f.val(parseFloat(this.inputmask.unmaskedvalue())+parseInt(e.step)),f.triggerHandler("setvalue.inputmask");break;case Inputmask.keyCode.DOWN:f.val(parseFloat(this.inputmask.unmaskedvalue())-parseInt(e.step)),f.triggerHandler("setvalue.inputmask")}}},currency:{prefix:"$ ",groupSeparator:",",alias:"numeric",placeholder:"0",autoGroup:!0,digits:2,digitsOptional:!1,clearMaskOnLostFocus:!1},decimal:{alias:"numeric"},integer:{alias:"numeric",digits:0,radixPoint:""},percentage:{alias:"numeric",digits:2,radixPoint:".",placeholder:"0",autoGroup:!1,min:0,max:100,suffix:" %",allowPlus:!1,allowMinus:!1}}),Inputmask}(jQuery),function(a){return Inputmask.extendAliases({phone:{url:"phone-codes/phone-codes.js",countrycode:"",mask:function(b){b.definitions["#"]=b.definitions[9];var c=[];return a.ajax({url:b.url,async:!1,dataType:"json",success:function(a){c=a},error:function(a,c,d){alert(d+" - "+b.url)}}),c=c.sort(function(a,b){return(a.mask||a)<(b.mask||b)?-1:1})},keepStatic:!1,nojumps:!0,nojumpsThreshold:1,onBeforeMask:function(a,b){var c=a.replace(/^0/g,"");return(c.indexOf(b.countrycode)>1||-1===c.indexOf(b.countrycode))&&(c="+"+b.countrycode+c),c}},phonebe:{alias:"phone",url:"phone-codes/phone-be.js",countrycode:"32",nojumpsThreshold:4}}),Inputmask}(jQuery),function(a){return Inputmask.extendAliases({Regex:{mask:"r",greedy:!1,repeat:"*",regex:null,regexTokens:null,tokenizer:/\[\^?]?(?:[^\\\]]+|\\[\S\s]?)*]?|\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9][0-9]*|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|c[A-Za-z]|[\S\s]?)|\((?:\?[:=!]?)?|(?:[?*+]|\{[0-9]+(?:,[0-9]*)?\})\??|[^.?*+^${[()|\\]+|./g,quantifierFilter:/[0-9]+[^,]/,isComplete:function(a,b){return new RegExp(b.regex).test(a.join(""))},definitions:{r:{validator:function(b,c,d,e,f){function g(a,b){this.matches=[],this.isGroup=a||!1,this.isQuantifier=b||!1,this.quantifier={min:1,max:1},this.repeaterPart=void 0}function h(){var a,b,c=new g,d=[];for(f.regexTokens=[];a=f.tokenizer.exec(f.regex);)switch(b=a[0],b.charAt(0)){case"(":d.push(new g(!0));break;case")":j=d.pop(),d.length>0?d[d.length-1].matches.push(j):c.matches.push(j);break;case"{":case"+":case"*":var e=new g(!1,!0);b=b.replace(/[{}]/g,"");var h=b.split(","),i=isNaN(h[0])?h[0]:parseInt(h[0]),k=1===h.length?i:isNaN(h[1])?h[1]:parseInt(h[1]);if(e.quantifier={min:i,max:k},d.length>0){var l=d[d.length-1].matches;a=l.pop(),a.isGroup||(j=new g(!0),j.matches.push(a),a=j),l.push(a),l.push(e)}else a=c.matches.pop(),a.isGroup||(j=new g(!0),j.matches.push(a),a=j),c.matches.push(a),c.matches.push(e);break;default:d.length>0?d[d.length-1].matches.push(b):c.matches.push(b)}c.matches.length>0&&f.regexTokens.push(c)}function i(b,c){var d=!1;c&&(l+="(",n++);for(var e=0;e<b.matches.length;e++){var f=b.matches[e];if(f.isGroup===!0)d=i(f,!0);else if(f.isQuantifier===!0){var g=a.inArray(f,b.matches),h=b.matches[g-1],j=l;if(isNaN(f.quantifier.max)){for(;f.repeaterPart&&f.repeaterPart!==l&&f.repeaterPart.length>l.length&&!(d=i(h,!0)););d=d||i(h,!0),d&&(f.repeaterPart=l),l=j+f.quantifier.max}else{for(var k=0,m=f.quantifier.max-1;m>k&&!(d=i(h,!0));k++);l=j+"{"+f.quantifier.min+","+f.quantifier.max+"}"}}else if(void 0!==f.matches)for(var p=0;p<f.length&&!(d=i(f[p],c));p++);else{var q;if("["==f.charAt(0)){q=l,q+=f;for(var r=0;n>r;r++)q+=")";var s=new RegExp("^("+q+")$");d=s.test(o)}else for(var t=0,u=f.length;u>t;t++)if("\\"!==f.charAt(t)){q=l,q+=f.substr(0,t+1),q=q.replace(/\|$/,"");for(var r=0;n>r;r++)q+=")";var s=new RegExp("^("+q+")$");if(d=s.test(o))break}l+=f}if(d)break}return c&&(l+=")",n--),d}var j,k=c.buffer.slice(),l="",m=!1,n=0;null===f.regexTokens&&h(),k.splice(d,0,b);for(var o=k.join(""),p=0;p<f.regexTokens.length;p++){var q=f.regexTokens[p];if(m=i(q,q.isGroup))break}return m},cardinality:1}}}}),Inputmask}(jQuery);
/* ..\..\desktop.blocks\jquery\jquery.inputmask.bundle.min.js end */

						input.inputmask('+9 (999) 999-99-99');
					}
				}
			}
		}));
	}
);
/* end: ../../desktop.blocks/maskedinput/maskedinput.js */
/* begin: ../../desktop.blocks/account-dashboard-agency/account-dashboard-agency.js */
({
    shouldDeps: [
        { block: 'link' }
    ]
})
/* end: ../../desktop.blocks/account-dashboard-agency/account-dashboard-agency.js */
/* begin: ../../desktop.blocks/multi-value/multi-value.js */
modules.define('multi-value', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {

    onSetMod: {
        'js' : {
            inited: function() {
                this._items = this.findElem('items');
                this.bindTo('button-add', 'click', this.add, this);
                //this.bindTo('button-del', 'click', this.del, this);
            }
        }
    },

    add: function() {
        // TODO: Необходимо клонировать скрытый елемент с пустыми значениями
        this.findElem('item').eq(0).clone().appendTo(this._items);
    },

    del: function() {
        // TODO
    }

}));

});
/* end: ../../desktop.blocks/multi-value/multi-value.js */
/* begin: ../../desktop.blocks/account-profile-controller/account-profile-controller.js */
modules.define(
    'account-profile-controller',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('account-profile-controller:inited');

                    this._passwords = this.findBlocksInside({ block: 'input', modName: 'type', modVal: 'password'});

                    var that = this;
                    (this._passwords || []).map(function(item) {
                        var group = item.findBlockOutside({ block: 'form-group', modName: 'line' });
                        if (group) {
                            var button = group.findBlockInside('button');
                            button && button.on('click', that._onPasswordButtonClick, that);
                        }
                    });
                }
            }
        },

        _onPasswordButtonClick: function(e) {
            var target = e.target;
            var icon = target.findBlockInside('icon');
            var group = target.findBlockOutside({ block: 'form-group', modName: 'line' });

            if (group) {
                var input = group.findBlockInside({ block: 'input' });
                if (input) {
                    if (!target.hasMod('open')) {
                        target.setMod('open');
                        icon && icon.setMod('action', 'eye-open');
                        input.elem('control').prop('type', 'text');
                    } else {
                        target.delMod('open');
                        icon && icon.setMod('action', 'eye');
                        input.elem('control').prop('type', 'password');
                    }
                }
            }
        }

    }));

});
/* end: ../../desktop.blocks/account-profile-controller/account-profile-controller.js */
/* begin: ../../desktop.blocks/account-my-subs-list/account-my-subs-list.js */
modules.define(
    'account-my-subs-list',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js': {
            'inited': function(){
                console.log('account-my-subs-list:intited');

                this._params = {};
                this._items  = [];

                this.emit('params');
            }
        }
    },

    setParams: function(params) {
        this._params = params || {};
    },

    setData: function(data) {
        
    },

    update: function(items) {
        console.log('Update: account-favorites-list');
    },

    append: function(items) {
        var that = this;

        items = items || [];
        this._items.concat(items);

        items.map(function(item) {
            that.appendItem(item);
        });
    },

    appendItem: function(item) {
        item = item || {};

        BEMDOM.append(this.elem('items'), BEMHTML.apply({
            block: 'account-my-subs-list-item',
            js:   item.js   || undefined,
            mods: item.mods || undefined,
            link: item.link || undefined,
            content: item
        }));
    },

    clear: function(all){
        all = all || false;
        items = this._getItems(all);

        for (var i = items.length - 1; i >= 0; i--) {
            $(items[i].domElem).remove();
        };
    },
    
    _getItems: function(all){
        all = all || false;
        if (!all) {
            return this.findBlocksInside({ block: 'account-my-subs-list-item'});
        }
        return this.findBlocksInside('account-my-subs-list-item');
    },

    _onParams: function(e) {
        e.target.setParams(this._params);
    },

    _onData: function(e) {
       
    }

}


));





});
/* end: ../../desktop.blocks/account-my-subs-list/account-my-subs-list.js */
/* begin: ../../desktop.blocks/account-my-subs-controller/account-my-subs-controller.js */
modules.define(
    'account-my-subs-controller',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('account-favorites-controller:intited');

                    this._params = {
                        userAuth:  false,
                        dataUrl:  '/desktop.blocks/account-my-subs-content/data.json'
                    };

                    this._params = $.extend(this._params, this.params);

                    this._data     = {};
                    this._page     = 1;
                    this._prevPage = 1;
                    this._main     = this.findBlockOn('account-my-subs-content');
                    this._menu     = this.findBlockOutside('account-menu');
                    this._list     = this.findBlockInside('account-my-subs-list');
                    this._pager    = this.findBlockInside('pager');
                    this._spin     = this.findBlockInside('spin');

                    this.on('ajax_start', function() { this.setMod('loading'); });
                    this.on('ajax_end', function() { this.delMod('loading'); });
                    this.on('data_loaded', this._onDataLoaded, this);
                    this.on('data_load_error', this._onDataLoadError, this);

                    this._pager && this._pager.on('change', this._onPageChange, this);

                    this.loadData();
                }
            },
            'loading': {
                true: function() {
                    this._list && this._list.setMod('loading');
                    this._pager && this.setMod('loading');
                    this._spin && this._spin.setMod('visible');
                },
                '': function() {
                    this._list && this._list.delMod('loading');
                    this._pager && this.delMod('loading');
                    this._spin && this._spin.delMod('visible');
                }
            }
        },

        getData: function() {
            return this._data;
        },

        loadData: function() {
            this._abortRequest();

            var that = this;
            var query = this._getUrlParams();
            var url = (this._params.dataUrl || '') + (query ? '?' + query : '');

            this.emit('ajax_start');

            this._xhr = $.ajax({
                method: 'GET',
                url: url,
                dataType: 'json',
                cache: false
            })
            .done(function(data) {
                that._data = data;
                that.emit('data_loaded');
                that.emit('ajax_end');
            })
            .fail(function(error) {
                that.emit('data_load_error', { error: error });
                that.emit('ajax_end');
            });
        },

        _setUrlQueryString: function() {
            var query = this._getUrlParams();
            window.history.pushState(null, null, window.location.pathname +  (query ? '?' + query : ''));
        },

        _onDataLoaded: function() {
            var data = this._data;

            this._setUrlQueryString();
            
            // Sanitize data
            data.user_auth = !!data.user_auth;
            data.current_page = this._page;
            data.lists = data.lists || [];
            data.items = data.items || [];
            data.items_count = data.items.length;

            // Update user auth
            this._params.userAuth = data.user_auth;

            // Update list
            if (this._list) {
                this._list.setParams(this._params);
                this._list.append(data.items);
            }

            this._pager && this._pager.update(data);
        },

        _onDataLoadError: function(e, data) {
            this._page = this._prevPage;
            console.log(data.error);
        },

        _onPageChange: function(e, data) {
            data = data || {};
            this._prevPage = this._page;
            this._page = data.page || 1;

            this.loadData();
        },

        _abortRequest: function() {
             this._xhr && this._xhr.abort();
        },

        _getUrlParams: function() {
            return (this._page > 1 ? 'page=' + this._page : '');
        },

        _onParams: function(e) {
            e.target.setParams(this._params);
        }

    }
));


});
/* end: ../../desktop.blocks/account-my-subs-controller/account-my-subs-controller.js */
/* begin: ../../desktop.blocks/password-input/password-input.js */
modules.define(
    'password-input',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {
    	var fields;

		provide(BEMDOM.decl(this.name, {
		    onSetMod: {
		        js: {
		            inited: function()
		            {
		            	fields = $('.password-input').find('.input__control');

				    	fields.on('keyup', this._copyText);

		            	this.findBlockInside('button').on('click', this._switch, this);
		            }
		        }
		    },

		    _copyText: function()
		    {
		    	fields.val($(this).val());
		    },

		    _switch: function()
		    {
		    	this.toggleMod('show-pass', true);
		    }
		}));

	}
);
/* end: ../../desktop.blocks/password-input/password-input.js */
/* begin: ../../desktop.blocks/multi-phones/multi-phones.js */
modules.define(
	'multi-phones',
	['i-bem__dom', 'jquery'],
	function(provide, BEMDOM, $) {
		var item;

		provide(BEMDOM.decl(this.name, {
			onSetMod: {
				js: {
					inited: function () {
						addButton = this.findElem('add');
						item = $(this.findElem('item'));

						addButton.on('click', this.addPhone);

						this.bindTo(this.findElem('add'), 'click', this.addPhone);
					}
				}
			},

			addPhone: function()
			{
				var block = $(this).parent('.multi-phones');
				var clone = item.clone();

				clone
					.find('.input__control')
					.removeAttr('placeholder')
					.inputmask('+9 (999) 999-99-99');

				clone.appendTo(block);
			}
		}));
	}
);
/* end: ../../desktop.blocks/multi-phones/multi-phones.js */
/* begin: ../../desktop.blocks/tabs/tabs.js */
/**
 * @module tabs
 */

modules.define('tabs', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {

/**
 * @exports
 * @class tabs
 * @bem
 */
provide(BEMDOM.decl(this.name,  /** @lends tabs.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                var theTabs = this;

                this._boxList = {};
                this._radioGroup = this.findBlockOn(this.elem('tabs-group'), 'radio-group');

                this.elem('box').each(function() {
                    var $this = $(this),
                        tabParams = theTabs.elemParams($this);
                    theTabs._boxList[tabParams.id] = $this;
                });

            }
        }
    },

    _onRadioGroupChange : function() {
        var newVal = this._radioGroup.getVal();

        this.delMod(this.elem('box'), 'selected');
        this.setMod(this._boxList[newVal], 'selected');
    },

    /**
     * Sets active tab by index number
     * @param {Number} index
     * @returns {tabs} this
     */
    changeTab : function(index) {
        this.findBlockInside('radio-group').setVal(index);
        return this;
    },


    getBoxList: function(){
        return this._boxList;
    }


},  /** @lends tabs */{
    live : function() {
        this.liveInitOnBlockInsideEvent('change', 'radio-group', this.prototype._onRadioGroupChange);
    }
}));

});

/* end: ../../desktop.blocks/tabs/tabs.js */
/* begin: ../../libs/bem-components/common.blocks/select/_mode/select_mode_radio-check.js */
/**
 * @module select
 */

modules.define('select', ['jquery'], function(provide, $, Select) {

/**
 * @exports
 * @class select
 * @bem
 */
provide(Select.decl({ modName : 'mode', modVal : 'radio-check' }, /** @lends select.prototype */{
    _updateControl : function() {
        var val = this.getVal(),
            control = this.elem('control');

        if(!control.length) {
            control = $(Select._createControlHTML(this.getName(), val));
            this.dropElemCache('control');
        }

        if(typeof val === 'undefined') {
            // NOTE: because there is a possibility of whole select disabling,
            // "remove" is used instead of "disable"
            control.remove();
        } else {
            control.parent().length || this.domElem.prepend(control);
            control.val(val);
        }
    },

    _updateButton : function() {
        var checkedItem = this._getCheckedItems()[0];

        this._button
            .toggleMod('checked', true, '', !!checkedItem)
            .setText(checkedItem? checkedItem.getText() : this.params.text);
    },

    _onMenuItemClick : function(_, data) {
        data.source === 'pointer' && this.delMod('opened');
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/select/_mode/select_mode_radio-check.js */
/* begin: ../../libs/bem-components/common.blocks/menu/_mode/menu_mode_radio-check.js */
/**
 * @module menu
 */

modules.define('menu', function(provide, Menu) {

/**
 * @exports
 * @class menu
 * @bem
 */
provide(Menu.decl({ modName : 'mode', modVal : 'radio-check' }, /** @lends menu.prototype */{
    /**
     * @override
     */
    _getVal : function() {
        var items = this.getItems(),
            i = 0, item;
        while(item = items[i++])
            if(item.hasMod('checked'))
                return item.getVal();
    },

    /**
     * @override
     */
    _setVal : function(val) {
        var isValUndefined = typeof val === 'undefined',
            wasChanged = false,
            hasVal = false,
            itemsCheckedVals = this.getItems().map(function(item) {
                if(isValUndefined) {
                    item.hasMod('checked') && (wasChanged = true);
                    return false;
                }

                if(!item.isValEq(val)) return false;

                item.hasMod('checked') || (wasChanged = true);
                return hasVal = true;
            });

        if(!isValUndefined && !hasVal) return false;

        this._updateItemsCheckedMod(itemsCheckedVals);

        return wasChanged;
    },

    /**
     * @override
     */
    _onItemClick : function(clickedItem) {
        this.__base.apply(this, arguments);

        this.getItems().forEach(function(item) {
            item === clickedItem?
                item.toggleMod('checked') :
                item.delMod('checked');
        });
        this._isValValid = false;
        this.emit('change');
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/menu/_mode/menu_mode_radio-check.js */
/* begin: ../../libs/bem-components/common.blocks/input/_has-clear/input_has-clear.js */
/**
 * @module input
 */

modules.define('input', function(provide, Input) {

/**
 * @exports
 * @class input
 * @bem
 */
provide(Input.decl({ modName : 'has-clear', modVal : true }, /** @lends input.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);

                this
                    .on('change', this._updateClear)
                    ._updateClear();
            }
        }
    },

    _onClearClick : function() {
        this
            .setVal('', { source : 'clear' })
            .setMod('focused');
    },

    _updateClear : function() {
        this.toggleMod(this.elem('clear'), 'visible', true, !!this._val);
    }
}, /** @lends input */{
    live : function() {
        this.liveBindTo('clear', 'pointerclick', function() {
            this._onClearClick();
        });

        return this.__base.apply(this, arguments);
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/input/_has-clear/input_has-clear.js */
/* begin: ../../libs/bem-components/desktop.blocks/input/_has-clear/input_has-clear.js */
modules.define('input', function(provide, Input) {

provide(Input.decl({ modName : 'has-clear', modVal : true }, {
    _onBoxClick : function() {
        this.hasMod(this.elem('clear'), 'visible') || this.setMod('focused');
    }
}, {
    live : function() {
        this.liveBindTo('box', 'pointerclick', function() {
            this._onBoxClick();
        });

        return this.__base.apply(this, arguments);
    }
}));

});

/* end: ../../libs/bem-components/desktop.blocks/input/_has-clear/input_has-clear.js */
/* begin: ../../desktop.blocks/search_map/search_map.js */
modules.define('search_map',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited' : function() {
                    var self = this;

                    this._data = [];

                    this._map = this.findBlockInside('map');
                    
                    this._map.onGeoObjectClicked = function(e) {
	                    var target = e.originalEvent.target;
                        var mouse = e.originalEvent.domEvent.originalEvent;
                        
                        var position = {
                            x: mouse.pageX,
                            y: mouse.pageY
                        };

                        self._showPopup(position, {}, e);
                    };

                    this._popup = this.findBlockInside('popup');
                    this._popup.on({ modName : 'visible', modVal : 'true' }, this._onPopupVisibile, this);

                    this._button = this.findBlockInside('button').on('click', this._showResultsPopup, this);



                    if(this.params.url){
                        this._loadData();

                        this.on('data_loaded', this._onDataLoaded, this);
                    }
                    





                }
            }
        },

        _showResultsPopup: function(e) {
            e.preventDefault();
        },

        _showPopup: function(position, data, e) {
            //var map = this._map.getMap();
            //console.log(map.geoObjects.getBounds());
            //map.setBounds(map.geoObjects.getBounds());
            
            console.log(position);

            this._popup.setPosition(position.x, position.y).setMod('visible', true);
        },


        _onPopupVisibile: function(e) {
            console.log('Popup visible');
        },


        _loadData: function(){
            var that = this;
            var url = this.params.url;

            $.ajax({
              method: "GET",
              url: url,
              cache: false,
            })
            .done(function(data) {
                that._data = data;

                that.emit('data_loaded');
                that.emit('ajax_end');
            })
            .fail(function(error) {
                console.log(error);
                that.emit('ajax_end');
            });
        },





        _onDataLoaded: function(){
            // вариант 1
            // отправить данные в карту
            // узнать у карты сколько получилось кластеров
            // заполнять все попапы по значениям из кластеров

            // вариант 2 
            // переопределить шаблон для попапов кластеров (пока не понятно как)

            // вариант 3 
            // 

            for (var i = this._data.items.length - 1; i >= 0; i--) {
                console.log(this._data.items[i].map_data);
                this._map.addGeoObject(this._data.items[i].map_data);
            };
        }




























    }));
});

/* end: ../../desktop.blocks/search_map/search_map.js */
/* begin: ../../desktop.blocks/ymaps/ymaps.js */
/**
 * @module ymmap
 * @description Provide ymaps (load if it does not exist).
 */

modules.define(
    'ymaps',
    ['loader_type_js', 'ymaps__config'],
    function(provide, loader, cfg) {

/* global ymaps */

function doProvide() {
    /**
     * @exports
     * @type Function
     */
    provide(ymaps);
}

typeof ymaps !== 'undefined'?
    doProvide() :
    loader(cfg.url, doProvide);
});

/* end: ../../desktop.blocks/ymaps/ymaps.js */
/* begin: ../../desktop.blocks/ymaps/__config/ymaps__config.js */
/**
 * @module ymaps__config
 * @description Configuration for Yandex Map api loader
 */
// TODO: Сделать возможность использовать не только yandex maps
modules.define('ymaps__config', function(provide) {

provide(/** @exports */{
    /**
     * URL for loading YMaps API if it does not exist
     */
    url : '//api-maps.yandex.ru/2.1/?load=package.full&lang=ru_RU&mode=debug'
});

});

/* end: ../../desktop.blocks/ymaps/__config/ymaps__config.js */
/* begin: ../../desktop.blocks/search_map_popup/search_map_popup.js */
modules.define(
    'search_map_popup',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

        provide(BEMDOM.decl(this.name, {
            onSetMod: {
                'js': {
                    'inited': function () {
                        this._close = this.elem('close');
                        this._popup = this.findBlockInside('popup');
                        this.bindTo(this._close, 'click', function(){
                            this._popup.delMod('visible');
                        }, this)
                    }
                }
            }
        }));
});

/* end: ../../desktop.blocks/search_map_popup/search_map_popup.js */
/* begin: ../../libs/bem-components/common.blocks/popup/_target/popup_target_position.js */
/**
 * @module popup
 */

modules.define(
    'popup',
    function(provide, Popup) {

/**
 * @exports
 * @class popup
 * @bem
 */
provide(Popup.decl({ modName : 'target', modVal : 'position' }, /** @lends popup.prototype */{
    beforeSetMod : {
        'visible' : {
            'true' : function() {
                if(!this._position)
                    throw Error('Can\'t show popup without position');
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);
                this._position = null;
            }
        }
    },

    /**
     * Sets position
     * @param {Number} left x-coordinate
     * @param {Number} top y-coordinate
     * @returns {popup} this
     */
    setPosition : function(left, top) {
        this._position = { left : left, top : top };
        return this.redraw();
    },

    /**
     * @override
     */
    _calcTargetDimensions : function() {
        var pos = this._position;

        return {
            left : pos.left,
            top : pos.top,
            width : 0,
            height : 0
        };
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/popup/_target/popup_target_position.js */
/* begin: ../../desktop.blocks/search_map_results/search_map_results.js */
modules.define('search_map_results',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, loader, $) {

        provide(BEMDOM.decl(this.name, {
            onSetMod: {
                'js': {
                    inited: function () {

                    }
                }
            }
        }));
});

/* end: ../../desktop.blocks/search_map_results/search_map_results.js */
/* begin: ../../desktop.blocks/weeks-control/weeks-control.js */
modules.define(
    'weeks-control',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				this._hidden = this.elem('hidden');
				this._minus = this.findBlocksInside('button')[0];
				this._plus = this.findBlocksInside('button')[1];

				this._val = new Number($(this._hidden).val());
				this._text = this.findBlockInside('control-group').elem('text');

				this._minus.on('click', this._onMinus, this);
				this._plus.on('click', this._onPlus, this);

				this._setDisabled();

			}
		}
	},

	_onMinus: function(){
		this._val -= 1;
		this._setContent(this._val);
		this._applyVal();
		this._setDisabled();
	},


	_onPlus: function(){
		this._val += 1;
		this._setContent(this._val);
		this._applyVal();
		this._setDisabled();
	},


	_applyVal: function(){
		$(this._hidden).val(this._val);
	},


	_setContent: function(val){
		$(this._text).html(val + ' ' + this.declOfNum(val, ['неделя', 'недели', 'недель']));
	},


	_setDisabled: function(){

		if(this._val < 2){
			this._minus.setMod('disabled');
		} else {
			this._minus.delMod('disabled');
		}

	},


	declOfNum: function(number, titles) {  
	    cases = [2, 0, 1, 1, 1, 2];  
	    return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];  
	}

}




));



});
/* end: ../../desktop.blocks/weeks-control/weeks-control.js */
/* begin: ../../desktop.blocks/datepicker/datepicker.js */
modules.define(
	'datepicker',
	['i-bem__dom', 'jquery', 'loader_type_js'],
	function(provide, BEMDOM, $, loader) {
		var input;

		provide(BEMDOM.decl(this.name, {
			onSetMod: {
				js: {
					inited: function () {
						input = $('.datepicker__input');

						window.$ = $;
						window.jQuery = $;
						/* ..\..\desktop.blocks\jquery\jquery.datepicker.min.js begin */
/*! jQuery UI - v1.11.4 - 2015-09-06
* http://jqueryui.com
* Includes: core.js, widget.js, mouse.js, position.js, draggable.js, droppable.js, resizable.js, selectable.js, sortable.js, accordion.js, autocomplete.js, button.js, datepicker.js, dialog.js, menu.js, progressbar.js, selectmenu.js, slider.js, spinner.js, tabs.js, tooltip.js, effect.js, effect-blind.js, effect-bounce.js, effect-clip.js, effect-drop.js, effect-explode.js, effect-fade.js, effect-fold.js, effect-highlight.js, effect-puff.js, effect-pulsate.js, effect-scale.js, effect-shake.js, effect-size.js, effect-slide.js, effect-transfer.js
* Copyright 2015 jQuery Foundation and other contributors; Licensed MIT */

(function(e){"function"==typeof define&&define.amd?define(["jquery"],e):e(jQuery)})(function(e){function t(t,s){var n,a,o,r=t.nodeName.toLowerCase();return"area"===r?(n=t.parentNode,a=n.name,t.href&&a&&"map"===n.nodeName.toLowerCase()?(o=e("img[usemap='#"+a+"']")[0],!!o&&i(o)):!1):(/^(input|select|textarea|button|object)$/.test(r)?!t.disabled:"a"===r?t.href||s:s)&&i(t)}function i(t){return e.expr.filters.visible(t)&&!e(t).parents().addBack().filter(function(){return"hidden"===e.css(this,"visibility")}).length}function s(e){for(var t,i;e.length&&e[0]!==document;){if(t=e.css("position"),("absolute"===t||"relative"===t||"fixed"===t)&&(i=parseInt(e.css("zIndex"),10),!isNaN(i)&&0!==i))return i;e=e.parent()}return 0}function n(){this._curInst=null,this._keyEvent=!1,this._disabledInputs=[],this._datepickerShowing=!1,this._inDialog=!1,this._mainDivId="ui-datepicker-div",this._inlineClass="ui-datepicker-inline",this._appendClass="ui-datepicker-append",this._triggerClass="ui-datepicker-trigger",this._dialogClass="ui-datepicker-dialog",this._disableClass="ui-datepicker-disabled",this._unselectableClass="ui-datepicker-unselectable",this._currentClass="ui-datepicker-current-day",this._dayOverClass="ui-datepicker-days-cell-over",this.regional=[],this.regional[""]={closeText:"Done",prevText:"Prev",nextText:"Next",currentText:"Today",monthNames:['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],monthNamesShort:['Янв','Фев','Мар','Апр','Май','Июнь','Июль','Авг','Сент','Окт','Нояб','Дек'],dayNames:['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'],dayNamesShort:['Вс','Пн','Вт','Ср','Чт','Пт','Сб', 'Вс'],dayNamesMin:['Вс','Пн','Вт','Ср','Чт','Пт','Сб','Вс'],weekHeader:"Wk",dateFormat:"mm/dd/yy",firstDay:0,isRTL:!1,showMonthAfterYear:!1,yearSuffix:""},this._defaults={showOn:"focus",showAnim:"fadeIn",showOptions:{},defaultDate:null,appendText:"",buttonText:"...",buttonImage:"",buttonImageOnly:!1,hideIfNoPrevNext:!1,navigationAsDateFormat:!1,gotoCurrent:!1,changeMonth:!1,changeYear:!1,yearRange:"c-10:c+10",showOtherMonths:!1,selectOtherMonths:!1,showWeek:!1,calculateWeek:this.iso8601Week,shortYearCutoff:"+10",minDate:null,maxDate:null,duration:"fast",beforeShowDay:null,beforeShow:null,onSelect:null,onChangeMonthYear:null,onClose:null,numberOfMonths:1,showCurrentAtPos:0,stepMonths:1,stepBigMonths:12,altField:"",altFormat:"",constrainInput:!0,showButtonPanel:!1,autoSize:!1,disabled:!1},e.extend(this._defaults,this.regional[""]),this.regional.en=e.extend(!0,{},this.regional[""]),this.regional["en-US"]=e.extend(!0,{},this.regional.en),this.dpDiv=a(e("<div id='"+this._mainDivId+"' class='ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>"))}function a(t){var i="button, .ui-datepicker-prev, .ui-datepicker-next, .ui-datepicker-calendar td a";return t.delegate(i,"mouseout",function(){e(this).removeClass("ui-state-hover"),-1!==this.className.indexOf("ui-datepicker-prev")&&e(this).removeClass("ui-datepicker-prev-hover"),-1!==this.className.indexOf("ui-datepicker-next")&&e(this).removeClass("ui-datepicker-next-hover")}).delegate(i,"mouseover",o)}function o(){e.datepicker._isDisabledDatepicker(v.inline?v.dpDiv.parent()[0]:v.input[0])||(e(this).parents(".ui-datepicker-calendar").find("a").removeClass("ui-state-hover"),e(this).addClass("ui-state-hover"),-1!==this.className.indexOf("ui-datepicker-prev")&&e(this).addClass("ui-datepicker-prev-hover"),-1!==this.className.indexOf("ui-datepicker-next")&&e(this).addClass("ui-datepicker-next-hover"))}function r(t,i){e.extend(t,i);for(var s in i)null==i[s]&&(t[s]=i[s]);return t}function h(e){return function(){var t=this.element.val();e.apply(this,arguments),this._refresh(),t!==this.element.val()&&this._trigger("change")}}e.ui=e.ui||{},e.extend(e.ui,{version:"1.11.4",keyCode:{BACKSPACE:8,COMMA:188,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,LEFT:37,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SPACE:32,TAB:9,UP:38}}),e.fn.extend({scrollParent:function(t){var i=this.css("position"),s="absolute"===i,n=t?/(auto|scroll|hidden)/:/(auto|scroll)/,a=this.parents().filter(function(){var t=e(this);return s&&"static"===t.css("position")?!1:n.test(t.css("overflow")+t.css("overflow-y")+t.css("overflow-x"))}).eq(0);return"fixed"!==i&&a.length?a:e(this[0].ownerDocument||document)},uniqueId:function(){var e=0;return function(){return this.each(function(){this.id||(this.id="ui-id-"+ ++e)})}}(),removeUniqueId:function(){return this.each(function(){/^ui-id-\d+$/.test(this.id)&&e(this).removeAttr("id")})}}),e.extend(e.expr[":"],{data:e.expr.createPseudo?e.expr.createPseudo(function(t){return function(i){return!!e.data(i,t)}}):function(t,i,s){return!!e.data(t,s[3])},focusable:function(i){return t(i,!isNaN(e.attr(i,"tabindex")))},tabbable:function(i){var s=e.attr(i,"tabindex"),n=isNaN(s);return(n||s>=0)&&t(i,!n)}}),e("<a>").outerWidth(1).jquery||e.each(["Width","Height"],function(t,i){function s(t,i,s,a){return e.each(n,function(){i-=parseFloat(e.css(t,"padding"+this))||0,s&&(i-=parseFloat(e.css(t,"border"+this+"Width"))||0),a&&(i-=parseFloat(e.css(t,"margin"+this))||0)}),i}var n="Width"===i?["Left","Right"]:["Top","Bottom"],a=i.toLowerCase(),o={innerWidth:e.fn.innerWidth,innerHeight:e.fn.innerHeight,outerWidth:e.fn.outerWidth,outerHeight:e.fn.outerHeight};e.fn["inner"+i]=function(t){return void 0===t?o["inner"+i].call(this):this.each(function(){e(this).css(a,s(this,t)+"px")})},e.fn["outer"+i]=function(t,n){return"number"!=typeof t?o["outer"+i].call(this,t):this.each(function(){e(this).css(a,s(this,t,!0,n)+"px")})}}),e.fn.addBack||(e.fn.addBack=function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}),e("<a>").data("a-b","a").removeData("a-b").data("a-b")&&(e.fn.removeData=function(t){return function(i){return arguments.length?t.call(this,e.camelCase(i)):t.call(this)}}(e.fn.removeData)),e.ui.ie=!!/msie [\w.]+/.exec(navigator.userAgent.toLowerCase()),e.fn.extend({focus:function(t){return function(i,s){return"number"==typeof i?this.each(function(){var t=this;setTimeout(function(){e(t).focus(),s&&s.call(t)},i)}):t.apply(this,arguments)}}(e.fn.focus),disableSelection:function(){var e="onselectstart"in document.createElement("div")?"selectstart":"mousedown";return function(){return this.bind(e+".ui-disableSelection",function(e){e.preventDefault()})}}(),enableSelection:function(){return this.unbind(".ui-disableSelection")},zIndex:function(t){if(void 0!==t)return this.css("zIndex",t);if(this.length)for(var i,s,n=e(this[0]);n.length&&n[0]!==document;){if(i=n.css("position"),("absolute"===i||"relative"===i||"fixed"===i)&&(s=parseInt(n.css("zIndex"),10),!isNaN(s)&&0!==s))return s;n=n.parent()}return 0}}),e.ui.plugin={add:function(t,i,s){var n,a=e.ui[t].prototype;for(n in s)a.plugins[n]=a.plugins[n]||[],a.plugins[n].push([i,s[n]])},call:function(e,t,i,s){var n,a=e.plugins[t];if(a&&(s||e.element[0].parentNode&&11!==e.element[0].parentNode.nodeType))for(n=0;a.length>n;n++)e.options[a[n][0]]&&a[n][1].apply(e.element,i)}};var l=0,u=Array.prototype.slice;e.cleanData=function(t){return function(i){var s,n,a;for(a=0;null!=(n=i[a]);a++)try{s=e._data(n,"events"),s&&s.remove&&e(n).triggerHandler("remove")}catch(o){}t(i)}}(e.cleanData),e.widget=function(t,i,s){var n,a,o,r,h={},l=t.split(".")[0];return t=t.split(".")[1],n=l+"-"+t,s||(s=i,i=e.Widget),e.expr[":"][n.toLowerCase()]=function(t){return!!e.data(t,n)},e[l]=e[l]||{},a=e[l][t],o=e[l][t]=function(e,t){return this._createWidget?(arguments.length&&this._createWidget(e,t),void 0):new o(e,t)},e.extend(o,a,{version:s.version,_proto:e.extend({},s),_childConstructors:[]}),r=new i,r.options=e.widget.extend({},r.options),e.each(s,function(t,s){return e.isFunction(s)?(h[t]=function(){var e=function(){return i.prototype[t].apply(this,arguments)},n=function(e){return i.prototype[t].apply(this,e)};return function(){var t,i=this._super,a=this._superApply;return this._super=e,this._superApply=n,t=s.apply(this,arguments),this._super=i,this._superApply=a,t}}(),void 0):(h[t]=s,void 0)}),o.prototype=e.widget.extend(r,{widgetEventPrefix:a?r.widgetEventPrefix||t:t},h,{constructor:o,namespace:l,widgetName:t,widgetFullName:n}),a?(e.each(a._childConstructors,function(t,i){var s=i.prototype;e.widget(s.namespace+"."+s.widgetName,o,i._proto)}),delete a._childConstructors):i._childConstructors.push(o),e.widget.bridge(t,o),o},e.widget.extend=function(t){for(var i,s,n=u.call(arguments,1),a=0,o=n.length;o>a;a++)for(i in n[a])s=n[a][i],n[a].hasOwnProperty(i)&&void 0!==s&&(t[i]=e.isPlainObject(s)?e.isPlainObject(t[i])?e.widget.extend({},t[i],s):e.widget.extend({},s):s);return t},e.widget.bridge=function(t,i){var s=i.prototype.widgetFullName||t;e.fn[t]=function(n){var a="string"==typeof n,o=u.call(arguments,1),r=this;return a?this.each(function(){var i,a=e.data(this,s);return"instance"===n?(r=a,!1):a?e.isFunction(a[n])&&"_"!==n.charAt(0)?(i=a[n].apply(a,o),i!==a&&void 0!==i?(r=i&&i.jquery?r.pushStack(i.get()):i,!1):void 0):e.error("no such method '"+n+"' for "+t+" widget instance"):e.error("cannot call methods on "+t+" prior to initialization; "+"attempted to call method '"+n+"'")}):(o.length&&(n=e.widget.extend.apply(null,[n].concat(o))),this.each(function(){var t=e.data(this,s);t?(t.option(n||{}),t._init&&t._init()):e.data(this,s,new i(n,this))})),r}},e.Widget=function(){},e.Widget._childConstructors=[],e.Widget.prototype={widgetName:"widget",widgetEventPrefix:"",defaultElement:"<div>",options:{disabled:!1,create:null},_createWidget:function(t,i){i=e(i||this.defaultElement||this)[0],this.element=e(i),this.uuid=l++,this.eventNamespace="."+this.widgetName+this.uuid,this.bindings=e(),this.hoverable=e(),this.focusable=e(),i!==this&&(e.data(i,this.widgetFullName,this),this._on(!0,this.element,{remove:function(e){e.target===i&&this.destroy()}}),this.document=e(i.style?i.ownerDocument:i.document||i),this.window=e(this.document[0].defaultView||this.document[0].parentWindow)),this.options=e.widget.extend({},this.options,this._getCreateOptions(),t),this._create(),this._trigger("create",null,this._getCreateEventData()),this._init()},_getCreateOptions:e.noop,_getCreateEventData:e.noop,_create:e.noop,_init:e.noop,destroy:function(){this._destroy(),this.element.unbind(this.eventNamespace).removeData(this.widgetFullName).removeData(e.camelCase(this.widgetFullName)),this.widget().unbind(this.eventNamespace).removeAttr("aria-disabled").removeClass(this.widgetFullName+"-disabled "+"ui-state-disabled"),this.bindings.unbind(this.eventNamespace),this.hoverable.removeClass("ui-state-hover"),this.focusable.removeClass("ui-state-focus")},_destroy:e.noop,widget:function(){return this.element},option:function(t,i){var s,n,a,o=t;if(0===arguments.length)return e.widget.extend({},this.options);if("string"==typeof t)if(o={},s=t.split("."),t=s.shift(),s.length){for(n=o[t]=e.widget.extend({},this.options[t]),a=0;s.length-1>a;a++)n[s[a]]=n[s[a]]||{},n=n[s[a]];if(t=s.pop(),1===arguments.length)return void 0===n[t]?null:n[t];n[t]=i}else{if(1===arguments.length)return void 0===this.options[t]?null:this.options[t];o[t]=i}return this._setOptions(o),this},_setOptions:function(e){var t;for(t in e)this._setOption(t,e[t]);return this},_setOption:function(e,t){return this.options[e]=t,"disabled"===e&&(this.widget().toggleClass(this.widgetFullName+"-disabled",!!t),t&&(this.hoverable.removeClass("ui-state-hover"),this.focusable.removeClass("ui-state-focus"))),this},enable:function(){return this._setOptions({disabled:!1})},disable:function(){return this._setOptions({disabled:!0})},_on:function(t,i,s){var n,a=this;"boolean"!=typeof t&&(s=i,i=t,t=!1),s?(i=n=e(i),this.bindings=this.bindings.add(i)):(s=i,i=this.element,n=this.widget()),e.each(s,function(s,o){function r(){return t||a.options.disabled!==!0&&!e(this).hasClass("ui-state-disabled")?("string"==typeof o?a[o]:o).apply(a,arguments):void 0}"string"!=typeof o&&(r.guid=o.guid=o.guid||r.guid||e.guid++);var h=s.match(/^([\w:-]*)\s*(.*)$/),l=h[1]+a.eventNamespace,u=h[2];u?n.delegate(u,l,r):i.bind(l,r)})},_off:function(t,i){i=(i||"").split(" ").join(this.eventNamespace+" ")+this.eventNamespace,t.unbind(i).undelegate(i),this.bindings=e(this.bindings.not(t).get()),this.focusable=e(this.focusable.not(t).get()),this.hoverable=e(this.hoverable.not(t).get())},_delay:function(e,t){function i(){return("string"==typeof e?s[e]:e).apply(s,arguments)}var s=this;return setTimeout(i,t||0)},_hoverable:function(t){this.hoverable=this.hoverable.add(t),this._on(t,{mouseenter:function(t){e(t.currentTarget).addClass("ui-state-hover")},mouseleave:function(t){e(t.currentTarget).removeClass("ui-state-hover")}})},_focusable:function(t){this.focusable=this.focusable.add(t),this._on(t,{focusin:function(t){e(t.currentTarget).addClass("ui-state-focus")},focusout:function(t){e(t.currentTarget).removeClass("ui-state-focus")}})},_trigger:function(t,i,s){var n,a,o=this.options[t];if(s=s||{},i=e.Event(i),i.type=(t===this.widgetEventPrefix?t:this.widgetEventPrefix+t).toLowerCase(),i.target=this.element[0],a=i.originalEvent)for(n in a)n in i||(i[n]=a[n]);return this.element.trigger(i,s),!(e.isFunction(o)&&o.apply(this.element[0],[i].concat(s))===!1||i.isDefaultPrevented())}},e.each({show:"fadeIn",hide:"fadeOut"},function(t,i){e.Widget.prototype["_"+t]=function(s,n,a){"string"==typeof n&&(n={effect:n});var o,r=n?n===!0||"number"==typeof n?i:n.effect||i:t;n=n||{},"number"==typeof n&&(n={duration:n}),o=!e.isEmptyObject(n),n.complete=a,n.delay&&s.delay(n.delay),o&&e.effects&&e.effects.effect[r]?s[t](n):r!==t&&s[r]?s[r](n.duration,n.easing,a):s.queue(function(i){e(this)[t](),a&&a.call(s[0]),i()})}}),e.widget;var d=!1;e(document).mouseup(function(){d=!1}),e.widget("ui.mouse",{version:"1.11.4",options:{cancel:"input,textarea,button,select,option",distance:1,delay:0},_mouseInit:function(){var t=this;this.element.bind("mousedown."+this.widgetName,function(e){return t._mouseDown(e)}).bind("click."+this.widgetName,function(i){return!0===e.data(i.target,t.widgetName+".preventClickEvent")?(e.removeData(i.target,t.widgetName+".preventClickEvent"),i.stopImmediatePropagation(),!1):void 0}),this.started=!1},_mouseDestroy:function(){this.element.unbind("."+this.widgetName),this._mouseMoveDelegate&&this.document.unbind("mousemove."+this.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate)},_mouseDown:function(t){if(!d){this._mouseMoved=!1,this._mouseStarted&&this._mouseUp(t),this._mouseDownEvent=t;var i=this,s=1===t.which,n="string"==typeof this.options.cancel&&t.target.nodeName?e(t.target).closest(this.options.cancel).length:!1;return s&&!n&&this._mouseCapture(t)?(this.mouseDelayMet=!this.options.delay,this.mouseDelayMet||(this._mouseDelayTimer=setTimeout(function(){i.mouseDelayMet=!0},this.options.delay)),this._mouseDistanceMet(t)&&this._mouseDelayMet(t)&&(this._mouseStarted=this._mouseStart(t)!==!1,!this._mouseStarted)?(t.preventDefault(),!0):(!0===e.data(t.target,this.widgetName+".preventClickEvent")&&e.removeData(t.target,this.widgetName+".preventClickEvent"),this._mouseMoveDelegate=function(e){return i._mouseMove(e)},this._mouseUpDelegate=function(e){return i._mouseUp(e)},this.document.bind("mousemove."+this.widgetName,this._mouseMoveDelegate).bind("mouseup."+this.widgetName,this._mouseUpDelegate),t.preventDefault(),d=!0,!0)):!0}},_mouseMove:function(t){if(this._mouseMoved){if(e.ui.ie&&(!document.documentMode||9>document.documentMode)&&!t.button)return this._mouseUp(t);if(!t.which)return this._mouseUp(t)}return(t.which||t.button)&&(this._mouseMoved=!0),this._mouseStarted?(this._mouseDrag(t),t.preventDefault()):(this._mouseDistanceMet(t)&&this._mouseDelayMet(t)&&(this._mouseStarted=this._mouseStart(this._mouseDownEvent,t)!==!1,this._mouseStarted?this._mouseDrag(t):this._mouseUp(t)),!this._mouseStarted)},_mouseUp:function(t){return this.document.unbind("mousemove."+this.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate),this._mouseStarted&&(this._mouseStarted=!1,t.target===this._mouseDownEvent.target&&e.data(t.target,this.widgetName+".preventClickEvent",!0),this._mouseStop(t)),d=!1,!1},_mouseDistanceMet:function(e){return Math.max(Math.abs(this._mouseDownEvent.pageX-e.pageX),Math.abs(this._mouseDownEvent.pageY-e.pageY))>=this.options.distance},_mouseDelayMet:function(){return this.mouseDelayMet},_mouseStart:function(){},_mouseDrag:function(){},_mouseStop:function(){},_mouseCapture:function(){return!0}}),function(){function t(e,t,i){return[parseFloat(e[0])*(p.test(e[0])?t/100:1),parseFloat(e[1])*(p.test(e[1])?i/100:1)]}function i(t,i){return parseInt(e.css(t,i),10)||0}function s(t){var i=t[0];return 9===i.nodeType?{width:t.width(),height:t.height(),offset:{top:0,left:0}}:e.isWindow(i)?{width:t.width(),height:t.height(),offset:{top:t.scrollTop(),left:t.scrollLeft()}}:i.preventDefault?{width:0,height:0,offset:{top:i.pageY,left:i.pageX}}:{width:t.outerWidth(),height:t.outerHeight(),offset:t.offset()}}e.ui=e.ui||{};var n,a,o=Math.max,r=Math.abs,h=Math.round,l=/left|center|right/,u=/top|center|bottom/,d=/[\+\-]\d+(\.[\d]+)?%?/,c=/^\w+/,p=/%$/,f=e.fn.position;e.position={scrollbarWidth:function(){if(void 0!==n)return n;var t,i,s=e("<div style='display:block;position:absolute;width:50px;height:50px;overflow:hidden;'><div style='height:100px;width:auto;'></div></div>"),a=s.children()[0];return e("body").append(s),t=a.offsetWidth,s.css("overflow","scroll"),i=a.offsetWidth,t===i&&(i=s[0].clientWidth),s.remove(),n=t-i},getScrollInfo:function(t){var i=t.isWindow||t.isDocument?"":t.element.css("overflow-x"),s=t.isWindow||t.isDocument?"":t.element.css("overflow-y"),n="scroll"===i||"auto"===i&&t.width<t.element[0].scrollWidth,a="scroll"===s||"auto"===s&&t.height<t.element[0].scrollHeight;return{width:a?e.position.scrollbarWidth():0,height:n?e.position.scrollbarWidth():0}},getWithinInfo:function(t){var i=e(t||window),s=e.isWindow(i[0]),n=!!i[0]&&9===i[0].nodeType;return{element:i,isWindow:s,isDocument:n,offset:i.offset()||{left:0,top:0},scrollLeft:i.scrollLeft(),scrollTop:i.scrollTop(),width:s||n?i.width():i.outerWidth(),height:s||n?i.height():i.outerHeight()}}},e.fn.position=function(n){if(!n||!n.of)return f.apply(this,arguments);n=e.extend({},n);var p,m,g,v,y,b,_=e(n.of),x=e.position.getWithinInfo(n.within),w=e.position.getScrollInfo(x),k=(n.collision||"flip").split(" "),T={};return b=s(_),_[0].preventDefault&&(n.at="left top"),m=b.width,g=b.height,v=b.offset,y=e.extend({},v),e.each(["my","at"],function(){var e,t,i=(n[this]||"").split(" ");1===i.length&&(i=l.test(i[0])?i.concat(["center"]):u.test(i[0])?["center"].concat(i):["center","center"]),i[0]=l.test(i[0])?i[0]:"center",i[1]=u.test(i[1])?i[1]:"center",e=d.exec(i[0]),t=d.exec(i[1]),T[this]=[e?e[0]:0,t?t[0]:0],n[this]=[c.exec(i[0])[0],c.exec(i[1])[0]]}),1===k.length&&(k[1]=k[0]),"right"===n.at[0]?y.left+=m:"center"===n.at[0]&&(y.left+=m/2),"bottom"===n.at[1]?y.top+=g:"center"===n.at[1]&&(y.top+=g/2),p=t(T.at,m,g),y.left+=p[0],y.top+=p[1],this.each(function(){var s,l,u=e(this),d=u.outerWidth(),c=u.outerHeight(),f=i(this,"marginLeft"),b=i(this,"marginTop"),D=d+f+i(this,"marginRight")+w.width,S=c+b+i(this,"marginBottom")+w.height,M=e.extend({},y),C=t(T.my,u.outerWidth(),u.outerHeight());"right"===n.my[0]?M.left-=d:"center"===n.my[0]&&(M.left-=d/2),"bottom"===n.my[1]?M.top-=c:"center"===n.my[1]&&(M.top-=c/2),M.left+=C[0],M.top+=C[1],a||(M.left=h(M.left),M.top=h(M.top)),s={marginLeft:f,marginTop:b},e.each(["left","top"],function(t,i){e.ui.position[k[t]]&&e.ui.position[k[t]][i](M,{targetWidth:m,targetHeight:g,elemWidth:d,elemHeight:c,collisionPosition:s,collisionWidth:D,collisionHeight:S,offset:[p[0]+C[0],p[1]+C[1]],my:n.my,at:n.at,within:x,elem:u})}),n.using&&(l=function(e){var t=v.left-M.left,i=t+m-d,s=v.top-M.top,a=s+g-c,h={target:{element:_,left:v.left,top:v.top,width:m,height:g},element:{element:u,left:M.left,top:M.top,width:d,height:c},horizontal:0>i?"left":t>0?"right":"center",vertical:0>a?"top":s>0?"bottom":"middle"};d>m&&m>r(t+i)&&(h.horizontal="center"),c>g&&g>r(s+a)&&(h.vertical="middle"),h.important=o(r(t),r(i))>o(r(s),r(a))?"horizontal":"vertical",n.using.call(this,e,h)}),u.offset(e.extend(M,{using:l}))})},e.ui.position={fit:{left:function(e,t){var i,s=t.within,n=s.isWindow?s.scrollLeft:s.offset.left,a=s.width,r=e.left-t.collisionPosition.marginLeft,h=n-r,l=r+t.collisionWidth-a-n;t.collisionWidth>a?h>0&&0>=l?(i=e.left+h+t.collisionWidth-a-n,e.left+=h-i):e.left=l>0&&0>=h?n:h>l?n+a-t.collisionWidth:n:h>0?e.left+=h:l>0?e.left-=l:e.left=o(e.left-r,e.left)},top:function(e,t){var i,s=t.within,n=s.isWindow?s.scrollTop:s.offset.top,a=t.within.height,r=e.top-t.collisionPosition.marginTop,h=n-r,l=r+t.collisionHeight-a-n;t.collisionHeight>a?h>0&&0>=l?(i=e.top+h+t.collisionHeight-a-n,e.top+=h-i):e.top=l>0&&0>=h?n:h>l?n+a-t.collisionHeight:n:h>0?e.top+=h:l>0?e.top-=l:e.top=o(e.top-r,e.top)}},flip:{left:function(e,t){var i,s,n=t.within,a=n.offset.left+n.scrollLeft,o=n.width,h=n.isWindow?n.scrollLeft:n.offset.left,l=e.left-t.collisionPosition.marginLeft,u=l-h,d=l+t.collisionWidth-o-h,c="left"===t.my[0]?-t.elemWidth:"right"===t.my[0]?t.elemWidth:0,p="left"===t.at[0]?t.targetWidth:"right"===t.at[0]?-t.targetWidth:0,f=-2*t.offset[0];0>u?(i=e.left+c+p+f+t.collisionWidth-o-a,(0>i||r(u)>i)&&(e.left+=c+p+f)):d>0&&(s=e.left-t.collisionPosition.marginLeft+c+p+f-h,(s>0||d>r(s))&&(e.left+=c+p+f))},top:function(e,t){var i,s,n=t.within,a=n.offset.top+n.scrollTop,o=n.height,h=n.isWindow?n.scrollTop:n.offset.top,l=e.top-t.collisionPosition.marginTop,u=l-h,d=l+t.collisionHeight-o-h,c="top"===t.my[1],p=c?-t.elemHeight:"bottom"===t.my[1]?t.elemHeight:0,f="top"===t.at[1]?t.targetHeight:"bottom"===t.at[1]?-t.targetHeight:0,m=-2*t.offset[1];0>u?(s=e.top+p+f+m+t.collisionHeight-o-a,(0>s||r(u)>s)&&(e.top+=p+f+m)):d>0&&(i=e.top-t.collisionPosition.marginTop+p+f+m-h,(i>0||d>r(i))&&(e.top+=p+f+m))}},flipfit:{left:function(){e.ui.position.flip.left.apply(this,arguments),e.ui.position.fit.left.apply(this,arguments)},top:function(){e.ui.position.flip.top.apply(this,arguments),e.ui.position.fit.top.apply(this,arguments)}}},function(){var t,i,s,n,o,r=document.getElementsByTagName("body")[0],h=document.createElement("div");t=document.createElement(r?"div":"body"),s={visibility:"hidden",width:0,height:0,border:0,margin:0,background:"none"},r&&e.extend(s,{position:"absolute",left:"-1000px",top:"-1000px"});for(o in s)t.style[o]=s[o];t.appendChild(h),i=r||document.documentElement,i.insertBefore(t,i.firstChild),h.style.cssText="position: absolute; left: 10.7432222px;",n=e(h).offset().left,a=n>10&&11>n,t.innerHTML="",i.removeChild(t)}()}(),e.ui.position,e.widget("ui.draggable",e.ui.mouse,{version:"1.11.4",widgetEventPrefix:"drag",options:{addClasses:!0,appendTo:"parent",axis:!1,connectToSortable:!1,containment:!1,cursor:"auto",cursorAt:!1,grid:!1,handle:!1,helper:"original",iframeFix:!1,opacity:!1,refreshPositions:!1,revert:!1,revertDuration:500,scope:"default",scroll:!0,scrollSensitivity:20,scrollSpeed:20,snap:!1,snapMode:"both",snapTolerance:20,stack:!1,zIndex:!1,drag:null,start:null,stop:null},_create:function(){"original"===this.options.helper&&this._setPositionRelative(),this.options.addClasses&&this.element.addClass("ui-draggable"),this.options.disabled&&this.element.addClass("ui-draggable-disabled"),this._setHandleClassName(),this._mouseInit()},_setOption:function(e,t){this._super(e,t),"handle"===e&&(this._removeHandleClassName(),this._setHandleClassName())},_destroy:function(){return(this.helper||this.element).is(".ui-draggable-dragging")?(this.destroyOnClear=!0,void 0):(this.element.removeClass("ui-draggable ui-draggable-dragging ui-draggable-disabled"),this._removeHandleClassName(),this._mouseDestroy(),void 0)},_mouseCapture:function(t){var i=this.options;return this._blurActiveElement(t),this.helper||i.disabled||e(t.target).closest(".ui-resizable-handle").length>0?!1:(this.handle=this._getHandle(t),this.handle?(this._blockFrames(i.iframeFix===!0?"iframe":i.iframeFix),!0):!1)},_blockFrames:function(t){this.iframeBlocks=this.document.find(t).map(function(){var t=e(this);return e("<div>").css("position","absolute").appendTo(t.parent()).outerWidth(t.outerWidth()).outerHeight(t.outerHeight()).offset(t.offset())[0]})},_unblockFrames:function(){this.iframeBlocks&&(this.iframeBlocks.remove(),delete this.iframeBlocks)},_blurActiveElement:function(t){var i=this.document[0];if(this.handleElement.is(t.target))try{i.activeElement&&"body"!==i.activeElement.nodeName.toLowerCase()&&e(i.activeElement).blur()}catch(s){}},_mouseStart:function(t){var i=this.options;return this.helper=this._createHelper(t),this.helper.addClass("ui-draggable-dragging"),this._cacheHelperProportions(),e.ui.ddmanager&&(e.ui.ddmanager.current=this),this._cacheMargins(),this.cssPosition=this.helper.css("position"),this.scrollParent=this.helper.scrollParent(!0),this.offsetParent=this.helper.offsetParent(),this.hasFixedAncestor=this.helper.parents().filter(function(){return"fixed"===e(this).css("position")}).length>0,this.positionAbs=this.element.offset(),this._refreshOffsets(t),this.originalPosition=this.position=this._generatePosition(t,!1),this.originalPageX=t.pageX,this.originalPageY=t.pageY,i.cursorAt&&this._adjustOffsetFromHelper(i.cursorAt),this._setContainment(),this._trigger("start",t)===!1?(this._clear(),!1):(this._cacheHelperProportions(),e.ui.ddmanager&&!i.dropBehaviour&&e.ui.ddmanager.prepareOffsets(this,t),this._normalizeRightBottom(),this._mouseDrag(t,!0),e.ui.ddmanager&&e.ui.ddmanager.dragStart(this,t),!0)},_refreshOffsets:function(e){this.offset={top:this.positionAbs.top-this.margins.top,left:this.positionAbs.left-this.margins.left,scroll:!1,parent:this._getParentOffset(),relative:this._getRelativeOffset()},this.offset.click={left:e.pageX-this.offset.left,top:e.pageY-this.offset.top}},_mouseDrag:function(t,i){if(this.hasFixedAncestor&&(this.offset.parent=this._getParentOffset()),this.position=this._generatePosition(t,!0),this.positionAbs=this._convertPositionTo("absolute"),!i){var s=this._uiHash();if(this._trigger("drag",t,s)===!1)return this._mouseUp({}),!1;this.position=s.position}return this.helper[0].style.left=this.position.left+"px",this.helper[0].style.top=this.position.top+"px",e.ui.ddmanager&&e.ui.ddmanager.drag(this,t),!1},_mouseStop:function(t){var i=this,s=!1;return e.ui.ddmanager&&!this.options.dropBehaviour&&(s=e.ui.ddmanager.drop(this,t)),this.dropped&&(s=this.dropped,this.dropped=!1),"invalid"===this.options.revert&&!s||"valid"===this.options.revert&&s||this.options.revert===!0||e.isFunction(this.options.revert)&&this.options.revert.call(this.element,s)?e(this.helper).animate(this.originalPosition,parseInt(this.options.revertDuration,10),function(){i._trigger("stop",t)!==!1&&i._clear()}):this._trigger("stop",t)!==!1&&this._clear(),!1},_mouseUp:function(t){return this._unblockFrames(),e.ui.ddmanager&&e.ui.ddmanager.dragStop(this,t),this.handleElement.is(t.target)&&this.element.focus(),e.ui.mouse.prototype._mouseUp.call(this,t)},cancel:function(){return this.helper.is(".ui-draggable-dragging")?this._mouseUp({}):this._clear(),this},_getHandle:function(t){return this.options.handle?!!e(t.target).closest(this.element.find(this.options.handle)).length:!0},_setHandleClassName:function(){this.handleElement=this.options.handle?this.element.find(this.options.handle):this.element,this.handleElement.addClass("ui-draggable-handle")},_removeHandleClassName:function(){this.handleElement.removeClass("ui-draggable-handle")},_createHelper:function(t){var i=this.options,s=e.isFunction(i.helper),n=s?e(i.helper.apply(this.element[0],[t])):"clone"===i.helper?this.element.clone().removeAttr("id"):this.element;return n.parents("body").length||n.appendTo("parent"===i.appendTo?this.element[0].parentNode:i.appendTo),s&&n[0]===this.element[0]&&this._setPositionRelative(),n[0]===this.element[0]||/(fixed|absolute)/.test(n.css("position"))||n.css("position","absolute"),n},_setPositionRelative:function(){/^(?:r|a|f)/.test(this.element.css("position"))||(this.element[0].style.position="relative")},_adjustOffsetFromHelper:function(t){"string"==typeof t&&(t=t.split(" ")),e.isArray(t)&&(t={left:+t[0],top:+t[1]||0}),"left"in t&&(this.offset.click.left=t.left+this.margins.left),"right"in t&&(this.offset.click.left=this.helperProportions.width-t.right+this.margins.left),"top"in t&&(this.offset.click.top=t.top+this.margins.top),"bottom"in t&&(this.offset.click.top=this.helperProportions.height-t.bottom+this.margins.top)},_isRootNode:function(e){return/(html|body)/i.test(e.tagName)||e===this.document[0]},_getParentOffset:function(){var t=this.offsetParent.offset(),i=this.document[0];return"absolute"===this.cssPosition&&this.scrollParent[0]!==i&&e.contains(this.scrollParent[0],this.offsetParent[0])&&(t.left+=this.scrollParent.scrollLeft(),t.top+=this.scrollParent.scrollTop()),this._isRootNode(this.offsetParent[0])&&(t={top:0,left:0}),{top:t.top+(parseInt(this.offsetParent.css("borderTopWidth"),10)||0),left:t.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}},_getRelativeOffset:function(){if("relative"!==this.cssPosition)return{top:0,left:0};var e=this.element.position(),t=this._isRootNode(this.scrollParent[0]);return{top:e.top-(parseInt(this.helper.css("top"),10)||0)+(t?0:this.scrollParent.scrollTop()),left:e.left-(parseInt(this.helper.css("left"),10)||0)+(t?0:this.scrollParent.scrollLeft())}},_cacheMargins:function(){this.margins={left:parseInt(this.element.css("marginLeft"),10)||0,top:parseInt(this.element.css("marginTop"),10)||0,right:parseInt(this.element.css("marginRight"),10)||0,bottom:parseInt(this.element.css("marginBottom"),10)||0}},_cacheHelperProportions:function(){this.helperProportions={width:this.helper.outerWidth(),height:this.helper.outerHeight()}},_setContainment:function(){var t,i,s,n=this.options,a=this.document[0];return this.relativeContainer=null,n.containment?"window"===n.containment?(this.containment=[e(window).scrollLeft()-this.offset.relative.left-this.offset.parent.left,e(window).scrollTop()-this.offset.relative.top-this.offset.parent.top,e(window).scrollLeft()+e(window).width()-this.helperProportions.width-this.margins.left,e(window).scrollTop()+(e(window).height()||a.body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top],void 0):"document"===n.containment?(this.containment=[0,0,e(a).width()-this.helperProportions.width-this.margins.left,(e(a).height()||a.body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top],void 0):n.containment.constructor===Array?(this.containment=n.containment,void 0):("parent"===n.containment&&(n.containment=this.helper[0].parentNode),i=e(n.containment),s=i[0],s&&(t=/(scroll|auto)/.test(i.css("overflow")),this.containment=[(parseInt(i.css("borderLeftWidth"),10)||0)+(parseInt(i.css("paddingLeft"),10)||0),(parseInt(i.css("borderTopWidth"),10)||0)+(parseInt(i.css("paddingTop"),10)||0),(t?Math.max(s.scrollWidth,s.offsetWidth):s.offsetWidth)-(parseInt(i.css("borderRightWidth"),10)||0)-(parseInt(i.css("paddingRight"),10)||0)-this.helperProportions.width-this.margins.left-this.margins.right,(t?Math.max(s.scrollHeight,s.offsetHeight):s.offsetHeight)-(parseInt(i.css("borderBottomWidth"),10)||0)-(parseInt(i.css("paddingBottom"),10)||0)-this.helperProportions.height-this.margins.top-this.margins.bottom],this.relativeContainer=i),void 0):(this.containment=null,void 0)},_convertPositionTo:function(e,t){t||(t=this.position);var i="absolute"===e?1:-1,s=this._isRootNode(this.scrollParent[0]);return{top:t.top+this.offset.relative.top*i+this.offset.parent.top*i-("fixed"===this.cssPosition?-this.offset.scroll.top:s?0:this.offset.scroll.top)*i,left:t.left+this.offset.relative.left*i+this.offset.parent.left*i-("fixed"===this.cssPosition?-this.offset.scroll.left:s?0:this.offset.scroll.left)*i}},_generatePosition:function(e,t){var i,s,n,a,o=this.options,r=this._isRootNode(this.scrollParent[0]),h=e.pageX,l=e.pageY;return r&&this.offset.scroll||(this.offset.scroll={top:this.scrollParent.scrollTop(),left:this.scrollParent.scrollLeft()}),t&&(this.containment&&(this.relativeContainer?(s=this.relativeContainer.offset(),i=[this.containment[0]+s.left,this.containment[1]+s.top,this.containment[2]+s.left,this.containment[3]+s.top]):i=this.containment,e.pageX-this.offset.click.left<i[0]&&(h=i[0]+this.offset.click.left),e.pageY-this.offset.click.top<i[1]&&(l=i[1]+this.offset.click.top),e.pageX-this.offset.click.left>i[2]&&(h=i[2]+this.offset.click.left),e.pageY-this.offset.click.top>i[3]&&(l=i[3]+this.offset.click.top)),o.grid&&(n=o.grid[1]?this.originalPageY+Math.round((l-this.originalPageY)/o.grid[1])*o.grid[1]:this.originalPageY,l=i?n-this.offset.click.top>=i[1]||n-this.offset.click.top>i[3]?n:n-this.offset.click.top>=i[1]?n-o.grid[1]:n+o.grid[1]:n,a=o.grid[0]?this.originalPageX+Math.round((h-this.originalPageX)/o.grid[0])*o.grid[0]:this.originalPageX,h=i?a-this.offset.click.left>=i[0]||a-this.offset.click.left>i[2]?a:a-this.offset.click.left>=i[0]?a-o.grid[0]:a+o.grid[0]:a),"y"===o.axis&&(h=this.originalPageX),"x"===o.axis&&(l=this.originalPageY)),{top:l-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+("fixed"===this.cssPosition?-this.offset.scroll.top:r?0:this.offset.scroll.top),left:h-this.offset.click.left-this.offset.relative.left-this.offset.parent.left+("fixed"===this.cssPosition?-this.offset.scroll.left:r?0:this.offset.scroll.left)}
},_clear:function(){this.helper.removeClass("ui-draggable-dragging"),this.helper[0]===this.element[0]||this.cancelHelperRemoval||this.helper.remove(),this.helper=null,this.cancelHelperRemoval=!1,this.destroyOnClear&&this.destroy()},_normalizeRightBottom:function(){"y"!==this.options.axis&&"auto"!==this.helper.css("right")&&(this.helper.width(this.helper.width()),this.helper.css("right","auto")),"x"!==this.options.axis&&"auto"!==this.helper.css("bottom")&&(this.helper.height(this.helper.height()),this.helper.css("bottom","auto"))},_trigger:function(t,i,s){return s=s||this._uiHash(),e.ui.plugin.call(this,t,[i,s,this],!0),/^(drag|start|stop)/.test(t)&&(this.positionAbs=this._convertPositionTo("absolute"),s.offset=this.positionAbs),e.Widget.prototype._trigger.call(this,t,i,s)},plugins:{},_uiHash:function(){return{helper:this.helper,position:this.position,originalPosition:this.originalPosition,offset:this.positionAbs}}}),e.ui.plugin.add("draggable","connectToSortable",{start:function(t,i,s){var n=e.extend({},i,{item:s.element});s.sortables=[],e(s.options.connectToSortable).each(function(){var i=e(this).sortable("instance");i&&!i.options.disabled&&(s.sortables.push(i),i.refreshPositions(),i._trigger("activate",t,n))})},stop:function(t,i,s){var n=e.extend({},i,{item:s.element});s.cancelHelperRemoval=!1,e.each(s.sortables,function(){var e=this;e.isOver?(e.isOver=0,s.cancelHelperRemoval=!0,e.cancelHelperRemoval=!1,e._storedCSS={position:e.placeholder.css("position"),top:e.placeholder.css("top"),left:e.placeholder.css("left")},e._mouseStop(t),e.options.helper=e.options._helper):(e.cancelHelperRemoval=!0,e._trigger("deactivate",t,n))})},drag:function(t,i,s){e.each(s.sortables,function(){var n=!1,a=this;a.positionAbs=s.positionAbs,a.helperProportions=s.helperProportions,a.offset.click=s.offset.click,a._intersectsWith(a.containerCache)&&(n=!0,e.each(s.sortables,function(){return this.positionAbs=s.positionAbs,this.helperProportions=s.helperProportions,this.offset.click=s.offset.click,this!==a&&this._intersectsWith(this.containerCache)&&e.contains(a.element[0],this.element[0])&&(n=!1),n})),n?(a.isOver||(a.isOver=1,s._parent=i.helper.parent(),a.currentItem=i.helper.appendTo(a.element).data("ui-sortable-item",!0),a.options._helper=a.options.helper,a.options.helper=function(){return i.helper[0]},t.target=a.currentItem[0],a._mouseCapture(t,!0),a._mouseStart(t,!0,!0),a.offset.click.top=s.offset.click.top,a.offset.click.left=s.offset.click.left,a.offset.parent.left-=s.offset.parent.left-a.offset.parent.left,a.offset.parent.top-=s.offset.parent.top-a.offset.parent.top,s._trigger("toSortable",t),s.dropped=a.element,e.each(s.sortables,function(){this.refreshPositions()}),s.currentItem=s.element,a.fromOutside=s),a.currentItem&&(a._mouseDrag(t),i.position=a.position)):a.isOver&&(a.isOver=0,a.cancelHelperRemoval=!0,a.options._revert=a.options.revert,a.options.revert=!1,a._trigger("out",t,a._uiHash(a)),a._mouseStop(t,!0),a.options.revert=a.options._revert,a.options.helper=a.options._helper,a.placeholder&&a.placeholder.remove(),i.helper.appendTo(s._parent),s._refreshOffsets(t),i.position=s._generatePosition(t,!0),s._trigger("fromSortable",t),s.dropped=!1,e.each(s.sortables,function(){this.refreshPositions()}))})}}),e.ui.plugin.add("draggable","cursor",{start:function(t,i,s){var n=e("body"),a=s.options;n.css("cursor")&&(a._cursor=n.css("cursor")),n.css("cursor",a.cursor)},stop:function(t,i,s){var n=s.options;n._cursor&&e("body").css("cursor",n._cursor)}}),e.ui.plugin.add("draggable","opacity",{start:function(t,i,s){var n=e(i.helper),a=s.options;n.css("opacity")&&(a._opacity=n.css("opacity")),n.css("opacity",a.opacity)},stop:function(t,i,s){var n=s.options;n._opacity&&e(i.helper).css("opacity",n._opacity)}}),e.ui.plugin.add("draggable","scroll",{start:function(e,t,i){i.scrollParentNotHidden||(i.scrollParentNotHidden=i.helper.scrollParent(!1)),i.scrollParentNotHidden[0]!==i.document[0]&&"HTML"!==i.scrollParentNotHidden[0].tagName&&(i.overflowOffset=i.scrollParentNotHidden.offset())},drag:function(t,i,s){var n=s.options,a=!1,o=s.scrollParentNotHidden[0],r=s.document[0];o!==r&&"HTML"!==o.tagName?(n.axis&&"x"===n.axis||(s.overflowOffset.top+o.offsetHeight-t.pageY<n.scrollSensitivity?o.scrollTop=a=o.scrollTop+n.scrollSpeed:t.pageY-s.overflowOffset.top<n.scrollSensitivity&&(o.scrollTop=a=o.scrollTop-n.scrollSpeed)),n.axis&&"y"===n.axis||(s.overflowOffset.left+o.offsetWidth-t.pageX<n.scrollSensitivity?o.scrollLeft=a=o.scrollLeft+n.scrollSpeed:t.pageX-s.overflowOffset.left<n.scrollSensitivity&&(o.scrollLeft=a=o.scrollLeft-n.scrollSpeed))):(n.axis&&"x"===n.axis||(t.pageY-e(r).scrollTop()<n.scrollSensitivity?a=e(r).scrollTop(e(r).scrollTop()-n.scrollSpeed):e(window).height()-(t.pageY-e(r).scrollTop())<n.scrollSensitivity&&(a=e(r).scrollTop(e(r).scrollTop()+n.scrollSpeed))),n.axis&&"y"===n.axis||(t.pageX-e(r).scrollLeft()<n.scrollSensitivity?a=e(r).scrollLeft(e(r).scrollLeft()-n.scrollSpeed):e(window).width()-(t.pageX-e(r).scrollLeft())<n.scrollSensitivity&&(a=e(r).scrollLeft(e(r).scrollLeft()+n.scrollSpeed)))),a!==!1&&e.ui.ddmanager&&!n.dropBehaviour&&e.ui.ddmanager.prepareOffsets(s,t)}}),e.ui.plugin.add("draggable","snap",{start:function(t,i,s){var n=s.options;s.snapElements=[],e(n.snap.constructor!==String?n.snap.items||":data(ui-draggable)":n.snap).each(function(){var t=e(this),i=t.offset();this!==s.element[0]&&s.snapElements.push({item:this,width:t.outerWidth(),height:t.outerHeight(),top:i.top,left:i.left})})},drag:function(t,i,s){var n,a,o,r,h,l,u,d,c,p,f=s.options,m=f.snapTolerance,g=i.offset.left,v=g+s.helperProportions.width,y=i.offset.top,b=y+s.helperProportions.height;for(c=s.snapElements.length-1;c>=0;c--)h=s.snapElements[c].left-s.margins.left,l=h+s.snapElements[c].width,u=s.snapElements[c].top-s.margins.top,d=u+s.snapElements[c].height,h-m>v||g>l+m||u-m>b||y>d+m||!e.contains(s.snapElements[c].item.ownerDocument,s.snapElements[c].item)?(s.snapElements[c].snapping&&s.options.snap.release&&s.options.snap.release.call(s.element,t,e.extend(s._uiHash(),{snapItem:s.snapElements[c].item})),s.snapElements[c].snapping=!1):("inner"!==f.snapMode&&(n=m>=Math.abs(u-b),a=m>=Math.abs(d-y),o=m>=Math.abs(h-v),r=m>=Math.abs(l-g),n&&(i.position.top=s._convertPositionTo("relative",{top:u-s.helperProportions.height,left:0}).top),a&&(i.position.top=s._convertPositionTo("relative",{top:d,left:0}).top),o&&(i.position.left=s._convertPositionTo("relative",{top:0,left:h-s.helperProportions.width}).left),r&&(i.position.left=s._convertPositionTo("relative",{top:0,left:l}).left)),p=n||a||o||r,"outer"!==f.snapMode&&(n=m>=Math.abs(u-y),a=m>=Math.abs(d-b),o=m>=Math.abs(h-g),r=m>=Math.abs(l-v),n&&(i.position.top=s._convertPositionTo("relative",{top:u,left:0}).top),a&&(i.position.top=s._convertPositionTo("relative",{top:d-s.helperProportions.height,left:0}).top),o&&(i.position.left=s._convertPositionTo("relative",{top:0,left:h}).left),r&&(i.position.left=s._convertPositionTo("relative",{top:0,left:l-s.helperProportions.width}).left)),!s.snapElements[c].snapping&&(n||a||o||r||p)&&s.options.snap.snap&&s.options.snap.snap.call(s.element,t,e.extend(s._uiHash(),{snapItem:s.snapElements[c].item})),s.snapElements[c].snapping=n||a||o||r||p)}}),e.ui.plugin.add("draggable","stack",{start:function(t,i,s){var n,a=s.options,o=e.makeArray(e(a.stack)).sort(function(t,i){return(parseInt(e(t).css("zIndex"),10)||0)-(parseInt(e(i).css("zIndex"),10)||0)});o.length&&(n=parseInt(e(o[0]).css("zIndex"),10)||0,e(o).each(function(t){e(this).css("zIndex",n+t)}),this.css("zIndex",n+o.length))}}),e.ui.plugin.add("draggable","zIndex",{start:function(t,i,s){var n=e(i.helper),a=s.options;n.css("zIndex")&&(a._zIndex=n.css("zIndex")),n.css("zIndex",a.zIndex)},stop:function(t,i,s){var n=s.options;n._zIndex&&e(i.helper).css("zIndex",n._zIndex)}}),e.ui.draggable,e.widget("ui.droppable",{version:"1.11.4",widgetEventPrefix:"drop",options:{accept:"*",activeClass:!1,addClasses:!0,greedy:!1,hoverClass:!1,scope:"default",tolerance:"intersect",activate:null,deactivate:null,drop:null,out:null,over:null},_create:function(){var t,i=this.options,s=i.accept;this.isover=!1,this.isout=!0,this.accept=e.isFunction(s)?s:function(e){return e.is(s)},this.proportions=function(){return arguments.length?(t=arguments[0],void 0):t?t:t={width:this.element[0].offsetWidth,height:this.element[0].offsetHeight}},this._addToManager(i.scope),i.addClasses&&this.element.addClass("ui-droppable")},_addToManager:function(t){e.ui.ddmanager.droppables[t]=e.ui.ddmanager.droppables[t]||[],e.ui.ddmanager.droppables[t].push(this)},_splice:function(e){for(var t=0;e.length>t;t++)e[t]===this&&e.splice(t,1)},_destroy:function(){var t=e.ui.ddmanager.droppables[this.options.scope];this._splice(t),this.element.removeClass("ui-droppable ui-droppable-disabled")},_setOption:function(t,i){if("accept"===t)this.accept=e.isFunction(i)?i:function(e){return e.is(i)};else if("scope"===t){var s=e.ui.ddmanager.droppables[this.options.scope];this._splice(s),this._addToManager(i)}this._super(t,i)},_activate:function(t){var i=e.ui.ddmanager.current;this.options.activeClass&&this.element.addClass(this.options.activeClass),i&&this._trigger("activate",t,this.ui(i))},_deactivate:function(t){var i=e.ui.ddmanager.current;this.options.activeClass&&this.element.removeClass(this.options.activeClass),i&&this._trigger("deactivate",t,this.ui(i))},_over:function(t){var i=e.ui.ddmanager.current;i&&(i.currentItem||i.element)[0]!==this.element[0]&&this.accept.call(this.element[0],i.currentItem||i.element)&&(this.options.hoverClass&&this.element.addClass(this.options.hoverClass),this._trigger("over",t,this.ui(i)))},_out:function(t){var i=e.ui.ddmanager.current;i&&(i.currentItem||i.element)[0]!==this.element[0]&&this.accept.call(this.element[0],i.currentItem||i.element)&&(this.options.hoverClass&&this.element.removeClass(this.options.hoverClass),this._trigger("out",t,this.ui(i)))},_drop:function(t,i){var s=i||e.ui.ddmanager.current,n=!1;return s&&(s.currentItem||s.element)[0]!==this.element[0]?(this.element.find(":data(ui-droppable)").not(".ui-draggable-dragging").each(function(){var i=e(this).droppable("instance");return i.options.greedy&&!i.options.disabled&&i.options.scope===s.options.scope&&i.accept.call(i.element[0],s.currentItem||s.element)&&e.ui.intersect(s,e.extend(i,{offset:i.element.offset()}),i.options.tolerance,t)?(n=!0,!1):void 0}),n?!1:this.accept.call(this.element[0],s.currentItem||s.element)?(this.options.activeClass&&this.element.removeClass(this.options.activeClass),this.options.hoverClass&&this.element.removeClass(this.options.hoverClass),this._trigger("drop",t,this.ui(s)),this.element):!1):!1},ui:function(e){return{draggable:e.currentItem||e.element,helper:e.helper,position:e.position,offset:e.positionAbs}}}),e.ui.intersect=function(){function e(e,t,i){return e>=t&&t+i>e}return function(t,i,s,n){if(!i.offset)return!1;var a=(t.positionAbs||t.position.absolute).left+t.margins.left,o=(t.positionAbs||t.position.absolute).top+t.margins.top,r=a+t.helperProportions.width,h=o+t.helperProportions.height,l=i.offset.left,u=i.offset.top,d=l+i.proportions().width,c=u+i.proportions().height;switch(s){case"fit":return a>=l&&d>=r&&o>=u&&c>=h;case"intersect":return a+t.helperProportions.width/2>l&&d>r-t.helperProportions.width/2&&o+t.helperProportions.height/2>u&&c>h-t.helperProportions.height/2;case"pointer":return e(n.pageY,u,i.proportions().height)&&e(n.pageX,l,i.proportions().width);case"touch":return(o>=u&&c>=o||h>=u&&c>=h||u>o&&h>c)&&(a>=l&&d>=a||r>=l&&d>=r||l>a&&r>d);default:return!1}}}(),e.ui.ddmanager={current:null,droppables:{"default":[]},prepareOffsets:function(t,i){var s,n,a=e.ui.ddmanager.droppables[t.options.scope]||[],o=i?i.type:null,r=(t.currentItem||t.element).find(":data(ui-droppable)").addBack();e:for(s=0;a.length>s;s++)if(!(a[s].options.disabled||t&&!a[s].accept.call(a[s].element[0],t.currentItem||t.element))){for(n=0;r.length>n;n++)if(r[n]===a[s].element[0]){a[s].proportions().height=0;continue e}a[s].visible="none"!==a[s].element.css("display"),a[s].visible&&("mousedown"===o&&a[s]._activate.call(a[s],i),a[s].offset=a[s].element.offset(),a[s].proportions({width:a[s].element[0].offsetWidth,height:a[s].element[0].offsetHeight}))}},drop:function(t,i){var s=!1;return e.each((e.ui.ddmanager.droppables[t.options.scope]||[]).slice(),function(){this.options&&(!this.options.disabled&&this.visible&&e.ui.intersect(t,this,this.options.tolerance,i)&&(s=this._drop.call(this,i)||s),!this.options.disabled&&this.visible&&this.accept.call(this.element[0],t.currentItem||t.element)&&(this.isout=!0,this.isover=!1,this._deactivate.call(this,i)))}),s},dragStart:function(t,i){t.element.parentsUntil("body").bind("scroll.droppable",function(){t.options.refreshPositions||e.ui.ddmanager.prepareOffsets(t,i)})},drag:function(t,i){t.options.refreshPositions&&e.ui.ddmanager.prepareOffsets(t,i),e.each(e.ui.ddmanager.droppables[t.options.scope]||[],function(){if(!this.options.disabled&&!this.greedyChild&&this.visible){var s,n,a,o=e.ui.intersect(t,this,this.options.tolerance,i),r=!o&&this.isover?"isout":o&&!this.isover?"isover":null;r&&(this.options.greedy&&(n=this.options.scope,a=this.element.parents(":data(ui-droppable)").filter(function(){return e(this).droppable("instance").options.scope===n}),a.length&&(s=e(a[0]).droppable("instance"),s.greedyChild="isover"===r)),s&&"isover"===r&&(s.isover=!1,s.isout=!0,s._out.call(s,i)),this[r]=!0,this["isout"===r?"isover":"isout"]=!1,this["isover"===r?"_over":"_out"].call(this,i),s&&"isout"===r&&(s.isout=!1,s.isover=!0,s._over.call(s,i)))}})},dragStop:function(t,i){t.element.parentsUntil("body").unbind("scroll.droppable"),t.options.refreshPositions||e.ui.ddmanager.prepareOffsets(t,i)}},e.ui.droppable,e.widget("ui.resizable",e.ui.mouse,{version:"1.11.4",widgetEventPrefix:"resize",options:{alsoResize:!1,animate:!1,animateDuration:"slow",animateEasing:"swing",aspectRatio:!1,autoHide:!1,containment:!1,ghost:!1,grid:!1,handles:"e,s,se",helper:!1,maxHeight:null,maxWidth:null,minHeight:10,minWidth:10,zIndex:90,resize:null,start:null,stop:null},_num:function(e){return parseInt(e,10)||0},_isNumber:function(e){return!isNaN(parseInt(e,10))},_hasScroll:function(t,i){if("hidden"===e(t).css("overflow"))return!1;var s=i&&"left"===i?"scrollLeft":"scrollTop",n=!1;return t[s]>0?!0:(t[s]=1,n=t[s]>0,t[s]=0,n)},_create:function(){var t,i,s,n,a,o=this,r=this.options;if(this.element.addClass("ui-resizable"),e.extend(this,{_aspectRatio:!!r.aspectRatio,aspectRatio:r.aspectRatio,originalElement:this.element,_proportionallyResizeElements:[],_helper:r.helper||r.ghost||r.animate?r.helper||"ui-resizable-helper":null}),this.element[0].nodeName.match(/^(canvas|textarea|input|select|button|img)$/i)&&(this.element.wrap(e("<div class='ui-wrapper' style='overflow: hidden;'></div>").css({position:this.element.css("position"),width:this.element.outerWidth(),height:this.element.outerHeight(),top:this.element.css("top"),left:this.element.css("left")})),this.element=this.element.parent().data("ui-resizable",this.element.resizable("instance")),this.elementIsWrapper=!0,this.element.css({marginLeft:this.originalElement.css("marginLeft"),marginTop:this.originalElement.css("marginTop"),marginRight:this.originalElement.css("marginRight"),marginBottom:this.originalElement.css("marginBottom")}),this.originalElement.css({marginLeft:0,marginTop:0,marginRight:0,marginBottom:0}),this.originalResizeStyle=this.originalElement.css("resize"),this.originalElement.css("resize","none"),this._proportionallyResizeElements.push(this.originalElement.css({position:"static",zoom:1,display:"block"})),this.originalElement.css({margin:this.originalElement.css("margin")}),this._proportionallyResize()),this.handles=r.handles||(e(".ui-resizable-handle",this.element).length?{n:".ui-resizable-n",e:".ui-resizable-e",s:".ui-resizable-s",w:".ui-resizable-w",se:".ui-resizable-se",sw:".ui-resizable-sw",ne:".ui-resizable-ne",nw:".ui-resizable-nw"}:"e,s,se"),this._handles=e(),this.handles.constructor===String)for("all"===this.handles&&(this.handles="n,e,s,w,se,sw,ne,nw"),t=this.handles.split(","),this.handles={},i=0;t.length>i;i++)s=e.trim(t[i]),a="ui-resizable-"+s,n=e("<div class='ui-resizable-handle "+a+"'></div>"),n.css({zIndex:r.zIndex}),"se"===s&&n.addClass("ui-icon ui-icon-gripsmall-diagonal-se"),this.handles[s]=".ui-resizable-"+s,this.element.append(n);this._renderAxis=function(t){var i,s,n,a;t=t||this.element;for(i in this.handles)this.handles[i].constructor===String?this.handles[i]=this.element.children(this.handles[i]).first().show():(this.handles[i].jquery||this.handles[i].nodeType)&&(this.handles[i]=e(this.handles[i]),this._on(this.handles[i],{mousedown:o._mouseDown})),this.elementIsWrapper&&this.originalElement[0].nodeName.match(/^(textarea|input|select|button)$/i)&&(s=e(this.handles[i],this.element),a=/sw|ne|nw|se|n|s/.test(i)?s.outerHeight():s.outerWidth(),n=["padding",/ne|nw|n/.test(i)?"Top":/se|sw|s/.test(i)?"Bottom":/^e$/.test(i)?"Right":"Left"].join(""),t.css(n,a),this._proportionallyResize()),this._handles=this._handles.add(this.handles[i])},this._renderAxis(this.element),this._handles=this._handles.add(this.element.find(".ui-resizable-handle")),this._handles.disableSelection(),this._handles.mouseover(function(){o.resizing||(this.className&&(n=this.className.match(/ui-resizable-(se|sw|ne|nw|n|e|s|w)/i)),o.axis=n&&n[1]?n[1]:"se")}),r.autoHide&&(this._handles.hide(),e(this.element).addClass("ui-resizable-autohide").mouseenter(function(){r.disabled||(e(this).removeClass("ui-resizable-autohide"),o._handles.show())}).mouseleave(function(){r.disabled||o.resizing||(e(this).addClass("ui-resizable-autohide"),o._handles.hide())})),this._mouseInit()},_destroy:function(){this._mouseDestroy();var t,i=function(t){e(t).removeClass("ui-resizable ui-resizable-disabled ui-resizable-resizing").removeData("resizable").removeData("ui-resizable").unbind(".resizable").find(".ui-resizable-handle").remove()};return this.elementIsWrapper&&(i(this.element),t=this.element,this.originalElement.css({position:t.css("position"),width:t.outerWidth(),height:t.outerHeight(),top:t.css("top"),left:t.css("left")}).insertAfter(t),t.remove()),this.originalElement.css("resize",this.originalResizeStyle),i(this.originalElement),this},_mouseCapture:function(t){var i,s,n=!1;for(i in this.handles)s=e(this.handles[i])[0],(s===t.target||e.contains(s,t.target))&&(n=!0);return!this.options.disabled&&n},_mouseStart:function(t){var i,s,n,a=this.options,o=this.element;return this.resizing=!0,this._renderProxy(),i=this._num(this.helper.css("left")),s=this._num(this.helper.css("top")),a.containment&&(i+=e(a.containment).scrollLeft()||0,s+=e(a.containment).scrollTop()||0),this.offset=this.helper.offset(),this.position={left:i,top:s},this.size=this._helper?{width:this.helper.width(),height:this.helper.height()}:{width:o.width(),height:o.height()},this.originalSize=this._helper?{width:o.outerWidth(),height:o.outerHeight()}:{width:o.width(),height:o.height()},this.sizeDiff={width:o.outerWidth()-o.width(),height:o.outerHeight()-o.height()},this.originalPosition={left:i,top:s},this.originalMousePosition={left:t.pageX,top:t.pageY},this.aspectRatio="number"==typeof a.aspectRatio?a.aspectRatio:this.originalSize.width/this.originalSize.height||1,n=e(".ui-resizable-"+this.axis).css("cursor"),e("body").css("cursor","auto"===n?this.axis+"-resize":n),o.addClass("ui-resizable-resizing"),this._propagate("start",t),!0},_mouseDrag:function(t){var i,s,n=this.originalMousePosition,a=this.axis,o=t.pageX-n.left||0,r=t.pageY-n.top||0,h=this._change[a];return this._updatePrevProperties(),h?(i=h.apply(this,[t,o,r]),this._updateVirtualBoundaries(t.shiftKey),(this._aspectRatio||t.shiftKey)&&(i=this._updateRatio(i,t)),i=this._respectSize(i,t),this._updateCache(i),this._propagate("resize",t),s=this._applyChanges(),!this._helper&&this._proportionallyResizeElements.length&&this._proportionallyResize(),e.isEmptyObject(s)||(this._updatePrevProperties(),this._trigger("resize",t,this.ui()),this._applyChanges()),!1):!1},_mouseStop:function(t){this.resizing=!1;var i,s,n,a,o,r,h,l=this.options,u=this;return this._helper&&(i=this._proportionallyResizeElements,s=i.length&&/textarea/i.test(i[0].nodeName),n=s&&this._hasScroll(i[0],"left")?0:u.sizeDiff.height,a=s?0:u.sizeDiff.width,o={width:u.helper.width()-a,height:u.helper.height()-n},r=parseInt(u.element.css("left"),10)+(u.position.left-u.originalPosition.left)||null,h=parseInt(u.element.css("top"),10)+(u.position.top-u.originalPosition.top)||null,l.animate||this.element.css(e.extend(o,{top:h,left:r})),u.helper.height(u.size.height),u.helper.width(u.size.width),this._helper&&!l.animate&&this._proportionallyResize()),e("body").css("cursor","auto"),this.element.removeClass("ui-resizable-resizing"),this._propagate("stop",t),this._helper&&this.helper.remove(),!1},_updatePrevProperties:function(){this.prevPosition={top:this.position.top,left:this.position.left},this.prevSize={width:this.size.width,height:this.size.height}},_applyChanges:function(){var e={};return this.position.top!==this.prevPosition.top&&(e.top=this.position.top+"px"),this.position.left!==this.prevPosition.left&&(e.left=this.position.left+"px"),this.size.width!==this.prevSize.width&&(e.width=this.size.width+"px"),this.size.height!==this.prevSize.height&&(e.height=this.size.height+"px"),this.helper.css(e),e},_updateVirtualBoundaries:function(e){var t,i,s,n,a,o=this.options;a={minWidth:this._isNumber(o.minWidth)?o.minWidth:0,maxWidth:this._isNumber(o.maxWidth)?o.maxWidth:1/0,minHeight:this._isNumber(o.minHeight)?o.minHeight:0,maxHeight:this._isNumber(o.maxHeight)?o.maxHeight:1/0},(this._aspectRatio||e)&&(t=a.minHeight*this.aspectRatio,s=a.minWidth/this.aspectRatio,i=a.maxHeight*this.aspectRatio,n=a.maxWidth/this.aspectRatio,t>a.minWidth&&(a.minWidth=t),s>a.minHeight&&(a.minHeight=s),a.maxWidth>i&&(a.maxWidth=i),a.maxHeight>n&&(a.maxHeight=n)),this._vBoundaries=a},_updateCache:function(e){this.offset=this.helper.offset(),this._isNumber(e.left)&&(this.position.left=e.left),this._isNumber(e.top)&&(this.position.top=e.top),this._isNumber(e.height)&&(this.size.height=e.height),this._isNumber(e.width)&&(this.size.width=e.width)},_updateRatio:function(e){var t=this.position,i=this.size,s=this.axis;return this._isNumber(e.height)?e.width=e.height*this.aspectRatio:this._isNumber(e.width)&&(e.height=e.width/this.aspectRatio),"sw"===s&&(e.left=t.left+(i.width-e.width),e.top=null),"nw"===s&&(e.top=t.top+(i.height-e.height),e.left=t.left+(i.width-e.width)),e},_respectSize:function(e){var t=this._vBoundaries,i=this.axis,s=this._isNumber(e.width)&&t.maxWidth&&t.maxWidth<e.width,n=this._isNumber(e.height)&&t.maxHeight&&t.maxHeight<e.height,a=this._isNumber(e.width)&&t.minWidth&&t.minWidth>e.width,o=this._isNumber(e.height)&&t.minHeight&&t.minHeight>e.height,r=this.originalPosition.left+this.originalSize.width,h=this.position.top+this.size.height,l=/sw|nw|w/.test(i),u=/nw|ne|n/.test(i);return a&&(e.width=t.minWidth),o&&(e.height=t.minHeight),s&&(e.width=t.maxWidth),n&&(e.height=t.maxHeight),a&&l&&(e.left=r-t.minWidth),s&&l&&(e.left=r-t.maxWidth),o&&u&&(e.top=h-t.minHeight),n&&u&&(e.top=h-t.maxHeight),e.width||e.height||e.left||!e.top?e.width||e.height||e.top||!e.left||(e.left=null):e.top=null,e},_getPaddingPlusBorderDimensions:function(e){for(var t=0,i=[],s=[e.css("borderTopWidth"),e.css("borderRightWidth"),e.css("borderBottomWidth"),e.css("borderLeftWidth")],n=[e.css("paddingTop"),e.css("paddingRight"),e.css("paddingBottom"),e.css("paddingLeft")];4>t;t++)i[t]=parseInt(s[t],10)||0,i[t]+=parseInt(n[t],10)||0;return{height:i[0]+i[2],width:i[1]+i[3]}},_proportionallyResize:function(){if(this._proportionallyResizeElements.length)for(var e,t=0,i=this.helper||this.element;this._proportionallyResizeElements.length>t;t++)e=this._proportionallyResizeElements[t],this.outerDimensions||(this.outerDimensions=this._getPaddingPlusBorderDimensions(e)),e.css({height:i.height()-this.outerDimensions.height||0,width:i.width()-this.outerDimensions.width||0})},_renderProxy:function(){var t=this.element,i=this.options;this.elementOffset=t.offset(),this._helper?(this.helper=this.helper||e("<div style='overflow:hidden;'></div>"),this.helper.addClass(this._helper).css({width:this.element.outerWidth()-1,height:this.element.outerHeight()-1,position:"absolute",left:this.elementOffset.left+"px",top:this.elementOffset.top+"px",zIndex:++i.zIndex}),this.helper.appendTo("body").disableSelection()):this.helper=this.element},_change:{e:function(e,t){return{width:this.originalSize.width+t}},w:function(e,t){var i=this.originalSize,s=this.originalPosition;return{left:s.left+t,width:i.width-t}},n:function(e,t,i){var s=this.originalSize,n=this.originalPosition;return{top:n.top+i,height:s.height-i}},s:function(e,t,i){return{height:this.originalSize.height+i}},se:function(t,i,s){return e.extend(this._change.s.apply(this,arguments),this._change.e.apply(this,[t,i,s]))},sw:function(t,i,s){return e.extend(this._change.s.apply(this,arguments),this._change.w.apply(this,[t,i,s]))},ne:function(t,i,s){return e.extend(this._change.n.apply(this,arguments),this._change.e.apply(this,[t,i,s]))},nw:function(t,i,s){return e.extend(this._change.n.apply(this,arguments),this._change.w.apply(this,[t,i,s]))}},_propagate:function(t,i){e.ui.plugin.call(this,t,[i,this.ui()]),"resize"!==t&&this._trigger(t,i,this.ui())},plugins:{},ui:function(){return{originalElement:this.originalElement,element:this.element,helper:this.helper,position:this.position,size:this.size,originalSize:this.originalSize,originalPosition:this.originalPosition}}}),e.ui.plugin.add("resizable","animate",{stop:function(t){var i=e(this).resizable("instance"),s=i.options,n=i._proportionallyResizeElements,a=n.length&&/textarea/i.test(n[0].nodeName),o=a&&i._hasScroll(n[0],"left")?0:i.sizeDiff.height,r=a?0:i.sizeDiff.width,h={width:i.size.width-r,height:i.size.height-o},l=parseInt(i.element.css("left"),10)+(i.position.left-i.originalPosition.left)||null,u=parseInt(i.element.css("top"),10)+(i.position.top-i.originalPosition.top)||null;i.element.animate(e.extend(h,u&&l?{top:u,left:l}:{}),{duration:s.animateDuration,easing:s.animateEasing,step:function(){var s={width:parseInt(i.element.css("width"),10),height:parseInt(i.element.css("height"),10),top:parseInt(i.element.css("top"),10),left:parseInt(i.element.css("left"),10)};n&&n.length&&e(n[0]).css({width:s.width,height:s.height}),i._updateCache(s),i._propagate("resize",t)}})}}),e.ui.plugin.add("resizable","containment",{start:function(){var t,i,s,n,a,o,r,h=e(this).resizable("instance"),l=h.options,u=h.element,d=l.containment,c=d instanceof e?d.get(0):/parent/.test(d)?u.parent().get(0):d;c&&(h.containerElement=e(c),/document/.test(d)||d===document?(h.containerOffset={left:0,top:0},h.containerPosition={left:0,top:0},h.parentData={element:e(document),left:0,top:0,width:e(document).width(),height:e(document).height()||document.body.parentNode.scrollHeight}):(t=e(c),i=[],e(["Top","Right","Left","Bottom"]).each(function(e,s){i[e]=h._num(t.css("padding"+s))}),h.containerOffset=t.offset(),h.containerPosition=t.position(),h.containerSize={height:t.innerHeight()-i[3],width:t.innerWidth()-i[1]},s=h.containerOffset,n=h.containerSize.height,a=h.containerSize.width,o=h._hasScroll(c,"left")?c.scrollWidth:a,r=h._hasScroll(c)?c.scrollHeight:n,h.parentData={element:c,left:s.left,top:s.top,width:o,height:r}))},resize:function(t){var i,s,n,a,o=e(this).resizable("instance"),r=o.options,h=o.containerOffset,l=o.position,u=o._aspectRatio||t.shiftKey,d={top:0,left:0},c=o.containerElement,p=!0;c[0]!==document&&/static/.test(c.css("position"))&&(d=h),l.left<(o._helper?h.left:0)&&(o.size.width=o.size.width+(o._helper?o.position.left-h.left:o.position.left-d.left),u&&(o.size.height=o.size.width/o.aspectRatio,p=!1),o.position.left=r.helper?h.left:0),l.top<(o._helper?h.top:0)&&(o.size.height=o.size.height+(o._helper?o.position.top-h.top:o.position.top),u&&(o.size.width=o.size.height*o.aspectRatio,p=!1),o.position.top=o._helper?h.top:0),n=o.containerElement.get(0)===o.element.parent().get(0),a=/relative|absolute/.test(o.containerElement.css("position")),n&&a?(o.offset.left=o.parentData.left+o.position.left,o.offset.top=o.parentData.top+o.position.top):(o.offset.left=o.element.offset().left,o.offset.top=o.element.offset().top),i=Math.abs(o.sizeDiff.width+(o._helper?o.offset.left-d.left:o.offset.left-h.left)),s=Math.abs(o.sizeDiff.height+(o._helper?o.offset.top-d.top:o.offset.top-h.top)),i+o.size.width>=o.parentData.width&&(o.size.width=o.parentData.width-i,u&&(o.size.height=o.size.width/o.aspectRatio,p=!1)),s+o.size.height>=o.parentData.height&&(o.size.height=o.parentData.height-s,u&&(o.size.width=o.size.height*o.aspectRatio,p=!1)),p||(o.position.left=o.prevPosition.left,o.position.top=o.prevPosition.top,o.size.width=o.prevSize.width,o.size.height=o.prevSize.height)},stop:function(){var t=e(this).resizable("instance"),i=t.options,s=t.containerOffset,n=t.containerPosition,a=t.containerElement,o=e(t.helper),r=o.offset(),h=o.outerWidth()-t.sizeDiff.width,l=o.outerHeight()-t.sizeDiff.height;t._helper&&!i.animate&&/relative/.test(a.css("position"))&&e(this).css({left:r.left-n.left-s.left,width:h,height:l}),t._helper&&!i.animate&&/static/.test(a.css("position"))&&e(this).css({left:r.left-n.left-s.left,width:h,height:l})}}),e.ui.plugin.add("resizable","alsoResize",{start:function(){var t=e(this).resizable("instance"),i=t.options;e(i.alsoResize).each(function(){var t=e(this);t.data("ui-resizable-alsoresize",{width:parseInt(t.width(),10),height:parseInt(t.height(),10),left:parseInt(t.css("left"),10),top:parseInt(t.css("top"),10)})})},resize:function(t,i){var s=e(this).resizable("instance"),n=s.options,a=s.originalSize,o=s.originalPosition,r={height:s.size.height-a.height||0,width:s.size.width-a.width||0,top:s.position.top-o.top||0,left:s.position.left-o.left||0};e(n.alsoResize).each(function(){var t=e(this),s=e(this).data("ui-resizable-alsoresize"),n={},a=t.parents(i.originalElement[0]).length?["width","height"]:["width","height","top","left"];e.each(a,function(e,t){var i=(s[t]||0)+(r[t]||0);i&&i>=0&&(n[t]=i||null)}),t.css(n)})},stop:function(){e(this).removeData("resizable-alsoresize")}}),e.ui.plugin.add("resizable","ghost",{start:function(){var t=e(this).resizable("instance"),i=t.options,s=t.size;t.ghost=t.originalElement.clone(),t.ghost.css({opacity:.25,display:"block",position:"relative",height:s.height,width:s.width,margin:0,left:0,top:0}).addClass("ui-resizable-ghost").addClass("string"==typeof i.ghost?i.ghost:""),t.ghost.appendTo(t.helper)},resize:function(){var t=e(this).resizable("instance");t.ghost&&t.ghost.css({position:"relative",height:t.size.height,width:t.size.width})},stop:function(){var t=e(this).resizable("instance");t.ghost&&t.helper&&t.helper.get(0).removeChild(t.ghost.get(0))}}),e.ui.plugin.add("resizable","grid",{resize:function(){var t,i=e(this).resizable("instance"),s=i.options,n=i.size,a=i.originalSize,o=i.originalPosition,r=i.axis,h="number"==typeof s.grid?[s.grid,s.grid]:s.grid,l=h[0]||1,u=h[1]||1,d=Math.round((n.width-a.width)/l)*l,c=Math.round((n.height-a.height)/u)*u,p=a.width+d,f=a.height+c,m=s.maxWidth&&p>s.maxWidth,g=s.maxHeight&&f>s.maxHeight,v=s.minWidth&&s.minWidth>p,y=s.minHeight&&s.minHeight>f;s.grid=h,v&&(p+=l),y&&(f+=u),m&&(p-=l),g&&(f-=u),/^(se|s|e)$/.test(r)?(i.size.width=p,i.size.height=f):/^(ne)$/.test(r)?(i.size.width=p,i.size.height=f,i.position.top=o.top-c):/^(sw)$/.test(r)?(i.size.width=p,i.size.height=f,i.position.left=o.left-d):((0>=f-u||0>=p-l)&&(t=i._getPaddingPlusBorderDimensions(this)),f-u>0?(i.size.height=f,i.position.top=o.top-c):(f=u-t.height,i.size.height=f,i.position.top=o.top+a.height-f),p-l>0?(i.size.width=p,i.position.left=o.left-d):(p=l-t.width,i.size.width=p,i.position.left=o.left+a.width-p))}}),e.ui.resizable,e.widget("ui.selectable",e.ui.mouse,{version:"1.11.4",options:{appendTo:"body",autoRefresh:!0,distance:0,filter:"*",tolerance:"touch",selected:null,selecting:null,start:null,stop:null,unselected:null,unselecting:null},_create:function(){var t,i=this;
this.element.addClass("ui-selectable"),this.dragged=!1,this.refresh=function(){t=e(i.options.filter,i.element[0]),t.addClass("ui-selectee"),t.each(function(){var t=e(this),i=t.offset();e.data(this,"selectable-item",{element:this,$element:t,left:i.left,top:i.top,right:i.left+t.outerWidth(),bottom:i.top+t.outerHeight(),startselected:!1,selected:t.hasClass("ui-selected"),selecting:t.hasClass("ui-selecting"),unselecting:t.hasClass("ui-unselecting")})})},this.refresh(),this.selectees=t.addClass("ui-selectee"),this._mouseInit(),this.helper=e("<div class='ui-selectable-helper'></div>")},_destroy:function(){this.selectees.removeClass("ui-selectee").removeData("selectable-item"),this.element.removeClass("ui-selectable ui-selectable-disabled"),this._mouseDestroy()},_mouseStart:function(t){var i=this,s=this.options;this.opos=[t.pageX,t.pageY],this.options.disabled||(this.selectees=e(s.filter,this.element[0]),this._trigger("start",t),e(s.appendTo).append(this.helper),this.helper.css({left:t.pageX,top:t.pageY,width:0,height:0}),s.autoRefresh&&this.refresh(),this.selectees.filter(".ui-selected").each(function(){var s=e.data(this,"selectable-item");s.startselected=!0,t.metaKey||t.ctrlKey||(s.$element.removeClass("ui-selected"),s.selected=!1,s.$element.addClass("ui-unselecting"),s.unselecting=!0,i._trigger("unselecting",t,{unselecting:s.element}))}),e(t.target).parents().addBack().each(function(){var s,n=e.data(this,"selectable-item");return n?(s=!t.metaKey&&!t.ctrlKey||!n.$element.hasClass("ui-selected"),n.$element.removeClass(s?"ui-unselecting":"ui-selected").addClass(s?"ui-selecting":"ui-unselecting"),n.unselecting=!s,n.selecting=s,n.selected=s,s?i._trigger("selecting",t,{selecting:n.element}):i._trigger("unselecting",t,{unselecting:n.element}),!1):void 0}))},_mouseDrag:function(t){if(this.dragged=!0,!this.options.disabled){var i,s=this,n=this.options,a=this.opos[0],o=this.opos[1],r=t.pageX,h=t.pageY;return a>r&&(i=r,r=a,a=i),o>h&&(i=h,h=o,o=i),this.helper.css({left:a,top:o,width:r-a,height:h-o}),this.selectees.each(function(){var i=e.data(this,"selectable-item"),l=!1;i&&i.element!==s.element[0]&&("touch"===n.tolerance?l=!(i.left>r||a>i.right||i.top>h||o>i.bottom):"fit"===n.tolerance&&(l=i.left>a&&r>i.right&&i.top>o&&h>i.bottom),l?(i.selected&&(i.$element.removeClass("ui-selected"),i.selected=!1),i.unselecting&&(i.$element.removeClass("ui-unselecting"),i.unselecting=!1),i.selecting||(i.$element.addClass("ui-selecting"),i.selecting=!0,s._trigger("selecting",t,{selecting:i.element}))):(i.selecting&&((t.metaKey||t.ctrlKey)&&i.startselected?(i.$element.removeClass("ui-selecting"),i.selecting=!1,i.$element.addClass("ui-selected"),i.selected=!0):(i.$element.removeClass("ui-selecting"),i.selecting=!1,i.startselected&&(i.$element.addClass("ui-unselecting"),i.unselecting=!0),s._trigger("unselecting",t,{unselecting:i.element}))),i.selected&&(t.metaKey||t.ctrlKey||i.startselected||(i.$element.removeClass("ui-selected"),i.selected=!1,i.$element.addClass("ui-unselecting"),i.unselecting=!0,s._trigger("unselecting",t,{unselecting:i.element})))))}),!1}},_mouseStop:function(t){var i=this;return this.dragged=!1,e(".ui-unselecting",this.element[0]).each(function(){var s=e.data(this,"selectable-item");s.$element.removeClass("ui-unselecting"),s.unselecting=!1,s.startselected=!1,i._trigger("unselected",t,{unselected:s.element})}),e(".ui-selecting",this.element[0]).each(function(){var s=e.data(this,"selectable-item");s.$element.removeClass("ui-selecting").addClass("ui-selected"),s.selecting=!1,s.selected=!0,s.startselected=!0,i._trigger("selected",t,{selected:s.element})}),this._trigger("stop",t),this.helper.remove(),!1}}),e.widget("ui.sortable",e.ui.mouse,{version:"1.11.4",widgetEventPrefix:"sort",ready:!1,options:{appendTo:"parent",axis:!1,connectWith:!1,containment:!1,cursor:"auto",cursorAt:!1,dropOnEmpty:!0,forcePlaceholderSize:!1,forceHelperSize:!1,grid:!1,handle:!1,helper:"original",items:"> *",opacity:!1,placeholder:!1,revert:!1,scroll:!0,scrollSensitivity:20,scrollSpeed:20,scope:"default",tolerance:"intersect",zIndex:1e3,activate:null,beforeStop:null,change:null,deactivate:null,out:null,over:null,receive:null,remove:null,sort:null,start:null,stop:null,update:null},_isOverAxis:function(e,t,i){return e>=t&&t+i>e},_isFloating:function(e){return/left|right/.test(e.css("float"))||/inline|table-cell/.test(e.css("display"))},_create:function(){this.containerCache={},this.element.addClass("ui-sortable"),this.refresh(),this.offset=this.element.offset(),this._mouseInit(),this._setHandleClassName(),this.ready=!0},_setOption:function(e,t){this._super(e,t),"handle"===e&&this._setHandleClassName()},_setHandleClassName:function(){this.element.find(".ui-sortable-handle").removeClass("ui-sortable-handle"),e.each(this.items,function(){(this.instance.options.handle?this.item.find(this.instance.options.handle):this.item).addClass("ui-sortable-handle")})},_destroy:function(){this.element.removeClass("ui-sortable ui-sortable-disabled").find(".ui-sortable-handle").removeClass("ui-sortable-handle"),this._mouseDestroy();for(var e=this.items.length-1;e>=0;e--)this.items[e].item.removeData(this.widgetName+"-item");return this},_mouseCapture:function(t,i){var s=null,n=!1,a=this;return this.reverting?!1:this.options.disabled||"static"===this.options.type?!1:(this._refreshItems(t),e(t.target).parents().each(function(){return e.data(this,a.widgetName+"-item")===a?(s=e(this),!1):void 0}),e.data(t.target,a.widgetName+"-item")===a&&(s=e(t.target)),s?!this.options.handle||i||(e(this.options.handle,s).find("*").addBack().each(function(){this===t.target&&(n=!0)}),n)?(this.currentItem=s,this._removeCurrentsFromItems(),!0):!1:!1)},_mouseStart:function(t,i,s){var n,a,o=this.options;if(this.currentContainer=this,this.refreshPositions(),this.helper=this._createHelper(t),this._cacheHelperProportions(),this._cacheMargins(),this.scrollParent=this.helper.scrollParent(),this.offset=this.currentItem.offset(),this.offset={top:this.offset.top-this.margins.top,left:this.offset.left-this.margins.left},e.extend(this.offset,{click:{left:t.pageX-this.offset.left,top:t.pageY-this.offset.top},parent:this._getParentOffset(),relative:this._getRelativeOffset()}),this.helper.css("position","absolute"),this.cssPosition=this.helper.css("position"),this.originalPosition=this._generatePosition(t),this.originalPageX=t.pageX,this.originalPageY=t.pageY,o.cursorAt&&this._adjustOffsetFromHelper(o.cursorAt),this.domPosition={prev:this.currentItem.prev()[0],parent:this.currentItem.parent()[0]},this.helper[0]!==this.currentItem[0]&&this.currentItem.hide(),this._createPlaceholder(),o.containment&&this._setContainment(),o.cursor&&"auto"!==o.cursor&&(a=this.document.find("body"),this.storedCursor=a.css("cursor"),a.css("cursor",o.cursor),this.storedStylesheet=e("<style>*{ cursor: "+o.cursor+" !important; }</style>").appendTo(a)),o.opacity&&(this.helper.css("opacity")&&(this._storedOpacity=this.helper.css("opacity")),this.helper.css("opacity",o.opacity)),o.zIndex&&(this.helper.css("zIndex")&&(this._storedZIndex=this.helper.css("zIndex")),this.helper.css("zIndex",o.zIndex)),this.scrollParent[0]!==this.document[0]&&"HTML"!==this.scrollParent[0].tagName&&(this.overflowOffset=this.scrollParent.offset()),this._trigger("start",t,this._uiHash()),this._preserveHelperProportions||this._cacheHelperProportions(),!s)for(n=this.containers.length-1;n>=0;n--)this.containers[n]._trigger("activate",t,this._uiHash(this));return e.ui.ddmanager&&(e.ui.ddmanager.current=this),e.ui.ddmanager&&!o.dropBehaviour&&e.ui.ddmanager.prepareOffsets(this,t),this.dragging=!0,this.helper.addClass("ui-sortable-helper"),this._mouseDrag(t),!0},_mouseDrag:function(t){var i,s,n,a,o=this.options,r=!1;for(this.position=this._generatePosition(t),this.positionAbs=this._convertPositionTo("absolute"),this.lastPositionAbs||(this.lastPositionAbs=this.positionAbs),this.options.scroll&&(this.scrollParent[0]!==this.document[0]&&"HTML"!==this.scrollParent[0].tagName?(this.overflowOffset.top+this.scrollParent[0].offsetHeight-t.pageY<o.scrollSensitivity?this.scrollParent[0].scrollTop=r=this.scrollParent[0].scrollTop+o.scrollSpeed:t.pageY-this.overflowOffset.top<o.scrollSensitivity&&(this.scrollParent[0].scrollTop=r=this.scrollParent[0].scrollTop-o.scrollSpeed),this.overflowOffset.left+this.scrollParent[0].offsetWidth-t.pageX<o.scrollSensitivity?this.scrollParent[0].scrollLeft=r=this.scrollParent[0].scrollLeft+o.scrollSpeed:t.pageX-this.overflowOffset.left<o.scrollSensitivity&&(this.scrollParent[0].scrollLeft=r=this.scrollParent[0].scrollLeft-o.scrollSpeed)):(t.pageY-this.document.scrollTop()<o.scrollSensitivity?r=this.document.scrollTop(this.document.scrollTop()-o.scrollSpeed):this.window.height()-(t.pageY-this.document.scrollTop())<o.scrollSensitivity&&(r=this.document.scrollTop(this.document.scrollTop()+o.scrollSpeed)),t.pageX-this.document.scrollLeft()<o.scrollSensitivity?r=this.document.scrollLeft(this.document.scrollLeft()-o.scrollSpeed):this.window.width()-(t.pageX-this.document.scrollLeft())<o.scrollSensitivity&&(r=this.document.scrollLeft(this.document.scrollLeft()+o.scrollSpeed))),r!==!1&&e.ui.ddmanager&&!o.dropBehaviour&&e.ui.ddmanager.prepareOffsets(this,t)),this.positionAbs=this._convertPositionTo("absolute"),this.options.axis&&"y"===this.options.axis||(this.helper[0].style.left=this.position.left+"px"),this.options.axis&&"x"===this.options.axis||(this.helper[0].style.top=this.position.top+"px"),i=this.items.length-1;i>=0;i--)if(s=this.items[i],n=s.item[0],a=this._intersectsWithPointer(s),a&&s.instance===this.currentContainer&&n!==this.currentItem[0]&&this.placeholder[1===a?"next":"prev"]()[0]!==n&&!e.contains(this.placeholder[0],n)&&("semi-dynamic"===this.options.type?!e.contains(this.element[0],n):!0)){if(this.direction=1===a?"down":"up","pointer"!==this.options.tolerance&&!this._intersectsWithSides(s))break;this._rearrange(t,s),this._trigger("change",t,this._uiHash());break}return this._contactContainers(t),e.ui.ddmanager&&e.ui.ddmanager.drag(this,t),this._trigger("sort",t,this._uiHash()),this.lastPositionAbs=this.positionAbs,!1},_mouseStop:function(t,i){if(t){if(e.ui.ddmanager&&!this.options.dropBehaviour&&e.ui.ddmanager.drop(this,t),this.options.revert){var s=this,n=this.placeholder.offset(),a=this.options.axis,o={};a&&"x"!==a||(o.left=n.left-this.offset.parent.left-this.margins.left+(this.offsetParent[0]===this.document[0].body?0:this.offsetParent[0].scrollLeft)),a&&"y"!==a||(o.top=n.top-this.offset.parent.top-this.margins.top+(this.offsetParent[0]===this.document[0].body?0:this.offsetParent[0].scrollTop)),this.reverting=!0,e(this.helper).animate(o,parseInt(this.options.revert,10)||500,function(){s._clear(t)})}else this._clear(t,i);return!1}},cancel:function(){if(this.dragging){this._mouseUp({target:null}),"original"===this.options.helper?this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper"):this.currentItem.show();for(var t=this.containers.length-1;t>=0;t--)this.containers[t]._trigger("deactivate",null,this._uiHash(this)),this.containers[t].containerCache.over&&(this.containers[t]._trigger("out",null,this._uiHash(this)),this.containers[t].containerCache.over=0)}return this.placeholder&&(this.placeholder[0].parentNode&&this.placeholder[0].parentNode.removeChild(this.placeholder[0]),"original"!==this.options.helper&&this.helper&&this.helper[0].parentNode&&this.helper.remove(),e.extend(this,{helper:null,dragging:!1,reverting:!1,_noFinalSort:null}),this.domPosition.prev?e(this.domPosition.prev).after(this.currentItem):e(this.domPosition.parent).prepend(this.currentItem)),this},serialize:function(t){var i=this._getItemsAsjQuery(t&&t.connected),s=[];return t=t||{},e(i).each(function(){var i=(e(t.item||this).attr(t.attribute||"id")||"").match(t.expression||/(.+)[\-=_](.+)/);i&&s.push((t.key||i[1]+"[]")+"="+(t.key&&t.expression?i[1]:i[2]))}),!s.length&&t.key&&s.push(t.key+"="),s.join("&")},toArray:function(t){var i=this._getItemsAsjQuery(t&&t.connected),s=[];return t=t||{},i.each(function(){s.push(e(t.item||this).attr(t.attribute||"id")||"")}),s},_intersectsWith:function(e){var t=this.positionAbs.left,i=t+this.helperProportions.width,s=this.positionAbs.top,n=s+this.helperProportions.height,a=e.left,o=a+e.width,r=e.top,h=r+e.height,l=this.offset.click.top,u=this.offset.click.left,d="x"===this.options.axis||s+l>r&&h>s+l,c="y"===this.options.axis||t+u>a&&o>t+u,p=d&&c;return"pointer"===this.options.tolerance||this.options.forcePointerForContainers||"pointer"!==this.options.tolerance&&this.helperProportions[this.floating?"width":"height"]>e[this.floating?"width":"height"]?p:t+this.helperProportions.width/2>a&&o>i-this.helperProportions.width/2&&s+this.helperProportions.height/2>r&&h>n-this.helperProportions.height/2},_intersectsWithPointer:function(e){var t="x"===this.options.axis||this._isOverAxis(this.positionAbs.top+this.offset.click.top,e.top,e.height),i="y"===this.options.axis||this._isOverAxis(this.positionAbs.left+this.offset.click.left,e.left,e.width),s=t&&i,n=this._getDragVerticalDirection(),a=this._getDragHorizontalDirection();return s?this.floating?a&&"right"===a||"down"===n?2:1:n&&("down"===n?2:1):!1},_intersectsWithSides:function(e){var t=this._isOverAxis(this.positionAbs.top+this.offset.click.top,e.top+e.height/2,e.height),i=this._isOverAxis(this.positionAbs.left+this.offset.click.left,e.left+e.width/2,e.width),s=this._getDragVerticalDirection(),n=this._getDragHorizontalDirection();return this.floating&&n?"right"===n&&i||"left"===n&&!i:s&&("down"===s&&t||"up"===s&&!t)},_getDragVerticalDirection:function(){var e=this.positionAbs.top-this.lastPositionAbs.top;return 0!==e&&(e>0?"down":"up")},_getDragHorizontalDirection:function(){var e=this.positionAbs.left-this.lastPositionAbs.left;return 0!==e&&(e>0?"right":"left")},refresh:function(e){return this._refreshItems(e),this._setHandleClassName(),this.refreshPositions(),this},_connectWith:function(){var e=this.options;return e.connectWith.constructor===String?[e.connectWith]:e.connectWith},_getItemsAsjQuery:function(t){function i(){r.push(this)}var s,n,a,o,r=[],h=[],l=this._connectWith();if(l&&t)for(s=l.length-1;s>=0;s--)for(a=e(l[s],this.document[0]),n=a.length-1;n>=0;n--)o=e.data(a[n],this.widgetFullName),o&&o!==this&&!o.options.disabled&&h.push([e.isFunction(o.options.items)?o.options.items.call(o.element):e(o.options.items,o.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"),o]);for(h.push([e.isFunction(this.options.items)?this.options.items.call(this.element,null,{options:this.options,item:this.currentItem}):e(this.options.items,this.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"),this]),s=h.length-1;s>=0;s--)h[s][0].each(i);return e(r)},_removeCurrentsFromItems:function(){var t=this.currentItem.find(":data("+this.widgetName+"-item)");this.items=e.grep(this.items,function(e){for(var i=0;t.length>i;i++)if(t[i]===e.item[0])return!1;return!0})},_refreshItems:function(t){this.items=[],this.containers=[this];var i,s,n,a,o,r,h,l,u=this.items,d=[[e.isFunction(this.options.items)?this.options.items.call(this.element[0],t,{item:this.currentItem}):e(this.options.items,this.element),this]],c=this._connectWith();if(c&&this.ready)for(i=c.length-1;i>=0;i--)for(n=e(c[i],this.document[0]),s=n.length-1;s>=0;s--)a=e.data(n[s],this.widgetFullName),a&&a!==this&&!a.options.disabled&&(d.push([e.isFunction(a.options.items)?a.options.items.call(a.element[0],t,{item:this.currentItem}):e(a.options.items,a.element),a]),this.containers.push(a));for(i=d.length-1;i>=0;i--)for(o=d[i][1],r=d[i][0],s=0,l=r.length;l>s;s++)h=e(r[s]),h.data(this.widgetName+"-item",o),u.push({item:h,instance:o,width:0,height:0,left:0,top:0})},refreshPositions:function(t){this.floating=this.items.length?"x"===this.options.axis||this._isFloating(this.items[0].item):!1,this.offsetParent&&this.helper&&(this.offset.parent=this._getParentOffset());var i,s,n,a;for(i=this.items.length-1;i>=0;i--)s=this.items[i],s.instance!==this.currentContainer&&this.currentContainer&&s.item[0]!==this.currentItem[0]||(n=this.options.toleranceElement?e(this.options.toleranceElement,s.item):s.item,t||(s.width=n.outerWidth(),s.height=n.outerHeight()),a=n.offset(),s.left=a.left,s.top=a.top);if(this.options.custom&&this.options.custom.refreshContainers)this.options.custom.refreshContainers.call(this);else for(i=this.containers.length-1;i>=0;i--)a=this.containers[i].element.offset(),this.containers[i].containerCache.left=a.left,this.containers[i].containerCache.top=a.top,this.containers[i].containerCache.width=this.containers[i].element.outerWidth(),this.containers[i].containerCache.height=this.containers[i].element.outerHeight();return this},_createPlaceholder:function(t){t=t||this;var i,s=t.options;s.placeholder&&s.placeholder.constructor!==String||(i=s.placeholder,s.placeholder={element:function(){var s=t.currentItem[0].nodeName.toLowerCase(),n=e("<"+s+">",t.document[0]).addClass(i||t.currentItem[0].className+" ui-sortable-placeholder").removeClass("ui-sortable-helper");return"tbody"===s?t._createTrPlaceholder(t.currentItem.find("tr").eq(0),e("<tr>",t.document[0]).appendTo(n)):"tr"===s?t._createTrPlaceholder(t.currentItem,n):"img"===s&&n.attr("src",t.currentItem.attr("src")),i||n.css("visibility","hidden"),n},update:function(e,n){(!i||s.forcePlaceholderSize)&&(n.height()||n.height(t.currentItem.innerHeight()-parseInt(t.currentItem.css("paddingTop")||0,10)-parseInt(t.currentItem.css("paddingBottom")||0,10)),n.width()||n.width(t.currentItem.innerWidth()-parseInt(t.currentItem.css("paddingLeft")||0,10)-parseInt(t.currentItem.css("paddingRight")||0,10)))}}),t.placeholder=e(s.placeholder.element.call(t.element,t.currentItem)),t.currentItem.after(t.placeholder),s.placeholder.update(t,t.placeholder)},_createTrPlaceholder:function(t,i){var s=this;t.children().each(function(){e("<td>&#160;</td>",s.document[0]).attr("colspan",e(this).attr("colspan")||1).appendTo(i)})},_contactContainers:function(t){var i,s,n,a,o,r,h,l,u,d,c=null,p=null;for(i=this.containers.length-1;i>=0;i--)if(!e.contains(this.currentItem[0],this.containers[i].element[0]))if(this._intersectsWith(this.containers[i].containerCache)){if(c&&e.contains(this.containers[i].element[0],c.element[0]))continue;c=this.containers[i],p=i}else this.containers[i].containerCache.over&&(this.containers[i]._trigger("out",t,this._uiHash(this)),this.containers[i].containerCache.over=0);if(c)if(1===this.containers.length)this.containers[p].containerCache.over||(this.containers[p]._trigger("over",t,this._uiHash(this)),this.containers[p].containerCache.over=1);else{for(n=1e4,a=null,u=c.floating||this._isFloating(this.currentItem),o=u?"left":"top",r=u?"width":"height",d=u?"clientX":"clientY",s=this.items.length-1;s>=0;s--)e.contains(this.containers[p].element[0],this.items[s].item[0])&&this.items[s].item[0]!==this.currentItem[0]&&(h=this.items[s].item.offset()[o],l=!1,t[d]-h>this.items[s][r]/2&&(l=!0),n>Math.abs(t[d]-h)&&(n=Math.abs(t[d]-h),a=this.items[s],this.direction=l?"up":"down"));if(!a&&!this.options.dropOnEmpty)return;if(this.currentContainer===this.containers[p])return this.currentContainer.containerCache.over||(this.containers[p]._trigger("over",t,this._uiHash()),this.currentContainer.containerCache.over=1),void 0;a?this._rearrange(t,a,null,!0):this._rearrange(t,null,this.containers[p].element,!0),this._trigger("change",t,this._uiHash()),this.containers[p]._trigger("change",t,this._uiHash(this)),this.currentContainer=this.containers[p],this.options.placeholder.update(this.currentContainer,this.placeholder),this.containers[p]._trigger("over",t,this._uiHash(this)),this.containers[p].containerCache.over=1}},_createHelper:function(t){var i=this.options,s=e.isFunction(i.helper)?e(i.helper.apply(this.element[0],[t,this.currentItem])):"clone"===i.helper?this.currentItem.clone():this.currentItem;return s.parents("body").length||e("parent"!==i.appendTo?i.appendTo:this.currentItem[0].parentNode)[0].appendChild(s[0]),s[0]===this.currentItem[0]&&(this._storedCSS={width:this.currentItem[0].style.width,height:this.currentItem[0].style.height,position:this.currentItem.css("position"),top:this.currentItem.css("top"),left:this.currentItem.css("left")}),(!s[0].style.width||i.forceHelperSize)&&s.width(this.currentItem.width()),(!s[0].style.height||i.forceHelperSize)&&s.height(this.currentItem.height()),s},_adjustOffsetFromHelper:function(t){"string"==typeof t&&(t=t.split(" ")),e.isArray(t)&&(t={left:+t[0],top:+t[1]||0}),"left"in t&&(this.offset.click.left=t.left+this.margins.left),"right"in t&&(this.offset.click.left=this.helperProportions.width-t.right+this.margins.left),"top"in t&&(this.offset.click.top=t.top+this.margins.top),"bottom"in t&&(this.offset.click.top=this.helperProportions.height-t.bottom+this.margins.top)},_getParentOffset:function(){this.offsetParent=this.helper.offsetParent();var t=this.offsetParent.offset();return"absolute"===this.cssPosition&&this.scrollParent[0]!==this.document[0]&&e.contains(this.scrollParent[0],this.offsetParent[0])&&(t.left+=this.scrollParent.scrollLeft(),t.top+=this.scrollParent.scrollTop()),(this.offsetParent[0]===this.document[0].body||this.offsetParent[0].tagName&&"html"===this.offsetParent[0].tagName.toLowerCase()&&e.ui.ie)&&(t={top:0,left:0}),{top:t.top+(parseInt(this.offsetParent.css("borderTopWidth"),10)||0),left:t.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}},_getRelativeOffset:function(){if("relative"===this.cssPosition){var e=this.currentItem.position();return{top:e.top-(parseInt(this.helper.css("top"),10)||0)+this.scrollParent.scrollTop(),left:e.left-(parseInt(this.helper.css("left"),10)||0)+this.scrollParent.scrollLeft()}}return{top:0,left:0}},_cacheMargins:function(){this.margins={left:parseInt(this.currentItem.css("marginLeft"),10)||0,top:parseInt(this.currentItem.css("marginTop"),10)||0}},_cacheHelperProportions:function(){this.helperProportions={width:this.helper.outerWidth(),height:this.helper.outerHeight()}},_setContainment:function(){var t,i,s,n=this.options;"parent"===n.containment&&(n.containment=this.helper[0].parentNode),("document"===n.containment||"window"===n.containment)&&(this.containment=[0-this.offset.relative.left-this.offset.parent.left,0-this.offset.relative.top-this.offset.parent.top,"document"===n.containment?this.document.width():this.window.width()-this.helperProportions.width-this.margins.left,("document"===n.containment?this.document.width():this.window.height()||this.document[0].body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top]),/^(document|window|parent)$/.test(n.containment)||(t=e(n.containment)[0],i=e(n.containment).offset(),s="hidden"!==e(t).css("overflow"),this.containment=[i.left+(parseInt(e(t).css("borderLeftWidth"),10)||0)+(parseInt(e(t).css("paddingLeft"),10)||0)-this.margins.left,i.top+(parseInt(e(t).css("borderTopWidth"),10)||0)+(parseInt(e(t).css("paddingTop"),10)||0)-this.margins.top,i.left+(s?Math.max(t.scrollWidth,t.offsetWidth):t.offsetWidth)-(parseInt(e(t).css("borderLeftWidth"),10)||0)-(parseInt(e(t).css("paddingRight"),10)||0)-this.helperProportions.width-this.margins.left,i.top+(s?Math.max(t.scrollHeight,t.offsetHeight):t.offsetHeight)-(parseInt(e(t).css("borderTopWidth"),10)||0)-(parseInt(e(t).css("paddingBottom"),10)||0)-this.helperProportions.height-this.margins.top])},_convertPositionTo:function(t,i){i||(i=this.position);var s="absolute"===t?1:-1,n="absolute"!==this.cssPosition||this.scrollParent[0]!==this.document[0]&&e.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,a=/(html|body)/i.test(n[0].tagName);return{top:i.top+this.offset.relative.top*s+this.offset.parent.top*s-("fixed"===this.cssPosition?-this.scrollParent.scrollTop():a?0:n.scrollTop())*s,left:i.left+this.offset.relative.left*s+this.offset.parent.left*s-("fixed"===this.cssPosition?-this.scrollParent.scrollLeft():a?0:n.scrollLeft())*s}},_generatePosition:function(t){var i,s,n=this.options,a=t.pageX,o=t.pageY,r="absolute"!==this.cssPosition||this.scrollParent[0]!==this.document[0]&&e.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,h=/(html|body)/i.test(r[0].tagName);return"relative"!==this.cssPosition||this.scrollParent[0]!==this.document[0]&&this.scrollParent[0]!==this.offsetParent[0]||(this.offset.relative=this._getRelativeOffset()),this.originalPosition&&(this.containment&&(t.pageX-this.offset.click.left<this.containment[0]&&(a=this.containment[0]+this.offset.click.left),t.pageY-this.offset.click.top<this.containment[1]&&(o=this.containment[1]+this.offset.click.top),t.pageX-this.offset.click.left>this.containment[2]&&(a=this.containment[2]+this.offset.click.left),t.pageY-this.offset.click.top>this.containment[3]&&(o=this.containment[3]+this.offset.click.top)),n.grid&&(i=this.originalPageY+Math.round((o-this.originalPageY)/n.grid[1])*n.grid[1],o=this.containment?i-this.offset.click.top>=this.containment[1]&&i-this.offset.click.top<=this.containment[3]?i:i-this.offset.click.top>=this.containment[1]?i-n.grid[1]:i+n.grid[1]:i,s=this.originalPageX+Math.round((a-this.originalPageX)/n.grid[0])*n.grid[0],a=this.containment?s-this.offset.click.left>=this.containment[0]&&s-this.offset.click.left<=this.containment[2]?s:s-this.offset.click.left>=this.containment[0]?s-n.grid[0]:s+n.grid[0]:s)),{top:o-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+("fixed"===this.cssPosition?-this.scrollParent.scrollTop():h?0:r.scrollTop()),left:a-this.offset.click.left-this.offset.relative.left-this.offset.parent.left+("fixed"===this.cssPosition?-this.scrollParent.scrollLeft():h?0:r.scrollLeft())}},_rearrange:function(e,t,i,s){i?i[0].appendChild(this.placeholder[0]):t.item[0].parentNode.insertBefore(this.placeholder[0],"down"===this.direction?t.item[0]:t.item[0].nextSibling),this.counter=this.counter?++this.counter:1;var n=this.counter;this._delay(function(){n===this.counter&&this.refreshPositions(!s)})},_clear:function(e,t){function i(e,t,i){return function(s){i._trigger(e,s,t._uiHash(t))}}this.reverting=!1;var s,n=[];if(!this._noFinalSort&&this.currentItem.parent().length&&this.placeholder.before(this.currentItem),this._noFinalSort=null,this.helper[0]===this.currentItem[0]){for(s in this._storedCSS)("auto"===this._storedCSS[s]||"static"===this._storedCSS[s])&&(this._storedCSS[s]="");this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper")}else this.currentItem.show();for(this.fromOutside&&!t&&n.push(function(e){this._trigger("receive",e,this._uiHash(this.fromOutside))}),!this.fromOutside&&this.domPosition.prev===this.currentItem.prev().not(".ui-sortable-helper")[0]&&this.domPosition.parent===this.currentItem.parent()[0]||t||n.push(function(e){this._trigger("update",e,this._uiHash())}),this!==this.currentContainer&&(t||(n.push(function(e){this._trigger("remove",e,this._uiHash())}),n.push(function(e){return function(t){e._trigger("receive",t,this._uiHash(this))}}.call(this,this.currentContainer)),n.push(function(e){return function(t){e._trigger("update",t,this._uiHash(this))}}.call(this,this.currentContainer)))),s=this.containers.length-1;s>=0;s--)t||n.push(i("deactivate",this,this.containers[s])),this.containers[s].containerCache.over&&(n.push(i("out",this,this.containers[s])),this.containers[s].containerCache.over=0);if(this.storedCursor&&(this.document.find("body").css("cursor",this.storedCursor),this.storedStylesheet.remove()),this._storedOpacity&&this.helper.css("opacity",this._storedOpacity),this._storedZIndex&&this.helper.css("zIndex","auto"===this._storedZIndex?"":this._storedZIndex),this.dragging=!1,t||this._trigger("beforeStop",e,this._uiHash()),this.placeholder[0].parentNode.removeChild(this.placeholder[0]),this.cancelHelperRemoval||(this.helper[0]!==this.currentItem[0]&&this.helper.remove(),this.helper=null),!t){for(s=0;n.length>s;s++)n[s].call(this,e);this._trigger("stop",e,this._uiHash())}return this.fromOutside=!1,!this.cancelHelperRemoval},_trigger:function(){e.Widget.prototype._trigger.apply(this,arguments)===!1&&this.cancel()},_uiHash:function(t){var i=t||this;return{helper:i.helper,placeholder:i.placeholder||e([]),position:i.position,originalPosition:i.originalPosition,offset:i.positionAbs,item:i.currentItem,sender:t?t.element:null}}}),e.widget("ui.accordion",{version:"1.11.4",options:{active:0,animate:{},collapsible:!1,event:"click",header:"> li > :first-child,> :not(li):even",heightStyle:"auto",icons:{activeHeader:"ui-icon-triangle-1-s",header:"ui-icon-triangle-1-e"},activate:null,beforeActivate:null},hideProps:{borderTopWidth:"hide",borderBottomWidth:"hide",paddingTop:"hide",paddingBottom:"hide",height:"hide"},showProps:{borderTopWidth:"show",borderBottomWidth:"show",paddingTop:"show",paddingBottom:"show",height:"show"},_create:function(){var t=this.options;this.prevShow=this.prevHide=e(),this.element.addClass("ui-accordion ui-widget ui-helper-reset").attr("role","tablist"),t.collapsible||t.active!==!1&&null!=t.active||(t.active=0),this._processPanels(),0>t.active&&(t.active+=this.headers.length),this._refresh()},_getCreateEventData:function(){return{header:this.active,panel:this.active.length?this.active.next():e()}},_createIcons:function(){var t=this.options.icons;t&&(e("<span>").addClass("ui-accordion-header-icon ui-icon "+t.header).prependTo(this.headers),this.active.children(".ui-accordion-header-icon").removeClass(t.header).addClass(t.activeHeader),this.headers.addClass("ui-accordion-icons"))},_destroyIcons:function(){this.headers.removeClass("ui-accordion-icons").children(".ui-accordion-header-icon").remove()},_destroy:function(){var e;this.element.removeClass("ui-accordion ui-widget ui-helper-reset").removeAttr("role"),this.headers.removeClass("ui-accordion-header ui-accordion-header-active ui-state-default ui-corner-all ui-state-active ui-state-disabled ui-corner-top").removeAttr("role").removeAttr("aria-expanded").removeAttr("aria-selected").removeAttr("aria-controls").removeAttr("tabIndex").removeUniqueId(),this._destroyIcons(),e=this.headers.next().removeClass("ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content ui-accordion-content-active ui-state-disabled").css("display","").removeAttr("role").removeAttr("aria-hidden").removeAttr("aria-labelledby").removeUniqueId(),"content"!==this.options.heightStyle&&e.css("height","")},_setOption:function(e,t){return"active"===e?(this._activate(t),void 0):("event"===e&&(this.options.event&&this._off(this.headers,this.options.event),this._setupEvents(t)),this._super(e,t),"collapsible"!==e||t||this.options.active!==!1||this._activate(0),"icons"===e&&(this._destroyIcons(),t&&this._createIcons()),"disabled"===e&&(this.element.toggleClass("ui-state-disabled",!!t).attr("aria-disabled",t),this.headers.add(this.headers.next()).toggleClass("ui-state-disabled",!!t)),void 0)},_keydown:function(t){if(!t.altKey&&!t.ctrlKey){var i=e.ui.keyCode,s=this.headers.length,n=this.headers.index(t.target),a=!1;switch(t.keyCode){case i.RIGHT:case i.DOWN:a=this.headers[(n+1)%s];break;case i.LEFT:case i.UP:a=this.headers[(n-1+s)%s];break;case i.SPACE:case i.ENTER:this._eventHandler(t);break;case i.HOME:a=this.headers[0];break;case i.END:a=this.headers[s-1]}a&&(e(t.target).attr("tabIndex",-1),e(a).attr("tabIndex",0),a.focus(),t.preventDefault())}},_panelKeyDown:function(t){t.keyCode===e.ui.keyCode.UP&&t.ctrlKey&&e(t.currentTarget).prev().focus()},refresh:function(){var t=this.options;this._processPanels(),t.active===!1&&t.collapsible===!0||!this.headers.length?(t.active=!1,this.active=e()):t.active===!1?this._activate(0):this.active.length&&!e.contains(this.element[0],this.active[0])?this.headers.length===this.headers.find(".ui-state-disabled").length?(t.active=!1,this.active=e()):this._activate(Math.max(0,t.active-1)):t.active=this.headers.index(this.active),this._destroyIcons(),this._refresh()},_processPanels:function(){var e=this.headers,t=this.panels;this.headers=this.element.find(this.options.header).addClass("ui-accordion-header ui-state-default ui-corner-all"),this.panels=this.headers.next().addClass("ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom").filter(":not(.ui-accordion-content-active)").hide(),t&&(this._off(e.not(this.headers)),this._off(t.not(this.panels)))
},_refresh:function(){var t,i=this.options,s=i.heightStyle,n=this.element.parent();this.active=this._findActive(i.active).addClass("ui-accordion-header-active ui-state-active ui-corner-top").removeClass("ui-corner-all"),this.active.next().addClass("ui-accordion-content-active").show(),this.headers.attr("role","tab").each(function(){var t=e(this),i=t.uniqueId().attr("id"),s=t.next(),n=s.uniqueId().attr("id");t.attr("aria-controls",n),s.attr("aria-labelledby",i)}).next().attr("role","tabpanel"),this.headers.not(this.active).attr({"aria-selected":"false","aria-expanded":"false",tabIndex:-1}).next().attr({"aria-hidden":"true"}).hide(),this.active.length?this.active.attr({"aria-selected":"true","aria-expanded":"true",tabIndex:0}).next().attr({"aria-hidden":"false"}):this.headers.eq(0).attr("tabIndex",0),this._createIcons(),this._setupEvents(i.event),"fill"===s?(t=n.height(),this.element.siblings(":visible").each(function(){var i=e(this),s=i.css("position");"absolute"!==s&&"fixed"!==s&&(t-=i.outerHeight(!0))}),this.headers.each(function(){t-=e(this).outerHeight(!0)}),this.headers.next().each(function(){e(this).height(Math.max(0,t-e(this).innerHeight()+e(this).height()))}).css("overflow","auto")):"auto"===s&&(t=0,this.headers.next().each(function(){t=Math.max(t,e(this).css("height","").height())}).height(t))},_activate:function(t){var i=this._findActive(t)[0];i!==this.active[0]&&(i=i||this.active[0],this._eventHandler({target:i,currentTarget:i,preventDefault:e.noop}))},_findActive:function(t){return"number"==typeof t?this.headers.eq(t):e()},_setupEvents:function(t){var i={keydown:"_keydown"};t&&e.each(t.split(" "),function(e,t){i[t]="_eventHandler"}),this._off(this.headers.add(this.headers.next())),this._on(this.headers,i),this._on(this.headers.next(),{keydown:"_panelKeyDown"}),this._hoverable(this.headers),this._focusable(this.headers)},_eventHandler:function(t){var i=this.options,s=this.active,n=e(t.currentTarget),a=n[0]===s[0],o=a&&i.collapsible,r=o?e():n.next(),h=s.next(),l={oldHeader:s,oldPanel:h,newHeader:o?e():n,newPanel:r};t.preventDefault(),a&&!i.collapsible||this._trigger("beforeActivate",t,l)===!1||(i.active=o?!1:this.headers.index(n),this.active=a?e():n,this._toggle(l),s.removeClass("ui-accordion-header-active ui-state-active"),i.icons&&s.children(".ui-accordion-header-icon").removeClass(i.icons.activeHeader).addClass(i.icons.header),a||(n.removeClass("ui-corner-all").addClass("ui-accordion-header-active ui-state-active ui-corner-top"),i.icons&&n.children(".ui-accordion-header-icon").removeClass(i.icons.header).addClass(i.icons.activeHeader),n.next().addClass("ui-accordion-content-active")))},_toggle:function(t){var i=t.newPanel,s=this.prevShow.length?this.prevShow:t.oldPanel;this.prevShow.add(this.prevHide).stop(!0,!0),this.prevShow=i,this.prevHide=s,this.options.animate?this._animate(i,s,t):(s.hide(),i.show(),this._toggleComplete(t)),s.attr({"aria-hidden":"true"}),s.prev().attr({"aria-selected":"false","aria-expanded":"false"}),i.length&&s.length?s.prev().attr({tabIndex:-1,"aria-expanded":"false"}):i.length&&this.headers.filter(function(){return 0===parseInt(e(this).attr("tabIndex"),10)}).attr("tabIndex",-1),i.attr("aria-hidden","false").prev().attr({"aria-selected":"true","aria-expanded":"true",tabIndex:0})},_animate:function(e,t,i){var s,n,a,o=this,r=0,h=e.css("box-sizing"),l=e.length&&(!t.length||e.index()<t.index()),u=this.options.animate||{},d=l&&u.down||u,c=function(){o._toggleComplete(i)};return"number"==typeof d&&(a=d),"string"==typeof d&&(n=d),n=n||d.easing||u.easing,a=a||d.duration||u.duration,t.length?e.length?(s=e.show().outerHeight(),t.animate(this.hideProps,{duration:a,easing:n,step:function(e,t){t.now=Math.round(e)}}),e.hide().animate(this.showProps,{duration:a,easing:n,complete:c,step:function(e,i){i.now=Math.round(e),"height"!==i.prop?"content-box"===h&&(r+=i.now):"content"!==o.options.heightStyle&&(i.now=Math.round(s-t.outerHeight()-r),r=0)}}),void 0):t.animate(this.hideProps,a,n,c):e.animate(this.showProps,a,n,c)},_toggleComplete:function(e){var t=e.oldPanel;t.removeClass("ui-accordion-content-active").prev().removeClass("ui-corner-top").addClass("ui-corner-all"),t.length&&(t.parent()[0].className=t.parent()[0].className),this._trigger("activate",null,e)}}),e.widget("ui.menu",{version:"1.11.4",defaultElement:"<ul>",delay:300,options:{icons:{submenu:"ui-icon-carat-1-e"},items:"> *",menus:"ul",position:{my:"left-1 top",at:"right top"},role:"menu",blur:null,focus:null,select:null},_create:function(){this.activeMenu=this.element,this.mouseHandled=!1,this.element.uniqueId().addClass("ui-menu ui-widget ui-widget-content").toggleClass("ui-menu-icons",!!this.element.find(".ui-icon").length).attr({role:this.options.role,tabIndex:0}),this.options.disabled&&this.element.addClass("ui-state-disabled").attr("aria-disabled","true"),this._on({"mousedown .ui-menu-item":function(e){e.preventDefault()},"click .ui-menu-item":function(t){var i=e(t.target);!this.mouseHandled&&i.not(".ui-state-disabled").length&&(this.select(t),t.isPropagationStopped()||(this.mouseHandled=!0),i.has(".ui-menu").length?this.expand(t):!this.element.is(":focus")&&e(this.document[0].activeElement).closest(".ui-menu").length&&(this.element.trigger("focus",[!0]),this.active&&1===this.active.parents(".ui-menu").length&&clearTimeout(this.timer)))},"mouseenter .ui-menu-item":function(t){if(!this.previousFilter){var i=e(t.currentTarget);i.siblings(".ui-state-active").removeClass("ui-state-active"),this.focus(t,i)}},mouseleave:"collapseAll","mouseleave .ui-menu":"collapseAll",focus:function(e,t){var i=this.active||this.element.find(this.options.items).eq(0);t||this.focus(e,i)},blur:function(t){this._delay(function(){e.contains(this.element[0],this.document[0].activeElement)||this.collapseAll(t)})},keydown:"_keydown"}),this.refresh(),this._on(this.document,{click:function(e){this._closeOnDocumentClick(e)&&this.collapseAll(e),this.mouseHandled=!1}})},_destroy:function(){this.element.removeAttr("aria-activedescendant").find(".ui-menu").addBack().removeClass("ui-menu ui-widget ui-widget-content ui-menu-icons ui-front").removeAttr("role").removeAttr("tabIndex").removeAttr("aria-labelledby").removeAttr("aria-expanded").removeAttr("aria-hidden").removeAttr("aria-disabled").removeUniqueId().show(),this.element.find(".ui-menu-item").removeClass("ui-menu-item").removeAttr("role").removeAttr("aria-disabled").removeUniqueId().removeClass("ui-state-hover").removeAttr("tabIndex").removeAttr("role").removeAttr("aria-haspopup").children().each(function(){var t=e(this);t.data("ui-menu-submenu-carat")&&t.remove()}),this.element.find(".ui-menu-divider").removeClass("ui-menu-divider ui-widget-content")},_keydown:function(t){var i,s,n,a,o=!0;switch(t.keyCode){case e.ui.keyCode.PAGE_UP:this.previousPage(t);break;case e.ui.keyCode.PAGE_DOWN:this.nextPage(t);break;case e.ui.keyCode.HOME:this._move("first","first",t);break;case e.ui.keyCode.END:this._move("last","last",t);break;case e.ui.keyCode.UP:this.previous(t);break;case e.ui.keyCode.DOWN:this.next(t);break;case e.ui.keyCode.LEFT:this.collapse(t);break;case e.ui.keyCode.RIGHT:this.active&&!this.active.is(".ui-state-disabled")&&this.expand(t);break;case e.ui.keyCode.ENTER:case e.ui.keyCode.SPACE:this._activate(t);break;case e.ui.keyCode.ESCAPE:this.collapse(t);break;default:o=!1,s=this.previousFilter||"",n=String.fromCharCode(t.keyCode),a=!1,clearTimeout(this.filterTimer),n===s?a=!0:n=s+n,i=this._filterMenuItems(n),i=a&&-1!==i.index(this.active.next())?this.active.nextAll(".ui-menu-item"):i,i.length||(n=String.fromCharCode(t.keyCode),i=this._filterMenuItems(n)),i.length?(this.focus(t,i),this.previousFilter=n,this.filterTimer=this._delay(function(){delete this.previousFilter},1e3)):delete this.previousFilter}o&&t.preventDefault()},_activate:function(e){this.active.is(".ui-state-disabled")||(this.active.is("[aria-haspopup='true']")?this.expand(e):this.select(e))},refresh:function(){var t,i,s=this,n=this.options.icons.submenu,a=this.element.find(this.options.menus);this.element.toggleClass("ui-menu-icons",!!this.element.find(".ui-icon").length),a.filter(":not(.ui-menu)").addClass("ui-menu ui-widget ui-widget-content ui-front").hide().attr({role:this.options.role,"aria-hidden":"true","aria-expanded":"false"}).each(function(){var t=e(this),i=t.parent(),s=e("<span>").addClass("ui-menu-icon ui-icon "+n).data("ui-menu-submenu-carat",!0);i.attr("aria-haspopup","true").prepend(s),t.attr("aria-labelledby",i.attr("id"))}),t=a.add(this.element),i=t.find(this.options.items),i.not(".ui-menu-item").each(function(){var t=e(this);s._isDivider(t)&&t.addClass("ui-widget-content ui-menu-divider")}),i.not(".ui-menu-item, .ui-menu-divider").addClass("ui-menu-item").uniqueId().attr({tabIndex:-1,role:this._itemRole()}),i.filter(".ui-state-disabled").attr("aria-disabled","true"),this.active&&!e.contains(this.element[0],this.active[0])&&this.blur()},_itemRole:function(){return{menu:"menuitem",listbox:"option"}[this.options.role]},_setOption:function(e,t){"icons"===e&&this.element.find(".ui-menu-icon").removeClass(this.options.icons.submenu).addClass(t.submenu),"disabled"===e&&this.element.toggleClass("ui-state-disabled",!!t).attr("aria-disabled",t),this._super(e,t)},focus:function(e,t){var i,s;this.blur(e,e&&"focus"===e.type),this._scrollIntoView(t),this.active=t.first(),s=this.active.addClass("ui-state-focus").removeClass("ui-state-active"),this.options.role&&this.element.attr("aria-activedescendant",s.attr("id")),this.active.parent().closest(".ui-menu-item").addClass("ui-state-active"),e&&"keydown"===e.type?this._close():this.timer=this._delay(function(){this._close()},this.delay),i=t.children(".ui-menu"),i.length&&e&&/^mouse/.test(e.type)&&this._startOpening(i),this.activeMenu=t.parent(),this._trigger("focus",e,{item:t})},_scrollIntoView:function(t){var i,s,n,a,o,r;this._hasScroll()&&(i=parseFloat(e.css(this.activeMenu[0],"borderTopWidth"))||0,s=parseFloat(e.css(this.activeMenu[0],"paddingTop"))||0,n=t.offset().top-this.activeMenu.offset().top-i-s,a=this.activeMenu.scrollTop(),o=this.activeMenu.height(),r=t.outerHeight(),0>n?this.activeMenu.scrollTop(a+n):n+r>o&&this.activeMenu.scrollTop(a+n-o+r))},blur:function(e,t){t||clearTimeout(this.timer),this.active&&(this.active.removeClass("ui-state-focus"),this.active=null,this._trigger("blur",e,{item:this.active}))},_startOpening:function(e){clearTimeout(this.timer),"true"===e.attr("aria-hidden")&&(this.timer=this._delay(function(){this._close(),this._open(e)},this.delay))},_open:function(t){var i=e.extend({of:this.active},this.options.position);clearTimeout(this.timer),this.element.find(".ui-menu").not(t.parents(".ui-menu")).hide().attr("aria-hidden","true"),t.show().removeAttr("aria-hidden").attr("aria-expanded","true").position(i)},collapseAll:function(t,i){clearTimeout(this.timer),this.timer=this._delay(function(){var s=i?this.element:e(t&&t.target).closest(this.element.find(".ui-menu"));s.length||(s=this.element),this._close(s),this.blur(t),this.activeMenu=s},this.delay)},_close:function(e){e||(e=this.active?this.active.parent():this.element),e.find(".ui-menu").hide().attr("aria-hidden","true").attr("aria-expanded","false").end().find(".ui-state-active").not(".ui-state-focus").removeClass("ui-state-active")},_closeOnDocumentClick:function(t){return!e(t.target).closest(".ui-menu").length},_isDivider:function(e){return!/[^\-\u2014\u2013\s]/.test(e.text())},collapse:function(e){var t=this.active&&this.active.parent().closest(".ui-menu-item",this.element);t&&t.length&&(this._close(),this.focus(e,t))},expand:function(e){var t=this.active&&this.active.children(".ui-menu ").find(this.options.items).first();t&&t.length&&(this._open(t.parent()),this._delay(function(){this.focus(e,t)}))},next:function(e){this._move("next","first",e)},previous:function(e){this._move("prev","last",e)},isFirstItem:function(){return this.active&&!this.active.prevAll(".ui-menu-item").length},isLastItem:function(){return this.active&&!this.active.nextAll(".ui-menu-item").length},_move:function(e,t,i){var s;this.active&&(s="first"===e||"last"===e?this.active["first"===e?"prevAll":"nextAll"](".ui-menu-item").eq(-1):this.active[e+"All"](".ui-menu-item").eq(0)),s&&s.length&&this.active||(s=this.activeMenu.find(this.options.items)[t]()),this.focus(i,s)},nextPage:function(t){var i,s,n;return this.active?(this.isLastItem()||(this._hasScroll()?(s=this.active.offset().top,n=this.element.height(),this.active.nextAll(".ui-menu-item").each(function(){return i=e(this),0>i.offset().top-s-n}),this.focus(t,i)):this.focus(t,this.activeMenu.find(this.options.items)[this.active?"last":"first"]())),void 0):(this.next(t),void 0)},previousPage:function(t){var i,s,n;return this.active?(this.isFirstItem()||(this._hasScroll()?(s=this.active.offset().top,n=this.element.height(),this.active.prevAll(".ui-menu-item").each(function(){return i=e(this),i.offset().top-s+n>0}),this.focus(t,i)):this.focus(t,this.activeMenu.find(this.options.items).first())),void 0):(this.next(t),void 0)},_hasScroll:function(){return this.element.outerHeight()<this.element.prop("scrollHeight")},select:function(t){this.active=this.active||e(t.target).closest(".ui-menu-item");var i={item:this.active};this.active.has(".ui-menu").length||this.collapseAll(t,!0),this._trigger("select",t,i)},_filterMenuItems:function(t){var i=t.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&"),s=RegExp("^"+i,"i");return this.activeMenu.find(this.options.items).filter(".ui-menu-item").filter(function(){return s.test(e.trim(e(this).text()))})}}),e.widget("ui.autocomplete",{version:"1.11.4",defaultElement:"<input>",options:{appendTo:null,autoFocus:!1,delay:300,minLength:1,position:{my:"left top",at:"left bottom",collision:"none"},source:null,change:null,close:null,focus:null,open:null,response:null,search:null,select:null},requestIndex:0,pending:0,_create:function(){var t,i,s,n=this.element[0].nodeName.toLowerCase(),a="textarea"===n,o="input"===n;this.isMultiLine=a?!0:o?!1:this.element.prop("isContentEditable"),this.valueMethod=this.element[a||o?"val":"text"],this.isNewMenu=!0,this.element.addClass("ui-autocomplete-input").attr("autocomplete","off"),this._on(this.element,{keydown:function(n){if(this.element.prop("readOnly"))return t=!0,s=!0,i=!0,void 0;t=!1,s=!1,i=!1;var a=e.ui.keyCode;switch(n.keyCode){case a.PAGE_UP:t=!0,this._move("previousPage",n);break;case a.PAGE_DOWN:t=!0,this._move("nextPage",n);break;case a.UP:t=!0,this._keyEvent("previous",n);break;case a.DOWN:t=!0,this._keyEvent("next",n);break;case a.ENTER:this.menu.active&&(t=!0,n.preventDefault(),this.menu.select(n));break;case a.TAB:this.menu.active&&this.menu.select(n);break;case a.ESCAPE:this.menu.element.is(":visible")&&(this.isMultiLine||this._value(this.term),this.close(n),n.preventDefault());break;default:i=!0,this._searchTimeout(n)}},keypress:function(s){if(t)return t=!1,(!this.isMultiLine||this.menu.element.is(":visible"))&&s.preventDefault(),void 0;if(!i){var n=e.ui.keyCode;switch(s.keyCode){case n.PAGE_UP:this._move("previousPage",s);break;case n.PAGE_DOWN:this._move("nextPage",s);break;case n.UP:this._keyEvent("previous",s);break;case n.DOWN:this._keyEvent("next",s)}}},input:function(e){return s?(s=!1,e.preventDefault(),void 0):(this._searchTimeout(e),void 0)},focus:function(){this.selectedItem=null,this.previous=this._value()},blur:function(e){return this.cancelBlur?(delete this.cancelBlur,void 0):(clearTimeout(this.searching),this.close(e),this._change(e),void 0)}}),this._initSource(),this.menu=e("<ul>").addClass("ui-autocomplete ui-front").appendTo(this._appendTo()).menu({role:null}).hide().menu("instance"),this._on(this.menu.element,{mousedown:function(t){t.preventDefault(),this.cancelBlur=!0,this._delay(function(){delete this.cancelBlur});var i=this.menu.element[0];e(t.target).closest(".ui-menu-item").length||this._delay(function(){var t=this;this.document.one("mousedown",function(s){s.target===t.element[0]||s.target===i||e.contains(i,s.target)||t.close()})})},menufocus:function(t,i){var s,n;return this.isNewMenu&&(this.isNewMenu=!1,t.originalEvent&&/^mouse/.test(t.originalEvent.type))?(this.menu.blur(),this.document.one("mousemove",function(){e(t.target).trigger(t.originalEvent)}),void 0):(n=i.item.data("ui-autocomplete-item"),!1!==this._trigger("focus",t,{item:n})&&t.originalEvent&&/^key/.test(t.originalEvent.type)&&this._value(n.value),s=i.item.attr("aria-label")||n.value,s&&e.trim(s).length&&(this.liveRegion.children().hide(),e("<div>").text(s).appendTo(this.liveRegion)),void 0)},menuselect:function(e,t){var i=t.item.data("ui-autocomplete-item"),s=this.previous;this.element[0]!==this.document[0].activeElement&&(this.element.focus(),this.previous=s,this._delay(function(){this.previous=s,this.selectedItem=i})),!1!==this._trigger("select",e,{item:i})&&this._value(i.value),this.term=this._value(),this.close(e),this.selectedItem=i}}),this.liveRegion=e("<span>",{role:"status","aria-live":"assertive","aria-relevant":"additions"}).addClass("ui-helper-hidden-accessible").appendTo(this.document[0].body),this._on(this.window,{beforeunload:function(){this.element.removeAttr("autocomplete")}})},_destroy:function(){clearTimeout(this.searching),this.element.removeClass("ui-autocomplete-input").removeAttr("autocomplete"),this.menu.element.remove(),this.liveRegion.remove()},_setOption:function(e,t){this._super(e,t),"source"===e&&this._initSource(),"appendTo"===e&&this.menu.element.appendTo(this._appendTo()),"disabled"===e&&t&&this.xhr&&this.xhr.abort()},_appendTo:function(){var t=this.options.appendTo;return t&&(t=t.jquery||t.nodeType?e(t):this.document.find(t).eq(0)),t&&t[0]||(t=this.element.closest(".ui-front")),t.length||(t=this.document[0].body),t},_initSource:function(){var t,i,s=this;e.isArray(this.options.source)?(t=this.options.source,this.source=function(i,s){s(e.ui.autocomplete.filter(t,i.term))}):"string"==typeof this.options.source?(i=this.options.source,this.source=function(t,n){s.xhr&&s.xhr.abort(),s.xhr=e.ajax({url:i,data:t,dataType:"json",success:function(e){n(e)},error:function(){n([])}})}):this.source=this.options.source},_searchTimeout:function(e){clearTimeout(this.searching),this.searching=this._delay(function(){var t=this.term===this._value(),i=this.menu.element.is(":visible"),s=e.altKey||e.ctrlKey||e.metaKey||e.shiftKey;(!t||t&&!i&&!s)&&(this.selectedItem=null,this.search(null,e))},this.options.delay)},search:function(e,t){return e=null!=e?e:this._value(),this.term=this._value(),e.length<this.options.minLength?this.close(t):this._trigger("search",t)!==!1?this._search(e):void 0},_search:function(e){this.pending++,this.element.addClass("ui-autocomplete-loading"),this.cancelSearch=!1,this.source({term:e},this._response())},_response:function(){var t=++this.requestIndex;return e.proxy(function(e){t===this.requestIndex&&this.__response(e),this.pending--,this.pending||this.element.removeClass("ui-autocomplete-loading")},this)},__response:function(e){e&&(e=this._normalize(e)),this._trigger("response",null,{content:e}),!this.options.disabled&&e&&e.length&&!this.cancelSearch?(this._suggest(e),this._trigger("open")):this._close()},close:function(e){this.cancelSearch=!0,this._close(e)},_close:function(e){this.menu.element.is(":visible")&&(this.menu.element.hide(),this.menu.blur(),this.isNewMenu=!0,this._trigger("close",e))},_change:function(e){this.previous!==this._value()&&this._trigger("change",e,{item:this.selectedItem})},_normalize:function(t){return t.length&&t[0].label&&t[0].value?t:e.map(t,function(t){return"string"==typeof t?{label:t,value:t}:e.extend({},t,{label:t.label||t.value,value:t.value||t.label})})},_suggest:function(t){var i=this.menu.element.empty();this._renderMenu(i,t),this.isNewMenu=!0,this.menu.refresh(),i.show(),this._resizeMenu(),i.position(e.extend({of:this.element},this.options.position)),this.options.autoFocus&&this.menu.next()},_resizeMenu:function(){var e=this.menu.element;e.outerWidth(Math.max(e.width("").outerWidth()+1,this.element.outerWidth()))},_renderMenu:function(t,i){var s=this;e.each(i,function(e,i){s._renderItemData(t,i)})},_renderItemData:function(e,t){return this._renderItem(e,t).data("ui-autocomplete-item",t)},_renderItem:function(t,i){return e("<li>").text(i.label).appendTo(t)},_move:function(e,t){return this.menu.element.is(":visible")?this.menu.isFirstItem()&&/^previous/.test(e)||this.menu.isLastItem()&&/^next/.test(e)?(this.isMultiLine||this._value(this.term),this.menu.blur(),void 0):(this.menu[e](t),void 0):(this.search(null,t),void 0)},widget:function(){return this.menu.element},_value:function(){return this.valueMethod.apply(this.element,arguments)},_keyEvent:function(e,t){(!this.isMultiLine||this.menu.element.is(":visible"))&&(this._move(e,t),t.preventDefault())}}),e.extend(e.ui.autocomplete,{escapeRegex:function(e){return e.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")},filter:function(t,i){var s=RegExp(e.ui.autocomplete.escapeRegex(i),"i");return e.grep(t,function(e){return s.test(e.label||e.value||e)})}}),e.widget("ui.autocomplete",e.ui.autocomplete,{options:{messages:{noResults:"No search results.",results:function(e){return e+(e>1?" results are":" result is")+" available, use up and down arrow keys to navigate."}}},__response:function(t){var i;this._superApply(arguments),this.options.disabled||this.cancelSearch||(i=t&&t.length?this.options.messages.results(t.length):this.options.messages.noResults,this.liveRegion.children().hide(),e("<div>").text(i).appendTo(this.liveRegion))}}),e.ui.autocomplete;var c,p="ui-button ui-widget ui-state-default ui-corner-all",f="ui-button-icons-only ui-button-icon-only ui-button-text-icons ui-button-text-icon-primary ui-button-text-icon-secondary ui-button-text-only",m=function(){var t=e(this);setTimeout(function(){t.find(":ui-button").button("refresh")},1)},g=function(t){var i=t.name,s=t.form,n=e([]);return i&&(i=i.replace(/'/g,"\\'"),n=s?e(s).find("[name='"+i+"'][type=radio]"):e("[name='"+i+"'][type=radio]",t.ownerDocument).filter(function(){return!this.form})),n};e.widget("ui.button",{version:"1.11.4",defaultElement:"<button>",options:{disabled:null,text:!0,label:null,icons:{primary:null,secondary:null}},_create:function(){this.element.closest("form").unbind("reset"+this.eventNamespace).bind("reset"+this.eventNamespace,m),"boolean"!=typeof this.options.disabled?this.options.disabled=!!this.element.prop("disabled"):this.element.prop("disabled",this.options.disabled),this._determineButtonType(),this.hasTitle=!!this.buttonElement.attr("title");var t=this,i=this.options,s="checkbox"===this.type||"radio"===this.type,n=s?"":"ui-state-active";null===i.label&&(i.label="input"===this.type?this.buttonElement.val():this.buttonElement.html()),this._hoverable(this.buttonElement),this.buttonElement.addClass(p).attr("role","button").bind("mouseenter"+this.eventNamespace,function(){i.disabled||this===c&&e(this).addClass("ui-state-active")}).bind("mouseleave"+this.eventNamespace,function(){i.disabled||e(this).removeClass(n)}).bind("click"+this.eventNamespace,function(e){i.disabled&&(e.preventDefault(),e.stopImmediatePropagation())}),this._on({focus:function(){this.buttonElement.addClass("ui-state-focus")},blur:function(){this.buttonElement.removeClass("ui-state-focus")}}),s&&this.element.bind("change"+this.eventNamespace,function(){t.refresh()}),"checkbox"===this.type?this.buttonElement.bind("click"+this.eventNamespace,function(){return i.disabled?!1:void 0}):"radio"===this.type?this.buttonElement.bind("click"+this.eventNamespace,function(){if(i.disabled)return!1;e(this).addClass("ui-state-active"),t.buttonElement.attr("aria-pressed","true");var s=t.element[0];g(s).not(s).map(function(){return e(this).button("widget")[0]}).removeClass("ui-state-active").attr("aria-pressed","false")}):(this.buttonElement.bind("mousedown"+this.eventNamespace,function(){return i.disabled?!1:(e(this).addClass("ui-state-active"),c=this,t.document.one("mouseup",function(){c=null}),void 0)}).bind("mouseup"+this.eventNamespace,function(){return i.disabled?!1:(e(this).removeClass("ui-state-active"),void 0)}).bind("keydown"+this.eventNamespace,function(t){return i.disabled?!1:((t.keyCode===e.ui.keyCode.SPACE||t.keyCode===e.ui.keyCode.ENTER)&&e(this).addClass("ui-state-active"),void 0)}).bind("keyup"+this.eventNamespace+" blur"+this.eventNamespace,function(){e(this).removeClass("ui-state-active")}),this.buttonElement.is("a")&&this.buttonElement.keyup(function(t){t.keyCode===e.ui.keyCode.SPACE&&e(this).click()})),this._setOption("disabled",i.disabled),this._resetButton()},_determineButtonType:function(){var e,t,i;this.type=this.element.is("[type=checkbox]")?"checkbox":this.element.is("[type=radio]")?"radio":this.element.is("input")?"input":"button","checkbox"===this.type||"radio"===this.type?(e=this.element.parents().last(),t="label[for='"+this.element.attr("id")+"']",this.buttonElement=e.find(t),this.buttonElement.length||(e=e.length?e.siblings():this.element.siblings(),this.buttonElement=e.filter(t),this.buttonElement.length||(this.buttonElement=e.find(t))),this.element.addClass("ui-helper-hidden-accessible"),i=this.element.is(":checked"),i&&this.buttonElement.addClass("ui-state-active"),this.buttonElement.prop("aria-pressed",i)):this.buttonElement=this.element},widget:function(){return this.buttonElement},_destroy:function(){this.element.removeClass("ui-helper-hidden-accessible"),this.buttonElement.removeClass(p+" ui-state-active "+f).removeAttr("role").removeAttr("aria-pressed").html(this.buttonElement.find(".ui-button-text").html()),this.hasTitle||this.buttonElement.removeAttr("title")},_setOption:function(e,t){return this._super(e,t),"disabled"===e?(this.widget().toggleClass("ui-state-disabled",!!t),this.element.prop("disabled",!!t),t&&("checkbox"===this.type||"radio"===this.type?this.buttonElement.removeClass("ui-state-focus"):this.buttonElement.removeClass("ui-state-focus ui-state-active")),void 0):(this._resetButton(),void 0)},refresh:function(){var t=this.element.is("input, button")?this.element.is(":disabled"):this.element.hasClass("ui-button-disabled");t!==this.options.disabled&&this._setOption("disabled",t),"radio"===this.type?g(this.element[0]).each(function(){e(this).is(":checked")?e(this).button("widget").addClass("ui-state-active").attr("aria-pressed","true"):e(this).button("widget").removeClass("ui-state-active").attr("aria-pressed","false")}):"checkbox"===this.type&&(this.element.is(":checked")?this.buttonElement.addClass("ui-state-active").attr("aria-pressed","true"):this.buttonElement.removeClass("ui-state-active").attr("aria-pressed","false"))},_resetButton:function(){if("input"===this.type)return this.options.label&&this.element.val(this.options.label),void 0;var t=this.buttonElement.removeClass(f),i=e("<span></span>",this.document[0]).addClass("ui-button-text").html(this.options.label).appendTo(t.empty()).text(),s=this.options.icons,n=s.primary&&s.secondary,a=[];s.primary||s.secondary?(this.options.text&&a.push("ui-button-text-icon"+(n?"s":s.primary?"-primary":"-secondary")),s.primary&&t.prepend("<span class='ui-button-icon-primary ui-icon "+s.primary+"'></span>"),s.secondary&&t.append("<span class='ui-button-icon-secondary ui-icon "+s.secondary+"'></span>"),this.options.text||(a.push(n?"ui-button-icons-only":"ui-button-icon-only"),this.hasTitle||t.attr("title",e.trim(i)))):a.push("ui-button-text-only"),t.addClass(a.join(" "))}}),e.widget("ui.buttonset",{version:"1.11.4",options:{items:"button, input[type=button], input[type=submit], input[type=reset], input[type=checkbox], input[type=radio], a, :data(ui-button)"},_create:function(){this.element.addClass("ui-buttonset")},_init:function(){this.refresh()},_setOption:function(e,t){"disabled"===e&&this.buttons.button("option",e,t),this._super(e,t)},refresh:function(){var t="rtl"===this.element.css("direction"),i=this.element.find(this.options.items),s=i.filter(":ui-button");i.not(":ui-button").button(),s.button("refresh"),this.buttons=i.map(function(){return e(this).button("widget")[0]}).removeClass("ui-corner-all ui-corner-left ui-corner-right").filter(":first").addClass(t?"ui-corner-right":"ui-corner-left").end().filter(":last").addClass(t?"ui-corner-left":"ui-corner-right").end().end()},_destroy:function(){this.element.removeClass("ui-buttonset"),this.buttons.map(function(){return e(this).button("widget")[0]}).removeClass("ui-corner-left ui-corner-right").end().button("destroy")}}),e.ui.button,e.extend(e.ui,{datepicker:{version:"1.11.4"}});var v;e.extend(n.prototype,{markerClassName:"hasDatepicker",maxRows:4,_widgetDatepicker:function(){return this.dpDiv},setDefaults:function(e){return r(this._defaults,e||{}),this},_attachDatepicker:function(t,i){var s,n,a;s=t.nodeName.toLowerCase(),n="div"===s||"span"===s,t.id||(this.uuid+=1,t.id="dp"+this.uuid),a=this._newInst(e(t),n),a.settings=e.extend({},i||{}),"input"===s?this._connectDatepicker(t,a):n&&this._inlineDatepicker(t,a)},_newInst:function(t,i){var s=t[0].id.replace(/([^A-Za-z0-9_\-])/g,"\\\\$1");return{id:s,input:t,selectedDay:0,selectedMonth:0,selectedYear:0,drawMonth:0,drawYear:0,inline:i,dpDiv:i?a(e("<div class='"+this._inlineClass+" ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>")):this.dpDiv}},_connectDatepicker:function(t,i){var s=e(t);i.append=e([]),i.trigger=e([]),s.hasClass(this.markerClassName)||(this._attachments(s,i),s.addClass(this.markerClassName).keydown(this._doKeyDown).keypress(this._doKeyPress).keyup(this._doKeyUp),this._autoSize(i),e.data(t,"datepicker",i),i.settings.disabled&&this._disableDatepicker(t))},_attachments:function(t,i){var s,n,a,o=this._get(i,"appendText"),r=this._get(i,"isRTL");i.append&&i.append.remove(),o&&(i.append=e("<span class='"+this._appendClass+"'>"+o+"</span>"),t[r?"before":"after"](i.append)),t.unbind("focus",this._showDatepicker),i.trigger&&i.trigger.remove(),s=this._get(i,"showOn"),("focus"===s||"both"===s)&&t.focus(this._showDatepicker),("button"===s||"both"===s)&&(n=this._get(i,"buttonText"),a=this._get(i,"buttonImage"),i.trigger=e(this._get(i,"buttonImageOnly")?e("<img/>").addClass(this._triggerClass).attr({src:a,alt:n,title:n}):e("<button type='button'></button>").addClass(this._triggerClass).html(a?e("<img/>").attr({src:a,alt:n,title:n}):n)),t[r?"before":"after"](i.trigger),i.trigger.click(function(){return e.datepicker._datepickerShowing&&e.datepicker._lastInput===t[0]?e.datepicker._hideDatepicker():e.datepicker._datepickerShowing&&e.datepicker._lastInput!==t[0]?(e.datepicker._hideDatepicker(),e.datepicker._showDatepicker(t[0])):e.datepicker._showDatepicker(t[0]),!1}))},_autoSize:function(e){if(this._get(e,"autoSize")&&!e.inline){var t,i,s,n,a=new Date(2009,11,20),o=this._get(e,"dateFormat");o.match(/[DM]/)&&(t=function(e){for(i=0,s=0,n=0;e.length>n;n++)e[n].length>i&&(i=e[n].length,s=n);return s},a.setMonth(t(this._get(e,o.match(/MM/)?"monthNames":"monthNamesShort"))),a.setDate(t(this._get(e,o.match(/DD/)?"dayNames":"dayNamesShort"))+20-a.getDay())),e.input.attr("size",this._formatDate(e,a).length)}},_inlineDatepicker:function(t,i){var s=e(t);s.hasClass(this.markerClassName)||(s.addClass(this.markerClassName).append(i.dpDiv),e.data(t,"datepicker",i),this._setDate(i,this._getDefaultDate(i),!0),this._updateDatepicker(i),this._updateAlternate(i),i.settings.disabled&&this._disableDatepicker(t),i.dpDiv.css("display","block"))},_dialogDatepicker:function(t,i,s,n,a){var o,h,l,u,d,c=this._dialogInst;return c||(this.uuid+=1,o="dp"+this.uuid,this._dialogInput=e("<input type='text' id='"+o+"' style='position: absolute; top: -100px; width: 0px;'/>"),this._dialogInput.keydown(this._doKeyDown),e("body").append(this._dialogInput),c=this._dialogInst=this._newInst(this._dialogInput,!1),c.settings={},e.data(this._dialogInput[0],"datepicker",c)),r(c.settings,n||{}),i=i&&i.constructor===Date?this._formatDate(c,i):i,this._dialogInput.val(i),this._pos=a?a.length?a:[a.pageX,a.pageY]:null,this._pos||(h=document.documentElement.clientWidth,l=document.documentElement.clientHeight,u=document.documentElement.scrollLeft||document.body.scrollLeft,d=document.documentElement.scrollTop||document.body.scrollTop,this._pos=[h/2-100+u,l/2-150+d]),this._dialogInput.css("left",this._pos[0]+20+"px").css("top",this._pos[1]+"px"),c.settings.onSelect=s,this._inDialog=!0,this.dpDiv.addClass(this._dialogClass),this._showDatepicker(this._dialogInput[0]),e.blockUI&&e.blockUI(this.dpDiv),e.data(this._dialogInput[0],"datepicker",c),this
},_destroyDatepicker:function(t){var i,s=e(t),n=e.data(t,"datepicker");s.hasClass(this.markerClassName)&&(i=t.nodeName.toLowerCase(),e.removeData(t,"datepicker"),"input"===i?(n.append.remove(),n.trigger.remove(),s.removeClass(this.markerClassName).unbind("focus",this._showDatepicker).unbind("keydown",this._doKeyDown).unbind("keypress",this._doKeyPress).unbind("keyup",this._doKeyUp)):("div"===i||"span"===i)&&s.removeClass(this.markerClassName).empty(),v===n&&(v=null))},_enableDatepicker:function(t){var i,s,n=e(t),a=e.data(t,"datepicker");n.hasClass(this.markerClassName)&&(i=t.nodeName.toLowerCase(),"input"===i?(t.disabled=!1,a.trigger.filter("button").each(function(){this.disabled=!1}).end().filter("img").css({opacity:"1.0",cursor:""})):("div"===i||"span"===i)&&(s=n.children("."+this._inlineClass),s.children().removeClass("ui-state-disabled"),s.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled",!1)),this._disabledInputs=e.map(this._disabledInputs,function(e){return e===t?null:e}))},_disableDatepicker:function(t){var i,s,n=e(t),a=e.data(t,"datepicker");n.hasClass(this.markerClassName)&&(i=t.nodeName.toLowerCase(),"input"===i?(t.disabled=!0,a.trigger.filter("button").each(function(){this.disabled=!0}).end().filter("img").css({opacity:"0.5",cursor:"default"})):("div"===i||"span"===i)&&(s=n.children("."+this._inlineClass),s.children().addClass("ui-state-disabled"),s.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled",!0)),this._disabledInputs=e.map(this._disabledInputs,function(e){return e===t?null:e}),this._disabledInputs[this._disabledInputs.length]=t)},_isDisabledDatepicker:function(e){if(!e)return!1;for(var t=0;this._disabledInputs.length>t;t++)if(this._disabledInputs[t]===e)return!0;return!1},_getInst:function(t){try{return e.data(t,"datepicker")}catch(i){throw"Missing instance data for this datepicker"}},_optionDatepicker:function(t,i,s){var n,a,o,h,l=this._getInst(t);return 2===arguments.length&&"string"==typeof i?"defaults"===i?e.extend({},e.datepicker._defaults):l?"all"===i?e.extend({},l.settings):this._get(l,i):null:(n=i||{},"string"==typeof i&&(n={},n[i]=s),l&&(this._curInst===l&&this._hideDatepicker(),a=this._getDateDatepicker(t,!0),o=this._getMinMaxDate(l,"min"),h=this._getMinMaxDate(l,"max"),r(l.settings,n),null!==o&&void 0!==n.dateFormat&&void 0===n.minDate&&(l.settings.minDate=this._formatDate(l,o)),null!==h&&void 0!==n.dateFormat&&void 0===n.maxDate&&(l.settings.maxDate=this._formatDate(l,h)),"disabled"in n&&(n.disabled?this._disableDatepicker(t):this._enableDatepicker(t)),this._attachments(e(t),l),this._autoSize(l),this._setDate(l,a),this._updateAlternate(l),this._updateDatepicker(l)),void 0)},_changeDatepicker:function(e,t,i){this._optionDatepicker(e,t,i)},_refreshDatepicker:function(e){var t=this._getInst(e);t&&this._updateDatepicker(t)},_setDateDatepicker:function(e,t){var i=this._getInst(e);i&&(this._setDate(i,t),this._updateDatepicker(i),this._updateAlternate(i))},_getDateDatepicker:function(e,t){var i=this._getInst(e);return i&&!i.inline&&this._setDateFromField(i,t),i?this._getDate(i):null},_doKeyDown:function(t){var i,s,n,a=e.datepicker._getInst(t.target),o=!0,r=a.dpDiv.is(".ui-datepicker-rtl");if(a._keyEvent=!0,e.datepicker._datepickerShowing)switch(t.keyCode){case 9:e.datepicker._hideDatepicker(),o=!1;break;case 13:return n=e("td."+e.datepicker._dayOverClass+":not(."+e.datepicker._currentClass+")",a.dpDiv),n[0]&&e.datepicker._selectDay(t.target,a.selectedMonth,a.selectedYear,n[0]),i=e.datepicker._get(a,"onSelect"),i?(s=e.datepicker._formatDate(a),i.apply(a.input?a.input[0]:null,[s,a])):e.datepicker._hideDatepicker(),!1;case 27:e.datepicker._hideDatepicker();break;case 33:e.datepicker._adjustDate(t.target,t.ctrlKey?-e.datepicker._get(a,"stepBigMonths"):-e.datepicker._get(a,"stepMonths"),"M");break;case 34:e.datepicker._adjustDate(t.target,t.ctrlKey?+e.datepicker._get(a,"stepBigMonths"):+e.datepicker._get(a,"stepMonths"),"M");break;case 35:(t.ctrlKey||t.metaKey)&&e.datepicker._clearDate(t.target),o=t.ctrlKey||t.metaKey;break;case 36:(t.ctrlKey||t.metaKey)&&e.datepicker._gotoToday(t.target),o=t.ctrlKey||t.metaKey;break;case 37:(t.ctrlKey||t.metaKey)&&e.datepicker._adjustDate(t.target,r?1:-1,"D"),o=t.ctrlKey||t.metaKey,t.originalEvent.altKey&&e.datepicker._adjustDate(t.target,t.ctrlKey?-e.datepicker._get(a,"stepBigMonths"):-e.datepicker._get(a,"stepMonths"),"M");break;case 38:(t.ctrlKey||t.metaKey)&&e.datepicker._adjustDate(t.target,-7,"D"),o=t.ctrlKey||t.metaKey;break;case 39:(t.ctrlKey||t.metaKey)&&e.datepicker._adjustDate(t.target,r?-1:1,"D"),o=t.ctrlKey||t.metaKey,t.originalEvent.altKey&&e.datepicker._adjustDate(t.target,t.ctrlKey?+e.datepicker._get(a,"stepBigMonths"):+e.datepicker._get(a,"stepMonths"),"M");break;case 40:(t.ctrlKey||t.metaKey)&&e.datepicker._adjustDate(t.target,7,"D"),o=t.ctrlKey||t.metaKey;break;default:o=!1}else 36===t.keyCode&&t.ctrlKey?e.datepicker._showDatepicker(this):o=!1;o&&(t.preventDefault(),t.stopPropagation())},_doKeyPress:function(t){var i,s,n=e.datepicker._getInst(t.target);return e.datepicker._get(n,"constrainInput")?(i=e.datepicker._possibleChars(e.datepicker._get(n,"dateFormat")),s=String.fromCharCode(null==t.charCode?t.keyCode:t.charCode),t.ctrlKey||t.metaKey||" ">s||!i||i.indexOf(s)>-1):void 0},_doKeyUp:function(t){var i,s=e.datepicker._getInst(t.target);if(s.input.val()!==s.lastVal)try{i=e.datepicker.parseDate(e.datepicker._get(s,"dateFormat"),s.input?s.input.val():null,e.datepicker._getFormatConfig(s)),i&&(e.datepicker._setDateFromField(s),e.datepicker._updateAlternate(s),e.datepicker._updateDatepicker(s))}catch(n){}return!0},_showDatepicker:function(t){if(t=t.target||t,"input"!==t.nodeName.toLowerCase()&&(t=e("input",t.parentNode)[0]),!e.datepicker._isDisabledDatepicker(t)&&e.datepicker._lastInput!==t){var i,n,a,o,h,l,u;i=e.datepicker._getInst(t),e.datepicker._curInst&&e.datepicker._curInst!==i&&(e.datepicker._curInst.dpDiv.stop(!0,!0),i&&e.datepicker._datepickerShowing&&e.datepicker._hideDatepicker(e.datepicker._curInst.input[0])),n=e.datepicker._get(i,"beforeShow"),a=n?n.apply(t,[t,i]):{},a!==!1&&(r(i.settings,a),i.lastVal=null,e.datepicker._lastInput=t,e.datepicker._setDateFromField(i),e.datepicker._inDialog&&(t.value=""),e.datepicker._pos||(e.datepicker._pos=e.datepicker._findPos(t),e.datepicker._pos[1]+=t.offsetHeight),o=!1,e(t).parents().each(function(){return o|="fixed"===e(this).css("position"),!o}),h={left:e.datepicker._pos[0],top:e.datepicker._pos[1]},e.datepicker._pos=null,i.dpDiv.empty(),i.dpDiv.css({position:"absolute",display:"block",top:"-1000px"}),e.datepicker._updateDatepicker(i),h=e.datepicker._checkOffset(i,h,o),i.dpDiv.css({position:e.datepicker._inDialog&&e.blockUI?"static":o?"fixed":"absolute",display:"none",left:h.left+"px",top:h.top+"px"}),i.inline||(l=e.datepicker._get(i,"showAnim"),u=e.datepicker._get(i,"duration"),i.dpDiv.css("z-index",s(e(t))+1),e.datepicker._datepickerShowing=!0,e.effects&&e.effects.effect[l]?i.dpDiv.show(l,e.datepicker._get(i,"showOptions"),u):i.dpDiv[l||"show"](l?u:null),e.datepicker._shouldFocusInput(i)&&i.input.focus(),e.datepicker._curInst=i))}},_updateDatepicker:function(t){this.maxRows=4,v=t,t.dpDiv.empty().append(this._generateHTML(t)),this._attachHandlers(t);var i,s=this._getNumberOfMonths(t),n=s[1],a=17,r=t.dpDiv.find("."+this._dayOverClass+" a");r.length>0&&o.apply(r.get(0)),t.dpDiv.removeClass("ui-datepicker-multi-2 ui-datepicker-multi-3 ui-datepicker-multi-4").width(""),n>1&&t.dpDiv.addClass("ui-datepicker-multi-"+n).css("width",a*n+"em"),t.dpDiv[(1!==s[0]||1!==s[1]?"add":"remove")+"Class"]("ui-datepicker-multi"),t.dpDiv[(this._get(t,"isRTL")?"add":"remove")+"Class"]("ui-datepicker-rtl"),t===e.datepicker._curInst&&e.datepicker._datepickerShowing&&e.datepicker._shouldFocusInput(t)&&t.input.focus(),t.yearshtml&&(i=t.yearshtml,setTimeout(function(){i===t.yearshtml&&t.yearshtml&&t.dpDiv.find("select.ui-datepicker-year:first").replaceWith(t.yearshtml),i=t.yearshtml=null},0))},_shouldFocusInput:function(e){return e.input&&e.input.is(":visible")&&!e.input.is(":disabled")&&!e.input.is(":focus")},_checkOffset:function(t,i,s){var n=t.dpDiv.outerWidth(),a=t.dpDiv.outerHeight(),o=t.input?t.input.outerWidth():0,r=t.input?t.input.outerHeight():0,h=document.documentElement.clientWidth+(s?0:e(document).scrollLeft()),l=document.documentElement.clientHeight+(s?0:e(document).scrollTop());return i.left-=this._get(t,"isRTL")?n-o:0,i.left-=s&&i.left===t.input.offset().left?e(document).scrollLeft():0,i.top-=s&&i.top===t.input.offset().top+r?e(document).scrollTop():0,i.left-=Math.min(i.left,i.left+n>h&&h>n?Math.abs(i.left+n-h):0),i.top-=Math.min(i.top,i.top+a>l&&l>a?Math.abs(a+r):0),i},_findPos:function(t){for(var i,s=this._getInst(t),n=this._get(s,"isRTL");t&&("hidden"===t.type||1!==t.nodeType||e.expr.filters.hidden(t));)t=t[n?"previousSibling":"nextSibling"];return i=e(t).offset(),[i.left,i.top]},_hideDatepicker:function(t){var i,s,n,a,o=this._curInst;!o||t&&o!==e.data(t,"datepicker")||this._datepickerShowing&&(i=this._get(o,"showAnim"),s=this._get(o,"duration"),n=function(){e.datepicker._tidyDialog(o)},e.effects&&(e.effects.effect[i]||e.effects[i])?o.dpDiv.hide(i,e.datepicker._get(o,"showOptions"),s,n):o.dpDiv["slideDown"===i?"slideUp":"fadeIn"===i?"fadeOut":"hide"](i?s:null,n),i||n(),this._datepickerShowing=!1,a=this._get(o,"onClose"),a&&a.apply(o.input?o.input[0]:null,[o.input?o.input.val():"",o]),this._lastInput=null,this._inDialog&&(this._dialogInput.css({position:"absolute",left:"0",top:"-100px"}),e.blockUI&&(e.unblockUI(),e("body").append(this.dpDiv))),this._inDialog=!1)},_tidyDialog:function(e){e.dpDiv.removeClass(this._dialogClass).unbind(".ui-datepicker-calendar")},_checkExternalClick:function(t){if(e.datepicker._curInst){var i=e(t.target),s=e.datepicker._getInst(i[0]);(i[0].id!==e.datepicker._mainDivId&&0===i.parents("#"+e.datepicker._mainDivId).length&&!i.hasClass(e.datepicker.markerClassName)&&!i.closest("."+e.datepicker._triggerClass).length&&e.datepicker._datepickerShowing&&(!e.datepicker._inDialog||!e.blockUI)||i.hasClass(e.datepicker.markerClassName)&&e.datepicker._curInst!==s)&&e.datepicker._hideDatepicker()}},_adjustDate:function(t,i,s){var n=e(t),a=this._getInst(n[0]);this._isDisabledDatepicker(n[0])||(this._adjustInstDate(a,i+("M"===s?this._get(a,"showCurrentAtPos"):0),s),this._updateDatepicker(a))},_gotoToday:function(t){var i,s=e(t),n=this._getInst(s[0]);this._get(n,"gotoCurrent")&&n.currentDay?(n.selectedDay=n.currentDay,n.drawMonth=n.selectedMonth=n.currentMonth,n.drawYear=n.selectedYear=n.currentYear):(i=new Date,n.selectedDay=i.getDate(),n.drawMonth=n.selectedMonth=i.getMonth(),n.drawYear=n.selectedYear=i.getFullYear()),this._notifyChange(n),this._adjustDate(s)},_selectMonthYear:function(t,i,s){var n=e(t),a=this._getInst(n[0]);a["selected"+("M"===s?"Month":"Year")]=a["draw"+("M"===s?"Month":"Year")]=parseInt(i.options[i.selectedIndex].value,10),this._notifyChange(a),this._adjustDate(n)},_selectDay:function(t,i,s,n){var a,o=e(t);e(n).hasClass(this._unselectableClass)||this._isDisabledDatepicker(o[0])||(a=this._getInst(o[0]),a.selectedDay=a.currentDay=e("a",n).html(),a.selectedMonth=a.currentMonth=i,a.selectedYear=a.currentYear=s,this._selectDate(t,this._formatDate(a,a.currentDay,a.currentMonth,a.currentYear)))},_clearDate:function(t){var i=e(t);this._selectDate(i,"")},_selectDate:function(t,i){var s,n=e(t),a=this._getInst(n[0]);i=null!=i?i:this._formatDate(a),a.input&&a.input.val(i),this._updateAlternate(a),s=this._get(a,"onSelect"),s?s.apply(a.input?a.input[0]:null,[i,a]):a.input&&a.input.trigger("change"),a.inline?this._updateDatepicker(a):(this._hideDatepicker(),this._lastInput=a.input[0],"object"!=typeof a.input[0]&&a.input.focus(),this._lastInput=null)},_updateAlternate:function(t){var i,s,n,a=this._get(t,"altField");a&&(i=this._get(t,"altFormat")||this._get(t,"dateFormat"),s=this._getDate(t),n=this.formatDate(i,s,this._getFormatConfig(t)),e(a).each(function(){e(this).val(n)}))},noWeekends:function(e){var t=e.getDay();return[t>0&&6>t,""]},iso8601Week:function(e){var t,i=new Date(e.getTime());return i.setDate(i.getDate()+4-(i.getDay()||7)),t=i.getTime(),i.setMonth(0),i.setDate(1),Math.floor(Math.round((t-i)/864e5)/7)+1},parseDate:function(t,i,s){if(null==t||null==i)throw"Invalid arguments";if(i="object"==typeof i?""+i:i+"",""===i)return null;var n,a,o,r,h=0,l=(s?s.shortYearCutoff:null)||this._defaults.shortYearCutoff,u="string"!=typeof l?l:(new Date).getFullYear()%100+parseInt(l,10),d=(s?s.dayNamesShort:null)||this._defaults.dayNamesShort,c=(s?s.dayNames:null)||this._defaults.dayNames,p=(s?s.monthNamesShort:null)||this._defaults.monthNamesShort,f=(s?s.monthNames:null)||this._defaults.monthNames,m=-1,g=-1,v=-1,y=-1,b=!1,_=function(e){var i=t.length>n+1&&t.charAt(n+1)===e;return i&&n++,i},x=function(e){var t=_(e),s="@"===e?14:"!"===e?20:"y"===e&&t?4:"o"===e?3:2,n="y"===e?s:1,a=RegExp("^\\d{"+n+","+s+"}"),o=i.substring(h).match(a);if(!o)throw"Missing number at position "+h;return h+=o[0].length,parseInt(o[0],10)},w=function(t,s,n){var a=-1,o=e.map(_(t)?n:s,function(e,t){return[[t,e]]}).sort(function(e,t){return-(e[1].length-t[1].length)});if(e.each(o,function(e,t){var s=t[1];return i.substr(h,s.length).toLowerCase()===s.toLowerCase()?(a=t[0],h+=s.length,!1):void 0}),-1!==a)return a+1;throw"Unknown name at position "+h},k=function(){if(i.charAt(h)!==t.charAt(n))throw"Unexpected literal at position "+h;h++};for(n=0;t.length>n;n++)if(b)"'"!==t.charAt(n)||_("'")?k():b=!1;else switch(t.charAt(n)){case"d":v=x("d");break;case"D":w("D",d,c);break;case"o":y=x("o");break;case"m":g=x("m");break;case"M":g=w("M",p,f);break;case"y":m=x("y");break;case"@":r=new Date(x("@")),m=r.getFullYear(),g=r.getMonth()+1,v=r.getDate();break;case"!":r=new Date((x("!")-this._ticksTo1970)/1e4),m=r.getFullYear(),g=r.getMonth()+1,v=r.getDate();break;case"'":_("'")?k():b=!0;break;default:k()}if(i.length>h&&(o=i.substr(h),!/^\s+/.test(o)))throw"Extra/unparsed characters found in date: "+o;if(-1===m?m=(new Date).getFullYear():100>m&&(m+=(new Date).getFullYear()-(new Date).getFullYear()%100+(u>=m?0:-100)),y>-1)for(g=1,v=y;;){if(a=this._getDaysInMonth(m,g-1),a>=v)break;g++,v-=a}if(r=this._daylightSavingAdjust(new Date(m,g-1,v)),r.getFullYear()!==m||r.getMonth()+1!==g||r.getDate()!==v)throw"Invalid date";return r},ATOM:"yy-mm-dd",COOKIE:"D, dd M yy",ISO_8601:"yy-mm-dd",RFC_822:"D, d M y",RFC_850:"DD, dd-M-y",RFC_1036:"D, d M y",RFC_1123:"D, d M yy",RFC_2822:"D, d M yy",RSS:"D, d M y",TICKS:"!",TIMESTAMP:"@",W3C:"yy-mm-dd",_ticksTo1970:1e7*60*60*24*(718685+Math.floor(492.5)-Math.floor(19.7)+Math.floor(4.925)),formatDate:function(e,t,i){if(!t)return"";var s,n=(i?i.dayNamesShort:null)||this._defaults.dayNamesShort,a=(i?i.dayNames:null)||this._defaults.dayNames,o=(i?i.monthNamesShort:null)||this._defaults.monthNamesShort,r=(i?i.monthNames:null)||this._defaults.monthNames,h=function(t){var i=e.length>s+1&&e.charAt(s+1)===t;return i&&s++,i},l=function(e,t,i){var s=""+t;if(h(e))for(;i>s.length;)s="0"+s;return s},u=function(e,t,i,s){return h(e)?s[t]:i[t]},d="",c=!1;if(t)for(s=0;e.length>s;s++)if(c)"'"!==e.charAt(s)||h("'")?d+=e.charAt(s):c=!1;else switch(e.charAt(s)){case"d":d+=l("d",t.getDate(),2);break;case"D":d+=u("D",t.getDay(),n,a);break;case"o":d+=l("o",Math.round((new Date(t.getFullYear(),t.getMonth(),t.getDate()).getTime()-new Date(t.getFullYear(),0,0).getTime())/864e5),3);break;case"m":d+=l("m",t.getMonth()+1,2);break;case"M":d+=u("M",t.getMonth(),o,r);break;case"y":d+=h("y")?t.getFullYear():(10>t.getYear()%100?"0":"")+t.getYear()%100;break;case"@":d+=t.getTime();break;case"!":d+=1e4*t.getTime()+this._ticksTo1970;break;case"'":h("'")?d+="'":c=!0;break;default:d+=e.charAt(s)}return d},_possibleChars:function(e){var t,i="",s=!1,n=function(i){var s=e.length>t+1&&e.charAt(t+1)===i;return s&&t++,s};for(t=0;e.length>t;t++)if(s)"'"!==e.charAt(t)||n("'")?i+=e.charAt(t):s=!1;else switch(e.charAt(t)){case"d":case"m":case"y":case"@":i+="0123456789";break;case"D":case"M":return null;case"'":n("'")?i+="'":s=!0;break;default:i+=e.charAt(t)}return i},_get:function(e,t){return void 0!==e.settings[t]?e.settings[t]:this._defaults[t]},_setDateFromField:function(e,t){if(e.input.val()!==e.lastVal){var i=this._get(e,"dateFormat"),s=e.lastVal=e.input?e.input.val():null,n=this._getDefaultDate(e),a=n,o=this._getFormatConfig(e);try{a=this.parseDate(i,s,o)||n}catch(r){s=t?"":s}e.selectedDay=a.getDate(),e.drawMonth=e.selectedMonth=a.getMonth(),e.drawYear=e.selectedYear=a.getFullYear(),e.currentDay=s?a.getDate():0,e.currentMonth=s?a.getMonth():0,e.currentYear=s?a.getFullYear():0,this._adjustInstDate(e)}},_getDefaultDate:function(e){return this._restrictMinMax(e,this._determineDate(e,this._get(e,"defaultDate"),new Date))},_determineDate:function(t,i,s){var n=function(e){var t=new Date;return t.setDate(t.getDate()+e),t},a=function(i){try{return e.datepicker.parseDate(e.datepicker._get(t,"dateFormat"),i,e.datepicker._getFormatConfig(t))}catch(s){}for(var n=(i.toLowerCase().match(/^c/)?e.datepicker._getDate(t):null)||new Date,a=n.getFullYear(),o=n.getMonth(),r=n.getDate(),h=/([+\-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g,l=h.exec(i);l;){switch(l[2]||"d"){case"d":case"D":r+=parseInt(l[1],10);break;case"w":case"W":r+=7*parseInt(l[1],10);break;case"m":case"M":o+=parseInt(l[1],10),r=Math.min(r,e.datepicker._getDaysInMonth(a,o));break;case"y":case"Y":a+=parseInt(l[1],10),r=Math.min(r,e.datepicker._getDaysInMonth(a,o))}l=h.exec(i)}return new Date(a,o,r)},o=null==i||""===i?s:"string"==typeof i?a(i):"number"==typeof i?isNaN(i)?s:n(i):new Date(i.getTime());return o=o&&"Invalid Date"==""+o?s:o,o&&(o.setHours(0),o.setMinutes(0),o.setSeconds(0),o.setMilliseconds(0)),this._daylightSavingAdjust(o)},_daylightSavingAdjust:function(e){return e?(e.setHours(e.getHours()>12?e.getHours()+2:0),e):null},_setDate:function(e,t,i){var s=!t,n=e.selectedMonth,a=e.selectedYear,o=this._restrictMinMax(e,this._determineDate(e,t,new Date));e.selectedDay=e.currentDay=o.getDate(),e.drawMonth=e.selectedMonth=e.currentMonth=o.getMonth(),e.drawYear=e.selectedYear=e.currentYear=o.getFullYear(),n===e.selectedMonth&&a===e.selectedYear||i||this._notifyChange(e),this._adjustInstDate(e),e.input&&e.input.val(s?"":this._formatDate(e))},_getDate:function(e){var t=!e.currentYear||e.input&&""===e.input.val()?null:this._daylightSavingAdjust(new Date(e.currentYear,e.currentMonth,e.currentDay));return t},_attachHandlers:function(t){var i=this._get(t,"stepMonths"),s="#"+t.id.replace(/\\\\/g,"\\");t.dpDiv.find("[data-handler]").map(function(){var t={prev:function(){e.datepicker._adjustDate(s,-i,"M")},next:function(){e.datepicker._adjustDate(s,+i,"M")},hide:function(){e.datepicker._hideDatepicker()},today:function(){e.datepicker._gotoToday(s)},selectDay:function(){return e.datepicker._selectDay(s,+this.getAttribute("data-month"),+this.getAttribute("data-year"),this),!1},selectMonth:function(){return e.datepicker._selectMonthYear(s,this,"M"),!1},selectYear:function(){return e.datepicker._selectMonthYear(s,this,"Y"),!1}};e(this).bind(this.getAttribute("data-event"),t[this.getAttribute("data-handler")])})},_generateHTML:function(e){var t,i,s,n,a,o,r,h,l,u,d,c,p,f,m,g,v,y,b,_,x,w,k,T,D,S,M,C,N,A,P,I,H,z,F,E,O,j,W,L=new Date,R=this._daylightSavingAdjust(new Date(L.getFullYear(),L.getMonth(),L.getDate())),Y=this._get(e,"isRTL"),B=this._get(e,"showButtonPanel"),J=this._get(e,"hideIfNoPrevNext"),q=this._get(e,"navigationAsDateFormat"),K=this._getNumberOfMonths(e),V=this._get(e,"showCurrentAtPos"),U=this._get(e,"stepMonths"),Q=1!==K[0]||1!==K[1],G=this._daylightSavingAdjust(e.currentDay?new Date(e.currentYear,e.currentMonth,e.currentDay):new Date(9999,9,9)),X=this._getMinMaxDate(e,"min"),$=this._getMinMaxDate(e,"max"),Z=e.drawMonth-V,et=e.drawYear;if(0>Z&&(Z+=12,et--),$)for(t=this._daylightSavingAdjust(new Date($.getFullYear(),$.getMonth()-K[0]*K[1]+1,$.getDate())),t=X&&X>t?X:t;this._daylightSavingAdjust(new Date(et,Z,1))>t;)Z--,0>Z&&(Z=11,et--);for(e.drawMonth=Z,e.drawYear=et,i=this._get(e,"prevText"),i=q?this.formatDate(i,this._daylightSavingAdjust(new Date(et,Z-U,1)),this._getFormatConfig(e)):i,s=this._canAdjustMonth(e,-1,et,Z)?"<a class='ui-datepicker-prev ui-corner-all' data-handler='prev' data-event='click' title='"+i+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"e":"w")+"'>"+i+"</span></a>":J?"":"<a class='ui-datepicker-prev ui-corner-all ui-state-disabled' title='"+i+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"e":"w")+"'>"+i+"</span></a>",n=this._get(e,"nextText"),n=q?this.formatDate(n,this._daylightSavingAdjust(new Date(et,Z+U,1)),this._getFormatConfig(e)):n,a=this._canAdjustMonth(e,1,et,Z)?"<a class='ui-datepicker-next ui-corner-all' data-handler='next' data-event='click' title='"+n+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"w":"e")+"'>"+n+"</span></a>":J?"":"<a class='ui-datepicker-next ui-corner-all ui-state-disabled' title='"+n+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"w":"e")+"'>"+n+"</span></a>",o=this._get(e,"currentText"),r=this._get(e,"gotoCurrent")&&e.currentDay?G:R,o=q?this.formatDate(o,r,this._getFormatConfig(e)):o,h=e.inline?"":"<button type='button' class='ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all' data-handler='hide' data-event='click'>"+this._get(e,"closeText")+"</button>",l=B?"<div class='ui-datepicker-buttonpane ui-widget-content'>"+(Y?h:"")+(this._isInRange(e,r)?"<button type='button' class='ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all' data-handler='today' data-event='click'>"+o+"</button>":"")+(Y?"":h)+"</div>":"",u=parseInt(this._get(e,"firstDay"),10),u=isNaN(u)?0:u,d=this._get(e,"showWeek"),c=this._get(e,"dayNames"),p=this._get(e,"dayNamesMin"),f=this._get(e,"monthNames"),m=this._get(e,"monthNamesShort"),g=this._get(e,"beforeShowDay"),v=this._get(e,"showOtherMonths"),y=this._get(e,"selectOtherMonths"),b=this._getDefaultDate(e),_="",w=0;K[0]>w;w++){for(k="",this.maxRows=4,T=0;K[1]>T;T++){if(D=this._daylightSavingAdjust(new Date(et,Z,e.selectedDay)),S=" ui-corner-all",M="",Q){if(M+="<div class='ui-datepicker-group",K[1]>1)switch(T){case 0:M+=" ui-datepicker-group-first",S=" ui-corner-"+(Y?"right":"left");break;case K[1]-1:M+=" ui-datepicker-group-last",S=" ui-corner-"+(Y?"left":"right");break;default:M+=" ui-datepicker-group-middle",S=""}M+="'>"}for(M+="<div class='ui-datepicker-header ui-widget-header ui-helper-clearfix"+S+"'>"+(/all|left/.test(S)&&0===w?Y?a:s:"")+(/all|right/.test(S)&&0===w?Y?s:a:"")+this._generateMonthYearHeader(e,Z,et,X,$,w>0||T>0,f,m)+"</div><table class='ui-datepicker-calendar'><thead>"+"<tr>",C=d?"<th class='ui-datepicker-week-col'>"+this._get(e,"weekHeader")+"</th>":"",x=0;7>x;x++)N=(x+u)%7,C+="<th scope='col'"+((x+u+6)%7>=5?" class='ui-datepicker-week-end'":"")+">"+"<span title='"+c[N]+"'>"+p[N]+"</span></th>";for(M+=C+"</tr></thead><tbody>",A=this._getDaysInMonth(et,Z),et===e.selectedYear&&Z===e.selectedMonth&&(e.selectedDay=Math.min(e.selectedDay,A)),P=(this._getFirstDayOfMonth(et,Z)-u+7)%7,I=Math.ceil((P+A)/7),H=Q?this.maxRows>I?this.maxRows:I:I,this.maxRows=H,z=this._daylightSavingAdjust(new Date(et,Z,1-P)),F=0;H>F;F++){for(M+="<tr>",E=d?"<td class='ui-datepicker-week-col'>"+this._get(e,"calculateWeek")(z)+"</td>":"",x=0;7>x;x++)O=g?g.apply(e.input?e.input[0]:null,[z]):[!0,""],j=z.getMonth()!==Z,W=j&&!y||!O[0]||X&&X>z||$&&z>$,E+="<td class='"+((x+u+6)%7>=5?" ui-datepicker-week-end":"")+(j?" ui-datepicker-other-month":"")+(z.getTime()===D.getTime()&&Z===e.selectedMonth&&e._keyEvent||b.getTime()===z.getTime()&&b.getTime()===D.getTime()?" "+this._dayOverClass:"")+(W?" "+this._unselectableClass+" ui-state-disabled":"")+(j&&!v?"":" "+O[1]+(z.getTime()===G.getTime()?" "+this._currentClass:"")+(z.getTime()===R.getTime()?" ui-datepicker-today":""))+"'"+(j&&!v||!O[2]?"":" title='"+O[2].replace(/'/g,"&#39;")+"'")+(W?"":" data-handler='selectDay' data-event='click' data-month='"+z.getMonth()+"' data-year='"+z.getFullYear()+"'")+">"+(j&&!v?"&#xa0;":W?"<span class='ui-state-default'>"+z.getDate()+"</span>":"<a class='ui-state-default"+(z.getTime()===R.getTime()?" ui-state-highlight":"")+(z.getTime()===G.getTime()?" ui-state-active":"")+(j?" ui-priority-secondary":"")+"' href='#'>"+z.getDate()+"</a>")+"</td>",z.setDate(z.getDate()+1),z=this._daylightSavingAdjust(z);M+=E+"</tr>"}Z++,Z>11&&(Z=0,et++),M+="</tbody></table>"+(Q?"</div>"+(K[0]>0&&T===K[1]-1?"<div class='ui-datepicker-row-break'></div>":""):""),k+=M}_+=k}return _+=l,e._keyEvent=!1,_},_generateMonthYearHeader:function(e,t,i,s,n,a,o,r){var h,l,u,d,c,p,f,m,g=this._get(e,"changeMonth"),v=this._get(e,"changeYear"),y=this._get(e,"showMonthAfterYear"),b="<div class='ui-datepicker-title'>",_="";if(a||!g)_+="<span class='ui-datepicker-month'>"+o[t]+"</span>";else{for(h=s&&s.getFullYear()===i,l=n&&n.getFullYear()===i,_+="<select class='ui-datepicker-month' data-handler='selectMonth' data-event='change'>",u=0;12>u;u++)(!h||u>=s.getMonth())&&(!l||n.getMonth()>=u)&&(_+="<option value='"+u+"'"+(u===t?" selected='selected'":"")+">"+r[u]+"</option>");_+="</select>"}if(y||(b+=_+(!a&&g&&v?"":"&#xa0;")),!e.yearshtml)if(e.yearshtml="",a||!v)b+="<span class='ui-datepicker-year'>"+i+"</span>";else{for(d=this._get(e,"yearRange").split(":"),c=(new Date).getFullYear(),p=function(e){var t=e.match(/c[+\-].*/)?i+parseInt(e.substring(1),10):e.match(/[+\-].*/)?c+parseInt(e,10):parseInt(e,10);return isNaN(t)?c:t},f=p(d[0]),m=Math.max(f,p(d[1]||"")),f=s?Math.max(f,s.getFullYear()):f,m=n?Math.min(m,n.getFullYear()):m,e.yearshtml+="<select class='ui-datepicker-year' data-handler='selectYear' data-event='change'>";m>=f;f++)e.yearshtml+="<option value='"+f+"'"+(f===i?" selected='selected'":"")+">"+f+"</option>";e.yearshtml+="</select>",b+=e.yearshtml,e.yearshtml=null}return b+=this._get(e,"yearSuffix"),y&&(b+=(!a&&g&&v?"":"&#xa0;")+_),b+="</div>"},_adjustInstDate:function(e,t,i){var s=e.drawYear+("Y"===i?t:0),n=e.drawMonth+("M"===i?t:0),a=Math.min(e.selectedDay,this._getDaysInMonth(s,n))+("D"===i?t:0),o=this._restrictMinMax(e,this._daylightSavingAdjust(new Date(s,n,a)));e.selectedDay=o.getDate(),e.drawMonth=e.selectedMonth=o.getMonth(),e.drawYear=e.selectedYear=o.getFullYear(),("M"===i||"Y"===i)&&this._notifyChange(e)},_restrictMinMax:function(e,t){var i=this._getMinMaxDate(e,"min"),s=this._getMinMaxDate(e,"max"),n=i&&i>t?i:t;return s&&n>s?s:n},_notifyChange:function(e){var t=this._get(e,"onChangeMonthYear");t&&t.apply(e.input?e.input[0]:null,[e.selectedYear,e.selectedMonth+1,e])},_getNumberOfMonths:function(e){var t=this._get(e,"numberOfMonths");return null==t?[1,1]:"number"==typeof t?[1,t]:t},_getMinMaxDate:function(e,t){return this._determineDate(e,this._get(e,t+"Date"),null)},_getDaysInMonth:function(e,t){return 32-this._daylightSavingAdjust(new Date(e,t,32)).getDate()},_getFirstDayOfMonth:function(e,t){return new Date(e,t,1).getDay()},_canAdjustMonth:function(e,t,i,s){var n=this._getNumberOfMonths(e),a=this._daylightSavingAdjust(new Date(i,s+(0>t?t:n[0]*n[1]),1));return 0>t&&a.setDate(this._getDaysInMonth(a.getFullYear(),a.getMonth())),this._isInRange(e,a)},_isInRange:function(e,t){var i,s,n=this._getMinMaxDate(e,"min"),a=this._getMinMaxDate(e,"max"),o=null,r=null,h=this._get(e,"yearRange");return h&&(i=h.split(":"),s=(new Date).getFullYear(),o=parseInt(i[0],10),r=parseInt(i[1],10),i[0].match(/[+\-].*/)&&(o+=s),i[1].match(/[+\-].*/)&&(r+=s)),(!n||t.getTime()>=n.getTime())&&(!a||t.getTime()<=a.getTime())&&(!o||t.getFullYear()>=o)&&(!r||r>=t.getFullYear())},_getFormatConfig:function(e){var t=this._get(e,"shortYearCutoff");return t="string"!=typeof t?t:(new Date).getFullYear()%100+parseInt(t,10),{shortYearCutoff:t,dayNamesShort:this._get(e,"dayNamesShort"),dayNames:this._get(e,"dayNames"),monthNamesShort:this._get(e,"monthNamesShort"),monthNames:this._get(e,"monthNames")}},_formatDate:function(e,t,i,s){t||(e.currentDay=e.selectedDay,e.currentMonth=e.selectedMonth,e.currentYear=e.selectedYear);var n=t?"object"==typeof t?t:this._daylightSavingAdjust(new Date(s,i,t)):this._daylightSavingAdjust(new Date(e.currentYear,e.currentMonth,e.currentDay));return this.formatDate(this._get(e,"dateFormat"),n,this._getFormatConfig(e))}}),e.fn.datepicker=function(t){if(!this.length)return this;e.datepicker.initialized||(e(document).mousedown(e.datepicker._checkExternalClick),e.datepicker.initialized=!0),0===e("#"+e.datepicker._mainDivId).length&&e("body").append(e.datepicker.dpDiv);var i=Array.prototype.slice.call(arguments,1);return"string"!=typeof t||"isDisabled"!==t&&"getDate"!==t&&"widget"!==t?"option"===t&&2===arguments.length&&"string"==typeof arguments[1]?e.datepicker["_"+t+"Datepicker"].apply(e.datepicker,[this[0]].concat(i)):this.each(function(){"string"==typeof t?e.datepicker["_"+t+"Datepicker"].apply(e.datepicker,[this].concat(i)):e.datepicker._attachDatepicker(this,t)}):e.datepicker["_"+t+"Datepicker"].apply(e.datepicker,[this[0]].concat(i))},e.datepicker=new n,e.datepicker.initialized=!1,e.datepicker.uuid=(new Date).getTime(),e.datepicker.version="1.11.4",e.datepicker,e.widget("ui.dialog",{version:"1.11.4",options:{appendTo:"body",autoOpen:!0,buttons:[],closeOnEscape:!0,closeText:"Close",dialogClass:"",draggable:!0,hide:null,height:"auto",maxHeight:null,maxWidth:null,minHeight:150,minWidth:150,modal:!1,position:{my:"center",at:"center",of:window,collision:"fit",using:function(t){var i=e(this).css(t).offset().top;0>i&&e(this).css("top",t.top-i)}},resizable:!0,show:null,title:null,width:300,beforeClose:null,close:null,drag:null,dragStart:null,dragStop:null,focus:null,open:null,resize:null,resizeStart:null,resizeStop:null},sizeRelatedOptions:{buttons:!0,height:!0,maxHeight:!0,maxWidth:!0,minHeight:!0,minWidth:!0,width:!0},resizableRelatedOptions:{maxHeight:!0,maxWidth:!0,minHeight:!0,minWidth:!0},_create:function(){this.originalCss={display:this.element[0].style.display,width:this.element[0].style.width,minHeight:this.element[0].style.minHeight,maxHeight:this.element[0].style.maxHeight,height:this.element[0].style.height},this.originalPosition={parent:this.element.parent(),index:this.element.parent().children().index(this.element)},this.originalTitle=this.element.attr("title"),this.options.title=this.options.title||this.originalTitle,this._createWrapper(),this.element.show().removeAttr("title").addClass("ui-dialog-content ui-widget-content").appendTo(this.uiDialog),this._createTitlebar(),this._createButtonPane(),this.options.draggable&&e.fn.draggable&&this._makeDraggable(),this.options.resizable&&e.fn.resizable&&this._makeResizable(),this._isOpen=!1,this._trackFocus()},_init:function(){this.options.autoOpen&&this.open()},_appendTo:function(){var t=this.options.appendTo;return t&&(t.jquery||t.nodeType)?e(t):this.document.find(t||"body").eq(0)},_destroy:function(){var e,t=this.originalPosition;this._untrackInstance(),this._destroyOverlay(),this.element.removeUniqueId().removeClass("ui-dialog-content ui-widget-content").css(this.originalCss).detach(),this.uiDialog.stop(!0,!0).remove(),this.originalTitle&&this.element.attr("title",this.originalTitle),e=t.parent.children().eq(t.index),e.length&&e[0]!==this.element[0]?e.before(this.element):t.parent.append(this.element)},widget:function(){return this.uiDialog},disable:e.noop,enable:e.noop,close:function(t){var i,s=this;if(this._isOpen&&this._trigger("beforeClose",t)!==!1){if(this._isOpen=!1,this._focusedElement=null,this._destroyOverlay(),this._untrackInstance(),!this.opener.filter(":focusable").focus().length)try{i=this.document[0].activeElement,i&&"body"!==i.nodeName.toLowerCase()&&e(i).blur()}catch(n){}this._hide(this.uiDialog,this.options.hide,function(){s._trigger("close",t)})}},isOpen:function(){return this._isOpen},moveToTop:function(){this._moveToTop()},_moveToTop:function(t,i){var s=!1,n=this.uiDialog.siblings(".ui-front:visible").map(function(){return+e(this).css("z-index")}).get(),a=Math.max.apply(null,n);return a>=+this.uiDialog.css("z-index")&&(this.uiDialog.css("z-index",a+1),s=!0),s&&!i&&this._trigger("focus",t),s},open:function(){var t=this;
return this._isOpen?(this._moveToTop()&&this._focusTabbable(),void 0):(this._isOpen=!0,this.opener=e(this.document[0].activeElement),this._size(),this._position(),this._createOverlay(),this._moveToTop(null,!0),this.overlay&&this.overlay.css("z-index",this.uiDialog.css("z-index")-1),this._show(this.uiDialog,this.options.show,function(){t._focusTabbable(),t._trigger("focus")}),this._makeFocusTarget(),this._trigger("open"),void 0)},_focusTabbable:function(){var e=this._focusedElement;e||(e=this.element.find("[autofocus]")),e.length||(e=this.element.find(":tabbable")),e.length||(e=this.uiDialogButtonPane.find(":tabbable")),e.length||(e=this.uiDialogTitlebarClose.filter(":tabbable")),e.length||(e=this.uiDialog),e.eq(0).focus()},_keepFocus:function(t){function i(){var t=this.document[0].activeElement,i=this.uiDialog[0]===t||e.contains(this.uiDialog[0],t);i||this._focusTabbable()}t.preventDefault(),i.call(this),this._delay(i)},_createWrapper:function(){this.uiDialog=e("<div>").addClass("ui-dialog ui-widget ui-widget-content ui-corner-all ui-front "+this.options.dialogClass).hide().attr({tabIndex:-1,role:"dialog"}).appendTo(this._appendTo()),this._on(this.uiDialog,{keydown:function(t){if(this.options.closeOnEscape&&!t.isDefaultPrevented()&&t.keyCode&&t.keyCode===e.ui.keyCode.ESCAPE)return t.preventDefault(),this.close(t),void 0;if(t.keyCode===e.ui.keyCode.TAB&&!t.isDefaultPrevented()){var i=this.uiDialog.find(":tabbable"),s=i.filter(":first"),n=i.filter(":last");t.target!==n[0]&&t.target!==this.uiDialog[0]||t.shiftKey?t.target!==s[0]&&t.target!==this.uiDialog[0]||!t.shiftKey||(this._delay(function(){n.focus()}),t.preventDefault()):(this._delay(function(){s.focus()}),t.preventDefault())}},mousedown:function(e){this._moveToTop(e)&&this._focusTabbable()}}),this.element.find("[aria-describedby]").length||this.uiDialog.attr({"aria-describedby":this.element.uniqueId().attr("id")})},_createTitlebar:function(){var t;this.uiDialogTitlebar=e("<div>").addClass("ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix").prependTo(this.uiDialog),this._on(this.uiDialogTitlebar,{mousedown:function(t){e(t.target).closest(".ui-dialog-titlebar-close")||this.uiDialog.focus()}}),this.uiDialogTitlebarClose=e("<button type='button'></button>").button({label:this.options.closeText,icons:{primary:"ui-icon-closethick"},text:!1}).addClass("ui-dialog-titlebar-close").appendTo(this.uiDialogTitlebar),this._on(this.uiDialogTitlebarClose,{click:function(e){e.preventDefault(),this.close(e)}}),t=e("<span>").uniqueId().addClass("ui-dialog-title").prependTo(this.uiDialogTitlebar),this._title(t),this.uiDialog.attr({"aria-labelledby":t.attr("id")})},_title:function(e){this.options.title||e.html("&#160;"),e.text(this.options.title)},_createButtonPane:function(){this.uiDialogButtonPane=e("<div>").addClass("ui-dialog-buttonpane ui-widget-content ui-helper-clearfix"),this.uiButtonSet=e("<div>").addClass("ui-dialog-buttonset").appendTo(this.uiDialogButtonPane),this._createButtons()},_createButtons:function(){var t=this,i=this.options.buttons;return this.uiDialogButtonPane.remove(),this.uiButtonSet.empty(),e.isEmptyObject(i)||e.isArray(i)&&!i.length?(this.uiDialog.removeClass("ui-dialog-buttons"),void 0):(e.each(i,function(i,s){var n,a;s=e.isFunction(s)?{click:s,text:i}:s,s=e.extend({type:"button"},s),n=s.click,s.click=function(){n.apply(t.element[0],arguments)},a={icons:s.icons,text:s.showText},delete s.icons,delete s.showText,e("<button></button>",s).button(a).appendTo(t.uiButtonSet)}),this.uiDialog.addClass("ui-dialog-buttons"),this.uiDialogButtonPane.appendTo(this.uiDialog),void 0)},_makeDraggable:function(){function t(e){return{position:e.position,offset:e.offset}}var i=this,s=this.options;this.uiDialog.draggable({cancel:".ui-dialog-content, .ui-dialog-titlebar-close",handle:".ui-dialog-titlebar",containment:"document",start:function(s,n){e(this).addClass("ui-dialog-dragging"),i._blockFrames(),i._trigger("dragStart",s,t(n))},drag:function(e,s){i._trigger("drag",e,t(s))},stop:function(n,a){var o=a.offset.left-i.document.scrollLeft(),r=a.offset.top-i.document.scrollTop();s.position={my:"left top",at:"left"+(o>=0?"+":"")+o+" "+"top"+(r>=0?"+":"")+r,of:i.window},e(this).removeClass("ui-dialog-dragging"),i._unblockFrames(),i._trigger("dragStop",n,t(a))}})},_makeResizable:function(){function t(e){return{originalPosition:e.originalPosition,originalSize:e.originalSize,position:e.position,size:e.size}}var i=this,s=this.options,n=s.resizable,a=this.uiDialog.css("position"),o="string"==typeof n?n:"n,e,s,w,se,sw,ne,nw";this.uiDialog.resizable({cancel:".ui-dialog-content",containment:"document",alsoResize:this.element,maxWidth:s.maxWidth,maxHeight:s.maxHeight,minWidth:s.minWidth,minHeight:this._minHeight(),handles:o,start:function(s,n){e(this).addClass("ui-dialog-resizing"),i._blockFrames(),i._trigger("resizeStart",s,t(n))},resize:function(e,s){i._trigger("resize",e,t(s))},stop:function(n,a){var o=i.uiDialog.offset(),r=o.left-i.document.scrollLeft(),h=o.top-i.document.scrollTop();s.height=i.uiDialog.height(),s.width=i.uiDialog.width(),s.position={my:"left top",at:"left"+(r>=0?"+":"")+r+" "+"top"+(h>=0?"+":"")+h,of:i.window},e(this).removeClass("ui-dialog-resizing"),i._unblockFrames(),i._trigger("resizeStop",n,t(a))}}).css("position",a)},_trackFocus:function(){this._on(this.widget(),{focusin:function(t){this._makeFocusTarget(),this._focusedElement=e(t.target)}})},_makeFocusTarget:function(){this._untrackInstance(),this._trackingInstances().unshift(this)},_untrackInstance:function(){var t=this._trackingInstances(),i=e.inArray(this,t);-1!==i&&t.splice(i,1)},_trackingInstances:function(){var e=this.document.data("ui-dialog-instances");return e||(e=[],this.document.data("ui-dialog-instances",e)),e},_minHeight:function(){var e=this.options;return"auto"===e.height?e.minHeight:Math.min(e.minHeight,e.height)},_position:function(){var e=this.uiDialog.is(":visible");e||this.uiDialog.show(),this.uiDialog.position(this.options.position),e||this.uiDialog.hide()},_setOptions:function(t){var i=this,s=!1,n={};e.each(t,function(e,t){i._setOption(e,t),e in i.sizeRelatedOptions&&(s=!0),e in i.resizableRelatedOptions&&(n[e]=t)}),s&&(this._size(),this._position()),this.uiDialog.is(":data(ui-resizable)")&&this.uiDialog.resizable("option",n)},_setOption:function(e,t){var i,s,n=this.uiDialog;"dialogClass"===e&&n.removeClass(this.options.dialogClass).addClass(t),"disabled"!==e&&(this._super(e,t),"appendTo"===e&&this.uiDialog.appendTo(this._appendTo()),"buttons"===e&&this._createButtons(),"closeText"===e&&this.uiDialogTitlebarClose.button({label:""+t}),"draggable"===e&&(i=n.is(":data(ui-draggable)"),i&&!t&&n.draggable("destroy"),!i&&t&&this._makeDraggable()),"position"===e&&this._position(),"resizable"===e&&(s=n.is(":data(ui-resizable)"),s&&!t&&n.resizable("destroy"),s&&"string"==typeof t&&n.resizable("option","handles",t),s||t===!1||this._makeResizable()),"title"===e&&this._title(this.uiDialogTitlebar.find(".ui-dialog-title")))},_size:function(){var e,t,i,s=this.options;this.element.show().css({width:"auto",minHeight:0,maxHeight:"none",height:0}),s.minWidth>s.width&&(s.width=s.minWidth),e=this.uiDialog.css({height:"auto",width:s.width}).outerHeight(),t=Math.max(0,s.minHeight-e),i="number"==typeof s.maxHeight?Math.max(0,s.maxHeight-e):"none","auto"===s.height?this.element.css({minHeight:t,maxHeight:i,height:"auto"}):this.element.height(Math.max(0,s.height-e)),this.uiDialog.is(":data(ui-resizable)")&&this.uiDialog.resizable("option","minHeight",this._minHeight())},_blockFrames:function(){this.iframeBlocks=this.document.find("iframe").map(function(){var t=e(this);return e("<div>").css({position:"absolute",width:t.outerWidth(),height:t.outerHeight()}).appendTo(t.parent()).offset(t.offset())[0]})},_unblockFrames:function(){this.iframeBlocks&&(this.iframeBlocks.remove(),delete this.iframeBlocks)},_allowInteraction:function(t){return e(t.target).closest(".ui-dialog").length?!0:!!e(t.target).closest(".ui-datepicker").length},_createOverlay:function(){if(this.options.modal){var t=!0;this._delay(function(){t=!1}),this.document.data("ui-dialog-overlays")||this._on(this.document,{focusin:function(e){t||this._allowInteraction(e)||(e.preventDefault(),this._trackingInstances()[0]._focusTabbable())}}),this.overlay=e("<div>").addClass("ui-widget-overlay ui-front").appendTo(this._appendTo()),this._on(this.overlay,{mousedown:"_keepFocus"}),this.document.data("ui-dialog-overlays",(this.document.data("ui-dialog-overlays")||0)+1)}},_destroyOverlay:function(){if(this.options.modal&&this.overlay){var e=this.document.data("ui-dialog-overlays")-1;e?this.document.data("ui-dialog-overlays",e):this.document.unbind("focusin").removeData("ui-dialog-overlays"),this.overlay.remove(),this.overlay=null}}}),e.widget("ui.progressbar",{version:"1.11.4",options:{max:100,value:0,change:null,complete:null},min:0,_create:function(){this.oldValue=this.options.value=this._constrainedValue(),this.element.addClass("ui-progressbar ui-widget ui-widget-content ui-corner-all").attr({role:"progressbar","aria-valuemin":this.min}),this.valueDiv=e("<div class='ui-progressbar-value ui-widget-header ui-corner-left'></div>").appendTo(this.element),this._refreshValue()},_destroy:function(){this.element.removeClass("ui-progressbar ui-widget ui-widget-content ui-corner-all").removeAttr("role").removeAttr("aria-valuemin").removeAttr("aria-valuemax").removeAttr("aria-valuenow"),this.valueDiv.remove()},value:function(e){return void 0===e?this.options.value:(this.options.value=this._constrainedValue(e),this._refreshValue(),void 0)},_constrainedValue:function(e){return void 0===e&&(e=this.options.value),this.indeterminate=e===!1,"number"!=typeof e&&(e=0),this.indeterminate?!1:Math.min(this.options.max,Math.max(this.min,e))},_setOptions:function(e){var t=e.value;delete e.value,this._super(e),this.options.value=this._constrainedValue(t),this._refreshValue()},_setOption:function(e,t){"max"===e&&(t=Math.max(this.min,t)),"disabled"===e&&this.element.toggleClass("ui-state-disabled",!!t).attr("aria-disabled",t),this._super(e,t)},_percentage:function(){return this.indeterminate?100:100*(this.options.value-this.min)/(this.options.max-this.min)},_refreshValue:function(){var t=this.options.value,i=this._percentage();this.valueDiv.toggle(this.indeterminate||t>this.min).toggleClass("ui-corner-right",t===this.options.max).width(i.toFixed(0)+"%"),this.element.toggleClass("ui-progressbar-indeterminate",this.indeterminate),this.indeterminate?(this.element.removeAttr("aria-valuenow"),this.overlayDiv||(this.overlayDiv=e("<div class='ui-progressbar-overlay'></div>").appendTo(this.valueDiv))):(this.element.attr({"aria-valuemax":this.options.max,"aria-valuenow":t}),this.overlayDiv&&(this.overlayDiv.remove(),this.overlayDiv=null)),this.oldValue!==t&&(this.oldValue=t,this._trigger("change")),t===this.options.max&&this._trigger("complete")}}),e.widget("ui.selectmenu",{version:"1.11.4",defaultElement:"<select>",options:{appendTo:null,disabled:null,icons:{button:"ui-icon-triangle-1-s"},position:{my:"left top",at:"left bottom",collision:"none"},width:null,change:null,close:null,focus:null,open:null,select:null},_create:function(){var e=this.element.uniqueId().attr("id");this.ids={element:e,button:e+"-button",menu:e+"-menu"},this._drawButton(),this._drawMenu(),this.options.disabled&&this.disable()},_drawButton:function(){var t=this;this.label=e("label[for='"+this.ids.element+"']").attr("for",this.ids.button),this._on(this.label,{click:function(e){this.button.focus(),e.preventDefault()}}),this.element.hide(),this.button=e("<span>",{"class":"ui-selectmenu-button ui-widget ui-state-default ui-corner-all",tabindex:this.options.disabled?-1:0,id:this.ids.button,role:"combobox","aria-expanded":"false","aria-autocomplete":"list","aria-owns":this.ids.menu,"aria-haspopup":"true"}).insertAfter(this.element),e("<span>",{"class":"ui-icon "+this.options.icons.button}).prependTo(this.button),this.buttonText=e("<span>",{"class":"ui-selectmenu-text"}).appendTo(this.button),this._setText(this.buttonText,this.element.find("option:selected").text()),this._resizeButton(),this._on(this.button,this._buttonEvents),this.button.one("focusin",function(){t.menuItems||t._refreshMenu()}),this._hoverable(this.button),this._focusable(this.button)},_drawMenu:function(){var t=this;this.menu=e("<ul>",{"aria-hidden":"true","aria-labelledby":this.ids.button,id:this.ids.menu}),this.menuWrap=e("<div>",{"class":"ui-selectmenu-menu ui-front"}).append(this.menu).appendTo(this._appendTo()),this.menuInstance=this.menu.menu({role:"listbox",select:function(e,i){e.preventDefault(),t._setSelection(),t._select(i.item.data("ui-selectmenu-item"),e)},focus:function(e,i){var s=i.item.data("ui-selectmenu-item");null!=t.focusIndex&&s.index!==t.focusIndex&&(t._trigger("focus",e,{item:s}),t.isOpen||t._select(s,e)),t.focusIndex=s.index,t.button.attr("aria-activedescendant",t.menuItems.eq(s.index).attr("id"))}}).menu("instance"),this.menu.addClass("ui-corner-bottom").removeClass("ui-corner-all"),this.menuInstance._off(this.menu,"mouseleave"),this.menuInstance._closeOnDocumentClick=function(){return!1},this.menuInstance._isDivider=function(){return!1}},refresh:function(){this._refreshMenu(),this._setText(this.buttonText,this._getSelectedItem().text()),this.options.width||this._resizeButton()},_refreshMenu:function(){this.menu.empty();var e,t=this.element.find("option");t.length&&(this._parseOptions(t),this._renderMenu(this.menu,this.items),this.menuInstance.refresh(),this.menuItems=this.menu.find("li").not(".ui-selectmenu-optgroup"),e=this._getSelectedItem(),this.menuInstance.focus(null,e),this._setAria(e.data("ui-selectmenu-item")),this._setOption("disabled",this.element.prop("disabled")))},open:function(e){this.options.disabled||(this.menuItems?(this.menu.find(".ui-state-focus").removeClass("ui-state-focus"),this.menuInstance.focus(null,this._getSelectedItem())):this._refreshMenu(),this.isOpen=!0,this._toggleAttr(),this._resizeMenu(),this._position(),this._on(this.document,this._documentClick),this._trigger("open",e))},_position:function(){this.menuWrap.position(e.extend({of:this.button},this.options.position))},close:function(e){this.isOpen&&(this.isOpen=!1,this._toggleAttr(),this.range=null,this._off(this.document),this._trigger("close",e))},widget:function(){return this.button},menuWidget:function(){return this.menu},_renderMenu:function(t,i){var s=this,n="";e.each(i,function(i,a){a.optgroup!==n&&(e("<li>",{"class":"ui-selectmenu-optgroup ui-menu-divider"+(a.element.parent("optgroup").prop("disabled")?" ui-state-disabled":""),text:a.optgroup}).appendTo(t),n=a.optgroup),s._renderItemData(t,a)})},_renderItemData:function(e,t){return this._renderItem(e,t).data("ui-selectmenu-item",t)},_renderItem:function(t,i){var s=e("<li>");return i.disabled&&s.addClass("ui-state-disabled"),this._setText(s,i.label),s.appendTo(t)},_setText:function(e,t){t?e.text(t):e.html("&#160;")},_move:function(e,t){var i,s,n=".ui-menu-item";this.isOpen?i=this.menuItems.eq(this.focusIndex):(i=this.menuItems.eq(this.element[0].selectedIndex),n+=":not(.ui-state-disabled)"),s="first"===e||"last"===e?i["first"===e?"prevAll":"nextAll"](n).eq(-1):i[e+"All"](n).eq(0),s.length&&this.menuInstance.focus(t,s)},_getSelectedItem:function(){return this.menuItems.eq(this.element[0].selectedIndex)},_toggle:function(e){this[this.isOpen?"close":"open"](e)},_setSelection:function(){var e;this.range&&(window.getSelection?(e=window.getSelection(),e.removeAllRanges(),e.addRange(this.range)):this.range.select(),this.button.focus())},_documentClick:{mousedown:function(t){this.isOpen&&(e(t.target).closest(".ui-selectmenu-menu, #"+this.ids.button).length||this.close(t))}},_buttonEvents:{mousedown:function(){var e;window.getSelection?(e=window.getSelection(),e.rangeCount&&(this.range=e.getRangeAt(0))):this.range=document.selection.createRange()},click:function(e){this._setSelection(),this._toggle(e)},keydown:function(t){var i=!0;switch(t.keyCode){case e.ui.keyCode.TAB:case e.ui.keyCode.ESCAPE:this.close(t),i=!1;break;case e.ui.keyCode.ENTER:this.isOpen&&this._selectFocusedItem(t);break;case e.ui.keyCode.UP:t.altKey?this._toggle(t):this._move("prev",t);break;case e.ui.keyCode.DOWN:t.altKey?this._toggle(t):this._move("next",t);break;case e.ui.keyCode.SPACE:this.isOpen?this._selectFocusedItem(t):this._toggle(t);break;case e.ui.keyCode.LEFT:this._move("prev",t);break;case e.ui.keyCode.RIGHT:this._move("next",t);break;case e.ui.keyCode.HOME:case e.ui.keyCode.PAGE_UP:this._move("first",t);break;case e.ui.keyCode.END:case e.ui.keyCode.PAGE_DOWN:this._move("last",t);break;default:this.menu.trigger(t),i=!1}i&&t.preventDefault()}},_selectFocusedItem:function(e){var t=this.menuItems.eq(this.focusIndex);t.hasClass("ui-state-disabled")||this._select(t.data("ui-selectmenu-item"),e)},_select:function(e,t){var i=this.element[0].selectedIndex;this.element[0].selectedIndex=e.index,this._setText(this.buttonText,e.label),this._setAria(e),this._trigger("select",t,{item:e}),e.index!==i&&this._trigger("change",t,{item:e}),this.close(t)},_setAria:function(e){var t=this.menuItems.eq(e.index).attr("id");this.button.attr({"aria-labelledby":t,"aria-activedescendant":t}),this.menu.attr("aria-activedescendant",t)},_setOption:function(e,t){"icons"===e&&this.button.find("span.ui-icon").removeClass(this.options.icons.button).addClass(t.button),this._super(e,t),"appendTo"===e&&this.menuWrap.appendTo(this._appendTo()),"disabled"===e&&(this.menuInstance.option("disabled",t),this.button.toggleClass("ui-state-disabled",t).attr("aria-disabled",t),this.element.prop("disabled",t),t?(this.button.attr("tabindex",-1),this.close()):this.button.attr("tabindex",0)),"width"===e&&this._resizeButton()},_appendTo:function(){var t=this.options.appendTo;return t&&(t=t.jquery||t.nodeType?e(t):this.document.find(t).eq(0)),t&&t[0]||(t=this.element.closest(".ui-front")),t.length||(t=this.document[0].body),t},_toggleAttr:function(){this.button.toggleClass("ui-corner-top",this.isOpen).toggleClass("ui-corner-all",!this.isOpen).attr("aria-expanded",this.isOpen),this.menuWrap.toggleClass("ui-selectmenu-open",this.isOpen),this.menu.attr("aria-hidden",!this.isOpen)},_resizeButton:function(){var e=this.options.width;e||(e=this.element.show().outerWidth(),this.element.hide()),this.button.outerWidth(e)},_resizeMenu:function(){this.menu.outerWidth(Math.max(this.button.outerWidth(),this.menu.width("").outerWidth()+1))},_getCreateOptions:function(){return{disabled:this.element.prop("disabled")}},_parseOptions:function(t){var i=[];t.each(function(t,s){var n=e(s),a=n.parent("optgroup");i.push({element:n,index:t,value:n.val(),label:n.text(),optgroup:a.attr("label")||"",disabled:a.prop("disabled")||n.prop("disabled")})}),this.items=i},_destroy:function(){this.menuWrap.remove(),this.button.remove(),this.element.show(),this.element.removeUniqueId(),this.label.attr("for",this.ids.element)}}),e.widget("ui.slider",e.ui.mouse,{version:"1.11.4",widgetEventPrefix:"slide",options:{animate:!1,distance:0,max:100,min:0,orientation:"horizontal",range:!1,step:1,value:0,values:null,change:null,slide:null,start:null,stop:null},numPages:5,_create:function(){this._keySliding=!1,this._mouseSliding=!1,this._animateOff=!0,this._handleIndex=null,this._detectOrientation(),this._mouseInit(),this._calculateNewMax(),this.element.addClass("ui-slider ui-slider-"+this.orientation+" ui-widget"+" ui-widget-content"+" ui-corner-all"),this._refresh(),this._setOption("disabled",this.options.disabled),this._animateOff=!1},_refresh:function(){this._createRange(),this._createHandles(),this._setupEvents(),this._refreshValue()},_createHandles:function(){var t,i,s=this.options,n=this.element.find(".ui-slider-handle").addClass("ui-state-default ui-corner-all"),a="<span class='ui-slider-handle ui-state-default ui-corner-all' tabindex='0'></span>",o=[];for(i=s.values&&s.values.length||1,n.length>i&&(n.slice(i).remove(),n=n.slice(0,i)),t=n.length;i>t;t++)o.push(a);this.handles=n.add(e(o.join("")).appendTo(this.element)),this.handle=this.handles.eq(0),this.handles.each(function(t){e(this).data("ui-slider-handle-index",t)})},_createRange:function(){var t=this.options,i="";t.range?(t.range===!0&&(t.values?t.values.length&&2!==t.values.length?t.values=[t.values[0],t.values[0]]:e.isArray(t.values)&&(t.values=t.values.slice(0)):t.values=[this._valueMin(),this._valueMin()]),this.range&&this.range.length?this.range.removeClass("ui-slider-range-min ui-slider-range-max").css({left:"",bottom:""}):(this.range=e("<div></div>").appendTo(this.element),i="ui-slider-range ui-widget-header ui-corner-all"),this.range.addClass(i+("min"===t.range||"max"===t.range?" ui-slider-range-"+t.range:""))):(this.range&&this.range.remove(),this.range=null)},_setupEvents:function(){this._off(this.handles),this._on(this.handles,this._handleEvents),this._hoverable(this.handles),this._focusable(this.handles)},_destroy:function(){this.handles.remove(),this.range&&this.range.remove(),this.element.removeClass("ui-slider ui-slider-horizontal ui-slider-vertical ui-widget ui-widget-content ui-corner-all"),this._mouseDestroy()},_mouseCapture:function(t){var i,s,n,a,o,r,h,l,u=this,d=this.options;return d.disabled?!1:(this.elementSize={width:this.element.outerWidth(),height:this.element.outerHeight()},this.elementOffset=this.element.offset(),i={x:t.pageX,y:t.pageY},s=this._normValueFromMouse(i),n=this._valueMax()-this._valueMin()+1,this.handles.each(function(t){var i=Math.abs(s-u.values(t));(n>i||n===i&&(t===u._lastChangedValue||u.values(t)===d.min))&&(n=i,a=e(this),o=t)}),r=this._start(t,o),r===!1?!1:(this._mouseSliding=!0,this._handleIndex=o,a.addClass("ui-state-active").focus(),h=a.offset(),l=!e(t.target).parents().addBack().is(".ui-slider-handle"),this._clickOffset=l?{left:0,top:0}:{left:t.pageX-h.left-a.width()/2,top:t.pageY-h.top-a.height()/2-(parseInt(a.css("borderTopWidth"),10)||0)-(parseInt(a.css("borderBottomWidth"),10)||0)+(parseInt(a.css("marginTop"),10)||0)},this.handles.hasClass("ui-state-hover")||this._slide(t,o,s),this._animateOff=!0,!0))},_mouseStart:function(){return!0},_mouseDrag:function(e){var t={x:e.pageX,y:e.pageY},i=this._normValueFromMouse(t);return this._slide(e,this._handleIndex,i),!1},_mouseStop:function(e){return this.handles.removeClass("ui-state-active"),this._mouseSliding=!1,this._stop(e,this._handleIndex),this._change(e,this._handleIndex),this._handleIndex=null,this._clickOffset=null,this._animateOff=!1,!1},_detectOrientation:function(){this.orientation="vertical"===this.options.orientation?"vertical":"horizontal"},_normValueFromMouse:function(e){var t,i,s,n,a;return"horizontal"===this.orientation?(t=this.elementSize.width,i=e.x-this.elementOffset.left-(this._clickOffset?this._clickOffset.left:0)):(t=this.elementSize.height,i=e.y-this.elementOffset.top-(this._clickOffset?this._clickOffset.top:0)),s=i/t,s>1&&(s=1),0>s&&(s=0),"vertical"===this.orientation&&(s=1-s),n=this._valueMax()-this._valueMin(),a=this._valueMin()+s*n,this._trimAlignValue(a)},_start:function(e,t){var i={handle:this.handles[t],value:this.value()};return this.options.values&&this.options.values.length&&(i.value=this.values(t),i.values=this.values()),this._trigger("start",e,i)},_slide:function(e,t,i){var s,n,a;this.options.values&&this.options.values.length?(s=this.values(t?0:1),2===this.options.values.length&&this.options.range===!0&&(0===t&&i>s||1===t&&s>i)&&(i=s),i!==this.values(t)&&(n=this.values(),n[t]=i,a=this._trigger("slide",e,{handle:this.handles[t],value:i,values:n}),s=this.values(t?0:1),a!==!1&&this.values(t,i))):i!==this.value()&&(a=this._trigger("slide",e,{handle:this.handles[t],value:i}),a!==!1&&this.value(i))},_stop:function(e,t){var i={handle:this.handles[t],value:this.value()};this.options.values&&this.options.values.length&&(i.value=this.values(t),i.values=this.values()),this._trigger("stop",e,i)},_change:function(e,t){if(!this._keySliding&&!this._mouseSliding){var i={handle:this.handles[t],value:this.value()};this.options.values&&this.options.values.length&&(i.value=this.values(t),i.values=this.values()),this._lastChangedValue=t,this._trigger("change",e,i)}},value:function(e){return arguments.length?(this.options.value=this._trimAlignValue(e),this._refreshValue(),this._change(null,0),void 0):this._value()},values:function(t,i){var s,n,a;if(arguments.length>1)return this.options.values[t]=this._trimAlignValue(i),this._refreshValue(),this._change(null,t),void 0;if(!arguments.length)return this._values();if(!e.isArray(arguments[0]))return this.options.values&&this.options.values.length?this._values(t):this.value();for(s=this.options.values,n=arguments[0],a=0;s.length>a;a+=1)s[a]=this._trimAlignValue(n[a]),this._change(null,a);this._refreshValue()},_setOption:function(t,i){var s,n=0;switch("range"===t&&this.options.range===!0&&("min"===i?(this.options.value=this._values(0),this.options.values=null):"max"===i&&(this.options.value=this._values(this.options.values.length-1),this.options.values=null)),e.isArray(this.options.values)&&(n=this.options.values.length),"disabled"===t&&this.element.toggleClass("ui-state-disabled",!!i),this._super(t,i),t){case"orientation":this._detectOrientation(),this.element.removeClass("ui-slider-horizontal ui-slider-vertical").addClass("ui-slider-"+this.orientation),this._refreshValue(),this.handles.css("horizontal"===i?"bottom":"left","");break;case"value":this._animateOff=!0,this._refreshValue(),this._change(null,0),this._animateOff=!1;break;case"values":for(this._animateOff=!0,this._refreshValue(),s=0;n>s;s+=1)this._change(null,s);this._animateOff=!1;break;case"step":case"min":case"max":this._animateOff=!0,this._calculateNewMax(),this._refreshValue(),this._animateOff=!1;break;case"range":this._animateOff=!0,this._refresh(),this._animateOff=!1}},_value:function(){var e=this.options.value;return e=this._trimAlignValue(e)},_values:function(e){var t,i,s;if(arguments.length)return t=this.options.values[e],t=this._trimAlignValue(t);if(this.options.values&&this.options.values.length){for(i=this.options.values.slice(),s=0;i.length>s;s+=1)i[s]=this._trimAlignValue(i[s]);return i}return[]},_trimAlignValue:function(e){if(this._valueMin()>=e)return this._valueMin();if(e>=this._valueMax())return this._valueMax();var t=this.options.step>0?this.options.step:1,i=(e-this._valueMin())%t,s=e-i;return 2*Math.abs(i)>=t&&(s+=i>0?t:-t),parseFloat(s.toFixed(5))},_calculateNewMax:function(){var e=this.options.max,t=this._valueMin(),i=this.options.step,s=Math.floor(+(e-t).toFixed(this._precision())/i)*i;e=s+t,this.max=parseFloat(e.toFixed(this._precision()))},_precision:function(){var e=this._precisionOf(this.options.step);return null!==this.options.min&&(e=Math.max(e,this._precisionOf(this.options.min))),e},_precisionOf:function(e){var t=""+e,i=t.indexOf(".");return-1===i?0:t.length-i-1},_valueMin:function(){return this.options.min},_valueMax:function(){return this.max},_refreshValue:function(){var t,i,s,n,a,o=this.options.range,r=this.options,h=this,l=this._animateOff?!1:r.animate,u={};this.options.values&&this.options.values.length?this.handles.each(function(s){i=100*((h.values(s)-h._valueMin())/(h._valueMax()-h._valueMin())),u["horizontal"===h.orientation?"left":"bottom"]=i+"%",e(this).stop(1,1)[l?"animate":"css"](u,r.animate),h.options.range===!0&&("horizontal"===h.orientation?(0===s&&h.range.stop(1,1)[l?"animate":"css"]({left:i+"%"},r.animate),1===s&&h.range[l?"animate":"css"]({width:i-t+"%"},{queue:!1,duration:r.animate})):(0===s&&h.range.stop(1,1)[l?"animate":"css"]({bottom:i+"%"},r.animate),1===s&&h.range[l?"animate":"css"]({height:i-t+"%"},{queue:!1,duration:r.animate}))),t=i}):(s=this.value(),n=this._valueMin(),a=this._valueMax(),i=a!==n?100*((s-n)/(a-n)):0,u["horizontal"===this.orientation?"left":"bottom"]=i+"%",this.handle.stop(1,1)[l?"animate":"css"](u,r.animate),"min"===o&&"horizontal"===this.orientation&&this.range.stop(1,1)[l?"animate":"css"]({width:i+"%"},r.animate),"max"===o&&"horizontal"===this.orientation&&this.range[l?"animate":"css"]({width:100-i+"%"},{queue:!1,duration:r.animate}),"min"===o&&"vertical"===this.orientation&&this.range.stop(1,1)[l?"animate":"css"]({height:i+"%"},r.animate),"max"===o&&"vertical"===this.orientation&&this.range[l?"animate":"css"]({height:100-i+"%"},{queue:!1,duration:r.animate}))},_handleEvents:{keydown:function(t){var i,s,n,a,o=e(t.target).data("ui-slider-handle-index");switch(t.keyCode){case e.ui.keyCode.HOME:case e.ui.keyCode.END:case e.ui.keyCode.PAGE_UP:case e.ui.keyCode.PAGE_DOWN:case e.ui.keyCode.UP:case e.ui.keyCode.RIGHT:case e.ui.keyCode.DOWN:case e.ui.keyCode.LEFT:if(t.preventDefault(),!this._keySliding&&(this._keySliding=!0,e(t.target).addClass("ui-state-active"),i=this._start(t,o),i===!1))return}switch(a=this.options.step,s=n=this.options.values&&this.options.values.length?this.values(o):this.value(),t.keyCode){case e.ui.keyCode.HOME:n=this._valueMin();break;case e.ui.keyCode.END:n=this._valueMax();break;case e.ui.keyCode.PAGE_UP:n=this._trimAlignValue(s+(this._valueMax()-this._valueMin())/this.numPages);break;case e.ui.keyCode.PAGE_DOWN:n=this._trimAlignValue(s-(this._valueMax()-this._valueMin())/this.numPages);break;case e.ui.keyCode.UP:case e.ui.keyCode.RIGHT:if(s===this._valueMax())return;n=this._trimAlignValue(s+a);break;case e.ui.keyCode.DOWN:case e.ui.keyCode.LEFT:if(s===this._valueMin())return;n=this._trimAlignValue(s-a)}this._slide(t,o,n)},keyup:function(t){var i=e(t.target).data("ui-slider-handle-index");this._keySliding&&(this._keySliding=!1,this._stop(t,i),this._change(t,i),e(t.target).removeClass("ui-state-active"))}}}),e.widget("ui.spinner",{version:"1.11.4",defaultElement:"<input>",widgetEventPrefix:"spin",options:{culture:null,icons:{down:"ui-icon-triangle-1-s",up:"ui-icon-triangle-1-n"},incremental:!0,max:null,min:null,numberFormat:null,page:10,step:1,change:null,spin:null,start:null,stop:null},_create:function(){this._setOption("max",this.options.max),this._setOption("min",this.options.min),this._setOption("step",this.options.step),""!==this.value()&&this._value(this.element.val(),!0),this._draw(),this._on(this._events),this._refresh(),this._on(this.window,{beforeunload:function(){this.element.removeAttr("autocomplete")}})},_getCreateOptions:function(){var t={},i=this.element;return e.each(["min","max","step"],function(e,s){var n=i.attr(s);void 0!==n&&n.length&&(t[s]=n)}),t},_events:{keydown:function(e){this._start(e)&&this._keydown(e)&&e.preventDefault()},keyup:"_stop",focus:function(){this.previous=this.element.val()},blur:function(e){return this.cancelBlur?(delete this.cancelBlur,void 0):(this._stop(),this._refresh(),this.previous!==this.element.val()&&this._trigger("change",e),void 0)},mousewheel:function(e,t){if(t){if(!this.spinning&&!this._start(e))return!1;this._spin((t>0?1:-1)*this.options.step,e),clearTimeout(this.mousewheelTimer),this.mousewheelTimer=this._delay(function(){this.spinning&&this._stop(e)},100),e.preventDefault()}},"mousedown .ui-spinner-button":function(t){function i(){var e=this.element[0]===this.document[0].activeElement;e||(this.element.focus(),this.previous=s,this._delay(function(){this.previous=s}))}var s;s=this.element[0]===this.document[0].activeElement?this.previous:this.element.val(),t.preventDefault(),i.call(this),this.cancelBlur=!0,this._delay(function(){delete this.cancelBlur,i.call(this)}),this._start(t)!==!1&&this._repeat(null,e(t.currentTarget).hasClass("ui-spinner-up")?1:-1,t)},"mouseup .ui-spinner-button":"_stop","mouseenter .ui-spinner-button":function(t){return e(t.currentTarget).hasClass("ui-state-active")?this._start(t)===!1?!1:(this._repeat(null,e(t.currentTarget).hasClass("ui-spinner-up")?1:-1,t),void 0):void 0},"mouseleave .ui-spinner-button":"_stop"},_draw:function(){var e=this.uiSpinner=this.element.addClass("ui-spinner-input").attr("autocomplete","off").wrap(this._uiSpinnerHtml()).parent().append(this._buttonHtml());this.element.attr("role","spinbutton"),this.buttons=e.find(".ui-spinner-button").attr("tabIndex",-1).button().removeClass("ui-corner-all"),this.buttons.height()>Math.ceil(.5*e.height())&&e.height()>0&&e.height(e.height()),this.options.disabled&&this.disable()
},_keydown:function(t){var i=this.options,s=e.ui.keyCode;switch(t.keyCode){case s.UP:return this._repeat(null,1,t),!0;case s.DOWN:return this._repeat(null,-1,t),!0;case s.PAGE_UP:return this._repeat(null,i.page,t),!0;case s.PAGE_DOWN:return this._repeat(null,-i.page,t),!0}return!1},_uiSpinnerHtml:function(){return"<span class='ui-spinner ui-widget ui-widget-content ui-corner-all'></span>"},_buttonHtml:function(){return"<a class='ui-spinner-button ui-spinner-up ui-corner-tr'><span class='ui-icon "+this.options.icons.up+"'>&#9650;</span>"+"</a>"+"<a class='ui-spinner-button ui-spinner-down ui-corner-br'>"+"<span class='ui-icon "+this.options.icons.down+"'>&#9660;</span>"+"</a>"},_start:function(e){return this.spinning||this._trigger("start",e)!==!1?(this.counter||(this.counter=1),this.spinning=!0,!0):!1},_repeat:function(e,t,i){e=e||500,clearTimeout(this.timer),this.timer=this._delay(function(){this._repeat(40,t,i)},e),this._spin(t*this.options.step,i)},_spin:function(e,t){var i=this.value()||0;this.counter||(this.counter=1),i=this._adjustValue(i+e*this._increment(this.counter)),this.spinning&&this._trigger("spin",t,{value:i})===!1||(this._value(i),this.counter++)},_increment:function(t){var i=this.options.incremental;return i?e.isFunction(i)?i(t):Math.floor(t*t*t/5e4-t*t/500+17*t/200+1):1},_precision:function(){var e=this._precisionOf(this.options.step);return null!==this.options.min&&(e=Math.max(e,this._precisionOf(this.options.min))),e},_precisionOf:function(e){var t=""+e,i=t.indexOf(".");return-1===i?0:t.length-i-1},_adjustValue:function(e){var t,i,s=this.options;return t=null!==s.min?s.min:0,i=e-t,i=Math.round(i/s.step)*s.step,e=t+i,e=parseFloat(e.toFixed(this._precision())),null!==s.max&&e>s.max?s.max:null!==s.min&&s.min>e?s.min:e},_stop:function(e){this.spinning&&(clearTimeout(this.timer),clearTimeout(this.mousewheelTimer),this.counter=0,this.spinning=!1,this._trigger("stop",e))},_setOption:function(e,t){if("culture"===e||"numberFormat"===e){var i=this._parse(this.element.val());return this.options[e]=t,this.element.val(this._format(i)),void 0}("max"===e||"min"===e||"step"===e)&&"string"==typeof t&&(t=this._parse(t)),"icons"===e&&(this.buttons.first().find(".ui-icon").removeClass(this.options.icons.up).addClass(t.up),this.buttons.last().find(".ui-icon").removeClass(this.options.icons.down).addClass(t.down)),this._super(e,t),"disabled"===e&&(this.widget().toggleClass("ui-state-disabled",!!t),this.element.prop("disabled",!!t),this.buttons.button(t?"disable":"enable"))},_setOptions:h(function(e){this._super(e)}),_parse:function(e){return"string"==typeof e&&""!==e&&(e=window.Globalize&&this.options.numberFormat?Globalize.parseFloat(e,10,this.options.culture):+e),""===e||isNaN(e)?null:e},_format:function(e){return""===e?"":window.Globalize&&this.options.numberFormat?Globalize.format(e,this.options.numberFormat,this.options.culture):e},_refresh:function(){this.element.attr({"aria-valuemin":this.options.min,"aria-valuemax":this.options.max,"aria-valuenow":this._parse(this.element.val())})},isValid:function(){var e=this.value();return null===e?!1:e===this._adjustValue(e)},_value:function(e,t){var i;""!==e&&(i=this._parse(e),null!==i&&(t||(i=this._adjustValue(i)),e=this._format(i))),this.element.val(e),this._refresh()},_destroy:function(){this.element.removeClass("ui-spinner-input").prop("disabled",!1).removeAttr("autocomplete").removeAttr("role").removeAttr("aria-valuemin").removeAttr("aria-valuemax").removeAttr("aria-valuenow"),this.uiSpinner.replaceWith(this.element)},stepUp:h(function(e){this._stepUp(e)}),_stepUp:function(e){this._start()&&(this._spin((e||1)*this.options.step),this._stop())},stepDown:h(function(e){this._stepDown(e)}),_stepDown:function(e){this._start()&&(this._spin((e||1)*-this.options.step),this._stop())},pageUp:h(function(e){this._stepUp((e||1)*this.options.page)}),pageDown:h(function(e){this._stepDown((e||1)*this.options.page)}),value:function(e){return arguments.length?(h(this._value).call(this,e),void 0):this._parse(this.element.val())},widget:function(){return this.uiSpinner}}),e.widget("ui.tabs",{version:"1.11.4",delay:300,options:{active:null,collapsible:!1,event:"click",heightStyle:"content",hide:null,show:null,activate:null,beforeActivate:null,beforeLoad:null,load:null},_isLocal:function(){var e=/#.*$/;return function(t){var i,s;t=t.cloneNode(!1),i=t.href.replace(e,""),s=location.href.replace(e,"");try{i=decodeURIComponent(i)}catch(n){}try{s=decodeURIComponent(s)}catch(n){}return t.hash.length>1&&i===s}}(),_create:function(){var t=this,i=this.options;this.running=!1,this.element.addClass("ui-tabs ui-widget ui-widget-content ui-corner-all").toggleClass("ui-tabs-collapsible",i.collapsible),this._processTabs(),i.active=this._initialActive(),e.isArray(i.disabled)&&(i.disabled=e.unique(i.disabled.concat(e.map(this.tabs.filter(".ui-state-disabled"),function(e){return t.tabs.index(e)}))).sort()),this.active=this.options.active!==!1&&this.anchors.length?this._findActive(i.active):e(),this._refresh(),this.active.length&&this.load(i.active)},_initialActive:function(){var t=this.options.active,i=this.options.collapsible,s=location.hash.substring(1);return null===t&&(s&&this.tabs.each(function(i,n){return e(n).attr("aria-controls")===s?(t=i,!1):void 0}),null===t&&(t=this.tabs.index(this.tabs.filter(".ui-tabs-active"))),(null===t||-1===t)&&(t=this.tabs.length?0:!1)),t!==!1&&(t=this.tabs.index(this.tabs.eq(t)),-1===t&&(t=i?!1:0)),!i&&t===!1&&this.anchors.length&&(t=0),t},_getCreateEventData:function(){return{tab:this.active,panel:this.active.length?this._getPanelForTab(this.active):e()}},_tabKeydown:function(t){var i=e(this.document[0].activeElement).closest("li"),s=this.tabs.index(i),n=!0;if(!this._handlePageNav(t)){switch(t.keyCode){case e.ui.keyCode.RIGHT:case e.ui.keyCode.DOWN:s++;break;case e.ui.keyCode.UP:case e.ui.keyCode.LEFT:n=!1,s--;break;case e.ui.keyCode.END:s=this.anchors.length-1;break;case e.ui.keyCode.HOME:s=0;break;case e.ui.keyCode.SPACE:return t.preventDefault(),clearTimeout(this.activating),this._activate(s),void 0;case e.ui.keyCode.ENTER:return t.preventDefault(),clearTimeout(this.activating),this._activate(s===this.options.active?!1:s),void 0;default:return}t.preventDefault(),clearTimeout(this.activating),s=this._focusNextTab(s,n),t.ctrlKey||t.metaKey||(i.attr("aria-selected","false"),this.tabs.eq(s).attr("aria-selected","true"),this.activating=this._delay(function(){this.option("active",s)},this.delay))}},_panelKeydown:function(t){this._handlePageNav(t)||t.ctrlKey&&t.keyCode===e.ui.keyCode.UP&&(t.preventDefault(),this.active.focus())},_handlePageNav:function(t){return t.altKey&&t.keyCode===e.ui.keyCode.PAGE_UP?(this._activate(this._focusNextTab(this.options.active-1,!1)),!0):t.altKey&&t.keyCode===e.ui.keyCode.PAGE_DOWN?(this._activate(this._focusNextTab(this.options.active+1,!0)),!0):void 0},_findNextTab:function(t,i){function s(){return t>n&&(t=0),0>t&&(t=n),t}for(var n=this.tabs.length-1;-1!==e.inArray(s(),this.options.disabled);)t=i?t+1:t-1;return t},_focusNextTab:function(e,t){return e=this._findNextTab(e,t),this.tabs.eq(e).focus(),e},_setOption:function(e,t){return"active"===e?(this._activate(t),void 0):"disabled"===e?(this._setupDisabled(t),void 0):(this._super(e,t),"collapsible"===e&&(this.element.toggleClass("ui-tabs-collapsible",t),t||this.options.active!==!1||this._activate(0)),"event"===e&&this._setupEvents(t),"heightStyle"===e&&this._setupHeightStyle(t),void 0)},_sanitizeSelector:function(e){return e?e.replace(/[!"$%&'()*+,.\/:;<=>?@\[\]\^`{|}~]/g,"\\$&"):""},refresh:function(){var t=this.options,i=this.tablist.children(":has(a[href])");t.disabled=e.map(i.filter(".ui-state-disabled"),function(e){return i.index(e)}),this._processTabs(),t.active!==!1&&this.anchors.length?this.active.length&&!e.contains(this.tablist[0],this.active[0])?this.tabs.length===t.disabled.length?(t.active=!1,this.active=e()):this._activate(this._findNextTab(Math.max(0,t.active-1),!1)):t.active=this.tabs.index(this.active):(t.active=!1,this.active=e()),this._refresh()},_refresh:function(){this._setupDisabled(this.options.disabled),this._setupEvents(this.options.event),this._setupHeightStyle(this.options.heightStyle),this.tabs.not(this.active).attr({"aria-selected":"false","aria-expanded":"false",tabIndex:-1}),this.panels.not(this._getPanelForTab(this.active)).hide().attr({"aria-hidden":"true"}),this.active.length?(this.active.addClass("ui-tabs-active ui-state-active").attr({"aria-selected":"true","aria-expanded":"true",tabIndex:0}),this._getPanelForTab(this.active).show().attr({"aria-hidden":"false"})):this.tabs.eq(0).attr("tabIndex",0)},_processTabs:function(){var t=this,i=this.tabs,s=this.anchors,n=this.panels;this.tablist=this._getList().addClass("ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all").attr("role","tablist").delegate("> li","mousedown"+this.eventNamespace,function(t){e(this).is(".ui-state-disabled")&&t.preventDefault()}).delegate(".ui-tabs-anchor","focus"+this.eventNamespace,function(){e(this).closest("li").is(".ui-state-disabled")&&this.blur()}),this.tabs=this.tablist.find("> li:has(a[href])").addClass("ui-state-default ui-corner-top").attr({role:"tab",tabIndex:-1}),this.anchors=this.tabs.map(function(){return e("a",this)[0]}).addClass("ui-tabs-anchor").attr({role:"presentation",tabIndex:-1}),this.panels=e(),this.anchors.each(function(i,s){var n,a,o,r=e(s).uniqueId().attr("id"),h=e(s).closest("li"),l=h.attr("aria-controls");t._isLocal(s)?(n=s.hash,o=n.substring(1),a=t.element.find(t._sanitizeSelector(n))):(o=h.attr("aria-controls")||e({}).uniqueId()[0].id,n="#"+o,a=t.element.find(n),a.length||(a=t._createPanel(o),a.insertAfter(t.panels[i-1]||t.tablist)),a.attr("aria-live","polite")),a.length&&(t.panels=t.panels.add(a)),l&&h.data("ui-tabs-aria-controls",l),h.attr({"aria-controls":o,"aria-labelledby":r}),a.attr("aria-labelledby",r)}),this.panels.addClass("ui-tabs-panel ui-widget-content ui-corner-bottom").attr("role","tabpanel"),i&&(this._off(i.not(this.tabs)),this._off(s.not(this.anchors)),this._off(n.not(this.panels)))},_getList:function(){return this.tablist||this.element.find("ol,ul").eq(0)},_createPanel:function(t){return e("<div>").attr("id",t).addClass("ui-tabs-panel ui-widget-content ui-corner-bottom").data("ui-tabs-destroy",!0)},_setupDisabled:function(t){e.isArray(t)&&(t.length?t.length===this.anchors.length&&(t=!0):t=!1);for(var i,s=0;i=this.tabs[s];s++)t===!0||-1!==e.inArray(s,t)?e(i).addClass("ui-state-disabled").attr("aria-disabled","true"):e(i).removeClass("ui-state-disabled").removeAttr("aria-disabled");this.options.disabled=t},_setupEvents:function(t){var i={};t&&e.each(t.split(" "),function(e,t){i[t]="_eventHandler"}),this._off(this.anchors.add(this.tabs).add(this.panels)),this._on(!0,this.anchors,{click:function(e){e.preventDefault()}}),this._on(this.anchors,i),this._on(this.tabs,{keydown:"_tabKeydown"}),this._on(this.panels,{keydown:"_panelKeydown"}),this._focusable(this.tabs),this._hoverable(this.tabs)},_setupHeightStyle:function(t){var i,s=this.element.parent();"fill"===t?(i=s.height(),i-=this.element.outerHeight()-this.element.height(),this.element.siblings(":visible").each(function(){var t=e(this),s=t.css("position");"absolute"!==s&&"fixed"!==s&&(i-=t.outerHeight(!0))}),this.element.children().not(this.panels).each(function(){i-=e(this).outerHeight(!0)}),this.panels.each(function(){e(this).height(Math.max(0,i-e(this).innerHeight()+e(this).height()))}).css("overflow","auto")):"auto"===t&&(i=0,this.panels.each(function(){i=Math.max(i,e(this).height("").height())}).height(i))},_eventHandler:function(t){var i=this.options,s=this.active,n=e(t.currentTarget),a=n.closest("li"),o=a[0]===s[0],r=o&&i.collapsible,h=r?e():this._getPanelForTab(a),l=s.length?this._getPanelForTab(s):e(),u={oldTab:s,oldPanel:l,newTab:r?e():a,newPanel:h};t.preventDefault(),a.hasClass("ui-state-disabled")||a.hasClass("ui-tabs-loading")||this.running||o&&!i.collapsible||this._trigger("beforeActivate",t,u)===!1||(i.active=r?!1:this.tabs.index(a),this.active=o?e():a,this.xhr&&this.xhr.abort(),l.length||h.length||e.error("jQuery UI Tabs: Mismatching fragment identifier."),h.length&&this.load(this.tabs.index(a),t),this._toggle(t,u))},_toggle:function(t,i){function s(){a.running=!1,a._trigger("activate",t,i)}function n(){i.newTab.closest("li").addClass("ui-tabs-active ui-state-active"),o.length&&a.options.show?a._show(o,a.options.show,s):(o.show(),s())}var a=this,o=i.newPanel,r=i.oldPanel;this.running=!0,r.length&&this.options.hide?this._hide(r,this.options.hide,function(){i.oldTab.closest("li").removeClass("ui-tabs-active ui-state-active"),n()}):(i.oldTab.closest("li").removeClass("ui-tabs-active ui-state-active"),r.hide(),n()),r.attr("aria-hidden","true"),i.oldTab.attr({"aria-selected":"false","aria-expanded":"false"}),o.length&&r.length?i.oldTab.attr("tabIndex",-1):o.length&&this.tabs.filter(function(){return 0===e(this).attr("tabIndex")}).attr("tabIndex",-1),o.attr("aria-hidden","false"),i.newTab.attr({"aria-selected":"true","aria-expanded":"true",tabIndex:0})},_activate:function(t){var i,s=this._findActive(t);s[0]!==this.active[0]&&(s.length||(s=this.active),i=s.find(".ui-tabs-anchor")[0],this._eventHandler({target:i,currentTarget:i,preventDefault:e.noop}))},_findActive:function(t){return t===!1?e():this.tabs.eq(t)},_getIndex:function(e){return"string"==typeof e&&(e=this.anchors.index(this.anchors.filter("[href$='"+e+"']"))),e},_destroy:function(){this.xhr&&this.xhr.abort(),this.element.removeClass("ui-tabs ui-widget ui-widget-content ui-corner-all ui-tabs-collapsible"),this.tablist.removeClass("ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all").removeAttr("role"),this.anchors.removeClass("ui-tabs-anchor").removeAttr("role").removeAttr("tabIndex").removeUniqueId(),this.tablist.unbind(this.eventNamespace),this.tabs.add(this.panels).each(function(){e.data(this,"ui-tabs-destroy")?e(this).remove():e(this).removeClass("ui-state-default ui-state-active ui-state-disabled ui-corner-top ui-corner-bottom ui-widget-content ui-tabs-active ui-tabs-panel").removeAttr("tabIndex").removeAttr("aria-live").removeAttr("aria-busy").removeAttr("aria-selected").removeAttr("aria-labelledby").removeAttr("aria-hidden").removeAttr("aria-expanded").removeAttr("role")}),this.tabs.each(function(){var t=e(this),i=t.data("ui-tabs-aria-controls");i?t.attr("aria-controls",i).removeData("ui-tabs-aria-controls"):t.removeAttr("aria-controls")}),this.panels.show(),"content"!==this.options.heightStyle&&this.panels.css("height","")},enable:function(t){var i=this.options.disabled;i!==!1&&(void 0===t?i=!1:(t=this._getIndex(t),i=e.isArray(i)?e.map(i,function(e){return e!==t?e:null}):e.map(this.tabs,function(e,i){return i!==t?i:null})),this._setupDisabled(i))},disable:function(t){var i=this.options.disabled;if(i!==!0){if(void 0===t)i=!0;else{if(t=this._getIndex(t),-1!==e.inArray(t,i))return;i=e.isArray(i)?e.merge([t],i).sort():[t]}this._setupDisabled(i)}},load:function(t,i){t=this._getIndex(t);var s=this,n=this.tabs.eq(t),a=n.find(".ui-tabs-anchor"),o=this._getPanelForTab(n),r={tab:n,panel:o},h=function(e,t){"abort"===t&&s.panels.stop(!1,!0),n.removeClass("ui-tabs-loading"),o.removeAttr("aria-busy"),e===s.xhr&&delete s.xhr};this._isLocal(a[0])||(this.xhr=e.ajax(this._ajaxSettings(a,i,r)),this.xhr&&"canceled"!==this.xhr.statusText&&(n.addClass("ui-tabs-loading"),o.attr("aria-busy","true"),this.xhr.done(function(e,t,n){setTimeout(function(){o.html(e),s._trigger("load",i,r),h(n,t)},1)}).fail(function(e,t){setTimeout(function(){h(e,t)},1)})))},_ajaxSettings:function(t,i,s){var n=this;return{url:t.attr("href"),beforeSend:function(t,a){return n._trigger("beforeLoad",i,e.extend({jqXHR:t,ajaxSettings:a},s))}}},_getPanelForTab:function(t){var i=e(t).attr("aria-controls");return this.element.find(this._sanitizeSelector("#"+i))}}),e.widget("ui.tooltip",{version:"1.11.4",options:{content:function(){var t=e(this).attr("title")||"";return e("<a>").text(t).html()},hide:!0,items:"[title]:not([disabled])",position:{my:"left top+15",at:"left bottom",collision:"flipfit flip"},show:!0,tooltipClass:null,track:!1,close:null,open:null},_addDescribedBy:function(t,i){var s=(t.attr("aria-describedby")||"").split(/\s+/);s.push(i),t.data("ui-tooltip-id",i).attr("aria-describedby",e.trim(s.join(" ")))},_removeDescribedBy:function(t){var i=t.data("ui-tooltip-id"),s=(t.attr("aria-describedby")||"").split(/\s+/),n=e.inArray(i,s);-1!==n&&s.splice(n,1),t.removeData("ui-tooltip-id"),s=e.trim(s.join(" ")),s?t.attr("aria-describedby",s):t.removeAttr("aria-describedby")},_create:function(){this._on({mouseover:"open",focusin:"open"}),this.tooltips={},this.parents={},this.options.disabled&&this._disable(),this.liveRegion=e("<div>").attr({role:"log","aria-live":"assertive","aria-relevant":"additions"}).addClass("ui-helper-hidden-accessible").appendTo(this.document[0].body)},_setOption:function(t,i){var s=this;return"disabled"===t?(this[i?"_disable":"_enable"](),this.options[t]=i,void 0):(this._super(t,i),"content"===t&&e.each(this.tooltips,function(e,t){s._updateContent(t.element)}),void 0)},_disable:function(){var t=this;e.each(this.tooltips,function(i,s){var n=e.Event("blur");n.target=n.currentTarget=s.element[0],t.close(n,!0)}),this.element.find(this.options.items).addBack().each(function(){var t=e(this);t.is("[title]")&&t.data("ui-tooltip-title",t.attr("title")).removeAttr("title")})},_enable:function(){this.element.find(this.options.items).addBack().each(function(){var t=e(this);t.data("ui-tooltip-title")&&t.attr("title",t.data("ui-tooltip-title"))})},open:function(t){var i=this,s=e(t?t.target:this.element).closest(this.options.items);s.length&&!s.data("ui-tooltip-id")&&(s.attr("title")&&s.data("ui-tooltip-title",s.attr("title")),s.data("ui-tooltip-open",!0),t&&"mouseover"===t.type&&s.parents().each(function(){var t,s=e(this);s.data("ui-tooltip-open")&&(t=e.Event("blur"),t.target=t.currentTarget=this,i.close(t,!0)),s.attr("title")&&(s.uniqueId(),i.parents[this.id]={element:this,title:s.attr("title")},s.attr("title",""))}),this._registerCloseHandlers(t,s),this._updateContent(s,t))},_updateContent:function(e,t){var i,s=this.options.content,n=this,a=t?t.type:null;return"string"==typeof s?this._open(t,e,s):(i=s.call(e[0],function(i){n._delay(function(){e.data("ui-tooltip-open")&&(t&&(t.type=a),this._open(t,e,i))})}),i&&this._open(t,e,i),void 0)},_open:function(t,i,s){function n(e){l.of=e,o.is(":hidden")||o.position(l)}var a,o,r,h,l=e.extend({},this.options.position);if(s){if(a=this._find(i))return a.tooltip.find(".ui-tooltip-content").html(s),void 0;i.is("[title]")&&(t&&"mouseover"===t.type?i.attr("title",""):i.removeAttr("title")),a=this._tooltip(i),o=a.tooltip,this._addDescribedBy(i,o.attr("id")),o.find(".ui-tooltip-content").html(s),this.liveRegion.children().hide(),s.clone?(h=s.clone(),h.removeAttr("id").find("[id]").removeAttr("id")):h=s,e("<div>").html(h).appendTo(this.liveRegion),this.options.track&&t&&/^mouse/.test(t.type)?(this._on(this.document,{mousemove:n}),n(t)):o.position(e.extend({of:i},this.options.position)),o.hide(),this._show(o,this.options.show),this.options.show&&this.options.show.delay&&(r=this.delayedShow=setInterval(function(){o.is(":visible")&&(n(l.of),clearInterval(r))},e.fx.interval)),this._trigger("open",t,{tooltip:o})}},_registerCloseHandlers:function(t,i){var s={keyup:function(t){if(t.keyCode===e.ui.keyCode.ESCAPE){var s=e.Event(t);s.currentTarget=i[0],this.close(s,!0)}}};i[0]!==this.element[0]&&(s.remove=function(){this._removeTooltip(this._find(i).tooltip)}),t&&"mouseover"!==t.type||(s.mouseleave="close"),t&&"focusin"!==t.type||(s.focusout="close"),this._on(!0,i,s)},close:function(t){var i,s=this,n=e(t?t.currentTarget:this.element),a=this._find(n);return a?(i=a.tooltip,a.closing||(clearInterval(this.delayedShow),n.data("ui-tooltip-title")&&!n.attr("title")&&n.attr("title",n.data("ui-tooltip-title")),this._removeDescribedBy(n),a.hiding=!0,i.stop(!0),this._hide(i,this.options.hide,function(){s._removeTooltip(e(this))}),n.removeData("ui-tooltip-open"),this._off(n,"mouseleave focusout keyup"),n[0]!==this.element[0]&&this._off(n,"remove"),this._off(this.document,"mousemove"),t&&"mouseleave"===t.type&&e.each(this.parents,function(t,i){e(i.element).attr("title",i.title),delete s.parents[t]}),a.closing=!0,this._trigger("close",t,{tooltip:i}),a.hiding||(a.closing=!1)),void 0):(n.removeData("ui-tooltip-open"),void 0)},_tooltip:function(t){var i=e("<div>").attr("role","tooltip").addClass("ui-tooltip ui-widget ui-corner-all ui-widget-content "+(this.options.tooltipClass||"")),s=i.uniqueId().attr("id");return e("<div>").addClass("ui-tooltip-content").appendTo(i),i.appendTo(this.document[0].body),this.tooltips[s]={element:t,tooltip:i}},_find:function(e){var t=e.data("ui-tooltip-id");return t?this.tooltips[t]:null},_removeTooltip:function(e){e.remove(),delete this.tooltips[e.attr("id")]},_destroy:function(){var t=this;e.each(this.tooltips,function(i,s){var n=e.Event("blur"),a=s.element;n.target=n.currentTarget=a[0],t.close(n,!0),e("#"+i).remove(),a.data("ui-tooltip-title")&&(a.attr("title")||a.attr("title",a.data("ui-tooltip-title")),a.removeData("ui-tooltip-title"))}),this.liveRegion.remove()}});var y="ui-effects-",b=e;e.effects={effect:{}},function(e,t){function i(e,t,i){var s=d[t.type]||{};return null==e?i||!t.def?null:t.def:(e=s.floor?~~e:parseFloat(e),isNaN(e)?t.def:s.mod?(e+s.mod)%s.mod:0>e?0:e>s.max?s.max:e)}function s(i){var s=l(),n=s._rgba=[];return i=i.toLowerCase(),f(h,function(e,a){var o,r=a.re.exec(i),h=r&&a.parse(r),l=a.space||"rgba";return h?(o=s[l](h),s[u[l].cache]=o[u[l].cache],n=s._rgba=o._rgba,!1):t}),n.length?("0,0,0,0"===n.join()&&e.extend(n,a.transparent),s):a[i]}function n(e,t,i){return i=(i+1)%1,1>6*i?e+6*(t-e)*i:1>2*i?t:2>3*i?e+6*(t-e)*(2/3-i):e}var a,o="backgroundColor borderBottomColor borderLeftColor borderRightColor borderTopColor color columnRuleColor outlineColor textDecorationColor textEmphasisColor",r=/^([\-+])=\s*(\d+\.?\d*)/,h=[{re:/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,parse:function(e){return[e[1],e[2],e[3],e[4]]}},{re:/rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,parse:function(e){return[2.55*e[1],2.55*e[2],2.55*e[3],e[4]]}},{re:/#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})/,parse:function(e){return[parseInt(e[1],16),parseInt(e[2],16),parseInt(e[3],16)]}},{re:/#([a-f0-9])([a-f0-9])([a-f0-9])/,parse:function(e){return[parseInt(e[1]+e[1],16),parseInt(e[2]+e[2],16),parseInt(e[3]+e[3],16)]}},{re:/hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,space:"hsla",parse:function(e){return[e[1],e[2]/100,e[3]/100,e[4]]}}],l=e.Color=function(t,i,s,n){return new e.Color.fn.parse(t,i,s,n)},u={rgba:{props:{red:{idx:0,type:"byte"},green:{idx:1,type:"byte"},blue:{idx:2,type:"byte"}}},hsla:{props:{hue:{idx:0,type:"degrees"},saturation:{idx:1,type:"percent"},lightness:{idx:2,type:"percent"}}}},d={"byte":{floor:!0,max:255},percent:{max:1},degrees:{mod:360,floor:!0}},c=l.support={},p=e("<p>")[0],f=e.each;p.style.cssText="background-color:rgba(1,1,1,.5)",c.rgba=p.style.backgroundColor.indexOf("rgba")>-1,f(u,function(e,t){t.cache="_"+e,t.props.alpha={idx:3,type:"percent",def:1}}),l.fn=e.extend(l.prototype,{parse:function(n,o,r,h){if(n===t)return this._rgba=[null,null,null,null],this;(n.jquery||n.nodeType)&&(n=e(n).css(o),o=t);var d=this,c=e.type(n),p=this._rgba=[];return o!==t&&(n=[n,o,r,h],c="array"),"string"===c?this.parse(s(n)||a._default):"array"===c?(f(u.rgba.props,function(e,t){p[t.idx]=i(n[t.idx],t)}),this):"object"===c?(n instanceof l?f(u,function(e,t){n[t.cache]&&(d[t.cache]=n[t.cache].slice())}):f(u,function(t,s){var a=s.cache;f(s.props,function(e,t){if(!d[a]&&s.to){if("alpha"===e||null==n[e])return;d[a]=s.to(d._rgba)}d[a][t.idx]=i(n[e],t,!0)}),d[a]&&0>e.inArray(null,d[a].slice(0,3))&&(d[a][3]=1,s.from&&(d._rgba=s.from(d[a])))}),this):t},is:function(e){var i=l(e),s=!0,n=this;return f(u,function(e,a){var o,r=i[a.cache];return r&&(o=n[a.cache]||a.to&&a.to(n._rgba)||[],f(a.props,function(e,i){return null!=r[i.idx]?s=r[i.idx]===o[i.idx]:t})),s}),s},_space:function(){var e=[],t=this;return f(u,function(i,s){t[s.cache]&&e.push(i)}),e.pop()},transition:function(e,t){var s=l(e),n=s._space(),a=u[n],o=0===this.alpha()?l("transparent"):this,r=o[a.cache]||a.to(o._rgba),h=r.slice();return s=s[a.cache],f(a.props,function(e,n){var a=n.idx,o=r[a],l=s[a],u=d[n.type]||{};null!==l&&(null===o?h[a]=l:(u.mod&&(l-o>u.mod/2?o+=u.mod:o-l>u.mod/2&&(o-=u.mod)),h[a]=i((l-o)*t+o,n)))}),this[n](h)},blend:function(t){if(1===this._rgba[3])return this;var i=this._rgba.slice(),s=i.pop(),n=l(t)._rgba;return l(e.map(i,function(e,t){return(1-s)*n[t]+s*e}))},toRgbaString:function(){var t="rgba(",i=e.map(this._rgba,function(e,t){return null==e?t>2?1:0:e});return 1===i[3]&&(i.pop(),t="rgb("),t+i.join()+")"},toHslaString:function(){var t="hsla(",i=e.map(this.hsla(),function(e,t){return null==e&&(e=t>2?1:0),t&&3>t&&(e=Math.round(100*e)+"%"),e});return 1===i[3]&&(i.pop(),t="hsl("),t+i.join()+")"},toHexString:function(t){var i=this._rgba.slice(),s=i.pop();return t&&i.push(~~(255*s)),"#"+e.map(i,function(e){return e=(e||0).toString(16),1===e.length?"0"+e:e}).join("")},toString:function(){return 0===this._rgba[3]?"transparent":this.toRgbaString()}}),l.fn.parse.prototype=l.fn,u.hsla.to=function(e){if(null==e[0]||null==e[1]||null==e[2])return[null,null,null,e[3]];var t,i,s=e[0]/255,n=e[1]/255,a=e[2]/255,o=e[3],r=Math.max(s,n,a),h=Math.min(s,n,a),l=r-h,u=r+h,d=.5*u;return t=h===r?0:s===r?60*(n-a)/l+360:n===r?60*(a-s)/l+120:60*(s-n)/l+240,i=0===l?0:.5>=d?l/u:l/(2-u),[Math.round(t)%360,i,d,null==o?1:o]},u.hsla.from=function(e){if(null==e[0]||null==e[1]||null==e[2])return[null,null,null,e[3]];var t=e[0]/360,i=e[1],s=e[2],a=e[3],o=.5>=s?s*(1+i):s+i-s*i,r=2*s-o;return[Math.round(255*n(r,o,t+1/3)),Math.round(255*n(r,o,t)),Math.round(255*n(r,o,t-1/3)),a]},f(u,function(s,n){var a=n.props,o=n.cache,h=n.to,u=n.from;l.fn[s]=function(s){if(h&&!this[o]&&(this[o]=h(this._rgba)),s===t)return this[o].slice();var n,r=e.type(s),d="array"===r||"object"===r?s:arguments,c=this[o].slice();return f(a,function(e,t){var s=d["object"===r?e:t.idx];null==s&&(s=c[t.idx]),c[t.idx]=i(s,t)}),u?(n=l(u(c)),n[o]=c,n):l(c)},f(a,function(t,i){l.fn[t]||(l.fn[t]=function(n){var a,o=e.type(n),h="alpha"===t?this._hsla?"hsla":"rgba":s,l=this[h](),u=l[i.idx];return"undefined"===o?u:("function"===o&&(n=n.call(this,u),o=e.type(n)),null==n&&i.empty?this:("string"===o&&(a=r.exec(n),a&&(n=u+parseFloat(a[2])*("+"===a[1]?1:-1))),l[i.idx]=n,this[h](l)))})})}),l.hook=function(t){var i=t.split(" ");f(i,function(t,i){e.cssHooks[i]={set:function(t,n){var a,o,r="";if("transparent"!==n&&("string"!==e.type(n)||(a=s(n)))){if(n=l(a||n),!c.rgba&&1!==n._rgba[3]){for(o="backgroundColor"===i?t.parentNode:t;(""===r||"transparent"===r)&&o&&o.style;)try{r=e.css(o,"backgroundColor"),o=o.parentNode}catch(h){}n=n.blend(r&&"transparent"!==r?r:"_default")}n=n.toRgbaString()}try{t.style[i]=n}catch(h){}}},e.fx.step[i]=function(t){t.colorInit||(t.start=l(t.elem,i),t.end=l(t.end),t.colorInit=!0),e.cssHooks[i].set(t.elem,t.start.transition(t.end,t.pos))}})},l.hook(o),e.cssHooks.borderColor={expand:function(e){var t={};return f(["Top","Right","Bottom","Left"],function(i,s){t["border"+s+"Color"]=e}),t}},a=e.Color.names={aqua:"#00ffff",black:"#000000",blue:"#0000ff",fuchsia:"#ff00ff",gray:"#808080",green:"#008000",lime:"#00ff00",maroon:"#800000",navy:"#000080",olive:"#808000",purple:"#800080",red:"#ff0000",silver:"#c0c0c0",teal:"#008080",white:"#ffffff",yellow:"#ffff00",transparent:[null,null,null,0],_default:"#ffffff"}}(b),function(){function t(t){var i,s,n=t.ownerDocument.defaultView?t.ownerDocument.defaultView.getComputedStyle(t,null):t.currentStyle,a={};if(n&&n.length&&n[0]&&n[n[0]])for(s=n.length;s--;)i=n[s],"string"==typeof n[i]&&(a[e.camelCase(i)]=n[i]);else for(i in n)"string"==typeof n[i]&&(a[i]=n[i]);return a}function i(t,i){var s,a,o={};for(s in i)a=i[s],t[s]!==a&&(n[s]||(e.fx.step[s]||!isNaN(parseFloat(a)))&&(o[s]=a));return o}var s=["add","remove","toggle"],n={border:1,borderBottom:1,borderColor:1,borderLeft:1,borderRight:1,borderTop:1,borderWidth:1,margin:1,padding:1};e.each(["borderLeftStyle","borderRightStyle","borderBottomStyle","borderTopStyle"],function(t,i){e.fx.step[i]=function(e){("none"!==e.end&&!e.setAttr||1===e.pos&&!e.setAttr)&&(b.style(e.elem,i,e.end),e.setAttr=!0)}}),e.fn.addBack||(e.fn.addBack=function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}),e.effects.animateClass=function(n,a,o,r){var h=e.speed(a,o,r);return this.queue(function(){var a,o=e(this),r=o.attr("class")||"",l=h.children?o.find("*").addBack():o;l=l.map(function(){var i=e(this);return{el:i,start:t(this)}}),a=function(){e.each(s,function(e,t){n[t]&&o[t+"Class"](n[t])})},a(),l=l.map(function(){return this.end=t(this.el[0]),this.diff=i(this.start,this.end),this}),o.attr("class",r),l=l.map(function(){var t=this,i=e.Deferred(),s=e.extend({},h,{queue:!1,complete:function(){i.resolve(t)}});return this.el.animate(this.diff,s),i.promise()}),e.when.apply(e,l.get()).done(function(){a(),e.each(arguments,function(){var t=this.el;e.each(this.diff,function(e){t.css(e,"")})}),h.complete.call(o[0])})})},e.fn.extend({addClass:function(t){return function(i,s,n,a){return s?e.effects.animateClass.call(this,{add:i},s,n,a):t.apply(this,arguments)}}(e.fn.addClass),removeClass:function(t){return function(i,s,n,a){return arguments.length>1?e.effects.animateClass.call(this,{remove:i},s,n,a):t.apply(this,arguments)}}(e.fn.removeClass),toggleClass:function(t){return function(i,s,n,a,o){return"boolean"==typeof s||void 0===s?n?e.effects.animateClass.call(this,s?{add:i}:{remove:i},n,a,o):t.apply(this,arguments):e.effects.animateClass.call(this,{toggle:i},s,n,a)}}(e.fn.toggleClass),switchClass:function(t,i,s,n,a){return e.effects.animateClass.call(this,{add:i,remove:t},s,n,a)}})}(),function(){function t(t,i,s,n){return e.isPlainObject(t)&&(i=t,t=t.effect),t={effect:t},null==i&&(i={}),e.isFunction(i)&&(n=i,s=null,i={}),("number"==typeof i||e.fx.speeds[i])&&(n=s,s=i,i={}),e.isFunction(s)&&(n=s,s=null),i&&e.extend(t,i),s=s||i.duration,t.duration=e.fx.off?0:"number"==typeof s?s:s in e.fx.speeds?e.fx.speeds[s]:e.fx.speeds._default,t.complete=n||i.complete,t}function i(t){return!t||"number"==typeof t||e.fx.speeds[t]?!0:"string"!=typeof t||e.effects.effect[t]?e.isFunction(t)?!0:"object"!=typeof t||t.effect?!1:!0:!0}e.extend(e.effects,{version:"1.11.4",save:function(e,t){for(var i=0;t.length>i;i++)null!==t[i]&&e.data(y+t[i],e[0].style[t[i]])},restore:function(e,t){var i,s;for(s=0;t.length>s;s++)null!==t[s]&&(i=e.data(y+t[s]),void 0===i&&(i=""),e.css(t[s],i))},setMode:function(e,t){return"toggle"===t&&(t=e.is(":hidden")?"show":"hide"),t},getBaseline:function(e,t){var i,s;switch(e[0]){case"top":i=0;break;case"middle":i=.5;break;case"bottom":i=1;break;default:i=e[0]/t.height}switch(e[1]){case"left":s=0;break;case"center":s=.5;break;case"right":s=1;break;default:s=e[1]/t.width}return{x:s,y:i}},createWrapper:function(t){if(t.parent().is(".ui-effects-wrapper"))return t.parent();var i={width:t.outerWidth(!0),height:t.outerHeight(!0),"float":t.css("float")},s=e("<div></div>").addClass("ui-effects-wrapper").css({fontSize:"100%",background:"transparent",border:"none",margin:0,padding:0}),n={width:t.width(),height:t.height()},a=document.activeElement;try{a.id}catch(o){a=document.body}return t.wrap(s),(t[0]===a||e.contains(t[0],a))&&e(a).focus(),s=t.parent(),"static"===t.css("position")?(s.css({position:"relative"}),t.css({position:"relative"})):(e.extend(i,{position:t.css("position"),zIndex:t.css("z-index")}),e.each(["top","left","bottom","right"],function(e,s){i[s]=t.css(s),isNaN(parseInt(i[s],10))&&(i[s]="auto")}),t.css({position:"relative",top:0,left:0,right:"auto",bottom:"auto"})),t.css(n),s.css(i).show()},removeWrapper:function(t){var i=document.activeElement;
return t.parent().is(".ui-effects-wrapper")&&(t.parent().replaceWith(t),(t[0]===i||e.contains(t[0],i))&&e(i).focus()),t},setTransition:function(t,i,s,n){return n=n||{},e.each(i,function(e,i){var a=t.cssUnit(i);a[0]>0&&(n[i]=a[0]*s+a[1])}),n}}),e.fn.extend({effect:function(){function i(t){function i(){e.isFunction(a)&&a.call(n[0]),e.isFunction(t)&&t()}var n=e(this),a=s.complete,r=s.mode;(n.is(":hidden")?"hide"===r:"show"===r)?(n[r](),i()):o.call(n[0],s,i)}var s=t.apply(this,arguments),n=s.mode,a=s.queue,o=e.effects.effect[s.effect];return e.fx.off||!o?n?this[n](s.duration,s.complete):this.each(function(){s.complete&&s.complete.call(this)}):a===!1?this.each(i):this.queue(a||"fx",i)},show:function(e){return function(s){if(i(s))return e.apply(this,arguments);var n=t.apply(this,arguments);return n.mode="show",this.effect.call(this,n)}}(e.fn.show),hide:function(e){return function(s){if(i(s))return e.apply(this,arguments);var n=t.apply(this,arguments);return n.mode="hide",this.effect.call(this,n)}}(e.fn.hide),toggle:function(e){return function(s){if(i(s)||"boolean"==typeof s)return e.apply(this,arguments);var n=t.apply(this,arguments);return n.mode="toggle",this.effect.call(this,n)}}(e.fn.toggle),cssUnit:function(t){var i=this.css(t),s=[];return e.each(["em","px","%","pt"],function(e,t){i.indexOf(t)>0&&(s=[parseFloat(i),t])}),s}})}(),function(){var t={};e.each(["Quad","Cubic","Quart","Quint","Expo"],function(e,i){t[i]=function(t){return Math.pow(t,e+2)}}),e.extend(t,{Sine:function(e){return 1-Math.cos(e*Math.PI/2)},Circ:function(e){return 1-Math.sqrt(1-e*e)},Elastic:function(e){return 0===e||1===e?e:-Math.pow(2,8*(e-1))*Math.sin((80*(e-1)-7.5)*Math.PI/15)},Back:function(e){return e*e*(3*e-2)},Bounce:function(e){for(var t,i=4;((t=Math.pow(2,--i))-1)/11>e;);return 1/Math.pow(4,3-i)-7.5625*Math.pow((3*t-2)/22-e,2)}}),e.each(t,function(t,i){e.easing["easeIn"+t]=i,e.easing["easeOut"+t]=function(e){return 1-i(1-e)},e.easing["easeInOut"+t]=function(e){return.5>e?i(2*e)/2:1-i(-2*e+2)/2}})}(),e.effects,e.effects.effect.blind=function(t,i){var s,n,a,o=e(this),r=/up|down|vertical/,h=/up|left|vertical|horizontal/,l=["position","top","bottom","left","right","height","width"],u=e.effects.setMode(o,t.mode||"hide"),d=t.direction||"up",c=r.test(d),p=c?"height":"width",f=c?"top":"left",m=h.test(d),g={},v="show"===u;o.parent().is(".ui-effects-wrapper")?e.effects.save(o.parent(),l):e.effects.save(o,l),o.show(),s=e.effects.createWrapper(o).css({overflow:"hidden"}),n=s[p](),a=parseFloat(s.css(f))||0,g[p]=v?n:0,m||(o.css(c?"bottom":"right",0).css(c?"top":"left","auto").css({position:"absolute"}),g[f]=v?a:n+a),v&&(s.css(p,0),m||s.css(f,a+n)),s.animate(g,{duration:t.duration,easing:t.easing,queue:!1,complete:function(){"hide"===u&&o.hide(),e.effects.restore(o,l),e.effects.removeWrapper(o),i()}})},e.effects.effect.bounce=function(t,i){var s,n,a,o=e(this),r=["position","top","bottom","left","right","height","width"],h=e.effects.setMode(o,t.mode||"effect"),l="hide"===h,u="show"===h,d=t.direction||"up",c=t.distance,p=t.times||5,f=2*p+(u||l?1:0),m=t.duration/f,g=t.easing,v="up"===d||"down"===d?"top":"left",y="up"===d||"left"===d,b=o.queue(),_=b.length;for((u||l)&&r.push("opacity"),e.effects.save(o,r),o.show(),e.effects.createWrapper(o),c||(c=o["top"===v?"outerHeight":"outerWidth"]()/3),u&&(a={opacity:1},a[v]=0,o.css("opacity",0).css(v,y?2*-c:2*c).animate(a,m,g)),l&&(c/=Math.pow(2,p-1)),a={},a[v]=0,s=0;p>s;s++)n={},n[v]=(y?"-=":"+=")+c,o.animate(n,m,g).animate(a,m,g),c=l?2*c:c/2;l&&(n={opacity:0},n[v]=(y?"-=":"+=")+c,o.animate(n,m,g)),o.queue(function(){l&&o.hide(),e.effects.restore(o,r),e.effects.removeWrapper(o),i()}),_>1&&b.splice.apply(b,[1,0].concat(b.splice(_,f+1))),o.dequeue()},e.effects.effect.clip=function(t,i){var s,n,a,o=e(this),r=["position","top","bottom","left","right","height","width"],h=e.effects.setMode(o,t.mode||"hide"),l="show"===h,u=t.direction||"vertical",d="vertical"===u,c=d?"height":"width",p=d?"top":"left",f={};e.effects.save(o,r),o.show(),s=e.effects.createWrapper(o).css({overflow:"hidden"}),n="IMG"===o[0].tagName?s:o,a=n[c](),l&&(n.css(c,0),n.css(p,a/2)),f[c]=l?a:0,f[p]=l?0:a/2,n.animate(f,{queue:!1,duration:t.duration,easing:t.easing,complete:function(){l||o.hide(),e.effects.restore(o,r),e.effects.removeWrapper(o),i()}})},e.effects.effect.drop=function(t,i){var s,n=e(this),a=["position","top","bottom","left","right","opacity","height","width"],o=e.effects.setMode(n,t.mode||"hide"),r="show"===o,h=t.direction||"left",l="up"===h||"down"===h?"top":"left",u="up"===h||"left"===h?"pos":"neg",d={opacity:r?1:0};e.effects.save(n,a),n.show(),e.effects.createWrapper(n),s=t.distance||n["top"===l?"outerHeight":"outerWidth"](!0)/2,r&&n.css("opacity",0).css(l,"pos"===u?-s:s),d[l]=(r?"pos"===u?"+=":"-=":"pos"===u?"-=":"+=")+s,n.animate(d,{queue:!1,duration:t.duration,easing:t.easing,complete:function(){"hide"===o&&n.hide(),e.effects.restore(n,a),e.effects.removeWrapper(n),i()}})},e.effects.effect.explode=function(t,i){function s(){b.push(this),b.length===d*c&&n()}function n(){p.css({visibility:"visible"}),e(b).remove(),m||p.hide(),i()}var a,o,r,h,l,u,d=t.pieces?Math.round(Math.sqrt(t.pieces)):3,c=d,p=e(this),f=e.effects.setMode(p,t.mode||"hide"),m="show"===f,g=p.show().css("visibility","hidden").offset(),v=Math.ceil(p.outerWidth()/c),y=Math.ceil(p.outerHeight()/d),b=[];for(a=0;d>a;a++)for(h=g.top+a*y,u=a-(d-1)/2,o=0;c>o;o++)r=g.left+o*v,l=o-(c-1)/2,p.clone().appendTo("body").wrap("<div></div>").css({position:"absolute",visibility:"visible",left:-o*v,top:-a*y}).parent().addClass("ui-effects-explode").css({position:"absolute",overflow:"hidden",width:v,height:y,left:r+(m?l*v:0),top:h+(m?u*y:0),opacity:m?0:1}).animate({left:r+(m?0:l*v),top:h+(m?0:u*y),opacity:m?1:0},t.duration||500,t.easing,s)},e.effects.effect.fade=function(t,i){var s=e(this),n=e.effects.setMode(s,t.mode||"toggle");s.animate({opacity:n},{queue:!1,duration:t.duration,easing:t.easing,complete:i})},e.effects.effect.fold=function(t,i){var s,n,a=e(this),o=["position","top","bottom","left","right","height","width"],r=e.effects.setMode(a,t.mode||"hide"),h="show"===r,l="hide"===r,u=t.size||15,d=/([0-9]+)%/.exec(u),c=!!t.horizFirst,p=h!==c,f=p?["width","height"]:["height","width"],m=t.duration/2,g={},v={};e.effects.save(a,o),a.show(),s=e.effects.createWrapper(a).css({overflow:"hidden"}),n=p?[s.width(),s.height()]:[s.height(),s.width()],d&&(u=parseInt(d[1],10)/100*n[l?0:1]),h&&s.css(c?{height:0,width:u}:{height:u,width:0}),g[f[0]]=h?n[0]:u,v[f[1]]=h?n[1]:0,s.animate(g,m,t.easing).animate(v,m,t.easing,function(){l&&a.hide(),e.effects.restore(a,o),e.effects.removeWrapper(a),i()})},e.effects.effect.highlight=function(t,i){var s=e(this),n=["backgroundImage","backgroundColor","opacity"],a=e.effects.setMode(s,t.mode||"show"),o={backgroundColor:s.css("backgroundColor")};"hide"===a&&(o.opacity=0),e.effects.save(s,n),s.show().css({backgroundImage:"none",backgroundColor:t.color||"#ffff99"}).animate(o,{queue:!1,duration:t.duration,easing:t.easing,complete:function(){"hide"===a&&s.hide(),e.effects.restore(s,n),i()}})},e.effects.effect.size=function(t,i){var s,n,a,o=e(this),r=["position","top","bottom","left","right","width","height","overflow","opacity"],h=["position","top","bottom","left","right","overflow","opacity"],l=["width","height","overflow"],u=["fontSize"],d=["borderTopWidth","borderBottomWidth","paddingTop","paddingBottom"],c=["borderLeftWidth","borderRightWidth","paddingLeft","paddingRight"],p=e.effects.setMode(o,t.mode||"effect"),f=t.restore||"effect"!==p,m=t.scale||"both",g=t.origin||["middle","center"],v=o.css("position"),y=f?r:h,b={height:0,width:0,outerHeight:0,outerWidth:0};"show"===p&&o.show(),s={height:o.height(),width:o.width(),outerHeight:o.outerHeight(),outerWidth:o.outerWidth()},"toggle"===t.mode&&"show"===p?(o.from=t.to||b,o.to=t.from||s):(o.from=t.from||("show"===p?b:s),o.to=t.to||("hide"===p?b:s)),a={from:{y:o.from.height/s.height,x:o.from.width/s.width},to:{y:o.to.height/s.height,x:o.to.width/s.width}},("box"===m||"both"===m)&&(a.from.y!==a.to.y&&(y=y.concat(d),o.from=e.effects.setTransition(o,d,a.from.y,o.from),o.to=e.effects.setTransition(o,d,a.to.y,o.to)),a.from.x!==a.to.x&&(y=y.concat(c),o.from=e.effects.setTransition(o,c,a.from.x,o.from),o.to=e.effects.setTransition(o,c,a.to.x,o.to))),("content"===m||"both"===m)&&a.from.y!==a.to.y&&(y=y.concat(u).concat(l),o.from=e.effects.setTransition(o,u,a.from.y,o.from),o.to=e.effects.setTransition(o,u,a.to.y,o.to)),e.effects.save(o,y),o.show(),e.effects.createWrapper(o),o.css("overflow","hidden").css(o.from),g&&(n=e.effects.getBaseline(g,s),o.from.top=(s.outerHeight-o.outerHeight())*n.y,o.from.left=(s.outerWidth-o.outerWidth())*n.x,o.to.top=(s.outerHeight-o.to.outerHeight)*n.y,o.to.left=(s.outerWidth-o.to.outerWidth)*n.x),o.css(o.from),("content"===m||"both"===m)&&(d=d.concat(["marginTop","marginBottom"]).concat(u),c=c.concat(["marginLeft","marginRight"]),l=r.concat(d).concat(c),o.find("*[width]").each(function(){var i=e(this),s={height:i.height(),width:i.width(),outerHeight:i.outerHeight(),outerWidth:i.outerWidth()};f&&e.effects.save(i,l),i.from={height:s.height*a.from.y,width:s.width*a.from.x,outerHeight:s.outerHeight*a.from.y,outerWidth:s.outerWidth*a.from.x},i.to={height:s.height*a.to.y,width:s.width*a.to.x,outerHeight:s.height*a.to.y,outerWidth:s.width*a.to.x},a.from.y!==a.to.y&&(i.from=e.effects.setTransition(i,d,a.from.y,i.from),i.to=e.effects.setTransition(i,d,a.to.y,i.to)),a.from.x!==a.to.x&&(i.from=e.effects.setTransition(i,c,a.from.x,i.from),i.to=e.effects.setTransition(i,c,a.to.x,i.to)),i.css(i.from),i.animate(i.to,t.duration,t.easing,function(){f&&e.effects.restore(i,l)})})),o.animate(o.to,{queue:!1,duration:t.duration,easing:t.easing,complete:function(){0===o.to.opacity&&o.css("opacity",o.from.opacity),"hide"===p&&o.hide(),e.effects.restore(o,y),f||("static"===v?o.css({position:"relative",top:o.to.top,left:o.to.left}):e.each(["top","left"],function(e,t){o.css(t,function(t,i){var s=parseInt(i,10),n=e?o.to.left:o.to.top;return"auto"===i?n+"px":s+n+"px"})})),e.effects.removeWrapper(o),i()}})},e.effects.effect.scale=function(t,i){var s=e(this),n=e.extend(!0,{},t),a=e.effects.setMode(s,t.mode||"effect"),o=parseInt(t.percent,10)||(0===parseInt(t.percent,10)?0:"hide"===a?0:100),r=t.direction||"both",h=t.origin,l={height:s.height(),width:s.width(),outerHeight:s.outerHeight(),outerWidth:s.outerWidth()},u={y:"horizontal"!==r?o/100:1,x:"vertical"!==r?o/100:1};n.effect="size",n.queue=!1,n.complete=i,"effect"!==a&&(n.origin=h||["middle","center"],n.restore=!0),n.from=t.from||("show"===a?{height:0,width:0,outerHeight:0,outerWidth:0}:l),n.to={height:l.height*u.y,width:l.width*u.x,outerHeight:l.outerHeight*u.y,outerWidth:l.outerWidth*u.x},n.fade&&("show"===a&&(n.from.opacity=0,n.to.opacity=1),"hide"===a&&(n.from.opacity=1,n.to.opacity=0)),s.effect(n)},e.effects.effect.puff=function(t,i){var s=e(this),n=e.effects.setMode(s,t.mode||"hide"),a="hide"===n,o=parseInt(t.percent,10)||150,r=o/100,h={height:s.height(),width:s.width(),outerHeight:s.outerHeight(),outerWidth:s.outerWidth()};e.extend(t,{effect:"scale",queue:!1,fade:!0,mode:n,complete:i,percent:a?o:100,from:a?h:{height:h.height*r,width:h.width*r,outerHeight:h.outerHeight*r,outerWidth:h.outerWidth*r}}),s.effect(t)},e.effects.effect.pulsate=function(t,i){var s,n=e(this),a=e.effects.setMode(n,t.mode||"show"),o="show"===a,r="hide"===a,h=o||"hide"===a,l=2*(t.times||5)+(h?1:0),u=t.duration/l,d=0,c=n.queue(),p=c.length;for((o||!n.is(":visible"))&&(n.css("opacity",0).show(),d=1),s=1;l>s;s++)n.animate({opacity:d},u,t.easing),d=1-d;n.animate({opacity:d},u,t.easing),n.queue(function(){r&&n.hide(),i()}),p>1&&c.splice.apply(c,[1,0].concat(c.splice(p,l+1))),n.dequeue()},e.effects.effect.shake=function(t,i){var s,n=e(this),a=["position","top","bottom","left","right","height","width"],o=e.effects.setMode(n,t.mode||"effect"),r=t.direction||"left",h=t.distance||20,l=t.times||3,u=2*l+1,d=Math.round(t.duration/u),c="up"===r||"down"===r?"top":"left",p="up"===r||"left"===r,f={},m={},g={},v=n.queue(),y=v.length;for(e.effects.save(n,a),n.show(),e.effects.createWrapper(n),f[c]=(p?"-=":"+=")+h,m[c]=(p?"+=":"-=")+2*h,g[c]=(p?"-=":"+=")+2*h,n.animate(f,d,t.easing),s=1;l>s;s++)n.animate(m,d,t.easing).animate(g,d,t.easing);n.animate(m,d,t.easing).animate(f,d/2,t.easing).queue(function(){"hide"===o&&n.hide(),e.effects.restore(n,a),e.effects.removeWrapper(n),i()}),y>1&&v.splice.apply(v,[1,0].concat(v.splice(y,u+1))),n.dequeue()},e.effects.effect.slide=function(t,i){var s,n=e(this),a=["position","top","bottom","left","right","width","height"],o=e.effects.setMode(n,t.mode||"show"),r="show"===o,h=t.direction||"left",l="up"===h||"down"===h?"top":"left",u="up"===h||"left"===h,d={};e.effects.save(n,a),n.show(),s=t.distance||n["top"===l?"outerHeight":"outerWidth"](!0),e.effects.createWrapper(n).css({overflow:"hidden"}),r&&n.css(l,u?isNaN(s)?"-"+s:-s:s),d[l]=(r?u?"+=":"-=":u?"-=":"+=")+s,n.animate(d,{queue:!1,duration:t.duration,easing:t.easing,complete:function(){"hide"===o&&n.hide(),e.effects.restore(n,a),e.effects.removeWrapper(n),i()}})},e.effects.effect.transfer=function(t,i){var s=e(this),n=e(t.to),a="fixed"===n.css("position"),o=e("body"),r=a?o.scrollTop():0,h=a?o.scrollLeft():0,l=n.offset(),u={top:l.top-r,left:l.left-h,height:n.innerHeight(),width:n.innerWidth()},d=s.offset(),c=e("<div class='ui-effects-transfer'></div>").appendTo(document.body).addClass(t.className).css({top:d.top-r,left:d.left-h,height:s.innerHeight(),width:s.innerWidth(),position:a?"fixed":"absolute"}).animate(u,t.duration,t.easing,function(){c.remove(),i()})}});
/* ..\..\desktop.blocks\jquery\jquery.datepicker.min.js end */

						input.datepicker({dateFormat: 'd M yy', defaultDay: null});
					}
				}
			}
		}));
	}
);
/* end: ../../desktop.blocks/datepicker/datepicker.js */
/* begin: ../../desktop.blocks/ad-place-variable/ad-place-variable.js */
modules.define(
    'ad-place-variable',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {
    	var blocks = $('.ad-place-variable__tr');
    	var radio_normal = $('.ad-place-variable__radio_type_normal');
    	var radio_colored = $('.ad-place-variable__radio_type_colored');
    	var checkbox_vip = $('.ad-place-variable__checkbox_type_vip');

		provide(BEMDOM.decl(this.name, {
		    onSetMod: {
		        'js' : {
		            'inited' : function() {
		            	blocks.on('click', this._change);
		            }
		        }
		    },

		    _change: function()
		    {
		    	if($(this).hasClass('normal')){
		    		radio_normal.prop('checked', true);;
		    	} else if($(this).hasClass('colored')){
					radio_colored.prop('checked', true);
		    	} else if($(this).hasClass('vip')){
					checkbox_vip.prop('checked', !checkbox_vip.prop('checked'));
		    	}
		    }
		}));

	}
);
/* end: ../../desktop.blocks/ad-place-variable/ad-place-variable.js */
/* begin: ../../desktop.blocks/payment-method/payment-method.js */
modules.define(
    'payment-method',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {
		provide(BEMDOM.decl(this.name, {
		    onSetMod: {
		        js: {
		            inited: function()
		            {
		            	var checkbox = this.findBlockOutside('feed-ad').findBlockInside('checkbox').findElem('checkbox__control');

		            	checkbox.on('change', this._blockMethods);
		            }
		        }
		    },

		    _blockMethods: function()
		    {
		    	console.log(111);
		    }
		}));

	}
);
/* end: ../../desktop.blocks/payment-method/payment-method.js */
/* begin: ../../desktop.blocks/search_filter/search_filter.js */
modules.define(
    'search_filter',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				// основные контролы
				this._action = $('#search_filter_action').bem('radio-group');
				this._target = $('#search_filter_target').bem('radio-group');


				// блоки формы кторые будут скрываться и показываться

				// количество комнат массив flatTypes
				this._search_filter_flat_types = $('#search_filter_flat_types');

				// свободная планировка
				this._search_filter_flat_types_free_plan = $('#search_filter_flat_types_free_plan');

				// посуточно или длительный срок
				this._search_filter_rent_type = $('#search_filter_rent_type');

				// количество комнат
				this._search_filter_room_count = $('#search_filter_room_count');

				// вторичка.новостройка
				this._search_filter_resale_new 		= $('#search_filter_resale_new');
				// this._search_filter_resale_new_bem  = $(this._search_filter_resale_new).find('.checkbox-group').bem('checkbox-group');
				this._search_filter_is_new_checkbox  = $('#search_filter_is_new_checkbox').bem('checkbox');


				// сдан.строится
				this._search_filter_built_build = $('#search_filter_built_build');

				// количество комнат от до
				this._search_filter_room_count_label   = $('#search_filter_room_count_label');
				this._search_filter_room_count_from_to = $('#search_filter_room_count_from_to');

				// полный поиск
				this._search_full = this.findBlockInside('search_full');
				

				this._modal_switcher = $('#region_popup_switcher').bem('button');
				this._modal          = $('#search_full_modal').bem('modal');
			
				this._search_filter_submit_button   = $('#search_filter_submit_button').bem('button');



				this._data = {};
				this._server_params = [];
				this._spin = this.findBlockInside('spin');


				this._page = 1;
				this._sort = '';



				// Обработка событий
				var that = this;

				// переключение между полным и кратким поиском
				this.bindToDomElem($('#toggle_full_search_link'), 'click', this._toggleFullSearch);

				// обработка собития отправки формы
				this.bindTo('submit', this._onSubmitSearchForm);

				// переключение кнопок Купить/Снять
				this._action.on('change', this._onActionChange, this);

				// переключение кнопок Квартиру/Комнату/Дом. участок/Коммерческую недвижимость
				this._target.on('change', this._onTargetChange, this);

				// чек или не чек чекбокса Новостройка
				// this._search_filter_resale_new_bem.on('change', this._onIsNewChange, this);
				this._search_filter_is_new_checkbox.on('change', this._onIsNewChange, this);
				

				this._modal_switcher.on('click', function(){
					that._modal.setMod('visible');
				});


				this.on('ajax_start', function(){
					that._search_filter_submit_button.setMod('disabled');
					that._spin.setMod('visible');
				});

				this.on('ajax_end', function(){
					that._search_filter_submit_button.delMod('disabled');
					that._spin.delMod('visible');
				});

				this._changeFilters();

				// отправка формы сразу при загрузке страницы
				this.loadData(true);

			}
		}
	},


	getData: function(){
		return this._data;
	},




	loadData: function(is_first){
		is_first = is_first || false;

		var that = this;

		this._setParamsForServer();
		this._setUrlQueryString();

		this.emit('ajax_start');

		var url = this.params.url + '?' + $.param(this._server_params);

		$.ajax({
		  method: "GET",
		  url: url,
		  cache: false,
		})
		.done(function(data) {
	    	that._data = data;

	    	if(is_first){
	    		that.emit('data_loaded_first');
	    	} else {
	    		that.emit('data_loaded');
	    	}
			
			that.emit('ajax_end');
	  	})
	  	.fail(function(error) {
	    	console.log(error);
	    	that.emit('ajax_end');
	  	});

	},




	_onSubmitSearchForm: function(e){
		e.preventDefault(); 

		this.loadData(true);
	},



	_getFormData : function(){
		return $(this.domElem).serializeArray();
	},


	_onActionChange: function(e){
		this._changeFilters();
	},


	_onTargetChange: function(e){
		this._changeFilters();
	},


	_changeFilters: function(){
		var action = this._action.getVal();
		var target = this._target.getVal();
		

		// Купить
		if(action == 'buy'){

			// Квартиру
			if(target == 'flat'){
				
				// включаем то что надо 
				this._enableFlatTypes();
				this._enableFreePlan();
				this._enableResaleNew();
				// включать выключать .. дом сдан.не сдан
				this._onIsNewChange();

				// выключаем то что не надо
				this._disableRentType();
				this._disableRoomCount();
				this._disableRoomCountFromTo();

				// полный поиск
				this._search_full.enablePloschad();
				this._search_full.enableDopSmall();
				this._search_full.enableUslovia();

				this._search_full.disableKommissia();
				this._search_full.disableDopBig();
				
			}

			// Комнату
			if(target == 'room'){
				// вкл то что надо
				this._enableRoomCount();
				this._enableRoomCountFromTo();

				// выкл то что не надо
				this._disableRentType();
				this._disableResaleNew();
				this._disableBuiltBuild();
				this._disableFlatTypes();		


				// полный поиск
				this._search_full.enablePloschad();
				this._search_full.enableDopSmall();
				this._search_full.enableUslovia();

				this._search_full.disableKommissia();
				this._search_full.disableDopBig();
				this._search_full.disableDeadline();

			} 

			// Дом участок
			if(target == 'village'){
				
				
			} 

			// Коммерческая недвижимость
			if(target == 'business'){
				
				
			} 

		} 


		// Снять
		if(action == 'rent'){


			// Квартиру
			if(target == 'flat'){
				// вкл то что надо
				this._enableFlatTypes();
				this._enableRentType();

				// включать выключать .. дом сдан.не сдан
				this._onIsNewChange();


				// выкл то что не надо
				this._disableFreePlan();
				this._disableRoomCount();
				this._disableRoomCountFromTo();
				this._disableResaleNew();
				this._disableBuiltBuild();


				// полный поиск
				this._search_full.enableKommissia();
				this._search_full.enableDopBig();

				this._search_full.disablePloschad();
				this._search_full.disableDopSmall();
				this._search_full.disableUslovia();
				this._search_full.disableDeadline();
			}

			// Комнату
			if(target == 'room'){
				// вкл то что надо
				this._enableRoomCount();
				this._enableRoomCountFromTo();
				this._enableRentType();


				// выкл то что не надо
				this._disableFlatTypes();
				this._disableFreePlan();
				this._disableResaleNew();
				this._disableBuiltBuild();

				// полный поиск
				this._search_full.enableKommissia();
				this._search_full.enableDopBig();

				this._search_full.disablePloschad();
				this._search_full.disableDopSmall();
				this._search_full.disableUslovia();
				this._search_full.disableDeadline();
			}
				

			// Дом участок
			if(target == 'village'){
				
				
			} 

			// Коммерческая недвижимость
			if(target == 'business'){
				
				
			} 

		}




	},



	_disableFlatTypes: function(){
		$(this._search_filter_flat_types).hide().find('.checkbox').each(function(){
			$(this).hide().bem('checkbox').setMod('disabled');
		});
	},

	_enableFlatTypes: function(){
		$(this._search_filter_flat_types).show().find('.checkbox').each(function(){
			$(this).show().bem('checkbox').delMod('disabled');
		});
	},


	_disableRentType: function(){
		$(this._search_filter_rent_type).hide().find('.radio-group').bem('radio-group').setMod('disabled');
	},

	_enableRentType: function(){
		$(this._search_filter_rent_type).show().find('.radio-group').bem('radio-group').delMod('disabled');
	},


	_disableRoomCount: function(){
		$(this._search_filter_room_count).hide().find('.checkbox-group').bem('checkbox-group').setMod('disabled');
	},

	_enableRoomCount: function(){
		$(this._search_filter_room_count).show().find('.checkbox-group').bem('checkbox-group').delMod('disabled');
	},


	_disableFreePlan: function(){
		$(this._search_filter_flat_types_free_plan).hide().bem('checkbox').setMod('disabled');
		$(this._search_filter_flat_types).find('.checkbox:visible:last').addClass('last-visible');
	},

	_enableFreePlan: function(){
		$(this._search_filter_flat_types).find('.checkbox').removeClass('last-visible');
		$(this._search_filter_flat_types_free_plan).show().bem('checkbox').delMod('disabled');
	},



	_disableResaleNew: function(){
		$(this._search_filter_resale_new).hide().find('.checkbox').each(function(){
			$(this).bem('checkbox').setMod('disabled');
		});
	},

	_enableResaleNew: function(){
		$(this._search_filter_resale_new).show().find('.checkbox').each(function(){
			$(this).bem('checkbox').delMod('disabled');
		});
	},

	_disableBuiltBuild: function(){
		$(this._search_filter_built_build).hide().find('.checkbox').each(function(){
			$(this).bem('checkbox').setMod('disabled');
		});
	},

	_enableBuiltBuild: function(){
		$(this._search_filter_built_build).show().find('.checkbox').each(function(){
			$(this).bem('checkbox').delMod('disabled');
		});
	},

	_disableRoomCountFromTo: function(){
		$(this._search_filter_room_count_label).hide();

		$(this._search_filter_room_count_from_to).hide().find('.input').each(function(){
			$(this).bem('input').setMod('disabled');
		});
	},

	_enableRoomCountFromTo: function(){
		$(this._search_filter_room_count_label).show();
		
		$(this._search_filter_room_count_from_to).show().find('.input').each(function(){
			$(this).bem('input').delMod('disabled');
		});
	},



	_setParamsForServer: function(){
		var action = this._action.getVal();
		var target = this._target.getVal();

		var fields = [
			'action', 
			'target', 
			'priceFrom', 
			'priceTo', 
			'currency', 
			'district[]', 
			'locality[]', 
			'streetBuilding[]',
			'metro[]', 
			'metroDistance', 
			'metroDistanceOnFoot', 
			'priceMode',
			'typeBuilding[]',
			'location'
		];

		// Купить
		if(action == 'buy'){
			// Квартиру
			if(target == 'flat'){
				fields = fields.concat([
					'flatTypes[]', 
					'isNew', 
					'isResale', 
					'isBuild', 
					'isBuilt', 
					'areaTo', 
					'areaFrom', 
					'livingAreaFrom', 
					'livingAreaTo', 
					'kitchenAreaFrom', 
					'kitchenAreaTo', 
					'floorFrom', 
					'floorTo', 
					'floorCountFrom', 
					'floorCountTo', 
					'notLastFloor', 
					'notFirstFloor', 
					'lastFloor', 
					'isLift', 
					'canBeSettledAtOnce', 
					'finishing', 
					'balcony', 
					'bathroom', 
					'coveredParking', 
					'coveredSpace', 
					'typeBuilding', 
					'conditionTrade', 
					'isMortgage', 
					'author', 
					'isPrivate', 
					'publishDate', 
					'hasPhoto', 
					'readyQuarter', 
					'readyYear'
				]);

				if(!this._hasIsNew()){
					fields.splice(fields.indexOf('isBuilt'), 1);
					fields.splice(fields.indexOf('isBuild'), 1);
				}

			}

			// Комнату
			if(target == 'room'){
				fields = fields.concat([
					'roomOfferedCount[]', 
					'roomCountFrom', 
					'roomCountTo', 
					'areaTo', 
					'areaFrom', 
					'livingAreaFrom', 
					'livingAreaTo', 
					'kitchenAreaFrom', 
					'kitchenAreaTo', 
					'floorFrom', 
					'floorTo', 
					'floorCountFrom', 
					'floorCountTo', 
					'notLastFloor', 
					'notFirstFloor', 
					'lastFloor', 
					'isLift', 
					'canBeSettledAtOnce', 
					'finishing', 
					'balcony', 
					'bathroom', 
					'typeBuilding', 
					'conditionTrade', 
					'isMortgage', 
					'author', 
					'isPrivate', 
					'publishDate', 
					'hasPhoto'
				]);
			}
		}

		// Снять
		if(action == 'rent'){
			// Квартиру
			if(target == 'flat'){
				fields = fields.concat([
					'flatTypes[]', 
					'isDailyRent', 
					'isLongRent', 
					'areaTo', 
					'areaFrom', 
					'livingAreaFrom', 
					'livingAreaTo', 
					'kitchenAreaFrom', 
					'kitchenAreaTo', 
					'floorFrom', 
					'floorTo', 
					'floorCountFrom', 
					'floorCountTo', 
					'notLastFloor', 
					'notFirstFloor', 
					'lastFloor', 
					'isLift', 
					'canBeSettledAtOnce', 
					'finishing', 
					'balcony', 
					'bathroom', 
					'coveredParking', 
					'coveredSpace', 
					'typeBuilding', 
					'conditionTrade', 
					'isMortgage', 
					'author', 
					'isPrivate', 
					'publishDate', 
					'hasPhoto', 
					'readyYear', 
					'withChildren', 
					'withPets', 
					'isPhone', 
					'isFridge', 
					'isWasher', 
					'isStove', 
					'isKitchenFurniture', 
					'isFurniture',
					'rentType'
				]);
			}

			// Комнату
			if(target == 'room'){
				fields = fields.concat([
					'roomOfferedCount[]', 
					'isDailyRent', 
					'isLongRent', 
					'roomCountFrom', 
					'roomCountTo', 
					'floorFrom', 
					'floorTo', 
					'floorCountFrom', 
					'floorCountTo', 
					'notLastFloor', 
					'notFirstFloor', 
					'lastFloor', 
					'isLift', 
					'typeBuilding', 
					'conditionTrade', 
					'hasRentPledge', 
					'author', 
					'isPrivate', 
					'publishDate', 
					'hasPhoto', 
					'withChildren', 
					'withPets', 
					'isPhone', 
					'isFridge', 
					'isWasher', 
					'isStove', 
					'isKitchenFurniture', 
					'isFurniture', 
					'coveredParking', 
					'coveredSpace', 
					'bathroom',
					'rentType'
				]);
			}
		}


		this._server_params = [];

		var that = this;

		this._getFormData().map(function(item){
			if($.inArray(item.name, fields) > -1 && item.value !== ''){
				that._server_params.push({
					name: item.name,
					value: item.value
				});
			}
		});


		if(this._page > 1){
			this._server_params.push({
				name: 'page',
				value: this._page
			});
		}



		if(this._sort.length){
			this._server_params.push({
				name: 'sortBy',
				value: this._sort
			});
		}

		// console.clear();
		// console.table(this._server_params);
	},




	setPage: function(page){
		this._page = page;
	},


	setSort: function(sort){
		this.setPage(1);
		this._sort = sort;
	},





	_setUrlQueryString: function(){
		window.history.pushState(null, null, window.location.pathname + '?' + $.param(this._server_params));
	},



	_hasIsNew: function(){
		return this._search_filter_is_new_checkbox.hasMod('checked');
		// return $.inArray('isNew', this._search_filter_resale_new_bem.getVal()) > -1;
	},



	_onIsNewChange: function(){

		if(this._hasIsNew()){
			this._search_full.enableDeadline();
			this._enableBuiltBuild();
		} else {
			this._search_full.disableDeadline();
			this._disableBuiltBuild();
		}

	},




	_toggleFullSearch: function(e){
		e.preventDefault();

		this._search_full.toggleMod('show', true);

		var text  = $('#toggle_full_search_link').text();
		var togg1 = $('#toggle_full_search_link').data('text');
		var togg2 = $('#toggle_full_search_link').data('toggle-text');

		$('#toggle_full_search_link').text(text == togg1 ? togg2 : togg1);
	}

}



));





});
/* end: ../../desktop.blocks/search_filter/search_filter.js */
/* begin: ../../desktop.blocks/search_full/search_full.js */
modules.define(
    'search_full',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){


				this._search_full_ploschad   = $('#search_full_ploschad');
				this._search_full_etaji      = $('#search_full_etaji');
				this._search_full_dop_big    = $('#search_full_dop_big');
				this._search_full_dop_small  = $('#search_full_dop_small');
				this._search_full_deadline   = $('#search_full_deadline');
				this._search_full_etaji      = $('#search_full_etaji');
				this._search_full_uslovia_sdelki   = $('#search_full_uslovia_sdelki');
				this._search_full_kommissia_zalog  = $('#search_full_kommissia_zalog');
				

			} 
		}
	},



	disableKommissia: function(){
		$(this._search_full_kommissia_zalog).hide().find('.checkbox').each(function(){
			$(this).hide().bem('checkbox').setMod('disabled');
		});
		$(this._search_full_kommissia_zalog).hide().find('.select').each(function(){
			$(this).hide().bem('select').setMod('disabled');
		});
	},



	enableKommissia: function(){
		$(this._search_full_kommissia_zalog).show().find('.checkbox').each(function(){
			$(this).show().bem('checkbox').delMod('disabled');
		});
		$(this._search_full_kommissia_zalog).show().find('.select').each(function(){
			$(this).show().bem('select').delMod('disabled');
		});
	},



	disableUslovia: function(){
		$(this._search_full_uslovia_sdelki).hide().find('.checkbox').each(function(){
			$(this).hide().bem('checkbox').setMod('disabled');
		});
		$(this._search_full_uslovia_sdelki).hide().find('.select').each(function(){
			$(this).hide().bem('select').setMod('disabled');
		});
	},



	enableUslovia: function(){
		$(this._search_full_uslovia_sdelki).show().find('.checkbox').each(function(){
			$(this).show().bem('checkbox').delMod('disabled');
		});
		$(this._search_full_uslovia_sdelki).show().find('.select').each(function(){
			$(this).show().bem('select').delMod('disabled');
		});
	},



	disableDeadline: function(){
		$(this._search_full_deadline).hide().find('.select').each(function(){
			$(this).hide().bem('select').setMod('disabled');
		});
	},



	enableDeadline: function(){
		$(this._search_full_deadline).show().find('.select').each(function(){
			$(this).show().bem('select').delMod('disabled');
		});
	},



	disableDopBig: function(){
		$(this._search_full_dop_big).hide().find('.checkbox').each(function(){
			$(this).bem('checkbox').setMod('disabled');
		});
		$(this._search_full_dop_big).hide().find('.select').each(function(){
			$(this).bem('select').setMod('disabled');
		});
	},



	enableDopBig: function(){
		$(this._search_full_dop_big).show().find('.checkbox').each(function(){
			$(this).bem('checkbox').delMod('disabled');
		});
		$(this._search_full_dop_big).show().find('.select').each(function(){
			$(this).bem('select').delMod('disabled');
		});
	},



	disableDopSmall: function(){
		$(this._search_full_dop_small).hide().find('.checkbox').each(function(){
			$(this).hide().bem('checkbox').setMod('disabled');
		});
		$(this._search_full_dop_small).hide().find('.select').each(function(){
			$(this).hide().bem('select').setMod('disabled');
		});
	},



	enableDopSmall: function(){
		$(this._search_full_dop_small).show().find('.checkbox').each(function(){
			$(this).show().bem('checkbox').delMod('disabled');
		});
		$(this._search_full_dop_small).show().find('.select').each(function(){
			$(this).show().bem('select').delMod('disabled');
		});
	},



	disablePloschad: function(){
		$(this._search_full_etaji).addClass('is_first');
		$(this._search_full_ploschad).hide().find('.input').each(function(){
			$(this).hide().bem('input').setMod('disabled');
		});
	},


	enablePloschad: function(){
		$(this._search_full_etaji).removeClass('is_first');
		$(this._search_full_ploschad).show().find('.input').each(function(){
			$(this).show().bem('input').delMod('disabled');
		});
	},






}



));





});
/* end: ../../desktop.blocks/search_full/search_full.js */
/* begin: ../../desktop.blocks/region_popup/region_popup.js */
modules.define(
    'region_popup',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {




provide(BEMDOM.decl(this.name, {

	regions: [
		'Санкт-Петербург',
		'Санкт-Петербург и пригороды',
		'Санкт-Петербург и Ленобласть',
		'Только Ленобласть',
	],

	onSetMod: {
		'js' : {
			'inited' : function(){
				this._popup    = this.findBlockOutside('modal');
				this._switcher = $('#region_popup_switcher').bem('button');
				this._result   = $('#region_popup_result_text');
				this._radio    = this.findBlockInside('radio-group');
				this._tabs     = this.findBlockInside('tabs');

				this._setCurbox();

				this._radio.on('change', this._onChange, this);
			}
		}
	},

	_onChange: function(e){
		this._setCurbox();
	},


	clear: function(){
		var menus          = this.findBlocksInside(this._curbox, 'menu');
		var inputs         = this.findBlocksInside(this._curbox, 'input');
		var sheme          = this.findBlockInside(this._curbox, 'spb_metro_sheme');
		var address_lists  = this.findBlocksInside(this._curbox, 'address_list');

		inputs.map(function(input){
			input.setVal('');
		});

		menus.map(function(menu){
			menu.setVal([]);
			menu.getItems().map(function(item){
				item.delMod('checked');
			});
		});

		if(sheme){
			sheme.clear();
		}

		

		address_lists.map(function(list){
			list.clear();
		});

	},




	getVal: function(){
		var menus          = this.findBlocksInside(this._curbox, 'menu');
		var inputs         = this.findBlocksInside(this._curbox, 'input');
		var radios         = this.findBlocksInside(this._curbox, 'radio-group');
		var sheme          = this.findBlockInside(this._curbox, 'spb_metro_sheme');
		var address        = this.findBlockInside(this._curbox, 'addresses_control');

		var result = {
			district: [],
			locality: [],
			location: this._radio.getVal(),
			metro: [],
			streetBuilding: [],
			metroDistance: '',
			metroDistanceOnFoot: false,
		};

		if(address){
			address.getVal().map(function(i){
				result.streetBuilding.push(i.id + ":" + i.dom);
			});
		}

		if(sheme){
			result.metro = sheme.getValsIds();
		}


		menus.map(function(menu){
			if(menu.hasMod('spb_districts')){
				result.district = menu.getVal();
			}

			if(menu.hasMod('lenobl_districts')){
				result.locality = menu.getVal();
			}

			if(menu.hasMod('mode', 'groupcheck')){
				result.locality = result.locality.concat(menu.getVal());
			}
		});


		inputs.map(function(input){	
			if(input.getName() == 'metroDistance_input'){
				result.metroDistance = input.getVal();
			}
		});


		radios.map(function(radio){	
			if(radio.getName() == 'metroDistanceOnFoot_radio'){
				result.metroDistanceOnFoot = radio.getVal();
			}
		});


		return result;
	},




	_onClear: function(e){
		e.preventDefault();
		this.clear();
	},


	_onSave: function(e){
		e.preventDefault();
		this._popup.delMod('visible');
		this._switcher.setText(this.regions[this._radio.getVal()]);

		var result = this._formatAllValuesToString();

		if(result !== '' && result !== 'test'){
			$(this._result).html(result);
		} else {
			var vals = [
				'',
				'СПб и населенные пункты в 20-30 минутах езды от КАДа',
				'Районы Санкт-Петербурга и Ленобласти',
				'Районы Ленобласти',
			];
			$(this._result).html(vals[this._radio.getVal()]);
		}

		
		
		this._setHiddenInputs();

	},


	_setHiddenInputs: function(){
		var val = this.getVal();

		$('#search_filter_location').val(val.location);
		$('#search_filter_metroDistance').val(val.metroDistance);
		$('#search_filter_metroDistanceOnFoot').val(val.metroDistanceOnFoot);

		$('#search_filter_district').html('');
		for (var i = val.district.length - 1; i >= 0; i--) {
			$('#search_filter_district').append('<input type="hidden" name="district[]" value="' + val.district[i] + '">');
		};

		$('#search_filter_metro').html('');
		for (var i = val.metro.length - 1; i >= 0; i--) {
			$('#search_filter_metro').append('<input type="hidden" name="metro[]" value="' + val.metro[i] + '">');
		};

		$('#search_filter_locality').html('');
		for (var i = val.locality.length - 1; i >= 0; i--) {
			$('#search_filter_locality').append('<input type="hidden" name="locality[]" value="' + val.locality[i] + '">');
		};

		$('#search_filter_streetBuilding').html('');
		for (var i = val.streetBuilding.length - 1; i >= 0; i--) {
			$('#search_filter_streetBuilding').append('<input type="hidden" name="streetBuilding[]" value="' + val.streetBuilding[i] + '">');
		};


	},



	_formatAllValuesToString: function(){
		var result = '';
		var menuitems = [];
		var addritems = [];

		var menus          = this.findBlocksInside(this._curbox, 'menu');
		var inputs         = this.findBlocksInside(this._curbox, 'input');
		var address_lists  = this.findBlocksInside(this._curbox, 'address_list');

		inputs.map(function(input){
			// input.setVal('');
		});


		menus.map(function(menu){
			menu.getItems().map(function(item){
				if(item.hasMod('checked')){
					menuitems.push(item.getText());
				}
			});
		});

		address_lists.map(function(list){
			list.getItems().map(function(item){
				addritems.push(item.getText());
			});
		});


		result += menuitems.join(', ');
		result += menuitems.length && addritems.length ? ', ' : '';
		result += addritems.join(', ');

		return result;
	},




	_setCurbox: function(){
		this._curbox     = this._tabs.getBoxList()[this._radio.getVal()];
		this._savebtns   = this.findBlocksInside(this._curbox, 'button', 'action', 'save');
		this._clearbtns  = this.findBlocksInside(this._curbox, 'link', 'action', 'clear');

		var that = this;

		this._savebtns.map(function(btn){
			if($(btn.domElem).hasClass('button_action_save')){
				btn.on('click', that._onSave, that);
			}
		});

		this._clearbtns.map(function(btn){
			if($(btn.domElem).hasClass('link_action_clear')){
				btn.on('click', that._onClear, that);
			}
		});
	}



}, {


	live: function(){

		this.liveInitOnEvent('mouseover');

	}


}));












});
/* end: ../../desktop.blocks/region_popup/region_popup.js */
/* begin: ../../libs/bem-components/common.blocks/menu/_mode/menu_mode_check.js */
/**
 * @module menu
 */

modules.define('menu', function(provide, Menu) {

/**
 * @exports
 * @class menu
 * @bem
 */
provide(Menu.decl({ modName : 'mode', modVal : 'check' }, /** @lends menu.prototype */{
    /**
     * @override
     */
    _getVal : function() {
        return this.getItems()
            .filter(function(item) { return item.hasMod('checked'); })
            .map(function(item) { return item.getVal(); });
    },

    /**
     * @override
     * @param {Array} vals
     */
    _setVal : function(vals) {
        var wasChanged = false,
            notFoundValsCnt = vals.length,
            itemsCheckedVals = this.getItems().map(function(item) {
                var isChecked = item.hasMod('checked'),
                    hasEqVal = vals.some(function(val) {
                        return item.isValEq(val);
                    });
                if(hasEqVal) {
                    --notFoundValsCnt;
                    isChecked || (wasChanged = true);
                } else {
                    isChecked && (wasChanged = true);
                }
                return hasEqVal;
            });

        if(!wasChanged || notFoundValsCnt)
            return false;

        this._updateItemsCheckedMod(itemsCheckedVals);

        return wasChanged;
    },

    /**
     * @override
     */
    _onItemClick : function(clickedItem) {
        this.__base.apply(this, arguments);

        this.getItems().forEach(function(item) {
            item === clickedItem && item.toggleMod('checked');
        });
        this._isValValid = false;
        this.emit('change');
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/menu/_mode/menu_mode_check.js */
/* begin: ../../desktop.blocks/menu/_mode/menu_mode_groupcheck.js */
/**
 * @module menu
 */

modules.define('menu', ['jquery'], function(provide, $, Menu) {

/**
 * @exports
 * @class menu
 * @bem
 */
provide(Menu.decl({ modName : 'mode', modVal : 'groupcheck' }, /** @lends menu.prototype */{
    /**
     * @override
     */
    _getVal : function() {
        return this.getItems()
            .filter(function(item) { return item.hasMod('checked'); })
            .map(function(item) { return item.getVal(); });
    },

    /**
     * @override
     * @param {Array} vals
     */
    _setVal : function(vals) {
        var wasChanged = false,
            notFoundValsCnt = vals.length,
            itemsCheckedVals = this.getItems().map(function(item) {
                var isChecked = item.hasMod('checked'),
                    hasEqVal = vals.some(function(val) {
                        return item.isValEq(val);
                    });
                if(hasEqVal) {
                    --notFoundValsCnt;
                    isChecked || (wasChanged = true);
                } else {
                    isChecked && (wasChanged = true);
                }
                return hasEqVal;
            });

        if(!wasChanged || notFoundValsCnt)
            return false;

        this._updateItemsCheckedMod(itemsCheckedVals);

        return wasChanged;
    },

    /**
     * @override
     */
    _onItemClick : function(clickedItem) {
        this.__base.apply(this, arguments);

        this.getItems().forEach(function(item) {
            item === clickedItem && item.toggleMod('checked');
        });

        if(clickedItem.hasMod('group_title')){
            this._getGroupItems(clickedItem).map(function(item){
                if(item !== clickedItem){
                    if(clickedItem.hasMod('checked')){
                        item.setMod('checked');
                    } else {
                        item.delMod('checked');
                    }
                }
            });
        }

        this._isValValid = false;
        this.emit('change');

    },





    _getGroupItems : function(groupTitle){
        return this.findBlocksInside(this.elem('group').filter($(groupTitle.domElem).parent()), 'menu-item');
    }









}));

});

/* end: ../../desktop.blocks/menu/_mode/menu_mode_groupcheck.js */
/* begin: ../../desktop.blocks/i-metro_addr-ctrl/i-metro_addr-ctrl.js */
modules.define(
    'i-metro_addr-ctrl',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {




provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){


				this._metro = this.findBlockInside('spb_metro_sheme');
				this._addrs = this.findBlockInside('address_list');

				this._metro.on('change', this._onMetroChange, this);
				
				var that = this;

				this.findBlocksInside('address_list_item').map(function(item){
					item.on('remove', that._onAddrsChange, that);
				});

			}
		}
	},

	_onMetroChange: function(e, data){
		if(data.is_adding){
			this._addrs.addItem(data.index, data.text);
		} else {
			this._addrs.removeItem(data.index);
		}

		var that = this;

		this.findBlocksInside('address_list_item').map(function(item){
			item.on('remove', that._onAddrsChange, that);
		});

	},

	_onAddrsChange: function(e, index){
		this._metro.removeItem(index);
	},


}));












});
/* end: ../../desktop.blocks/i-metro_addr-ctrl/i-metro_addr-ctrl.js */
/* begin: ../../desktop.blocks/address_list/address_list.js */

modules.define(
    'address_list',
    ['BEMHTML', 'i-bem__dom', 'address_list_item', 'jquery'],
    function(provide, BEMHTML, BEMDOM, Item, $) {


provide(BEMDOM.decl({ block : this.name }, /** @lends address_list.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {

                this._items = null;

            }
        },

    },

    /**
     * Returns items
     * @returns {address_list_item[]}
     */
    getItems : function() {
        // return this._items || (this._items = this.findBlocksInside('address_list_item'));
        return this.findBlocksInside('address_list_item');
    },


    clear: function(){
        var items = this.findBlocksInside('address_list_item');
        for (var i = items.length - 1; i >= 0; i--) {
            $(items[i].domElem).remove();
        };
    },

    

    addItem : function(index, text){
        BEMDOM.append(
            this.domElem,
            BEMHTML.apply({
                js: true,
                attrs: {
                    'data-index': index
                },
                block : 'address_list_item',
                text: text
            })
        );
    },


    removeItem: function(index){
        var items = this.findBlocksInside('address_list_item');
        for (var i = items.length - 1; i >= 0; i--) {
            if($(items[i].domElem).attr('data-index') == index){
                $(items[i].domElem).remove();
            }
        };
    }

   
    
}));

});

/* end: ../../desktop.blocks/address_list/address_list.js */
/* begin: ../../desktop.blocks/address_list_item/address_list_item.js */
modules.define(
    'address_list_item',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {




provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){
				this.bindTo(this.elem('del'), 'click', this._onRemove);
			}
		}
	},


	getText: function(){
		return this.domElem.text();
	},

	_onRemove : function(e){
		e.stopPropagation();
		var index = $(this.domElem).attr('data-index') || 0;
		$(this.domElem).remove();
		this.emit('remove', index);
	}

}));












});
/* end: ../../desktop.blocks/address_list_item/address_list_item.js */
/* begin: ../../desktop.blocks/addresses_control/addresses_control.js */

modules.define(
    'addresses_control',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {


provide(BEMDOM.decl({ block : this.name }, /** @lends address_autocomplete.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {

                this._address    = this.findBlockInside('address_autocomplete');
                this._dom_number = this.findBlockInside(this.elem('dom_number'), 'input');
                this._address_list = this.findBlockInside('address_list');

                this._vals = [];

                var that = this;


                function event(){
                    var s = that._address.getVal();
                    var d = that._dom_number.getVal();

                    if(s.text.length && d.length){

                        that._vals.push({
                            text: s.text, 
                            id: s.id,
                            dom: d
                        });

                        that._address_list.addItem(that._vals.length - 1, s.text + ', ' + d);

                        that._address.setVal('');
                        that._dom_number.setVal('');

                        that._setEvents();
                    }
                }




                this._dom_number.bindTo('keyup', function(e){
                    if(e.keyCode === 13){
                        event();
                    }
                });



                this._dom_number.bindTo(this._dom_number.elem('control'), 'blur', function(e){
                    event();
                });







            }
        },

    },


    _onRemove: function(e, index){
        if (index > -1) {
            this._vals.splice(index, 1);
        }
    },


    _setEvents: function(){
        var that = this;
        this.findBlocksInside('address_list_item').map(function(item){
            item.on('remove', that._onRemove, that);
        });
    },



    getVal: function(){
        return this._vals;
    },



}));

});

/* end: ../../desktop.blocks/addresses_control/addresses_control.js */
/* begin: ../../desktop.blocks/address_autocomplete/address_autocomplete.js */

modules.define(
    'address_autocomplete',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {


provide(BEMDOM.decl({ block : this.name }, /** @lends address_autocomplete.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {

                this._input = this.findBlockInside('input');
                this._popup = this.findBlockInside('popup').setAnchor(this._input);
                this._menu  = this.findBlockInside('menu');

                // устанавливает базовый город
                this._base = this.params.base ? this.params.base + ' ' : '';

                this._input.on('change', this._onInputChange, this);

            }
        },

    },

    getVal: function(){
        return this._input.getVal();
    },

    setVal: function(val){
        return this._input.setVal(val);
    },

    _onInputChange: function(){
        var search_result = [];
        var that = this;

        var input_val = this._input.getVal();

        var val = input_val ? this._base  + ' ' + input_val : '';

        $.getJSON('http://geocode-maps.yandex.ru/1.x/?format=json&callback=?&geocode=' + val, function(data) {
            
            if(data.response){
                for(var i = 0; i < data.response.GeoObjectCollection.featureMember.length; i++) {
                    search_result.push({
                        label: data.response.GeoObjectCollection.featureMember[i].GeoObject.description + ' - ' + data.response.GeoObjectCollection.featureMember[i].GeoObject.name,
                        value: data.response.GeoObjectCollection.featureMember[i].GeoObject.name,
                        longlat: data.response.GeoObjectCollection.featureMember[i].GeoObject.Point.pos
                    });
                }
            }

            that._setMenuContent(search_result);
            
            if(search_result.length){
                that._popup.setMod('visible');
            } else {
                that._popup.delMod('visible');
            }
            
        });
    },



    _setMenuContent: function(search_result){
            
        var that = this;
        var menu_content = [];
        var label;
        
        for (var i = 0; i < search_result.length; i++) {
            menu_content.push(this._createMenuItem(search_result[i].value));
        };

        this._menu.setContent(menu_content.join(''));

        this._menu.getItems().map(function(item){
            item.on('click', that._onMenuChange, that);
        });
    },



    _onMenuChange: function(e){
        this._input.un('change', this._onInputChange, this);
        
        var item = $(e.target.domElem).bem('menu-item');
        
        this._input.setVal(item.getText());
        
        this._popup.delMod('visible');

        this._input.on('change', this._onInputChange, this);
    },



    _createMenuItem: function(text){
        return BEMHTML.apply({
            js: true,
            block : 'menu-item',
            mods: {theme: 'islands'},
            content: text
        });
    }

   
    
}));

});

/* end: ../../desktop.blocks/address_autocomplete/address_autocomplete.js */
/* begin: ../../desktop.blocks/spb_metro_sheme/spb_metro_sheme.js */
modules.define(
    'spb_metro_sheme',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				this._vals = [];

				this._svg = $(this.findElem('sheme_svg')).get(0);
				this.bindToDomElem($(this._svg), 'load', this._onSvgLoad);

			}
		}
	},


	getVals: function(){
		return this._vals;
	},


	getValsIds: function(){
		var ids = [];
		this._vals.map(function(i){
			ids.push(Number(i.id));
		});
		return ids;
	},


	clear: function(){
		var svg = this._svg.getSVGDocument();

		var wrapper   = svg.getElementById('transform-wrapper');

		this._vals = [];

		$(wrapper).find('.checkbox').each(function(){
			$(this).remove();
		});
	},


	removeItem: function(index){
		var svg = this._svg.getSVGDocument();
		var cur_check = svg.getElementById('checkbox' + index);
		$(cur_check).remove();
	},


	_onSvgLoad: function(e){
		var svg = this._svg.getSVGDocument();

		var wrapper   = svg.getElementById('transform-wrapper');
		var labels    = svg.getElementById('scheme-layer-labels');
		var stations  = svg.getElementById('scheme-layer-stations');
		var checkbox  = svg.getElementById('checkbox');

		var circles = $(stations).find('circle');
		var that = this;

		$(labels).find('g').each(function(index){

			$(this).hover(function(){

				$(this).css('cursor', 'pointer');
				$(this).find('text').attr('fill', '#999');

			}, function(){

				$(this).find('text').attr('fill', '');

			})

			.click(function(){
				var x = parseInt($(circles[index]).attr('cx'));
				var y = parseInt($(circles[index]).attr('cy'));

				var cur_check = svg.getElementById('checkbox' + index);
				var id = $(this).attr('data-id');
				var text = $(this).find('text').text();

				if(cur_check){
					$(cur_check).remove();
					that._setVals(false, id, index, text);
				} else {
					var clone = $(checkbox).clone()
								.attr('transform', 'translate('+ (x - 9) +','+ (y - 9) +'),scale(0.4 0.4)')
								.attr('opacity', '1')
								.attr('data-text', text)
								.attr('data-id', id)
								.attr('data-index', index)
								.attr('id', 'checkbox' + index);

					$(wrapper).append(clone);
					that._setVals(true, id, index, text);
				}

				
			});



		});

			

	},



	_setVals: function(is_adding, id, index, text){
		var svg = this._svg.getSVGDocument();

		var wrapper   = svg.getElementById('transform-wrapper');

		this._vals = [];

		var that = this;

		$(wrapper).find('.checkbox').each(function(){
			that._vals.push({
				id: $(this).attr('data-id'),
				index: $(this).attr('data-index'),
				text: $(this).attr('data-text')
			});
		});

		this.emit('change', {
			is_adding: is_adding, 
			id: id,
			index: index,
			text: text
		});
	}




}




));



});
/* end: ../../desktop.blocks/spb_metro_sheme/spb_metro_sheme.js */
/* begin: ../../libs/bem-components/common.blocks/modal/modal.js */
/**
 * @module modal
 */

modules.define(
    'modal',
    ['i-bem__dom', 'popup'],
    function(provide, BEMDOM) {

/**
 * @exports
 * @class modal
 * @bem
 *
 * @bemmod visible Represents visible state
 */
provide(BEMDOM.decl(this.name, /** @lends modal.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this._popup = this.findBlockOn('popup');
            },

            '' : function() {
                this.delMod('visible');
            }
        },

        'visible' : function(modName, modVal) {
            this._popup.setMod(modName, modVal);
        }
    },

    /**
     * Sets content
     * @param {String|jQuery} content
     * @returns {modal} this
     */
    setContent : function(content) {
        BEMDOM.update(this.elem('content'), content);
        return this;
    }
}, /** @lends modal */{
    live : true
}));

});

/* end: ../../libs/bem-components/common.blocks/modal/modal.js */
/* begin: ../../libs/bem-components/common.blocks/modal/_autoclosable/modal_autoclosable.js */
/**
 * @module modal
 */

modules.define(
    'modal',
    ['jquery', 'dom'],
    function(provide, $, dom, Modal) {

/**
 * @exports
 * @class modal
 * @bem
 */
provide(Modal.decl({ modName : 'autoclosable', modVal : true }, /** @lends modal.prototype */{
    onSetMod : {
        'visible' : {
            'true' : function() {
                this.__base.apply(this, arguments);

                this
                    .bindTo('pointerclick', this._onPointerClick)
                    ._popup.on({ modName : 'visible', modVal : '' }, this._onPopupHide, this);
            },

            '' : function() {
                this.__base.apply(this, arguments);

                this
                    .unbindFrom('pointerclick', this._onPointerClick)
                    ._popup.un({ modName : 'visible', modVal : '' }, this._onPopupHide, this);
            }
        }
    },

    _onPointerClick : function(e) {
        dom.contains(this.elem('content'), $(e.target)) || this.delMod('visible');
    },

    _onPopupHide : function() {
        this.delMod('visible');
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/modal/_autoclosable/modal_autoclosable.js */
/* begin: ../../desktop.blocks/modal/_closable/modal_closable.js */
/**
 * @module modal
 */

modules.define(
    'modal',
    ['jquery', 'i-bem__dom', 'ua', 'dom', 'keyboard__codes'],
    function(provide, $, BEMDOM, ua, dom, keyCodes, Popup) {

/**
 * @exports
 * @class modal
 * @bem
 */
provide(Popup.decl({ modName : 'closable', modVal : true }, /** @lends modal.prototype */{
    onSetMod : {
        'visible' : {
            'true' : function() {
                // visiblePopupsStack.unshift(this);
                var that = this;
                this
                    .nextTick(function() {

                        that.bindTo(that.elem('close_button'), 'click', function(e) {
                            that.delMod('visible');
                        });
                    })

                    .__base.apply(this, arguments);
            },
        }
    },





}, /** @lends modal */{
    live : function() {
        // BEMDOM.doc.on(KEYDOWN_EVENT, onDocKeyPress);
    }
}));


});

/* end: ../../desktop.blocks/modal/_closable/modal_closable.js */
/* begin: ../../desktop.blocks/search_filter/_main_page/search_filter_main_page.js */
modules.define(
    'search_filter',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $, Filter) {





provide(Filter.decl({ modName : 'main_page' }, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				// основные контролы
				this._action = $('#search_filter_action').bem('radio-group');
				this._target = $('#search_filter_target').bem('radio-group');


				// блоки формы кторые будут скрываться и показываться

				// количество комнат массив flatTypes
				this._search_filter_flat_types = $('#search_filter_flat_types');

				// свободная планировка
				this._search_filter_flat_types_free_plan = $('#search_filter_flat_types_free_plan');

				// посуточно или длительный срок
				this._search_filter_rent_type = $('#search_filter_rent_type');

				// количество комнат
				this._search_filter_room_count = $('#search_filter_room_count');

				// вторичка.новостройка
				this._search_filter_resale_new 		= $('#search_filter_resale_new');
				// this._search_filter_resale_new_bem  = $(this._search_filter_resale_new).find('.checkbox-group').bem('checkbox-group');
				this._search_filter_is_new_checkbox  = $('#search_filter_is_new_checkbox').bem('checkbox');


				// сдан.строится
				this._search_filter_built_build = $('#search_filter_built_build');

				// количество комнат от до
				this._search_filter_room_count_label   = $('#search_filter_room_count_label');
				this._search_filter_room_count_from_to = $('#search_filter_room_count_from_to');

				// полный поиск
				this._search_full = this.findBlockInside('search_full');
				

				this._modal_switcher = $('#region_popup_switcher').bem('button');
				this._modal          = $('#search_full_modal').bem('modal');
			
				this._search_filter_submit_button   = $('#search_filter_submit_button').bem('button');



				this._data = {};
				this._server_params = [];
				this._spin = this.findBlockInside('spin');


				this._page = 1;
				this._sort = '';



				// Обработка событий
				var that = this;

				// переключение между полным и кратким поиском
				this.bindToDomElem($('#toggle_full_search_link'), 'click', this._toggleFullSearch);

				// обработка собития отправки формы
				this.bindTo('submit', this._onSubmitSearchForm);

				// переключение кнопок Купить/Снять
				this._action.on('change', this._onActionChange, this);

				// переключение кнопок Квартиру/Комнату/Дом. участок/Коммерческую недвижимость
				this._target.on('change', this._onTargetChange, this);

				// чек или не чек чекбокса Новостройка
				// this._search_filter_resale_new_bem.on('change', this._onIsNewChange, this);
				this._search_filter_is_new_checkbox.on('change', this._onIsNewChange, this);
				

				this._modal_switcher.on('click', function(){
					that._modal.setMod('visible');
				});

			}
		}
	},


	getData: function(){
		return this._data;
	},





	_onSubmitSearchForm: function(e){
		e.preventDefault(); 
		this._setParamsForServer();
		this._setUrlQueryString();
	},



	_getFormData : function(){
		return $(this.domElem).serializeArray();
	},


	_onActionChange: function(e){
		this._changeFilters();
	},


	_onTargetChange: function(e){
		this._changeFilters();
	},


	_changeFilters: function(){
		var action = this._action.getVal();
		var target = this._target.getVal();
		

		// Купить
		if(action == 'buy'){

			// Квартиру
			if(target == 'flat'){
				
				// включаем то что надо 
				this._enableFlatTypes();
				this._enableFreePlan();
				this._enableResaleNew();
				// включать выключать .. дом сдан.не сдан
				this._onIsNewChange();

				// выключаем то что не надо
				this._disableRentType();
				this._disableRoomCount();
				this._disableRoomCountFromTo();

				// полный поиск
				this._search_full.enablePloschad();
				this._search_full.enableDopSmall();
				this._search_full.enableUslovia();

				this._search_full.disableKommissia();
				this._search_full.disableDopBig();
				
			}

			// Комнату
			if(target == 'room'){
				// вкл то что надо
				this._enableRoomCount();
				this._enableRoomCountFromTo();

				// выкл то что не надо
				this._disableRentType();
				this._disableResaleNew();
				this._disableBuiltBuild();
				this._disableFlatTypes();		


				// полный поиск
				this._search_full.enablePloschad();
				this._search_full.enableDopSmall();
				this._search_full.enableUslovia();

				this._search_full.disableKommissia();
				this._search_full.disableDopBig();
				this._search_full.disableDeadline();

			} 

			// Дом участок
			if(target == 'village'){
				
				
			} 

			// Коммерческая недвижимость
			if(target == 'business'){
				
				
			} 

		} 


		// Снять
		if(action == 'rent'){


			// Квартиру
			if(target == 'flat'){
				// вкл то что надо
				this._enableFlatTypes();
				this._enableRentType();

				// включать выключать .. дом сдан.не сдан
				this._onIsNewChange();


				// выкл то что не надо
				this._disableFreePlan();
				this._disableRoomCount();
				this._disableRoomCountFromTo();
				this._disableResaleNew();
				this._disableBuiltBuild();


				// полный поиск
				this._search_full.enableKommissia();
				this._search_full.enableDopBig();

				this._search_full.disablePloschad();
				this._search_full.disableDopSmall();
				this._search_full.disableUslovia();
				this._search_full.disableDeadline();
			}

			// Комнату
			if(target == 'room'){
				// вкл то что надо
				this._enableRoomCount();
				this._enableRoomCountFromTo();
				this._enableRentType();


				// выкл то что не надо
				this._disableFlatTypes();
				this._disableFreePlan();
				this._disableResaleNew();
				this._disableBuiltBuild();

				// полный поиск
				this._search_full.enableKommissia();
				this._search_full.enableDopBig();

				this._search_full.disablePloschad();
				this._search_full.disableDopSmall();
				this._search_full.disableUslovia();
				this._search_full.disableDeadline();
			}
				

			// Дом участок
			if(target == 'village'){
				
				
			} 

			// Коммерческая недвижимость
			if(target == 'business'){
				
				
			} 

		}




	},



	_disableFlatTypes: function(){
		$(this._search_filter_flat_types).hide().find('.checkbox').each(function(){
			$(this).hide().bem('checkbox').setMod('disabled');
		});
	},

	_enableFlatTypes: function(){
		$(this._search_filter_flat_types).show().find('.checkbox').each(function(){
			$(this).show().bem('checkbox').delMod('disabled');
		});
	},


	_disableRentType: function(){
		$(this._search_filter_rent_type).hide().find('.radio-group').bem('radio-group').setMod('disabled');
	},

	_enableRentType: function(){
		$(this._search_filter_rent_type).show().find('.radio-group').bem('radio-group').delMod('disabled');
	},


	_disableRoomCount: function(){
		$(this._search_filter_room_count).hide().find('.checkbox-group').bem('checkbox-group').setMod('disabled');
	},

	_enableRoomCount: function(){
		$(this._search_filter_room_count).show().find('.checkbox-group').bem('checkbox-group').delMod('disabled');
	},


	_disableFreePlan: function(){
		$(this._search_filter_flat_types_free_plan).hide().bem('checkbox').setMod('disabled');
		$(this._search_filter_flat_types).find('.checkbox:visible:last').addClass('last-visible');
	},

	_enableFreePlan: function(){
		$(this._search_filter_flat_types).find('.checkbox').removeClass('last-visible');
		$(this._search_filter_flat_types_free_plan).show().bem('checkbox').delMod('disabled');
	},



	_disableResaleNew: function(){
		$(this._search_filter_resale_new).hide().find('.checkbox').each(function(){
			$(this).bem('checkbox').setMod('disabled');
		});
	},

	_enableResaleNew: function(){
		$(this._search_filter_resale_new).show().find('.checkbox').each(function(){
			$(this).bem('checkbox').delMod('disabled');
		});
	},

	_disableBuiltBuild: function(){
		$(this._search_filter_built_build).hide().find('.checkbox').each(function(){
			$(this).bem('checkbox').setMod('disabled');
		});
	},

	_enableBuiltBuild: function(){
		$(this._search_filter_built_build).show().find('.checkbox').each(function(){
			$(this).bem('checkbox').delMod('disabled');
		});
	},

	_disableRoomCountFromTo: function(){
		$(this._search_filter_room_count_label).hide();

		$(this._search_filter_room_count_from_to).hide().find('.input').each(function(){
			$(this).bem('input').setMod('disabled');
		});
	},

	_enableRoomCountFromTo: function(){
		$(this._search_filter_room_count_label).show();
		
		$(this._search_filter_room_count_from_to).show().find('.input').each(function(){
			$(this).bem('input').delMod('disabled');
		});
	},



	_setParamsForServer: function(){
		var action = this._action.getVal();
		var target = this._target.getVal();

		var fields = [
			'action', 
			'target', 
			'priceFrom', 
			'priceTo', 
			'currency', 
			'district[]', 
			'locality[]', 
			'streetBuilding[]',
			'metro[]', 
			'metroDistance', 
			'metroDistanceOnFoot', 
			'priceMode',
			'typeBuilding[]'
		];

		// Купить
		if(action == 'buy'){
			// Квартиру
			if(target == 'flat'){
				fields = fields.concat([
					'flatTypes[]', 
					'isNew', 
					'isResale', 
					'isBuild', 
					'isBuilt', 
					'areaTo', 
					'areaFrom', 
					'livingAreaFrom', 
					'livingAreaTo', 
					'kitchenAreaFrom', 
					'kitchenAreaTo', 
					'floorFrom', 
					'floorTo', 
					'floorCountFrom', 
					'floorCountTo', 
					'notLastFloor', 
					'notFirstFloor', 
					'lastFloor', 
					'isLift', 
					'canBeSettledAtOnce', 
					'finishing', 
					'balcony', 
					'bathroom', 
					'coveredParking', 
					'coveredSpace', 
					'typeBuilding', 
					'conditionTrade', 
					'isMortgage', 
					'author', 
					'isPrivate', 
					'publishDate', 
					'hasPhoto', 
					'readyQuarter', 
					'readyYear'
				]);

				if(!this._hasIsNew()){
					fields.splice(fields.indexOf('isBuilt'), 1);
					fields.splice(fields.indexOf('isBuild'), 1);
				}

			}

			// Комнату
			if(target == 'room'){
				fields = fields.concat([
					'roomOfferedCount[]', 
					'roomCountFrom', 
					'roomCountTo', 
					'areaTo', 
					'areaFrom', 
					'livingAreaFrom', 
					'livingAreaTo', 
					'kitchenAreaFrom', 
					'kitchenAreaTo', 
					'floorFrom', 
					'floorTo', 
					'floorCountFrom', 
					'floorCountTo', 
					'notLastFloor', 
					'notFirstFloor', 
					'lastFloor', 
					'isLift', 
					'canBeSettledAtOnce', 
					'finishing', 
					'balcony', 
					'bathroom', 
					'typeBuilding', 
					'conditionTrade', 
					'isMortgage', 
					'author', 
					'isPrivate', 
					'publishDate', 
					'hasPhoto'
				]);
			}
		}

		// Снять
		if(action == 'rent'){
			// Квартиру
			if(target == 'flat'){
				fields = fields.concat([
					'flatTypes[]', 
					'isDailyRent', 
					'isLongRent', 
					'areaTo', 
					'areaFrom', 
					'livingAreaFrom', 
					'livingAreaTo', 
					'kitchenAreaFrom', 
					'kitchenAreaTo', 
					'floorFrom', 
					'floorTo', 
					'floorCountFrom', 
					'floorCountTo', 
					'notLastFloor', 
					'notFirstFloor', 
					'lastFloor', 
					'isLift', 
					'canBeSettledAtOnce', 
					'finishing', 
					'balcony', 
					'bathroom', 
					'coveredParking', 
					'coveredSpace', 
					'typeBuilding', 
					'conditionTrade', 
					'isMortgage', 
					'author', 
					'isPrivate', 
					'publishDate', 
					'hasPhoto', 
					'readyYear', 
					'withChildren', 
					'withPets', 
					'isPhone', 
					'isFridge', 
					'isWasher', 
					'isStove', 
					'isKitchenFurniture', 
					'isFurniture'
				]);
			}

			// Комнату
			if(target == 'room'){
				fields = fields.concat([
					'roomOfferedCount[]', 
					'isDailyRent', 
					'isLongRent', 
					'roomCountFrom', 
					'roomCountTo', 
					'floorFrom', 
					'floorTo', 
					'floorCountFrom', 
					'floorCountTo', 
					'notLastFloor', 
					'notFirstFloor', 
					'lastFloor', 
					'isLift', 
					'typeBuilding', 
					'conditionTrade', 
					'hasRentPledge', 
					'author', 
					'isPrivate', 
					'publishDate', 
					'hasPhoto', 
					'withChildren', 
					'withPets', 
					'isPhone', 
					'isFridge', 
					'isWasher', 
					'isStove', 
					'isKitchenFurniture', 
					'isFurniture', 
					'coveredParking', 
					'coveredSpace', 
					'bathroom'
				]);
			}
		}


		this._server_params = [];

		var that = this;

		this._getFormData().map(function(item){
			if($.inArray(item.name, fields) > -1 && item.value !== ''){
				that._server_params.push({
					name: item.name,
					value: item.value
				});
			}
		});


		if(this._page > 1){
			this._server_params.push({
				name: 'page',
				value: this._page
			});
		}



		if(this._sort.length){
			this._server_params.push({
				name: 'sortBy',
				value: this._sort
			});
		}

		console.clear();
		console.table(this._server_params);
	},




	setPage: function(page){
		this._page = page;
	},


	setSort: function(sort){
		this.setPage(1);
		this._sort = sort;
	},





	_setUrlQueryString: function(){
		// window.history.pushState(null, null, window.location.pathname + '?' + $.param(this._server_params));
		window.location.href = this.params.url + '?' + $.param(this._server_params);
	},



	_hasIsNew: function(){
		return this._search_filter_is_new_checkbox.hasMod('checked');
		// return $.inArray('isNew', this._search_filter_resale_new_bem.getVal()) > -1;
	},



	_onIsNewChange: function(){

		if(this._hasIsNew()){
			this._search_full.enableDeadline();
			this._enableBuiltBuild();
		} else {
			this._search_full.disableDeadline();
			this._disableBuiltBuild();
		}

	},




	_toggleFullSearch: function(e){
		e.preventDefault();

		this._search_full.toggleMod('show', true);

		var text  = $('#toggle_full_search_link').text();
		var togg1 = $('#toggle_full_search_link').data('text');
		var togg2 = $('#toggle_full_search_link').data('toggle-text');

		$('#toggle_full_search_link').text(text == togg1 ? togg2 : togg1);
	}

}



));





});
/* end: ../../desktop.blocks/search_filter/_main_page/search_filter_main_page.js */
/* begin: ../../desktop.blocks/living_complex_tools_bar/living_complex_tools_bar.js */
modules.define(
    'living_complex_tools_bar',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited' : function(){
                    this._buttonFavorite = this.findElem('item', 'first', true);
                    this.bindTo(this._buttonFavorite, 'click', this._onToggleFavorite, this);
                }
            },
        },

        _onToggleFavorite: function(e) {
            var toolsItem = $(e.currentTarget);

            e.stopPropagation();

            if (toolsItem.hasClass('living_complex_tools_bar__item_accept')){
                toolsItem.removeClass('living_complex_tools_bar__item_accept');
                toolsItem.find('.icon')
                    .removeClass('icon_action_star')
                    .addClass('icon_action_star-o');
            } else {
                toolsItem.addClass('living_complex_tools_bar__item_accept');
                toolsItem.find('.icon')
                    .addClass('icon_action_star')
                    .removeClass('icon_action_star-o');
            }

            var that = this;
            var url = this.params.favorite_url;

            if (url) {
                $.get(url, {item_id: that.params.item_id}, function(data){
                    console.log(that.params.item_id);
                });
            }
        }

    }));


});
/* end: ../../desktop.blocks/living_complex_tools_bar/living_complex_tools_bar.js */
/* begin: ../../desktop.blocks/gallery/gallery.js */
modules.define(
    'gallery',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {




provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				this._current = this.elem('current');
				this._items = this.elem('item');


				this.bindTo(this._items, 'click', this._previewClick, this);
				this.bindTo(this._current, 'click', this._nextClick, this);
			}
		}
	},


	_nextClick: function(e){

		var i = 0;
		var current;
		var next;

		this._items.map(function(){
			if($(this).hasClass('gallery__item_active')){
				current = i;
				return;
			}
			i++;
		});

		if(current == this._items.length - 1){
			next = 0;
		} else {
			next = current + 1;
		}

		var galleryItem = $(this._items[next]);
		
		this._items.map(function(){
			$(this).removeClass('gallery__item_active');
		});

		galleryItem.addClass('gallery__item_active');

		this._showImage(galleryItem);

	},


	_previewClick: function (e) {
		var galleryItem = $(e.currentTarget);
		
		this._items.map(function(){
			$(this).removeClass('gallery__item_active');
		});

		galleryItem.addClass('gallery__item_active');

		this._showImage(galleryItem);
	},

	_showImage: function (item) {
		var largeImageUrl = item.data('large-image-url');
		var temp = '<img src="'+largeImageUrl+'" class="image" role="img" width="600" height="450">'


		if (item.data('youtube-id')) {
			temp = this._defineTemplate(item.data('youtube-id'));
		}


		$(this._current).html(temp);

	},








	_defineTemplate: function (id) {
		return '<div class="youtube-player">\
							<iframe id="youtube-player" type="text/html" width="600" height="450"\
								src="https://www.youtube.com/embed/' + id + '?wmode=opaque&autoplay=1&fs=0&showinfo=0&html5=1"\
								frameborder="0" allowfullscreen>\
						</div>'
	},









}));












});
/* end: ../../desktop.blocks/gallery/gallery.js */
/* begin: ../../desktop.blocks/living_complex_filter/living_complex_filter.js */
modules.define('living_complex_filter',
    ['i-bem__dom', 'jquery', 'living_complex_flats'],
    function(provide, BEMDOM, $, Flats) {

    provide(BEMDOM.decl(this.name, {
        onSetMod : {
            'js' : {
                'inited' : function() {
                    console.log('living_complex_filter:inited');

                    this._data    = null;
                    this._sort    = null;
                    this._showAll = false;

                    this._dropdown          = this.findBlockInside('dropdown');
                    this._dropdown_menu     = this._dropdown.findBlockInside('menu');
                    this._dropdown_switcher = this._dropdown.getSwitcher();
                    this._dropdown_btn      = this._dropdown.getPopup().findBlockInside('button');
                    this._spin              = this.findBlockInside('spin');

                    this.bindTo('submit', this._onSubmit, this);
                    this._dropdown_btn.on('click', this._submitProcess, this);

                    this._select           = this.findBlockInside('select');
                    this._checkboxes       = this.findBlocksInside('checkbox');
                    this._checkboxes_group = this.findBlockInside('checkbox-group');
                    this._radio_group      = this.findBlockInside('radio-group');
                    this._inputs           = this.findBlocksInside('input');

                    var that = this;

                    this._select.on('change', this._onFilterChanged, this);
                    this._checkboxes_group.on('change', this._onFilterChanged, this);
                    this._radio_group.on('change', this._onFilterChanged, this);

                    this._checkboxes.map(function(checkbox){
                        checkbox.on('change', that._onFilterChanged, that);
                    });

                    this._inputs.map(function(input){
                        input.on('change', that._onFilterChanged, that);
                    });

                    this.on('ajax_start', function() { that._spin.setMod('visible'); });
                    this.on('ajax_end', function() { that._spin.delMod('visible'); });

                    this.loadData();

                }
            }
        },

        getData: function(){
            return this._data;
        },

        getShowAll: function() {
            return this._showAll;
        },

        setShowAll: function(val) {
            this._showAll = val;
        },

        loadData: function(){
            this._pushRequest();
        },

        _onSubmit: function(e){
            this._submitProcess(e);
        },

        _submitProcess: function(e){
            e.preventDefault();
            
            this._showAll = false;
            this._setSwitcherText(e);
            this.loadData();
        },

        _pushRequest: function(){
            this.emit('ajax_start');

            var that = this;
            var url;

            // Удалить после проверки
            // НАЧАЛО
            if (this._showAll) {
                url = this.params.show_all_url + '?' + $.param(this._getFormData());
            }
            // КОНЕЦ

            if (!url) {
                url = this.params.url + '?' + $.param(this._getFormData());
            }

            $.ajax({
              method: "GET",
              url: url,
              cache: false,
              context: this,
            })
            .done(function(data) {
                that._data = data;
                that.emit('data_loaded');
                that.emit('ajax_end');
            })
            .fail(function(error) {
                console.log(error);
                that.emit('ajax_end');
            });
        },  

        _getFormData: function(){
            var data = $(this.domElem).serializeArray();
            
            this._showAll && data.push({ name: 'show_all', value: '1' });
            this._sort && data.push({ name: 'sort_by', value: this._sort });

            var menu_val = this._dropdown_menu.getVal();

            if (menu_val.length) {
                for (var i = menu_val.length - 1; i >= 0; i--) {
                    data.push({ name: 'buyTypes[]', value: menu_val[i]});
                };
            }

            return data;
        },

        setSort: function(sort){
            this._sort = sort;
        },

        _setSwitcherText: function(e){
            if(e.type == 'click'){
                this._dropdown.getPopup().delMod('visible');
                var menu_val = this._dropdown_menu.getVal();
                var switcher_text = menu_val.length ? 'Способ покупки (' + menu_val.length + ')' : 'Способ покупки';
                this._dropdown_switcher.setText(switcher_text);
            }
        },

        _onFilterChanged: function(e) {
            this._showAll = false;
            this.loadData();
        }
        
    }));
});

/* end: ../../desktop.blocks/living_complex_filter/living_complex_filter.js */
/* begin: ../../desktop.blocks/living_complex_filter_controller/living_complex_filter_controller.js */
modules.define(
    'living_complex_filter_controller',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {

function wordend(num, words){
    return words[ ((num=Math.abs(num%100)) > 10 && num < 15 || (num%=10) > 4 || num === 0) ? 2 : num === 1 ? 0 : 1 ];
}

provide(BEMDOM.decl(this.name, {

    onSetMod: {
        'js' : {
            'inited' : function(){
                this._flats   = this.findBlockOutside('living_complex_flats');
                this._filter  = this.findBlockInside('living_complex_filter');
                this._results = this.findBlockInside('search_results');
                this._sort    = $('#search_filter_sorts').bem('select');
                
                this._resultsCount = 

                this._flats && this._flats.on('show-all', this._onFlatsShowAll, this);
                this._filter && this._filter.on('data_loaded', this._onDataLoaded, this);
                this._sort && this._sort.on('change', this._onSortChange, this);
            }
        }
    },


    _onDataLoaded: function(e) {
        // TODO Показывать кнопку 'Все предложения', если есть еще результаты

        var data = this._filter.getData() || {};
        var count = data.items && data.items.length;

        this._filter && this._filter.elem('count').text(' — ' + count + ' ' + wordend(count, ['предложение', 'предложения', 'предложений']));
        
        this._results.setContent(data.items, data.lists, data.user_auth);
    },

    _onSortChange: function(){
        this._filter.setSort(this._sort.getVal());
        this._filter.loadData();
    },

    _onFlatsShowAll: function() {
        this._filter && this._filter.setShowAll(true);
        this._filter && this._filter.loadData();
    }


}



));





});
/* end: ../../desktop.blocks/living_complex_filter_controller/living_complex_filter_controller.js */
/* begin: ../../desktop.blocks/search_results_item/search_results_item.js */
modules.define(
    'search_results_item',
    ['i-bem__dom', 'jquery', 'popup'],
    function(provide, BEMDOM, $) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				this.bindTo(this.findElem('tools_item', 'first', true), 'click', this._toggleFavorite, this);
				this.bindTo(this.findElem('tools_item', 'second', true), 'click', this._toggleLists, this);
				this.bindTo(this.findElem('tools_item', 'third', true), 'click', this._toggleComments, this);
				
				this.bindTo($(this.domElem).find('.voprosique'), 'click', function(e){ 
					e.preventDefault();
				});

				this.in_lists = this.params.in_lists || [];
				
			}
		}
	},





	setInLists: function(id){
		if(this.in_lists.indexOf(id) == -1){
			this.in_lists.push(id);
		}
		$(this.findElem('tools_item', 'second', true)).addClass('search_results_item__tools_item_accept');
		$(this.findBlockInside(this.findElem('tools_item', 'second', true), 'icon').domElem).removeClass('icon_action_plus').addClass('icon_action_plus-blue');
	},



	setInComments: function(){
		$(this.findElem('tools_item', 'third', true)).addClass('search_results_item__tools_item_accept');
		$(this.findBlockInside(this.findElem('tools_item', 'third', true), 'icon').domElem).removeClass('icon_action_comments').addClass('icon_action_comments-blue');
	},


	_toggleLists : function(e){
		e.preventDefault();
	},

	_toggleComments : function(e){
		e.preventDefault();
	},




	_toggleFavorite: function(e){
		e.preventDefault();

		var that = this;

		if($(e.currentTarget).hasClass('search_results_item__tools_item_accept')){
			$(e.currentTarget).removeClass('search_results_item__tools_item_accept');
			$(e.currentTarget).find('.icon')
							  .removeClass('icon_action_star')
							  .addClass('icon_action_star-o');
		} else {
			$(e.currentTarget).addClass('search_results_item__tools_item_accept');
			$(e.currentTarget).find('.icon')
							  .addClass('icon_action_star')
							  .removeClass('icon_action_star-o');
		}

		var url = this.findBlockOutside('search_results').params.favorite_url;

		if(url){
			$.get(url, {item_id: that.params.id}, function(data){
				//////////
				console.log(that.params.id);
			});
		}

	},



	






}



));





});
/* end: ../../desktop.blocks/search_results_item/search_results_item.js */
/* begin: ../../desktop.blocks/search_results/search_results.js */
modules.define(
    'search_results',
    ['BEMHTML', 'i-bem__dom', 'jquery', 'search_results_item'],
    function(provide, BEMHTML, BEMDOM, $, Item) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){
				this._first = true;
				this._items = [];
				this._lists = [];
				this._user_auth = false;
				
			}
		}
	},


	getItems: function(all){
		all = all || false;
		if(!all){
			return this.findBlocksInside({ block: 'search_results_item', mods: { heading: all }} );
		}
		return this.findBlocksInside('search_results_item');
	},

	clear: function(all){
		all = all || false;

		items = this.getItems(all);

		for (var i = items.length - 1; i >= 0; i--) {
            $(items[i].domElem).remove();
        };
	},

	appendContent: function(items, lists, user_auth) {
		this._items = items;
		this._lists = lists;
		this._user_auth = user_auth;

		var that = this;

		this._items.map(function(item){
			that.addItem(item, lists);
		});
	},

	update: function(data) {
		data = data || {};
		this.setContent(data.items, data.lists, data.user_auth);
	},

	setContent: function(items, lists, user_auth){

		this._items = items;
		this._lists = lists;
		this._user_auth = user_auth;

		this.clear(true);

		var heding = {
			mods: { heading: true },
			image: '',
			address_help: 'Адрес',
			object_help: 'Объект',
			s_help: 'S общ.',
			floor_help: 'Этаж',
			san_help: 'Сан.уз.',
			home_help: 'Дом',
			price_help: 'Цена, Р',
			seller_help: 'Продавец',
		};


		var that = this;

		that.addItem(heding, lists);

		this._items.map(function(item){
			that.addItem(item, lists);
		});

	},


	addItem: function(item, lists){

		var embed = item.hasOwnProperty('embed') ? item.embed : false;
		
		if (embed) {
			this.addEmbededItem(item);
	        return;
		}

		lists = lists || [];

		var id        = item.hasOwnProperty('js') && item.js.hasOwnProperty('id') ? item.js.id : 0; 
		var id       = item.hasOwnProperty('js') && item.js.hasOwnProperty('id') ? item.js.id : 0; 
		var link     = item.hasOwnProperty('js') && item.js.hasOwnProperty('link') ? item.js.link : ''; 
		var in_lists = item.hasOwnProperty('js') ? $.inArray(item.js.id, item.in_lists) > -1 : false;

		item.id = id;
		item.link = link;
		item.lists = lists;
		item.user_auth = this._user_auth;

		BEMDOM.append(this.domElem, BEMHTML.apply({ 
        	js: { id: id, in_lists: item.in_lists, link: link },
        	attrs: { href: link },
        	block: 'search_results_item', 
        	mods: item.mods, 
        	content: item
        }));
	},

	addEmbededItem: function(item) {
		item = item || {};

		BEMDOM.append(this.domElem, BEMHTML.apply({ 
        	block:  'search_results_item', 
        	mods:    {'embed': true }, 
        	js:      false,
        	content: item
        }));
	},

	updateListsData: function(list_item){
		for (var i = this._lists.length - 1; i >= 0; i--) {
			if(this._lists[i].id == list_item.id){
				this._lists[i].count = list_item.count;
			}
		};
	},


	pushToLists: function(list_item){
		this._lists.push(list_item);
	},


	updateLists: function(){
		var that = this;
		var items = this.getItems();

		(items || []).map(function(item) {

			var dropdown = item.findBlockInside(item.findElem('tools_item', 'second', true), 'dropdown')
			if (dropdown) {
				var ulis = dropdown.getPopup().findBlockInside('user_lists_in_search');
				
				if (ulis) {
					BEMDOM.update(
						ulis.findBlockInside('menu').domElem, 
						BEMHTML.apply(that.listsMenuContent(item.params.in_lists || item.in_lists || [], that._lists))
					);
					setTimeout(function(){
						ulis._setHandlers();
					}, 100);
				}
			}
			
		});

	},


	listsMenuContent: function(in_lists, lists){
		var isInList;

		return lists.map(function(i){
			var isInList = in_lists.indexOf(i.id) > -1;

	    	return {
	            block: 'menu-item',
	            mods: { theme : 'islands', size : 'm', checked: isInList, disabled: isInList },
	            js: { val : i.id, count: i.count },
	            val: i.id,
	            content : [
	            	{
	            		tag: 'span',
	            		block: 'plain_text',
	            		mods: {size: '11'},
	            		content: i.name + '&nbsp;'
	            	},
	            	{
	            		tag: 'span',
	            		block: 'help',
	            		content: i.count
	            	}
	            ]
	        };
	    });
	},





	


}



));





});
/* end: ../../desktop.blocks/search_results/search_results.js */
/* begin: ../../desktop.blocks/similar_living_complexes/similar_living_complexes.js */
modules.define(
    'similar_living_complexes',
    ['BEMHTML','i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				this._radio = this.findBlockInside('radio-group');
				this._spin = this.findBlockInside('spin');
				this._more = this.findBlockInside(this.elem('more'), 'button');

				

				var that = this;

				this.on('ajax_start', function(){
                    that._spin.setMod('visible');
                });

                this.on('ajax_end', function(){
                    that._spin.delMod('visible');
                });

                this._page = 1;




                this._radio.on('change', this._changeRadio, this);
                
                this._more.on('click', function(){
                    this._page += 1;
                    this._loadData();
                }, this);






                this._loadData();

			}
		}
	},


	_getFormData: function(){
		var data = [];

		data.push({
			name: 'similar_by',
			value: this._radio.getVal()
		});

		data.push({
			name: 'id',
			value: this.params.cur_id
		});


        data.push({
            name: 'page',
            value: this._page
        });

		return data;
	},


	clear: function(){

		var items = this.findBlocksInside('new-buildings-list-item');

		for (var i = items.length - 1; i >= 0; i--) {
            $(items[i].domElem).remove();
        };

	},


	_changeRadio: function(){
		this.clear();
        this._page = 1;
		this._loadData();
	},


	_loadData: function(){
		this.emit('ajax_start');

        var url = this.params.url + '?' + $.param(this._getFormData());


        $.ajax({
          method: "GET",
          url: url,
          cache: false,
          context: this,
        })
        .done(function(data) {
            this.setContent(data.items);

            console.log(data);

            this.emit('ajax_end');
        })
        .fail(function(error) {
            console.log(error);
            this.emit('ajax_end');
        });
	},




	setContent: function(items){
		var that = this;

		items.map(function(item){
			that.addItem(item);
		});
	},


	addItem: function(item){
		BEMDOM.append(
            this.elem('body'),
            BEMHTML.apply({
                block: 'new-buildings-list-item',
                mods: item.mods,
                content: item
            })
        );
	},













}



));





});
/* end: ../../desktop.blocks/similar_living_complexes/similar_living_complexes.js */
/* begin: ../../desktop.blocks/new-buildings-list-item/new-buildings-list-item.js */
modules.define(
    'new-buildings-list-item',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {}

    ));

});
/* end: ../../desktop.blocks/new-buildings-list-item/new-buildings-list-item.js */
/* begin: ../../desktop.blocks/sidebar-text-list/sidebar-text-list.js */
({
    shouldDeps: [
        { block: 'icon' }
    ]
});
/* end: ../../desktop.blocks/sidebar-text-list/sidebar-text-list.js */
/* begin: ../../desktop.blocks/new-buildings-filter/new-buildings-filter.js */
modules.define(
    'new-buildings-filter',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js' : {
            'inited': function() {
                this._appartmentsParams = {
                    page: null
                };

                this._buildingsParams = {
                    sort:   null,
                    class:  null,
                    loc:    null,
                    search: null,
                    page:   null
                },

                this._filterName;
                this._searchMode = 'text';

                this._data = null;
                this._sort = null;
                this._page = null;
                this._class = null;
                this._loc = null;

                this._modal          = $('#search_full_modal').bem('modal');
                this._modal_switcher = $('#region_popup_switcher').bem('button');

                this._spin = this.findBlockInside('spin');
                this._main = this.findBlockOutside('new-buildings-content');
                this._list = this._main && this._main.findBlockInside('new-buildings-list');
                this._search_filter_submit_button = $('#search_filter_submit_button').bem('button');

                this._setEvents();
                this.loadData('buildings', false);
            }
        }
    },

    setSearchMode: function(mode) {
        this._searchMode = mode;
    },

    setLocationId: function(loc){
        this._loc = loc;
        this._buildingsParams.loc = loc;
    },

    setLocationSearchText: function(text) {
        this._loc_search = text;
        this._buildingsParams.search = text;
    },

    getData: function(){
        return this._data;
    },

    getParamsForServer: function(type) {
        type = type || 'buildings';
        return this._getFormData(type);
    },

    loadData: function(type, history){
        var that = this;
        
        type = type || this._filterName;
        history = history === false ? false : true;

        var params = $.param(this._getFormData(type));
        var url = this.params.url + (params ? '?' + params : '');

        this.emit('ajax_start');

        $.ajax({
          method: "GET",
          url: url,
          cache: false,
        })
        .done(function(data) {
            that._data = data;
            history && that._setUrlQueryString(type);
            that.emit('data_loaded', { type: type });
            that.emit('ajax_end');
        })
        .fail(function(error) {
            console.log(error);
            that.emit('ajax_end');
        });
    },

    _setUrlQueryString: function(type) {
        var params = $.param(this._getFormData(type));
        window.history.pushState(null, null, window.location.pathname + (params ? '?' + params : ''));
    },

    _getFormData: function(type){
        var params = [];

        type = type || 'buildings';

        if (type == 'buildings') {
            var filter = this._buildingsParams;

            switch (this._searchMode) {
                case 'text': filter.search && params.push({ name: 'search', value: filter.search }); break;
                case 'location': filter.loc && params.push({ name: 'location_id', value: filter.loc }); break;
            }

            filter.sort   && params.push({ name: 'sortBy',     value: filter.sort });
            filter.page   && params.push({ name: 'page',        value: filter.page });
            filter.class  && filter.class.map(function(v) { params.push({ name: 'class[]', value: v }); });

            return params;
        }

        if (type == 'appartments') {
            var filter = $(this.domElem).serializeArray();

            params.push({ name: 'filter', value: 'appartments' });

            filter.map(function(item) {
                var okName = item.name !== 'metroDistanceOnFoot_radio' && item.name !== 'tabs';

                if (okName && item.value !== '') {
                    params.push({ name: item.name, value: item.value });
                }
            });

            return params;
        }

        return params;
    },

    setClass: function(val) {
        this._class = val;
        this._buildingsParams.class = val;
    },

    setSort: function(val) {
        this._sort = val;
        this._buildingsParams.sort = val;
    },

    setPage: function(val) {
        this._page = val;
        this._buildingsParams.page = val;
    },

    _setEvents: function() {
        var that = this;
                
        this.on('ajax_start', function(){
            that._search_filter_submit_button.setMod('disabled');
            that._list && that._list.setMod('loading');
            that._spin.setMod('visible');
        });

        this.on('ajax_end', function(){
            that._search_filter_submit_button.delMod('disabled');
            that._list && that._list.delMod('loading');
            that._spin.delMod('visible');
        });

        this._modal_switcher.on('click', function() { that._modal.setMod('visible'); });
        this.bindToDomElem($('#toggle-filter-ext-link'), 'click', this._toggleFilterExt);

        // Перехват события клика на кнопку 'Найти',
        // Генерирует событие 'submit', { type: 'appartments' }, для редиректа на страницу поиска с текущими параметрами фильтра
        this._search_filter_submit_button.bindTo('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            that._filterName = 'appartments';
            that.emit('submit', { type: that._filterName });
        });

        // По умолчанию сабмитим форму в режиме поиска ЖК по тексту
        this.bindTo('submit', this._onFormSubmit);
    },

    _onFormSubmit: function(e) {
        e.preventDefault();
        this.setSearchMode('text');
        this.loadData('buildings');
    },

    _toggleFilterExt: function(e) {
        e.preventDefault();
        this.findBlockInside('new-buildings-filter-ext').toggleMod('show', true);

        var text  = $('#toggle-filter-ext-link').text();
        var toggle1 = $('#toggle-filter-ext-link').data('text');
        var toggle2 = $('#toggle-filter-ext-link').data('toggle-text');

        $('#toggle-filter-ext-link').text(text == toggle1 ? toggle2 : toggle1);
    }
}));

});
/* end: ../../desktop.blocks/new-buildings-filter/new-buildings-filter.js */
/* begin: ../../desktop.blocks/new_buildings_filter_controller/new_buildings_filter_controller.js */
modules.define(
    'new_buildings_filter_controller',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){
                console.log('new_buildings_filter_controller:inited');
				this._params = {
					userAuth: false,
					dataUrl:       '/desktop.blocks/new-buildings-filter/test.json',
					searchPageUrl: '/desktop.bundles/search/search.html',
				};

				this._params = $.extend(this._params, this.params);

				this._filter     = this.findBlockInside('new-buildings-filter');
				this._results    = this.findBlockInside('new-buildings-list');
				this._pagination = this._results && this._results.findBlockInside('pagination');
				this._tools      = this._results && this._results.findBlockInside('new-buildings-list-toolbar');

                this._results && this._results.on('sort_change', this._onSortChange, this);
                this._results && this._results.on('class_change', this._onClassChange, this);
                this._tools && this._tools.on('location_change', this._onLocationChange, this);
                this._tools && this._tools.on('search', this._onLocationSearch, this);

                // обработка события отправки формы
                this._filter && this._filter.on('submit', this._onSubmitSearchForm, this);

                // Обновление списка и пагинатора
                this._filter && this._filter.on('data_loaded', this._onDataLoaded, this);
                this._pagination && this._pagination.on('change', this._onPageChange, this);
			}
		}
	},

	_onClassChange: function(){
		this._filter.setClass(this._results.getClass());
		this._filter.setLocationSearchText(this._tools.getVal(true));
		this._filter.loadData('buildings');
	},

	_onSortChange: function(){
		this._filter.setSort(this._results.getSort());
		this._filter.setLocationSearchText(this._tools.getVal(true));
		this._filter.loadData('buildings');
	},

	_onDataLoaded: function(){
		var data = this._filter.getData();
		this._results && this._results.setContent(data.items);
		this._pagination && this._pagination.update(data);
	},

	_onPageChange: function(){
		this._filter.setPage(this._pagination.getCurrentPage());
		this._filter.loadData('buildings');
	},

    // Поиск ЖК по id или тексту
	_onLocationChange: function(e, data) {
		data = data || {};

        if (data.type == 'location') {
            this._filter.setSearchMode('location');
            this._filter.setLocationId(data.value);
            this._filter.setLocationSearchText(null);
        } else {
            this._filter.setSearchMode('text');
            this._filter.setLocationSearchText(!data.clear ? this._tools.getVal(true) : '');
            this._filter.setLocationId(null);
        }

		this._filter.loadData('buildings');
	},

    // Поиск ЖК по тексту
	_onLocationSearch: function() {
        this._filter.setSearchMode('text');
		this._filter.setLocationSearchText(this._tools.getVal(true));
		this._filter.loadData('buildings');
	},

    // Редирект на страницу поиска с текущими параметрами фильтра
	_onSubmitSearchForm: function(e, data) {
		e.preventDefault();
		data = data || {};

		var params = this._filter.getParamsForServer(data.type);
		var url = this._params.searchPageUrl || '';

		// Редирект
		window.location.href = url + '?' + $.param(params);
	}
}

));

});
/* end: ../../desktop.blocks/new_buildings_filter_controller/new_buildings_filter_controller.js */
/* begin: ../../desktop.blocks/new-buildings-list/new-buildings-list.js */
modules.define(
    'new-buildings-list',
    ['BEMHTML','i-bem__dom', 'jquery', 'new-buildings-list-item'],
    function(provide, BEMHTML, BEMDOM, $, Items) {



provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				this._selectClass = this.findBlockInside('new-buildings-select-class');
                this._showBtn = this._selectClass.findBlockInside('button');
                this._dropdown = this._selectClass.findBlockInside('dropdown');
                this._select = this.findBlockInside('select');
                this._menu = null;

                var that = this;

                this._dropdown.findBlockInside('link').bindTo('click', function(){
                    setTimeout(function(){
                        
                        that._menu = that._dropdown.getPopup().findBlockInside('menu');
                        var items = that._menu.getItems();

                        items[0].on('click', function(){
                            if(!items[0].hasMod('checked')){
                                items.map(function(item){
                                  if(item.getVal() != 0){
                                    item.delMod('checked');
                                  }
                               }); 
                            }
                        });

                        items.map(function(item){
                          if(item.getVal() != 0){
                            item.on('click', function(){
                                if(!item.hasMod('checked')){
                                    items[0].delMod('checked');
                                }
                            });
                          }
                        }); 

                    }, 0);
                });



                this._showBtn.on('click', function(){

                    var popup = this._selectClass.findBlockInside('dropdown').getPopup();
                    var switcher = this._selectClass.findBlockInside('dropdown').getSwitcher();
                   
                    popup.delMod('visible');

                    var items = this._menu.getItems();
                    var texts = [];

                    for (var i = 0; i < items.length; i++) {
                        if(items[i].hasMod('checked')){
                            texts.push(items[i].getText());
                        }
                    };

                    var text = texts.join(', ');

                    if(text.length > 33){
                        text = text.substr(0, 33) + '...';
                    }

                    $(switcher.domElem).find('span:first').html(text);




                    this.emit('class_change');

                }, this);


                this._select.on('change', function(){
                    this.emit('sort_change');
                }, this);

			}
		}
	},


    getSort: function(){
        return this._select.getVal();
    },


    getClass: function(){
        return this._menu.getVal();
    },


	clear: function(){

		var items = this.findBlocksInside('new-buildings-list-item');

		for (var i = items.length - 1; i >= 0; i--) {
            $(items[i].domElem).remove();
        };

	},


	setContent: function(items){
        if(!items.length){
            this.setMod('empty', true);
        } else{
            this.delMod('empty');
            this.clear();

            var that = this;

            items.map(function(item){
                that.addItem(item);
            });
        }
	},




    setEmpty: function(){

        // var overlay = this.findElem('overlay').bem('new-buildings-list__overlay');
        // overlay.setMod('visible', true);
        
        
    },

	addItem: function(item){
		BEMDOM.append(
            this.elem('body'),
            BEMHTML.apply({
                block: 'new-buildings-list-item',
                mods: item.mods,
                content: item
            })
        );
	}
}


));





});
/* end: ../../desktop.blocks/new-buildings-list/new-buildings-list.js */
/* begin: ../../desktop.blocks/new-buildings-list-toolbar/new-buildings-list-toolbar.js */
modules.define(
    'new-buildings-list-toolbar',
    ['BEMHTML','i-bem__dom', 'jquery', 'popup'],
    function(provide, BEMHTML, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js' : {
            'inited' : function() {
                this._val = '';

                this._searchForm = this.elem('search');
                this._searchInput = $('#new-buildings-list-toolbar-search').bem('input');                

                this._searchInput.on('change', this._onSearchInputKeyPress, this);
                this._clear = this._searchInput.elem('clear');

                this._searchPopup = this.findBlockInside('popup');
                this._searchMenu = this._searchPopup.findBlockInside('menu');
                this._searchPopup.setAnchor(this._searchInput);
                this._searchPopup.domElem.width(this._searchInput.domElem.width());

                this.bindTo(this._searchForm, 'submit', this._onSearchFormSubmit);
                

                var that = this;
                this.bindTo(this._clear, 'click', function(){
                    that._val = '';
                    that.emit('location_change', { clear: true });
                })
            }
        }
    },

    _onSearchFormSubmit: function(e) {
        e.preventDefault();
        var val = this._searchInput.getVal();

        if (val.length) {
            this._val = val;
            this._searchPopup.delMod('visible');
            this.emit('search');
        }
    },

    _onSearchInputKeyPress: function(e) {
        var val = this._searchInput.getVal();
        var that = this;
        
        if (val.length >= 2) {

            that._searchPopup.setMod('visible');
            
            $.get(that.params.url + '?needle=' + val, function(data){
                that._highlight(data, val);
                that.setContent(data);
            });
        }

        if (val.length == 0) {
            this._searchPopup.delMod('visible');
        }
    },

    setContent: function(data){
        var that = this;

        var lc = data.living_complexes.map(function(item){
            return that._getLCItem(item);
        });

        var locs = data.locations.map(function(item){
            return that._getLocItem(item);
        });

        this._searchMenu.setContent(BEMHTML.apply([this._getFirstContent(lc), this._getSecondContent(locs)]));

        setTimeout(function(){
            that._setEventHandler();
        }, 0);
    },

    _setEventHandler: function(){
        var items = this._searchMenu.findBlocksInside('menu-item');
        var that = this;
        items.map(function(item){
            if(!item.hasMod('type')){
                item.un('click', that._menuClick, that);
                item.on('click', that._menuClick, that);
            }
        });
    },

    getVal: function(search){
        if (search) {
            return this._searchInput && this._searchInput.getVal();
        }
        return this._val;
    },

    _menuClick: function(e){
        var item = $(e.target.domElem).bem('menu-item');
        var text = item.getText();
        var val = item.getVal();

        this._searchInput.setVal(text);
        this._val = item.getVal(val);
        this._searchPopup.delMod('visible');
        
        this.emit('location_change', { type: 'location', text: text, value: val });
    },

    _highlight: function(data, text){
        var reg = new RegExp('('+text+')', 'gi');
        var rep = "<b>$1</b>";

        for (var i = data.living_complexes.length - 1; i >= 0; i--) {
            data.living_complexes[i].name = data.living_complexes[i].name.replace(reg, rep);
        };

        for (var i = data.locations.length - 1; i >= 0; i--) {
            data.locations[i].text = data.locations[i].text.replace(reg, rep);
        };
    },

    _getFirstContent: function(content){
        return {
            elem : 'group',
            block: 'menu',
            attrs: { style: 'padding: 10px 0;' },
            content : content
        };
    },

    _getSecondContent: function(content){
        return {
            elem : 'group',
            block: 'menu',
            attrs: { style: 'padding: 5px 0;' },
            content : content
        };
    },

    _getLCItem: function(item){
        return {
            block : 'menu-item',
            mods: {theme: 'islands', type: 'link', size: 'm'},
            val: item.id,
            cls: 'new-buildings-list-toolbar-search-icon',
            content: {
                block: 'link',
                tag: 'a',
                attrs: {href: item.link},
                content : [
                    {
                        tag: 'span',
                        content: item.name
                    },
                    {
                        block: 'help',
                        tag: 'span',
                        mods: { font_13: true },
                        content:  ', ' + item.city + ', ' + item.street + ', ' + item.house + '.'
                    }
                ]
            }
            
        };
    },

    _getLocItem: function(item){
        return {
            block : 'menu-item',
            mods: {theme: 'islands', size: 'm'},
            js: {val: item.id},
            content : [
                {
                    tag: 'span',
                    content: item.text
                },
                {
                    block: 'help',
                    tag: 'span',
                    mods: { font_13: true },
                    content:  ' ' + item.count + ' ЖК'
                }
            ]
        };
    }

}));


});

/* end: ../../desktop.blocks/new-buildings-list-toolbar/new-buildings-list-toolbar.js */
/* begin: ../../desktop.blocks/new-buildings-map/new-buildings-map.js */
modules.define('new-buildings-map', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited' : function() {
                    var self = this;
                    this._popup = $('#new-buildings-map-popup');
                    this._map = this.findBlockInside('map');

                    this._map.onGeoObjectClicked = function(e) {
                        var target = e.originalEvent.target;
                        var mouse = e.originalEvent.domEvent.originalEvent;
                        console.log(e);
                        console.log(mouse);

                        var position = {
                            x: mouse.pageX,
                            y: mouse.pageY
                        };

                        self._showPopup(position, {}, e);
                    };
                }
            }
        },

        _showPopup: function(position, data, e) {
            if (this._popup && this._popup.length) {
                var popup = this._popup.bem('popup');

                console.log(popup);
                popup.setPosition(position.x, position.y).setMod('visible', true);
            }
        }

    }));
});

/* end: ../../desktop.blocks/new-buildings-map/new-buildings-map.js */
/* begin: ../../desktop.blocks/new-buildings-search-filter/new-buildings-search-filter.js */
modules.define(
    'new-buildings-search-filter',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js' : {
            'inited': function() {
                console.log('new-buildings-search-filter:inited');

                this._data = null;
                this._sort = null;
                this._page = null;

                this._main   = this.findBlockOutside('new-buildings-content');
                this._list   = this._main && this._main.findBlockInside('search_results');
                this._submit = $('#search_filter_submit_button').bem('button');
                this._spin   = this.findBlockInside('spin');

                this._modal          = $('#search_full_modal').bem('modal');
                this._modal_switcher = $('#region_popup_switcher').bem('button');

                this.setFilters();
                this._setEvents();
                //this.loadData();
            }
        }
    },

    getData: function() {
        return this._data;
    },

    setFilters: function() {
        console.log('SET FILTERS');
        console.table(this.getParamsForServer());
    },

    getParamsForServer: function() {
        return this._getFormData();
    },

    loadData: function() {
        var that = this;
        var params = $.param(this._getFormData());
        var url = this.params.url + (params ? '?' + params : '');

        this.emit('ajax_start');

        $.ajax({
          method: "GET",
          url: url,
          cache: false,
        })
        .done(function(data) {
            that._data = data;
            history && that._setUrlQueryString();

            that.emit('data_loaded');
            that.emit('ajax_end');
        })
        .fail(function(error) {
            console.log(error);
            that.emit('ajax_end');
        });
    },

    _setUrlQueryString: function() {
        var params = $.param(this._getFormData());
        window.history.pushState(null, null, window.location.pathname + (params ? '?' + params : ''));
    },

    _getFormData: function(){
        var params = [];
        var filter = $(this.domElem).serializeArray();

        //params.push({ name: 'filter', value: 'appartments' });

        filter.map(function(item) {
            var okName = item.name !== 'metroDistanceOnFoot_radio' && item.name !== 'tabs';
            if (okName && item.value !== '') {
                params.push({ name: item.name, value: item.value });
            }
        });

        return params;
    },

    setClass: function(val) {
        this._class = val;
    },

    setSort: function(val) {
        this._sort = val;
    },

    setPage: function(val) {
        this._page = val;
    },

    _setEvents: function() {
        var that = this;

        this._modal_switcher.on('click', function() { that._modal.setMod('visible'); });
        this.bindToDomElem($('#toggle-filter-ext-link'), 'click', this._toggleFilterExt);

        // По умолчанию сабмитим форму в режиме поиска ЖК по тексту
        this.bindTo('submit', this._onFormSubmit);

        // Перехват события клика на кнопку 'Найти',
        // Генерирует событие 'submit', { type: 'appartments' }, для редиректа на страницу поиска с текущими параметрами фильтра
        this._submit.bindTo('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            that.emit('submit');
        });
        
        this.on('ajax_start', function(){
            that._submit.setMod('disabled');
            that._list && that._list.setMod('loading');
            that._spin.setMod('visible');
        });

        this.on('ajax_end', function(){
            that._submit.delMod('disabled');
            that._list && that._list.delMod('loading');
            that._spin && that._spin.delMod('visible');
        });
    },

    _onFormSubmit: function(e) {
        e.preventDefault();
        console.log('form submitted');
    },

    _toggleFilterExt: function(e) {
        e.preventDefault();
        this.findBlockInside('new-buildings-filter-ext').toggleMod('show', true);

        var text  = $('#toggle-filter-ext-link').text();
        var toggle1 = $('#toggle-filter-ext-link').data('text');
        var toggle2 = $('#toggle-filter-ext-link').data('toggle-text');

        $('#toggle-filter-ext-link').text(text == toggle1 ? toggle2 : toggle1);
    }
}));

});
/* end: ../../desktop.blocks/new-buildings-search-filter/new-buildings-search-filter.js */
/* begin: ../../desktop.blocks/new-buildings-search-controller/new-buildings-search-controller.js */
modules.define(
    'new-buildings-search-controller',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('new-buildings-search-controller:inited');

                    this._params   = { userAuth: false, dataUrl: '' };
                    this._params   = $.extend(this._params, this.params);

                    this._data     = {};
                    this._page     = 1;
                    this._prevPage = 1;
                    this._sorting  = null;

                    this._filter  = this.findBlockOn('new-buildings-search-filter');
                    this._spin    = this.findBlockInside('spin');
                    this._main    = this.findBlockOutside('new-buildings-content');
                    this._list    = this._main && this._main.findBlockInside('search_results');
                    this._pager   = this._main && this._main.findBlockInside('pagination');

                    this._sort         = $('#search_filter_sorts').bem('select');
                    this._returnButton = $('#search_filter_return_button').bem('button');

                    this._setEvents();
                    this.loadData();
                }
            }
        },

        loadData: function() {
            var that = this;
            var params = $.param(this._getUrlParams());
            var url = this._getUrl() + (params ? '?' + params : '');

            this._abortRequest();
            this.emit('ajax_start');

            this._xhr = $.ajax({
                method: 'GET',
                url: url,
                dataType: 'json',
                cache: false
            })
            .done(function(data) {
                that._data = data;
                that._setUrlQueryString(params);

                that.emit('data_loaded');
                that.emit('ajax_end');
            })
            .fail(function(error) {
                that.emit('data_load_error', { error: error });
                that.emit('ajax_end');
            });
        },

        _abortRequest: function() {
             this._xhr && this._xhr.abort();
        },

        _getUrl: function() {
            return this._params.dataUrl;
        },

        _getUrlParams: function() {
            var params = this._filter ? this._filter.getParamsForServer() : [];

            if (this._sorting) {
                params.push({ name: 'sortBy', value: this._sort.getVal() });
            }

            if (this._page > 1) {
                params.push({ name: 'page', value: this._page });
            }

            return params;
        },

        _setUrlQueryString: function(params) {
            params = typeof params != "undefined" ? params : $.param(this._getUrlParams());
            window.history.pushState(null, null, window.location.pathname + (params ? '?' + params : ''));
        },

        _setEvents: function() {
            var that = this;
            
            this.on('data_loaded', this._onDataLoaded, this);
            this.on('data_load_error', this._onDataLoadError, this);

            this._filter && this._filter.on('submit', this._onFilterSubmit, this);
            this._pager && this._pager.on('change', this._onPageChange, this);

            // On Sort
            this._sort.on('change', function() {
                this._sorting = this._sort.getVal();
                this.loadData();
            }, this);

            // On Return
            this._returnButton && this._returnButton.bindTo('click', function(e) {
                if (that._params.returnUrl) {
                    window.location.href = that._params.returnUrl;
                }
            });

            this.on('ajax_start', function() {
                that._list && that._list.setMod('loading');
                that._spin && that._spin.setMod('visible');
            });

            this.on('ajax_end', function() {
                that._list && that._list.delMod('loading');
                that._spin && that._spin.delMod('visible');
            });
        },

        _onDataLoaded: function() {
            var data = this._data;

            data.user_auth = !!data.user_auth; // TODO Доработать проверку входа пользователя
            data.current_page = this._page;
            data.items = data.items || [];
            
            // Количество строк без учета заголовка
            data.items_count = 0;
            data.items.map(function(item) { if (!item.mods || !item.mods.heading) data.items_count++; });

            this._setUrlQueryString();
            this._params.userAuth = data.user_auth;

            if (this._list) {
                //this._list.setParams(this._params);
                this._list.update(data);
            }

            this._pager && this._pager.setParams(data.total_pages, data.current_page, data.total_items, data.items_per_page, data.items_count);
            this._pager && this._pager.delMod('hidden');
        },

        _onDataLoadError: function(e, data) {
            this._page = this._prevPage;
            console.log(data.error);
        },

        _onFilterSubmit: function() {
            this.loadData();
        },

        _onPageChange: function(e, data) {
            data = data || [];

            this._prevPage = this._page;
            this._page = data.length ? data[0] : 1;
            this.loadData();
        }
    }));
});
/* end: ../../desktop.blocks/new-buildings-search-controller/new-buildings-search-controller.js */
/* begin: ../../desktop.blocks/tools/tools.js */
modules.define(
	'tools',
	['i-bem__dom', 'jquery'],
	function(provide, BEMDOM, $) {

		var inputHeight = 0;
		var startScrollHeight = 0;

		provide(BEMDOM.decl(this.name, {

				onSetMod: {
					'js' : {
						'inited' : function(){

							this._buttonFavorite = this.findElem('tools_item', 'first', true);
							this._buttonInList   = this.findElem('tools_item', 'first', true);
							this._buttonNote     = this.findElem('tools_item', 'third', true);
							this._input          = this.findElem('input-for-note');
							this._saveButton     = this.findBlockInside('note-button', 'button');

							this._note = this._input.val();
							
							var that = this;
							this.bindTo(this._buttonFavorite, 'click', this._onToggleFavorite, this);
							this.bindTo(this._buttonNote, 'click', this._onToggleNote, this);

							this.bindTo(this.findElem('input-for-note'), 'keyup', this._setTextareaHeight, this);
							this._saveButton &&	this._saveButton.on('click', this._saveNote, this);
							
							if (this._input) {
								inputHeight = this._input.height();
								this._input.css({ height: 'auto' });
								startScrollHeight = $(this._input).find('textarea').scrollHeight;
							}

							this._input.hide();
							this._saveButton && this._saveButton.domElem.hide();

							this._updateState();
						}
					},
					'edit': {
						'true': function() {
							this._input.show();
							this._saveButton && this._saveButton.domElem.show();
						},
						'': function() {
							this._input.hide();
							this._saveButton && this._saveButton.domElem.hide();
						}
					}
				},

				_onToggleFavorite: function(e) {
					var toolsItem = $(e.currentTarget);

					e.stopPropagation();

					if (toolsItem.hasClass('tools__tools_item_accept')){
						toolsItem.removeClass('tools__tools_item_accept');
						toolsItem.find('.icon')
							.removeClass('icon_action_star')
							.addClass('icon_action_star-o');
					} else {
						toolsItem.addClass('tools__tools_item_accept');
						toolsItem.find('.icon')
							.addClass('icon_action_star')
							.removeClass('icon_action_star-o');
					}

					var that = this;
					var url = this.params.favorite_url;

					if (url) {
						$.get(url, {item_id: that.params.item_id}, function(data){
							console.log(that.params.item_id);
						});
					}
				},

				_onToggleNote: function(e) {
					this.toggleMod('edit')
				},

				_setTextareaHeight: function(e) {
					var textarea = $(e.currentTarget);
					var scrollHeight = null;

					textarea.css('height', 'auto');
					scrollHeight = textarea[0].scrollHeight;

					if (scrollHeight === startScrollHeight) {
						scrollHeight = inputHeight;
					}

					textarea.css('height', scrollHeight);

					this._newNotes();
				},

				_saveNote: function() {
					var url = this.params.comment_url;
					var val = $(this._input).val();
					var that = this;

					if(url){
						// поменять на post и поменять адрес
						$.get(url, {comment: val, item_id: this.params.item_id}, function(data){
							console.log(that.params.item_id);
							that._saveButton.setMod('saved', true).findElem('text').text('Сохранено');
							that._updateState();
						});
					}
				},

				_newNotes: function()
				{
					this._saveButton.delMod('saved').findElem('text').text('Сохранить');
				},

				_updateState: function() {
					var val = $(this._input).val();
					this._setNoteState(val && val.length);
				},

				_setNoteState: function(hasNote) {
					if (hasNote) {
						this._buttonNote.addClass('tools__tools_item_accept');
						this._buttonNote.find('.icon')
							.addClass('icon_action_comments-blue')
							.removeClass('icon_action_comments');
					} else {
						this._buttonNote.removeClass('tools__tools_item_accept');
						this._buttonNote.find('.icon')
							.addClass('icon_action_comments')
							.removeClass('icon_action_comments-blue');
					}
				}
			}

		));

	});
/* end: ../../desktop.blocks/tools/tools.js */
/* begin: ../../desktop.blocks/retail-data/retail-data.js */
modules.define(
	'retail-data',
	['i-bem__dom', 'jquery', 'popup'],
	function(provide, BEMDOM, $) {

		provide(BEMDOM.decl(this.name, {

				onSetMod: {
					'js' : {
						'inited' : function(){
							this._setFlags();
							this._cacheNodes();
							this._ready();
							this.bindTo(this.image, 'click', this._imageClick);
							this.bindTo(this.galleryItems, 'click', this._previewClick);

							var self = this;

							this._map = this.findBlockInside('map');
							this._map.onGeoObjectClicked = function(e) {
								//var target = e.sourceEvent.originalEvent.target;
								var mouse = e._sourceEvent.originalEvent.domEvent.originalEvent;

								var position = {
									x: mouse.pageX,
									y: mouse.pageY
								};

								self._showPopup(position, {}, e);
							};


							this._popup = this.findBlockInside('popup');
							this._popup.on({ modName : 'visible', modVal : 'true' }, this._onPopupVisibile, this);

							this._button = this.findBlockInside('button')
								.on('click', this._showResultsPopup, this);
						}
					}
				},

				_setFlags: function () {
					this.showedImage = {
						index: 0,
						galleryIndex: 0
					}
				},

				_ready: function () {
					galleryItem = this.gallery.eq(this.showedImage.galleryIndex).children()
						.eq(this.showedImage.index);

					this._showImage(galleryItem);
					this._setActivePreview();
				},

				_cacheNodes: function () {
					this.gallery = $(this.findElem('gallery'));
					this.galleryItems = $(this.findElem('gallery-item'));
					this.image = $(this.findElem('image'));
				},

				_defineTemplate: function () {
					this.template = '<div class="youtube-player">\
										<iframe id="youtube-player" type="text/html" width="600" height="450"\
											src="https://www.youtube.com/embed/' + this.playerID + '?wmode=opaque&autoplay=1&fs=0&showinfo=0&html5=1"\
											frameborder="0" allowfullscreen>\
									</div>'
				},

				_setActivePreview: function () {
					this.gallery.eq(this.showedImage.galleryIndex).children()
						.eq(this.showedImage.index).addClass('retail-data__gallery-item_active');
				},

				_imageClick: function (e) {
					var galleryItem = null;
					var newShowedImageIndex = this.showedImage.index + 1;
					var galleryItemsCount = this.gallery.eq(this.showedImage.galleryIndex).children().length;


					if (newShowedImageIndex + 1 > galleryItemsCount) {
						newShowedImageIndex = 0;
					}

					if (newShowedImageIndex >= this.gallery.eq(this.showedImage.galleryIndex).children().length) {
						return;
					}

					this.showedImage.index = newShowedImageIndex;

					galleryItem = this.gallery.eq(this.showedImage.galleryIndex).children()
						.eq(this.showedImage.index);

					this._showImage(galleryItem);
				},

				_previewClick: function (e) {
					var galleryItem = $(e.currentTarget);
					var galleryIndex = galleryItem.parent().index();
					var index = galleryItem.index();

					this.showedImage.index = index;
					this.showedImage.galleryIndex = galleryIndex;

					if (index < this.gallery.eq(this.showedImage.galleryIndex).children().length) {
						this.image.removeClass('retail-data__image_no-active');
					}

					if (index + 1 === this.gallery.eq(this.showedImage.galleryIndex).children().length) {
						//this.image.addClass('retail-data__image_no-active');
					}

					this._showImage(galleryItem);
				},

				_showImage: function (item) {
					var largeImageUrl = item.data('large-image-url');

					if (item.data('youtube-id')) {
						this.playerID = item.data('youtube-id');
						this._defineTemplate();

						this.image.hide();
						this.image.siblings().remove();
						this.image.parent().prepend(this.template);
					} else {
						this.image.show().siblings().remove();
						this.image[0].setAttribute('src', largeImageUrl);
					}

					this.gallery.children().removeClass('retail-data__gallery-item_active');
					this._setActivePreview();
				},

				_showResultsPopup: function(e) {
					e.preventDefault();


				},

				_showPopup: function(position, data, e) {
					//var map = this._map.getMap();
					//console.log(map.geoObjects.getBounds());
					//map.setBounds(map.geoObjects.getBounds());

					console.log(position);

					this._popup.setPosition(position.x, position.y).setMod('visible', true);
					//this._popup.setPosition(0, 0).setMod('visible', true);
				},

				_onPopupVisibile: function(e) {
					console.log('Popup visible');
				}
			}
		));
	});
/* end: ../../desktop.blocks/retail-data/retail-data.js */
/* begin: ../../desktop.blocks/similar_realties/similar_realties.js */
modules.define(
    'similar_realties',
    ['BEMHTML','i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {


provide(BEMDOM.decl(this.name, {

    onSetMod: {
        'js' : {
            'inited' : function(){
                console.log('similar_realties:inited');

                this._first = true;
                this._page = 1;
                this._radio = this.findBlockInside('radio-group');
                this._spin = this.findBlockInside('spin');
                this._more = this.findBlockInside(this.elem('more'), 'button');

                this._results = this.findBlockInside('search_results');

                var that = this;

                this.on('ajax_start', function() { that._spin.setMod('visible'); });
                this.on('ajax_end', function() { that._spin.delMod('visible'); });
                this._radio.on('change', this._changeRadio, this);
                
                this._more.on('click', function(){
                     console.log('similar_realties:click');
                    this._page += 1;
                    this._loadData();
                }, this);

                this._loadData();
            }
        }
    },

    _getFormData: function(){
        var data = [];

        data.push({
            name: 'similar_by',
            value: this._radio.getVal()
        });

        data.push({
            name: 'id',
            value: this.params.cur_id
        });


        data.push({
            name: 'page',
            value: this._page
        });

        return data;
    },

    clear: function() {
        this._results && this._results.clear(false);
    },

    _changeRadio: function(){
        this.clear();
        this._first = true;
        this._page = 1;
        this._loadData();
    },

    _loadData: function(){
        this.emit('ajax_start');

        var url = this.params.url + '?' + $.param(this._getFormData());

        $.ajax({
          method: "GET",
          url: url,
          cache: false,
          context: this,
        })
        .done(function(data) {
            if (this._first) {
                this._results && this._results.setContent(data.items);
                this._first = false;
            } else {
                this._results && this._results.appendContent(data.items);
            }

            this.emit('ajax_end');
        })
        .fail(function(error) {
            console.log(error);
            this.emit('ajax_end');
        });
    }

}


));





});
/* end: ../../desktop.blocks/similar_realties/similar_realties.js */
/* begin: ../../desktop.blocks/feedback_popup/feedback_popup.js */
modules.define('feedback_popup', [ 'i-bem__dom', 'jquery', 'loader_type_js' ], function (provide, BEMDOM, $, loader) {
	

	var validateEmail = function (email) {
		var re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;;
		return re.test(email);
	};

	var address;

	provide(BEMDOM.decl(this.name, {
		onSetMod: {
			js: {
				inited: function () {

					grecaptcha.render('js-captcha', {
						sitekey: '6Lfv6QsTAAAAAOw9HVBq0rwxvT4_i7ybrqtHAXzi'
					});


					var nodes = {
						popup: this.findBlockOutside('popup'),
						dropdown: this.findBlockOutside('dropdown'),
						radio: this.findBlocksInside('radio'),
						input: this.findBlockInside('input'),
						text: this.findBlockInside('textarea')
					};

					window.$ = $;
					window.jQuery = $;
					this.loadInputMask($);

					address = nodes.input.findElem('control');

					var textarea = nodes.text.findElem('control');
					var contactText = nodes.input.findElem('control');
					var oldText = textarea.text();
					var isEmailValid = false;
					var isToEmail = false;

					contactText.on('change', function () {
						isEmailValid = validateEmail(contactText.val());

						if (!isToEmail) {
							return;
						}

						if (isEmailValid) {
							nodes.input.domElem.css({ background: 'rgb(229, 229, 229)' });
						} else {
							nodes.input.domElem.css({ background: 'rgb(208, 2, 27)' });
						}
					});

					$(window).on('keydown', function (event) {
						nodes.popup.delMod('visible');
					});

					this.bindTo('submit', 'click', function () {
						if (!isEmailValid && isToEmail) {
							return;
						}

						var values = this.domElem.serializeArray();
						var isRobot = false;
						var isEmptyField = false;

						values.forEach(function (item) {
							if (item.value === '') {
								isEmptyField = true;
							}

							if (item.name === 'g-recaptcha-response' && item.value === '') {
								isRobot = true;
							}
						});

						if (isRobot) {
							return;
						}

						if (isEmptyField) {
							return;
						}

						nodes.popup.delMod('visible');
						nodes.dropdown.domElem.remove();
					});

					this.bindTo('cancel', 'click', function () {
						nodes.popup.delMod('visible');
					});

					nodes.radio.forEach(function (item) {
						item.domElem.on('click', function (event) {
							var text = $(event.target).text();
							isToEmail = text === 'на почту';

							if (isToEmail) {
								address.inputmask('remove');
								address.val('');
								address.attr('placeholder', 'Ваш email для связи');
								oldText = textarea.text();
								textarea.text('Пожалуйста, расскажите об объекте подробнее');
							} else {
								address.attr('placeholder', 'Ваш телефон для связи');
								textarea.text(oldText);
								address.val('');
								address.inputmask('9-(999)-999-99-99');
							}
						}.bind(this));
					}.bind(this));
				}
			}
		},
		loadInputMask: function ($) {
			var apiScript = {};
			var apiCallback = 'inputmaskloaded';

			window[apiCallback] = $.proxy(function () {
				this.onApiLoaded();
			}, this);

			apiScript.src = '/desktop.blocks/jquery/jquery.inputmask.bundle.min.js';
			loader(apiScript.src, this.onApiLoaded);
		},
		onApiLoaded: function () {
			address.inputmask('9-(999)-999-99-99');
		}
	}));
});
/* end: ../../desktop.blocks/feedback_popup/feedback_popup.js */
/* begin: ../../desktop.blocks/search_filters_controller/search_filters_controller.js */
modules.define(
    'search_filters_controller',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				this._filter     = this.findBlockInside('search_filter');
				this._results    = this.findBlockInside('search_results');
				this._pagination = this.findBlockInside('pagination');
				this._sort       = $('#search_filter_sorts').bem('select');
				this._headgroup  = $('#search_filter_headgroup').bem('headgroup'); 

				this._filter.on('data_loaded_first', this._onDataLoadedFirst, this);
				this._filter.on('data_loaded', this._onDataLoaded, this);
				this._pagination.on('change', this._onPageChange, this);
				this._sort.on('change', this._onSortChange, this);

			}
		}
	},



	_onDataLoadedFirst: function(){
		
		this._onDataLoadedProcess();
		
		var data = this._filter.getData();
		this._pagination.setParams(data.total_pages, data.current_page, data.total_items, data.items_per_page, data.items.length);
		this._pagination.setContent();

		console.log('data_loaded_first');
	},


	_onDataLoaded: function(){
		this._onDataLoadedProcess();
		console.log('data_loaded');
	},




	_onDataLoadedProcess: function(){
		var data = this._filter.getData();

		$(this._headgroup.domElem).find('.headgroup__first').html(data.title);
		$(this._headgroup.domElem).find('.headgroup__second').html(data.descr);

		this._results.setContent(data.items, data.lists, data.user_auth);

	},




	_onPageChange: function(){
		this._filter.setPage(this._pagination.getCurrentPage());
		this._filter.loadData();
		window.scrollTo(0, 0);
	},

	_onSortChange: function(){
		this._filter.setSort(this._sort.getVal());
		this._filter.loadData(true);
	}


}



));





});
/* end: ../../desktop.blocks/search_filters_controller/search_filters_controller.js */
/* begin: ../../libs/bem-core/common.blocks/i-bem/__dom/_init/i-bem__dom_init_auto.js */
/**
 * Auto initialization on DOM ready
 */

modules.require(
    ['i-bem__dom_init', 'jquery', 'next-tick'],
    function(init, $, nextTick) {

$(function() {
    nextTick(init);
});

});

/* end: ../../libs/bem-core/common.blocks/i-bem/__dom/_init/i-bem__dom_init_auto.js */
/* begin: ../../libs/bem-core/common.blocks/loader/_type/loader_type_js.js */
/**
 * @module loader_type_js
 * @description Load JS from external URL.
 */

modules.define('loader_type_js', function(provide) {

var loading = {},
    loaded = {},
    head = document.getElementsByTagName('head')[0],
    runCallbacks = function(path, type) {
        var cbs = loading[path], cb, i = 0;
        delete loading[path];
        while(cb = cbs[i++]) {
            cb[type] && cb[type]();
        }
    },
    onSuccess = function(path) {
        loaded[path] = true;
        runCallbacks(path, 'success');
    },
    onError = function(path) {
        runCallbacks(path, 'error');
    };

provide(
    /**
     * @exports
     * @param {String} path resource link
     * @param {Function} success to be called if the script succeeds
     * @param {Function} error to be called if the script fails
     */
    function(path, success, error) {
        if(loaded[path]) {
            success();
            return;
        }

        if(loading[path]) {
            loading[path].push({ success : success, error : error });
            return;
        }

        loading[path] = [{ success : success, error : error }];

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        script.src = (location.protocol === 'file:' && !path.indexOf('//')? 'http:' : '') + path;

        if('onload' in script) {
            script.onload = function() {
                script.onload = script.onerror = null;
                onSuccess(path);
            };

            script.onerror = function() {
                script.onload = script.onerror = null;
                onError(path);
            };
        } else {
            script.onreadystatechange = function() {
                var readyState = this.readyState;
                if(readyState === 'loaded' || readyState === 'complete') {
                    script.onreadystatechange = null;
                    onSuccess(path);
                }
            };
        }

        head.insertBefore(script, head.lastChild);
    }
);

});

/* end: ../../libs/bem-core/common.blocks/loader/_type/loader_type_js.js */
/* begin: ../../libs/bem-core/common.blocks/jquery/__event/_type/jquery__event_type_pointerpressrelease.js */
modules.define('jquery', function(provide, $) {

$.each({
    pointerpress : 'pointerdown',
    pointerrelease : 'pointerup pointercancel'
}, function(spec, origEvent) {
    function eventHandler(e) {
        var res, origType = e.handleObj.origType;

        if(e.which === 1) {
            e.type = spec;
            res = $.event.dispatch.apply(this, arguments);
            e.type = origType;
        }

        return res;
    }

    $.event.special[spec] = {
        setup : function() {
            $(this).on(origEvent, eventHandler);
            return false;
        },
        teardown : function() {
            $(this).off(origEvent, eventHandler);
            return false;
        }
    };
});

provide($);

});

/* end: ../../libs/bem-core/common.blocks/jquery/__event/_type/jquery__event_type_pointerpressrelease.js */
/* begin: ../../libs/bem-components/common.blocks/popup/_target/popup_target_anchor.js */
/**
 * @module popup
 */

modules.define(
    'popup',
    ['i-bem__dom', 'jquery', 'objects', 'functions__throttle'],
    function(provide, BEMDOM, $, objects, throttle, Popup) {

var body = $(BEMDOM.doc[0].body),
    UPDATE_TARGET_VISIBILITY_THROTTLING_INTERVAL = 100,
    undef;

/**
 * @exports
 * @class popup
 * @bem
 */
provide(Popup.decl({ modName : 'target', modVal : 'anchor' }, /** @lends popup.prototype */{
    beforeSetMod : {
        'visible' : {
            'true' : function() {
                if(!this._anchor)
                    throw Error('Can\'t show popup without anchor');
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);

                this._anchor = null;
                this._anchorParents = null;
                this._destructor = null;
                this._isAnchorVisible = undef;
                this._updateIsAnchorVisible = throttle(
                    this._updateIsAnchorVisible,
                    UPDATE_TARGET_VISIBILITY_THROTTLING_INTERVAL,
                    false,
                    this);
            },

            '' : function() {
                this.__base.apply(this, arguments);
                this._unbindFromDestructor(); // don't destruct anchor as it might be the same anchor for several popups
            }
        },

        'visible' : {
            'true' : function() {
                this._anchorParents = this._anchor.parents();
                this._bindToAnchorParents();

                this.__base.apply(this, arguments);
            },

            '' : function() {
                this.__base.apply(this, arguments);

                this._unbindFromAnchorParents();
                this._anchorParents = null;
                this._isAnchorVisible = undef;
            }
        }
    },

    /**
     * Sets target
     * @param {jQuery|BEMDOM} anchor DOM elem or anchor BEMDOM block
     * @returns {popup} this
     */
    setAnchor : function(anchor) {
        this
            ._unbindFromAnchorParents()
            ._unbindFromParentPopup()
            ._unbindFromDestructor();

        this._anchor = anchor instanceof BEMDOM?
            anchor.domElem :
            anchor;

        this._destructor = this._anchor.bem('_' + this.__self.getName() + '-destructor');
        this._isAnchorVisible = undef;

        this._bindToDestructor();

        if(this.hasMod('visible')) {
            this._anchorParents = this._anchor.parents();
            this
                ._recaptureZIndex()
                ._bindToAnchorParents()
                ._bindToParentPopup()
                .redraw();
        } else {
            this._anchorParents = null;
            this._zIndexGroupLevel = null;
        }

        return this;
    },

    /**
     * @override
     */
    _calcTargetDimensions : function() {
        var anchor = this._anchor,
            anchorOffset = anchor.offset(),
            bodyOffset = body.css('position') === 'static'?
                { left : 0, top : 0 } :
                body.offset();

        return {
            left : anchorOffset.left - bodyOffset.left,
            top : anchorOffset.top - bodyOffset.top,
            width : anchor.outerWidth(),
            height : anchor.outerHeight()
        };
    },

    /**
     * @override
     */
    _calcDrawingCss : function(drawingParams) {
        typeof this._isAnchorVisible === 'undefined' &&
            (this._isAnchorVisible = this._calcIsAnchorVisible());

        return objects.extend(
            this.__base(drawingParams),
            { display : this._isAnchorVisible? '' : 'none' });
    },

    /**
     * Calculates target visibility state
     * @private
     * @returns {Boolean} Whether state is visible
     */
    _calcIsAnchorVisible : function() {
        var anchor = this._anchor,
            anchorOffset = anchor.offset(),
            anchorLeft = anchorOffset.left,
            anchorTop = anchorOffset.top,
            anchorRight = anchorLeft + anchor.outerWidth(),
            anchorBottom = anchorTop + anchor.outerHeight(),
            direction = this.getMod('direction'),
            vertBorder = Math.floor(this._checkMainDirection(direction, 'top') ||
                    this._checkSecondaryDirection(direction, 'top')?
                anchorTop :
                anchorBottom),
            horizBorder = Math.floor(this._checkMainDirection(direction, 'left') ||
                    this._checkSecondaryDirection(direction, 'left')?
                anchorLeft :
                anchorRight),
            res = true;

        this._anchorParents.each(function() {
            if(this.tagName === 'BODY') return false;

            var parent = $(this),
                overflowY = parent.css('overflow-y'),
                checkOverflowY = overflowY === 'scroll' || overflowY === 'hidden' || overflowY === 'auto',
                overflowX = parent.css('overflow-x'),
                checkOverflowX = overflowX === 'scroll' || overflowX === 'hidden' || overflowX === 'auto';

            if(checkOverflowY || checkOverflowX) {
                var parentOffset = parent.offset();

                if(checkOverflowY) {
                    var parentTopOffset = Math.floor(parentOffset.top);
                    if(vertBorder < parentTopOffset || parentTopOffset + parent.outerHeight() < vertBorder) {
                        return res = false;
                    }
                }

                if(checkOverflowX) {
                    var parentLeftOffset = Math.floor(parentOffset.left);
                    return res = !(
                        horizBorder < parentLeftOffset ||
                        parentLeftOffset + parent.outerWidth() < horizBorder);
                }
            }
        });

        return res;
    },

    _calcZIndexGroupLevel : function() {
        var res = this.__base.apply(this, arguments);

        return this._destructor.findBlocksOutside('z-index-group').reduce(
            function(res, zIndexGroup) {
                return res + Number(zIndexGroup.getMod('level'));
            },
            res);
    },

    _bindToAnchorParents : function() {
        return this.bindTo(
            this._anchorParents,
            'scroll',
            this._onAnchorParentsScroll);
    },

    _unbindFromAnchorParents : function() {
        this._anchorParents && this.unbindFrom(
            this._anchorParents,
            'scroll',
            this._onAnchorParentsScroll);
        return this;
    },

    _onAnchorParentsScroll : function() {
        this
            .redraw()
            ._updateIsAnchorVisible();
    },

    /**
     * @override
     */
    _onWinScrollAndResize : function() {
        this.__base.apply(this, arguments);
        this._updateIsAnchorVisible();
    },

    _updateIsAnchorVisible : function() {
        if(!this.hasMod('js', 'inited') || !this.hasMod('visible'))
            return;

        var isAnchorVisible = this._calcIsAnchorVisible();
        if(isAnchorVisible !== this._isAnchorVisible) {
            this._isAnchorVisible = isAnchorVisible;
            this.redraw();
        }
    },

    _bindToDestructor : function() {
        this._destructor.on({ modName : 'js', modVal : '' }, this._onPopupAnchorDestruct, this);
        return this;
    },

    _unbindFromDestructor : function() {
        this._destructor &&
            this._destructor.un({ modName : 'js', modVal : '' }, this._onPopupAnchorDestruct, this);
        return this;
    },

    _onPopupAnchorDestruct : function() {
        BEMDOM.destruct(this.domElem);
    },

    _getParentPopup : function() {
        return this._parentPopup === undef?
            this._parentPopup = this.findBlockOutside(this._anchor, this.__self.getName()) :
            this._parentPopup;
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/popup/_target/popup_target_anchor.js */
/* begin: ../../libs/bem-components/design/common.blocks/popup/_theme/popup_theme_islands.js */
modules.define('popup', ['objects'], function(provide, objects, Popup) {

provide(Popup.decl({ modName : 'theme', modVal : 'islands' }, {
    getDefaultParams : function() {
        return objects.extend(
            this.__base(),
            {
                mainOffset : 5,
                viewportOffset : 10
            });
    }
}));

});

/* end: ../../libs/bem-components/design/common.blocks/popup/_theme/popup_theme_islands.js */
/* begin: ../../libs/bem-components/common.blocks/dropdown/_switcher/dropdown_switcher_link.js */
/**
 * @module dropdown
 */

modules.define('dropdown', ['link'], function(provide, _, Dropdown) {

/**
 * @exports
 * @class dropdown
 * @bem
 */
provide(Dropdown.decl({ modName : 'switcher', modVal : 'link' }, null, /** @lends dropdown */{
    live : function() {
        this.liveInitOnBlockInsideEvent('click', 'link', this.onSwitcherClick);
        return this.__base.apply(this, arguments);
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/dropdown/_switcher/dropdown_switcher_link.js */
/* begin: ../../libs/bem-components/common.blocks/button/_type/button_type_link.js */
/**
 * @module button
 */

modules.define('button', function(provide, Button) {

/**
 * @exports
 * @class button
 * @bem
 */
provide(Button.decl({ modName : 'type', modVal : 'link' }, /** @lends button.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);
                this._url = this.params.url || this.domElem.attr('href');

                this.hasMod('disabled') && this.domElem.removeAttr('href');
            }
        },

        'disabled' : {
            'true' : function() {
                this.__base.apply(this, arguments);
                this.domElem.removeAttr('href');
            },

            '' : function() {
                this.__base.apply(this, arguments);
                this.domElem.attr('href', this._url);
            }
        }
    },

    /**
     * Returns url
     * @returns {String}
     */
    getUrl : function() {
        return this._url;
    },

    /**
     * Sets url
     * @param {String} url
     * @returns {button} this
     */
    setUrl : function(url) {
        this._url = url;
        this.hasMod('disabled') || this.domElem.attr('href', url);
        return this;
    },

    _doAction : function() {
        this._url && (document.location = this._url);
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/button/_type/button_type_link.js */
/* begin: ../../libs/bem-components/common.blocks/checkbox/_type/checkbox_type_button.js */
/**
 * @module checkbox
 */

modules.define('checkbox', ['button'], function(provide, _, Checkbox) {

/**
 * @exports
 * @class checkbox
 * @bem
 */
provide(Checkbox.decl({ modName : 'type', modVal : 'button' }, /** @lends checkbox.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);
                this._button = this.findBlockInside('button')
                    .on(
                        { modName : 'checked', modVal : '*' },
                        proxyModFromButton,
                        this)
                    .on(
                        { modName : 'focused', modVal : '*' },
                        proxyModFromButton,
                        this);
            }
        },

        'checked' : proxyModToButton,
        'disabled' : proxyModToButton,
        'focused' : function(modName, modVal) {
            proxyModToButton.call(this, modName, modVal, false);
        }
    }
}, /** @lends checkbox */{
    live : function() {
        this.liveInitOnBlockInsideEvent({ modName : 'js', modVal : 'inited' }, 'button');
        return this.__base.apply(this, arguments);
    }
}));

function proxyModToButton(modName, modVal, callBase) {
    callBase !== false && this.__base.apply(this, arguments);
    this._button.setMod(modName, modVal);
}

function proxyModFromButton(_, data) {
    this.setMod(data.modName, data.modVal);
}

});

/* end: ../../libs/bem-components/common.blocks/checkbox/_type/checkbox_type_button.js */
/* begin: ../../libs/bem-components/common.blocks/radio/_type/radio_type_button.js */
/**
 * @module radio
 */

modules.define('radio', ['button'], function(provide, _, Radio) {

/**
 * @exports
 * @class radio
 * @bem
 */
provide(Radio.decl({ modName : 'type', modVal : 'button' }, /** @lends radio.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);
                this._button = this.findBlockInside('button')
                    .on(
                        { modName : 'checked', modVal : '*' },
                        proxyModFromButton,
                        this)
                    .on(
                        { modName : 'focused', modVal : '*' },
                        proxyModFromButton,
                        this);
            }
        },

        'checked' : proxyModToButton,
        'disabled' : proxyModToButton,
        'focused' : function(modName, modVal) {
            proxyModToButton.call(this, modName, modVal, false);
        }
    }
}, /** @lends radio */{
    live : function() {
        this.liveInitOnBlockInsideEvent({ modName : 'js', modVal : 'inited' }, 'button');
        return this.__base.apply(this, arguments);
    }
}));

function proxyModToButton(modName, modVal, callBase) {
    callBase !== false && this.__base.apply(this, arguments);
    this._button.setMod(modName, modVal);
}

function proxyModFromButton(_, data) {
    this.setMod(data.modName, data.modVal);
}

});

/* end: ../../libs/bem-components/common.blocks/radio/_type/radio_type_button.js */
/* begin: ../../libs/bem-components/common.blocks/menu/_mode/menu_mode_radio.js */
/**
 * @module menu
 */

modules.define('menu', function(provide, Menu) {

/**
 * @exports
 * @class menu
 * @bem
 */
provide(Menu.decl({ modName : 'mode', modVal : 'radio' }, /** @lends menu.prototype */{
    /**
     * @override
     */
    _getVal : function() {
        var items = this.getItems(),
            i = 0,
            item;

        while(item = items[i++])
            if(item.hasMod('checked'))
                return item.getVal();
    },

    /**
     * @override
     */
    _setVal : function(val) {
        var wasChanged = false,
            hasVal = false,
            itemsCheckedVals = this.getItems().map(function(item) {
                if(!item.isValEq(val)) return false;

                item.hasMod('checked') || (wasChanged = true);
                return hasVal = true;
            });

        if(!hasVal) return false;

        this._updateItemsCheckedMod(itemsCheckedVals);

        return wasChanged;
    },

    /**
     * @override
     */
    _onItemClick : function(clickedItem) {
        this.__base.apply(this, arguments);

        var isChanged = false;
        this.getItems().forEach(function(item) {
            if(item === clickedItem) {
                if(!item.hasMod('checked')) {
                    item.setMod('checked', true);
                    this._isValValid = false;
                    isChanged = true;
                }
            } else {
                item.delMod('checked');
            }
        }, this);
        isChanged && this.emit('change');
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/menu/_mode/menu_mode_radio.js */
/* begin: ../../libs/bem-components/common.blocks/select/_mode/select_mode_radio.js */
/**
 * @module select
 */

modules.define('select', function(provide, Select) {

/**
 * @exports
 * @class select
 * @bem
 */
provide(Select.decl({ modName : 'mode', modVal : 'radio' }, /** @lends select.prototype */{
    _updateControl : function() {
        var val = this.getVal();
        this.elem('control').val(val);
    },

    _updateButton : function() {
        this._button.setText(this._getCheckedItems()[0].getText());
    },

    _onMenuItemClick : function(_, data) {
        data.source === 'pointer' && this.delMod('opened');
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/select/_mode/select_mode_radio.js */
/* begin: ../../desktop.blocks/map/_provider/map_provider_yandex.js */
/**
 * @module map_provider_yandex
 * @description map block.
 */

modules.define('map',
    ['i-bem__dom', 'ymaps'],
    function(provide, BEMDOM, ymaps) {

    provide(BEMDOM.decl(this.name, {
        onSetMod : {
            'js' : {
                'inited' : function() {
                    this._drawMap();
                }
            }
        },

        /**
         * Draw map unit
         */
        _drawMap : function() {
	        var self = this;
            var params = this.params;

            ymaps.ready(function() {
                this._map = new ymaps.Map(this.domElem[0], params, {
                    searchControlProvider: 'yandex#search'
                });

	            if (params.disableScroll) {
		            this._map.behaviors.disable('scrollZoom');
	            }

	            if (params.clustering) {
		            self.createCluster(this._map);
	            } else {
		            this._drawGeoObjects();
	            }

	            if (params.changeSize) {
		            self.changeSize(this._map);
	            }

                //this._map.controls.add('smallZoomControl', { top: 70, right: 5 });
            }.bind(this));
        },

	    createCluster: function (map) {
		    clusterer = new ymaps.Clusterer({
			    /**
			     * Через кластеризатор можно указать только стили кластеров,
			     * стили для меток нужно назначать каждой метке отдельно.
			     * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/option.presetStorage.xml
			     */
			    preset: 'islands#blueClusterIcons',
			    /**
			     * Ставим true, если хотим кластеризовать только точки с одинаковыми координатами.
			     */
			    groupByCoordinates: false
		    });

		    var collection = [];
			var geoObjects = this.params.geoObjects;

		    geoObjects.forEach(function (geoObject, index) {
			    var coords = geoObject.coordinates,
				    properties = geoObject.properties,
				    objectData = geoObject.objectData;

			    geoObjects[index] = new ymaps.Placemark(coords, { hintContent: '' + properties.hintContent + '' });
		    });

		    clusterer.options.set({
			    clusterDisableClickZoom: true,
			    hasBalloon: false
		    });

		    clusterer.add(geoObjects);

		    clusterer.events.add('click', function (event) {
			    this.onGeoObjectClicked(event);
		    }.bind(this));

		    map.geoObjects.add(clusterer);



		    //var objectState = clusterer.getObjectState(geoObjects[1]);
		    //console.log(objectState.isClustered);
		    //
		    //if (objectState.isClustered) {
			 //   // Если метка находится в кластере
			 //   objectState.cluster.state.set('activeObject', geoObjects[2]);
			 //   clusterer.balloon.open(objectState.cluster);
		    //} else if (objectState.isShown) {
			 //   // Если метка не попала в кластер и видна на карте, откроем ее балун.
				//return false
		    //}
	    },

	    changeSize: function (map) {


		    // console.log(map);
	    },

        /**
         * Draws geoObjects derived from bemjson
         */
        _drawGeoObjects : function() {
            // console.log(this.params);

            this.params.geoObjects.forEach(function(geoObject) {
                var coords = geoObject.coordinates,
                    properties = geoObject.properties,
                    options = geoObject.options,
                    geoType;

                switch(geoObject.type) {
                    case 'placemark':
                        geoType = 'Point';

                        break;
                    case 'polyline':
                        geoType = 'LineString';

                        break;
                    case 'rectangle':
                        geoType = 'Rectangle';
                }

                this.addGeoObject({
                    type : geoType,
                    coordinates : coords
                }, properties, options);

            }, this);
        },

        /**
         * Add geoObject to map
         * @param {Object} geometry
         * @param {Object} properties
         * @param {Object} options
         */
        addGeoObject : function(geometry, properties, options) {
            var self = this;
            ymaps.ready(function() {
                var geoObject = new ymaps.GeoObject(
                    {
                        geometry : geometry,
                        properties : properties
                    },
                    options
                );

                geoObject.events.add('click', function(e) {
                   self.onGeoObjectClicked(e);
                });

                this._map.geoObjects.add(geoObject);

            }.bind(this));
        },

        /**
         * @return {Map | Null}
         */
        getMap : function() {
            return this._map || null;
        },

        onGeoObjectClicked: function(e) {
            console.log('GeoObject Clicked');
        }
    }));
});

/* end: ../../desktop.blocks/map/_provider/map_provider_yandex.js */
/* begin: ../../desktop.blocks/address_autocomplete/_type/address_autocomplete_type_bn.js */
/**
 * @module address_autocomplete
 */

modules.define(
    'address_autocomplete',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $, Address) {

/**
 * @exports
 * @class address_autocomplete
 * @bem
 */
provide(Address.decl({ modName : 'type', modVal : 'bn' }, /** @lends address_autocomplete.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this._input = this.findBlockInside('input');
                this._popup = this.findBlockInside('popup').setAnchor(this._input);
                this._menu  = this.findBlockInside('menu');

                this._url = this.params.url ? this.params.url + '?': '/?';

                this._input.on('change', this._onInputChange, this);

                this._val;
            }
        }
    },


    getVal: function(){
        return {
            text: this._input.getVal(),
            id: this._val
        };
    },

    setVal: function(val){
        return this._input.setVal(val);
    },

    _onInputChange: function(){
        var search_result = [];
        var that = this;

        var input_val = this._input.getVal();


        if(input_val.length > 2){
            $.getJSON(this._url + 'needle=' + input_val, function(data) {
            
                if(data){
                    for(var i = 0; i < data.length; i++) {
                        search_result.push({
                            label: data[i].street,
                            value: data[i].id,
                            longlat: ''
                        });
                    }
                }

                that._setMenuContent(search_result);
                
                if(search_result.length){
                    that._popup.setMod('visible');
                } else {
                    that._popup.delMod('visible');
                }
                
            });
        }
    },



    _setMenuContent: function(search_result){
            
        var that = this;
        var menu_content = [];
        var label;
        
        for (var i = 0; i < search_result.length; i++) {
            menu_content.push(this._createMenuItem(search_result[i].label, search_result[i].value));
        };

        this._menu.setContent(menu_content.join(''));

        this._menu.getItems().map(function(item){
            item.on('click', that._onMenuChange, that);
        });
    },



    _onMenuChange: function(e){
        this._input.un('change', this._onInputChange, this);
        
        var item = $(e.target.domElem).bem('menu-item');
        
        this._input.setVal(item.getText());

        this._val = item.getVal();

        
        this._popup.delMod('visible');

        this._input.on('change', this._onInputChange, this);
    },



    _createMenuItem: function(text, value){
        return BEMHTML.apply({
            js: { val: value },
            block : 'menu-item',
            mods: {theme: 'islands'},
            content: text
        });
    }




}));

});

/* end: ../../desktop.blocks/address_autocomplete/_type/address_autocomplete_type_bn.js */
/* begin: ../../libs/bem-components/design/common.blocks/modal/_theme/modal_theme_islands.js */
/**
 * @module modal
 */

modules.define(
    'modal',
    function(provide, Modal) {

/**
 * @exports
 * @class modal
 * @bem
 */
provide(Modal.decl({ modName : 'theme', modVal : 'islands' }, /** @lends modal.prototype */{
    onSetMod : {
        'visible' : {
            'true' : function() {
                this
                    // Apply the animation only at first opening, otherwise the animation will be played when block
                    // initialized.
                    .setMod('has-animation')
                    .__base.apply(this, arguments);
            }
        }
    }
}));

});

/* end: ../../libs/bem-components/design/common.blocks/modal/_theme/modal_theme_islands.js */
/* begin: ../../desktop.blocks/living_complex_flats/living_complex_flats.js */
modules.define(
    'living_complex_flats',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js': {
                'inited': function() {
                    console.log('living_complex_flats:inited');

                    this._showAll = this.findBlockOn(this.elem('show-all'), 'button');
                    this._showAll && this._showAll.on('click', function() { this.emit('show-all'); }, this);
                }
            }
        }
    }));
})
/* end: ../../desktop.blocks/living_complex_flats/living_complex_flats.js */
/* begin: ../../libs/bem-components/common.blocks/menu-item/_type/menu-item_type_link.js */
/**
 * @module menu-item
 */

modules.define('menu-item', ['link'], function(provide, _, MenuItem) {

/**
 * @exports
 * @class menu-item
 * @bem
 */
provide(MenuItem.decl({ modName : 'type', modVal : 'link' }, /** @lends menu-item.prototype */{
    onSetMod : {
        'hovered' : {
            'true' : function() {
                this._getMenu().hasMod('focused') &&
                    this._getLink().setMod('focused');
            },

            '' : function() {
                var menu = this._getMenu();
                menu.hasMod('focused') && menu.domElem.focus(); // NOTE: keep DOM-based focus within our menu
            }
        },

        'disabled' : function(modName, modVal) {
            this.__base.apply(this, arguments);
            this._getLink().setMod(modName, modVal);
        }
    },

    _getMenu : function() {
        return this._menu || (this._menu = this.findBlockOutside('menu'));
    },

    _getLink : function() {
        return this._link || (this._link = this.findBlockInside('link'));
    },

    _onFocus : function() {
        this.setMod('hovered');
    }
}, /** @lends menu-item */{
    live : function() {
        this.liveBindTo('focusin', this.prototype._onFocus);
        return this.__base.apply(this, arguments);
    }
}));

});

/* end: ../../libs/bem-components/common.blocks/menu-item/_type/menu-item_type_link.js */
/* begin: ../../desktop.blocks/titles/titles.browser.js */
/* global modules:false */

modules.define('titles', function(provide) {

provide();

});


/* end: ../../desktop.blocks/titles/titles.browser.js */
/* begin: ../../desktop.blocks/titles/__page-title/titles__page-title.browser.js */
/* global modules:false */

modules.define('titles__page-title', function(provide) {

provide();

});


/* end: ../../desktop.blocks/titles/__page-title/titles__page-title.browser.js */
/* begin: ../../desktop.blocks/titles/__page-subtitle/titles__page-subtitle.browser.js */
/* global modules:false */

modules.define('titles__page-subtitle', function(provide) {

provide();

});


/* end: ../../desktop.blocks/titles/__page-subtitle/titles__page-subtitle.browser.js */
/* begin: ../../desktop.blocks/titles/__trade-type/titles__trade-type.browser.js */
/* global modules:false */

modules.define('titles__trade-type', function(provide) {

provide();

});


/* end: ../../desktop.blocks/titles/__trade-type/titles__trade-type.browser.js */
/* begin: ../../desktop.blocks/tools/tools.browser.js */
/* global modules:false */

modules.define('tools', function(provide) {

provide();

});


/* end: ../../desktop.blocks/tools/tools.browser.js */
/* begin: ../../desktop.blocks/tools/__add-to-favorites/tools__add-to-favorites.browser.js */
/* global modules:false */

modules.define('tools__add-to-favorites', function(provide) {

provide();

});


/* end: ../../desktop.blocks/tools/__add-to-favorites/tools__add-to-favorites.browser.js */
/* begin: ../../desktop.blocks/tools/__add-to-lists/tools__add-to-lists.browser.js */
/* global modules:false */

modules.define('tools__add-to-lists', function(provide) {

provide();

});


/* end: ../../desktop.blocks/tools/__add-to-lists/tools__add-to-lists.browser.js */
/* begin: ../../desktop.blocks/tools/__add-note/tools__add-note.browser.js */
/* global modules:false */

modules.define('tools__add-note', function(provide) {

provide();

});


/* end: ../../desktop.blocks/tools/__add-note/tools__add-note.browser.js */
/* begin: ../../desktop.blocks/tools/__input-for-note/tools__input-for-note.browser.js */
/* global modules:false */

modules.define('tools__input-for-note', function(provide) {

provide();

});


/* end: ../../desktop.blocks/tools/__input-for-note/tools__input-for-note.browser.js */
/* begin: ../../desktop.blocks/tools/__note-button/tools__note-button.browser.js */
/* global modules:false */

modules.define('tools__note-button', function(provide) {

provide();

});


/* end: ../../desktop.blocks/tools/__note-button/tools__note-button.browser.js */
/* begin: ../../desktop.blocks/tools/__note-status/tools__note-status.browser.js */
/* global modules:false */

modules.define('tools__note-status', function(provide) {

provide();

});


/* end: ../../desktop.blocks/tools/__note-status/tools__note-status.browser.js */
/* begin: ../../desktop.blocks/tools/__note/tools__note.browser.js */
/* global modules:false */

modules.define('tools__note', function(provide) {

provide();

});


/* end: ../../desktop.blocks/tools/__note/tools__note.browser.js */
/* begin: ../../desktop.blocks/retail-data/retail-data.browser.js */
/* global modules:false */

modules.define('retail-data', function(provide) {

provide();

});


/* end: ../../desktop.blocks/retail-data/retail-data.browser.js */
/* begin: ../../desktop.blocks/search_results/_without/search_results_without_map.browser.js */
/* global modules:false */  modules.define('titles__page-subtitle', function(provide) {  provide();  });

/* end: ../../desktop.blocks/search_results/_without/search_results_without_map.browser.js */
/* begin: ../../desktop.blocks/tools/__add-to-favorites/_added/tools__add-to-favorites_added_true.browser.js */
/* global modules:false */

modules.define('tools__add-to-favorites_added_true', function(provide) {

provide();

});


/* end: ../../desktop.blocks/tools/__add-to-favorites/_added/tools__add-to-favorites_added_true.browser.js */
/* begin: ../../desktop.blocks/tools/__add-to-lists/_added/tools__add-to-lists_added_true.browser.js */
/* global modules:false */

modules.define('tools__add-to-lists_added_true', function(provide) {

provide();

});


/* end: ../../desktop.blocks/tools/__add-to-lists/_added/tools__add-to-lists_added_true.browser.js */
/* begin: ../../desktop.blocks/tools/__add-note/_added/tools__add-note_added_true.browser.js */
/* global modules:false */

modules.define('tools__add-note_added_true', function(provide) {

provide();

});


/* end: ../../desktop.blocks/tools/__add-note/_added/tools__add-note_added_true.browser.js */