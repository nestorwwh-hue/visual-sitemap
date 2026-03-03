let i = 0;
let root;
let currentData = null;

function formatName(name) {
    if (!name) return "";
    return name
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const container = document.getElementById("tree-container");
const width = container.clientWidth;
const height = container.clientHeight;
const margin = { top: 20, right: 120, bottom: 20, left: 120 };

const zoom = d3.zoom()
    .interpolate(d3.interpolate) // Pure pan — no zoom-out/in arc
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

const svg = d3.select("#tree-container").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .call(zoom);

const g = svg.append("g");

// Set initial position
svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, margin.top + 40));

const tree = d3.tree().nodeSize([200, 120]);

async function generateSitemap(url) {
    const loader = document.getElementById("main-loader");
    const btn = document.getElementById("btn-generate");

    loader.style.display = "flex";
    btn.disabled = true;

    try {
        const response = await fetch('/api/crawl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const result = await response.json();
        console.log("Crawl Result:", result);

        if (!response.ok) throw new Error(result.error || 'Crawl failed');

        currentData = result;
        initTree(currentData);

        // Reset view after load
        document.getElementById("reset-view").click();

    } catch (err) {
        console.error("Sitemap error:", err);
        alert("Error: " + err.message + "\n\nNota: Algunos sitios bloquean robots. Prueba con superside.com si esto falla.");
    } finally {
        loader.style.display = "none";
        btn.disabled = false;
    }
}

function initTree(data) {
    // Clear existing visualization elements
    g.selectAll("*").remove();

    // Reset internal state
    i = 0;
    root = d3.hierarchy(data);
    root.x0 = 0;
    root.y0 = 0;

    // Helper to collapse nodes (initial state)
    function collapseNodes(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapseNodes);
            d.children = null;
        }
    }

    // Initialize with first level expanded
    if (root.children) {
        root.children.forEach(collapseNodes);
    }

    update(root);
    initSidebar();
}


