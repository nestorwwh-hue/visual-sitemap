// Check if D3 is loaded
if (typeof d3 === 'undefined') {
    console.error("D3.js not loaded. Please ensure you have an internet connection or use a local server.");
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById("tree-container");
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items:center; justify-content:center; height:100%; color: #94a3b8; font-family: sans-serif; gap: 1rem; text-align: center; padding: 2rem;">
                <p style="font-size: 1.2rem; color: #f8fafc;">⚠️ Error de Carga</p>
                <p>No se pudo cargar la librería de visualización (D3.js).</p>
                <p style="font-size: 0.8rem; opacity: 0.7;">Asegúrate de tener conexión a internet o abre el archivo usando un servidor local (ej. Live Server).</p>
            </div>
        `;
    });
}

function formatName(name) {
    if (!name) return "";
    return name
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const siteData = {
    name: "Superside",
    url: "https://www.superside.com/",
    children: [
        {
            name: "Services",
            url: "https://www.superside.com/design-services",
            children: [
                {
                    name: "Creative Design",
                    children: [
                        { name: "Ad Creative", url: "https://www.superside.com/ad-creative" },
                        { name: "Social Media", url: "https://www.superside.com/social-media-creative" },
                        { name: "Presentations", url: "https://www.superside.com/presentation-design" },
                        { name: "Illustrations", url: "https://www.superside.com/illustration-design-services" },
                        { name: "Branding", url: "https://www.superside.com/branding-services" },
                        { name: "eBooks & Reports", url: "https://www.superside.com/ebook-digital-report-design" },
                        { name: "Concept Creation", url: "https://www.superside.com/concept-creation" },
                        { name: "Print Design", url: "https://www.superside.com/print-design" },
                        { name: "Packaging & Merch", url: "https://www.superside.com/packaging-merchandise-design" }
                    ]
                },
                {
                    name: "Specialized Production",
                    children: [
                        { name: "Video Production", url: "https://www.superside.com/video-production" },
                        { name: "Motion Design", url: "https://www.superside.com/motion-design" },
                        { name: "Immersive Design", url: "https://www.superside.com/immersive-design-services" },
                        { name: "Email Creation", url: "https://www.superside.com/email-design-services" },
                        { name: "Web Design", url: "https://www.superside.com/web-design-services" },
                        { name: "Design Systems", url: "https://www.superside.com/design-systems" },
                        { name: "Product Design", url: "https://www.superside.com/product-design" },
                        { name: "Copywriting", url: "https://www.superside.com/copywriting" }
                    ]
                },
                {
                    name: "AI Services",
                    children: [
                        { name: "AI-Powered Creative", url: "https://www.superside.com/ai-creative" },
                        { name: "AI Consulting", url: "https://www.superside.com/consulting/about" },
                        { name: "Automation", url: "https://www.superside.com/service-automation" }
                    ]
                },
                {
                    name: "Marketing Services",
                    children: [
                        { name: "Marketing Strategy", url: "https://www.superside.com/marketing-strategy" },
                        { name: "Campaign Strategy", url: "https://www.superside.com/campaign-strategy-services" }
                    ]
                }
            ]
        },
        {
            name: "Resources",
            url: "https://www.superside.com/learn",
            children: [
                { name: "Learning Center", url: "https://www.superside.com/learn" },
                { name: "Events & Summits", url: "https://www.superside.com/events" },
                { name: "Guides", url: "https://www.superside.com/guides" },
                { name: "Reports", url: "https://www.superside.com/reports" },
                { name: "Video Library", url: "https://www.superside.com/videos" },
                { name: "Playbooks", url: "https://www.superside.com/playbooks" },
                { name: "Blog", url: "https://www.superside.com/blog" }
            ]
        },
        {
            name: "Why Us",
            children: [
                { name: "Creative Talent", url: "https://www.superside.com/our-creative-talent" },
                { name: "AI Excellence", url: "https://www.superside.com/ai-excellence" },
                { name: "Our Technology", url: "https://www.superside.com/our-technology" }
            ]
        },
        { name: "Our Work", url: "https://www.superside.com/our-work" },
        { name: "Pricing", url: "https://www.superside.com/pricing" },
        { name: "Enterprise", url: "https://www.superside.com/enterprise" },
        {
            name: "Company",
            children: [
                { name: "About Us", url: "https://www.superside.com/about-us" },
                { name: "Trust Center", url: "https://www.superside.com/trust-center" },
                { name: "Careers", url: "https://careers.superside.com/" },
                { name: "Compare", url: "https://www.superside.com/compare" }
            ]
        },
        {
            name: "Legal",
            children: [
                { name: "Privacy Policy", url: "https://www.superside.com/privacy" },
                { name: "Terms of Use", url: "https://www.superside.com/terms-of-use" },
                { name: "DMCA", url: "https://www.superside.com/terms-of-use#DMCA" }
            ]
        }
    ]
};

// D3 Tree Implementation
// Tree state
let i = 0;
let root;

// D3 Tree Implementation
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

// Initial position
svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, margin.top + 40));

const tree = d3.tree().nodeSize([180, 100]); // Swapped: width between nodes, depth between levels

const iconMap = {
    "Services": "briefcase",
    "Resources": "book-open",
    "Why Us": "users",
    "Our Work": "layout",
    "Pricing": "credit-card",
    "Enterprise": "building-2",
    "Company": "info",
    "Legal": "shield-check",
    "Creative Design": "palette",
    "Specialized Production": "video",
    "AI Services": "cpu",
    "Marketing Services": "megaphone",
    "Blog": "pen-tool"
};

function initTree() {
    try {
        root = d3.hierarchy(siteData);
        root.x0 = 0;
        root.y0 = 0;

        // Initialize Lucide icons
        if (window.lucide) lucide.createIcons();

        // Collapse helpers
        function collapse(d) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        }

        // Initial state: collapse all except first level
        if (root.children) {
            root.children.forEach(collapse);
        }

        update(root);
        initSearch();
        initSidebar();
        console.log("Tree initialized successfully");
    } catch (err) {
        console.error("Failed to initialize tree:", err);
        alert("Error al cargar el sitemap: " + err.message);
    }
}

function update(source) {
    const nodes = root.descendants();
    const links = root.links();

    tree(root);

    const duration = 750;

    // Nodes
    const node = g.selectAll(".node")
        .data(nodes, d => d.id || (d.id = ++i));

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
            } else {
                if (d._children) {
                    d.children = d._children;
                    d._children = null;
                }
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
        });

    nodeEnter.append("circle")
        .attr("class", "pulse-ring")
        .attr("r", 8);

    nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", d => d._children ? "#21BCFF" : "#fff");

    // Add Icon Background
    nodeEnter.append("foreignObject")
        .attr("width", 20)
        .attr("height", 20)
        .attr("x", -10)
        .attr("y", -10)
        .append("xhtml:div")
        .attr("class", "node-icon-container")
        .html(d => {
            const iconName = iconMap[d.data.name] || (d.height === 0 ? "file-text" : "folder");
            return `<i data-lucide="${iconName}" style="width:12px; height:12px;"></i>`;
        });

    nodeEnter.append("text")
        .attr("dy", "2.5em")
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .text(d => formatName(d.data.name))
        .style("fill-opacity", 1e-6)
        .style("pointer-events", "none")
        .each(function (d) {
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

    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.transition().duration(duration)
        .attr("transform", d => `translate(${d.x},${d.y})`);

    // Toggle selected class for pulse animation
    nodeUpdate.classed("selected", d => !!d.data.isHighlighted);

    nodeUpdate.select("circle:not(.pulse-ring)")
        .attr("r", d => d.data.isHighlighted ? 12 : 8)
        .style("fill", d => d._children ? "#21BCFF" : (d.data.isHighlighted ? "#ffed4a" : "#fff"))
        .style("stroke", d => d.data.isHighlighted ? "#ffed4a" : "#21BCFF");

    nodeUpdate.select("text")
        .style("fill-opacity", 1)
        .style("font-weight", d => d.data.isHighlighted ? "bold" : "normal")
        .style("fill", d => d.data.isHighlighted ? "#ffed4a" : "#fff");

    const nodeExit = node.exit().transition().duration(duration)
        .attr("transform", d => `translate(${source.x},${source.y})`)
        .remove();

    nodeExit.select("circle").attr("r", 1e-6);
    nodeExit.select("text").style("fill-opacity", 1e-6);

    // After node update, create icons
    if (window.lucide) lucide.createIcons();

    // Links
    const link = g.selectAll(".link")
        .data(links, d => d.target.id);

    const linkEnter = link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", d => {
            const o = { x: source.x0, y: source.y0 };
            return diagonal(o, o);
        });

    const linkUpdate = linkEnter.merge(link);

    linkUpdate.transition().duration(duration)
        .attr("class", d => `link ${d.target.data.isHighlighted ? 'highlighted' : 'flow'}`)
        .attr("d", d => diagonal(d.source, d.target));

    const linkExit = link.exit().transition().duration(duration)
        .attr("d", d => {
            const o = { x: source.x, y: source.y };
            return diagonal(o, o);
        })
        .remove();

    nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });

    // Vertical diagonal
    function diagonal(s, t) {
        return `M ${s.x} ${s.y}
                C ${s.x} ${(s.y + t.y) / 2},
                  ${t.x} ${(s.y + t.y) / 2},
                  ${t.x} ${t.y}`;
    }
}

// (node search logic moved to sidebar search)

function clearHighlight(d) {
    d.data.isHighlighted = false;
    if (d.children) d.children.forEach(clearHighlight);
    if (d._children) d._children.forEach(clearHighlight);
}

// Highlight a node visually without calling update() (avoids conflicting with zoom transition)
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

    // Basic Info
    title.innerText = data.name;
    depthBadge.innerText = `Level ${data.depth || 0}`;

    // Reset Dynamic Fields
    previewBlock.classList.add("hidden");
    previewImg.src = "";
    previewImg.style.display = "none";
    previewSpinner.classList.remove("hidden"); // Show spinner while loading
    previewError.classList.add("hidden");

    descriptionEl.classList.add("hidden");
    descriptionEl.innerText = "";

    keywordsEl.classList.add("hidden");
    keywordsEl.innerHTML = "";

    if (data.url) {
        urlContainer.classList.remove("hidden");
        urlContainer.querySelector("a").href = data.url;

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

        // 2. Load Extended SEO Metadata Async
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

function initSidebar() {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("toggle-sidebar");
    const pageList = document.getElementById("page-list");
    const sidebarSearch = document.getElementById("sidebar-search");

    toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
    });

    function createListItem(d) {
        const wrapper = document.createElement("div");
        wrapper.className = "page-item-container";

        const item = document.createElement("div");
        item.className = `page-item level-${d.depth}`;
        item.id = `list-item-${d.id}`;

        // Toggle Icon (+/- or •)
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

            // Active state in list
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

        // Search and highlight nodes
        root.each(d => {
            d.data.isHighlighted = d.data.name.toLowerCase().includes(query);
            if (d.data.isHighlighted) {
                let p = d;
                while (p.parent) {
                    if (p.parent._children) {
                        p.parent.children = p.parent._children;
                        p.parent._children = null;
                    }
                    p = p.parent;
                }
            }
        });

        root.each(d => {
            if (d.data.isHighlighted) {
                let p = d;
                while (p.parent) {
                    p.parent.data.isHighlighted = true;
                    p = p.parent;
                }
            }
        });

        update(root);
    });
    populateList();
    document.getElementById("reset-view").addEventListener("click", () => {
        d3.select("svg").transition().duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(width / 2, margin.top + 40).scale(1));
    });

    document.getElementById("expand-all").addEventListener("click", () => {
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

}

document.getElementById("close-details").addEventListener("click", () => {
    document.getElementById("node-details").classList.add("hidden");
});

// Start initialization
initTree();


// Responsive handling
window.addEventListener("resize", () => {
    // Basic fix: reload tree or adjust svg size
});
