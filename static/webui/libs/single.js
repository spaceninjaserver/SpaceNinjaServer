(function () {
    let head_include = document.body == null,
        style = document.createElement("style");
    style.textContent = `[data-route]:not(.route-visible){display:none}`;
    document.head.appendChild(style);

    class EventEmitter {
        constructor() {
            this.event_handlers = {};
        }

        on(event_name, func) {
            if (typeof func != "function") {
                throw "Event handler has to be a function.";
            }
            this.event_handlers[event_name] = func;
            return this;
        }

        off(event_name) {
            delete this.event_handlers[event_name];
            return this;
        }

        fire(event_name, args) {
            if (event_name in this.event_handlers) {
                this.event_handlers[event_name].call(this, args);
            }
            return this;
        }
    }

    class Route extends EventEmitter {
        constructor(overlay, elm, paths) {
            super();
            this.overlay = overlay;
            this.elm = elm;
            this.paths = paths;
            this.title = undefined;
            if (elm.hasAttribute("data-title")) {
                this.title = this.elm.getAttribute("data-title");
                this.elm.removeAttribute("data-title");
            } else if (document.querySelector("title") != null) {
                this.title = document.querySelector("title").textContent;
            } else {
                this.title = this.paths[0];
            }
        }

        get element() {
            return this.elm;
        }

        isCurrent() {
            return this.elm.classList.contains("route-current");
        }

        isVisible() {
            return this.elm.classList.contains("route-visible");
        }
    }

    class MultiRoute extends Route {
        constructor(overlay, elm, paths_data) {
            if (overlay) {
                paths_data = paths_data.substr(9);
            }
            let paths = [];
            paths_data.split(",").forEach(name => {
                paths.push(name.trim());
            });
            super(overlay, elm, paths);
        }

        getCanonicalPath() {
            if (this.paths[0].substr(0, 1) == "/") {
                return this.paths[0];
            }
            if (this.paths.length > 1) {
                return this.paths[1];
            }
            return "/" + this.paths[0];
        }
    }

    class StandardRoute extends MultiRoute {
        constructor(overlay, elm, paths) {
            super(overlay, elm, elm.getAttribute("data-route"));
        }
    }

    class RegexRoute extends Route {
        constructor(overlay, elm) {
            let regexp = elm.getAttribute("data-route").substr(2);
            if (overlay) {
                regexp = regexp.substr(9);
            }
            super(overlay, elm, [regexp]);
            this.regex = new RegExp(regexp);
        }

        getArgs(path) {
            if (path === undefined) {
                path = single.getCurrentPath();
            }
            let res = this.regex.exec(path);
            if (res && res.length > 0) {
                return res;
            }
            return false;
        }
    }

    class SingleApp extends EventEmitter {
        constructor() {
            super();
            this.routes = [];
            this.routes_populated = false;
            if (!head_include) {
                this.populateRoutes();
            }
            window.onpopstate = event => {
                event.preventDefault();
                single.loadRoute();
            };
            this.timeouts = [];
            this.intervals = [];
        }

        populateRoutes() {
            if (this.routes_populated) {
                return;
            }
            document.body.querySelectorAll("[data-route]").forEach(elm => {
                let data = elm.getAttribute("data-route"),
                    overlay = false;
                if (data.substr(0, 9) == "overlay: ") {
                    data = data.substr(9);
                    overlay = true;
                }
                if (data.substr(0, 2) == "~ ") {
                    this.routes.push(new RegexRoute(overlay, elm));
                } else {
                    this.routes.push(new StandardRoute(overlay, elm));
                }
            });
            if (this.routes.length == 0) {
                console.error("[single.js] You need to define at least one route");
            }
            this.routes.forEach(route => {
                route.paths.forEach(path => {
                    for (let i = 0; i < this.routes; i++) {
                        if (this.routes[i] !== route && this.routes[i].paths.indexOf(path) > -1) {
                            console.error("[single.js] Duplicate path: " + path);
                        }
                    }
                });
            });
            document.body.addEventListener("click", event => {
                let elm = event.target;
                while (elm && !(elm instanceof HTMLAnchorElement)) {
                    elm = elm.parentNode;
                }
                if (
                    elm instanceof HTMLAnchorElement &&
                    !elm.hasAttribute("target") &&
                    elm.hasAttribute("href") &&
                    elm.getAttribute("href").substr(0, 1) == "/"
                ) {
                    event.preventDefault();
                    single.loadRoute(new URL(elm.href));
                }
            });
            this.routes_populated = true;
        }

        getRoute(route) {
            this.populateRoutes();
            let is_elm = route instanceof HTMLElement;
            if (is_elm) {
                if (!route.hasAttribute("data-route")) {
                    throw "Invalid route element: " + route;
                }
                route = route.getAttribute("data-route");
                if (route.substr(0, 9) == "overlay: ") {
                    route = route.substr(9);
                }
                if (route.substr(0, 2) == "~ ") {
                    route = route.substr(2);
                } else {
                    route = route.split(",")[0];
                }
            } else {
                if (route.substr(0, 9) == "overlay: ") {
                    route = route.substr(9);
                }
                if (route.substr(0, 2) == "~ ") {
                    route = route.substr(2);
                }
            }
            for (let i = 0; i < this.routes.length; i++) {
                if (this.routes[i].paths.indexOf(route) > -1) {
                    return this.routes[i];
                }
            }
            if (!is_elm) {
                return this.getRoutes(route)[0];
            }
        }

        getRoutes(route) {
            let routes = [];
            try {
                document.querySelectorAll(route).forEach(elm => {
                    try {
                        let route = this.getRoute(elm);
                        if (route) {
                            routes.push(route);
                        }
                    } catch (ignored) {}
                });
            } catch (ignored) {}
            return routes;
        }

        loadRoute(path) {
            this.populateRoutes();
            this.timeouts.forEach(clearTimeout);
            this.intervals.forEach(clearInterval);
            if (path === undefined) {
                path = new URL(location.href);
            } else if (typeof path == "string" && path.substr(0, 1) == "/") {
                path = new URL(location.protocol + location.hostname + path);
            }
            let route,
                args = false,
                urlextra = "";
            if (path instanceof URL) {
                urlextra = path.search + path.hash;
                path = decodeURIComponent(path.pathname);
            }
            for (let i = 0; i < this.routes.length; i++) {
                if (this.routes[i] instanceof RegexRoute) {
                    args = this.routes[i].getArgs(path);
                    if (args !== false) {
                        route = this.routes[i];
                        break;
                    }
                } else if (this.routes[i].paths.indexOf(path) > -1) {
                    route = this.routes[i];
                    break;
                }
            }
            if (route === undefined) {
                route = this.getRoute("404");
                if (route === null) {
                    route = this.routes[0];
                    path = route.getCanonicalPath();
                }
            }
            if (path.substr(0, 1) != "/") {
                path = route.getCanonicalPath();
            }
            if (args === false) {
                args = [path];
            }
            route.fire("beforeload", args);
            this.fire("route_beforeload", {
                route: route,
                args: args
            });
            this.routes.forEach(r => {
                if (r !== route) {
                    r.elm.classList.remove("route-current");
                    if (!route.overlay || r.overlay) {
                        r.elm.classList.remove("route-visible");
                    }
                }
            });
            route.elm.classList.add("route-current", "route-visible");
            path += urlextra;
            if (this.getCurrentPath() != path) {
                history.pushState({}, route.title, path);
            }
            document.querySelector("title").textContent = route.title;
            this.fire("route_load", {
                route: route,
                args: args
            });
            route.fire("load", args);
        }

        getCurrentRoute() {
            return this.getRoute(".route-current");
        }

        getCurrentPath() {
            return location.pathname + location.search + location.hash;
        }

        setTimeout(f, i) {
            this.timeouts.push(window.setTimeout(f, i));
        }

        setInterval(f, i) {
            this.intervals.push(window.setInterval(f, i));
        }
    }

    console.assert(!("single" in window));
    window.single = new SingleApp();
    if (["interactive", "complete"].indexOf(document.readyState) > -1) {
        window.single.loadRoute();
    } else {
        document.addEventListener("DOMContentLoaded", () => window.single.loadRoute());
    }
})();