function update(source) {
    if (!root) return;

    // Assign IDs to nodes before computing tree
    root.each(d => { if (!d.id) d.id = ++i; });

    const nodes = root.descendants();
    const links = root.links();

    // Compute the new tree layout.
    tree(root);

    const duration = 750;

    // --- Nodes Section ---
    const node = g.selectAll(".node")
        .data(nodes, d => d.id);

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node.enter().append("g")
        .attr("class", d => `node ${d.children || d._children ? "node--internal" : "node--leaf"}`)
        .attr("transform", d => `translate(${source.x0},${source.y0})`)
        .on("click", (event, d) => {
            // Bi-directional sync: Update sidebar selection
            const listId = `list-item-${d.id}`;
            const listItem = document.getElementById(listId);
            if (listItem) {
                // Expand all parents in the list
                let parentNode = listItem.parentElement;
                while (parentNode && parentNode.id !== 'page-list') {
                    if (parentNode.classList.contains('page-children')) {
                        parentNode.classList.remove('hidden');
                        const toggle = parentNode.previousElementSibling.querySelector('.page-toggle');
                        if (toggle) toggle.innerText = '−';
                    }
                    parentNode = parentNode.parentElement;
                }

                document.querySelectorAll(".page-item").forEach(i => i.classList.remove("active"));
                listItem.classList.add("active");
                listItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else if (d._children) {
                d.children = d._children;
                d._children = null;
            }
            update(d);

            // Sync the current item's toggle state based on its NEW tree state
            if (listItem) {
                const childrenContainer = listItem.nextElementSibling;
                if (childrenContainer && childrenContainer.classList.contains('page-children')) {
                    const toggleBtn = listItem.querySelector('.page-toggle');
                    if (d.children) {
                        childrenContainer.classList.remove('hidden');
                        if (toggleBtn) {
                            toggleBtn.innerText = '−';
                            toggleBtn.style.color = "var(--accent-primary)";
                        }
                    } else {
                        childrenContainer.classList.add('hidden');
                        if (toggleBtn) {
                            toggleBtn.innerText = '+';
                            toggleBtn.style.color = "var(--text-dim)";
                        }
                    }
                }
            }
            showDetails(d.data);
            if (window.lucide) lucide.createIcons();
        });

    nodeEnter.append("circle")
        .attr("class", "pulse-ring")
        .attr("r", 8);

    nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", d => d._children ? "#21BCFF" : "#fff");

    nodeEnter.append("text")
        .attr("dy", "2.5em")
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .text(d => formatName(d.data.name))
        .style("fill-opacity", 1e-6)
        .style("font-size", "10px")
        .style("pointer-events", "none")
        .each(function (d) {
            // Simple wrap logic: if name is too long, move it down a bit or use tspan
            const name = formatName(d.data.name);
            if (name.length > 20) {
                const words = name.split(' ');
                if (words.length > 1) {
                    d3.select(this).text(null);
                    d3.select(this).append("tspan").attr("x", 0).attr("dy", "2.2em").text(words.slice(0, Math.ceil(words.length / 2)).join(' '));
                    d3.select(this).append("tspan").attr("x", 0).attr("dy", "1.2em").text(words.slice(Math.ceil(words.length / 2)).join(' '));
                }
            }
        });

    // UPDATE
    const nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position
    nodeUpdate.transition().duration(duration)
        .attr("transform", d => `translate(${d.x},${d.y})`);

    // Toggle selected class for pulse animation
    nodeUpdate.classed("selected", d => !!d.data.isHighlighted);

    // Update the node attributes and style
    nodeUpdate.select("circle:not(.pulse-ring)")
        .attr("r", d => d.data.isHighlighted ? 12 : 8)
        .style("fill", d => d._children ? "#21BCFF" : (d.data.isHighlighted ? "#ffed4a" : "#fff"))
        .style("stroke", d => d.data.isHighlighted ? "#ffed4a" : "#21BCFF")
        .attr("cursor", "pointer");

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Remove any exiting nodes
    const nodeExit = node.exit().transition().duration(duration)
        .attr("transform", d => `translate(${source.x},${source.y})`)
        .remove();

    nodeExit.select("circle").attr("r", 1e-6);
    nodeExit.select("text").style("fill-opacity", 1e-6);

    // --- Links Section ---
    const link = g.selectAll(".link")
        .data(links, d => d.target.id);

    // Enter any new links at the parent's previous position.
    const linkEnter = link.enter().insert("path", "g")
        .attr("class", "link flow")
        .attr("d", d => {
            const o = { x: source.x0, y: source.y0 };
            return diagonal(o, o);
        });

    // UPDATE
    const linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition().duration(duration)
        .attr("class", "link flow")
        .attr("d", d => diagonal(d.source, d.target));

    // Remove any exiting links
    const linkExit = link.exit().transition().duration(duration)
        .attr("d", d => {
            const o = { x: source.x, y: source.y };
            return diagonal(o, o);
        })
        .remove();

    // Store the old positions for transition.
    nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });

    function diagonal(s, t) {
        return `M ${s.x} ${s.y} C ${s.x} ${(s.y + t.y) / 2}, ${t.x} ${(s.y + t.y) / 2}, ${t.x} ${t.y}`;
    }

    if (window.lucide) lucide.createIcons();
}

function showDetails(data) {
    const panel = document.getElementById("node-details");
    const depthBadge = document.getElementById("detail-depth");
    const title = document.getElementById("detail-title");

    const previewBlock = document.getElementById("detail-preview");
    const previewImg = document.getElementById("preview-img");
    const previewSpinner = document.getElementById("preview-spinner");
    const previewError = document.getElementById("preview-error");

    const urlContainer = document.getElementById("detail-url");
    const descriptionEl = document.getElementById("detail-description");
    const keywordsEl = document.getElementById("detail-keywords");

    title.innerText = data.name;
    depthBadge.innerText = `Level ${data.depth || 0}`;

    previewBlock.classList.add("hidden");
    previewImg.src = "";
    previewImg.style.display = "none";
    previewSpinner.classList.remove("hidden"); // Show spinner while loading
    previewError.classList.add("hidden");

    descriptionEl.classList.add("hidden");
    descriptionEl.innerText = "";

    keywordsEl.classList.add("hidden");
    keywordsEl.innerHTML = "";

    const urlA = urlContainer.querySelector("a");
    if (data.url) {
        urlContainer.classList.remove("hidden");
        urlA.href = data.url;

        // 1. Load Microlink Screenshot
        previewBlock.classList.remove("hidden");
        previewImg.onerror = () => {
            previewImg.style.display = "none";
            previewSpinner.classList.add("hidden");
            previewError.classList.remove("hidden");
        };
        previewImg.onload = () => {
            previewImg.style.display = "block";
            previewSpinner.classList.add("hidden");
            previewError.classList.add("hidden");
        };
        previewImg.src = `https://api.microlink.io/?url=${encodeURIComponent(data.url)}&screenshot=true&meta=false&embed=screenshot.url`;

        // 2. Load Extended Metadata
        fetch(`/api/meta?url=${encodeURIComponent(data.url)}`)
            .then(res => res.json())
            .then(meta => {
                if (meta.description) {
                    descriptionEl.innerText = meta.description;
                    descriptionEl.classList.remove("hidden");
                }
                if (meta.keywords) {
                    const kws = meta.keywords.split(',').map(k => k.trim()).filter(k => k);
                    if (kws.length > 0) {
                        keywordsEl.innerHTML = kws.map(k => `<span class="keyword-chip">${k}</span>`).join('');
                        keywordsEl.classList.remove("hidden");
                    }
                }
            })
            .catch(err => console.error("Failed to fetch meta", err));

    } else {
        urlContainer.classList.add("hidden");
    }

    panel.classList.remove("hidden");
}

document.getElementById("btn-generate").addEventListener("click", () => {
    const url = document.getElementById("site-url").value;
    if (url) generateSitemap(url);
});

document.getElementById("site-url").addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("btn-generate").click();
});

document.getElementById("reset-view").addEventListener("click", () => {
    d3.select("svg").transition().duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(width / 2, margin.top + 40).scale(1));
});

document.getElementById("expand-all").addEventListener("click", () => {
    if (!root) return;
    function expand(d) {
        if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        if (d.children) {
            d.children.forEach(expand);
        }
    }
    expand(root);
    update(root);

    // Sync Sidebar
    document.querySelectorAll('.page-children').forEach(c => c.classList.remove('hidden'));
    document.querySelectorAll('.page-toggle').forEach(t => {
        if (t.innerText === '+' || t.innerText === '−') {
            t.innerText = '−';
            t.style.color = "var(--accent-primary)";
        }
    });
});

document.getElementById("collapse-all").addEventListener("click", () => {
    if (!root) return;
    root.children.forEach(c => {
        function collapseAll(d) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapseAll);
                d.children = null;
            }
        }
        collapseAll(c);
    });
    update(root);

    // Sync Sidebar for level > 0
    document.querySelectorAll('.page-item:not(.level-0)').forEach(item => {
        const container = item.nextElementSibling;
        if (container && container.classList.contains('page-children')) {
            container.classList.add('hidden');
            const toggleBtn = item.querySelector('.page-toggle');
            if (toggleBtn && toggleBtn.innerText !== '•') {
                toggleBtn.innerText = '+';
                toggleBtn.style.color = "var(--text-dim)";
            }
        }
    });
});

function clearHighlight(d) {
    d.data.isHighlighted = false;
    if (d.children) d.children.forEach(clearHighlight);
    if (d._children) d._children.forEach(clearHighlight);
}

// Highlight a node visually without calling update() (avoids conflicting zoom transitions)
function highlightNode(targetD) {
    root.each(n => n.data.isHighlighted = false);
    targetD.data.isHighlighted = true;

    g.selectAll(".node")
        .classed("selected", n => n === targetD)
        .select("circle:not(.pulse-ring)")
        .attr("r", n => n === targetD ? 12 : 8)
        .style("fill", n => n._children ? "#21BCFF" : (n === targetD ? "#ffed4a" : "#fff"))
        .style("stroke", n => n === targetD ? "#ffed4a" : "#21BCFF");

    g.selectAll(".node text")
        .style("font-weight", n => n === targetD ? "bold" : "normal")
        .style("fill", n => n === targetD ? "#ffed4a" : "#fff");
}

// No initial load - wait for user input

function initSidebar() {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("toggle-sidebar");
    const pageList = document.getElementById("page-list");
    const sidebarSearch = document.getElementById("sidebar-search");

    if (!toggleBtn._hasListener) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
        });
        toggleBtn._hasListener = true;
    }

    function createListItem(d) {
        const wrapper = document.createElement("div");
        wrapper.className = "page-item-container";

        const item = document.createElement("div");
        item.className = `page-item level-${d.depth}`;
        item.id = `list-item-${d.id}`;

        const toggle = document.createElement("span");
        toggle.className = "page-toggle";
        const hasChildren = d.children || d._children;
        toggle.innerText = hasChildren ? (d.children ? "−" : "+") : "•";

        const label = document.createElement("span");
        label.className = "page-label";
        label.innerText = formatName(d.data.name);

        item.appendChild(toggle);
        item.appendChild(label);
        wrapper.appendChild(item);

        let childrenContainer = null;
        if (hasChildren) {
            childrenContainer = document.createElement("div");
            childrenContainer.className = "page-children";
            if (!d.children) childrenContainer.classList.add("hidden");

            const children = d.children || d._children;
            children.forEach(child => {
                childrenContainer.appendChild(createListItem(child));
            });
            wrapper.appendChild(childrenContainer);

            toggle.addEventListener("click", (e) => {
                e.stopPropagation();

                // Toggle tree node to match
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else if (d._children) {
                    d.children = d._children;
                    d._children = null;
                }
                update(d);

                const isCollapsed = !d.children;
                if (isCollapsed) {
                    childrenContainer.classList.add("hidden");
                } else {
                    childrenContainer.classList.remove("hidden");
                }
                toggle.innerText = isCollapsed ? "+" : "−";
                toggle.style.color = isCollapsed ? "var(--text-dim)" : "var(--accent-primary)";
            });
        }

        item.addEventListener("click", () => {
            // Pan to map node - preserve current zoom level, only change translation
            const currWidth = container.clientWidth;
            const currHeight = container.clientHeight;
            const currentTransform = d3.zoomTransform(svg.node());
            const scale = currentTransform.k; // Keep whatever zoom the user is at
            const transform = d3.zoomIdentity
                .translate(currWidth / 2 - d.x * scale, currHeight / 2 - d.y * scale)
                .scale(scale);

            d3.select("svg").transition().duration(750)
                .call(zoom.transform, transform);

            // Expand in map if collapsed
            if (d._children) {
                d.children = d._children;
                d._children = null;
                update(d);

                // Also expand in list automatically if clicking text
                if (childrenContainer) {
                    childrenContainer.classList.remove('hidden');
                    toggle.innerText = '−';
                    toggle.style.color = "var(--accent-primary)";
                }
            } else {
                highlightNode(d);
            }

            document.querySelectorAll(".page-item").forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            showDetails(d.data);
        });

        return wrapper;
    }

    function populateList(query = "") {
        pageList.innerHTML = "";
        if (!root) return;
        pageList.appendChild(createListItem(root));

        if (query) {
            const items = pageList.querySelectorAll(".page-item");
            items.forEach(it => {
                const text = it.innerText.toLowerCase();
                const visible = text.includes(query.toLowerCase());
                it.style.display = visible ? "flex" : "none";
                if (visible) {
                    let p = it.parentElement.parentElement;
                    while (p && p.id !== 'page-list') {
                        if (p.classList.contains('page-children')) {
                            p.classList.remove('hidden');
                            p.style.display = "flex";
                            const toggle = p.previousElementSibling.querySelector('.page-toggle');
                            if (toggle) toggle.innerText = "−";
                            p.previousElementSibling.style.display = "flex";
                        }
                        p = p.parentElement;
                    }
                }
            });
        }
    }

    sidebarSearch.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        populateList(query);

        if (!query) {
            clearHighlight(root);
            update(root);
            return;
        }

        // Highlight nodes
        root.each(d => {
            d.data.isHighlighted = d.data.name.toLowerCase().includes(query);
            if (d.data.isHighlighted) {
                let p = d;
                while (p.parent) {
                    if (p.parent._children) { p.parent.children = p.parent._children; p.parent._children = null; }
                    p = p.parent;
                }
            }
        });

        update(root);
    });
    populateList();
}
